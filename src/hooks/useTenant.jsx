// ============================================
// useTenant - Hook de Contexto de Tenant
// Checkflowing SaaS
// ============================================

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import tenantService from '../lib/tenantService';
import { useAuth } from './useAuth.jsx';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const { usuario, tenant: authTenant } = useAuth();
  const [tenant, setTenant] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados do tenant quando usuário logar
  useEffect(() => {
    const carregarTenant = async () => {
      if (!authTenant && !usuario?.tenant_id) {
        setLoading(false);
        return;
      }

      try {
        const tenantId = authTenant?.id || usuario?.tenant_id;
        const slugOrId = authTenant?.slug || tenantId;

        const result = await tenantService.getFullTenantInfo(slugOrId);

        if (result.success) {
          setTenant(result.data);
          setConfig(result.data.config);
        }
      } catch (err) {
        console.error('[useTenant] Erro ao carregar tenant:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarTenant();
  }, [authTenant, usuario?.tenant_id]);

  // Atualizar configuração de branding
  const updateBranding = useCallback(async (updates) => {
    if (!tenant?.id) return { success: false, error: 'Tenant não carregado' };

    try {
      const result = await tenantService.updateTenantConfig(tenant.id, updates);

      if (result.success) {
        setConfig(result.data);
      }

      return result;
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [tenant?.id]);

  // Obter slug do subdomain
  const slug = tenantService.getSlugFromSubdomain();

  // Verificar se é subdomain de admin
  const isAdminPortal = tenantService.isAdminSubdomain();

  // Cores do tema
  const cores = {
    primary: config?.cor_primary || '#2563eb',
    secondary: config?.cor_secondary || '#64748b',
    accent: config?.cor_accent || '#f59e0b',
    danger: config?.cor_danger || '#ef4444',
    success: config?.cor_success || '#22c55e',
    background: config?.cor_background || '#ffffff',
    card: config?.cor_card || '#f8fafc'
  };

  const value = {
    tenant,
    config,
    slug,
    isAdminPortal,
    loading,
    updateBranding,
    cores,
    logoUrl: config?.logo_url,
    nomeFantasia: config?.nome_fantasia || tenant?.nome || 'Checkflowing',
    permissoes: tenant?.permissoes || {}
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de TenantProvider');
  }
  return context;
};

export default useTenant;
