// ============================================
// TENANT SERVICE - Lógica de Tenant
// Checkflowing SaaS
// ============================================

import { supabase } from './supabaseClient';

/**
 * Obter tenant a partir do slug (subdomínio)
 */
export const getTenantBySlug = async (slug) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('ativo', true)
      .single();

    if (error) {
      console.error('[TenantService] Erro ao buscar tenant por slug:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[TenantService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Obter tenant por ID
 */
export const getTenantById = async (tenantId) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('[TenantService] Erro ao buscar tenant por ID:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[TenantService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Obter configurações de branding do tenant
 */
export const getTenantConfig = async (tenantId) => {
  try {
    const { data, error } = await supabase
      .from('tenant_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('[TenantService] Erro ao buscar config:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[TenantService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Atualizar configurações de branding
 */
export const updateTenantConfig = async (tenantId, config) => {
  try {
    const { data, error } = await supabase
      .from('tenant_configs')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      console.error('[TenantService] Erro ao atualizar config:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[TenantService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Obter todas as informações do tenant (tenant + config)
 */
export const getFullTenantInfo = async (slugOrId) => {
  try {
    // Primeiro tenta buscar por slug
    let tenantResult;

    if (slugOrId.includes('-')) {
      // É um UUID
      tenantResult = await getTenantById(slugOrId);
    } else {
      // É um slug
      tenantResult = await getTenantBySlug(slugOrId);
    }

    if (!tenantResult.success) {
      return tenantResult;
    }

    // Buscar config
    const configResult = await getTenantConfig(tenantResult.data.id);

    return {
      success: true,
      data: {
        ...tenantResult.data,
        config: configResult.success ? configResult.data : null
      }
    };
  } catch (err) {
    console.error('[TenantService] Erro ao buscar info completa:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Extrair slug do subdomain
 */
export const getSlugFromSubdomain = () => {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname;

  // admin.checkflowing.com → null (é o painel do super admin)
  if (hostname.startsWith('admin.')) {
    return null;
  }

  // localhost:5173 → 'teste' (para desenvolvimento)
  if (hostname.includes('localhost')) {
    return 'teste'; // Default para desenvolvimento
  }

  // mercedes.checkflowing.com → 'mercedes'
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    return parts[0];
  }

  return null;
};

/**
 * Verificar se é subdomain de admin
 */
export const isAdminSubdomain = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('admin.');
};

export default {
  getTenantBySlug,
  getTenantById,
  getTenantConfig,
  updateTenantConfig,
  getFullTenantInfo,
  getSlugFromSubdomain,
  isAdminSubdomain
};
