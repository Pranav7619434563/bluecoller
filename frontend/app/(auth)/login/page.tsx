"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const [role, setRole] = useState<"customer" | "worker">("customer")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    // Fetch profile and store in local caches
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", data.user.id)
      .single()

    setLoading(false)

    if (profileErr || !profile) {
      toast.error("Profile not found")
      return
    }

    // Save userData to localStorage
    const userData = {
      userId: data.user.id,
      fullName: profile.full_name || "",
      email: data.user.email || email || "",
      phone: profile.phone || "",
      city: profile.city || "",
      category: profile.job_category || ""
    }
    localStorage.setItem("userData", JSON.stringify(userData))

    // Save profileData to localStorage for settings hydration
    const profileData = {
      fullName: profile.full_name || "",
      phone: profile.phone || "",
      email: data.user.email || email || "",
      city: profile.city || "",
      address: profile.address || "",
      jobCategory: profile.job_category || "",
      skills: profile.skills || [],
      experienceYears: profile.experience_years || 0,
      hourlyRate: profile.hourly_rate || 0,
      bio: profile.bio || "",
      availability: profile.availability ?? true,
      workingHours: profile.working_hours || "9:00 AM - 6:00 PM",
      availableDays: profile.available_days || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      avatarUrl: profile.avatar_url || null
    }
    localStorage.setItem("profileData", JSON.stringify(profileData))
    if (profile.role === "worker") {
      router.push("/employee/dashboard")
    } else {
      router.push("/customer/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <div className="flex w-full rounded-md border p-1">
          <button
            className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${role === "customer" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => setRole("customer")}
          >
            I am a Customer
          </button>
          <button
            className={`flex-1 rounded-sm py-2 text-sm font-medium transition-colors ${role === "worker" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            onClick={() => setRole("worker")}
          >
            I am a Worker
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Don't have an account?{" "}
          <button
            className="font-medium text-primary hover:underline"
            onClick={() => router.push("/register")}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  )
}
