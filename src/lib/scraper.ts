import * as cheerio from 'cheerio';
import { generateContent } from './gemini';

/**
 * Scrapes a URL, cleans the HTML, and extracts relevant text.
 * If the content exceeds 20k characters, it uses Gemini to summarize it.
 */
export async function scrapeAndClean(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Remove unwanted elements
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();
    $('header').remove();
    $('footer').remove();
    $('nav').remove();
    $('svg').remove();
    $('[aria-hidden="true"]').remove();

    // 2. Extract relevant text
    // We prioritize main content areas if possible, but general extraction is safer for generic sites
    let textParts: string[] = [];

    // Extract Headings
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text) textParts.push(`HEADLINE: ${text}`);
    });

    // Extract Paragraphs and List Items
    $('p, li').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 20) { // Filter out very short snippets
        textParts.push(text);
      }
    });
    
    // Extract Price info specifically (heuristic)
    $('*:contains("$")').each((_, el) => {
         // This is a bit loose, but we try to catch pricing
         const text = $(el).text().trim();
         if (text.includes('$') && text.length < 50 && !textParts.includes(text)) {
             textParts.push(`PRICE: ${text}`);
         }
    });

    // Extract FAQs (Details/Summary)
    $('details').each((_, el) => {
        const question = $(el).find('summary').text().trim();
        const answer = $(el).contents().not('summary').text().trim();
        if (question && answer) {
            textParts.push(`FAQ Q: ${question}\nFAQ A: ${answer}`);
        }
    });

    // Extract Lists (Bullets)
    $('ul, ol').each((_, el) => {
        const items: string[] = [];
        $(el).find('li').each((_, li) => {
             const liText = $(li).text().trim();
             if (liText.length > 10 && liText.length < 200) {
                 items.push(`- ${liText}`);
             }
        });
        if (items.length > 0) {
            textParts.push(`LIST:\n${items.join('\n')}`);
        }
    });

    // Join and clean up whitespace
    let cleanedText = textParts.join('\n\n');
    
    // 3. Summarizer Logic (Cost Saving)
    if (cleanedText.length > 20000) {
        console.log(`[Scraper] Content length ${cleanedText.length} > 20k. Summarizing...`);
        const summaryPrompt = `
            Analyze the following landing page content and summarize the key selling points, 
            promises, guarantees, and pricing offers. 
            Keep it under 4000 characters but retain all specific claims and "hooks".
            
            CONTENT:
            ${cleanedText.substring(0, 30000)}
        `;
        try {
            cleanedText = await generateContent(summaryPrompt);
            cleanedText = "=== AI SUMMARIZED CONTENT ===\n" + cleanedText;
        } catch (e) {
            console.error('[Scraper] Summarization failed, using truncated text.', e);
            cleanedText = cleanedText.substring(0, 20000) + "\n...[TRUNCATED]";
        }
    }

    return cleanedText;

  } catch (error: any) {
    console.error('[Scraper] Error:', error);
    throw new Error(`Scraping failed: ${error.message}`);
  }
}
