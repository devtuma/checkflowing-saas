import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

const FormularioPrimeiroAcesso = ({ 
  manutentorParaConfirmar, 
  novaSenha, 
  setNovaSenha, 
  confirmarNovaSenha, 
  setConfirmarNovaSenha, 
  handleCriarNovaSenha, 
  onVoltarParaLogin 
}) => {
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-xl shadow-2xl p-8 max-w-md mx-auto mt-10"
    >
      <h2 className="text-3xl font-bold text-card-foreground mb-3 text-center">Crie sua Senha</h2>
      <p className="text-center text-muted-foreground mb-8">É seu primeiro acesso, {manutentorParaConfirmar?.nome || manutentorParaConfirmar?.nome_completo}. Defina uma senha segura.</p>
      <div className="space-y-6">
        <div>
          <Label htmlFor="novaSenha" className="text-muted-foreground">Nova Senha (mín. 6 caracteres)</Label>
          <div className="relative mt-1">
            <Input
              id="novaSenha"
              type={mostrarNovaSenha ? 'text' : 'password'}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="bg-input border-border text-lg p-3 pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={mostrarNovaSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="confirmarNovaSenha" className="text-muted-foreground">Confirmar Nova Senha</Label>
          <div className="relative mt-1">
            <Input
              id="confirmarNovaSenha"
              type={mostrarConfirmarSenha ? 'text' : 'password'}
              value={confirmarNovaSenha}
              onChange={(e) => setConfirmarNovaSenha(e.target.value)}
              className="bg-input border-border text-lg p-3 pr-12"
              onKeyPress={(e) => e.key === 'Enter' && handleCriarNovaSenha()}
            />
            <button
              type="button"
              onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={mostrarConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <Button onClick={handleCriarNovaSenha} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
          <KeyRound className="w-5 h-5 mr-2" />
          Salvar Senha e Entrar
        </Button>
         <Button variant="outline" onClick={onVoltarParaLogin} className="w-full text-lg py-3">
          Cancelar
        </Button>
      </div>
    </motion.div>
  );
};

export default FormularioPrimeiroAcesso;