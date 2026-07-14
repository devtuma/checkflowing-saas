# AGENT LOG — vite-config

## O que foi alterado
O arquivo `vite.config.js` foi completamente reescrito.

## Por que (resumo do problema)
O arquivo original importava 4 plugins exclusivos da plataforma Hostinger Horizons:
- `vite-plugin-react-inline-editor.js`
- `vite-plugin-edit-mode.js`
- `vite-plugin-iframe-route-restoration.js`
- `vite-plugin-selection-mode.js`

Esses plugins quebram o build em produção fora do ambiente Horizons porque os arquivos correspondentes em `./plugins/` não existem em um projeto standalone. Além disso, o arquivo original continha centenas de linhas de handlers de erro e monkey-patches específicos da plataforma Horizons (vite error overlay, runtime error handler, console error handler, fetch monkey-patch, navigation handler), todos injetados no HTML via `transformIndexHtml`. Nada disso é necessário — ou funciona — fora do ambiente Horizons.

## Conteúdo ANTES (primeiras 10 linhas do original)
```
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { createLogger, defineConfig } from 'vite';
import inlineEditPlugin from './plugins/visual-editor/vite-plugin-react-inline-editor.js';
import editModeDevPlugin from './plugins/visual-editor/vite-plugin-edit-mode.js';
import iframeRouteRestorationPlugin from './plugins/vite-plugin-iframe-route-restoration.js';
import selectionModePlugin from './plugins/selection-mode/vite-plugin-selection-mode.js';

const isDev = process.env.NODE_ENV !== 'production';

const configHorizonsViteErrorHandler = `
```

## Conteúdo DEPOIS (novo arquivo)
```javascript
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
```
