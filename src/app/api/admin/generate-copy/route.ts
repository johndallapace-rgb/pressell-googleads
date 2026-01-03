import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { productName, niche, competitorText, tone } = await request.json();

    if (!productName || !niche) {
      return NextResponse.json({ error: 'Product Name and Niche are required' }, { status: 400 });
    }

    const systemInstruction = `
      Você é um Estrategista de Vendas Fundo de Funil (BOFU) e Copywriter Sênior.
      Seu objetivo é criar uma copy de alta conversão que supere a concorrência usando psicologia de vendas.

      Produto: ${productName}
      Nicho: ${niche}
      Tom de Voz: ${tone || 'Persuasivo'}
      ${competitorText ? `
      CONTEXTO DO CONCORRENTE:
      "${competitorText}"
      
      MISSÃO CRÍTICA:
      1. Identifique a "Big Promise" (Promessa Central) do concorrente acima.
      2. Crie uma "Counter-Intuitive Approach" (Abordagem Contra-Intuitiva) que faça o produto atual parecer superior ou mais inteligente.
      ` : ''}

      DIRETRIZES PSICOLÓGICAS:
      - Escolha UM destes ângulos para a copy principal: "Medo de Perder (FOMO)", "Descoberta Científica Recente" ou "Facilidade Extrema".
      - Use gatilhos de Autoridade (ex: "estudos mostram", "especialistas") e Escassez (ex: "oferta limitada") sutilmente.

      COMPLIANCE GOOGLE ADS (CRUCIAL):
      - NUNCA use palavras banidas como: "Cura", "Milagroso", "Garantido", "Desaparecer instantaneamente", "Perda de peso rápida".
      - USE termos seguros: "Apoio à saúde", "Fórmula avançada", "Resultados comprovados", "Bem-estar", "Auxilia".

      Retorne APENAS um JSON válido com esta estrutura exata:
      {
        "headline": "Headline de alta conversão (max 60 chars)",
        "subheadline": "Subheadline quebra de objeção (max 100 chars)",
        "content": "Texto persuasivo de presell (3-4 parágrafos). Use HTML básico (<p>, <strong>).",
        "bulletPoints": ["Benefício 1", "Benefício 2", "Benefício 3", "Benefício 4", "Benefício 5"],
        "adAngles": ["Ângulo Conservador (Foco em segurança/ingredientes)", "Ângulo Agressivo (Foco em dor/resultado)", "Ângulo Curiosidade (Foco em mecanismo único)"],
        "ctaAnalysis": "Explicação breve (2 linhas) de POR QUE essa copy converte mais que a do concorrente e qual ângulo psicológico foi usado.",
        "ads": {
           "headlines": [
              "Título 1 (max 30)", "Título 2 (max 30)", "Título 3 (max 30)", "Título 4 (max 30)", "Título 5 (max 30)",
              "Título 6 (max 30)", "Título 7 (max 30)", "Título 8 (max 30)", "Título 9 (max 30)", "Título 10 (max 30)"
           ],
           "descriptions": [
              "Descrição 1 (max 90, CTA forte)", "Descrição 2 (max 90, Benefício)", 
              "Descrição 3 (max 90, Prova Social)", "Descrição 4 (max 90, Escassez)"
           ]
        }
      }
    `;

    const generatedText = await generateContent(systemInstruction);
    
    const jsonString = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse Gemini response:', jsonString);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Generate Copy Error]', error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
