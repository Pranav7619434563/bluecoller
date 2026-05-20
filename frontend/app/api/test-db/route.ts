import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    // Attempt to connect to the database
    await connectToDatabase();

    // Optionally try to fetch data or count to verify it works fully
    const count = await User.countDocuments();

    return NextResponse.json({
      success: true,
      message: "Successfully connected to MongoDB!",
      userCount: count,
    });
  } catch (error: any) {
    console.error("Database connection failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to MongoDB",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
