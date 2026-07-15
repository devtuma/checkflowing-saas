// ============================================
// AUTH SERVICE - Lógica de Autenticação
// Checkflowing SaaS
// ============================================

import { supabase } from './supabaseClient';

/**
 * Login com email e senha
 */
export const login = async (email, senha) => {
  try {
    // 1. Buscar usuário pelo email
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select(`
        *,
        tenants (
          id,
          nome,
          slug,
          plano,
          ativo
        )
      `)
      .eq('email', email.toLowerCase().trim())
      .eq('ativo', true)
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        return { success: false, error: 'Usuário não encontrado ou inativo' };
      }
      console.error('[AuthService] Erro ao buscar usuário:', userError);
      return { success: false, error: userError.message };
    }

    // 2. Verificar senha (hash SHA256)
    const senhaHash = await hashSenha(senha);
    const senhaValida = usuario.senha_hash === senhaHash;

    if (!senhaValida) {
      return { success: false, error: 'Senha incorreta' };
    }

    // 3. Verificar se tenant está ativo
    if (!usuario.tenants?.ativo) {
      return { success: false, error: 'Empresa inativa. Contate o suporte.' };
    }

    // 4. Atualizar último login
    await supabase
      .from('usuarios')
      .update({ ultimo_login: new Date().toISOString() })
      .eq('id', usuario.id);

    // 5. Gerar sessão simulada (em produção, use Supabase Auth)
    const sessao = {
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.role,
        re: usuario.re,
        turno: usuario.turno,
        tenant_id: usuario.tenant_id,
        primeiro_acesso: usuario.primeiro_acesso
      },
      tenant: usuario.tenants,
      token: btoa(JSON.stringify({ id: usuario.id, exp: Date.now() + 86400000 }))
    };

    // 6. Salvar no localStorage
    localStorage.setItem('checkflowing_session', JSON.stringify(sessao));

    return { success: true, data: sessao };
  } catch (err) {
    console.error('[AuthService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    localStorage.removeItem('checkflowing_session');
    return { success: true };
  } catch (err) {
    console.error('[AuthService] Erro no logout:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Obter sessão atual
 */
export const getSession = () => {
  try {
    const sessionStr = localStorage.getItem('checkflowing_session');
    if (!sessionStr) return { success: false, error: 'Sem sessão' };

    const session = JSON.parse(sessionStr);

    // Verificar expiração
    if (session.token) {
      const decoded = JSON.parse(atob(session.token));
      if (decoded.exp < Date.now()) {
        localStorage.removeItem('checkflowing_session');
        return { success: false, error: 'Sessão expirada' };
      }
    }

    return { success: true, data: session };
  } catch (err) {
    console.error('[AuthService] Erro ao obter sessão:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Verificar se usuário está autenticado
 */
export const isAuthenticated = () => {
  const session = getSession();
  return session.success;
};

/**
 * Verificar se usuário é admin
 */
export const isAdmin = () => {
  const session = getSession();
  if (!session.success) return false;
  return session.data.usuario?.role === 'admin';
};

/**
 * Verificar se é primeiro acesso
 */
export const isPrimeiroAcesso = () => {
  const session = getSession();
  if (!session.success) return true;
  return session.data.usuario?.primeiro_acesso === true;
};

/**
 * Atualizar dados do usuário na sessão
 */
export const updateSession = (updates) => {
  try {
    const session = getSession();
    if (!session.success) return { success: false, error: 'Sem sessão' };

    const newSession = {
      ...session.data,
      usuario: {
        ...session.data.usuario,
        ...updates
      }
    };

    localStorage.setItem('checkflowing_session', JSON.stringify(newSession));
    return { success: true, data: newSession };
  } catch (err) {
    console.error('[AuthService] Erro ao atualizar sessão:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Alterar senha (simulado - em produção use Supabase Auth)
 */
export const alterarSenha = async (senhaAtual, novaSenha) => {
  try {
    const session = getSession();
    if (!session.success) return { success: false, error: 'Não autenticado' };

    // Verificar senha atual
    if (session.data.usuario.senha_hash !== senhaAtual) {
      return { success: false, error: 'Senha atual incorreta' };
    }

    // Atualizar no banco
    const { error } = await supabase
      .from('usuarios')
      .update({
        senha_hash: novaSenha,
        primeiro_acesso: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.data.usuario.id);

    if (error) {
      console.error('[AuthService] Erro ao alterar senha:', error);
      return { success: false, error: error.message };
    }

    // Atualizar sessão
    updateSession({ senha_hash: novaSenha, primeiro_acesso: false });

    return { success: true };
  } catch (err) {
    console.error('[AuthService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Criar hash de senha (para uso futuro)
 */
export const hashSenha = async (senha) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export default {
  login,
  logout,
  getSession,
  isAuthenticated,
  isAdmin,
  isPrimeiroAcesso,
  updateSession,
  alterarSenha,
  hashSenha
};
