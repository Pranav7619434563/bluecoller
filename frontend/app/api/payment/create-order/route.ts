import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { razorpay } from "@/lib/razorpay"

export async function POST(req: Request) {
  try {
    const { amount, booking_id } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      receipt: `receipt_${booking_id}`,
    }

    const order = await razorpay.orders.create(options)

    return NextResponse.json(order)
  } catch (error) {
    console.error("Razorpay error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
