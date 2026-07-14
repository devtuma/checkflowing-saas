import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  User,
  ListChecks,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { CONFIG } from '@/config/empresa';

function SelecionarAtividade({ atividades, onSelecionarAtividade, categoria }) {
  const [atividadeSelecionadaLocal, setAtividadeSelecionadaLocal] = useState(null);
  const [termoBusca, setTermoBusca] = useState('');

  const atividadesFiltradas = Array.isArray(atividades) ? atividades.filter(
    atividade => atividade.status !== 'concluida' &&
                 (atividade.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
                  new Date(atividade.dataInicio || atividade.data_inicio).toLocaleDateString('pt-BR').includes(termoBusca))
  ) : [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'em_andamento':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'em_andamento':
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'em_andamento':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    }
  };

  const calcularProgresso = (atividade) => {
    if (!atividade.execucoes || atividade.execucoes.length === 0) {
      return 0;
    }
    
    const ultimaExecucao = atividade.execucoes.reduce((prev, current) => 
        (new Date(prev.iniciadoEm) > new Date(current.iniciadoEm)) ? prev : current
    , atividade.execucoes[0]);

    if (!ultimaExecucao || !ultimaExecucao.etapas || ultimaExecucao.etapas.length === 0) return 0;
    const etapasConcluidas = ultimaExecucao.etapas.filter(etapa => etapa.concluida).length;
    return Math.round((etapasConcluidas / ultimaExecucao.etapas.length) * 100);
  };

  const handleIniciar = () => {
    if (!atividadeSelecionadaLocal) {
      toast({
        title: "Erro",
        description: "Selecione uma atividade para executar",
        variant: "destructive"
      });
      return;
    }
    onSelecionarAtividade(atividadeSelecionadaLocal);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="bg-card rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-card-foreground">
                <ListChecks className="inline-block w-7 h-7 mr-2 text-primary"/>
                {categoria ? `Atividades - ${categoria.nome}` : `Atividades de ${CONFIG.nomeSistema}`}
            </h2>
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                    type="text"
                    placeholder="Buscar por nome ou data..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-10 w-full sm:w-64 bg-background"
                />
            </div>
        </div>


        {atividadesFiltradas.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma atividade disponível
            </h3>
            <p className="text-muted-foreground">
              {termoBusca ? "Nenhuma atividade encontrada com os termos da busca." : "Todas as atividades foram concluídas ou não há atividades criadas."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {atividadesFiltradas.map((atividade) => (
              <motion.div
                key={atividade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.01 }}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  atividadeSelecionadaLocal?.id === atividade.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary'
                    : 'border-border hover:border-border/70 bg-background hover:bg-muted/50'
                }`}
                onClick={() => setAtividadeSelecionadaLocal(atividade)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(atividade.status)}
                      <h3 className="text-lg font-semibold text-foreground">
                        {atividade.nome}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(atividade.status)}`}>
                        {getStatusText(atividade.status)}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Início: {new Date(atividade.dataInicio || atividade.data_inicio).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Término: {new Date(atividade.dataTermino || atividade.data_conclusao).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Progresso: {calcularProgresso(atividade)}%</span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium">Etapas:</span> {atividade.etapas.length} itens no checklist
                    </div>
                  </div>

                  {atividadeSelecionadaLocal?.id === atividade.id && (
                    <div className="ml-4">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {atividadesFiltradas.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleIniciar}
            disabled={!atividadeSelecionadaLocal}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Selecionar e Iniciar Atividade
          </Button>
        </div>
      )}
    </motion.div>
  );
}

export default SelecionarAtividade;