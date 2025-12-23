# Google Ads Presell - Mitolyn Campaign

Este é um projeto Next.js otimizado para campanhas de Google Ads (Presell), focado em **conversão**, **compliance** e **performance**.

## Características Principais

- **Produto Único**: Focado em Mitolyn.
- **Ads Safe**: Layout editorial ("Advertorial/Review"), disclaimers claros, sem promessas enganosas.
- **Single Language**: Inglês (EN) fixo.
- **Edge Config**: Configuração dinâmica de links e vídeo sem redeploy (via Vercel Edge Config).
- **Outbound Redirect**: Links de saída camuflados (`/api/out`) para proteção de tracking e compliance.
- **Video Review**: Embed YouTube otimizado (click-to-load).
- **Admin Panel**: Painel simples para editar links e configurações.

## Configuração Obrigatória (Vercel)

Para que o projeto funcione corretamente na Vercel, você deve configurar as seguintes Variáveis de Ambiente:

### 1. Autenticação do Admin
```env
ADMIN_EMAIL=seu@email.com
ADMIN_PASSWORD=sua_senha_secreta
```

### 2. Edge Config (Dinâmico)
Crie um Edge Config na Vercel e adicione a Connection String:
```env
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_...
```

Para que o Admin consiga *escrever* no Edge Config, você precisa de um Token de API da Vercel e o ID do Edge Config:
```env
VERCEL_API_TOKEN=seu_token_da_vercel
EDGE_CONFIG_ID=ecfg_...
```

### 3. Outros
```env
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
NEXT_PUBLIC_AFFILIATE_PARAM=aff  # Parâmetro de afiliado na URL de entrada (ex: ?aff=123)
JWT_SECRET=gere_uma_string_aleatoria
```

## Estrutura do Edge Config

O Edge Config deve ter uma chave `campaign_config` com o seguinte formato JSON:

```json
{
  "default_lang": "en",
  "active_product_slug": "mitolyn",
  "products": {
    "mitolyn": {
      "name": "Mitolyn",
      "platform": "clickbank",
      "official_url": "https://mitolyn.com/welcome/?hop=zzzzz&hopId=689154d7-cdcb-4751-8970-bcbe6f44c1fc",
      "affiliate_url": "https://22ce2d09wbexoq6fts-b0b7ufm.hop.clickbank.net",
      "youtube_review_id": "PSd-VG31tcE"
    }
  }
}
```

## Rotas Importantes

- `/`: Redireciona para o presell (`/en/p/mitolyn`).
- `/en/p/mitolyn`: Página de Vendas (Presell).
- `/en/p/mitolyn/quiz`: Quiz interativo.
- `/en/p/mitolyn/review`: Página de Review pós-quiz.
- `/admin`: Painel administrativo.
- `/api/out?slug=mitolyn`: Link de saída (redireciona para o link de afiliado).

## Desenvolvimento Local

1. Instale dependências:
   ```bash
   npm install
   ```

2. Crie um arquivo `.env` com as variáveis acima.

3. Rode o servidor:
   ```bash
   npm run dev
   ```

4. Build de produção:
   ```bash
   npm run build
   ```
