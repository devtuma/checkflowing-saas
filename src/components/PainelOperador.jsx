import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import ExecutarChecklist from '@/components/ExecutarChecklist/index.jsx'; 
import { supabase } from '@/lib/supabaseClient';
import FormularioLogin from './PainelOperador/FormularioLogin';
import FormularioSenha from './PainelOperador/FormularioSenha';
import FormularioPrimeiroAcesso from './PainelOperador/FormularioPrimeiroAcesso';
import DialogoConfirmacao from './PainelOperador/DialogoConfirmacao';

const simpleHash = async (password) => {
  if (!password) return null;
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error("Erro ao gerar hash:", error);
    // Use toast here as well, after it's initialized
    // toast({ title: "Erro Interno", description: "Falha ao processar senha.", variant: "destructive" });
    return null;
  }
};

const PainelOperador = ({ 
  atividades, 
  salvarAtividades, 
  atividadeInicial, 
  modoInicial,
  onNavegarPara,
  manutentorLogado,
  setManutentorLogado,
  onLogoutManutentor
}) => {
  const [etapaAtualPainel, setEtapaAtualPainel] = useState('manutentor_login');
  const [atividadeSelecionadaInterna, setAtividadeSelecionadaInterna] = useState(null);
  const { toast } = useToast(); // Initialize useToast hook
  
  const [idMercedesInput, setIdMercedesInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  
  const [manutentorParaConfirmar, setManutentorParaConfirmar] = useState(null);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [mostrarDialogoConfirmacao, setMostrarDialogoConfirmacao] = useState(false);

  useEffect(() => {
    if (!manutentorLogado) {
      setEtapaAtualPainel('manutentor_login');
      setAtividadeSelecionadaInterna(null);
      resetFormulariosLogin();
      return;
    }

    if (modoInicial === 'manutentor_checklist' && atividadeInicial) {
      setAtividadeSelecionadaInterna(atividadeInicial);
      setEtapaAtualPainel('manutentor_checklist');
    } else if (modoInicial === 'selecao') {
      setEtapaAtualPainel('aguardando_selecao');
      setAtividadeSelecionadaInterna(null); 
    } else if (modoInicial === 'manutentor_login') {
      setEtapaAtualPainel('aguardando_selecao');
      if (typeof onNavegarPara === 'function') {
        onNavegarPara('selecao'); 
      }
    } else {
      setEtapaAtualPainel('aguardando_selecao');
    }
  }, [manutentorLogado, modoInicial, atividadeInicial, onNavegarPara]);

  useEffect(() => {
    if (manutentorLogado && atividadeInicial && etapaAtualPainel !== 'manutentor_checklist') {
      setAtividadeSelecionadaInterna(atividadeInicial);
      setEtapaAtualPainel('manutentor_checklist');
    }
  }, [manutentorLogado, atividadeInicial, etapaAtualPainel]);

  const resetFormulariosLogin = useCallback(() => {
    setIdMercedesInput('');
    setSenhaInput('');
    setNovaSenha('');
    setConfirmarNovaSenha('');
    setManutentorParaConfirmar(null);
  }, []);

  const handleVerificarIdMercedes = async () => {
    if (!idMercedesInput.trim() || idMercedesInput.trim().length !== 7) {
      toast({ title: "Erro", description: "ID Mercedes inválido. Deve ter 7 caracteres.", variant: "destructive" });
      return;
    }
    const idMercedesLowerCase = idMercedesInput.trim().toLowerCase();
    try {
      const { data: manutentoresData, error } = await supabase
        .from('operadores')
        .select('*');

      if (error) throw error;

      const manutentorEncontrado = manutentoresData.find(op => op.id_mercedes.toLowerCase() === idMercedesLowerCase);

      if (!manutentorEncontrado) {
        toast({ title: "Erro", description: "ID Mercedes não encontrado.", variant: "destructive" });
        return;
      }
      setManutentorParaConfirmar(manutentorEncontrado);
      if (manutentorEncontrado.primeiro_acesso) {
        setMostrarDialogoConfirmacao(true);
      } else {
        setEtapaAtualPainel('manutentor_login_senha');
      }
    } catch (err) {
      console.error("[PainelOperador] Erro ao verificar ID Mercedes:", err);
      toast({ title: "Erro de Sistema", description: `Não foi possível verificar o ID: ${err.message}`, variant: "destructive" });
    }
  };

  const handleConfirmacaoPrimeiroAcesso = (confirmado) => {
    setMostrarDialogoConfirmacao(false);
    if (confirmado) {
      setEtapaAtualPainel('manutentor_primeiro_acesso_senha');
    } else {
      resetFormulariosLogin();
    }
  };

  const handleCriarNovaSenha = async () => {
    if (!novaSenha || !confirmarNovaSenha) {
      toast({ title: "Erro", description: "Preencha ambos os campos de senha.", variant: "destructive" }); return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" }); return;
    }
    if (novaSenha.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" }); return;
    }
    try {
      const senhaHash = await simpleHash(novaSenha);
      if (!senhaHash) return;
      const { data, error } = await supabase
        .from('operadores')
        .update({ senha_hash: senhaHash, primeiro_acesso: false, atualizado_em: new Date().toISOString() })
        .eq('id', manutentorParaConfirmar.id)
        .select()
        .single();
      if (error) throw error;
      setManutentorLogado(data);
      onNavegarPara('selecao');
      toast({ title: "Sucesso!", description: "Senha criada e login efetuado!", variant: "success" });
      resetFormulariosLogin();
    } catch (err) {
      console.error("[PainelOperador] Erro ao criar nova senha:", err);
      toast({ title: "Erro de Sistema", description: `Não foi possível criar a senha: ${err.message}`, variant: "destructive" });
    }
  };

  const handleLoginComSenha = async () => {
    if (!senhaInput) {
      toast({ title: "Erro", description: "Senha é obrigatória.", variant: "destructive" }); return;
    }
    try {
      const senhaHashInput = await simpleHash(senhaInput);
      if (!senhaHashInput) return;
      if (manutentorParaConfirmar && manutentorParaConfirmar.senha_hash === senhaHashInput) {
        setManutentorLogado(manutentorParaConfirmar);
        onNavegarPara('selecao');
        toast({ title: "Login Bem-Sucedido!", description: `Bem-vindo, ${manutentorParaConfirmar.nome_completo}!`, variant: "success" });
        resetFormulariosLogin();
      } else {
        toast({ title: "Erro de Login", description: "ID Mercedes ou senha incorretos.", variant: "destructive" });
      }
    } catch (err) {
      console.error("[PainelOperador] Erro ao fazer login com senha:", err);
      toast({ title: "Erro de Sistema", description: `Não foi possível fazer login: ${err.message}`, variant: "destructive" });
    }
  };

  const atualizarAtividadeNoPainel = useCallback((atividadeAtualizada) => {
    const novasAtividades = atividades.map(atv => 
      atv.id === atividadeAtualizada.id ? atividadeAtualizada : atv
    );
    salvarAtividades(novasAtividades, manutentorLogado?.re); 
    setAtividadeSelecionadaInterna(atividadeAtualizada); 
  }, [atividades, salvarAtividades, manutentorLogado?.re]);


  const handleVoltarParaSelecaoApp = useCallback(() => {
    setAtividadeSelecionadaInterna(null); 
    if (typeof onNavegarPara === 'function') {
      onNavegarPara('selecao');
    }
  }, [onNavegarPara]);

  const handleVoltarParaLoginEtapa = useCallback(() => {
    resetFormulariosLogin(); 
    setSenhaInput('');
    setNovaSenha('');
    setConfirmarNovaSenha('');
    setEtapaAtualPainel('manutentor_login');
  }, [resetFormulariosLogin]);

  const handleCancelarLogin = () => {
    resetFormulariosLogin();
    if (typeof onLogoutManutentor === 'function') {
      onLogoutManutentor();
    } else {
      if (typeof onNavegarPara === 'function') {
        onNavegarPara('selecao');
      }
    }
  };

  const renderConteudoOperador = () => {
    switch (etapaAtualPainel) {
      case 'manutentor_login':
        return (
          <FormularioLogin
            idMercedesInput={idMercedesInput}
            setIdMercedesInput={setIdMercedesInput}
            handleVerificarIdMercedes={handleVerificarIdMercedes}
            onCancelarLogout={handleCancelarLogin} 
          />
        );
      case 'manutentor_login_senha':
        return (
          <FormularioSenha
            manutentorParaConfirmar={manutentorParaConfirmar}
            senhaInput={senhaInput}
            setSenhaInput={setSenhaInput}
            handleLoginComSenha={handleLoginComSenha}
            onVoltarParaLogin={handleVoltarParaLoginEtapa}
          />
        );
      case 'manutentor_primeiro_acesso_senha':
        return (
          <FormularioPrimeiroAcesso
            manutentorParaConfirmar={manutentorParaConfirmar}
            novaSenha={novaSenha}
            setNovaSenha={setNovaSenha}
            confirmarNovaSenha={confirmarNovaSenha}
            setConfirmarNovaSenha={setConfirmarNovaSenha}
            handleCriarNovaSenha={handleCriarNovaSenha}
            onVoltarParaLogin={handleVoltarParaLoginEtapa}
          />
        );
      case 'aguardando_selecao': 
        return <p className="text-center text-muted-foreground mt-10">Por favor, selecione uma atividade para iniciar.</p>;
      case 'manutentor_checklist':
        if (!atividadeSelecionadaInterna || !manutentorLogado) {
            handleVoltarParaSelecaoApp();
            return <p className="text-center text-muted-foreground mt-10">Dados inválidos, redirecionando...</p>;
        }
        return (
          <ExecutarChecklist 
            atividade={atividadeSelecionadaInterna}
            numeroRE={manutentorLogado.re}
            onAtualizarAtividade={atualizarAtividadeNoPainel}
            onVoltar={handleVoltarParaSelecaoApp}
          />
        );
      default:
        if(manutentorLogado){
          if (typeof onNavegarPara === 'function') onNavegarPara('selecao');
        } else {
           setEtapaAtualPainel('manutentor_login');
        }
        return null;
    }
  };

  const mostrarHeader = etapaAtualPainel !== 'manutentor_checklist' && etapaAtualPainel !== 'aguardando_selecao';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-2 sm:px-4 py-8">
        {mostrarHeader && ( 
          <div className="flex items-center justify-between mb-8 fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-sm p-3 sm:p-4 border-b border-border mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4">
               <img  
                src="https://storage.googleapis.com/hostinger-horizons-assets-prod/b2c2795e-d925-4369-87ee-21a5b4404bbd/5b6fec606e26bb8af5ec6b3f0c9d0686.png" 
                alt="Logo Mercedes-Benz" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">Painel do Manutentor</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Execute as atividades de limpeza ácida</p>
              </div>
            </div>
            {etapaAtualPainel !== 'manutentor_login' && ( 
              <Button
                onClick={ etapaAtualPainel === 'manutentor_login_senha' || etapaAtualPainel === 'manutentor_primeiro_acesso_senha' ? handleVoltarParaLoginEtapa : handleCancelarLogin}
                variant="outline"
                size="sm"
                className="bg-card/80 border-border text-foreground hover:bg-card"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                Voltar
              </Button>
            )}
          </div>
        )}
         <div className={`${mostrarHeader ? 'pt-24 md:pt-28' : ''}`}> 
            {renderConteudoOperador()}
        </div>
      </div>
      <DialogoConfirmacao
        mostrar={mostrarDialogoConfirmacao}
        setMostrar={setMostrarDialogoConfirmacao}
        manutentor={manutentorParaConfirmar}
        onConfirmar={handleConfirmacaoPrimeiroAcesso}
      />
    </div>
  );
};

export default PainelOperador;