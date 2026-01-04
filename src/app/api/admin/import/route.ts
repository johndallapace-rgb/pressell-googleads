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
      Você é um Copywriter Sênior especializado em VSL (Video Sales Letters) e Pre-sells de alta conversão para tráfego direto no Google Ads. Sua missão é analisar o conteúdo de um site oficial e criar uma Pre-sell no formato Review Vertical.

      A estrutura da resposta deve seguir rigorosamente estes blocos e retornar um JSON válido:

      1. Headline Matadora (headline_suggestions): Um título que desperte curiosidade e prometa um benefício claro (ex: 'O segredo revelado para [benefício do produto]').
      2. Gancho/Lead (subheadline_suggestions): 3 frases curtas que confirmam a dor do usuário e prometem a solução encontrada no vídeo/produto.
      3. Review do Especialista:
         - Como funciona/Mecanismo Único (unique_mechanism): Explicação simples do produto e do seu diferencial.
         - Pontos Positivos (bullets_suggestions): Lista com 3 a 5 benefícios reais. Adicione um item extra com Prova Social (ex: "Mais de 10.000 clientes satisfeitos").
         - Dores que resolve (pain_points): 3 maiores problemas que o produto ataca.
      4. Vertical (vertical): Identifique o nicho (health, diy, pets, dating, finance, other).
      5. Google Ads (google_ads):
         - 3 Títulos (headlines): Max 30 chars.
         - 2 Descrições (descriptions): Max 90 chars.

      Diretrizes de Estilo:
      - Use linguagem informal, mas confiável (tom de indicação de amigo).
      - Mantenha o foco em benefícios, não apenas em características técnicas.
      - Adapte o vocabulário ao Nicho/Vertical identificado.
      - Responda em Português (ou na língua nativa do produto se for muito específica, mas prefira PT-BR se for genérico).

      Return ONLY valid JSON:
      {
        "name": "Nome do Produto",
        "vertical": "health",
        "headline_suggestions": ["Headline Matadora"],
        "subheadline_suggestions": ["Gancho (Lead)"],
        "bullets_suggestions": ["Benefício 1", "Benefício 2", "Prova Social"],
        "pain_points": ["Dor 1", "Dor 2", "Dor 3"],
        "unique_mechanism": "Explicação do Mecanismo...",
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
