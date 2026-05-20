"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function RegisterPage() {
  const [role, setRole] = useState<"customer" | "worker">("customer")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // 2. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: authData.user.id,
        role: role,
        full_name: fullName,
      })

      if (profileError) {
        toast.error("Failed to create profile: " + profileError.message)
      } else {
        const userData = {
          userId: authData.user.id,
          fullName: fullName,
          email: email,
          phone: "",
          city: "",
          category: ""
        }
        localStorage.setItem("userData", JSON.stringify(userData))

        toast.success("Registration successful!")
        if (role === "worker") {
          router.push("/employee/dashboard")
        } else {
          router.push("/customer/dashboard")
        }
      }
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-sm">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Create an account</h2>
          <p className="text-sm text-muted-foreground mt-2">Join WorkForce AI today</p>
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

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
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
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <button
            className="font-medium text-primary hover:underline"
            onClick={() => router.push("/login")}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
