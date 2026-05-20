"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const CATEGORIES = [
  { name: "Plumber", icon: "💧" },
  { name: "Electrician", icon: "⚡" },
  { name: "Carpenter", icon: "🪚" },
  { name: "Painter", icon: "🎨" },
  { name: "Welder", icon: "🔥" },
  { name: "Mason", icon: "🧱" },
  { name: "AC Technician", icon: "❄️" },
  { name: "Home Cleaner", icon: "🧹" },
  { name: "Driver", icon: "🚗" },
  { name: "Security Guard", icon: "🛡️" },
  { name: "Cook", icon: "🍳" },
  { name: "Gardener", icon: "🌱" },
  { name: "Pest Control", icon: "🐛" },
  { name: "Helper", icon: "👷" },
  { name: "Fabricator", icon: "🏗️" },
  { name: "Tile Worker", icon: "📏" },
  { name: "Roofer", icon: "🏠" },
  { name: "HVAC Technician", icon: "🌡️" }
]

export default function JobsPortal() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-primary">Find the Right Worker Near You</h1>
        <p className="text-lg text-muted-foreground">
          WorkForce AI connects you with trusted blue-collar professionals. Browse categories or post a job to get matched instantly.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Button size="lg" onClick={() => router.push("/login")}>Post a Job</Button>
          <Button size="lg" variant="outline" onClick={() => router.push("/login")}>Login / Register</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-8">
        {CATEGORIES.map(cat => (
          <Card key={cat.name} className="hover:border-primary cursor-pointer transition-colors" onClick={() => router.push(`/customer/dashboard?category=${cat.name}`)}>
            <CardHeader className="text-center pb-2">
              <div className="text-4xl mx-auto">{cat.icon}</div>
              <CardTitle className="text-base font-medium">{cat.name}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
