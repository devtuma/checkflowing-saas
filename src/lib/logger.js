import { supabase } from './supabaseClient';

const isProd = import.meta.env.PROD;

const buffer = [];
const MAX_BUFFER = 50;
let flushTimer = null;

const enviarParaSupabase = async () => {
  if (buffer.length === 0) return;
  const lote = buffer.splice(0, MAX_BUFFER);
  try {
    await supabase.from('app_logs').insert(lote);
  } catch (e) {
    // Silencioso — não queremos que o logger quebre a app
    if (!isProd) console.warn('[logger] falha ao enviar lote:', e);
  }
};

const agendarFlush = () => {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    enviarParaSupabase();
  }, 5000);
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (buffer.length > 0) {
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL || ''}/rest/v1/app_logs`,
        new Blob([JSON.stringify(buffer.splice(0))], { type: 'application/json' })
      );
    }
  });
}

const formatarErro = (error) => {
  if (!error) return null;
  if (error instanceof Error) return { message: error.message, stack: error.stack };
  return { message: String(error) };
};

const criarEntrada = (nivel, mensagem, contexto) => ({
  nivel,
  mensagem: typeof mensagem === 'string' ? mensagem : JSON.stringify(mensagem),
  contexto: contexto || {},
  url: typeof window !== 'undefined' ? window.location.pathname : null,
  user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  created_at: new Date().toISOString(),
});

export const logger = {
  info(mensagem, contexto) {
    if (!isProd) console.info('[info]', mensagem, contexto);
  },

  warn(mensagem, contexto) {
    console.warn('[warn]', mensagem, contexto);
    buffer.push(criarEntrada('warn', mensagem, contexto));
    agendarFlush();
  },

  error(mensagem, errorOrContexto, contextoExtra) {
    const isErrorObj = errorOrContexto instanceof Error || (errorOrContexto && typeof errorOrContexto === 'object' && 'message' in errorOrContexto && !contextoExtra);
    const errObj = isErrorObj ? formatarErro(errorOrContexto) : null;
    const contexto = errObj ? { ...errorOrContexto, ...contextoExtra } : { ...errorOrContexto, ...contextoExtra };
    console.error('[error]', mensagem, errorOrContexto, contextoExtra);
    buffer.push({
      ...criarEntrada('error', mensagem, contexto),
      erro_detalhes: errObj,
    });
    agendarFlush();
  },

  flush: enviarParaSupabase,
};

export const withErrorBoundary = (fn, contexto = {}) => async (...args) => {
  try {
    return await fn(...args);
  } catch (err) {
    logger.error('Erro capturado por withErrorBoundary', err, { fn: fn.name, ...contexto });
    throw err;
  }
};
