import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import RelatorioAtividade from '@/components/RelatorioAtividade';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  FileText, 
  Trash2,
  Eye,
  Copy,
  Edit,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

function ListaAtividades({ atividades, onEditarAtividade, onExcluirAtividade, onCopiarAtividade, onVoltar, onVerRelatorio, onNovaAtividade }) {
  const [atividadeSelecionada, setAtividadeSelecionada] = useState(null);
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'concluida': 
        return { icon: <CheckCircle className="w-5 h-5 text-green-500" />, text: 'Concluída', color: 'border-green-200 dark:border-green-700' };
      case 'em_andamento': 
        return { icon: <PlayCircle className="w-5 h-5 text-yellow-500" />, text: 'Em Andamento', color: 'border-yellow-200 dark:border-yellow-700' };
      default: 
        return { icon: <AlertCircle className="w-5 h-5 text-gray-500" />, text: 'Pendente', color: 'border-gray-200 dark:border-gray-600' };
    }
  };

  const calcularProgresso = (atividade) => {
    if (atividade.status === 'concluida') return 100;
    if (!atividade.execucoes || atividade.execucoes.length === 0) return 0;
    const ultimaExecucao = atividade.execucoes.find(exec => !exec.finalizadoEm) || atividade.execucoes[atividade.execucoes.length - 1];
    if (!ultimaExecucao || !ultimaExecucao.etapas) return 0;
    const etapasConcluidas = ultimaExecucao.etapas.filter(etapa => etapa.concluida).length;
    const totalEtapas = ultimaExecucao.etapas.length;
    return totalEtapas > 0 ? Math.round((etapasConcluidas / totalEtapas) * 100) : 0;
  };

  const confirmarExclusao = (atividade) => {
    if (window.confirm(`Tem certeza que deseja excluir a atividade "${atividade.nome}"? Esta ação não pode ser desfeita.`)) {
      onExcluirAtividade(atividade.id);
    }
  };

  const visualizarRelatorio = (atividade) => {
    if (onVerRelatorio) {
      onVerRelatorio(atividade);
    } else {
      setAtividadeSelecionada(atividade);
      setMostrarRelatorio(true);
    }
  };

  const fecharRelatorio = () => {
    setMostrarRelatorio(false);
    setAtividadeSelecionada(null);
  };

  if (mostrarRelatorio && atividadeSelecionada) {
    return <RelatorioAtividade atividade={atividadeSelecionada} onFechar={fecharRelatorio} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
      <div className="bg-card rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-card-foreground">Gerenciar Atividades</h2>
          <div className="flex gap-2">
            <Button variant="default" onClick={onNovaAtividade} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Nova Atividade
            </Button>
            <Button variant="outline" onClick={onVoltar}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        </div>
        {atividades.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhuma atividade encontrada</h3>
            <p className="text-muted-foreground">Crie uma nova atividade para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {atividades.map((atividade) => {
              const statusInfo = getStatusInfo(atividade.status);
              const isConcluida = atividade.status === 'concluida';
              return (
                <motion.div key={atividade.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`border rounded-lg p-4 ${statusInfo.color}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        {statusInfo.icon}
                        <h3 className="text-lg font-semibold text-foreground">{atividade.nome}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>{statusInfo.text}</span>
                        {atividade.ordem_sap && (
                           <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                             SAP: {atividade.ordem_sap}
                           </span>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>Início: {new Date(atividade.dataInicio || atividade.data_inicio).toLocaleDateString('pt-BR')}</span></div>
                        <div className="flex items-center space-x-2"><Calendar className="w-4 h-4" /><span>Término: {new Date(atividade.dataTermino || atividade.data_conclusao).toLocaleDateString('pt-BR')}</span></div>
                        <div className="flex items-center space-x-2"><Clock className="w-4 h-4" /><span>Progresso: {calcularProgresso(atividade)}%</span></div>
                      </div>
                    </div>
                    <div className="flex space-x-2 self-start md:self-center">
                      <Button variant="outline" size="sm" onClick={() => visualizarRelatorio(atividade)}><Eye className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => onEditarAtividade(atividade.id)} disabled={isConcluida}><Edit className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => onCopiarAtividade(atividade.id)}><Copy className="w-4 h-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => confirmarExclusao(atividade)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ListaAtividades;