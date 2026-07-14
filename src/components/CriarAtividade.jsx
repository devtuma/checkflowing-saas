import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import GerenciadorEtapas from '@/components/GerenciadorEtapas';
import ImageUploader from '@/components/ImageUploader';
import { ArrowLeft, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

function CriarAtividade({ responsaveisDisponiveis, categoriasDisponiveis = [], onCriarAtividade, onVoltar, atividadeInicial }) {
  const [nomeAtividade, setNomeAtividade] = useState('');
  const [ordemSap, setOrdemSap] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataTermino, setDataTermino] = useState('');
  const [exigirImagem, setExigirImagem] = useState(false);
  const [imagemExemploArquivo, setImagemExemploArquivo] = useState(null);
  const [imagemExemploUrl, setImagemExemploUrl] = useState('');
  const [etapasAtividade, setEtapasAtividade] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (atividadeInicial) {
      setNomeAtividade(atividadeInicial.nome || '');
      setOrdemSap(atividadeInicial.ordem_sap || atividadeInicial.numero_sap || '');
      setCategoriaId(atividadeInicial.categoria_id || '');
      setExigirImagem(atividadeInicial.exigir_imagem || false);
      const formatarData = (dataString) => {
        if (!dataString) return '';
        try {
          return new Date(dataString).toISOString().split('T')[0];
        } catch (e) {
          return '';
        }
      };
      setDataInicio(formatarData(atividadeInicial.dataInicio || atividadeInicial.datainicio));
      setDataTermino(formatarData(atividadeInicial.dataTermino || atividadeInicial.datatermino));
      setEtapasAtividade((atividadeInicial.etapas || []).map(etapa => ({
        ...etapa,
        id: etapa.id || `temp-id-${Date.now()}-${Math.random()}`,
        temImagemExemplo: etapa.temImagemExemplo || !!etapa.imagemExemploUrl,
        imagemExemploUrl: etapa.imagemExemploUrl || '',
        solicitarImagemUsuario: etapa.solicitarImagemUsuario || false,
        imagemExemploArquivo: null,
        previewUrl: '',
      })));
    } else {
      setNomeAtividade('');
      setOrdemSap('');
      setCategoriaId('');
      setExigirImagem(false);
      setDataInicio('');
      setDataTermino('');
      setImagemExemploArquivo(null);
      setImagemExemploUrl('');
      setEtapasAtividade([]);
    }
  }, [atividadeInicial]);

  const validarFormulario = () => {
    if (!nomeAtividade.trim()) {
      toast({ title: "Erro de Validação", description: "O nome da atividade é obrigatório.", variant: "destructive" });
      return false;
    }
    if (!dataInicio) {
      toast({ title: "Erro de Validação", description: "A data de início é obrigatória.", variant: "destructive" });
      return false;
    }
    if (!dataTermino) {
      toast({ title: "Erro de Validação", description: "A data de término é obrigatória.", variant: "destructive" });
      return false;
    }
    if (new Date(dataInicio) > new Date(dataTermino)) {
      toast({ title: "Erro de Validação", description: "A data de início não pode ser posterior à data de término.", variant: "destructive" });
      return false;
    }
    if (etapasAtividade.length === 0) {
      toast({ title: "Erro de Validação", description: "A atividade deve conter pelo menos uma etapa.", variant: "destructive" });
      return false;
    }
    if (categoriasDisponiveis.length > 0 && !categoriaId) {
      toast({ title: "Erro de Validação", description: "Selecione uma categoria (hub) para a atividade.", variant: "destructive" });
      return false;
    }
    for (const etapa of etapasAtividade) {
      if (!etapa.descricao.trim()) {
        toast({ title: "Erro de Validação", description: `A descrição da etapa ${etapasAtividade.indexOf(etapa) + 1} é obrigatória.`, variant: "destructive" });
        return false;
      }
    }
    const etapaSemResponsavel = etapasAtividade.find(e => !e.responsavel && !e.responsaveis?.length);
    if (etapaSemResponsavel) {
      const idx = etapasAtividade.indexOf(etapaSemResponsavel) + 1;
      toast({ title: "Responsável Obrigatório", description: `A etapa ${idx} deve ter ao menos um responsável.`, variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) {
      return;
    }

    setIsSubmitting(true);

    if (ordemSap.trim()) {
      try {
        let query = supabase.from('atividades').select('id').ilike('numero_sap', ordemSap.trim());
        
        if (atividadeInicial?.id && !String(atividadeInicial.id).startsWith('temp')) {
          query = query.neq('id', atividadeInicial.id);
        }
        
        const { data, error } = await query;

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          toast({ 
            title: "Erro de Validação", 
            description: "Já existe uma atividade com este número SAP", 
            variant: "destructive" 
          });
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error("Erro ao validar ordem SAP:", error);
        toast({ 
          title: "Erro", 
          description: "Falha ao verificar a ordem SAP. Tente novamente.", 
          variant: "destructive" 
        });
        setIsSubmitting(false);
        return;
      }
    }

    const dadosParaSalvar = {
      id: atividadeInicial?.id,
      nome: nomeAtividade.trim(),
      ordem_sap: ordemSap.trim() || null,
      categoria_id: categoriaId || null,
      dataInicio,
      dataTermino,
      exigir_imagem: exigirImagem,
      imagemExemploArquivo,
      etapas: etapasAtividade,
    };
    
    onCriarAtividade(dadosParaSalvar);
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto p-2"
    >
      <div className="bg-card text-card-foreground rounded-xl shadow-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 pb-4 border-b border-border">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2 sm:mb-0">
            {atividadeInicial ? "Editar Atividade" : "Criar Nova Atividade"}
          </h1>
          <Button variant="outline" onClick={onVoltar} className="w-full sm:w-auto" disabled={isSubmitting}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para o Painel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nomeAtividade" className="text-base font-medium">Nome da Atividade <span className="text-destructive">*</span></Label>
              <Input
                id="nomeAtividade"
                type="text"
                value={nomeAtividade}
                onChange={(e) => setNomeAtividade(e.target.value)}
                placeholder="Ex: Limpeza Ácida Semanal"
                className="text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoriaId" className="text-base font-medium">Categoria (Hub)</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger id="categoriaId" className="text-base">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDisponiveis.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="ordemSap" className="text-base font-medium">Número da ordem SAP</Label>
              <Input
                id="ordemSap"
                type="text"
                inputMode="numeric"
                value={ordemSap}
                onChange={(e) => setOrdemSap(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 100123456 (Opcional)"
                className="text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="dataInicio" className="text-base font-medium">Data de Início <span className="text-destructive">*</span></Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataTermino" className="text-base font-medium">Data de Término Prevista <span className="text-destructive">*</span></Label>
              <Input
                id="dataTermino"
                type="date"
                value={dataTermino}
                onChange={(e) => setDataTermino(e.target.value)}
                className="text-base"
                required
              />
            </div>
          </div>

          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
            <h3 className="font-semibold text-lg">Configurações Adicionais</h3>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exigirImagem"
                checked={exigirImagem}
                onCheckedChange={setExigirImagem}
              />
              <Label htmlFor="exigirImagem" className="text-base font-medium cursor-pointer">
                Exigir pelo menos uma foto para conclusão da atividade
              </Label>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Label className="block mb-2 font-medium text-base">Imagem de Exemplo da Atividade (Opcional)</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Forneça uma foto de referência que será anexada aos detalhes gerais da atividade.
              </p>
              <ImageUploader 
                existingImageUrl={imagemExemploUrl}
                onFileSelect={(file, url) => {
                  setImagemExemploArquivo(file);
                  setImagemExemploUrl(url);
                }}
                onRemoveImage={() => {
                  setImagemExemploArquivo(null);
                  setImagemExemploUrl('');
                }}
              />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground border-b border-border pb-2">
              Configuração das Etapas do Checklist
            </h2>
            <GerenciadorEtapas
              etapas={etapasAtividade}
              onAtualizarEtapas={setEtapasAtividade}
              responsaveisDisponiveis={responsaveisDisponiveis || []}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 mt-8 border-t border-border">
            <Button type="button" variant="outline" onClick={onVoltar} className="w-full sm:w-auto text-base" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground text-base" disabled={isSubmitting}>
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? "Salvando..." : (atividadeInicial ? "Salvar Alterações" : "Criar Atividade")}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

export default CriarAtividade;