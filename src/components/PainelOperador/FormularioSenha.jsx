import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

const FormularioSenha = ({ manutentorParaConfirmar, senhaInput, setSenhaInput, handleLoginComSenha, onVoltarParaLogin }) => {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-xl shadow-2xl p-8 max-w-md mx-auto mt-10"
    >
      <h2 className="text-3xl font-bold text-card-foreground mb-3 text-center">Olá, {manutentorParaConfirmar?.nome_completo}!</h2>
      <p className="text-center text-muted-foreground mb-8">Insira sua senha para acessar.</p>
      <div className="space-y-6">
        <div>
          <Label htmlFor="senhaManutentor" className="text-muted-foreground">Senha</Label>
          <div className="relative mt-1">
            <Input
              id="senhaManutentor"
              type={mostrarSenha ? 'text' : 'password'}
              value={senhaInput}
              onChange={(e) => setSenhaInput(e.target.value)}
              placeholder="Sua senha"
              className="bg-input border-border text-lg p-3 pr-12"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleLoginComSenha()}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <Button onClick={handleLoginComSenha} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
          <KeyRound className="w-5 h-5 mr-2" />
          Entrar
        </Button>
        <Button variant="outline" onClick={onVoltarParaLogin} className="w-full text-lg py-3">
          Voltar (ID Mercedes)
        </Button>
      </div>
    </motion.div>
  );
};

export default FormularioSenha;