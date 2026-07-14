import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User as UserIcon } from 'lucide-react';

const FormularioLogin = ({ idMercedesInput, setIdMercedesInput, handleVerificarIdMercedes, onCancelarLogout }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-xl shadow-2xl p-8 max-w-md mx-auto mt-10"
    >
      <h2 className="text-3xl font-bold text-card-foreground mb-3 text-center">Login Manutentor</h2>
      <p className="text-center text-muted-foreground mb-8">Insira seu RE ou ID Mercedes para continuar.</p>
      <div className="space-y-6">
        <div>
          <Label htmlFor="idMercedes" className="text-muted-foreground">RE ou ID Mercedes</Label>
          <Input
            id="idMercedes"
            type="text"
            value={idMercedesInput}
            onChange={(e) => setIdMercedesInput(e.target.value)}
            placeholder="Ex: ABC1234 ou 123456"
            className="mt-1 bg-input border-border text-lg p-3"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleVerificarIdMercedes()}
          />
        </div>
        <Button onClick={handleVerificarIdMercedes} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
          <UserIcon className="w-5 h-5 mr-2" />
          Verificar
        </Button>
        <Button variant="outline" onClick={onCancelarLogout} className="w-full text-lg py-3">
          Cancelar
        </Button>
      </div>
    </motion.div>
  );
};

export default FormularioLogin;