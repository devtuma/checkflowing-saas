import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChecklistFooter = ({
  etapaAtualIndex,
  totalEtapas,
  onAnterior,
  onProxima,
  onSalvarProgresso,
  onFinalizar,
  progresso,
  disabledFinalizar
}) => {
  const isFirstStep = etapaAtualIndex === 0;
  const isLastStep = etapaAtualIndex === totalEtapas - 1;
  const todasEtapasConcluidas = progresso === 100;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={onAnterior}
              disabled={isFirstStep}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>
            <Button
              onClick={onProxima}
              disabled={isLastStep}
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Próxima
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Progresso:</span>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progresso}%` }}
                className="h-full bg-primary"
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="font-semibold">{progresso}%</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={onSalvarProgresso}
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>
            <AnimatePresence>
            {todasEtapasConcluidas && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 sm:flex-none"
              >
                <Button
                  onClick={onFinalizar}
                  disabled={disabledFinalizar}
                  variant="default"
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Finalizar
                </Button>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        <div className="sm:hidden mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progresso</span>
            <span className="font-semibold">{progresso}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progresso}%` }}
              className="h-full bg-primary"
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChecklistFooter;