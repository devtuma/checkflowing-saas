import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

const DialogoAlterarSenhaAdmin = ({ isOpen, onOpenChange }) => {
  const { toast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const resetState = () => {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarNovaSenha('');
    setIsSubmitting(false);
    setMostrarSenhaAtual(false);
    setMostrarNovaSenha(false);
    setMostrarConfirmar(false);
  };

  const handleClose = (open) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // 1. Fetch current password from Supabase
      const { data, error } = await supabase.from('admin_password').select('*').maybeSingle();
      
      const storedPassword = data?.password || '123456';

      // 2. Validação da senha atual
      if (senhaAtual !== storedPassword) {
        toast({
          title: "Erro de Validação",
          description: "A senha atual está incorreta.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 3. Validação da nova senha
      if (!novaSenha || novaSenha.length < 6) {
        toast({
          title: "Erro de Validação",
          description: "A nova senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 4. Confirmação da nova senha
      if (novaSenha !== confirmarNovaSenha) {
        toast({
          title: "Erro de Validação",
          description: "A nova senha e a confirmação não coincidem.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // 5. Salvar nova senha
      if (data?.id) {
        const { error: updateError } = await supabase
          .from('admin_password')
          .update({ password: novaSenha, updated_at: new Date().toISOString() })
          .eq('id', data.id);
          
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('admin_password')
          .insert({ password: novaSenha, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
          
        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso!",
        description: "Sua senha de administrador foi alterada.",
        variant: "success",
      });
      handleClose(false);
    } catch (error) {
      console.error("Erro ao salvar a nova senha no supabase:", error);
      toast({
        title: "Erro Inesperado",
        description: "Não foi possível salvar a nova senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const PasswordField = ({ id, label, value, onChange, show, onToggle, onKeyPress }) => (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={id} className="text-right text-muted-foreground">
        {label}
      </Label>
      <div className="relative col-span-3">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className="pr-10"
          onKeyPress={onKeyPress}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha do Administrador
          </DialogTitle>
          <DialogDescription>
            Para sua segurança, informe sua senha atual antes de definir uma nova.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <PasswordField
            id="senha-atual"
            label="Senha Atual"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            show={mostrarSenhaAtual}
            onToggle={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
          />
          <PasswordField
            id="nova-senha"
            label="Nova Senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            show={mostrarNovaSenha}
            onToggle={() => setMostrarNovaSenha(!mostrarNovaSenha)}
          />
          <PasswordField
            id="confirmar-nova-senha"
            label="Confirmar"
            value={confirmarNovaSenha}
            onChange={(e) => setConfirmarNovaSenha(e.target.value)}
            show={mostrarConfirmar}
            onToggle={() => setMostrarConfirmar(!mostrarConfirmar)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isSubmitting ? "Salvando..." : "Salvar Nova Senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogoAlterarSenhaAdmin;