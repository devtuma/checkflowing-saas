import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import PainelAdministrador from '@/components/PainelAdministrador';
import PainelOperador from '@/components/PainelOperador/index.jsx';
import SelecionarAtividade from '@/components/SelecionarAtividade';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sun, Moon, Loader2, Settings, UserCog, LogOut, AlertTriangle, RefreshCw, WifiOff, Stethoscope, ChevronDown, ChevronUp, CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { renderIconeCategoria } from '@/components/GerenciarCategorias';
import { CONFIG } from '@/config/empresa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStateManager } from '@/hooks/useAppStateManager';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { runFullDiagnostics, getHealthStatus } from '@/lib/supabaseConnectionDiagnostics';
import { retryConnection } from '@/lib/supabaseClient';

function App() {
  const {
    modoAtual,
    setModoAtual,
    atividades,
    responsaveisDisponiveis,
    manutentores,
    categorias,
    carregandoDados,
    erroCarregamento,
    atividadeSelecionadaParaManutentor,
    setAtividadeSelecionadaParaManutentor,
    handleSalvarAtividades,
    handleSalvarResponsaveis,
    handleSalvarManutentores,
    handleSalvarCategoria,
    handleExcluirCategoria,
    carregarDadosIniciais
  } = useAppStateManager();

  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);
  const {
    tema,
    alternarTema
  } = useTheme();
  const {
    toast
  } = useToast();
  const {
    adminLogado,
    manutentorLogado,
    setManutentorLogado,
    mostrarLoginAdmin,
    setMostrarLoginAdmin,
    senhaAdmin,
    setSenhaAdmin,
    handleLoginAdmin,
    handleLogoutAdmin,
    handleLogoutManutentor: appLogoutManutentor
  } = useAuth(setModoAtual);
  
  const [diagnostico, setDiagnostico] = useState(null);
  const [executandoDiagnostico, setExecutandoDiagnostico] = useState(false);
  const [mostrarBannerErro, setMostrarBannerErro] = useState(false);
  const [mostrarDebugInfo, setMostrarDebugInfo] = useState(false);
  const [hideConnectedStatus, setHideConnectedStatus] = useState(false);
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);
  
  const executarDiagnostico = useCallback(async () => {
    setExecutandoDiagnostico(true);
    setMostrarDebugInfo(false);
    try {
      const resultado = await runFullDiagnostics();
      setDiagnostico(resultado);
      const status = getHealthStatus(resultado);
      if (status !== 'healthy') {
        setMostrarBannerErro(true);
        toast({
          title: "Problema de Conexão",
          description: "Falha ao conectar aos serviços em nuvem.",
          variant: "destructive",
          duration: 5000
        });
      } else {
        setMostrarBannerErro(false);
      }
    } catch (error) {
      console.error('[App] Erro ao executar diagnóstico:', error);
      setMostrarBannerErro(true);
    } finally {
      setExecutandoDiagnostico(false);
    }
  }, [toast]);
  
  const tentarReconexao = useCallback(async () => {
    setExecutandoDiagnostico(true);
    const result = await retryConnection();
    if (result.success) {
      toast({
        title: "Reconectado com sucesso!",
        variant: "success"
      });
      await executarDiagnostico();
      if (diagnostico && getHealthStatus(diagnostico) === 'healthy') {
        carregarDadosIniciais();
      }
    } else {
      toast({
        title: "Falha na reconexão",
        description: result.error,
        variant: "destructive"
      });
      await executarDiagnostico();
    }
    setExecutandoDiagnostico(false);
  }, [executarDiagnostico, toast, carregarDadosIniciais, diagnostico]);
  
  useEffect(() => {
    executarDiagnostico();
  }, [executarDiagnostico]);
  
  useEffect(() => {
    if (diagnostico && getHealthStatus(diagnostico) === 'healthy' && erroCarregamento === null) {
      carregarDadosIniciais();
    }
  }, [diagnostico, carregarDadosIniciais, erroCarregamento]);

  useEffect(() => {
    if (!executandoDiagnostico && diagnostico && getHealthStatus(diagnostico) === 'healthy') {
      setHideConnectedStatus(false);
      const timer = setTimeout(() => {
        setHideConnectedStatus(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setHideConnectedStatus(false);
    }
  }, [executandoDiagnostico, diagnostico]);
  
  const voltarParaSelecaoPrincipal = useCallback(() => {
    if (adminLogado) handleLogoutAdmin();
    setModoAtual('selecao');
    setAtividadeSelecionadaParaManutentor(null);
  }, [adminLogado, handleLogoutAdmin, setModoAtual, setAtividadeSelecionadaParaManutentor]);
  
  const handleSelecionarAtividadeManutentor = useCallback(atividade => {
    if (!manutentorLogado) {
      toast({
        title: "Atenção",
        description: "Faça login para iniciar uma atividade.",
        variant: "default"
      });
      setModoAtual('manutentor_login');
      return;
    }
    setAtividadeSelecionadaParaManutentor(atividade);
    setModoAtual('manutentor_checklist');
  }, [manutentorLogado, setModoAtual, setAtividadeSelecionadaParaManutentor, toast]);
  
  const logoutManutentorCompleto = useCallback(() => {
    appLogoutManutentor();
    setAtividadeSelecionadaParaManutentor(null);
    setModoAtual('selecao');
  }, [appLogoutManutentor, setAtividadeSelecionadaParaManutentor, setModoAtual]);
  
  const navegarPara = useCallback(novoModo => {
    if (novoModo === 'selecao') setAtividadeSelecionadaParaManutentor(null);
    setModoAtual(novoModo);
  }, [setModoAtual, setAtividadeSelecionadaParaManutentor]);
  
  const BannerErroConexao = () => {
    if (!mostrarBannerErro || !diagnostico) return null;
    const status = getHealthStatus(diagnostico);
    const checks = diagnostico.checks || {};
    const CheckItem = ({
      label,
      check
    }) => {
      if (!check || check.status === 'pending') return null;
      return <div className="flex items-center gap-2 text-sm">
          {check.status === 'pass' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
          <span className={check.status === 'pass' ? 'text-gray-600 dark:text-gray-300' : 'font-bold text-red-700 dark:text-red-400'}>{label}</span>
        </div>;
    };
    const getBannerColor = () => {
      if (status === 'critical') return 'bg-red-100 border-red-500 dark:bg-red-950/50';
      if (status === 'offline') return 'bg-orange-100 border-orange-500 dark:bg-orange-950/50';
      return 'bg-yellow-100 border-yellow-500 dark:bg-yellow-950/50';
    };
    return <motion.div initial={{
      opacity: 0,
      y: -50
    }} animate={{
      opacity: 1,
      y: 0
    }} className={`fixed top-4 left-4 right-4 z-[999] rounded-lg shadow-xl p-4 mx-auto max-w-4xl border-l-4 ${getBannerColor()}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            {status === 'offline' ? <WifiOff className="w-8 h-8 text-orange-600 dark:text-orange-400" /> : <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />}
          </div>
          
          <div className="flex-1 text-foreground">
            <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
              <span>
                {status === 'critical' && 'Erro de Configuração (Variáveis Ausentes)'}
                {status === 'offline' && 'Sem Conexão / Problema de Rede'}
                {status === 'unauthorized' && 'Erro de Autenticação Supabase'}
                {status === 'degraded' && 'Problemas de Conexão Detectados'}
              </span>
              <span className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded">
                URL: {import.meta.env.VITE_SUPABASE_URL?.replace(/^https?:\/\//, '').split('.')[0] || 'N/A'}...
              </span>
            </h3>
            
            <div className="bg-background/40 p-3 rounded-md mb-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              <CheckItem label="Variáveis de Ambiente (.env)" check={checks.environment} />
              <CheckItem label="Inicialização do Cliente" check={checks.clientInit} />
              <CheckItem label="Conectividade de Rede/CORS" check={checks.network} />
              <CheckItem label="Autenticação (Anon Key)" check={checks.authentication} />
            </div>

            {diagnostico.recommendations && diagnostico.recommendations.length > 0 && <div className="mb-4">
                <p className="font-semibold text-sm mb-1">Recomendações:</p>
                <ul className="text-sm space-y-1 pl-5 list-disc text-muted-foreground">
                  {diagnostico.recommendations.map((rec, idx) => <li key={idx} className="font-medium text-foreground">{rec}</li>)}
                </ul>
              </div>}
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={tentarReconexao} variant="default" size="sm" disabled={executandoDiagnostico} className="shadow-sm">
                {executandoDiagnostico ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Tentar Reconectar
              </Button>
              <Button onClick={executarDiagnostico} variant="outline" size="sm" disabled={executandoDiagnostico}>
                <Stethoscope className="w-4 h-4 mr-2" />
                Rodar Diagnóstico
              </Button>
              <Button onClick={() => setMostrarDebugInfo(!mostrarDebugInfo)} variant="ghost" size="sm" className="ml-auto text-xs">
                Info Debug {mostrarDebugInfo ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </Button>
            </div>

            <AnimatePresence>
              {mostrarDebugInfo && <motion.div initial={{
              height: 0,
              opacity: 0
            }} animate={{
              height: 'auto',
              opacity: 1
            }} exit={{
              height: 0,
              opacity: 0
            }} className="overflow-hidden">
                  <pre className="mt-4 p-3 bg-black/90 text-green-400 rounded text-xs overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {JSON.stringify(diagnostico, null, 2)}
                  </pre>
                </motion.div>}
            </AnimatePresence>
          </div>
          
          <button onClick={() => setMostrarBannerErro(false)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
      </motion.div>;
  };
  
  const ConnectionStatusIndicator = () => {
    if (executandoDiagnostico) {
      return (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-6 z-50 flex items-center bg-card shadow-lg border border-border px-4 py-2.5 rounded-full text-sm font-medium">
            <Loader2 className="w-4 h-4 mr-2.5 animate-spin text-primary" />
            <span className="text-card-foreground">Testando conexão...</span>
          </motion.div>
        </AnimatePresence>
      );
    }
    if (diagnostico) {
      const isHealthy = getHealthStatus(diagnostico) === 'healthy';
      if (isHealthy && hideConnectedStatus) return null;

      return (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-6 left-6 z-50 flex items-center shadow-lg border px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${isHealthy ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300' : 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-300'}`}>
            {isHealthy ? <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Conectado
              </> : <>
                <XCircle className="w-4 h-4 mr-2" />
                Falha na Conexão
              </>}
          </motion.div>
        </AnimatePresence>
      );
    }
    return null;
  };
  
  if (carregandoDados || executandoDiagnostico) {
    return <div className="min-h-screen mercedes-gradient flex flex-col items-center justify-center p-4 text-foreground relative">
        <BannerErroConexao />
        <Loader2 className="w-16 h-16 animate-spin mb-4 text-primary" />
        <p className="text-xl font-medium">
          {executandoDiagnostico ? 'Analisando conexão com Supabase...' : 'Carregando dados...'}
        </p>
        <ConnectionStatusIndicator />
      </div>;
  }
  
  const renderizarConteudo = () => {
    if (modoAtual === 'admin' && adminLogado) {
      return <PainelAdministrador
        atividades={atividades}
        salvarAtividades={handleSalvarAtividades}
        responsaveisDisponiveis={responsaveisDisponiveis}
        salvarResponsaveis={handleSalvarResponsaveis}
        manutentores={manutentores}
        salvarManutentores={handleSalvarManutentores}
        categorias={categorias}
        salvarCategoria={handleSalvarCategoria}
        excluirCategoria={handleExcluirCategoria}
        voltarParaSelecao={voltarParaSelecaoPrincipal}
      />;
    }
    if (modoAtual.startsWith('manutentor_')) {
      return <PainelOperador onSalvarAtividade={handleSalvarAtividades} atividadeInicial={atividadeSelecionadaParaManutentor} onNavegarPara={navegarPara} manutentorLogado={manutentorLogado} setManutentorLogado={setManutentorLogado} onLogoutManutentor={logoutManutentorCompleto} />;
    }

    // Hub selection screen
    if (!categoriaSelecionada) {
      return (
        <div className="min-h-screen mercedes-gradient flex flex-col items-center justify-center p-4 pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-5xl w-full">
            <div className="text-center mb-10">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6">
                <img src="/logo.png" alt="Mercedes-Benz Logo" className="w-28 h-28 mx-auto mb-4 drop-shadow-lg" />
              </motion.div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight drop-shadow-md">{CONFIG.nomeSistema}</h1>
              <p className="text-xl text-gray-700 dark:text-gray-200 font-medium drop-shadow">{CONFIG.nomeEmpresa} - {CONFIG.unidade}</p>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-2">Selecione um hub de atividades para continuar</p>
            </div>

            {categorias.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {categorias.map((cat, i) => {
                  const atividadesAbertas = atividades.filter(a => a.categoria_id === cat.id && a.status !== 'concluida').length;
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCategoriaSelecionada(cat)}
                      className="bg-white/80 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-3xl p-7 text-left shadow-xl hover:shadow-2xl transition-all w-full"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.cor + '22', color: cat.cor }}>
                          {renderIconeCategoria(cat.icone, 'w-7 h-7')}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cat.nome}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{atividadesAbertas} {atividadesAbertas === 1 ? 'atividade aberta' : 'atividades abertas'}</p>
                        </div>
                      </div>
                      {cat.descricao && <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{cat.descricao}</p>}
                      <div className="h-1 w-12 rounded-full" style={{ backgroundColor: cat.cor }} />
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-black/20 rounded-3xl backdrop-blur-md">
                <p className="text-xl font-medium mb-2">Nenhum hub cadastrado</p>
                <p className="text-base">Acesse o painel admin para criar categorias de atividades.</p>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    // Hub screen (category selected)
    const atividadesDaCategoria = atividades.filter(a => a.categoria_id === categoriaSelecionada.id);
    return (
      <div className="min-h-screen mercedes-gradient flex flex-col items-center justify-center p-4 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6 relative">
              <img src="/logo.png" alt="Mercedes-Benz Logo" className="w-32 h-32 mx-auto mb-4 drop-shadow-lg" />
            </motion.div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: categoriaSelecionada.cor + '33', color: categoriaSelecionada.cor }}>
                {renderIconeCategoria(categoriaSelecionada.icone, 'w-5 h-5')}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white drop-shadow-md no-underline tracking-tight">
                {categoriaSelecionada.nome}
              </h1>
            </div>
            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-200 drop-shadow font-medium">{CONFIG.nomeEmpresa} - {CONFIG.unidade}</p>
            <button onClick={() => { setCategoriaSelecionada(null); }} className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 mx-auto transition-colors">
              <ArrowLeft className="w-4 h-4" /> Todos os hubs
            </button>
          </div>

          {manutentorLogado
            ? <SelecionarAtividade atividades={atividadesDaCategoria} onSelecionarAtividade={handleSelecionarAtividadeManutentor} categoria={categoriaSelecionada} />
            : (
              <div className="text-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-8 text-xl font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-2xl min-h-[64px]" onClick={() => setModoAtual('manutentor_login')}>
                  <UserCog className="w-7 h-7 mr-4" /> Login Manutentor
                </Button>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="mt-16 bg-white/70 dark:bg-black/40 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-3xl mx-auto">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    Sistema de Controle BLP — {categoriaSelecionada.nome}
                  </h3>
                  <div className="h-1.5 w-24 rounded-full mb-6 mx-auto" style={{ backgroundColor: categoriaSelecionada.cor }} />
                  {categoriaSelecionada.descricao && (
                    <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 font-medium">{categoriaSelecionada.descricao}</p>
                  )}
                </motion.div>
              </div>
            )
          }
        </motion.div>
      </div>
    );
  };
  
  return <div className={`${tema} min-h-screen bg-background text-foreground relative overflow-x-hidden`}>
      <BannerErroConexao />
      <ConnectionStatusIndicator />
      
      <div className={`fixed ${modoAtual === 'manutentor_checklist' ? 'bottom-28' : 'bottom-6'} right-6 z-[100] flex flex-col gap-4 transition-all`}>
        {modoAtual === 'selecao' && !adminLogado && !manutentorLogado && <Button variant="outline" size="icon" onClick={() => setMostrarLoginAdmin(true)} className="bg-card/90 backdrop-blur-md shadow-xl border-border h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:shadow-2xl">
            <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-card-foreground" /><span className="sr-only">Admin</span>
          </Button>}
        <Button variant="outline" size="icon" onClick={alternarTema} className="bg-card/90 backdrop-blur-md shadow-xl border-border h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:shadow-2xl">
          {tema === 'light' ? <Moon className="h-6 w-6 sm:h-7 sm:w-7 text-card-foreground" /> : <Sun className="h-6 w-6 sm:h-7 sm:w-7 text-card-foreground" />}
        </Button>
        {manutentorLogado && modoAtual === 'selecao' && <Button variant="destructive" size="icon" onClick={logoutManutentorCompleto} className="shadow-xl h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:shadow-2xl">
             <LogOut className="h-6 w-6 sm:h-7 sm:w-7" />
           </Button>}
      </div>
      
      <div className={`${modoAtual === 'admin' && adminLogado || modoAtual.startsWith('manutentor_') ? '' : ''}`}>
        {renderizarConteudo()}
      </div>
      <Dialog open={mostrarLoginAdmin} onOpenChange={setMostrarLoginAdmin}>
        <DialogContent className="sm:max-w-[480px] bg-background text-foreground rounded-2xl p-6 sm:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold">Login Administrador</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mt-2">Insira a senha para acessar o painel de administração.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="senha-admin" className="text-sm font-semibold text-muted-foreground">Senha</Label>
              <div className="relative">
                <Input id="senha-admin" type={mostrarSenhaAdmin ? 'text' : 'password'} value={senhaAdmin} onChange={e => setSenhaAdmin(e.target.value)} className="w-full text-lg p-4 min-h-[56px] rounded-xl pr-14" placeholder="Digite a senha..." onKeyPress={e => e.key === 'Enter' && handleLoginAdmin()} />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAdmin(!mostrarSenhaAdmin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={mostrarSenhaAdmin ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenhaAdmin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6 gap-3 sm:gap-0">
            <Button type="button" variant="outline" className="min-h-[48px] px-6 text-base font-medium rounded-xl" onClick={() => { setMostrarLoginAdmin(false); setSenhaAdmin(''); }}>Cancelar</Button>
            <Button type="submit" onClick={handleLoginAdmin} className="min-h-[48px] px-8 text-base font-medium rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">Entrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>;
}

export default App;