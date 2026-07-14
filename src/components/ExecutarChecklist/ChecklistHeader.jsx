import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ListChecks } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ChecklistHeader = ({ atividadeNome, numeroRE, progresso, onVoltar, totalEtapas, etapaAtualIndex, onIrParaEtapa }) => {
  return (
    <div className="bg-card text-card-foreground rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div className="flex-grow">
          <h2 className="text-xl sm:text-2xl font-bold">
            {atividadeNome}
          </h2>
          <p className="text-sm text-muted-foreground">
            Operador RE: {numeroRE}
          </p>
        </div>
        <div className="w-full sm:w-auto flex items-center gap-2">
            <Select value={String(etapaAtualIndex)} onValueChange={(value) => onIrParaEtapa(Number(value))}>
                <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Ir para etapa..." />
                </SelectTrigger>
                <SelectContent>
                    {Array.from({ length: totalEtapas }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                           Etapa {i + 1} de {totalEtapas}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button variant="outline" onClick={onVoltar} size="icon" className="h-10 w-10">
                <ArrowLeft className="w-4 h-4" />
                <span className="sr-only">Voltar</span>
            </Button>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-3 relative overflow-hidden">
        <div 
          className="bg-primary h-3 rounded-full transition-all duration-300"
          style={{ width: `${progresso}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-right">Progresso: {progresso}%</p>
    </div>
  );
};

export default ChecklistHeader;