"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigatingPortal, setNavigatingPortal] = useState("")

  const handleRoleSelect = async (role: "customer" | "worker") => {
    if (role === "customer") {
      setNavigatingPortal("Customer")
      setIsNavigating(true)

      // Caching roles for Supabase/Middleware/Mock verification
      localStorage.setItem("mock_role", "customer")
      localStorage.setItem("role", "customer")

      // Hydrate a placeholder default profile to prevent empty state jumps if accessing first time
      const existingUserData = localStorage.getItem("userData")
      if (!existingUserData) {
        localStorage.setItem("userData", JSON.stringify({
          userId: "mock-user-id",
          fullName: "John Doe (Mock)",
          email: "test@example.com",
          phone: "9999999999",
          city: "Mumbai",
          category: ""
        }))
      }

      // 1200ms delay to display premium micro-animations before redirect
      setTimeout(() => {
        router.push("/customer/dashboard?role=customer")
      }, 1200)
    } else {
      setNavigatingPortal("Professional")
      setIsNavigating(true)

      // Caching roles for Supabase/Middleware/Mock verification
      localStorage.setItem("mock_role", "worker")
      localStorage.setItem("role", "worker")

      // Hydrate a placeholder default worker profile if accessing first time
      const existingUserData = localStorage.getItem("userData")
      if (!existingUserData) {
        localStorage.setItem("userData", JSON.stringify({
          userId: "mock-user-id",
          fullName: "John Doe (Mock Pro)",
          email: "worker@example.com",
          phone: "9999999999",
          city: "Mumbai",
          category: "Plumber"
        }))
      }

      // 1200ms delay to display premium micro-animations before redirect
      setTimeout(() => {
        router.push("/employee/dashboard?role=worker")
      }, 1200)
    }
  }

  return (
    <div className="flex-1 bg-[#0E1621] text-white flex flex-col items-center justify-center font-sans selection:bg-[#FF8C00]/30 p-4">
      {/* Hero Content with smooth fade-in and slide-up animation */}
      <div className="w-full max-w-2xl text-center space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-[#FF8C00] via-[#F2711C] to-[#E55B00] bg-clip-text text-transparent select-none uppercase">
            BlueCollar Connect
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-lg mx-auto leading-relaxed">
            Connecting customers with trusted skilled workers instantly
          </p>
        </div>

        {/* Action Portals */}
        <div id="portal-selection" className="max-w-md mx-auto bg-[#1B1C1D] p-6 rounded-3xl border border-[#FF8C00]/10 shadow-2xl space-y-6">
          <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Choose Your Portal</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleRoleSelect("customer")}
              className="flex-1 h-14 bg-[#FF8C00] hover:bg-[#F2711C] text-white rounded-2xl text-base font-bold shadow-lg shadow-[#FF8C00]/10 transition-all duration-300"
            >
              Customer Portal
            </Button>
            
            <Button
              onClick={() => handleRoleSelect("worker")}
              className="flex-1 h-14 bg-[#0E1621] border border-slate-800 hover:bg-slate-800 text-white rounded-2xl text-base font-bold shadow-lg transition-all duration-300"
            >
              Professional Portal
            </Button>
          </div>
        </div>
      </div>

      {/* Premium Navigation Transition Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0E1621]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex flex-col items-center space-y-6 max-w-sm text-center px-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Premium Loader Ring */}
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-[#FF8C00]/10" />
              <div className="absolute inset-0 rounded-full border-4 border-t-[#FF8C00] border-r-[#FF8C00]/30 border-b-transparent border-l-transparent animate-spin duration-700" />
              <div className="w-4 h-4 bg-gradient-to-tr from-[#FF8C00] to-[#E55B00] rounded-full animate-ping" />
            </div>
            
            {/* Loading Text */}
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-wide text-white uppercase font-sans bg-gradient-to-r from-[#FF8C00] via-[#F2711C] to-[#E55B00] bg-clip-text text-transparent">
                Opening {navigatingPortal} Portal
              </h2>
              <p className="text-sm text-slate-400 font-medium animate-pulse">
                Connecting to your secure dashboard...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
