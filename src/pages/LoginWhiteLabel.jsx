// ============================================
// LoginWhiteLabel - Página de Login White-Label
// Checkflowing SaaS
// Suporta login de:
// - Operador: RE (Registro) ou ID Mercedes + Senha
// - Admin: Email + Senha
// ============================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useTenant } from '@/hooks/useTenant.jsx';
import { supabase } from '@/lib/supabaseClient';
import { hashSenha } from '@/lib/authService';
import { Eye, EyeOff, Loader2, ShieldCheck, Wifi, WifiOff, User, Mail, Building, LogOut } from 'lucide-react';
import { testConnection } from '@/lib/supabaseClient';

const LoginWhiteLabel = () => {
  const { loading, error, isAuthenticated, login } = useAuth();
  const { cores, nomeFantasia, logoUrl } = useTenant();

  const [tipoLogin, setTipoLogin] = useState('operador'); // 'operador' | 'admin'
  const [credencial, setCredencial] = useState(''); // RE/ID (operador) ou Email (admin)
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState(null);
  const [conectado, setConectado] = useState(null);
  const [processando, setProcessando] = useState(false);

  // Testar conexão ao carregar
  useEffect(() => {
    const testarConexao = async () => {
      const resultado = await testConnection();
      setConectado(resultado.success);
    };
    testarConexao();
  }, []);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Redirecionar baseado no role
      const usuario = JSON.parse(localStorage.getItem('checkflowing_session') || '{}')?.usuario;
      if (usuario?.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    }
  }, [isAuthenticated]);

  // Função de logout
  const handleLogout = () => {
    localStorage.removeItem('checkflowing_session');
    window.location.reload();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroLogin(null);

    if (!credencial || !senha) {
      setErroLogin('Preencha todos os campos');
      return;
    }

    setProcessando(true);

    try {
      let resultado;

      if (tipoLogin === 'operador') {
        // Login por RE ou ID Mercedes
        resultado = await loginOperador(credencial, senha);
      } else {
        // Login admin por email
        resultado = await loginAdmin(credencial, senha);
      }

      if (!resultado.success) {
        setErroLogin(resultado.error);
      } else {
        // Sucesso - recarregar para aplicar
        window.location.reload();
      }
    } catch (err) {
      setErroLogin(err.message || 'Erro ao fazer login');
    } finally {
      setProcessando(false);
    }
  };

  // Login de operador (RE ou ID Mercedes)
  const loginOperador = async (reOuId, senha) => {
    try {
      // Buscar por RE ou ID Mercedes
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          tenants (
            id,
            nome,
            slug,
            plano,
            ativo
          )
        `)
        .or(`re.eq.${reOuId.trim().toLowerCase()},id_externo.eq.${reOuId.trim()}`)
        .eq('role', 'operador')
        .eq('ativo', true)
        .limit(1);

      if (error) {
        console.error('[LoginWhiteLabel] Erro:', error);
        return { success: false, error: 'Erro ao buscar usuário' };
      }

      if (!usuarios || usuarios.length === 0) {
        return { success: false, error: 'RE ou ID não encontrado' };
      }

      const usuario = usuarios[0];

      // Verificar tenant ativo
      if (!usuario.tenants?.ativo) {
        return { success: false, error: 'Empresa inativa. Contate o suporte.' };
      }

      // Verificar senha
      const senhaHash = await hashSenha(senha);
      if (usuario.senha_hash !== senhaHash) {
        return { success: false, error: 'Senha incorreta' };
      }

      // Salvar sessão
      const sessao = {
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          role: usuario.role,
          re: usuario.re,
          turno: usuario.turno,
          tenant_id: usuario.tenant_id,
          primeiro_acesso: usuario.primeiro_acesso
        },
        tenant: usuario.tenants,
        token: btoa(JSON.stringify({ id: usuario.id, exp: Date.now() + 86400000 }))
      };

      localStorage.setItem('checkflowing_session', JSON.stringify(sessao));
      return { success: true, data: sessao };

    } catch (err) {
      console.error('[LoginWhiteLabel] Erro:', err);
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  // Login de admin (email)
  const loginAdmin = async (email, senha) => {
    return await login(email, senha);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${cores?.primary || '#2563eb'}15 0%, ${cores?.background || '#ffffff'} 50%, ${cores?.accent || '#f59e0b'}10 100%)`
      }}
    >
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${cores?.primary || '#2563eb'} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div
            className="h-24 flex items-center justify-center"
            style={{ backgroundColor: cores?.primary || '#2563eb' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={nomeFantasia} className="h-12 object-contain" />
            ) : (
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">{nomeFantasia}</h1>
                <p className="text-white/80 text-sm">Checkflowing</p>
              </div>
            )}
          </div>

          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Acessar Sistema</CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para continuar
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Seletor de tipo de login */}
            <div className="flex gap-2 mb-4 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setTipoLogin('operador')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  tipoLogin === 'operador'
                    ? 'bg-background shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                Operador
              </button>
              <button
                type="button"
                onClick={() => setTipoLogin('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  tipoLogin === 'admin'
                    ? 'bg-background shadow-sm text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Building className="w-4 h-4" />
                Administrador
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Status de conexão */}
              <div className="flex items-center justify-center gap-2 text-sm">
                {conectado === null ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </span>
                ) : conectado ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <Wifi className="w-4 h-4" />
                    Conectado
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600">
                    <WifiOff className="w-4 h-4" />
                    Sem conexão
                  </span>
                )}
              </div>

              {erroLogin && (
                <Alert variant="destructive" className="animate-shake">
                  <AlertDescription>{erroLogin}</AlertDescription>
                </Alert>
              )}

              {/* Campo RE/ID ou Email */}
              <div className="space-y-2">
                <Label htmlFor="credencial">
                  {tipoLogin === 'operador' ? 'RE ou ID Mercedes' : 'Email'}
                </Label>
                <div className="relative">
                  {tipoLogin === 'operador' ? (
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  )}
                  <Input
                    id="credencial"
                    type={tipoLogin === 'operador' ? 'text' : 'email'}
                    placeholder={tipoLogin === 'operador' ? '123456 ou ABC1234' : 'admin@empresa.com'}
                    value={credencial}
                    onChange={(e) => setCredencial(e.target.value)}
                    className="text-lg p-6 pl-12"
                    autoComplete={tipoLogin === 'operador' ? 'username' : 'email'}
                    disabled={processando}
                    autoFocus
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="text-lg p-6 pr-12"
                    autoComplete="current-password"
                    disabled={processando}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-lg py-6 mt-2"
                style={{ backgroundColor: cores?.primary || '#2563eb' }}
                disabled={processando || conectado === false}
              >
                {processando ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Entrar como {tipoLogin === 'operador' ? 'Operador' : 'Administrador'}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
              <p>Precisa de ajuda?</p>
              <p className="mt-1">Entre em contato com o suporte da sua empresa</p>
            </div>
          </CardContent>
        </Card>

        {/* Credenciais de demo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4"
        >
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-center mb-2">🔑 Credenciais de Teste</p>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="bg-background p-2 rounded">
                  <p className="font-medium flex items-center gap-1">
                    <Building className="w-3 h-3" /> Admin (por email):
                  </p>
                  <p className="text-muted-foreground">admin@teste.com</p>
                  <p className="text-muted-foreground">admin123</p>
                </div>
                <div className="bg-background p-2 rounded">
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-3 h-3" /> Operador (por RE):
                  </p>
                  <p className="text-muted-foreground">RE: 1234567</p>
                  <p className="text-muted-foreground">operador123</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginWhiteLabel;