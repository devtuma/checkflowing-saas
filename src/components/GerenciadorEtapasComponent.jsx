import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, Upload, Users, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

function GerenciadorEtapasComponent({ etapas, onAtualizarEtapas, responsaveisDisponiveis }) {
  const [novaEtapa, setNovaEtapa] = useState({
    descricao: '',
    responsaveis: [],
    temImagemExemplo: false, 
    imagemExemploUrl: '', 
    imagemExemploArquivo: null,
    solicitarImagemUsuario: false, 
  });
  const fileInputRef = useRef(null);

  const handleImagemExemploChange = (e, id) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (id) { 
          const novasEtapas = etapas.map(etapa =>
            etapa.id === id ? { ...etapa, imagemExemploUrl: reader.result, imagemExemploArquivo: file } : etapa
          );
          onAtualizarEtapas(novasEtapas);
        } else { 
          setNovaEtapa(prev => ({ ...prev, imagemExemploUrl: reader.result, imagemExemploArquivo: file }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const adicionarEtapa = () => {
    if (!novaEtapa.descricao.trim()) {
      toast({ title: "Erro", description: "Descrição da etapa é obrigatória", variant: "destructive" });
      return;
    }
    const etapaParaAdicionar = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ...novaEtapa,
      descricao: novaEtapa.descricao.trim()
    };
    onAtualizarEtapas([...etapas, etapaParaAdicionar]);
    setNovaEtapa({ descricao: '', responsaveis: [], temImagemExemplo: false, imagemExemploUrl: '', imagemExemploArquivo: null, solicitarImagemUsuario: false });
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast({ title: "Sucesso!", description: "Etapa adicionada localmente! Salve as configurações para persistir." });
  };

  const removerEtapa = (id) => {
    onAtualizarEtapas(etapas.filter(etapa => etapa.id !== id));
    toast({ title: "Sucesso!", description: "Etapa removida localmente! Salve as configurações para persistir." });
  };

  const moverEtapa = (index, direcao) => {
    const novasEtapas = [...etapas];
    const novoIndex = direcao === 'cima' ? index - 1 : index + 1;
    if (novoIndex >= 0 && novoIndex < etapas.length) {
      [novasEtapas[index], novasEtapas[novoIndex]] = [novasEtapas[novoIndex], novasEtapas[index]];
      onAtualizarEtapas(novasEtapas);
    }
  };

  const atualizarEtapa = (id, campo, valor) => {
    onAtualizarEtapas(etapas.map(etapa => etapa.id === id ? { ...etapa, [campo]: valor } : etapa));
  };
  
  const toggleResponsavel = (id, responsavel) => {
    const novasEtapas = etapas.map(etapa => {
      if (etapa.id === id) {
        const responsaveisAtuais = etapa.responsaveis || [];
        const novosResponsaveis = responsaveisAtuais.includes(responsavel)
          ? responsaveisAtuais.filter(r => r !== responsavel)
          : [...responsaveisAtuais, responsavel];
        return { ...etapa, responsaveis: novosResponsaveis };
      }
      return etapa;
    });
    onAtualizarEtapas(novasEtapas);
  };
  
  const toggleResponsavelNovaEtapa = (responsavel) => {
    const responsaveisAtuais = novaEtapa.responsaveis || [];
    const novosResponsaveis = responsaveisAtuais.includes(responsavel)
      ? responsaveisAtuais.filter(r => r !== responsavel)
      : [...responsaveisAtuais, responsavel];
    setNovaEtapa(prev => ({ ...prev, responsaveis: novosResponsaveis }));
  };


  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {etapas.map((etapa, index) => (
          <motion.div 
            key={etapa.id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-muted/30 dark:bg-muted/10 rounded-lg p-4 border border-border"
          >
            <div className="flex items-start space-x-3">
              <div className="flex flex-col space-y-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => moverEtapa(index, 'cima')} disabled={index === 0} className="h-6 w-6 p-0"><ChevronUp className="w-3 h-3" /></Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => moverEtapa(index, 'baixo')} disabled={index === etapas.length - 1} className="h-6 w-6 p-0"><ChevronDown className="w-3 h-3" /></Button>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Etapa {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removerEtapa(etapa.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></Button>
                </div>
                <Textarea value={etapa.descricao} onChange={(e) => atualizarEtapa(etapa.id, 'descricao', e.target.value)} placeholder="Descrição da etapa..." className="min-h-[60px] bg-background" />
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Responsáveis</Label>
                  <div className="flex flex-wrap gap-2">
                    {(responsaveisDisponiveis || []).map(resp => (
                      <Button key={resp} type="button" variant={etapa.responsaveis?.includes(resp) ? "default" : "outline"} size="sm" onClick={() => toggleResponsavel(etapa.id, resp)} className="text-xs px-2 py-1 h-auto">
                        {resp}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id={`imagem-exemplo-${etapa.id}`} checked={etapa.temImagemExemplo || etapa.temimagemexemplo} onCheckedChange={(checked) => atualizarEtapa(etapa.id, 'temImagemExemplo', Boolean(checked))} />
                  <Label htmlFor={`imagem-exemplo-${etapa.id}`} className="text-xs text-muted-foreground checkbox-label-fix">Incluir imagem de exemplo (ADM)</Label>
                </div>
                {(etapa.temImagemExemplo || etapa.temimagemexemplo) && (
                  <div className="mt-1">
                    <Label htmlFor={`upload-exemplo-${etapa.id}`} className="text-xs text-muted-foreground">Upload Imagem Exemplo</Label>
                    <Input id={`upload-exemplo-${etapa.id}`} type="file" accept="image/*" onChange={(e) => handleImagemExemploChange(e, etapa.id)} className="mt-1 bg-background text-xs" />
                    {(etapa.imagemExemploUrl || etapa.imagemexemplourl) && <img-replace src={etapa.imagemExemploUrl || etapa.imagemexemplourl} alt="Preview Exemplo" className="mt-2 max-h-32 rounded" />}
                  </div>
                )}

                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox id={`solicitar-imagem-${etapa.id}`} checked={etapa.solicitarImagemUsuario || etapa.solicitarimagemusuario} onCheckedChange={(checked) => atualizarEtapa(etapa.id, 'solicitarImagemUsuario', Boolean(checked))} />
                  <Label htmlFor={`solicitar-imagem-${etapa.id}`} className="text-xs text-muted-foreground checkbox-label-fix">Solicitar imagem do manutentor</Label>
                </div>

              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary/10 dark:bg-primary/5 rounded-lg p-4 border-2 border-dashed border-primary/50">
        <h4 className="font-medium text-primary mb-3">Adicionar Nova Etapa</h4>
        <div className="space-y-3">
          <Textarea value={novaEtapa.descricao} onChange={(e) => setNovaEtapa(prev => ({ ...prev, descricao: e.target.value }))} placeholder="Descrição da nova etapa..." className="min-h-[60px] bg-background" />
          
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Responsáveis</Label>
            <div className="flex flex-wrap gap-2">
              {(responsaveisDisponiveis || []).map(resp => (
                <Button key={resp} type="button" variant={novaEtapa.responsaveis?.includes(resp) ? "default" : "outline"} size="sm" onClick={() => toggleResponsavelNovaEtapa(resp)} className="text-xs px-2 py-1 h-auto">
                  {resp}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox id="nova-imagem-exemplo" checked={novaEtapa.temImagemExemplo} onCheckedChange={(checked) => setNovaEtapa(prev => ({...prev, temImagemExemplo: Boolean(checked)}))} />
            <Label htmlFor="nova-imagem-exemplo" className="text-xs text-muted-foreground checkbox-label-fix">Incluir imagem de exemplo (ADM)</Label>
          </div>
          {novaEtapa.temImagemExemplo && (
            <div className="mt-1">
              <Label htmlFor="nova-upload-exemplo" className="text-xs text-muted-foreground">Upload Imagem Exemplo</Label>
              <Input id="nova-upload-exemplo" type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleImagemExemploChange(e, null)} className="mt-1 bg-background text-xs" />
              {novaEtapa.imagemExemploUrl && <img-replace src={novaEtapa.imagemExemploUrl} alt="Preview Nova Etapa Exemplo" className="mt-2 max-h-32 rounded" />}
            </div>
          )}

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox id="nova-solicitar-imagem" checked={novaEtapa.solicitarImagemUsuario} onCheckedChange={(checked) => setNovaEtapa(prev => ({...prev, solicitarImagemUsuario: Boolean(checked)}))} />
            <Label htmlFor="nova-solicitar-imagem" className="text-xs text-muted-foreground checkbox-label-fix">Solicitar imagem do manutentor</Label>
          </div>

          <Button type="button" onClick={adicionarEtapa} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Adicionar Etapa</Button>
        </div>
      </div>
    </div>
  );
}

export default GerenciadorEtapasComponent;