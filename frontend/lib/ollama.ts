import { chatWithGroq, describeImageWithGroq } from "./groq";

export async function generateWithOllama(prompt: string, model?: string, temperature?: number) {
  return chatWithGroq([{ role: "user", content: prompt }]);
}

export async function describeImageWithOllama(base64Image: string | null, prompt: string) {
  if (!base64Image) {
    return JSON.stringify({
      verdict: "rejected",
      confidence: 0,
      reason: "No image provided.",
      flags: ["Missing image file"]
    });
  }
  
  let cleanBase64 = base64Image;
  if (base64Image.includes(",")) {
    cleanBase64 = base64Image.split(",")[1];
  }
  
  return describeImageWithGroq(cleanBase64, prompt);
}
