// ============================================
// useAuth - Hook de Autenticação
// Checkflowing SaaS
// ============================================

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import authService from '../lib/authService';
import tenantService from '../lib/tenantService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar sessão ao iniciar
  useEffect(() => {
    const carregarSessao = async () => {
      try {
        const session = authService.getSession();

        if (session.success) {
          setUsuario(session.data.usuario);
          setTenant(session.data.tenant);

          // Buscar tenant completo
          const tenantInfo = await tenantService.getFullTenantInfo(
            session.data.usuario.tenant_id
          );

          if (tenantInfo.success) {
            setTenant(tenantInfo.data);
          }
        }
      } catch (err) {
        console.error('[useAuth] Erro ao carregar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarSessao();
  }, []);

  // Login
  const login = useCallback(async (email, senha) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login(email, senha);

      if (!result.success) {
        setError(result.error);
        return result;
      }

      setUsuario(result.data.usuario);
      setTenant(result.data.tenant);

      // Buscar tenant completo com config
      const tenantInfo = await tenantService.getFullTenantInfo(
        result.data.usuario.tenant_id
      );

      if (tenantInfo.success) {
        setTenant(tenantInfo.data);
      }

      return result;
    } catch (err) {
      const errorMsg = err.message || 'Erro ao fazer login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await authService.logout();
    setUsuario(null);
    setTenant(null);
    setError(null);
  }, []);

  // Atualizar sessão
  const updateSession = useCallback((updates) => {
    const result = authService.updateSession(updates);
    if (result.success) {
      setUsuario(result.data.usuario);
    }
    return result;
  }, []);

  // Verificar permissões
  const pode = useCallback((permissao) => {
    if (!usuario) return false;

    const permissoesPorRole = {
      admin: [
        'gerenciar_operadores',
        'gerenciar_atividades',
        'ver_relatorios',
        'gerenciar_categorias',
        'ver_kpis',
        'ver_equipe',
        'configuracoes'
      ],
      operador: [
        'executar_checklist',
        'ver_proprias_execucoes'
      ]
    };

    // Admin tem acesso a tudo do tenant
    if (usuario.role === 'admin') return true;

    return permissoesPorRole[usuario.role]?.includes(permissao) || false;
  }, [usuario]);

  // Verificar se é admin
  const isAdmin = usuario?.role === 'admin';

  // Verificar se é primeiro acesso
  const isPrimeiroAcesso = usuario?.primeiro_acesso === true;

  const value = {
    usuario,
    tenant,
    loading,
    error,
    login,
    logout,
    updateSession,
    pode,
    isAdmin,
    isPrimeiroAcesso,
    isAuthenticated: !!usuario
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

export default useAuth;
