import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image, Trash2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

const ImageUploader = ({ onFileSelect, existingImageUrl, onRemoveImage }) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [tempPreviewUrl, setTempPreviewUrl] = useState(null);

  const handleFileChange = (event, source = 'gallery') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo Muito Grande",
        description: "A imagem deve ter no máximo 10MB.",
        variant: "destructive"
      });
      return;
    }

    if (tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setTempPreviewUrl(previewUrl);
    onFileSelect(file, previewUrl);

    toast({
      title: "Imagem Selecionada!",
      description: `Imagem da ${source === 'camera' ? 'câmera' : 'galeria'} pronta para upload.`,
      variant: "success"
    });

    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleRemove = () => {
    if (tempPreviewUrl) {
      URL.revokeObjectURL(tempPreviewUrl);
      setTempPreviewUrl(null);
    }
    onRemoveImage();
    toast({
      title: "Imagem Removida",
      description: "A imagem foi removida com sucesso.",
      variant: "default"
    });
  };

  const displayUrl = existingImageUrl || tempPreviewUrl;

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, 'gallery')}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleFileChange(e, 'camera')}
        className="hidden"
        accept="image/*"
        capture="environment"
      />

      <div className="flex items-center gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={triggerGallery}
          className="flex-1"
        >
          <Image className="w-4 h-4 mr-2" />
          Galeria
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={triggerCamera}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Câmera
        </Button>
      </div>

      <AnimatePresence>
        {displayUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative rounded-lg overflow-hidden border-2 border-primary/20"
          >
            <img
              src={displayUrl}
              alt="Pré-visualização"
              className="w-full h-auto object-cover max-h-64"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
              onClick={handleRemove}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUploader;