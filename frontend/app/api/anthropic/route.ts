import { NextResponse } from "next/server";
import { chatWithGroq } from "@/lib/groq";

function parseMatchResult(text: string) {
  if (text.includes("❌")) {
    return {
      recommended_category: "None",
      confidence: "low",
      reasoning: "❌ No matching blue-collar job found. Please enter skills or experience related to blue-collar professions only.",
      tags: []
    };
  }
  const jobMatch = text.match(/Job Match:\s*(.+)/)?.[1]?.trim() || "None";
  const scoreMatch = text.match(/Match Score:\s*(.+)/)?.[1]?.trim() || "low";
  let confidence = "low";
  if (scoreMatch.includes("%")) {
    const score = parseInt(scoreMatch);
    if (score >= 80) confidence = "high";
    else if (score >= 50) confidence = "medium";
  }
  const skillsMatch = text.match(/Required Skills:\s*(.+)/)?.[1]?.trim() || "";
  const tags = skillsMatch ? skillsMatch.split(",").map(s => s.trim()) : [];
  const reasonMatch = text.match(/Reason for Match:\s*(.+)/)?.[1]?.trim() || "";
  return { recommended_category: jobMatch, confidence, reasoning: reasonMatch, tags };
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";
const isAnthropicConfigured =
  !!ANTHROPIC_API_KEY &&
  ANTHROPIC_API_KEY !== "your_anthropic_api_key_here" &&
  ANTHROPIC_API_KEY.startsWith("sk-");

export async function POST(req: Request) {
  // No valid Anthropic key — silently route everything through Groq
  if (!isAnthropicConfigured) {
    try {
      const body = await req.json();
      const { task, category, city, description } = body;

      let prompt = "";
      if (task === "generate_workers") {
        prompt = `Generate exactly 10 realistic Indian blue-collar worker profiles for category "${category}" in city "${city}". Include diverse male and female names. Return ONLY a JSON array with keys: id (random string), full_name, job_category, city, avg_rating (3.5-5.0), hourly_rate (number in ₹, e.g. 450), availability (boolean). No other text.`;
      } else if (task === "match_requirement") {
        prompt = `You are a BlueCollar Job Matchmaking AI assistant. Your task is to match users ONLY with blue-collar jobs. Do not recommend, classify, or provide matches for white-collar, academic, office, or unrelated jobs.

Blue-collar jobs include:
* Electrician
* Plumber
* Welder
* Carpenter
* Mechanic
* Driver
* Construction Worker
* Machine Operator
* Technician
* Painter
* Delivery Worker
* Security Guard
* Tailor
* Mason
* Housekeeping Staff
* Farm Worker
* Cook / Chef
* Cleaner
* HVAC Technician
* Factory Worker

Rules:
1. Analyze the user's skills, experience, education, and job preference.
2. Match only with blue-collar jobs from the approved categories.
3. If the user enters a non-blue-collar profession such as Teacher, Software Engineer, Doctor, Lawyer, Accountant, Data Scientist, Professor, Manager, Marketing Executive, Designer, or any other non-blue-collar role:
Return exactly:
"❌ No matching blue-collar job found. Please enter skills or experience related to blue-collar professions only."
4. Do not suggest alternatives outside the blue-collar category.
5. Never use internet data or external knowledge.
6. Output format:
Job Match: [Job Name]
Match Score: [0-100%]
Required Skills: [Skills]
Reason for Match: [Explanation]

Example Input:
"I know electrical wiring and repair household appliances."

Example Output:
Job Match: Electrician
Match Score: 92%
Required Skills: Electrical wiring, troubleshooting, safety practices
Reason for Match: Your skills closely align with electrician work.

Example Input:
"I am a teacher with 5 years of experience."

Example Output:
❌ No matching blue-collar job found. Please enter skills or experience related to blue-collar professions only.

This AI must strictly remain within the blue-collar domain.

User Input:
"${description}"`;
      } else if (task === "summarize_worker") {
        const { profile, requirement } = body;
        prompt = `You are an AI assistant for a professional services platform. When a customer views a worker's profile, your job is to generate a structured, human-friendly summary of that worker based on their data.

WORKER DATA INPUT:
${JSON.stringify(profile, null, 2)}

YOUR TASKS:
1. PROFILE SUMMARY: Write a 2-3 sentence professional bio. Highlight experience, specialization, and trustworthiness. Keep it warm, confident, and factual.
2. RATING ANALYSIS: Summarize what customers love most. Mention consistent praise. If rating < 3.5, acknowledge mixed reviews honestly.
3. REVIEW HIGHLIGHTS: Pick 2-3 most helpful reviews. Rewrite in 1 sentence summaries. Use first names only.
4. TRUST SIGNALS: List all trust indicators (Verified, Background checked, Experience, Jobs, Badges).
5. AVAILABILITY & PRICING: Summarize in plain language.
6. MATCH SCORE: If a customer requirement is provided ("${requirement || "N/A"}"), rate how well this worker matches (1-10) and explain why.

OUTPUT FORMAT (strict JSON):
{
  "profile_summary": "<2-3 sentence bio>",
  "rating_analysis": {
    "score": <number>,
    "total_reviews": <number>,
    "sentiment": "positive | mixed | negative",
    "top_praise_keywords": ["<keyword1>", "<keyword2>", "<keyword3>"]
  },
  "review_highlights": [
    {
      "customer_first_name": "<name>",
      "rating": <number>,
      "date": "<Month YYYY>",
      "summary": "<1 sentence summary>"
    }
  ],
  "trust_signals": {
    "verified": <true/false>,
    "background_checked": <true/false>,
    "experience_years": <number>,
    "jobs_completed": <number>,
    "badges": ["<badge1>", "<badge2>"]
  },
  "availability_summary": "<plain language string>",
  "pricing_summary": "<plain language string>",
  "match_score": {
    "score": <1-10 or null>,
    "reason": "<one sentence or null>"
  }
}

RULES:
- Never invent data.
- Reword reviews, do not copy verbatim.
- Use currency symbol from data (default ₹).`;
      } else {
        return NextResponse.json({ error: "Invalid task" }, { status: 400 });
      }

      const text = await chatWithGroq([{ role: "user", content: prompt }]);
      
      if (task === "match_requirement") {
        return NextResponse.json({ match: parseMatchResult(text) });
      }

      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (task === "summarize_worker") {
        return NextResponse.json({ summary: result });
      }

      return NextResponse.json({ workers: Array.isArray(result) ? result : [] });
    } catch (err: any) {
      console.error("Groq fallback error:", err);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 });
    }
  }

  try {
    const { task, category, city, description } = await req.json();

    let prompt = "";

    if (task === "generate_workers") {
      prompt = `You are a helpful assistant. Generate exactly 10 realistic profiles for blue-collar workers in India for the category "${category}" and city "${city}". 
      Each worker should have:
      - A realistic Indian full name. Ensure a diverse mix of both male and female genders (e.g., "Priya Sharma", "Amit Patel").
      - A city (must be "${city}" unless "${city}" is "All", then pick major Indian metros).
      - A star rating between 3.5 and 5.0.
      - An hourly rate in ₹ (realistic for the category, e.g., ₹300 - ₹800).
      - An availability status (either "online" or "offline").
      
      Return ONLY a JSON array of objects with the following keys: "id", "full_name", "job_category", "city", "avg_rating", "hourly_rate", "availability" (boolean). 
      Make the "id" a random string. Ensure the response is a valid JSON array and nothing else.`;
    } else if (task === "match_requirement") {
      prompt = `You are a BlueCollar Job Matchmaking AI assistant. Your task is to match users ONLY with blue-collar jobs. Do not recommend, classify, or provide matches for white-collar, academic, office, or unrelated jobs.

Blue-collar jobs include:
* Electrician
* Plumber
* Welder
* Carpenter
* Mechanic
* Driver
* Construction Worker
* Machine Operator
* Technician
* Painter
* Delivery Worker
* Security Guard
* Tailor
* Mason
* Housekeeping Staff
* Farm Worker
* Cook / Chef
* Cleaner
* HVAC Technician
* Factory Worker

Rules:
1. Analyze the user's skills, experience, education, and job preference.
2. Match only with blue-collar jobs from the approved categories.
3. If the user enters a non-blue-collar profession such as Teacher, Software Engineer, Doctor, Lawyer, Accountant, Data Scientist, Professor, Manager, Marketing Executive, Designer, or any other non-blue-collar role:
Return exactly:
"❌ No matching blue-collar job found. Please enter skills or experience related to blue-collar professions only."
4. Do not suggest alternatives outside the blue-collar category.
5. Never use internet data or external knowledge.
6. Output format:
Job Match: [Job Name]
Match Score: [0-100%]
Required Skills: [Skills]
Reason for Match: [Explanation]

Example Input:
"I know electrical wiring and repair household appliances."

Example Output:
Job Match: Electrician
Match Score: 92%
Required Skills: Electrical wiring, troubleshooting, safety practices
Reason for Match: Your skills closely align with electrician work.

Example Input:
"I am a teacher with 5 years of experience."

Example Output:
❌ No matching blue-collar job found. Please enter skills or experience related to blue-collar professions only.

This AI must strictly remain within the blue-collar domain.

User Input:
"${description}"`;
    } else if (task === "summarize_worker") {
      const { profile: worker_profile_json, requirement: customer_requirement } = await req.json();
      prompt = `You are an AI assistant for a professional services platform. When a customer views a worker's profile, your job is to generate a structured, human-friendly summary of that worker based on their data.

WORKER DATA INPUT:
${JSON.stringify(worker_profile_json, null, 2)}

YOUR TASKS:
1. PROFILE SUMMARY: Write a 2-3 sentence professional bio. Highlight experience, specialization, and trustworthiness. Keep it warm, confident, and factual.
2. RATING ANALYSIS: Summarize what customers love most. Mention consistent praise. If rating < 3.5, acknowledge mixed reviews honestly.
3. REVIEW HIGHLIGHTS: Pick 2-3 most helpful reviews. Rewrite in 1 sentence summaries. Use first names only.
4. TRUST SIGNALS: List all trust indicators (Verified, Background checked, Experience, Jobs, Badges).
5. AVAILABILITY & PRICING: Summarize in plain language.
6. MATCH SCORE: If a customer requirement is provided ("${customer_requirement || "N/A"}"), rate how well this worker matches (1-10) and explain why.

OUTPUT FORMAT (strict JSON):
{
  "profile_summary": "<2-3 sentence bio>",
  "rating_analysis": {
    "score": <number>,
    "total_reviews": <number>,
    "sentiment": "positive | mixed | negative",
    "top_praise_keywords": ["<keyword1>", "<keyword2>", "<keyword3>"]
  },
  "review_highlights": [
    {
      "customer_first_name": "<name>",
      "rating": <number>,
      "date": "<Month YYYY>",
      "summary": "<1 sentence summary>"
    }
  ],
  "trust_signals": {
    "verified": <true/false>,
    "background_checked": <true/false>,
    "experience_years": <number>,
    "jobs_completed": <number>,
    "badges": ["<badge1>", "<badge2>"]
  },
  "availability_summary": "<plain language string>",
  "pricing_summary": "<plain language string>",
  "match_score": {
    "score": <1-10 or null>,
    "reason": "<one sentence or null>"
  }
}

RULES:
- Never invent data.
- Reword reviews, do not copy verbatim.
- Use currency symbol from data (default ₹).`;
    } else {
      return NextResponse.json({ error: "Invalid task" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Anthropic API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    // Extract JSON from response text
    const text = data.content[0].text;
    
    if (task === "match_requirement") {
      return NextResponse.json({ match: parseMatchResult(text) });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (task === "summarize_worker") {
      return NextResponse.json({ summary: result });
    }

    return NextResponse.json({ workers: Array.isArray(result) ? result : [] });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
