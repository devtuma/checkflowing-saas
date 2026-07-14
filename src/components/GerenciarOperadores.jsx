import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, Trash2, UserCog, Save, Edit2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient'; 

const GerenciarOperadores = ({ operadores, salvarOperadores, onVoltar }) => {
  const [listaManutentores, setListaManutentores] = useState([]);
  const [manutentorEmEdicao, setManutentorEmEdicao] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const valorInicialForm = {
    id: null,
    nome: '',
    re: '',
    turno: 'A',
    id_mercedes: '',
  };
  const [formManutentor, setFormManutentor] = useState(valorInicialForm);

  useEffect(() => {
    setListaManutentores(operadores || []);
  }, [operadores]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormManutentor(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormManutentor(prev => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    if (!formManutentor.nome.trim()) {
      toast({ title: "Erro", description: "Nome completo é obrigatório.", variant: "destructive" });
      return false;
    }
    if (!formManutentor.re.trim()) {
      toast({ title: "Erro", description: "RE é obrigatório.", variant: "destructive" });
      return false;
    }
    if (!formManutentor.turno) {
      toast({ title: "Erro", description: "Turno é obrigatório.", variant: "destructive" });
      return false;
    }
    
    const idMercedesLength = formManutentor.id_mercedes.trim().length;
    if (!formManutentor.id_mercedes.trim() || idMercedesLength < 5 || idMercedesLength > 8) {
      toast({ title: "Erro", description: "ID Mercedes deve ter entre 5 e 8 caracteres.", variant: "destructive" });
      return false;
    }
    
    const idAtual = manutentorEmEdicao ? manutentorEmEdicao.id : null;
    const reLower = formManutentor.re.trim().toLowerCase();

    const outroManutentorComMesmoRE = listaManutentores.find(op => op.re?.toLowerCase() === reLower && op.id !== idAtual);
    if (outroManutentorComMesmoRE) {
        toast({ title: "Erro", description: `RE "${formManutentor.re.trim()}" já cadastrado.`, variant: "destructive" });
        return false;
    }
    const outroManutentorComMesmoIDMercedes = listaManutentores.find(op => op.id_mercedes?.toLowerCase() === formManutentor.id_mercedes.trim().toLowerCase() && op.id !== idAtual);
    if (outroManutentorComMesmoIDMercedes) {
        toast({ title: "Erro", description: `ID Mercedes "${formManutentor.id_mercedes.trim()}" já cadastrado.`, variant: "destructive" });
        return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const dadosBaseManutentor = {
      nome: formManutentor.nome.trim(),
      re: formManutentor.re.trim().toLowerCase(), // Save RE as lowercase
      turno: formManutentor.turno,
      id_mercedes: formManutentor.id_mercedes.trim(),
      updated_at: new Date().toISOString(),
    };

    let manutentorParaSalvar;
    let manutentoresAtualizados;

    if (manutentorEmEdicao) {
      manutentorParaSalvar = {
        ...manutentorEmEdicao,
        ...dadosBaseManutentor,
        primeiro_acesso: manutentorEmEdicao.primeiro_acesso,
        senha_hash: manutentorEmEdicao.senha_hash,
      };
      manutentoresAtualizados = listaManutentores.map(op =>
        op.id === manutentorEmEdicao.id ? manutentorParaSalvar : op
      );
      toast({ title: "Sucesso!", description: "Manutentor atualizado." });
    } else {
      manutentorParaSalvar = {
        ...dadosBaseManutentor,
        id: null,
        senha_hash: null,
        primeiro_acesso: true,
        created_at: new Date().toISOString(),
      };
      manutentoresAtualizados = [...listaManutentores, manutentorParaSalvar];
      toast({ title: "Sucesso!", description: "Manutentor adicionado." });
    }
    
    await salvarOperadores(manutentoresAtualizados);
    setMostrarFormulario(false);
    setManutentorEmEdicao(null);
    setFormManutentor(valorInicialForm);
  };

  const abrirFormularioParaNovo = () => {
    setManutentorEmEdicao(null);
    setFormManutentor(valorInicialForm);
    setMostrarFormulario(true);
  };

  const abrirFormularioParaEditar = (manutentor) => {
    setManutentorEmEdicao(manutentor);
    setFormManutentor({
      id: manutentor.id,
      nome: manutentor.nome,
      re: manutentor.re,
      turno: manutentor.turno,
      id_mercedes: manutentor.id_mercedes,
    });
    setMostrarFormulario(true);
  };

  const handleResetSenha = async (manutentorId) => {
    if (!window.confirm("Tem certeza que deseja resetar a senha deste manutentor? Ele precisará criar uma nova senha no próximo login.")) {
      return;
    }
    const manutentoresAtualizados = listaManutentores.map(op =>
      op.id === manutentorId ? { ...op, senha_hash: null, primeiro_acesso: true, updated_at: new Date().toISOString() } : op
    );
    setListaManutentores(manutentoresAtualizados);
    try {
      const { error } = await supabase
        .from('operadores')
        .update({ primeiro_acesso: true, senha_hash: null })
        .eq('id', manutentorId);
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Senha do manutentor resetada. Status retornado para 'Primeiro Acesso'." });
    } catch (err) {
      console.error('Erro ao resetar senha:', err);
      toast({ title: "Erro", description: "Falha ao resetar senha.", variant: "destructive" });
    }
  };

  const handleExcluirManutentor = async (manutentorId) => {
     if (!window.confirm("Tem certeza que deseja excluir este manutentor? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      const { error } = await supabase.from('operadores').delete().eq('id', manutentorId);
      if (error) throw error;

      const manutentoresRestantes = listaManutentores.filter(op => op.id !== manutentorId);
      setListaManutentores(manutentoresRestantes);
      await salvarOperadores(manutentoresRestantes); 
      toast({ title: "Sucesso!", description: "Manutentor excluído." });

    } catch(error) {
        toast({ title: "Erro", description: "Não foi possível excluir o manutentor do banco.", variant: "destructive" });
        console.error("Erro ao excluir manutentor:", error);
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
            <UserCog className="w-7 h-7 text-teal-600" />
            <h2 className="text-2xl font-bold text-card-foreground">
              Gerenciar Manutentores
            </h2>
          </div>
          <Button variant="outline" onClick={onVoltar} className="hover:bg-accent">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </div>

        {!mostrarFormulario && (
          <Button onClick={abrirFormularioParaNovo} className="mb-6 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Manutentor
          </Button>
        )}

        {mostrarFormulario && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-6 mb-8 p-6 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border"
          >
            <h3 className="text-xl font-semibold text-card-foreground">
              {manutentorEmEdicao ? "Editar Manutentor" : "Novo Manutentor"}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="nome" className="text-muted-foreground">Nome Completo</Label>
                <Input id="nome" name="nome" value={formManutentor.nome} onChange={handleInputChange} className="mt-1 bg-background" />
              </div>
              <div>
                <Label htmlFor="re" className="text-muted-foreground">RE (Registro Empregado)</Label>
                <Input id="re" name="re" value={formManutentor.re} onChange={handleInputChange} className="mt-1 bg-background" />
              </div>
              <div>
                <Label htmlFor="turno" className="text-muted-foreground">Turno</Label>
                <Select name="turno" value={formManutentor.turno} onValueChange={(value) => handleSelectChange('turno', value)}>
                  <SelectTrigger className="w-full mt-1 bg-background">
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="id_mercedes" className="text-muted-foreground">ID Mercedes (5-8 caracteres)</Label>
                <Input id="id_mercedes" name="id_mercedes" value={formManutentor.id_mercedes} onChange={handleInputChange} maxLength={8} className="mt-1 bg-background" />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => { setMostrarFormulario(false); setManutentorEmEdicao(null); setFormManutentor(valorInicialForm); }} className="hover:bg-accent">
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="w-4 h-4 mr-2" /> {manutentorEmEdicao ? "Salvar Alterações" : "Adicionar Manutentor"}
              </Button>
            </div>
          </motion.form>
        )}

        {listaManutentores.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-card-foreground mb-3">Manutentores Cadastrados</h3>
            {listaManutentores.map(manutentor => (
              <motion.div 
                key={manutentor.id || manutentor.re + manutentor.id_mercedes} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col md:flex-row items-start md:items-center justify-between bg-muted/30 dark:bg-muted/10 p-4 rounded-lg border border-border space-y-3 md:space-y-0"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{manutentor.nome}</p>
                  <p className="text-sm text-muted-foreground">RE: {manutentor.re} | Turno: {manutentor.turno} | ID Mercedes: {manutentor.id_mercedes}</p>
                  <p className={`text-xs mt-1 font-medium ${manutentor.primeiro_acesso ? 'text-orange-500' : 'text-green-600'}`}>
                    {manutentor.primeiro_acesso ? "Primeiro Acesso Pendente (senha a ser criada)" : "Acesso Confirmado (Senha definida)"}
                  </p>
                </div>
                <div className="flex space-x-2 self-start md:self-center">
                  <Button variant="outline" size="sm" onClick={() => abrirFormularioParaEditar(manutentor)} className="hover:bg-accent hover:text-accent-foreground">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleResetSenha(manutentor.id)} className="text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-800/30 hover:text-yellow-700 dark:hover:text-yellow-300" disabled={!manutentor.id}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Resetar Senha
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExcluirManutentor(manutentor.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={!manutentor.id}>
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Excluir
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          !mostrarFormulario && <p className="text-muted-foreground text-center py-6">Nenhum manutentor cadastrado.</p>
        )}
      </div>
    </motion.div>
  );
};

export default GerenciarOperadores;