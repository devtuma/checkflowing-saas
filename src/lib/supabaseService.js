// ============================================
// SUPABASE SERVICE - ADAPTER PARA NOVO SCHEMA
// Checkflowing SaaS
// ============================================
// Mantém compatibilidade com código antigo (operadores, itens_checklist)
// mas aponta para as tabelas novas (usuarios, etapas, etc)
// ============================================

import { supabase } from './supabaseClient';
import { toast } from '@/components/ui/use-toast';

// ============================================
// TABELAS E MAPEAMENTOS
// ============================================

const TABLES = {
  // Nome antigo → Nome novo
  operadores: 'usuarios',
  itens_checklist: 'etapas',
  categorias_atividade: 'categorias',
  responsaveis: 'usuarios', // apenas role = 'operador' usa isso
  app_logs: 'super_admin_logs',
  // Nomes que continuam iguais
  atividades: 'atividades',
  admin_password: 'tenant_configs', // senha admin vai para configs
};

// ============================================
// HELPERS
// ============================================

const logError = (context, error) => {
  console.error(`[SupabaseService] ${context}:`, error);
};

const handleSupabaseError = (error, operation) => {
  console.error(`[SupabaseService] ${operation}:`, error);
  return {
    success: false,
    error: {
      message: `Falha: ${operation}`,
      technical: error?.message || 'Erro desconhecido',
      code: error?.code || 'UNKNOWN',
    }
  };
};

// ============================================
// BUSCAR DADOS INICIAIS
// ============================================

export const carregarDadosIniciaisSupabase = async () => {
  try {
    // ===== 1. CATEGORIAS =====
    const categoriasResult = await supabase
      .from('categorias')
      .select('*')
      .order('ordem', { ascending: true });

    if (categoriasResult.error) throw categoriasResult.error;

    // ===== 2. ATIVIDADES + ETAPAS =====
    const atividadesResult = await supabase
      .from('atividades')
      .select('*')
      .order('data_inicio', { ascending: false });

    if (atividadesResult.error) throw atividadesResult.error;

    const etapasResult = await supabase
      .from('etapas')
      .select('*');

    if (etapasResult.error) throw etapasResult.error;

    // ===== 3. OPERADORES (da tabela usuarios com role='operador') =====
    const operadoresResult = await supabase
      .from('usuarios')
      .select('*')
      .eq('role', 'operador');

    if (operadoresResult.error) throw operadoresResult.error;

    // ===== 4. RESPONSAVEIS (lista de nomes dos operadores) =====
    const responsaveisNomes = operadoresResult.data?.map(o => ({ nome: o.nome })) || [];

    // ===== 5. MAPEAR PARA FORMATO ANTIGO =====
    const atividadesMapeadas = (atividadesResult.data || []).map(atv => {
      const etapasRelacionadas = (etapasResult.data || [])
        .filter(item => item.atividade_id === atv.id)
        .sort((a, b) => a.ordem - b.ordem)
        .map(item => ({
          id: item.id,
          descricao: item.descricao,
          concluida: item.concluido || false,
          ordem: item.ordem,
          imagemExemploUrl: item.imagem_exemplo_url || '',
          solicitarImagemUsuario: item.solicitar_imagem_usuario || false,
          responsaveis: Array.isArray(item.responsaveis)
            ? item.responsaveis
            : (item.responsaveis ? JSON.parse(item.responsaveis) : []),
        }));

      const execucoes = Array.isArray(atv.execucoes)
        ? atv.execucoes
        : (atv.execucoes ? JSON.parse(atv.execucoes) : []);

      return {
        ...atv,
        id: atv.id,
        nome: atv.nome, // já é o nome correto no schema novo
        ordem_sap: atv.numero_sap,
        dataInicio: atv.data_inicio,
        dataTermino: atv.data_termino,
        exigir_imagem: atv.exigir_foto,
        etapas: etapasRelacionadas,
        execucoes,
      };
    });

    return {
      atividadesData: atividadesMapeadas,
      responsaveisData: responsaveisNomes,
      operadoresData: (operadoresResult.data || []).map(op => ({
        ...op,
        // Mapear para compatibilidade
        primeiro_acesso: op.primeiro_acesso ?? true,
      })),
      categoriasData: (categoriasResult.data || []).map(cat => ({
        ...cat,
        // garantir campos esperados
      })),
    };
  } catch (error) {
    console.error('[carregarDadosIniciaisSupabase] Erro crítico:', error);
    throw error;
  }
};

// ============================================
// CATEGORIAS
// ============================================

export const buscarCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('ordem', { ascending: true });
  return { data: data || [], error };
};

export const salvarCategoriaSupabase = async (categoria) => {
  const payload = {
    nome: categoria.nome,
    descricao: categoria.descricao || '',
    cor: categoria.cor || '#2563eb',
    icone: categoria.icone || 'wrench',
    ordem: categoria.ordem ?? 0,
  };

  if (!categoria.id) {
    const { data, error } = await supabase.from('categorias').insert(payload).select();
    if (error) throw error;
    return data[0];
  } else {
    const { data, error } = await supabase
      .from('categorias')
      .update(payload)
      .eq('id', categoria.id)
      .select();
    if (error) throw error;
    return data[0];
  }
};

export const excluirCategoriaSupabase = async (id) => {
  const { error } = await supabase.from('categorias').delete().eq('id', id);
  if (error) throw error;
};

// ============================================
// OPERADORES / USUÁRIOS
// ============================================

export const buscarOperadores = async (searchRe = null) => {
  let query = supabase.from('usuarios').select('*').eq('role', 'operador');

  if (searchRe) {
    query = query.ilike('re', `%${searchRe.toLowerCase()}%`);
  }

  const { data, error } = await query;
  return { data: data || [], error };
};

export const salvarOperadoresSupabase = async (operadoresParaSalvar) => {
  const resultados = [];

  for (const op of operadoresParaSalvar) {
    const isNew = !op.id || String(op.id).startsWith('temp_');

    const dbPayload = {
      tenant_id: op.tenant_id || '00000000-0000-0000-0000-000000000001',
      email: op.email || `${op.re || op.id_mercedes}@checkflowing.local`,
      nome: op.nome,
      role: 'operador',
      re: op.re?.toLowerCase(),
      id_externo: op.id_mercedes,
      turno: op.turno || 'A',
      ativo: op.ativo ?? true,
      primeiro_acesso: op.primeiro_acesso ?? true,
    };

    // senha_hash - em produção, use hash real
    if (op.senha_hash) {
      dbPayload.senha_hash = op.senha_hash;
    }

    if (isNew) {
      dbPayload.senha_hash = op.senha_hash || null;
      const { data, error } = await supabase.from('usuarios').insert(dbPayload).select();
      if (error) throw error;
      if (data?.[0]) resultados.push(data[0]);
    } else {
      const { data, error } = await supabase
        .from('usuarios')
        .update(dbPayload)
        .eq('id', op.id)
        .select();
      if (error) throw error;
      if (data?.[0]) resultados.push(data[0]);
    }
  }

  return resultados;
};

// ============================================
// SALVAR ATIVIDADE COMPLETA
// ============================================

export const salvarUmaAtividade = async (atividade) => {
  const payload = {
    nome: atividade.nome,
    categoria_id: atividade.categoria_id || null,
    descricao: atividade.descricao || '',
    data_inicio: atividade.dataInicio || atividade.data_inicio || new Date().toISOString(),
    data_termino: atividade.dataTermino || atividade.data_termino || null,
    status: atividade.status || 'pendente',
    prioridade: atividade.prioridade || 2,
    exigir_foto: atividade.exigir_imagem || atividade.exigir_foto || false,
    exigir_video: atividade.exigir_video || false,
  };

  const isNew = !atividade.id || String(atividade.id).startsWith('temp');

  let savedAtividade;
  if (isNew) {
    const { data, error } = await supabase.from('atividades').insert(payload).select();
    if (error) throw error;
    savedAtividade = data[0];
  } else {
    const { data, error } = await supabase
      .from('atividades')
      .update(payload)
      .eq('id', atividade.id)
      .select();
    if (error) throw error;
    savedAtividade = data[0];
  }

  // Salvar etapas
  if (atividade.etapas && atividade.etapas.length > 0) {
    await supabase.from('etapas').delete().eq('atividade_id', savedAtividade.id);

    const etapasToInsert = atividade.etapas.map((etapa, idx) => ({
      atividade_id: savedAtividade.id,
      descricao: etapa.descricao || 'Sem descrição',
      concluido: etapa.concluida || false,
      ordem: idx + 1,
      imagem_exemplo_url: etapa.imagemExemploUrl || null,
      solicitar_imagem_usuario: etapa.solicitarImagemUsuario || false,
      responsaveis: JSON.stringify(
        etapa.responsaveis?.length ? etapa.responsaveis
        : etapa.responsavel ? [etapa.responsavel]
        : []
      ),
    }));

    const { error } = await supabase.from('etapas').insert(etapasToInsert);
    if (error) throw error;
  }

  return savedAtividade;
};

export const salvarAtividadesSupabase = async (atividadesOuAtividade, idParaExcluir = null) => {
  if (idParaExcluir) {
    return await excluirAtividadeSupabase(idParaExcluir);
  }
  const atividadesParaSalvar = Array.isArray(atividadesOuAtividade)
    ? atividadesOuAtividade
    : [atividadesOuAtividade];
  return await Promise.all(atividadesParaSalvar.map(salvarUmaAtividade));
};

// ============================================
// EXCLUIR ATIVIDADE
// ============================================

export const excluirAtividadeSupabase = async (idAtividade) => {
  try {
    // Primeiro buscar info para cleanup
    const { data: atividade } = await supabase
      .from('atividades')
      .select('nome')
      .eq('id', idAtividade)
      .maybeSingle();

    // Excluir etapas vinculadas (cascade deve funcionar, mas por garantia)
    await supabase.from('etapas').delete().eq('atividade_id', idAtividade);

    // Excluir atividade
    const { error } = await supabase.from('atividades').delete().eq('id', idAtividade);
    if (error) throw error;

    console.log(`[SupabaseService] Atividade "${atividade?.nome}" excluída`);
  } catch (error) {
    console.error('[excluirAtividadeSupabase] Erro:', error);
    throw error;
  }
};

// ============================================
// ADMIN PASSWORD (compatibilidade)
// ============================================

export const verificarSenhaAdmin = async () => {
  // No novo schema, senha admin fica em tenant_configs
  const { data, error } = await supabase
    .from('tenant_configs')
    .select('admin_password_hash')
    .limit(1)
    .maybeSingle();

  return { data, error };
};

export const getAdminPassword = async () => {
  try {
    const { data, error } = await verificarSenhaAdmin();
    if (error || !data) return 'admin123'; // fallback dev
    return data.admin_password_hash || 'admin123';
  } catch {
    return 'admin123';
  }
};

// ============================================
// UPLOAD DE MÍDIA
// ============================================

const sanitizeForPath = (name) => {
  if (!name) return 'sem_nome';
  return name.trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9-_\.]/g, '')
    .toLowerCase() || 'sem_nome';
};

const NOME_BUCKET_IMAGENS = 'midias'; // bucket novo

export const uploadImagemSupabaseStorage = async (file, activityName, role, etapaId) => {
  if (!file || !(file instanceof File)) return null;

  const sanitizedActivityName = sanitizeForPath(activityName);
  const timestamp = Date.now();
  const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9-_\.]/g, '');
  const path = `${sanitizedActivityName}/${role}/${etapaId}/${timestamp}_${sanitizedFileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(NOME_BUCKET_IMAGENS)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(NOME_BUCKET_IMAGENS)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('[uploadImagemSupabaseStorage] Falha:', err);
    throw err;
  }
};

// ============================================
// LOGS (compatibilidade)
// ============================================

export const salvarLogSupabase = async (logData) => {
  // Mapear para tabela nova se existir
  try {
    const { error } = await supabase.from('super_admin_logs').insert({
      acao_tipo: logData.nivel || 'INFO',
      detalhes: {
        mensagem: logData.mensagem,
        contexto: logData.contexto,
        url: logData.url,
        erro_detalhes: logData.erro_detalhes,
      },
      user_agent: logData.user_agent,
    });

    if (error) {
      // Se tabela não existe (404), apenas loga no console
      console.warn('[salvarLogSupabase] Tabela de logs não disponível:', error.message);
    }
  } catch (err) {
    console.warn('[salvarLogSupabase] Erro:', err.message);
  }
};

// ============================================
// EXPORTS DE COMPATIBILIDADE
// ============================================

export const salvarItemChecklist = async (payload) => {
  const { data, error } = await supabase.from('etapas').insert(payload).select();
  return { data, error };
};

export const salvarFoto = async (payload) => {
  const { data, error } = await supabase.from('midias').insert(payload).select();
  return { data, error };
};

export const gerarRelatorio = async (payload) => {
  // Salvar em uma tabela genérica de relatórios ou logs
  console.log('[gerarRelatorio]', payload);
  return { data: null, error: null };
};

export const salvarResponsaveisSupabase = async (novos) => {
  // Apenas loga - responsaveis agora vem de usuarios
  console.log('[salvarResponsaveisSupabase] Deprecated - usar usuarios com role=operador');
  return novos.map(n => ({ nome: typeof n === 'string' ? n : n.nome }));
};

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  // Categorias
  buscarCategorias,
  salvarCategoriaSupabase,
  excluirCategoriaSupabase,

  // Operadores
  buscarOperadores,
  salvarOperadoresSupabase,

  // Atividades
  salvarAtividadesSupabase,
  excluirAtividadeSupabase,

  // Inicial
  carregarDadosIniciaisSupabase,

  // Auth
  verificarSenhaAdmin,
  getAdminPassword,

  // Upload
  uploadImagemSupabaseStorage,

  // Compatibilidade
  salvarItemChecklist,
  salvarFoto,
  gerarRelatorio,
  salvarResponsaveisSupabase,
};