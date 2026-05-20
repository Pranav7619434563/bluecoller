import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function chatWithGroq(
  messages: { role: "system" | "user" | "assistant", content: string }[],
  options?: { temperature?: number }
) {
  const modelsToTry = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-8b-8192'
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const completion = await groq.chat.completions.create({
        messages: messages,
        model: modelName,
        temperature: options?.temperature ?? 0.7,
      });
      if (completion) {
        return completion.choices[0]?.message?.content || "";
      }
    } catch (err: any) {
      console.warn(`Groq model ${modelName} failed or rate limited in matchmaking:`, err.message || err);
      lastError = err;
    }
  }

  console.error("All Groq models exhausted. Groq Chat Error:", lastError);
  throw lastError || new Error("All Groq models exhausted");
}

export async function describeImageWithGroq(base64Image: string, prompt: string) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
    });

    return completion.choices[0]?.message?.content || "";
  } catch (err) {
    console.error("Groq Image Error:", err);
    return "I'm unable to analyze the image right now because the AI service is unreachable. Please try again later. अभी इमेज एनालिसिस काम नहीं कर रहा है।";
  }
}
