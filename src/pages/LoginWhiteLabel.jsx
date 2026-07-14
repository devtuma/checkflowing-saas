// ============================================
// LoginWhiteLabel - Página de Login White-Label
// Checkflowing SaaS
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
import { Eye, EyeOff, Loader2, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { testConnection } from '@/lib/supabaseClient';

const LoginWhiteLabel = () => {
  const { login, loading, error, isAuthenticated } = useAuth();
  const { cores, nomeFantasia, logoUrl } = useTenant();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erroLogin, setErroLogin] = useState(null);
  const [conectado, setConectado] = useState(null);

  // Testar conexão ao carregar
  useEffect(() => {
    const testarConexao = async () => {
      const resultado = await testConnection();
      setConectado(resultado.success);
    };
    testarConexao();
  }, []);

  // Se já está logado, não mostra login
  useEffect(() => {
    if (isAuthenticated) {
      // Redirecionar para app (implementar depois)
      console.log('[Login] Usuário já autenticado');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroLogin(null);

    if (!email || !senha) {
      setErroLogin('Preencha email e senha');
      return;
    }

    const result = await login(email, senha);

    if (!result.success) {
      setErroLogin(result.error);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${cores?.primary || '#2563eb'}15 0%, ${cores?.background || '#ffffff'} 50%, ${cores?.accent || '#f59e0b'}10 100%)`
      }}
    >
      {/* Background Pattern */}
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
        {/* Card de Login */}
        <Card className="shadow-2xl border-0 overflow-hidden">
          {/* Header com logo */}
          <div
            className="h-24 flex items-center justify-center"
            style={{ backgroundColor: cores?.primary || '#2563eb' }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={nomeFantasia}
                className="h-12 object-contain"
              />
            ) : (
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white">{nomeFantasia}</h1>
                <p className="text-white/80 text-sm">Checkflowing</p>
              </div>
            )}
          </div>

          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              Acessar Sistema
            </CardTitle>
            <CardDescription className="text-center">
              Digite suas credenciais para continuar
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Status de conexão */}
              <div className="flex items-center justify-center gap-2 text-sm">
                {conectado === null ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando conexão...
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

              {/* Erro de login */}
              {erroLogin && (
                <Alert variant="destructive" className="animate-shake">
                  <AlertDescription>{erroLogin}</AlertDescription>
                </Alert>
              )}

              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-lg p-6"
                  autoComplete="email"
                  disabled={loading}
                />
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
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {mostrarSenha ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão Entrar */}
              <Button
                type="submit"
                className="w-full text-lg py-6 mt-2"
                style={{ backgroundColor: cores?.primary || '#2563eb' }}
                disabled={loading || conectado === false}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            {/* Rodapé */}
            <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
              <p>Precisa de ajuda?</p>
              <p className="mt-1">
                Entre em contato com o suporte da sua empresa
              </p>
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
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-background p-2 rounded">
                  <p className="font-medium">Admin:</p>
                  <p className="text-muted-foreground">admin@teste.com</p>
                  <p className="text-muted-foreground">admin123</p>
                </div>
                <div className="bg-background p-2 rounded">
                  <p className="font-medium">Operador:</p>
                  <p className="text-muted-foreground">operador@teste.com</p>
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
