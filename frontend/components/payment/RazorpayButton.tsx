"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function RazorpayButton({
  amount,
  bookingId,
  customerName,
  customerEmail,
  onSuccess
}: {
  amount: number
  bookingId: string
  customerName: string
  customerEmail: string
  onSuccess?: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    try {
      // 1. Create order
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, booking_id: bookingId })
      })
      const order = await res.json()

      // 2. Load Razorpay script
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "WorkForce AI",
          description: "Payment for Booking",
          order_id: order.id,
          handler: async (response: any) => {
            // 3. Verify payment
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                booking_id: bookingId,
                amount
              })
            })
            const result = await verifyRes.json()
            if (result.success) {
              toast.success("Payment Successful!")
              if (onSuccess) onSuccess()
            } else {
              toast.error("Payment Verification Failed")
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail,
          },
          theme: {
            color: "#F97316",
          },
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
      document.body.appendChild(script)
    } catch (err) {
      toast.error("Failed to initiate payment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handlePayment} disabled={loading} className="w-full md:w-auto">
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </Button>
  )
}
