import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

export const runtime = 'edge'; // Optional: Use edge if possible, but standard node is safer for complex AI logic

export async function POST(req: NextRequest) {
    try {
        const { productName, intent, language = 'en', context } = await req.json();

        if (!productName || !intent) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Construct Prompt
        const prompt = `
        You are an expert Copywriter for Direct Response Marketing.
        Generate a high-converting presell page content for the product "${productName}".
        
        The user is searching with the intent: "${intent}".
        Target Language: "${language}".
        
        Context about the product:
        ${JSON.stringify(context || {})}

        Requirements:
        1. Tailor the content specifically for the "${intent}" intent.
           - If intent is 'review', focus on analysis, pros/cons, and final verdict.
           - If intent is 'results', focus on timeframes, expected outcomes, and user testimonials.
           - If intent is 'side-effects', focus on safety, ingredients, and reassurance.
           - If intent is 'price', focus on packages, discounts, and value for money.
           - If intent is 'benefits', focus on lifestyle changes and health improvements.
        2. Use persuasive, emotional language but keep it compliant (no false medical claims).
        3. Return strictly valid JSON.

        Output Format (JSON):
        {
            "headline": "Main headline capturing the intent",
            "subheadline": "Supporting subheadline",
            "story": "A 3-4 paragraph intro/story addressing the user's search intent directly.",
            "benefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5"],
            "cta_text": "Strong Call to Action",
            "faq": [
                { "question": "Relevant Question 1?", "answer": "Answer 1" },
                { "question": "Relevant Question 2?", "answer": "Answer 2" },
                { "question": "Relevant Question 3?", "answer": "Answer 3" }
            ]
        }
        `;

        const responseText = await generateContent(prompt);
        
        // Clean JSON
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const content = JSON.parse(cleanJson);

        return NextResponse.json(content);

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate content' }, { status: 500 });
    }
}
