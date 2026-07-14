---
# BLP App — Plano de Trabalho Compartilhado
Status: EM ANDAMENTO

## MAPA DE OWNERSHIP — Cada agente toca SOMENTE seus arquivos

AGENTE vite-config:
  c:\Users\VICTUMA\Documents\Antigravity\BLP\app referencia\vite.config.js

AGENTE assets:
  c:\Users\VICTUMA\Documents\Antigravity\BLP\app referencia\src\App.jsx
  c:\Users\VICTUMA\Documents\Antigravity\BLP\app referencia\public\.htaccess
  c:\Users\VICTUMA\Documents\Antigravity\BLP\app referencia\public\logo.png  (CRIAR via download)

AGENTE config:
  c:\Users\VICTUMA\Documents\Antigravity\BLP\app referencia\package.json

AGENTE supabase:
  c:\Users\VICTUMA\Documents\Antigravity\BLP\app referencia\src\lib\customSupabaseClient.js  (verificar uso → possivelmente deletar)
  c:\Users\VICTUMA\Documents\Antigravity\BLP\app referencia\lib\supabaseService.js            (deletar — duplicata)
  c:\Users\VICTUMA\Documents\Antigravity\BLP\app referencia\contexts\SupabaseAuthContext.jsx  (verificar se duplicata → possivelmente deletar)

## MUDANÇAS REQUERIDAS

### [vite-config] vite.config.js
PROBLEMA: Importa 4 plugins do Horizons que quebram build em produção externa.
SOLUÇÃO: Reescrever com config limpa — apenas react() + alias @→./src

### [assets] src/App.jsx linha ~327
PROBLEMA: src="https://storage.googleapis.com/hostinger-horizons-assets-prod/b2c2795e-d925-4369-87ee-21a5b4404bbd/5b6fec606e26bb8af5ec6b3f0c9d0686.png"
SOLUÇÃO: Baixar imagem para public/logo.png e mudar src para "/logo.png"

### [assets] public/.htaccess
PROBLEMA: Header set X-Powered-By "Hostinger Horizons"
SOLUÇÃO: Remover essa linha, manter todo o resto

### [config] package.json script build
PROBLEMA: "node tools/generate-llms.js || true && vite build"
SOLUÇÃO: "vite build"

### [supabase] customSupabaseClient.js
PROBLEMA: Segundo cliente Supabase paralelo, credenciais hardcoded sem retry
SOLUÇÃO: Verificar se alguém importa, deletar se não usado

### [supabase] lib/supabaseService.js (na raiz, fora de src/)
PROBLEMA: Duplicata de src/lib/supabaseService.js
SOLUÇÃO: Deletar

### [supabase] contexts/SupabaseAuthContext.jsx (na raiz)
PROBLEMA: Possível duplicata de src/contexts/SupabaseAuthContext.jsx
SOLUÇÃO: Comparar conteúdo — se iguais, deletar da raiz

## REGRAS DE COORDENAÇÃO
1. Leia este arquivo ANTES de qualquer mudança
2. Toque SOMENTE os arquivos do seu ownership acima
3. Escreva AGENT_LOG_[seunome].md ao terminar
4. Nunca toque arquivos de outro agente
---
