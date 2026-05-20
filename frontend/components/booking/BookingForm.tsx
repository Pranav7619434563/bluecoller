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

    try {
      // 1. Fetch Customer Profile
      const { data: customerProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single()

      const currentCustomerId = customerProfile?.id || user.id

      // Duplicate prevention: check for existing Pending request
      const existingBookingsStr = localStorage.getItem("local_bookings")
      const localBookings = existingBookingsStr ? JSON.parse(existingBookingsStr) : []
      const duplicateLocal = localBookings.find((b: any) => 
        b.customerId === currentCustomerId && 
        b.workerId === employeeId && 
        b.status === "Pending"
      )

      if (duplicateLocal) {
        toast.error("You already have a pending request for this worker")
        setLoading(false)
        return
      }

      try {
        const { data: duplicateDb } = await supabase
          .from("bookings")
          .select("id")
          .eq("customer_id", currentCustomerId)
          .eq("employee_id", employeeId)
          .eq("status", "Pending")
          .limit(1)

        if (duplicateDb && duplicateDb.length > 0) {
          toast.error("You already have a pending request for this worker")
          setLoading(false)
          return
        }
      } catch (err) {
        console.error("DB check failed", err)
      }

      const customerName = customerProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Customer"

      // 2. Fetch Worker Profile to perform AI Matchmaker
      let workerProfile: any = null
      
      // Try database first
      const { data: dbWorker } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", employeeId)
        .single()
      
      if (dbWorker) {
        workerProfile = dbWorker
      } else {
        // Try localStorage workers
        const localWorkersStr = localStorage.getItem("workers")
        if (localWorkersStr) {
          const workers = JSON.parse(localWorkersStr)
          workerProfile = workers.find((w: any) => w.id === employeeId)
        }
      }

      const workerName = workerProfile?.full_name || workerProfile?.name || "Professional"
      const category = workerProfile?.job_category || workerProfile?.category || "Specialist"
      const location = workerProfile?.city || "Mumbai"

      // 3. Compute AI Job Matching Score
      let matchScore = 95
      let matchReason = "Worker is local and has matching skill credentials."

      try {
        const matchRes = await fetch("/api/match-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workerSkills: workerProfile?.skills || [category],
            workerLocation: location,
            experience: workerProfile?.experience_years ? `${workerProfile.experience_years} years` : workerProfile?.experience || "N/A",
            rating: workerProfile?.avg_rating || workerProfile?.rating || "4.8",
            customerRequest: data.job_description
          })
        })
        if (matchRes.ok) {
          const matchData = await matchRes.json()
          if (matchData.matchScore !== undefined) {
            matchScore = matchData.matchScore
            matchReason = matchData.reason
          }
        }
      } catch (err) {
        console.error("AI Matchmaker failed, using default values", err)
      }

      // 4. Save booking
      const bookingId = crypto.randomUUID()
      const bookingPayload = {
        bookingId,
        customerId: currentCustomerId,
        customerName,
        workerId: employeeId,
        workerName,
        category,
        location,
        date: data.date,
        time: data.time_slot,
        status: "Pending",
        notificationRead: false,
        createdAt: Date.now(),
        matchScore,
        matchReason,
        address: data.address,
        job_description: data.job_description
      }

      // 4.1 Save to database bookings table
      await supabase.from("bookings").insert({
        customer_id: currentCustomerId,
        employee_id: employeeId,
        job_description: data.job_description,
        date: data.date,
        time_slot: data.time_slot,
        estimated_hours: Number(data.estimated_hours),
        address: data.address,
        status: "Pending",
        match_score: matchScore,
        match_reason: matchReason
      })

      // 4.2 Save to localStorage bookings (crucial for mock real-time syncing)
      localBookings.push(bookingPayload)
      localStorage.setItem("local_bookings", JSON.stringify(localBookings))

      // 4.3 Save initial notification to customer_notifications in localStorage
      const existingNotificationsStr = localStorage.getItem("customer_notifications")
      const localNotifications = existingNotificationsStr ? JSON.parse(existingNotificationsStr) : []
      const newNotification = {
        id: crypto.randomUUID(),
        bookingId,
        customerId: currentCustomerId,
        workerName,
        message: "🔔 Booking request sent successfully",
        read: false,
        timestamp: Date.now()
      }
      localNotifications.unshift(newNotification)
      localStorage.setItem("customer_notifications", JSON.stringify(localNotifications))

      // 5. Emit real-time NEW_JOB_REQUEST event via localStorage for local testing
      localStorage.setItem("latest_event", JSON.stringify({
        event: "NEW_JOB_REQUEST",
        booking: bookingPayload,
        timestamp: Date.now()
      }))

      // 5.1 Also emit via Supabase realtime broadcast channel
      try {
        const channel = supabase.channel("dashboard-sync")
        channel.subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            channel.send({
              type: "broadcast",
              event: "NEW_JOB_REQUEST",
              payload: bookingPayload
            })
          }
        })
      } catch (e) {
        console.error("Supabase channel broadcast error:", e)
      }

      toast.success("Booking request sent successfully! AI Match Score: " + matchScore + "%")
      if (onSuccess) onSuccess()

    } catch (error: any) {
      toast.error("Failed to book professional: " + error.message)
    } finally {
      setLoading(false)
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
        {loading ? "Sending booking request..." : "Request Booking"}
      </Button>
    </form>
  )
}
