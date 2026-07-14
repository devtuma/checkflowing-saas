import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ExecutarChecklist from '@/components/ExecutarChecklist/index.jsx'; 
import { supabase } from '@/lib/supabaseClient';
import FormularioLogin from './FormularioLogin';
import FormularioSenha from './FormularioSenha';
import FormularioPrimeiroAcesso from './FormularioPrimeiroAcesso';

const simpleHash = async (password) => {
  if (!password) return null;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    return null;
  }
};

const PainelOperador = ({ 
  onSalvarAtividade, 
  atividadeInicial,
  onNavegarPara,
  manutentorLogado,
  setManutentorLogado,
  onLogoutManutentor
}) => {
  const [etapaAtualPainel, setEtapaAtualPainel] = useState(manutentorLogado ? (atividadeInicial ? 'manutentor_checklist' : 'aguardando_selecao') : 'manutentor_login');
  const { toast } = useToast();
  
  const [idMercedesInput, setIdMercedesInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  
  const [manutentorParaConfirmar, setManutentorParaConfirmar] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  useEffect(() => {
    if (!manutentorLogado) {
      setEtapaAtualPainel('manutentor_login');
    } else {
      setEtapaAtualPainel(atividadeInicial ? 'manutentor_checklist' : 'aguardando_selecao');
    }
  }, [manutentorLogado, atividadeInicial]);

  const resetFormulariosLogin = useCallback(() => {
    setIdMercedesInput('');
    setSenhaInput('');
    setNovaSenha('');
    setConfirmarNovaSenha('');
    setManutentorParaConfirmar(null);
  }, []);

  const handleVerificarIdMercedes = async () => {
    if (!supabase) return;

    const inputTrimmed = idMercedesInput.trim().replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    if (!inputTrimmed) {
      toast({ title: "Erro", description: "Preencha o campo de RE ou ID Mercedes.", variant: "destructive" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('*')
        .or(`re.ilike.${inputTrimmed},id_mercedes.ilike.${inputTrimmed}`);

      if (error || !data || data.length === 0) {
        toast({ title: "Erro", description: "Operador não encontrado.", variant: "destructive" });
        return;
      }

      const manutentorEncontrado = data[0];
      setManutentorParaConfirmar(manutentorEncontrado);

      if (manutentorEncontrado.primeiro_acesso || !manutentorEncontrado.senha_hash) {
        setEtapaAtualPainel('manutentor_primeiro_acesso_senha');
      } else {
        setEtapaAtualPainel('manutentor_login_senha');
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha na verificação.", variant: "destructive" });
    }
  };

  const handleConfirmacaoPrimeiroAcesso = (confirmado) => {
    if (confirmado) {
      setEtapaAtualPainel('manutentor_primeiro_acesso_senha');
    } else {
      resetFormulariosLogin();
    }
  };

  const handleCriarNovaSenha = async () => {
    if (novaSenha !== confirmarNovaSenha || novaSenha.length < 6) {
      toast({ title: "Erro", description: "Senhas devem ser iguais e ter no mínimo 6 caracteres.", variant: "destructive" });
      return;
    }

    try {
      const senhaHash = await simpleHash(novaSenha);
      const { data, error } = await supabase
        .from('operadores')
        .update({ primeiro_acesso: false, senha_hash: senhaHash })
        .eq('id', manutentorParaConfirmar.id)
        .select();

      if (error || !data || data.length === 0) {
        toast({ title: "Erro", description: "Falha ao registrar acesso.", variant: "destructive" });
        return;
      }

      setManutentorLogado(data[0]);
      onNavegarPara('selecao');
      toast({ title: "Sucesso!", description: "Acesso registrado!", variant: "success" });
      resetFormulariosLogin();
    } catch (err) {
      toast({ title: "Erro", description: "Falha no registro.", variant: "destructive" });
    }
  };

  const handleLoginComSenha = async () => {
    if (!senhaInput) return;

    if (!manutentorParaConfirmar?.senha_hash) {
      toast({ title: "Erro", description: "Conta sem senha definida. Reinicie o primeiro acesso.", variant: "destructive" });
      return;
    }

    try {
      const senhaHashInput = await simpleHash(senhaInput);
      if (manutentorParaConfirmar.senha_hash === senhaHashInput) {
        setManutentorLogado(manutentorParaConfirmar);
        onNavegarPara('selecao');
        toast({ title: "Sucesso!", description: `Bem-vindo, ${manutentorParaConfirmar.nome}!`, variant: "success" });
        resetFormulariosLogin();
      } else {
        toast({ title: "Erro", description: "Credenciais incorretas.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Erro", description: "Falha no login.", variant: "destructive" });
    }
  };

  const handleVoltarParaLoginEtapa = useCallback(() => {
    resetFormulariosLogin(); 
    setEtapaAtualPainel('manutentor_login');
  }, [resetFormulariosLogin]);

  const renderConteudoOperador = () => {
    switch (etapaAtualPainel) {
      case 'manutentor_login': return <FormularioLogin idMercedesInput={idMercedesInput} setIdMercedesInput={setIdMercedesInput} handleVerificarIdMercedes={handleVerificarIdMercedes} onCancelarLogout={onLogoutManutentor} />;
      case 'manutentor_login_senha': return <FormularioSenha manutentorParaConfirmar={manutentorParaConfirmar} senhaInput={senhaInput} setSenhaInput={setSenhaInput} handleLoginComSenha={handleLoginComSenha} onVoltarParaLogin={handleVoltarParaLoginEtapa} />;
      case 'manutentor_primeiro_acesso_senha': return <FormularioPrimeiroAcesso manutentorParaConfirmar={manutentorParaConfirmar} novaSenha={novaSenha} setNovaSenha={setNovaSenha} confirmarNovaSenha={confirmarNovaSenha} setConfirmarNovaSenha={setConfirmarNovaSenha} handleCriarNovaSenha={handleCriarNovaSenha} onVoltarParaLogin={handleVoltarParaLoginEtapa} />;
      case 'aguardando_selecao': return <p className="text-center text-muted-foreground mt-12 text-lg font-medium">Selecione uma atividade para iniciar.</p>;
      case 'manutentor_checklist': return <ExecutarChecklist atividade={atividadeInicial} numeroRE={manutentorLogado.re} onAtualizarAtividade={onSalvarAtividade} onVoltar={() => onNavegarPara('selecao')} />;
      default: return null;
    }
  };

  const mostrarHeader = etapaAtualPainel !== 'manutentor_checklist' && etapaAtualPainel !== 'aguardando_selecao';

  return (
    <div className="min-h-screen bg-background">
      {mostrarHeader && ( 
        <header className="bg-card/95 backdrop-blur-md shadow-md border-b border-border w-full fixed top-0 left-0 z-50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 w-full px-2 py-3 md:px-6 max-w-[1600px] mx-auto">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl md:text-2xl font-extrabold text-foreground">Painel do Manutentor</h1>
            </div>
            <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
              {etapaAtualPainel !== 'manutentor_login' ? ( 
                <Button onClick={etapaAtualPainel.includes('senha') ? handleVoltarParaLoginEtapa : onLogoutManutentor} variant="outline" className="flex-1 md:flex-auto">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
              ) : (
                <Button onClick={onLogoutManutentor} variant="ghost" className="flex-1 md:flex-auto text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
              )}
            </div>
          </div>
        </header>
      )}
      <div className="container mx-auto px-2 md:px-6 max-w-[1600px] pb-12">
        <div className={`${mostrarHeader ? 'pt-[140px] md:pt-[100px]' : ''}`}> 
           {renderConteudoOperador()}
        </div>
      </div>
    </div>
  );
};

export default PainelOperador;