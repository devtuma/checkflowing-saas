import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { uploadImagemSupabaseStorage } from '@/lib/supabaseService';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

const sanitizeForPath = (name) => {
  if (!name) return 'sem_nome';
  return name.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, '_').toLowerCase();
};

// Função exportada para testes unitários
export const criarNovaExecucao = (atividade, numeroRE) => {
  // Agregar histórico de TODAS as execuções anteriores por etapa
  const historicoPorEtapa = {};
  for (const exec of (atividade.execucoes || [])) {
    for (const etapa of (exec.etapas || [])) {
      const key = etapa.idEtapaOriginal || etapa.id;
      if (!historicoPorEtapa[key]) historicoPorEtapa[key] = [];
      if (etapa.historicoAlteracoes) {
        historicoPorEtapa[key].push(...etapa.historicoAlteracoes);
      }
    }
  }

  return {
    id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    numeroRE,
    iniciadoEm: new Date().toISOString(),
    finalizadoEm: null,
    etapas: atividade.etapas.map(etapaOriginal => {
      const responsaveisNormalizados = Array.isArray(etapaOriginal.responsaveis) && etapaOriginal.responsaveis.length > 0
        ? etapaOriginal.responsaveis
        : (etapaOriginal.responsavel ? [etapaOriginal.responsavel] : []);
      const key = etapaOriginal.id;
      return {
        ...etapaOriginal,
        id: `exec_etapa_${etapaOriginal.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        idEtapaOriginal: etapaOriginal.id,
        concluida: false,
        responsavelExecucao: '',
        dataExecucao: null,
        observacoes: '',
        imagemUsuarioUrl: null,
        imagemUsuarioArquivo: null,
        historicoAlteracoes: historicoPorEtapa[key] || [],
        responsaveis: responsaveisNormalizados,
      };
    }),
  };
};

export const useChecklistLogic = (atividade, numeroRE, onAtualizarAtividade, onVoltar) => {
  const [execucaoAtual, setExecucaoAtual] = useState(null);
  const [etapaAtualIndex, setEtapaAtualIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!atividade || !numeroRE) { setIsLoading(false); return; }
    const execucoesOrdenadas = [...(atividade.execucoes || [])].sort((a, b) => new Date(b.iniciadoEm) - new Date(a.iniciadoEm));
    const execucaoNaoFinalizada = execucoesOrdenadas.find(exec => !exec.finalizadoEm);

    if (execucaoNaoFinalizada) {
      toast({ title: "Retomando", description: "Continuando execução." });
      setExecucaoAtual(execucaoNaoFinalizada);
    } else {
      setExecucaoAtual(criarNovaExecucao(atividade, numeroRE));
    }
    setIsLoading(false);
  }, [atividade, numeroRE, toast]);

  // Internal save function that accepts execucao directly (avoids stale state)
  const salvarProgressoInternal = useCallback(async (execucao, showToast = false) => {
    if (!execucao) return;
    if (isSaving) return;
    setIsSaving(true);
    try {
      const path = sanitizeForPath(atividade.nome || atividade.tipo_atividade);

      const novasEtapas = await Promise.all(execucao.etapas.map(async (etapa) => {
        if (etapa.imagemUsuarioArquivo instanceof File) {
          const url = await uploadImagemSupabaseStorage(etapa.imagemUsuarioArquivo, path, 'manut', etapa.idEtapaOriginal);
          try {
            await supabase.from('fotos_atividade').insert({
              atividade_id: atividade.id,
              url_foto: url,
              descricao: `Foto da etapa: ${etapa.descricao}`
            });
          } catch (e) { console.error('Erro salvar foto DB:', e); }
          return { ...etapa, imagemUsuarioUrl: url, imagemUsuarioArquivo: null };
        }
        return etapa;
      }));

      const novaExecucao = { ...execucao, etapas: novasEtapas };
      setExecucaoAtual(novaExecucao);

      const atividadeSalvar = {
        ...atividade,
        status: 'em_andamento',
        execucoes: [...(atividade.execucoes || []).filter(e => e.id !== novaExecucao.id), novaExecucao]
      };
      await onAtualizarAtividade(atividadeSalvar, null, true);
      if (showToast) toast({ title: 'Salvo!', description: 'Progresso salvo.' });
    } finally {
      setIsSaving(false);
    }
  }, [atividade, onAtualizarAtividade, toast, isSaving]);

  const marcarEtapaConcluida = useCallback(async (index, concluida) => {
    if (!execucaoAtual) return;

    const etapaAtual = execucaoAtual.etapas[index];

    // Bloquear conclusão se a etapa exige foto e não tem foto
    if (concluida && etapaAtual.solicitarImagemUsuario && !etapaAtual.imagemUsuarioUrl && !etapaAtual.imagemUsuarioArquivo) {
      toast({
        title: "Foto Obrigatória",
        description: "Adicione uma foto antes de marcar esta etapa como concluída.",
        variant: "destructive"
      });
      return;
    }

    const novas = [...execucaoAtual.etapas];

    // Registrar histórico quando houver alteração após conclusão prévia
    const foiConcluida = !!etapaAtual.concluida;
    if (foiConcluida || etapaAtual.responsavelExecucao) {
      novas[index] = {
        ...etapaAtual,
        historicoAlteracoes: [
          ...(etapaAtual.historicoAlteracoes || []),
          {
            acao: concluida ? 'Remarcada como concluída' : 'Conclusão revertida',
            re: numeroRE,
            reAnterior: etapaAtual.responsavelExecucao || null,
            timestamp: new Date().toISOString()
          }
        ]
      };
    } else {
      novas[index] = { ...etapaAtual };
    }

    novas[index] = {
      ...novas[index],
      concluida,
      dataExecucao: concluida ? new Date().toISOString() : null,
      responsavelExecucao: concluida ? numeroRE : ''
    };

    const novaExecucao = { ...execucaoAtual, etapas: novas };
    setExecucaoAtual(novaExecucao);
    // Auto-save em background com o novo estado
    setTimeout(() => salvarProgressoInternal(novaExecucao, false), 0);
  }, [execucaoAtual, numeroRE, salvarProgressoInternal, toast]);

  const atualizarObservacoes = useCallback((index, observacoes) => {
    setExecucaoAtual(prev => {
      const novas = [...prev.etapas];
      novas[index] = { ...novas[index], observacoes };
      return { ...prev, etapas: novas };
    });
  }, []);

  const handleImagemUsuarioChange = useCallback((index, file, previewUrl) => {
    setExecucaoAtual(prev => {
      const novas = [...prev.etapas];
      novas[index] = { ...novas[index], imagemUsuarioArquivo: file, imagemUsuarioUrl: previewUrl };
      return { ...prev, etapas: novas };
    });
  }, []);

  const handleRemoveImagemUsuario = useCallback(async (index) => {
    if (isDeletingImage) return;

    const etapa = execucaoAtual.etapas[index];
    if (!etapa.imagemUsuarioUrl && !etapa.imagemUsuarioArquivo) return;

    setIsDeletingImage(true);

    try {
      if (etapa.imagemUsuarioUrl && typeof etapa.imagemUsuarioUrl === 'string' && etapa.imagemUsuarioUrl.startsWith('http')) {
        const { error } = await supabase
          .from('fotos_atividade')
          .delete()
          .eq('url_foto', etapa.imagemUsuarioUrl);

        if (error) throw error;
      }

      setExecucaoAtual(prev => {
        const novas = [...prev.etapas];
        novas[index] = { ...novas[index], imagemUsuarioArquivo: null, imagemUsuarioUrl: null };
        return { ...prev, etapas: novas };
      });

      toast({ title: "Imagem removida", description: "A imagem foi removida com sucesso." });
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast({ title: "Erro", description: "Falha ao remover a imagem.", variant: "destructive" });
    } finally {
      setIsDeletingImage(false);
    }
  }, [execucaoAtual, isDeletingImage, toast]);

  const salvarProgresso = useCallback(async () => {
    await salvarProgressoInternal(execucaoAtual, true);
  }, [execucaoAtual, salvarProgressoInternal]);

  const finalizarChecklist = useCallback(async () => {
    if (atividade.exigir_imagem) {
      const temImagem = execucaoAtual.etapas.some(e => e.imagemUsuarioUrl || e.imagemUsuarioArquivo);
      if (!temImagem) {
        toast({
          title: "Foto Obrigatória",
          description: "Esta atividade requer pelo menos uma foto para ser concluída.",
          variant: "destructive"
        });
        return;
      }
    }

    await salvarProgresso();
    const finalizado = { ...execucaoAtual, finalizadoEm: new Date().toISOString() };
    await onAtualizarAtividade({
      ...atividade,
      status: 'concluida',
      execucoes: [...(atividade.execucoes || []).filter(e => e.id !== execucaoAtual.id), finalizado]
    }, null, true);
    onVoltar();
  }, [execucaoAtual, atividade, onAtualizarAtividade, onVoltar, salvarProgresso, toast]);

  const calcularProgresso = useCallback(() => {
    if (!execucaoAtual?.etapas?.length) return 0;
    return Math.round((execucaoAtual.etapas.filter(e => e.concluida).length / execucaoAtual.etapas.length) * 100);
  }, [execucaoAtual]);

  return {
    execucaoAtual,
    etapaAtualIndex,
    setEtapaAtualIndex,
    marcarEtapaConcluida,
    atualizarObservacoes,
    handleImagemUsuarioChange,
    handleRemoveImagemUsuario,
    isDeletingImage,
    isSaving,
    salvarProgresso,
    finalizarChecklist,
    calcularProgresso,
    isLoading
  };
};
