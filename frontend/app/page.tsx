"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function Home() {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .single()

    setLoading(false)

    if (profile) {
      if (profile.role === "worker") {
        router.push("/employee/dashboard")
      } else {
        router.push("/customer/dashboard")
      }
    } else {
      toast.error("Profile not found")
    }
  }

  return (
    <div className="min-h-screen bg-[#0E1621] text-white flex flex-col font-sans selection:bg-[#FF8C00]/30">
      {/* Header with Logo */}
      <header className="p-6 md:p-10 flex justify-between items-center animate-in fade-in slide-in-from-top duration-700">
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-[#FF8C00]">
          WorkForce AI
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 bg-[#1B1C1D] p-8 md:p-10 rounded-3xl shadow-2xl border border-[#FF8C00]/10 animate-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
            <p className="text-slate-400">Your connection to trusted professionals</p>
          </div>

          <div className="flex w-full bg-[#0E1621] rounded-2xl p-1.5 border border-slate-800">
            <button
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${role === "customer" ? "bg-[#FF8C00] text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              onClick={() => setRole("customer")}
            >
              Customer
            </button>
            <button
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${role === "worker" ? "bg-[#FF8C00] text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              onClick={() => setRole("worker")}
            >
              Professional
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300 ml-1">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-[#0E1621] border-slate-800 focus:border-[#FF8C00] focus:ring-[#FF8C00] rounded-xl h-12 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-slate-300 ml-1">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#0E1621] border-slate-800 focus:border-[#FF8C00] focus:ring-[#FF8C00] rounded-xl h-12 transition-all"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-[#FF8C00] hover:bg-[#F2711C] text-white rounded-xl text-lg font-bold shadow-lg shadow-[#FF8C00]/20 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-slate-400 text-sm">
              Don't have an account?{" "}
              <button
                className="text-[#FF8C00] font-bold hover:underline underline-offset-4"
                onClick={() => router.push("/register")}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer / Decorative Element */}
      <footer className="p-8 text-center text-slate-500 text-xs uppercase tracking-[0.2em]">
        © 2024 WorkForce AI • Connecting Excellence
      </footer>
    </div>
  )
}
