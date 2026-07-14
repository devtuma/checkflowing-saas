import { supabase } from './supabaseClient';
import { toast } from '@/components/ui/use-toast';

const NOME_BUCKET_IMAGENS = 'imagens-atividades';

const sanitizeForPath = (name) => {
  if (!name) return 'sem_nome';
  return name.trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9-_\.]/g, '')
    .toLowerCase() || 'sem_nome';
};

const handleSupabaseError = (error, operation) => {
  console.error(`[SupabaseService] Error during ${operation}:`, error);
  return {
    success: false,
    error: {
      message: `Falha na operação: ${operation}`,
      technical: error?.message || 'Erro desconhecido',
      code: error?.code || 'UNKNOWN',
      originalError: error,
    }
  };
};

export const buscarCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias_atividade')
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
    const { data, error } = await supabase.from('categorias_atividade').insert(payload).select();
    if (error) throw error;
    return data[0];
  } else {
    const { data, error } = await supabase.from('categorias_atividade').update(payload).eq('id', categoria.id).select();
    if (error) throw error;
    return data[0];
  }
};

export const excluirCategoriaSupabase = async (id) => {
  const { error } = await supabase.from('categorias_atividade').delete().eq('id', id);
  if (error) throw error;
};

export const buscarOperadores = async (searchRe = null) => {
  let query = supabase.from('operadores').select('*');
  if (searchRe) {
    query = query.ilike('re', `%${searchRe.toLowerCase()}%`);
  }
  const { data, error } = await query;
  return { data: data || [], error };
};

export const buscarAtividades = async () => supabase.from('atividades').select('*').order('data_inicio', { ascending: false });
export const salvarItemChecklist = async (payload) => supabase.from('itens_checklist').insert(payload);
export const salvarFoto = async (payload) => supabase.from('fotos_atividade').insert(payload);
export const gerarRelatorio = async (payload) => supabase.from('relatorios').insert(payload);
export const verificarSenhaAdmin = async () => supabase.from('admin_password').select('password').single();

export const getAdminPassword = async () => {
  try {
    const { data, error } = await verificarSenhaAdmin();
    if (error) return null;
    return data?.password || null;
  } catch (error) {
    return null;
  }
};

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
    
    const { data: urlData } = supabase.storage.from(NOME_BUCKET_IMAGENS).getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err) {
    console.error(`[uploadImagemSupabaseStorage] Falha no upload:`, err);
    throw err;
  }
};

export const carregarDadosIniciaisSupabase = async () => {
  try {
    const [atividadesRes, itensRes, operadoresRes, responsaveisRes, categoriasRes] = await Promise.all([
      buscarAtividades(),
      supabase.from('itens_checklist').select('*'),
      buscarOperadores(),
      supabase.from('responsaveis').select('nome'),
      buscarCategorias(),
    ]);

    if (atividadesRes.error) throw atividadesRes.error;
    if (operadoresRes.error) throw operadoresRes.error;

    const atividadesMapeadas = (atividadesRes.data || []).map(atv => {
      const etapasRelacionadas = (itensRes.data || [])
        .filter(item => item.atividade_id === atv.id)
        .sort((a, b) => a.ordem - b.ordem)
        .map(item => ({
          id: item.id,
          descricao: item.descricao,
          concluida: item.concluido,
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
        nome: atv.tipo_atividade,
        ordem_sap: atv.numero_sap,
        dataInicio: atv.data_inicio,
        dataTermino: atv.data_conclusao,
        exigir_imagem: atv.exigir_imagem,
        etapas: etapasRelacionadas,
        execucoes,
      };
    });

    return {
      atividadesData: atividadesMapeadas,
      responsaveisData: responsaveisRes.data ? responsaveisRes.data.map(r => r.nome) : [],
      operadoresData: operadoresRes.data || [],
      categoriasData: categoriasRes.data || [],
    };
  } catch (error) {
    console.error('[carregarDadosIniciaisSupabase] Erro crítico:', error);
    throw error;
  }
};

export const excluirAtividadeSupabase = async (idAtividade) => {
  try {
    const { data: atividade } = await supabase.from('atividades').select('tipo_atividade').eq('id', idAtividade).maybeSingle();
    
    if (atividade?.tipo_atividade) {
      const folderPath = sanitizeForPath(atividade.tipo_atividade);
      const { data: files } = await supabase.storage.from(NOME_BUCKET_IMAGENS).list(folderPath, { recursive: true });
      if (files?.length > 0) {
        await supabase.storage.from(NOME_BUCKET_IMAGENS).remove(files.map(f => `${folderPath}/${f.name}`));
      }
    }
    
    await supabase.from('atividades').delete().eq('id', idAtividade);
  } catch (error) {
    console.error('[excluirAtividadeSupabase] Erro:', error);
    throw error;
  }
};

const salvarUmaAtividade = async (atividade) => {
  let opId = atividade.operador_id;
  if (!opId) {
    const { data: opData } = await supabase.from('operadores').select('id').limit(1);
    opId = (opData && opData.length > 0) ? opData[0].id : '00000000-0000-0000-0000-000000000000';
  }

  const payload = {
    operador_id: opId,
    tipo_atividade: atividade.nome || atividade.tipo_atividade || 'Nova Atividade',
    status: atividade.status || 'pendente',
    numero_sap: atividade.ordem_sap || atividade.numero_sap || null,
    exigir_imagem: atividade.exigir_imagem || false,
    data_inicio: atividade.dataInicio || atividade.data_inicio || new Date().toISOString(),
    data_conclusao: atividade.dataTermino || atividade.data_conclusao || null,
    execucoes: JSON.stringify(atividade.execucoes || []),
    categoria_id: atividade.categoria_id || null,
  };

  const isNew = !atividade.id || String(atividade.id).startsWith('temp');
  let savedAtividade;

  if (isNew) {
    const { data, error } = await supabase.from('atividades').insert(payload).select();
    if (error) throw error;
    savedAtividade = data[0];
  } else {
    const { data, error } = await supabase.from('atividades').update(payload).eq('id', atividade.id).select();
    if (error) throw error;
    savedAtividade = data[0];
  }

  // Handle example image upload
  if (atividade.imagemExemploArquivo instanceof File) {
    try {
      const url = await uploadImagemSupabaseStorage(
        atividade.imagemExemploArquivo, 
        savedAtividade.tipo_atividade, 
        'admin', 
        'exemplo'
      );
      if (url) {
        await supabase.from('fotos_atividade').insert({
          atividade_id: savedAtividade.id,
          url_foto: url,
          descricao: 'Imagem de exemplo da atividade'
        });
      }
    } catch (e) {
      console.error('Erro ao fazer upload da imagem de exemplo', e);
    }
  }

  if (atividade.etapas && atividade.etapas.length > 0) {
    await supabase.from('itens_checklist').delete().eq('atividade_id', savedAtividade.id);

    const itemsToInsert = await Promise.all(atividade.etapas.map(async (etapa, idx) => {
      let imagemExemploUrl = etapa.imagemExemploUrl || null;

      if (etapa.imagemExemploArquivo instanceof File) {
        try {
          imagemExemploUrl = await uploadImagemSupabaseStorage(
            etapa.imagemExemploArquivo,
            savedAtividade.tipo_atividade,
            'admin',
            `etapa_${idx + 1}`
          );
        } catch (e) {
          console.error(`Erro upload imagem exemplo etapa ${idx + 1}:`, e);
        }
      }

      return {
        atividade_id: savedAtividade.id,
        descricao: etapa.descricao || 'Sem descrição',
        concluido: etapa.concluida || false,
        ordem: idx + 1,
        imagem_exemplo_url: imagemExemploUrl,
        solicitar_imagem_usuario: etapa.solicitarImagemUsuario || false,
        responsaveis: JSON.stringify(
          etapa.responsaveis?.length ? etapa.responsaveis
          : etapa.responsavel ? [etapa.responsavel]
          : []
        ),
      };
    }));

    await supabase.from('itens_checklist').insert(itemsToInsert);
  }

  return { 
    ...atividade, 
    id: savedAtividade.id, 
    dataInicio: savedAtividade.data_inicio, 
    dataTermino: savedAtividade.data_conclusao, 
    ordem_sap: savedAtividade.numero_sap,
    exigir_imagem: savedAtividade.exigir_imagem 
  };
};

export const salvarAtividadesSupabase = async (atividadesOuAtividade, idParaExcluir = null) => {
  if (idParaExcluir) return await excluirAtividadeSupabase(idParaExcluir);
  const atividadesParaSalvar = Array.isArray(atividadesOuAtividade) ? atividadesOuAtividade : [atividadesOuAtividade];
  return await Promise.all(atividadesParaSalvar.map(salvarUmaAtividade));
};

export const salvarResponsaveisSupabase = async (novos) => {
  await supabase.from('responsaveis').delete().neq('id', -1);
  if (novos.length === 0) return [];
  const { data } = await supabase.from('responsaveis').insert(novos.map(nome => ({ nome }))).select();
  return data.map(r => r.nome);
};

export const salvarOperadoresSupabase = async (operadoresParaSalvar) => {
  const resultados = [];

  for (const op of operadoresParaSalvar) {
    const isNew = !op.id || String(op.id).startsWith('temp_');

    const dbPayload = {
      re: op.re.toLowerCase(),
      id_mercedes: op.id_mercedes,
      nome: op.nome,
      turno: op.turno || 'A',
    };

    if (isNew) {
      dbPayload.primeiro_acesso = true;
    } else if (typeof op.primeiro_acesso === 'boolean') {
      dbPayload.primeiro_acesso = op.primeiro_acesso;
    }

    try {
      const { data, error } = isNew
        ? await supabase.from('operadores').insert(dbPayload).select()
        : await supabase.from('operadores').update(dbPayload).eq('id', op.id).select();

      if (error) throw error;
      if (data && data.length > 0) resultados.push(data[0]);
    } catch (error) {
      console.error(`[salvarOperadoresSupabase] Erro ao salvar ${op.nome}:`, error);
    }
  }
  return resultados;
};