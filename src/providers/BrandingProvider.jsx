// ============================================
// BrandingProvider - Tema Dinâmico
// Checkflowing SaaS
// ============================================

import { useEffect } from 'react';
import { useTenant } from '../hooks/useTenant.jsx';

export const BrandingProvider = ({ children }) => {
  const { config, cores, nomeFantasia, logoUrl } = useTenant();

  // Aplicar CSS variables quando config mudar
  useEffect(() => {
    if (!cores) return;

    const root = document.documentElement;

    // Cores principais
    root.style.setProperty('--color-primary', cores.primary);
    root.style.setProperty('--color-secondary', cores.secondary);
    root.style.setProperty('--color-accent', cores.accent);
    root.style.setProperty('--color-danger', cores.danger);
    root.style.setProperty('--color-success', cores.success);
    root.style.setProperty('--color-background', cores.background);
    root.style.setProperty('--color-card', cores.card);

    // Versões em RGB para uso com opacity
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0, 0, 0';
    };

    root.style.setProperty('--color-primary-rgb', hexToRgb(cores.primary));
    root.style.setProperty('--color-secondary-rgb', hexToRgb(cores.secondary));

    // Atualizar favicon se configurado
    if (config?.favicon_url) {
      const favicon = document.querySelector("link[rel='icon']");
      if (favicon) {
        favicon.href = config.favicon_url;
      }
    }

    // Atualizar título
    document.title = nomeFantasia;

  }, [cores, config, nomeFantasia]);

  return (
    <>
      {/* Logo para referência JS */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt={nomeFantasia}
          id="tenant-logo"
          style={{ display: 'none' }}
        />
      )}

      {children}
    </>
  );
};

export default BrandingProvider;
