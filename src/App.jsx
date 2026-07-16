// ============================================
// APP - Versão Final Integrada
// Checkflowing SaaS
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sun, Moon, Loader2, Settings, UserCog, LogOut, AlertTriangle, RefreshCw,
  WifiOff, ChevronDown, ChevronUp, CheckCircle2, XCircle, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { renderIconeCategoria } from '@/components/GerenciarCategorias';
import { CONFIG } from '@/config/empresa';
import { motion } from 'framer-motion';
import { useAppStateManager } from '@/hooks/useAppStateManager';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useTenant } from '@/hooks/useTenant.jsx';
import { useTrial } from '@/hooks/useTrial.jsx';
import { runFullDiagnostics, getHealthStatus } from '@/lib/supabaseConnectionDiagnostics';
import { retryConnection } from '@/lib/supabaseClient';
import LoginWhiteLabel from '@/pages/LoginWhiteLabel';
import DebugLogin from '@/pages/DebugLogin';
import TrialBanner, { TrialStatusMini } from '@/components/TrialBanner';
import PainelAdministrador from '@/components/PainelAdministrador';
import PainelOperador from '@/components/PainelOperador';
import SelecionarAtividade from '@/components/SelecionarAtividade';
import tenantService from '@/lib/tenantService';

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
  const { tema, alternarTema } = useTheme();
  const { toast } = useToast();
  const { usuario, isAuthenticated, logout } = useAuth();
  const { tenant: currentTenant } = useTenant();
  const { trialStatus } = useTrial();

  // Detectar se precisa mostrar login
  const [showLogin, setShowLogin] = useState(false);

  // Auth antigo (compatibilidade)
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
  const [hideConnectedStatus, setHideConnectedStatus] = useState(false);
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);

  useEffect(() => {
    const slug = tenantService.getSlugFromSubdomain();
    if (slug && !isAuthenticated && !carregandoDados) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [isAuthenticated, carregandoDados]);

  const executarDiagnostico = useCallback(async () => {
    setExecutandoDiagnostico(true);
    try {
      const resultado = await runFullDiagnostics();
      setDiagnostico(resultado);
      const status = getHealthStatus(resultado);
      if (status !== 'healthy') {
        setMostrarBannerErro(true);
      } else {
        setMostrarBannerErro(false);
      }
    } catch (error) {
      console.error('[App] Erro no diagnóstico:', error);
      setMostrarBannerErro(true);
    } finally {
      setExecutandoDiagnostico(false);
    }
  }, []);

  const tentarReconexao = useCallback(async () => {
    setExecutandoDiagnostico(true);
    try {
      const result = await retryConnection();
      if (result.success) {
        toast({ title: "Reconectado com sucesso!", variant: "success" });
        await executarDiagnostico();
      }
    } finally {
      setExecutandoDiagnostico(false);
    }
  }, [executarDiagnostico, toast]);

  useEffect(() => {
    executarDiagnostico();
  }, [executarDiagnostico]);

  useEffect(() => {
    if (diagnostico && getHealthStatus(diagnostico) === 'healthy' && erroCarregamento === null) {
      carregarDadosIniciais();
    }
  }, [diagnostico, carregarDadosIniciais, erroCarregamento]);

  const voltarParaSelecaoPrincipal = useCallback(() => {
    if (adminLogado) handleLogoutAdmin();
    setModoAtual('selecao');
    setAtividadeSelecionadaParaManutentor(null);
  }, [adminLogado, handleLogoutAdmin, setModoAtual, setAtividadeSelecionadaParaManutentor]);

  const handleSelecionarAtividadeManutentor = useCallback(atividade => {
    if (!manutentorLogado) {
      setModoAtual('manutentor_login');
      return;
    }
    setAtividadeSelecionadaParaManutentor(atividade);
    setModoAtual('manutentor_checklist');
  }, [manutentorLogado, setModoAtual, setAtividadeSelecionadaParaManutentor]);

  const logoutManutentorCompleto = useCallback(() => {
    appLogoutManutentor();
    setAtividadeSelecionadaParaManutentor(null);
    setModoAtual('selecao');
  }, [appLogoutManutentor, setAtividadeSelecionadaParaManutentor, setModoAtual]);

  const navegarPara = useCallback(novoModo => {
    if (novoModo === 'selecao') setAtividadeSelecionadaParaManutentor(null);
    setModoAtual(novoModo);
  }, [setModoAtual, setAtividadeSelecionadaParaManutentor]);

  // Redirecionar baseado no role após login
  useEffect(() => {
    if (isAuthenticated && usuario) {
      if (usuario.role === 'admin') {
        setModoAtual('admin');
        // Marcar admin logado no estado antigo para compatibilidade
        window.dispatchEvent(new CustomEvent('checkflowing:admin-logado', { detail: true }));
      } else {
        // Operador vai pra seleção de hubs
        setModoAtual('selecao');
      }
    }
  }, [isAuthenticated, usuario, setModoAtual]);

  // Loading inicial
  if (carregandoDados || executandoDiagnostico) {
    return (
      <div className="min-h-screen mercedes-gradient flex flex-col items-center justify-center p-4 text-foreground relative">
        <Loader2 className="w-16 h-16 animate-spin mb-4 text-primary" />
        <p className="text-xl font-medium">{executandoDiagnostico ? 'Conectando ao Supabase...' : 'Carregando dados...'}</p>
      </div>
    );
  }

  // Login White-Label
  if (window.location.pathname === '/debug') {
    return <DebugLogin />;
  }

  if (showLogin && !isAuthenticated) {
    return <LoginWhiteLabel />;
  }

  // Banner de erro de conexão
  const BannerErroConexao = () => {
    if (!mostrarBannerErro || !diagnostico) return null;
    const status = getHealthStatus(diagnostico);
    const checks = diagnostico.checks || {};
    const CheckItem = ({ label, check }) => {
      if (!check || check.status === 'pending') return null;
      return (
        <div className="flex items-center gap-2 text-sm">
          {check.status === 'pass' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
          <span>{label}</span>
        </div>
      );
    };
    return (
      <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="fixed top-4 left-4 right-4 z-[999] rounded-lg shadow-xl p-4 mx-auto max-w-4xl border-l-4 border-yellow-500 bg-yellow-50">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">Status: {status}</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <CheckItem label="Variáveis de Ambiente" check={checks.environment} />
              <CheckItem label="Cliente Supabase" check={checks.clientInit} />
              <CheckItem label="Conectividade" check={checks.network} />
              <CheckItem label="Autenticação" check={checks.authentication} />
            </div>
            <Button onClick={tentarReconexao} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" /> Tentar Reconectar
            </Button>
          </div>
          <button onClick={() => setMostrarBannerErro(false)}>✕</button>
        </div>
      </motion.div>
    );
  };

  const renderizarConteudo = () => {
    // Admin
    if (modoAtual === 'admin' && adminLogado) {
      return (
        <PainelAdministrador
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
        />
      );
    }

    // Manutentor
    if (modoAtual.startsWith('manutentor_')) {
      return (
        <PainelOperador
          onSalvarAtividade={handleSalvarAtividades}
          atividadeInicial={atividadeSelecionadaParaManutentor}
          onNavegarPara={navegarPara}
          manutentorLogado={manutentorLogado}
          setManutentorLogado={setManutentorLogado}
          onLogoutManutentor={logoutManutentorCompleto}
        />
      );
    }

    // Hub selection
    if (!categoriaSelecionada) {
      return (
        <div className="min-h-screen mercedes-gradient flex flex-col items-center justify-center p-4 pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-5xl w-full">
            <div className="text-center mb-10">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="mb-6">
                <img src="/logo.png" alt="Logo" className="w-28 h-28 mx-auto mb-4 drop-shadow-lg" />
              </motion.div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight drop-shadow-md">
                {currentTenant?.nome || CONFIG.nomeSistema}
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-200 font-medium drop-shadow">
                {currentTenant ? currentTenant.nome : `${CONFIG.nomeEmpresa} - ${CONFIG.unidade}`}
              </p>
              <p className="text-base text-gray-600 dark:text-gray-300 mt-2">Selecione um hub de atividades para continuar</p>
              {trialStatus && <div className="mt-3"><TrialStatusMini /></div>}
            </div>

            {categorias.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {categorias.map((cat, i) => (
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
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {atividades.filter(a => a.categoria_id === cat.id && a.status !== 'concluida').length} abertas
                        </p>
                      </div>
                    </div>
                    {cat.descricao && <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{cat.descricao}</p>}
                    <div className="h-1 w-12 rounded-full" style={{ backgroundColor: cat.cor }} />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-black/20 rounded-3xl backdrop-blur-md">
                <p className="text-xl font-medium mb-2">Nenhum hub cadastrado</p>
                <p className="text-base">Acesse o painel admin para criar categorias de atividades.</p>
                <Button onClick={() => setModoAtual('admin')} className="mt-6">
                  <Settings className="w-4 h-4 mr-2" /> Acessar Painel Admin
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    // Categoria selecionada
    const atividadesDaCategoria = atividades.filter(a => a.categoria_id === categoriaSelecionada.id);
    return (
      <div className="min-h-screen mercedes-gradient flex flex-col items-center justify-center p-4 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <div className="mb-6">
              <img src="/logo.png" alt="Logo" className="w-32 h-32 mx-auto mb-4 drop-shadow-lg" />
            </div>
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: categoriaSelecionada.cor + '33', color: categoriaSelecionada.cor }}>
                {renderIconeCategoria(categoriaSelecionada.icone, 'w-5 h-5')}
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white">
                {categoriaSelecionada.nome}
              </h1>
            </div>
            <button onClick={() => setCategoriaSelecionada(null)} className="mt-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mx-auto">
              <ArrowLeft className="w-4 h-4" /> Todos os hubs
            </button>
          </div>

          {manutentorLogado ? (
            <SelecionarAtividade
              atividades={atividadesDaCategoria}
              onSelecionarAtividade={handleSelecionarAtividadeManutentor}
              categoria={categoriaSelecionada}
            />
          ) : (
            <div className="text-center">
              <Button size="lg" className="px-10 py-8 text-xl" onClick={() => setModoAtual('manutentor_login')}>
                <UserCog className="w-7 h-7 mr-4" /> Login Manutentor
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className={`${tema} min-h-screen bg-background text-foreground relative overflow-x-hidden`}>
      <TrialBanner onUpgrade={() => toast({ title: 'Upgrade em breve' })} />
      <BannerErroConexao />

      <div className={`fixed ${modoAtual === 'manutentor_checklist' ? 'bottom-28' : 'bottom-6'} right-6 z-[100] flex flex-col gap-4`}>
        {modoAtual === 'selecao' && !adminLogado && !manutentorLogado && (
          <Button variant="outline" size="icon" onClick={() => setMostrarLoginAdmin(true)} className="bg-card/90 shadow-xl h-14 w-14 rounded-full">
            <Settings className="h-6 w-6" />
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={alternarTema} className="bg-card/90 shadow-xl h-14 w-14 rounded-full">
          {tema === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
        </Button>
      </div>

      <div>{renderizarConteudo()}</div>

      <Dialog open={mostrarLoginAdmin} onOpenChange={setMostrarLoginAdmin}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Login Administrador</DialogTitle>
            <DialogDescription>Insira a senha para acessar o painel.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="senha-admin">Senha</Label>
              <div className="relative">
                <Input id="senha-admin" type={mostrarSenhaAdmin ? 'text' : 'password'} value={senhaAdmin} onChange={e => setSenhaAdmin(e.target.value)} placeholder="Digite a senha..." onKeyPress={e => e.key === 'Enter' && handleLoginAdmin()} />
                <button type="button" onClick={() => setMostrarSenhaAdmin(!mostrarSenhaAdmin)} className="absolute right-2 top-1/2 -translate-y-1/2">
                  {mostrarSenhaAdmin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMostrarLoginAdmin(false); setSenhaAdmin(''); }}>Cancelar</Button>
            <Button onClick={handleLoginAdmin}>Entrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}

export default App;