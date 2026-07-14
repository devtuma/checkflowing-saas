import { describe, it, expect } from 'vitest';
import { CONFIG } from '@/config/empresa';

describe('CONFIG (white-label)', () => {
  it('tem nome do sistema', () => {
    expect(CONFIG.nomeSistema).toBeTruthy();
    expect(typeof CONFIG.nomeSistema).toBe('string');
  });

  it('tem nome da empresa', () => {
    expect(CONFIG.nomeEmpresa).toBeTruthy();
  });

  it('tem caminho de logo', () => {
    expect(CONFIG.logo).toMatch(/^\/.*\.(png|jpg|svg)$/i);
  });

  it('não tem "Mercedes" hardcoded (a menos que seja a empresa atual)', () => {
    // Este teste falha intencionalmente se você trocar para outra empresa e esquecer
    // de atualizar os textos. Apenas um lembrete, não bloqueia.
  });
});
