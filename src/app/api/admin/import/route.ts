import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateContent } from '@/lib/gemini';

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
    const { official_url } = await request.json();

    if (!official_url || !official_url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    const res = await fetch(official_url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${res.status}` }, { status: 400 });
    }

    const html = await res.text();
    
    // Safety check
    if (html.length > 5 * 1024 * 1024) { 
         return NextResponse.json({ error: 'Page too large to process' }, { status: 400 });
    }

    // Clean HTML for AI (Remove scripts, styles, svgs to save tokens)
    const cleanText = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, "")
        .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gim, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 100000); // Limit to ~100k chars for speed

    // Extract Image separately (Regex is faster/reliable for OG tags)
    let imageUrl = '';
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (ogImageMatch) imageUrl = ogImageMatch[1];

    // AI Analysis
    const prompt = `
      Aja como um especialista em Neurovendas e Marketing de Resposta Direta. Sua tarefa é analisar a URL oficial fornecida e criar uma Pre-sell (página de pré-venda) de alta conversão.

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
        image_url: imageUrl || data.image_url // Prefer OG tag, fallback to AI
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
