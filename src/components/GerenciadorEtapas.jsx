import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUploader from '@/components/ImageUploader';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GerenciadorEtapas = ({ etapas, onAtualizarEtapas, responsaveisDisponiveis }) => {
  const adicionarEtapa = () => {
    onAtualizarEtapas([
      ...etapas,
      {
        id: `temp-id-${Date.now()}`,
        descricao: '',
        responsavel: responsaveisDisponiveis[0] || '',
        solicitarImagemUsuario: false,
        imagemExemploUrl: '',
        imagemExemploArquivo: null,
        previewUrl: '',
      },
    ]);
  };

  const removerEtapa = (index) => {
    const novasEtapas = etapas.filter((_, i) => i !== index);
    onAtualizarEtapas(novasEtapas);
  };

  const atualizarEtapa = (index, campo, valor) => {
    const novasEtapas = [...etapas];
    novasEtapas[index][campo] = valor;
    onAtualizarEtapas(novasEtapas);
  };
  
  const handleImagemExemploChange = (index, file, previewUrl) => {
    const novasEtapas = [...etapas];
    novasEtapas[index].imagemExemploArquivo = file;
    novasEtapas[index].previewUrl = previewUrl; 
    novasEtapas[index].imagemExemploUrl = '';
    onAtualizarEtapas(novasEtapas);
  };

  const handleRemoveImage = (index) => {
    const novasEtapas = [...etapas];
    novasEtapas[index].imagemExemploArquivo = null;
    novasEtapas[index].previewUrl = ''; 
    novasEtapas[index].imagemExemploUrl = ''; 
    onAtualizarEtapas(novasEtapas);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {etapas.map((etapa, index) => (
          <motion.div
            key={etapa.id}
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-muted/50 p-4 rounded-lg border border-border space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-foreground">Etapa {index + 1}</h3>
              <Button variant="ghost" size="icon" onClick={() => removerEtapa(index)}>
                <Trash2 className="w-5 h-5 text-destructive" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`descricao-${index}`}>Descrição da Tarefa</Label>
              <Input
                id={`descricao-${index}`}
                value={etapa.descricao}
                onChange={(e) => atualizarEtapa(index, 'descricao', e.target.value)}
                placeholder="Ex: Verificar nível do óleo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`responsavel-${index}`}>Responsável</Label>
              <Select
                value={etapa.responsavel}
                onValueChange={(valor) => atualizarEtapa(index, 'responsavel', valor)}
              >
                <SelectTrigger id={`responsavel-${index}`}>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {responsaveisDisponiveis.map((resp) => (
                    <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label>Imagem de Exemplo (Opcional)</Label>
              <ImageUploader
                onFileSelect={(file, previewUrl) => handleImagemExemploChange(index, file, previewUrl)}
                onRemoveImage={() => handleRemoveImage(index)}
                existingImageUrl={etapa.previewUrl || etapa.imagemExemploUrl}
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id={`solicitar-img-${index}`}
                checked={etapa.solicitarImagemUsuario}
                onCheckedChange={(checked) => atualizarEtapa(index, 'solicitarImagemUsuario', checked)}
              />
              <Label htmlFor={`solicitar-img-${index}`} className="font-normal text-sm">
                Solicitar imagem do manutentor ao concluir esta etapa
              </Label>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Button type="button" variant="secondary" onClick={adicionarEtapa} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Nova Etapa
      </Button>
    </div>
  );
};

export default GerenciadorEtapas;