// ============================================
// CHECKFLOWING SAAS - SUPABASE CLIENT
// Projeto: bukwybvvgciiqaxvrhvq.supabase.co
// ============================================

import { createClient } from '@supabase/supabase-js';

// URL e chave do Supabase (do .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bukwybvvgciiqaxvrhvq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Validação
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] ❌ Credenciais ausentes. Verifique o arquivo .env.local');
  console.error('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? '✅ OK' : '❌ FALTANDO');
  console.error('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ OK' : '❌ FALTANDO');
}

let supabaseInstance = null;
let initializationError = null;

// Cliente Supabase
try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'checkflowing-saas',
      },
    },
    db: {
      schema: 'public',
    },
  });
  console.log('[Supabase] ✅ Cliente inicializado');
} catch (err) {
  console.error('[Supabase] ❌ Erro ao criar cliente:', err);
  initializationError = err;
}

export const supabase = supabaseInstance;

// Teste de conexão simples
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('tenants').select('id').limit(1);

    if (error) {
      console.error('[Supabase] ❌ Erro de conexão:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Supabase] ✅ Conexão estabelecida!');
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] ❌ Erro:', err.message);
    return { success: false, error: err.message };
  }
};

// Teste completo de conexão (para diagnóstico)
export const testSupabaseConnection = async () => {
  const results = {
    clientInitialized: !!supabaseInstance,
    networkConnectivity: false,
    authenticationValid: false,
    canFetchData: false,
    errors: [],
    details: { supabaseUrl }
  };

  if (!supabaseInstance) {
    results.errors.push(initializationError?.message || 'Cliente não inicializado');
    return results;
  }

  try {
    const { data, error, status } = await supabase
      .from('atividades')
      .select('id')
      .limit(1);

    results.details.httpStatus = status;

    if (error) {
      results.errors.push(`Erro: ${error.message} (Code: ${error.code || 'N/A'})`);

      if (error.code === 'PGRST116') {
        results.errors.push('Erro de acesso à tabela. Verifique as políticas de RLS.');
        results.authenticationValid = true;
        results.networkConnectivity = true;
      } else if (error.code === '42P01') {
        results.errors.push('Tabela não existe, mas a conexão foi estabelecida.');
        results.authenticationValid = true;
        results.networkConnectivity = true;
      }

      return results;
    }

    results.networkConnectivity = true;
    results.authenticationValid = true;
    results.canFetchData = true;
    results.details.connectionSuccessful = true;

  } catch (error) {
    results.errors.push(`Falha: ${error.message}`);
  }

  return results;
};

// Retentar conexão
export const retryConnection = async () => {
  console.log('[Supabase] Tentando reconectar...');

  try {
    // Simplesmente testa a conexão novamente
    const result = await testSupabaseConnection();
    return { success: result.networkConnectivity, error: result.errors[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const getSupabaseInitializationError = () => initializationError;

export default supabase;