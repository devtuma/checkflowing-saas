// ============================================
// SessaoAtiva - Página para quando usuário já está logado
// Mostra info da sessão + opção de logout
// ============================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Building, ArrowRight, Wifi } from 'lucide-react';

const SessaoAtiva = () => {
  const [sessao, setSessao] = useState(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem('checkflowing_session');
    if (sessionStr) {
      try {
        setSessao(JSON.parse(sessionStr));
      } catch (err) {
        console.error('Erro ao ler sessão:', err);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('checkflowing_session');
    window.location.reload();
  };

  const handleContinuar = () => {
    const usuario = sessao?.usuario;
    if (usuario?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/';
    }
  };

  if (!sessao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Nenhuma sessão ativa.</p>
            <Button onClick={() => window.location.href = '/'} className="mt-4">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = sessao.usuario?.role === 'admin';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Wifi className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Sessão Ativa</CardTitle>
            <CardDescription>
              Você já está logado no sistema
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Info do usuário */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isAdmin ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {isAdmin ? (
                    <Building className="w-5 h-5 text-purple-600" />
                  ) : (
                    <User className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{sessao.usuario?.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? 'Administrador' : 'Operador'}
                    {sessao.usuario?.re && ` • RE: ${sessao.usuario.re}`}
                  </p>
                </div>
              </div>

              {sessao.tenant && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="font-medium">{sessao.tenant.nome}</p>
                </div>
              )}
            </div>

            {/* Botões de ação */}
            <div className="space-y-2">
              <Button
                onClick={handleContinuar}
                className="w-full"
                size="lg"
              >
                {isAdmin ? 'Ir para Painel Admin' : 'Continuar para Atividades'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair (Logout)
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Sessão expira automaticamente em 24 horas
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SessaoAtiva;