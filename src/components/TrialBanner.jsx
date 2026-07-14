// ============================================
// TrialBanner - Banner de Aviso de Trial
// Checkflowing SaaS
// ============================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTrial } from '@/hooks/useTrial.jsx';

const TrialBanner = ({ onUpgrade }) => {
  const { trialStatus, loading } = useTrial();

  // Não mostrar se ainda carregando ou se não tem warning
  if (loading || !trialStatus) return null;

  // Não mostrar se está expirado mas é operador (admin que vê)
  if (trialStatus.isExpired && trialStatus.restante === 0) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Trial encerrado!</p>
                  <p className="text-sm text-white/80">
                    Você atingiu o limite de 30 atividades gratuitas.
                  </p>
                </div>
              </div>
              <Button
                onClick={onUpgrade}
                className="bg-white text-red-600 hover:bg-white/90 flex-shrink-0"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Escolher Plano
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Mostrar warning quando restam 5 ou menos
  if (trialStatus.showWarning) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="bg-amber-500 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">
                    Restam {trialStatus.restante} atividades gratuitas
                  </p>
                  <p className="text-sm text-white/80">
                    Após isso, escolha um plano para continuar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUpgrade}
                  className="bg-white text-amber-600 hover:bg-white/90 border-0"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Fazer Upgrade
                </Button>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="max-w-7xl mx-auto mt-2">
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${trialStatus.percentualUsado}%` }}
                  className="h-full bg-white rounded-full"
                />
              </div>
              <p className="text-xs text-white/60 mt-1 text-right">
                {trialStatus.atividades_concluidas} de {trialStatus.limite_atividades} atividades
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};

// Componente compacto para sidebar/footer
export const TrialStatusMini = () => {
  const { trialStatus, loading } = useTrial();

  if (loading || !trialStatus) return null;
  if (trialStatus.isExpired) return null; // Não mostra se já expirou

  return (
    <div className="text-xs text-muted-foreground flex items-center gap-1">
      <Clock className="w-3 h-3" />
      <span>
        {trialStatus.restante} atividades restantes
      </span>
    </div>
  );
};

export default TrialBanner;
