// ============================================
// TRIAL SERVICE - Controle de Trial
// Checkflowing SaaS
// ============================================

import { supabase } from './supabaseClient';

/**
 * Obter status do trial para um tenant
 */
export const getTrialStatus = async (tenantId) => {
  try {
    const { data, error } = await supabase
      .from('trial_tracking')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('[TrialService] Erro ao buscar trial:', error);
      return { success: false, error: error.message };
    }

    // Calcular status
    const restante = data.limite_atividades - data.atividades_concluidas;
    const isExpired = data.is_expired || restante <= 0;

    return {
      success: true,
      data: {
        ...data,
        restante,
        isExpired,
        percentualUsado: ((data.atividades_concluidas / data.limite_atividades) * 100).toFixed(1),
        // Mostrar warning quando restam 5 ou menos
        showWarning: restante <= 5 && restante > 0 && !isExpired
      }
    };
  } catch (err) {
    console.error('[TrialService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Incrementar contador de atividades concluídas
 */
export const incrementarAtividadeConcluida = async (tenantId) => {
  try {
    // Buscar status atual
    const statusResult = await getTrialStatus(tenantId);
    if (!statusResult.success) {
      return statusResult;
    }

    const status = statusResult.data;

    // Se já expirou, não incrementar
    if (status.isExpired) {
      return { success: true, data: status, blocked: true };
    }

    const novoTotal = status.atividades_concluidas + 1;
    const isExpired = novoTotal >= status.limite_atividades;

    // Atualizar no banco
    const { error } = await supabase
      .from('trial_tracking')
      .update({
        atividades_concluidas: novoTotal,
        is_expired: isExpired,
        trial_encerrado_em: isExpired ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('[TrialService] Erro ao incrementar:', error);
      return { success: false, error: error.message };
    }

    const novoStatus = {
      ...status,
      atividades_concluidas: novoTotal,
      restante: status.limite_atividades - novoTotal,
      isExpired,
      showWarning: (status.limite_atividades - novoTotal) <= 5 && !isExpired
    };

    return { success: true, data: novoStatus };
  } catch (err) {
    console.error('[TrialService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Verificar se tenant pode criar atividade
 */
export const podeCriarAtividade = async (tenantId) => {
  try {
    const statusResult = await getTrialStatus(tenantId);
    if (!statusResult.success) {
      // Se der erro, permite criar (fallback)
      return { success: true, data: { pode: true } };
    }

    return {
      success: true,
      data: {
        pode: !statusResult.data.isExpired,
        restante: statusResult.data.restante,
        showWarning: statusResult.data.showWarning,
        isExpired: statusResult.data.isExpired
      }
    };
  } catch (err) {
    console.error('[TrialService] Erro ao verificar:', err);
    return { success: true, data: { pode: true } };
  }
};

/**
 * Inicializar trial para novo tenant
 */
export const inicializarTrial = async (tenantId, limite = 30) => {
  try {
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('trial_tracking')
      .select('id')
      .eq('tenant_id', tenantId)
      .single();

    if (existing) {
      return { success: true, data: existing };
    }

    // Criar novo
    const { data, error } = await supabase
      .from('trial_tracking')
      .insert({
        tenant_id: tenantId,
        limite_atividades: limite,
        atividades_concluidas: 0,
        trial_iniciado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[TrialService] Erro ao inicializar trial:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[TrialService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Resetar trial (para testes/admin)
 */
export const resetarTrial = async (tenantId) => {
  try {
    const { error } = await supabase
      .from('trial_tracking')
      .update({
        atividades_concluidas: 0,
        is_expired: false,
        trial_encerrado_em: null,
        trial_iniciado_em: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('[TrialService] Erro ao resetar:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[TrialService] Erro inesperado:', err);
    return { success: false, error: err.message };
  }
};

export default {
  getTrialStatus,
  incrementarAtividadeConcluida,
  podeCriarAtividade,
  inicializarTrial,
  resetarTrial
};
