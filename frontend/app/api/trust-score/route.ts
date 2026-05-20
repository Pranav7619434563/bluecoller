import { NextResponse } from "next/server";
import { generateWithOllama } from "@/lib/ollama";

export async function POST(req: Request) {
  try {
    const { verificationData } = await req.json();
    if (!verificationData) {
      return NextResponse.json({ error: "Missing verification data" }, { status: 400 });
    }

    const prompt = `You are a strict Trust & Safety Verification AI for a service marketplace.
Review the following worker data:
${JSON.stringify(verificationData, null, 2)}

Tasks:
1. Verify if the name on the ID closely matches the worker's profile name.
2. Evaluate the document type and check if the format of the ID number looks reasonable.
3. Calculate a realistic, unique Trust Score (0-100) based on this holistic data (Name match, document quality, profile rating, experience, app stats).
4. List the top 3 specific factors that influenced this exact score based on the data provided.

Return ONLY as JSON { "score": number, "factors": string[] }. Do not include any other text or markdown backticks.`;

    const aiResponse = await generateWithOllama(prompt);
    
    try {
      const jsonStr = aiResponse.match(/\{[\s\S]*\}/)?.[0] || aiResponse;
      const data = JSON.parse(jsonStr);
      return NextResponse.json({ data });
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse AI response", raw: aiResponse }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Trust Score Error:", error);
    return NextResponse.json({ error: error.message || "Score generation failed" }, { status: 500 });
  }
}
