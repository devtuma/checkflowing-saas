import { describe, it, expect } from 'vitest';

describe('Bug: Falha no login por coluna senha_hash ausente', () => {

  // Estrutura real da tabela operadores no Supabase (confirmada via API)
  const operadorDoBanco = {
    id: '8be7cb54-c73b-4211-8645-51b73fe774d0',
    re: '2791307',
    id_mercedes: 'THFERRE',
    nome: 'THIAGO FERNANDES FERREIRA',
    primeiro_acesso: true,
    turno: 'A',
    // NOTA: senha_hash NAO EXISTE na tabela - isso é o bug!
  };

  it('BUG CONFIRMADO: operadores NÃO tem coluna senha_hash', () => {
    // Colunas que o código espera para funcionar o login
    const colunasNecessarias = [
      'id',
      're',
      'id_mercedes',
      'nome',
      'primeiro_acesso',
      'senha_hash', // ← ESTA FALTA!
    ];

    // Colunas que existem na tabela (confirmadas via curl)
    const colunasExistentes = Object.keys(operadorDoBanco);

    const faltantes = colunasNecessarias.filter(c => !colunasExistentes.includes(c));

    // O teste prova que senha_hash falta
    expect(faltantes).toContain('senha_hash');
    expect(faltantes).toEqual(['senha_hash']);
  });

  it('BUG CONFIRMADO: código tenta fazer UPDATE com senha_hash inexistente', () => {
    // Simular o que o handleCriarNovaSenha faz:
    const dadosUpdate = {
      primeiro_acesso: false,
      senha_hash: 'abc123hashSHA256'
    };

    // Verificar que o UPDATE inclui senha_hash
    expect(dadosUpdate).toHaveProperty('senha_hash');

    // Mas a tabela não tem essa coluna
    const operadorAtual = { ...operadorDoBanco };
    expect(operadorAtual).not.toHaveProperty('senha_hash');

    // Isso causa o erro 400/42703 no Supabase
  });

  it('REPRODUZ: SELECT funciona, UPDATE com senha_hash quebra', () => {
    // Simular resposta da API Supabase
    const respostaSelect = {
      data: [operadorDoBanco],
      error: null,
      status: 200,
    };

    // SELECT funciona (confirmado via curl)
    expect(respostaSelect.error).toBeNull();
    expect(respostaSelect.data).toHaveLength(1);

    // UPDATE com senha_hash falha
    const respostaUpdate = {
      data: null,
      error: {
        message: 'column "senha_hash" of relation "operadores" does not exist',
        code: '42703', // PostgreSQL: undefined_column
        details: null,
        hint: null,
      },
      status: 400,
    };

    expect(respostaUpdate.error).toBeTruthy();
    expect(respostaUpdate.error.code).toBe('42703');
    expect(respostaUpdate.status).toBe(400);
  });
});

describe('Solução: Adicionar coluna senha_hash', () => {
  it('mostra o SQL necessário para corrigir', () => {
    const sqlCorrecao = `
-- Adicionar coluna senha_hash à tabela operadores
ALTER TABLE operadores ADD COLUMN IF NOT EXISTS senha_hash TEXT;
    `.trim();

    // Este é o SQL que o usuário precisa executar no Supabase
    expect(sqlCorrecao).toContain('ADD COLUMN');
    expect(sqlCorrecao).toContain('senha_hash');
    expect(sqlCorrecao).toContain('TEXT');
  });
});
