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

      STRICT TOPIC LIMITATION:
      1. You must ONLY answer queries directly related to WorkForce AI, finding or hiring local workers (like plumbers, electricians, carpenters, painters, masons, cleaners, drivers, guards, cooks, gardeners, pest control, etc.) in Karnataka, India, or helping with WorkForce AI app features.
      2. If the user asks about ANY topic that is NOT related to WorkForce AI or hiring local workers in Karnataka (for example: programming, writing essays, recipes, math, history, general knowledge, generic chatting, questions about other regions, etc.), you MUST politely decline to answer.
      3. Decline Messages by Language (use the exact message matching the active language):
         - English: "I can only help with queries related to WorkForce AI and hiring local workers in Karnataka."
         - Hindi: "मैं केवल वर्कफोर्स एआई और कर्नाटक में स्थानीय कारीगरों को खोजने से संबंधित प्रश्नों में ही आपकी मदद कर सकता हूँ।"
         - Kannada: "ನಾನು ವರ್ಕ್‌ಫೋರ್ಸ್ ಎಐ ಮತ್ತು ಕರ್ನಾಟಕದಲ್ಲಿ ಸ್ಥಳೀಯ ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕುವ ಕುರಿತಾದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ."

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
