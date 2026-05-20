import { NextResponse } from "next/server";

// Shared in-memory store for AI-generated workers
const globalRef = global as any;
if (!globalRef.aiWorkersStore) {
  globalRef.aiWorkersStore = new Map();
}
const aiWorkersStore = globalRef.aiWorkersStore;

export async function POST(req: Request) {
  try {
    const { workers } = await req.json();
    if (Array.isArray(workers)) {
      for (const w of workers) {
        if (w.id) {
          aiWorkersStore.set(w.id, w);
        }
      }
    }
    return NextResponse.json({ success: true, count: aiWorkersStore.size });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to persist workers." }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const workers = Array.from(aiWorkersStore.values());
    return NextResponse.json({ workers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch stored workers." }, { status: 500 });
  }
}
