import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';
import { scrapeAndClean } from '@/lib/scraper';

export const runtime = 'nodejs';

interface ImportResult {
  name?: string;
  image_url?: string;
  headline_suggestions: string[];
  subheadline_suggestions: string[];
  bullets_suggestions: string[];
  pain_points?: string[];
  unique_mechanism?: string;
  seo: {
    title: string;
    description: string;
  };
  vertical?: string;
  google_ads?: {
    headlines: string[];
    descriptions: string[];
  };
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value;
  if (!token || !(await verifyToken(token))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { official_url, strategy } = await request.json(); // Read strategy

    if (!official_url || !official_url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Use unified scraper logic
    const cleanText = await scrapeAndClean(official_url);

    // Define Strategy Context
    let strategyContext = "";
    if (strategy === 'pain') {
        strategyContext = `
        FOCO: DOR INTENSA (Pain-Agitate-Solution).
        - A Headline deve tocar na ferida mais profunda do cliente.
        - O Lead deve validar a frustração de já ter tentado de tudo.
        - Use linguagem emocional de urgência e medo de perder a chance.
        `;
    } else if (strategy === 'dream') {
        strategyContext = `
        FOCO: SONHO E TRANSFORMAÇÃO (Future Pacing).
        - A Headline deve vender o resultado final desejado (o "corpo dos sonhos", a "liberdade financeira").
        - O Lead deve fazer o usuário imaginar como será a vida após usar o produto.
        - Use linguagem inspiradora e positiva.
        `;
    } else {
        strategyContext = `
        FOCO: EQUILÍBRIO (Neurovendas Padrão).
        - Balanceie a dor do problema com a esperança da solução.
        - Siga os princípios de contraste (Antes vs Depois).
        `;
    }

    // AI Analysis
    const prompt = `
      Aja como um especialista em Neurovendas e Marketing de Resposta Direta. Sua tarefa é analisar a URL oficial fornecida e criar uma Pre-sell (página de pré-venda) de alta conversão.
      
      ESTRATÉGIA SELECIONADA: ${strategyContext}

      IMPORTANTE: Use o conteúdo fornecido abaixo como a ÚNICA fonte de verdade. Não invente fatos ou alucine informações que não estejam no texto.

      Siga estes Princípios de Neurovendas:
      1. Ativação do Cérebro Reptiliano: Foque na sobrevivência, prazer imediato ou alívio de uma dor latente. Use frases curtas e de forte impacto emocional.
      2. O Mecanismo Único: Identifique e destaque o 'segredo' ou a 'descoberta' que faz este produto ser diferente de tudo o que o usuário já tentou.
      3. Contraste de Cenários: Pinte o quadro do 'Antes' (dor e frustração) versus o 'Depois' (alívio e sucesso).

      A estrutura da resposta deve seguir rigorosamente estes blocos e retornar um JSON válido:

      1. Headline Magnética (headline_suggestions): Um título que pare o scroll do usuário e use um gatilho de curiosidade ou benefício extremo.
      2. Lead de Conexão (subheadline_suggestions): 3 frases curtas que confirmam a dor do usuário e prometem a solução encontrada no vídeo/produto. (Ex: "Eu sei como é passar por [DOR]...")
      3. Review do Especialista:
         - A Revelação/Mecanismo Único (unique_mechanism): Apresente o produto como a solução definitiva, baseada na análise da URL oficial.
         - 3 Provas de Autoridade (bullets_suggestions): Extraia fatos, números ou depoimentos reais que estão no site oficial.
         - Dores que resolve (pain_points): 3 maiores problemas que o produto ataca.
      4. Vertical (vertical): Identifique o nicho (health, diy, pets, dating, finance, other).
      5. Google Ads (google_ads):
         - 3 Títulos (headlines): Max 30 chars.
         - 2 Descrições (descriptions): Max 90 chars.

      Diretrizes de Estilo:
      - Linguagem natural e humana (evite termos robóticos como 'revolucionário' ou 'inovador').
      - Mantenha o tom de uma indicação pessoal e imparcial (Review).
      - Responda em Português.

      Return ONLY valid JSON:
      {
        "name": "Nome do Produto",
        "vertical": "health",
        "headline_suggestions": ["Headline Magnética"],
        "subheadline_suggestions": ["Lead de Conexão"],
        "bullets_suggestions": ["Prova 1", "Prova 2", "Prova 3"],
        "pain_points": ["Dor 1", "Dor 2", "Dor 3"],
        "unique_mechanism": "A Revelação...",
        "seo": { "title": "SEO Title", "description": "SEO Desc" },
        "google_ads": {
            "headlines": ["Ad 1", "Ad 2", "Ad 3"],
            "descriptions": ["Desc 1", "Desc 2"]
        }
      }

      CONTENT TO ANALYZE:
      ${cleanText}
    `;

    const aiResponse = await generateContent(prompt);
    const jsonString = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error('Failed to parse AI response', jsonString);
        throw new Error('AI analysis failed');
    }

    const result: ImportResult = {
        ...data,
        // We removed manual image extraction in scraper to save time/complexity, 
        // rely on AI guess or placeholder.
        image_url: data.image_url 
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
