import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      booking_id,
      amount
    } = await req.json()

    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature === razorpay_signature) {
      const supabase = createClient()
      
      // Update payment record
      await supabase.from("payments").insert({
        booking_id,
        amount,
        razorpay_order_id,
        razorpay_payment_id,
        status: "paid",
        paid_at: new Date().toISOString()
      })

      // Update booking status
      await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("id", booking_id)

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
