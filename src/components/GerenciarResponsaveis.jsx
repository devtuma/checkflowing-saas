import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Trash2, Users, Save } from 'lucide-react';
import { motion } from 'framer-motion';

function GerenciarResponsaveis({ responsaveis, salvarResponsaveis, onVoltar }) {
  const [listaResponsaveis, setListaResponsaveis] = useState([...responsaveis]);
  const [novoResponsavel, setNovoResponsavel] = useState('');

  const adicionarResponsavel = () => {
    if (!novoResponsavel.trim()) {
      toast({ title: "Erro", description: "Nome do responsável não pode ser vazio.", variant: "destructive" });
      return;
    }
    if (listaResponsaveis.includes(novoResponsavel.trim())) {
      toast({ title: "Atenção", description: "Este responsável já existe.", variant: "warning" });
      return;
    }
    setListaResponsaveis([...listaResponsaveis, novoResponsavel.trim()]);
    setNovoResponsavel('');
    toast({ title: "Sucesso!", description: "Responsável adicionado à lista temporária. Clique em Salvar para persistir.", variant: "success" });
  };

  const removerResponsavel = (responsavelParaRemover) => {
    setListaResponsaveis(listaResponsaveis.filter(r => r !== responsavelParaRemover));
    toast({ title: "Sucesso!", description: `"${responsavelParaRemover}" removido da lista temporária.`, variant: "success" });
  };

  const handleSalvar = () => {
    salvarResponsaveis(listaResponsaveis);
    toast({ title: "Sucesso!", description: "Lista de responsáveis salva!", variant: "success" });
    onVoltar();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-card rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-card-foreground">
              Gerenciar Responsáveis
            </h2>
          </div>
          <Button variant="outline" onClick={onVoltar}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="mb-6 space-y-2">
          <Label htmlFor="novo-responsavel" className="text-muted-foreground">Adicionar Novo Responsável</Label>
          <div className="flex space-x-2">
            <Input 
              id="novo-responsavel"
              type="text"
              value={novoResponsavel}
              onChange={(e) => setNovoResponsavel(e.target.value)}
              placeholder="Nome do Responsável ou Setor"
              className="bg-background border-border"
            />
            <Button onClick={adicionarResponsavel} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Adicionar
            </Button>
          </div>
        </div>

        {listaResponsaveis.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-card-foreground mb-2">Lista de Responsáveis</h3>
            {listaResponsaveis.map((responsavel, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-3 rounded-md border border-border"
              >
                <span className="text-foreground">{responsavel}</span>
                <Button variant="ghost" size="sm" onClick={() => removerResponsavel(responsavel)} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Nenhum responsável cadastrado.</p>
        )}

        <div className="flex justify-end mt-8 pt-6 border-t border-border">
          <Button onClick={handleSalvar} className="bg-green-600 hover:bg-green-700 text-white">
            <Save className="w-4 h-4 mr-2" /> Salvar Lista de Responsáveis
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default GerenciarResponsaveis;