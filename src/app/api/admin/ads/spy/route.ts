import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { competitor_copy, product_context, competitor_url } = await request.json();

    if ((!competitor_copy || typeof competitor_copy !== 'string') && !competitor_url) {
      return NextResponse.json({ error: 'Competitor copy OR URL is required' }, { status: 400 });
    }

    let scrapedContent = "";
    if (competitor_url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for spy
            
            const res = await fetch(competitor_url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                }
            });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const html = await res.text();
                // Clean HTML
                scrapedContent = html
                    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
                    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "")
                    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gim, "")
                    .replace(/<!--[\s\S]*?-->/g, "")
                    .replace(/\s+/g, " ")
                    .slice(0, 15000); // Limit to 15k chars for context
                
                scrapedContent = `\n\nCOMPETITOR LANDING PAGE CONTENT:\n${scrapedContent}`;
            }
        } catch (e) {
            console.error('Spy fetch failed', e);
            // Continue without scraped content
        }
    }

    const contextString = product_context 
        ? `MY PRODUCT CONTEXT:\nName: ${product_context.name}\nVertical: ${product_context.vertical}\nDescription: ${product_context.description || ''}`
        : 'MY PRODUCT CONTEXT: General high-quality affiliate product.';

    const prompt = `
      Você é um especialista em Inteligência Competitiva e Copywriting para Google Ads. Sua tarefa é analisar anúncios de concorrentes e criar variações superiores.
      
      ${contextString}

      COMPETITOR AD COPY TO ANALYZE:
      "${competitor_copy.substring(0, 3000)}"
      ${scrapedContent}

      Passo 1: Desconstrução do Concorrente:
      - Identifique a Promessa Principal (ex: desconto, frete grátis, resultado rápido).
      - Identifique os Gatilhos Mentais usados (Escassez, Autoridade, Prova Social).
      - Encontre o "Ponto Cego": O que eles NÃO disseram que podemos usar como arma?

      Passo de Segurança (Compliance Check):
      - Antes de gerar qualquer texto, verifique se o conteúdo extraído ou a sua sugestão viola as políticas do Google Ads (ex: promessas de cura milagrosa, perda de peso irrealista, declarações falsas).
      - Se encontrar violações graves, suavize a promessa nas variações para focar no benefício seguro (ex: "Support Weight Loss" em vez de "Lose 10kg in 2 days").

      Passo 2: Criação do Anúncio Matador (The Outperformer):
      Gere 3 variações de anúncios seguindo estas regras de ouro:
      
      - Título 1 (Gancho de Atenção): Deve atacar uma dor que o concorrente ignorou ou oferecer um benefício mais forte.
      - Título 2 (Autoridade/Mecanismo): Use termos como 'Official Site', 'Natural Formula' ou '2026 Updated' para passar confiança.
      - Título 3 (Chamada de Ação): Use verbos de comando fortes e urgência real.
      
      - Descrições (90 caracteres): Devem expandir a promessa, mencionar a garantia e focar na alta CTR. Se o contexto do produto incluir campos de rastreamento, inclua menções inteligentes ao Pixel ID 17850696537 se fizer sentido para o formato (geralmente não visível, mas como instrução de setup).
      
      - Pixel Injection: Indique onde colocar o Pixel ID 17850696537 (ex: tracking_template ou final_url_suffix).

      Objetivo Final: Garantir que o anúncio gerado tenha uma CTR (Taxa de Clique) prevista maior que a do concorrente analisado, focando no público de 'Search' dos EUA.

      OUTPUT FORMAT (JSON ONLY):
      {
        "analysis": "Análise detalhada das fraquezas do concorrente e a oportunidade encontrada...",
        "variations": [
          {
            "name": "Variation A (Direct/Pain)",
            "headlines": ["Headline 1", "Headline 2", "Headline 3"],
            "descriptions": ["Desc 1", "Desc 2"],
            "pixel_instruction": "Instructions on where to place the pixel ID..."
          },
          {
            "name": "Variation B (Curiosity/Dream)",
            "headlines": ["Headline 1", "Headline 2", "Headline 3"],
            "descriptions": ["Desc 1", "Desc 2"],
            "pixel_instruction": "..."
          },
           {
            "name": "Variation C (Authority/Proof)",
            "headlines": ["Headline 1", "Headline 2", "Headline 3"],
            "descriptions": ["Desc 1", "Desc 2"],
            "pixel_instruction": "..."
          }
        ]
      }
    `;

    const aiResponse = await generateContent(prompt);
    
    // Clean JSON
    const jsonString = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonString);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Ad Spy Analysis failed:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
