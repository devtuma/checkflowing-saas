import React from 'react';
import { Button } from '@/components/ui/button';
import GerenciadorEtapasComponent from '@/components/GerenciadorEtapasComponent'; 
import { ArrowLeft, Settings, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

function GerenciarEtapas({ etapasPadrao, salvarEtapasPadrao, responsaveisDisponiveis, onVoltar }) {
  
  const handleSalvar = async () => {
    try {
      await salvarEtapasPadrao(etapasPadrao);
      toast({ title: "Sucesso!", description: "Etapas padrão salvas com sucesso no banco de dados!", variant: "success" });
    } catch (error) {
      toast({ title: "Erro", description: `Não foi possível salvar as etapas: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-card rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-card-foreground">
              Configurar Etapas Padrão
            </h2>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onVoltar} className="hover:bg-accent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={handleSalvar} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground">
            Configure as etapas padrão que serão utilizadas como base para novas atividades. As alterações são salvas localmente até você clicar em "Salvar Configurações".
          </p>
        </div>

        <GerenciadorEtapasComponent 
          etapas={etapasPadrao}
          onAtualizarEtapas={salvarEtapasPadrao} 
          responsaveisDisponiveis={responsaveisDisponiveis}
        />
      </div>
    </motion.div>
  );
}

export default GerenciarEtapas;