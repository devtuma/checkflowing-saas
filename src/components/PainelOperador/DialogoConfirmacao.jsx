import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Check, X } from 'lucide-react';

const DialogoConfirmacao = ({ mostrar, setMostrar, manutentor, onConfirmar }) => {
  return (
    <Dialog open={mostrar} onOpenChange={setMostrar}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl">Confirmação de Identidade</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Por favor, confirme se os dados abaixo correspondem a você.
          </DialogDescription>
        </DialogHeader>
        {manutentor && (
          <div className="py-6 space-y-3">
            <p><strong className="text-muted-foreground">Nome:</strong> {manutentor.nome_completo}</p>
            <p><strong className="text-muted-foreground">RE:</strong> {manutentor.re}</p>
            <p><strong className="text-muted-foreground">Turno:</strong> {manutentor.turno}</p>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onConfirmar(false)} className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" /> Não sou eu
          </Button>
          <Button onClick={() => onConfirmar(true)} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Check className="w-4 h-4 mr-2" /> Sim, sou eu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogoConfirmacao;