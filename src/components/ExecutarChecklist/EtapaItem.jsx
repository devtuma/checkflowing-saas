import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUploader from '@/components/ImageUploader';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { Info, User, Clock, AlertTriangle } from 'lucide-react';

const EtapaItem = ({
  etapa,
  numeroEtapa,
  totalEtapas,
  onConclusaoChange,
  onObservacaoChange,
  onImagemUsuarioChange,
  onRemoveImagemUsuario
}) => {
  const handleImagemSelect = (file, previewUrl) => {
    if (typeof onImagemUsuarioChange === 'function') {
      onImagemUsuarioChange(file, previewUrl);
    }
  };
  
  const handleImagemRemove = () => {
    if (typeof onRemoveImagemUsuario === 'function') {
      onRemoveImagemUsuario();
    }
  };
  
  const imagemObrigatoriaPendente = etapa.solicitarImagemUsuario && !etapa.imagemUsuarioUrl && !etapa.imagemUsuarioArquivo;

  return (
    <motion.div
      key={etapa.id}
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="w-full"
    >
      <Card className={`w-full max-w-3xl mx-auto overflow-hidden shadow-2xl border-l-4 ${etapa.concluida ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : 'border-primary'}`}>
        <CardHeader className="bg-muted/50 p-4">
          <CardTitle className="text-xl text-foreground flex justify-between items-center">
            <span>Etapa {numeroEtapa} de {totalEtapas}: {etapa.descricao}</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Responsável: {etapa.responsaveis?.join(', ') || 'N/A'}</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          {etapa.imagemExemploUrl && (
            <div className="space-y-2">
              <Label className="font-semibold text-muted-foreground">Imagem de Exemplo (Admin)</Label>
              <div className="rounded-lg overflow-hidden border">
                <img src={etapa.imagemExemploUrl} alt="Imagem de exemplo da etapa" className="w-full h-auto max-h-64 object-contain" />
              </div>
            </div>
          )}

          <div className={`space-y-3 p-4 rounded-lg border-2 border-dashed ${imagemObrigatoriaPendente ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' : 'bg-background border-border'}`}>
            <Label className={`font-semibold ${imagemObrigatoriaPendente ? 'text-yellow-700 dark:text-yellow-300' : 'text-muted-foreground'}`}>
              {etapa.solicitarImagemUsuario ? 'Sua Imagem (Obrigatória)' : 'Adicionar Foto (Opcional)'}
            </Label>
            <ImageUploader
              onFileSelect={handleImagemSelect}
              onRemoveImage={handleImagemRemove}
              existingImageUrl={etapa.imagemUsuarioUrl}
            />
            {imagemObrigatoriaPendente && !etapa.concluida && (
              <div className="flex items-center text-xs text-yellow-700 dark:text-yellow-300 gap-2 mt-2">
                <AlertTriangle className="w-4 h-4" />
                <p>Você precisa anexar uma imagem para concluir esta etapa.</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`obs-${etapa.id}`}>Observações</Label>
            <Textarea
              id={`obs-${etapa.id}`}
              value={etapa.observacoes || ''}
              onChange={(e) => onObservacaoChange(e.target.value)}
              placeholder="Adicione observações, se necessário..."
              className="min-h-[100px]"
            />
          </div>

          {etapa.concluida && etapa.responsavelExecucao && (
            <div className="mt-3 p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
              <div className="flex items-center space-x-4 text-sm text-green-800 dark:text-green-300">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>RE: {etapa.responsavelExecucao}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(etapa.dataExecucao).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )}

          {etapa.historicoAlteracoes && etapa.historicoAlteracoes.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-xs">
              <p className="font-medium text-blue-700 dark:text-blue-300 mb-1 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                Histórico de Alterações (últimas 3):
              </p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-blue-600 dark:text-blue-400">
                {etapa.historicoAlteracoes.slice(-3).map((hist, i) => (
                   <li key={i}>
                    {hist.acao} por RE: {hist.re} em {new Date(hist.timestamp).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                   </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/50 p-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id={`concluida-${etapa.id}`}
              checked={!!etapa.concluida}
              onCheckedChange={(checked) => onConclusaoChange(checked)}
              className="w-6 h-6"
            />
            <Label htmlFor={`concluida-${etapa.id}`} className="text-lg font-semibold cursor-pointer select-none">
              Marcar etapa como concluída
            </Label>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default EtapaItem;