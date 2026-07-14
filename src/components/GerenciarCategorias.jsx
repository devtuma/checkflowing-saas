import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Droplets, Wrench, Zap, Hammer, Cog, Shield, ClipboardCheck, Package, Flame, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICONES = [
  { nome: 'droplets', Icone: Droplets, label: 'Limpeza' },
  { nome: 'wrench', Icone: Wrench, label: 'Manutenção' },
  { nome: 'zap', Icone: Zap, label: 'Elétrica' },
  { nome: 'hammer', Icone: Hammer, label: 'Mecânica' },
  { nome: 'cog', Icone: Cog, label: 'Configuração' },
  { nome: 'shield', Icone: Shield, label: 'Segurança' },
  { nome: 'clipboard-check', Icone: ClipboardCheck, label: 'Inspeção' },
  { nome: 'package', Icone: Package, label: 'Materiais' },
  { nome: 'flame', Icone: Flame, label: 'Térmico' },
  { nome: 'star', Icone: Star, label: 'Especial' },
];

const CORES = [
  { hex: '#2563eb', nome: 'Azul' },
  { hex: '#16a34a', nome: 'Verde' },
  { hex: '#d97706', nome: 'Âmbar' },
  { hex: '#dc2626', nome: 'Vermelho' },
  { hex: '#7c3aed', nome: 'Roxo' },
  { hex: '#0891b2', nome: 'Ciano' },
  { hex: '#db2777', nome: 'Rosa' },
  { hex: '#475569', nome: 'Cinza' },
];

export function renderIconeCategoria(nomeIcone, className = 'w-6 h-6') {
  const found = ICONES.find(i => i.nome === nomeIcone);
  if (!found) return <Wrench className={className} />;
  const { Icone } = found;
  return <Icone className={className} />;
}

const valorInicial = { nome: '', descricao: '', cor: '#2563eb', icone: 'droplets', ordem: 0 };

const GerenciarCategorias = ({ categorias, salvarCategoria, excluirCategoria, atividades = [], onVoltar }) => {
  const [form, setForm] = useState(valorInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const abrirNovaCategoria = () => {
    setForm(valorInicial);
    setEditandoId(null);
    setMostrarForm(true);
  };

  const abrirEditar = (cat) => {
    setForm({ nome: cat.nome, descricao: cat.descricao || '', cor: cat.cor || '#2563eb', icone: cat.icone || 'droplets', ordem: cat.ordem || 0 });
    setEditandoId(cat.id);
    setMostrarForm(true);
  };

  const cancelar = () => {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(valorInicial);
  };

  const handleSalvar = async () => {
    if (!form.nome.trim()) return;
    await salvarCategoria({ ...form, id: editandoId || undefined });
    cancelar();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={onVoltar}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-2xl font-bold">Categorias de Atividade</h2>
        </div>
        {!mostrarForm && (
          <Button onClick={abrirNovaCategoria}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        )}
      </div>

      <AnimatePresence>
        {mostrarForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-md"
          >
            <h3 className="text-lg font-semibold">{editandoId ? 'Editar Categoria' : 'Nova Categoria'}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Nome <span className="text-destructive">*</span></Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Limpeza Ácida" />
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Input value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Breve descrição (opcional)" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
                {ICONES.map(({ nome, Icone, label }) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, icone: nome }))}
                    title={label}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${form.icone === nome ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <Icone className="w-5 h-5" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-3">
                {CORES.map(({ hex, nome }) => (
                  <button
                    key={hex}
                    type="button"
                    title={nome}
                    onClick={() => setForm(p => ({ ...p, cor: hex }))}
                    className={`w-8 h-8 rounded-full border-4 transition-all ${form.cor === hex ? 'border-foreground scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSalvar} disabled={!form.nome.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={cancelar}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {categorias.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma categoria cadastrada. Crie a primeira!
          </div>
        )}
        {categorias.map(cat => (
          <motion.div
            key={cat.id}
            layout
            className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.cor + '22', color: cat.cor }}>
              {renderIconeCategoria(cat.icone, 'w-6 h-6')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{cat.nome}</p>
              {cat.descricao && <p className="text-sm text-muted-foreground truncate">{cat.descricao}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => abrirEditar(cat)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => {
                  const vinculadas = (atividades || []).filter(a => a.categoria_id === cat.id).length;
                  const mensagem = vinculadas > 0
                    ? `Esta categoria tem ${vinculadas} atividade(s) vinculada(s). Ao excluir, essas atividades ficarão sem categoria. Deseja continuar?`
                    : `Excluir a categoria "${cat.nome}"?`;
                  if (window.confirm(mensagem)) {
                    excluirCategoria(cat.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GerenciarCategorias;
