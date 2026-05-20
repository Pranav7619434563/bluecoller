"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

const bookingSchema = z.object({
  job_description: z.string().min(10, "Description must be at least 10 characters"),
  date: z.string().min(1, "Date is required"),
  time_slot: z.string().min(1, "Time slot is required"),
  estimated_hours: z.preprocess((val) => Number(val), z.number().min(1)),
  address: z.string().min(10, "Full address is required"),
})

interface BookingFormValues {
  job_description: string;
  date: string;
  time_slot: string;
  estimated_hours: number;
  address: string;
}

export default function BookingForm({
  employeeId,
  onSuccess
}: {
  employeeId: string
  onSuccess?: () => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema)
  } as any)

  const onSubmit = async (data: BookingFormValues) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("You must be logged in to book a worker")
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!profile) {
      toast.error("Profile not found")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("bookings").insert({
      customer_id: profile.id,
      employee_id: employeeId,
      ...data
    })

    setLoading(false)

    if (error) {
      toast.error("Booking failed: " + error.message)
    } else {
      toast.success("Booking request sent successfully!")
      if (onSuccess) onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Job Description</Label>
        <Textarea {...register("job_description")} placeholder="Describe what you need help with..." />
        {errors.job_description && <p className="text-red-500 text-sm">{errors.job_description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date Needed</Label>
          <Input type="date" {...register("date")} />
          {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Time Slot</Label>
          <Input type="text" {...register("time_slot")} placeholder="e.g. 10:00 AM - 1:00 PM" />
          {errors.time_slot && <p className="text-red-500 text-sm">{errors.time_slot.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Estimated Hours</Label>
        <Input type="number" {...register("estimated_hours")} min="1" placeholder="e.g. 2" />
        {errors.estimated_hours && <p className="text-red-500 text-sm">{errors.estimated_hours.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Full Address</Label>
        <Textarea {...register("address")} placeholder="Enter your full address with landmark..." />
        {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Request Booking"}
      </Button>
    </form>
  )
}
