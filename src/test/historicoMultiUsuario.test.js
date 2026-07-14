import { describe, it, expect } from 'vitest';
import { criarNovaExecucao } from '@/components/ExecutarChecklist/useChecklistLogic';

describe('criarNovaExecucao — rastreamento multi-usuário', () => {

  // Atividade base com3 etapas
  const atividadeBase = {
    id: 'ativ-001',
    nome: 'Limpeza Ácida Tanque A',
    etapas: [
      { id: 'etapa-1', descricao: 'Preparar solução', responsaveis: ['Técnico'] },
      { id: 'etapa-2', descricao: 'Aplicar ácido', responsaveis: ['Técnico'] },
      { id: 'etapa-3', descricao: 'Enxaguar', responsaveis: ['Técnico'] },
    ],
    execucoes: [],
  };

  it('primeira execução nasce com histórico vazio', () => {
    const exec = criarNovaExecucao(atividadeBase, '111111');
    expect(exec.numeroRE).toBe('111111');
    expect(exec.etapas[0].historicoAlteracoes).toEqual([]);
    expect(exec.etapas[1].historicoAlteracoes).toEqual([]);
    expect(exec.etapas[2].historicoAlteracoes).toEqual([]);
  });

  it('agrega histórico de execuções anteriores ao criar nova execução', () => {
    // Timestamps distintos para ordenação determinística
    const atividadeComHistorico = {
      ...atividadeBase,
      execucoes: [
        {
          id: 'exec-1',
          numeroRE: '111111',
          etapas: [
            { idEtapaOriginal: 'etapa-1', historicoAlteracoes: [] },
            {
              idEtapaOriginal: 'etapa-2',
              historicoAlteracoes: [
                {
                  acao: 'Remarcada como concluída',
                  re: '111111',
                  reAnterior: null,
                  timestamp: '2026-06-01T10:00:00.000Z',
                },
              ],
            },
            { idEtapaOriginal: 'etapa-3', historicoAlteracoes: [] },
          ],
        },
        {
          id: 'exec-2',
          numeroRE: '222222',
          etapas: [
            { idEtapaOriginal: 'etapa-1', historicoAlteracoes: [] },
            {
              idEtapaOriginal: 'etapa-2',
              historicoAlteracoes: [
                // Maria traz histórico de João (cenário real)
                {
                  acao: 'Remarcada como concluída',
                  re: '111111',
                  reAnterior: null,
                  timestamp: '2026-06-01T10:00:00.000Z',
                },
                // Ações próprias de Maria
                {
                  acao: 'Conclusão revertida',
                  re: '222222',
                  reAnterior: '111111',
                  timestamp: '2026-06-01T11:00:00.000Z',
                },
                {
                  acao: 'Remarcada como concluída',
                  re: '222222',
                  reAnterior: null,
                  timestamp: '2026-06-01T11:05:00.000Z',
                },
              ],
            },
            { idEtapaOriginal: 'etapa-3', historicoAlteracoes: [] },
          ],
        },
      ],
    };

    const exec3 = criarNovaExecucao(atividadeComHistorico, '333333');
    const historicoEtapa2 = exec3.etapas.find(e => e.idEtapaOriginal === 'etapa-2').historicoAlteracoes;

    // 4 entradas: João (exec-1) + João (copiado em exec-2) + Maria revert + Maria remark
    expect(historicoEtapa2).toHaveLength(4);

    // Verificar por RE, não por posição no array
    const joaoEntries = historicoEtapa2.filter(h => h.re === '111111');
    const mariaEntries = historicoEtapa2.filter(h => h.re === '222222');

    expect(joaoEntries).toHaveLength(2); // veio de exec-1 E foi copiado em exec-2
    expect(mariaEntries).toHaveLength(2); // revert + remark

    expect(mariaEntries.find(h => h.acao === 'Conclusão revertida').reAnterior).toBe('111111');
    expect(mariaEntries.find(h => h.acao === 'Remarcada como concluída').reAnterior).toBeNull();
  });

  it('etapas sem histórico não são afetadas', () => {
    const atividadeComHistorico = {
      ...atividadeBase,
      execucoes: [
        {
          id: 'exec-1',
          numeroRE: '111111',
          etapas: [
            {
              idEtapaOriginal: 'etapa-1',
              historicoAlteracoes: [
                { acao: 'Remarcada como concluída', re: '111111', reAnterior: null, timestamp: '2026-06-01T10:00:00.000Z' },
              ],
            },
            { idEtapaOriginal: 'etapa-2', historicoAlteracoes: [] },
            { idEtapaOriginal: 'etapa-3', historicoAlteracoes: [] },
          ],
        },
      ],
    };

    const exec2 = criarNovaExecucao(atividadeComHistorico, '222222');

    expect(exec2.etapas.find(e => e.idEtapaOriginal === 'etapa-1').historicoAlteracoes).toHaveLength(1);
    expect(exec2.etapas.find(e => e.idEtapaOriginal === 'etapa-2').historicoAlteracoes).toHaveLength(0);
    expect(exec2.etapas.find(e => e.idEtapaOriginal === 'etapa-3').historicoAlteracoes).toHaveLength(0);
  });

  it('nova execução começa com concluida=false para todas as etapas', () => {
    const atividadeComHistorico = {
      ...atividadeBase,
      execucoes: [
        {
          id: 'exec-1',
          numeroRE: '111111',
          etapas: [
            { idEtapaOriginal: 'etapa-1', concluida: true, historicoAlteracoes: [] },
            { idEtapaOriginal: 'etapa-2', concluida: true, historicoAlteracoes: [] },
            { idEtapaOriginal: 'etapa-3', concluida: true, historicoAlteracoes: [] },
          ],
        },
      ],
    };

    const exec2 = criarNovaExecucao(atividadeComHistorico, '222222');

    expect(exec2.etapas.every(e => e.concluida === false)).toBe(true);
    expect(exec2.numeroRE).toBe('222222');
    expect(exec2.finalizadoEm).toBeNull();
  });

  it('preserve responsaveis da atividade original', () => {
    const atividadeComHistorico = {
      ...atividadeBase,
      execucoes: [
        {
          id: 'exec-1',
          numeroRE: '111111',
          etapas: [
            { idEtapaOriginal: 'etapa-1', historicoAlteracoes: [] },
            { idEtapaOriginal: 'etapa-2', historicoAlteracoes: [] },
            { idEtapaOriginal: 'etapa-3', historicoAlteracoes: [] },
          ],
        },
      ],
    };

    const exec = criarNovaExecucao(atividadeComHistorico, '333333');

    expect(exec.etapas[0].responsaveis).toEqual(['Técnico']);
    expect(exec.etapas[1].responsaveis).toEqual(['Técnico']);
    expect(exec.etapas[2].responsaveis).toEqual(['Técnico']);
  });
});
