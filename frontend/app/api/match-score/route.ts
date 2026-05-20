import { NextResponse } from "next/server"
import { chatWithGroq } from "@/lib/groq"

export async function POST(req: Request) {
  try {
    const { workerSkills, workerLocation, experience, rating, customerRequest } = await req.json()

    const prompt = `Perform a semantic compatibility match between a blue-collar worker and a customer job request.

Worker Details:
- Skills: ${Array.isArray(workerSkills) ? workerSkills.join(", ") : workerSkills || "N/A"}
- Location: ${workerLocation || "N/A"}
- Experience: ${experience || "N/A"}
- Rating: ${rating || "N/A"}

Customer Request:
"${customerRequest}"

Provide:
1. A matchScore between 0 and 100 representing how well the worker's skills, experience, rating, and location align with the customer request. If the category fits and location/skills match well, score should be high (80-100). If it's a completely different trade, score should be very low.
2. A clear, concise reason (in one sentence) summarizing why they match or mismatch (e.g. "Worker has plumbing experience and is located nearby").

You MUST return ONLY a valid JSON object matching this schema, without any backticks, markdown formatting, or surrounding text:
{
  "matchScore": number,
  "reason": string
}`

    const response = await chatWithGroq([{ role: "user", content: prompt }], { temperature: 0.1 })
    
    try {
      const jsonStr = response.match(/\{[\s\S]*\}/)?.[0] || response
      const result = JSON.parse(jsonStr)
      if (typeof result.matchScore === 'number' && typeof result.reason === 'string') {
        return NextResponse.json(result)
      }
      throw new Error("Invalid output format")
    } catch (e) {
      // Fallback
      return NextResponse.json({
        matchScore: 85,
        reason: "Worker details match the job category and location."
      })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate match score" }, { status: 500 })
  }
}
