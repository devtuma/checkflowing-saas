// ============================================
// DebugLogin - Componente de Debug para Login
// Mostra passo-a-passo o que está acontecendo
// ============================================

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { hashSenha } from '@/lib/authService';

const DebugLogin = () => {
  const [logs, setLogs] = useState([]);
  const [email, setEmail] = useState('admin@teste.com');
  const [senha, setSenha] = useState('admin123');

  const addLog = (type, message, data = null) => {
    setLogs(prev => [...prev, { type, message, data, time: new Date().toISOString() }]);
  };

  const testarTudo = async () => {
    setLogs([]);
    addLog('info', '🔍 Iniciando diagnóstico completo...');

    try {
      // 1. Buscar usuário
      addLog('info', '1️⃣ Buscando usuário por email...');
      const { data: usuarios, error: userError } = await supabase
        .from('usuarios')
        .select('id, email, nome, role, senha_hash, tenant_id, ativo')
        .eq('email', email.toLowerCase().trim());

      if (userError) {
        addLog('error', '❌ Erro na busca:', userError);
        return;
      }

      if (!usuarios || usuarios.length === 0) {
        addLog('error', '❌ Nenhum usuário encontrado com esse email');
        return;
      }

      const usuario = usuarios[0];
      addLog('success', `✅ Usuário encontrado: ${usuario.email}`);
      addLog('info', '   - ID:', usuario.id);
      addLog('info', '   - Role:', usuario.role);
      addLog('info', '   - Ativo:', usuario.ativo);
      addLog('info', '   - senha_hash length:', usuario.senha_hash?.length || 0);
      addLog('info', '   - senha_hash preview:', usuario.senha_hash?.substring(0, 20) + '...');

      // 2. Gerar hash da senha digitada
      addLog('info', '2️⃣ Gerando hash SHA256 da senha digitada...');
      const hashDigitado = await hashSenha(senha);
      addLog('info', '   - Hash digitado:', hashDigitado.substring(0, 20) + '...');

      // 3. Comparar
      addLog('info', '3️⃣ Comparando hashes...');
      if (usuario.senha_hash === hashDigitado) {
        addLog('success', '✅ SENHAS COINCIDEM! Login deveria funcionar.');
      } else {
        addLog('error', '❌ SENHAS NÃO COINCIDEM!');
        addLog('warn', '   Hash no banco:', usuario.senha_hash);
        addLog('warn', '   Hash digitado:', hashDigitado);
      }

      // 4. Verificar tenant
      addLog('info', '4️⃣ Buscando tenant...');
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', usuario.tenant_id)
        .single();

      if (tenantError) {
        addLog('error', '❌ Erro ao buscar tenant:', tenantError);
      } else {
        addLog('success', `✅ Tenant encontrado: ${tenant.nome}`);
        addLog('info', '   - Slug:', tenant.slug);
        addLog('info', '   - Ativo:', tenant.ativo);
      }

    } catch (err) {
      addLog('error', '❌ Erro inesperado:', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Debug Login</h1>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-bold mb-4">Teste de Login</h2>
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 bg-gray-700 rounded"
            />
            <input
              type="text"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              className="w-full p-3 bg-gray-700 rounded"
            />
            <button
              onClick={testarTudo}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold"
            >
              🔍 Diagnosticar
            </button>
          </div>
        </div>

        <div className="bg-black p-6 rounded-lg font-mono text-sm">
          <h2 className="text-xl font-bold mb-4">Logs</h2>
          {logs.length === 0 ? (
            <p className="text-gray-500">Clique em "Diagnosticar" para começar</p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`mb-2 p-2 rounded ${
                  log.type === 'error' ? 'bg-red-900/30 text-red-300' :
                  log.type === 'success' ? 'bg-green-900/30 text-green-300' :
                  log.type === 'warn' ? 'bg-yellow-900/30 text-yellow-300' :
                  'bg-gray-800 text-gray-300'
                }`}
              >
                <span className="text-xs opacity-60">[{new Date(log.time).toLocaleTimeString()}]</span>
                {' '}
                {log.message}
                {log.data && (
                  <pre className="ml-4 mt-1 text-xs opacity-80">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 text-sm text-gray-400">
          <p>📋 Use esta página para entender o que está acontecendo no login.</p>
          <p>📋 Os hashes devem coincidir para o login funcionar.</p>
        </div>
      </div>
    </div>
  );
};

export default DebugLogin;