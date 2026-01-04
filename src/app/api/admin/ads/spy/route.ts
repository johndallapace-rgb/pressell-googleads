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
    const { competitor_copy, product_context } = await request.json();

    if (!competitor_copy || typeof competitor_copy !== 'string') {
      return NextResponse.json({ error: 'Competitor copy is required' }, { status: 400 });
    }

    const contextString = product_context 
        ? `MY PRODUCT CONTEXT:\nName: ${product_context.name}\nVertical: ${product_context.vertical}\nDescription: ${product_context.description || ''}`
        : 'MY PRODUCT CONTEXT: General high-quality affiliate product.';

    const prompt = `
      Você é um especialista em Inteligência Competitiva e Copywriting para Google Ads. Sua tarefa é analisar anúncios de concorrentes e criar variações superiores.
      
      ${contextString}

      COMPETITOR AD COPY TO ANALYZE:
      "${competitor_copy.substring(0, 3000)}"

      Passo 1: Desconstrução do Concorrente:
      - Identifique a Promessa Principal (ex: desconto, frete grátis, resultado rápido).
      - Identifique os Gatilhos Mentais usados (Escassez, Autoridade, Prova Social).
      - Encontre o "Ponto Cego": O que eles NÃO disseram que podemos usar como arma?

      Passo 2: Criação do Anúncio Matador (The Outperformer):
      Gere 3 variações de anúncios seguindo estas regras de ouro:
      
      - Título 1 (Gancho de Atenção): Deve atacar uma dor que o concorrente ignorou ou oferecer um benefício mais forte.
      - Título 2 (Autoridade/Mecanismo): Use termos como 'Official Site', 'Natural Formula' ou '2026 Updated' para passar confiança.
      - Título 3 (Chamada de Ação): Use verbos de comando fortes e urgência real.
      
      - Descrições (90 caracteres): Devem expandir a promessa, mencionar a garantia e focar na alta CTR.

      Objetivo Final: Garantir que o anúncio gerado tenha uma CTR (Taxa de Clique) prevista maior que a do concorrente analisado, focando no público de 'Search' dos EUA.

      OUTPUT FORMAT (JSON ONLY):
      {
        "analysis": "Análise detalhada das fraquezas do concorrente e a oportunidade encontrada...",
        "variations": [
          {
            "name": "Variation A (Direct/Pain)",
            "headlines": ["Headline 1", "Headline 2", "Headline 3"],
            "descriptions": ["Desc 1", "Desc 2"]
          },
          {
            "name": "Variation B (Curiosity/Dream)",
            "headlines": ["Headline 1", "Headline 2", "Headline 3"],
            "descriptions": ["Desc 1", "Desc 2"]
          },
           {
            "name": "Variation C (Authority/Proof)",
            "headlines": ["Headline 1", "Headline 2", "Headline 3"],
            "descriptions": ["Desc 1", "Desc 2"]
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
