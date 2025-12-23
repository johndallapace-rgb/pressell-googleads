# Google Ads Presell PWA (Multi-Language)

Este é um projeto Next.js projetado para páginas de pré-venda (Presell) focadas em conversão (BOFU), com suporte a PWA, rastreamento de campanhas, estrutura multi-produto e **Multi-Idioma**.

## Funcionalidades

- **Multi-Idioma**: Suporte nativo para EN, ES, FR, DE, IT, PT.
- **Estrutura de Funil**: Landing Page -> Quiz -> Review (c/ Vídeo) -> Oferta.
- **Multi-Produto**: Adicione novos produtos facilmente via configuração.
- **PWA Ready**: Funciona offline e instalável.
- **Tracking Avançado**: Captura automática de `gclid` e UTMs, persistindo-os até o clique final.
- **SEO Internacional**: `hreflang` e sitemaps configurados automaticamente.
- **Google Ads Safe**: Copy neutra, disclaimer obrigatório, sem autoplay, sem redirects automáticos.

## Como Rodar

1. Configure a variável de ambiente para o domínio final (importante para SEO/Sitemap):
   Crie um arquivo `.env.local`:
   ```env
   NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:3000`. O middleware irá redirecionar automaticamente para `/en` (ou seu idioma preferido).

## Como Adicionar um Novo Produto

1. Abra o arquivo `src/data/products.ts`.
2. Adicione um novo objeto ao array `products`.
3. Você deve fornecer traduções para todos os idiomas suportados (`translations` object).
   - Se não tiver tradução, pode duplicar o conteúdo em inglês.
4. O Next.js irá gerar automaticamente as rotas para todos os idiomas:
   - `/en/p/novo-produto`
   - `/es/p/novo-produto`
   - etc.

## Como Adicionar Review em Vídeo (YouTube)

No objeto de tradução do produto (`src/data/products.ts`), adicione o campo `videoReview`:

```typescript
videoReview: {
  provider: 'youtube',
  id: 'ID_DO_VIDEO', // Ex: dQw4w9WgXcQ
  title: 'Título do Vídeo'
}
```
O player carrega apenas após o clique (compliance com cookies) e não tem autoplay.

## Como Configurar Links de Afiliado

No arquivo `src/data/products.ts`, altere o campo `officialUrl` de cada produto. O sistema anexa automaticamente os parâmetros de rastreamento.

## Deploy

```bash
npm run build
npm start
```
