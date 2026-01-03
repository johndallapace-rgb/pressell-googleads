import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { productName, niche, competitorText, tone, layout, mode } = await request.json();

    if (!productName) {
      return NextResponse.json({ error: 'Product Name is required' }, { status: 400 });
    }

    // MODE: STRUCTURE (Quick Generation based on Name only)
    if (mode === 'structure') {
      const structureSystemInstruction = `
        Você é um Especialista em Marketing Digital e Classificação de Produtos.
        Seu objetivo é analisar o nome de um produto e gerar automaticamente sua estrutura base.

        Produto: ${productName}

        TAREFAS:
        1. Identifique o Nicho (Vertical) mais provável entre: 'health', 'diy', 'pets', 'dating', 'finance', 'other'.
        2. Crie um Slug URL-friendly (apenas letras minúsculas, números e hífens).
        3. Escreva uma Copy Base (Editorial) persuasiva.

        Retorne APENAS um JSON válido com esta estrutura:
        {
          "vertical": "health", // ou outro nicho identificado
          "slug": "nome-do-produto-exemplo",
          "headline": "Headline principal chamativa",
          "subheadline": "Subheadline complementar",
          "content": "Introdução persuasiva para um artigo editorial (2-3 parágrafos). Fale sobre o problema que o produto resolve.",
          "bullets": ["Benefício 1", "Benefício 2", "Benefício 3"]
        }
      `;

      const generatedText = await generateContent(structureSystemInstruction);
      const jsonString = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const data = JSON.parse(jsonString);
        return NextResponse.json(data);
      } catch (e) {
        console.error('Failed to parse Gemini structure response:', jsonString);
        return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
      }
    }

    // MODE: REGENERATE ADS (Only Ads, specific angle)
    if (mode === 'regenerate_ads') {
        const { angle } = await request.json(); // e.g. "Price", "Curiosity", "Authority"
        
        const adsSystemInstruction = `
            Você é um Especialista em Google Ads focado em CTR.
            
            Produto: ${productName}
            Nicho: ${niche}
            Ângulo Focado: ${angle || 'Geral/Persuasivo'}
            
            TAREFA:
            Gere novos títulos e descrições para anúncios de pesquisa, focando EXCLUSIVAMENTE no ângulo solicitado.
            
            REGRAS:
            - Headlines: Max 30 caracteres. Seja direto e impactante.
            - Descriptions: Max 90 caracteres. Inclua Call to Action (CTA).
            - Compliance: Sem promessas falsas, sem palavras banidas (Cura, Milagre).
            
            Retorne APENAS um JSON:
            {
                "ads": {
                    "headlines": ["Titulo 1", "Titulo 2", ...], // 10 variações
                    "descriptions": ["Desc 1", "Desc 2", ...] // 4 variações
                }
            }
        `;

        const generatedText = await generateContent(adsSystemInstruction);
        const jsonString = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            const data = JSON.parse(jsonString);
            return NextResponse.json(data);
        } catch (e) {
            return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
        }
    }

    // MODE: FULL COPY (Default)
    if (!niche) {
      return NextResponse.json({ error: 'Niche is required for full copy generation' }, { status: 400 });
    }

    const isQuiz = layout === 'quiz';
    const isAdvertorial = layout === 'story' || layout === 'advertorial';

    const systemInstruction = `
      Você é um Estrategista de Vendas Fundo de Funil (BOFU) e Copywriter Sênior.
      Seu objetivo é criar uma copy de alta conversão que supere a concorrência usando psicologia de vendas.

      Produto: ${productName}
      Nicho: ${niche}
      Tom de Voz: ${tone || 'Persuasivo'}
      Layout/Formato: ${isQuiz ? 'Quiz Interativo (Lead Segmentation)' : isAdvertorial ? 'Advertorial (Storytelling)' : 'Página de Vendas Direta'}
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

      ${isQuiz ? `
      REGRAS PARA QUIZ:
      - Crie 3 a 5 perguntas estratégicas que ajudem a segmentar o lead e aumentar o desejo.
      - As perguntas devem começar fáceis e ficar mais específicas (técnica de "Micro-Compromisso").
      - As opções de resposta devem validar a dor do usuário.
      ` : ''}

      COMPLIANCE GOOGLE ADS (CRUCIAL):
      - NUNCA use palavras banidas como: "Cura", "Milagroso", "Garantido", "Desaparecer instantaneamente", "Perda de peso rápida".
      - USE termos seguros: "Apoio à saúde", "Fórmula avançada", "Resultados comprovados", "Bem-estar", "Auxilia".

      Retorne APENAS um JSON válido com esta estrutura exata:
      {
        "headline": "Headline de alta conversão (max 60 chars)",
        "subheadline": "Subheadline quebra de objeção (max 100 chars)",
        "content": "Texto persuasivo de presell (3-4 parágrafos). Use HTML básico (<p>, <strong>). Se for Quiz, use este campo para a intro antes do botão 'Começar'.",
        "bulletPoints": ["Benefício 1", "Benefício 2", "Benefício 3", "Benefício 4", "Benefício 5"],
        "imagePrompt": "Descrição detalhada para gerar uma imagem realista e de alta conversão para este produto (ex: foto de pessoa feliz, ou close no produto, estilo editorial).",
        ${isQuiz ? `
        "quizQuestions": [
          {
            "id": "q1",
            "question": "Texto da Pergunta 1",
            "options": [
               { "text": "Opção A", "value": "a" },
               { "text": "Opção B", "value": "b" }
            ]
          },
          {
            "id": "q2",
            "question": "Texto da Pergunta 2",
            "options": [
               { "text": "Opção A", "value": "a" },
               { "text": "Opção B", "value": "b" }
            ]
          },
          {
             "id": "q3",
             "question": "Texto da Pergunta 3",
             "options": [
                { "text": "Opção A", "value": "a" },
                { "text": "Opção B", "value": "b" }
             ]
          }
        ],
        ` : ''}
        "adAngles": ["Ângulo Conservador", "Ângulo Agressivo", "Ângulo Curiosidade"],
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
