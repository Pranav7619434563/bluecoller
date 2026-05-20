import { NextResponse } from "next/server";
import { describeImageWithOllama } from "@/lib/ollama";

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const prompt = `Analyze this image to verify if it is a valid government-issued ID card of one of the following types: Aadhaar Card, PAN Card, Voter ID, Passport, or Driving License.
    
    Strictly check and reject these edge cases (set "isValid" to false and provide a detailed reason):
    - Selfies or close-ups of people (not an ID card)
    - Landscapes or outdoor photos
    - Screenshots of random websites, apps, text, or chats
    - Random objects (furniture, mugs, laptops, cars, memes, etc.)
    - Blank or empty images
    - PDF documents or document screenshots that are not actual ID cards (e.g. text documents, invoices)
    - Images containing multiple completely different documents
    - Extremely low quality, blurry, or heavily cropped/cut-off images where critical ID structures cannot be seen
    - Any ID types that are NOT Aadhaar, PAN, Voter ID, Passport, or Driving License
    
    If it is a valid supported ID, verify that it has:
    - The structural layout of the card/booklet
    - Official government symbols, logos, or titles
    - Visible text fields and ID number regions
    
    Return ONLY a raw JSON object with the following structure:
    {
      "isValid": true|false,
      "docType": "Aadhaar"|"PAN"|"Voter ID"|"Passport"|"Driving License"|null,
      "confidenceScore": 0.0 to 1.0,
      "rejectionReason": "detailed explanation of why the document was rejected if isValid is false, otherwise null"
    }
    Do not include any markdown backticks or extra text, just the raw JSON.`;

    const aiResponse = await describeImageWithOllama(imageBase64, prompt);
    
    try {
      const jsonStr = aiResponse.match(/\{[\s\S]*\}/)?.[0] || aiResponse;
      const validationData = JSON.parse(jsonStr);
      
      return NextResponse.json({ data: validationData });
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse AI validation response", raw: aiResponse }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Validate ID Error:", error);
    return NextResponse.json({ error: error.message || "Validation failed" }, { status: 500 });
  }
}
