import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Perform a simple query to verify the connection is active
    // We fetch a single row from an imaginary table or just check auth status
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Supabase!",
      hasSession: !!data.session,
    });
  } catch (error: any) {
    console.error("Supabase connection failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to Supabase",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
