import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Download, Calendar, User, CheckCircle, Clock, AlertTriangle, FileText, FileImage as ImageIcon, FileSpreadsheet, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

function RelatorioAtividade({ atividade, onFechar }) {
  const { toast } = useToast();
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [operadoresMap, setOperadoresMap] = useState({});

  useEffect(() => {
    const fetchOperadores = async () => {
      const { data, error } = await supabase.from('operadores').select('re, nome');
      if (!error && data) {
        const map = {};
        data.forEach(op => { map[String(op.re)] = op.nome; });
        setOperadoresMap(map);
      }
    };
    fetchOperadores();
  }, []);

  const formatRE = (re) => {
    if (!re) return "N/A";
    const strRe = String(re);
    return operadoresMap[strRe] ? `${strRe} - ${operadoresMap[strRe]}` : strRe;
  };

  const registrarRelatorioDB = async (tipo) => {
    try {
      await supabase.from('relatorios').insert({
        atividade_id: atividade.id,
        conteudo: `Relatório exportado em formato ${tipo} para a atividade ${atividade.nome || atividade.tipo_atividade}`,
        data_geracao: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao salvar registro de relatório', error);
    }
  };

  const handleExportWord = async () => {
    setIsExportingWord(true);
    toast({ title: "Gerando Word...", description: "Preparando documento..." });
    try {
      const { generateWordDocument } = await import('@/utils/wordExport');
      await generateWordDocument(atividade);
      await registrarRelatorioDB('Word');
      toast({ title: "Sucesso!", description: "Relatório gerado!", variant: "success" });
    } catch (error) {
      console.error('Erro ao gerar Word:', error);
      toast({ title: "Erro", description: "Falha ao exportar.", variant: "destructive" });
    } finally {
      setIsExportingWord(false);
    }
  };

  const gerarCSV = async () => {
    try {
      const linhas = [
        ['ID', 'Atividade', 'Status', 'Data Início', 'Data Término', 'Execuções', 'Etapas Concluídas', 'Total Etapas'],
        [
          atividade.id,
          (atividade.nome || atividade.tipo_atividade || '').replace(/;/g, ','),
          atividade.status,
          atividade.dataInicio || atividade.data_inicio || '',
          atividade.dataTermino || atividade.data_conclusao || '',
          (atividade.execucoes || []).length,
          (atividade.execucoes || []).reduce((acc, e) => acc + (e.etapas?.filter(et => et.concluida).length || 0), 0),
          (atividade.execucoes?.[0]?.etapas?.length || atividade.etapas?.length || 0)
        ]
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + linhas.map(l => l.join(';')).join('\r\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_${(atividade.nome || 'atividade').replace(/\s+/g, '_').toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await registrarRelatorioDB('CSV');
      toast({ title: "Sucesso!", description: "CSV gerado!" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao gerar CSV.", variant: "destructive" });
    }
  };

  const gerarPDF = async () => {
    toast({ title: "Gerando PDF..." });
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Relatorio de Atividade`, 10, 12);
      doc.setFontSize(11);
      doc.text(`Nome: ${atividade.nome || atividade.tipo_atividade || 'N/A'}`, 10, 22);
      doc.text(`Status: ${getStatusText(atividade.status)}`, 10, 30);
      doc.text(`Data Inicio: ${new Date(atividade.dataInicio || atividade.data_inicio).toLocaleDateString('pt-BR')}`, 10, 38);
      doc.text(`Data Termino: ${new Date(atividade.dataTermino || atividade.data_conclusao).toLocaleDateString('pt-BR')}`, 10, 46);
      doc.text(`Execucoes: ${(atividade.execucoes || []).length}`, 10, 54);

      let y = 64;
      (atividade.execucoes || []).forEach((exec, idx) => {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFont(undefined, 'bold');
        doc.text(`Execucao ${idx + 1} - RE: ${formatRE(exec.numeroRE)}`, 10, y);
        y += 6;
        doc.setFont(undefined, 'normal');
        doc.text(`Iniciado: ${new Date(exec.iniciadoEm).toLocaleString('pt-BR')}`, 14, y);
        y += 6;
        doc.text(`Finalizado: ${exec.finalizadoEm ? new Date(exec.finalizadoEm).toLocaleString('pt-BR') : 'Em andamento'}`, 14, y);
        y += 8;

        // Histórico de alterações
        const etapasComHistorico = (exec.etapas || []).filter(et => et.historicoAlteracoes?.length > 0);
        if (etapasComHistorico.length > 0) {
          if (y > 250) { doc.addPage(); y = 20; }
          doc.setFont(undefined, 'bold');
          doc.text('Historico de Alteracoes:', 14, y);
          y += 5;
          doc.setFont(undefined, 'normal');
          etapasComHistorico.forEach(etapa => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.text(`Etapa: ${etapa.descricao}`, 16, y);
            y += 4;
            etapa.historicoAlteracoes.forEach(h => {
              if (y > 275) { doc.addPage(); y = 20; }
              doc.text(`  ${h.acao} - RE: ${h.re} em ${new Date(h.timestamp).toLocaleString('pt-BR')}`, 18, y);
              y += 4;
            });
            y += 2;
          });
        }
        y += 6;
      });

      doc.save(`relatorio_${(atividade.nome || 'atividade').replace(/\s+/g, '_').toLowerCase()}.pdf`);

      await registrarRelatorioDB('PDF');
      toast({ title: "Sucesso!", description: "PDF gerado!" });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" });
    }
  };

  const getStatusText = (status) => ({concluida: 'Concluída', em_andamento: 'Em Andamento'}[status] || 'Pendente');
  const getStatusIcon = (status) => ({concluida: <CheckCircle className="w-5 h-5 text-green-600" />, em_andamento: <Clock className="w-5 h-5 text-yellow-600" />}[status] || <AlertTriangle className="w-5 h-5 text-gray-600" />);
  const calcularProgresso = (execucao) => {
    if (!execucao?.etapas?.length) return 0;
    return Math.round((execucao.etapas.filter(e => e.concluida).length / execucao.etapas.length) * 100);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-6">
      <div className="bg-card rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold"><FileText className="inline w-6 h-6 mr-2 text-primary" />Relatório</h2>
          <div className="flex gap-2">
            <Button onClick={gerarCSV} variant="outline"><FileSpreadsheet className="w-4 h-4 mr-2" />CSV</Button>
            <Button onClick={handleExportWord} variant="outline"><FileText className="w-4 h-4 mr-2" />Word</Button>
            <Button onClick={gerarPDF} className="bg-primary"><Download className="w-4 h-4 mr-2" />PDF</Button>
            <Button variant="secondary" onClick={onFechar}>Voltar</Button>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-xl shadow-lg p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">{getStatusIcon(atividade.status)}<span className="font-medium">Status</span></div>
            <p>{getStatusText(atividade.status)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2"><Calendar className="w-5 h-5 text-primary" /><span className="font-medium">Data Início</span></div>
            <p>{new Date(atividade.dataInicio || atividade.data_inicio).toLocaleDateString('pt-BR')}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2"><FileText className="w-5 h-5 text-primary" /><span className="font-medium">Etapas</span></div>
            <p>{atividade.etapas?.length || 0}</p>
          </div>
        </div>
      </div>

      {atividade.execucoes?.length > 0 && (
        <div className="bg-card rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Execuções</h3>
          {atividade.execucoes.map((exec, idx) => (
            <div key={idx} className="border rounded-lg p-4 mb-4">
              <div className="flex justify-between"><span className="font-medium">Execução {idx+1}</span> <span>RE: {formatRE(exec.numeroRE)}</span></div>
              <div className="mt-2 w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: `${calcularProgresso(exec)}%` }} /></div>

              {/* Histórico de alterações por etapa */}
              {(exec.etapas || []).some(et => et.historicoAlteracoes?.length > 0) && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-xs">
                  <p className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-1" />
                    Histórico de Alterações
                  </p>
                  {(exec.etapas || []).filter(et => et.historicoAlteracoes?.length > 0).map((etapa, eti) => (
                    <div key={eti} className="mb-2">
                      <p className="font-semibold text-blue-600 dark:text-blue-400">{etapa.descricao}</p>
                      <ul className="list-disc list-inside pl-2 space-y-0.5 text-blue-600 dark:text-blue-400">
                        {etapa.historicoAlteracoes.map((h, hi) => (
                          <li key={hi}>
                            {h.acao} — RE: {h.re}
                            {h.reAnterior ? ` (antes: ${h.reAnterior})` : ''}
                            {' em '}
                            {new Date(h.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default RelatorioAtividade;