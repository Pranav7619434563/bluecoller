import { NextResponse } from "next/server";
import { describeImageWithOllama } from "@/lib/ollama";

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const prompt = `Analyze this image to verify if it is a valid government-issued ID card (such as Aadhaar Card, PAN Card, Driving License, Passport, Voter ID Card, or other official identity card).
Return ONLY a raw JSON object with the following structure:
{
  "isValidId": true|false,
  "rejectionReason": "if isValidId is false, provide a polite reason why the document was rejected (e.g., 'The image appears to be a landscape photo/object, not an identity card.'), otherwise null",
  "name": "extracted full name or null",
  "idNumber": "extracted ID number or null",
  "dob": "extracted date of birth or null (format as DD-MM-YYYY or what's visible)",
  "docType": "one of 'Aadhaar', 'PAN', 'Driving License', 'Passport', 'Voter ID' or null",
  "confidenceNote": "a brief assessment of document quality, e.g., 'Good', 'Blurry', 'Possibly edited'"
}
Do not include any markdown backticks or extra text, just the raw JSON.`;

    const aiResponse = await describeImageWithOllama(imageBase64, prompt);
    
    // Try to parse JSON from AI response
    try {
      const jsonStr = aiResponse.match(/\{[\s\S]*\}/)?.[0] || aiResponse;
      const extractedData = JSON.parse(jsonStr);
      
      if (extractedData.isValidId === false) {
        return NextResponse.json({
          error: extractedData.rejectionReason || "The uploaded image was not recognized as a valid ID card. Please upload a clear image of your Aadhaar, PAN, Driving License, Passport, or Voter ID."
        }, { status: 400 });
      }

      return NextResponse.json({ data: extractedData });
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse AI response", raw: aiResponse }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Extract ID Error:", error);
    return NextResponse.json({ error: error.message || "Extraction failed" }, { status: 500 });
  }
}
