import { NextResponse } from "next/server";
import { chatWithGroq } from "@/lib/groq";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, temperature } = body;

    const responseText = await chatWithGroq(
      [{ role: "user", content: prompt }],
      { temperature: temperature ? Number(temperature) : undefined }
    );

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error("Groq Proxy Error:", error);
    return NextResponse.json(
      { error: "Failed to connect to Groq." },
      { status: 500 }
    );
  }
}
