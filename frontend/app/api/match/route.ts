import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { chatWithGroq } from "@/lib/groq"

export async function POST(req: Request) {
  try {
    const { city, job_description } = await req.json()
    const supabase = createClient()
    
    // 1. Fetch available workers in city
    const { data: workers } = await supabase
      .from("profiles")
      .select("id, full_name, job_category, hourly_rate, bio")
      .eq("role", "worker")
      .eq("availability", true)
      .ilike("city", city)

    if (!workers || workers.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    // 2. Format worker list for AI
    const workerList = workers.map(w => 
      `ID: ${w.id}, Name: ${w.full_name}, Category: ${w.job_category}, Rate: ₹${w.hourly_rate}/hr, Bio: ${w.bio}`
    ).join("\n")

    // 3. Ask AI to match
    const prompt = `Here are available workers in ${city}:
${workerList}

The customer needs: ${job_description}

Rank the top 3 best matches and give a short reason for each. Return ONLY a JSON array of objects with keys: worker_id, name, reason.`

    const aiResponse = await chatWithGroq([{ role: "user", content: prompt }])
    
    // Try to parse JSON from AI response
    try {
      const jsonStr = aiResponse.match(/\[[\s\S]*\]/)?.[0] || aiResponse
      const recommendations = JSON.parse(jsonStr)
      return NextResponse.json({ recommendations })
    } catch (e) {
      // Fallback if AI doesn't return perfect JSON
      return NextResponse.json({ recommendations: workers.slice(0, 3).map(w => ({
        worker_id: w.id,
        name: w.full_name,
        reason: "Matched based on city and availability."
      }))})
    }
  } catch (error) {
    return NextResponse.json({ error: "Matching failed" }, { status: 500 })
  }
}
