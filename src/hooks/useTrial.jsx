// ============================================
// useTrial - Hook de Controle de Trial
// Checkflowing SaaS
// ============================================

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import trialService from '../lib/trialService';
import { useAuth } from './useAuth.jsx';

const TrialContext = createContext(null);

export const TrialProvider = ({ children }) => {
  const { usuario, tenant } = useAuth();
  const [trialStatus, setTrialStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carregar status do trial quando tenant carregar
  useEffect(() => {
    const carregarTrial = async () => {
      if (!tenant?.id) {
        setLoading(false);
        return;
      }

      try {
        const result = await trialService.getTrialStatus(tenant.id);

        if (result.success) {
          setTrialStatus(result.data);
        }
      } catch (err) {
        console.error('[useTrial] Erro ao carregar trial:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarTrial();
  }, [tenant?.id]);

  // Verificar se pode criar atividade
  const podeCriarAtividade = useCallback(async () => {
    if (!tenant?.id) return true;

    const result = await trialService.podeCriarAtividade(tenant.id);
    return result.success ? result.data.pode : true;
  }, [tenant?.id]);

  // Incrementar contador após atividade concluída
  const registrarAtividadeConcluida = useCallback(async () => {
    if (!tenant?.id) return;

    const result = await trialService.incrementarAtividadeConcluida(tenant.id);

    if (result.success) {
      setTrialStatus(result.data);
    }

    return result;
  }, [tenant?.id]);

  // Obter mensagem de warning
  const getWarningMessage = useCallback(() => {
    if (!trialStatus) return null;

    if (trialStatus.isExpired) {
      return {
        type: 'error',
        title: 'Trial encerrado',
        message: 'Você atingiu o limite de 30 atividades gratuitas. Escolha um plano para continuar.',
        showUpgradeButton: true
      };
    }

    if (trialStatus.showWarning) {
      return {
        type: 'warning',
        title: 'Atividades restantes',
        message: `Restam apenas ${trialStatus.restante} atividades no seu trial gratuito.`,
        showUpgradeButton: true
      };
    }

    return null;
  }, [trialStatus]);

  const value = {
    trialStatus,
    loading,
    podeCriarAtividade,
    registrarAtividadeConcluida,
    getWarningMessage,
    // Atalhos
    restante: trialStatus?.restante ?? null,
    isExpired: trialStatus?.isExpired ?? false,
    showWarning: trialStatus?.showWarning ?? false,
    percentualUsado: trialStatus?.percentualUsado ?? '0'
  };

  return (
    <TrialContext.Provider value={value}>
      {children}
    </TrialContext.Provider>
  );
};

export const useTrial = () => {
  const context = useContext(TrialContext);
  if (!context) {
    throw new Error('useTrial deve ser usado dentro de TrialProvider');
  }
  return context;
};

export default useTrial;
