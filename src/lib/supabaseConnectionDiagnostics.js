import { testSupabaseConnection, getSupabaseInitializationError } from './supabaseClient';

const checkEnvironmentVariables = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const status = {
    urlPresent: !!url,
    urlValid: url ? url.startsWith('https://') : false,
    keyPresent: !!key,
    keyValid: key ? key.length > 20 : false,
    issues: []
  };

  if (!status.urlPresent) status.issues.push("Missing VITE_SUPABASE_URL - check .env file");
  else if (!status.urlValid) status.issues.push("VITE_SUPABASE_URL must start with https://");

  if (!status.keyPresent) status.issues.push("Missing VITE_SUPABASE_ANON_KEY - check .env file");
  else if (!status.keyValid) status.issues.push("VITE_SUPABASE_ANON_KEY appears to be too short/invalid");

  return status;
};

const checkNetworkConnectivity = async () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return { reachable: false, corsIssues: false, error: "No URL to ping" };

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'OPTIONS', 
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
      }
    });

    const hasCorsHeaders = !!response.headers.get('access-control-allow-origin');

    return {
      reachable: true,
      statusCode: response.status,
      corsIssues: !hasCorsHeaders && response.status === 0, 
      rawHeaders: Array.from(response.headers.entries()).reduce((acc, [key, val]) => ({...acc, [key]: val}), {}),
      error: null
    };
  } catch (error) {
    return {
      reachable: false,
      corsIssues: error.message.includes('fetch') || error.message.includes('CORS'),
      error: error.message
    };
  }
};

const checkAuthStatus = async () => {
  const testResults = await testSupabaseConnection();
  return {
    valid: testResults.authenticationValid,
    error: testResults.errors.find(e => e.includes('Autenticação') || e.includes('Authentication')) || null
  };
};

export const runFullDiagnostics = async () => {
  console.log('--- [Diagnostics] Iniciando Verificação Completa ---');
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    overallStatus: 'unknown',
    checks: {
      environment: { status: 'pending', details: null },
      clientInit: { status: 'pending', details: null },
      network: { status: 'pending', details: null },
      authentication: { status: 'pending', details: null },
    },
    recommendations: [],
    raw: {}
  };

  const envCheck = checkEnvironmentVariables();
  diagnostics.checks.environment.details = envCheck;
  if (envCheck.issues.length > 0) {
    diagnostics.checks.environment.status = 'fail';
    diagnostics.recommendations.push(...envCheck.issues);
  } else {
    diagnostics.checks.environment.status = 'pass';
  }

  const initError = getSupabaseInitializationError();
  if (initError) {
    diagnostics.checks.clientInit.status = 'fail';
    diagnostics.checks.clientInit.details = initError.message;
    diagnostics.recommendations.push("Client initialization failed. Verify credentials format.");
  } else {
    diagnostics.checks.clientInit.status = 'pass';
  }

  if (diagnostics.checks.environment.status === 'pass') {
    const netCheck = await checkNetworkConnectivity();
    diagnostics.checks.network.details = netCheck;
    diagnostics.raw.networkResponse = netCheck;

    if (!netCheck.reachable) {
      diagnostics.checks.network.status = 'fail';
      if (netCheck.corsIssues) {
        diagnostics.recommendations.push("CORS blocked - verify Supabase dashboard settings (API Settings -> CORS)");
      } else {
        diagnostics.recommendations.push("Network unreachable - check internet connection or firewall");
      }
    } else {
      diagnostics.checks.network.status = 'pass';
    }

    const authCheck = await checkAuthStatus();
    diagnostics.checks.authentication.details = authCheck;
    if (!authCheck.valid && netCheck.reachable) {
      diagnostics.checks.authentication.status = 'fail';
      diagnostics.recommendations.push("Authentication failed - Verify VITE_SUPABASE_ANON_KEY is correct and active");
    } else if (authCheck.valid) {
      diagnostics.checks.authentication.status = 'pass';
    } else {
      diagnostics.checks.authentication.status = 'warning'; 
    }
  }

  const allPassed = Object.values(diagnostics.checks)
    .filter(c => c.status !== 'pending')
    .every(c => c.status === 'pass' || c.status === 'warning');

  if (diagnostics.checks.environment.status === 'fail' || diagnostics.checks.clientInit.status === 'fail') {
    diagnostics.overallStatus = 'critical';
  } else if (diagnostics.checks.network.status === 'fail') {
    diagnostics.overallStatus = 'offline';
  } else if (diagnostics.checks.authentication.status === 'fail') {
    diagnostics.overallStatus = 'unauthorized';
  } else if (allPassed) {
    diagnostics.overallStatus = 'healthy';
    diagnostics.recommendations.push("All systems operational.");
  } else {
    diagnostics.overallStatus = 'degraded';
  }

  console.log('--- [Diagnostics] Resultado ---', diagnostics);
  return diagnostics;
};

export const getHealthStatus = (diagnostics) => {
  if (!diagnostics) return 'unknown';
  return diagnostics.overallStatus;
};

export const getErrorSummary = (diagnostics) => {
  if (!diagnostics || !diagnostics.recommendations || diagnostics.recommendations.length === 0) {
    return 'Nenhum problema específico detectado, mas o sistema pode estar instável.';
  }
  return diagnostics.recommendations[0]; 
};