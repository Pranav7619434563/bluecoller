import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    
    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch profile from DB
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error("GET /api/worker/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch profile settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = createClient();

    // 1. Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request payload
    const body = await req.json();
    const {
      full_name,
      city,
      pincode,
      bio,
      job_category,
      hourly_rate,
      experience_years,
      availability,
      avatar_url
    } = body;

    // 3. Update profiles table in Supabase
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({
        full_name,
        city,
        pincode,
        bio,
        job_category,
        hourly_rate: hourly_rate ? Number(hourly_rate) : 0,
        experience_years: experience_years ? Number(experience_years) : 0,
        availability: availability ?? true,
        avatar_url
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase profile update error:", error);
      return NextResponse.json({ error: error.message || "Failed to update profile in database" }, { status: 400 });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error("PUT /api/worker/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to save profile settings" }, { status: 500 });
  }
}
