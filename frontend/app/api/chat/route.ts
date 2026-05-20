import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, language = "english", history = [] } = await req.json();
    const activeLang = language.toLowerCase() as 'english' | 'hindi' | 'kannada';

    const replyRules = {
      english: `STRICT: Reply ONLY in English. No Hindi. No Kannada. Pure English.`,
      hindi:   `STRICT: Reply ONLY in Hindi using Devanagari script (हिंदी). \nNo English words. No Kannada. No Roman script.`,
      kannada: `STRICT: Reply ONLY in Kannada using Kannada script (ಕನ್ನಡ). \nNo English words. No Hindi. No Roman script.`
    };

    const systemPrompt = `
      You are WorkForce AI Assistant for Karnataka, India.
      You help users find local workers: plumbers, electricians, carpenters, etc.

      ${replyRules[activeLang] || replyRules['english']}

      Format worker details as:
        Name / ಹೆಸರು / नाम : [value]
        Phone / ಸಂಖ್ಯೆ / नंबर : [digits only]
        Address / ವಿಳಾಸ / पता : [value]
        Charge / ಶುಲ್ಕ / शुल्क : [value]
    `;

    // Map history to the exact format needed by Groq
    const mappedHistory = Array.isArray(history) ? history.map((m: any) => ({
      role: m.role,
      content: m.content
    })) : [];

    const modelsToTry = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'llama3-8b-8192'
    ];

    let completion = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        completion = await groq.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            ...mappedHistory,
            { role: 'user',   content: message }
          ],
          temperature: 0.4,
          max_tokens: 1024,
        });
        if (completion) {
          console.log(`Groq request succeeded using fallback model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Groq model ${modelName} failed or rate limited:`, err.message || err);
        lastError = err;
      }
    }

    if (!completion) {
      throw lastError || new Error("All Groq models exhausted");
    }

    const reply = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Groq not responding" }, { status: 500 });
  }
}
