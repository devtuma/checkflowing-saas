import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChecklistHeader from './ChecklistHeader';
import EtapaItem from './EtapaItem';
import ChecklistFooter from './ChecklistFooter';
import { useChecklistLogic } from './useChecklistLogic'; 

function ExecutarChecklist({ atividade, numeroRE, onAtualizarAtividade, onVoltar }) {
  const {
    execucaoAtual,
    etapaAtualIndex,
    setEtapaAtualIndex,
    marcarEtapaConcluida,
    atualizarObservacoes,
    handleImagemUsuarioChange,
    handleRemoveImagemUsuario,
    salvarProgresso,
    finalizarChecklist,
    calcularProgresso,
    isLoading,
  } = useChecklistLogic(atividade, numeroRE, onAtualizarAtividade, onVoltar);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto text-primary mb-4 animate-spin" />
          <p className="text-muted-foreground text-lg">Carregando checklist do manutentor...</p>
        </div>
      </div>
    );
  }
  
  const etapaVisivel = execucaoAtual?.etapas[etapaAtualIndex];
  const progresso = calcularProgresso();
  const temImagem = execucaoAtual?.etapas.some(e => e.imagemUsuarioUrl || e.imagemUsuarioArquivo);
  const isConcluirDisabled = atividade.exigir_imagem && !temImagem;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6 pb-32 sm:pb-28" 
    >
      <ChecklistHeader 
        atividadeNome={atividade.nome}
        numeroRE={numeroRE}
        progresso={progresso}
        onVoltar={onVoltar}
        totalEtapas={execucaoAtual?.etapas.length || 0}
        etapaAtualIndex={etapaAtualIndex}
        onIrParaEtapa={setEtapaAtualIndex}
      />

      {atividade.exigir_imagem && !temImagem && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg flex items-center shadow-sm">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p className="font-medium">Esta atividade requer foto para conclusão. Adicione uma foto em pelo menos uma das etapas.</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {etapaVisivel && (
          <div className={atividade.exigir_imagem && !temImagem ? "border-2 border-destructive/50 rounded-lg p-1" : ""}>
            <EtapaItem
              key={etapaVisivel.id}
              etapa={etapaVisivel}
              numeroEtapa={etapaAtualIndex + 1}
              totalEtapas={execucaoAtual.etapas.length}
              onConclusaoChange={(concluida) => marcarEtapaConcluida(etapaAtualIndex, concluida)}
              onObservacaoChange={(obs) => atualizarObservacoes(etapaAtualIndex, obs)}
              onImagemUsuarioChange={(file, url) => handleImagemUsuarioChange(etapaAtualIndex, file, url)}
              onRemoveImagemUsuario={() => handleRemoveImagemUsuario(etapaAtualIndex)}
            />
          </div>
        )}
      </AnimatePresence>

      <ChecklistFooter
        etapaAtualIndex={etapaAtualIndex}
        totalEtapas={execucaoAtual?.etapas.length || 0}
        onAnterior={() => setEtapaAtualIndex(prev => Math.max(0, prev - 1))}
        onProxima={() => setEtapaAtualIndex(prev => Math.min(execucaoAtual.etapas.length - 1, prev + 1))}
        onSalvarProgresso={salvarProgresso}
        onFinalizar={finalizarChecklist}
        progresso={progresso}
        disabledFinalizar={isConcluirDisabled}
      />
    </motion.div>
  );
}

export default ExecutarChecklist;