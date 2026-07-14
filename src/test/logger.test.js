import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabaseClient';

describe('logger', () => {
  let insertMock;

  beforeEach(() => {
    insertMock = vi.fn().mockResolvedValue({ data: [], error: null });
    supabase.from = vi.fn(() => ({ insert: insertMock }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('info() não envia para o Supabase (apenas console)', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('teste');
    expect(spy).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('warn() enfileira e agenda flush', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('aviso', { contexto: 'teste' });
    expect(spy).toHaveBeenCalled();
    // Aguardar o flush automático (5s seria muito, vamos chamar flush manual)
    await logger.flush();
    expect(insertMock).toHaveBeenCalled();
    const payload = insertMock.mock.calls[0][0];
    expect(payload[0]).toMatchObject({
      nivel: 'warn',
      mensagem: 'aviso',
      contexto: { contexto: 'teste' },
    });
  });

  it('error() com Error captura mensagem e stack', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const erro = new Error('falhou');
    logger.error('operação X', erro, { etapa: 1 });
    expect(spy).toHaveBeenCalled();
    await logger.flush();
    const payload = insertMock.mock.calls[0][0];
    expect(payload[0].nivel).toBe('error');
    expect(payload[0].erro_detalhes).toMatchObject({ message: 'falhou' });
    expect(payload[0].contexto).toMatchObject({ etapa: 1 });
  });

  it('falha de rede no Supabase não derruba a app', async () => {
    insertMock.mockRejectedValue(new Error('network down'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('aviso 2');
    await expect(logger.flush()).resolves.not.toThrow();
    expect(warn).toHaveBeenCalled();
  });
});
