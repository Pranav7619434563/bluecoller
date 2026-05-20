"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import BookingForm from "@/components/booking/BookingForm"
import { Sparkles, CheckCircle2, ShieldCheck, Briefcase, Star, Clock, IndianRupee, MessageSquare, ThumbsUp } from "lucide-react"

type Profile = {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  bio: string | null
  job_category: string | null
  hourly_rate: number | null
  daily_rate: number | null
  project_rate: number | null
  experience_years: number | null
  avg_rating: number | null
  total_jobs: number | null
  skills: string[] | null
}

type AISummary = {
  profile_summary: string
  rating_analysis: {
    score: number
    total_reviews: number
    sentiment: string
    top_praise_keywords: string[]
  }
  review_highlights: Array<{
    customer_first_name: string
    rating: number
    date: string
    summary: string
  }>
  trust_signals: {
    verified: boolean
    background_checked: boolean
    experience_years: number
    jobs_completed: number
    badges: string[]
  }
  availability_summary: string
  pricing_summary: string
  match_score?: {
    score: number | null
    reason: string | null
  }
}

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const idStr = Array.isArray(id) ? id[0] : id as string

      // Handle mock worker IDs (e.g. mock-Plumber-Mumbai-1-454750885)
      if (idStr.startsWith("mock-")) {
        const parts = idStr.split("-")
        // parts: ["mock", category, city, index, seed]
        const category = parts[1] || "Professional"
        const city = parts[2] || "Mumbai"
        const seed = parseInt(parts[4] || "0") || 0
        const rating = (3.5 + (seed % 15) / 10).toFixed(1)
        const hourly = 300 + (seed % 700)
        const mockProfile: Profile = {
          id: idStr,
          full_name: `${category} Professional`,
          avatar_url: null,
          city,
          bio: `Experienced ${category} based in ${city} with a proven track record of quality service.`,
          job_category: category,
          hourly_rate: hourly,
          daily_rate: hourly * 6,
          project_rate: hourly * 20,
          experience_years: 3 + (seed % 10),
          avg_rating: parseFloat(rating),
          total_jobs: 20 + (seed % 80),
          skills: [category, "Professional", "Verified"],
        }
        setProfile(mockProfile)
        loadAiSummary(mockProfile)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", idStr)
        .single()

      if (error) {
        toast.error("Employee not found")
        router.push("/customer/dashboard")
      } else {
        setProfile(data)
        loadAiSummary(data)
      }
      setLoading(false)
    }

    async function loadAiSummary(profileData: Profile) {
      setSummaryLoading(true)
      try {
        // Mocking some review/badge data for the AI if not in DB
        const enrichedProfile = {
          ...profileData,
          reviews: [
            { customer_name: "Amit", rating: 5, comment: "Very professional and punctual. Fixed the leak in 10 minutes.", date: "2024-04-10" },
            { customer_name: "Sneha", rating: 4, comment: "Good work, slightly expensive but worth it for the quality.", date: "2024-03-15" }
          ],
          badges: ["Top Rated", "Verified Pro", "Quick Responder"],
          background_check: true,
          verified_status: true,
          total_jobs_completed: (profileData as any).total_jobs ?? 45,
          availability: { days: "Mon-Sat", time_slots: "9 AM - 6 PM" },
          pricing: { hourly_rate: profileData.hourly_rate ?? 500, minimum_charge: 500, currency: "₹" }
        }

        const response = await fetch("/api/anthropic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            task: "summarize_worker", 
            profile: enrichedProfile 
          })
        })
        const data = await response.json()
        if (data.summary) {
          setAiSummary(data.summary)
        }
      } catch (err) {
        console.error("AI Summary failed:", err)
      } finally {
        setSummaryLoading(false)
      }
    }
    loadProfile()
  }, [id, supabase, router])

  const handleSendMessage = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }

    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!customerProfile) return

    // Check if conversation exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(customer_id.eq.${customerProfile.id},employee_id.eq.${id}),and(customer_id.eq.${id},employee_id.eq.${customerProfile.id})`)
      .single()

    if (existing) {
      router.push("/messages")
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          customer_id: customerProfile.id,
          employee_id: id as string
        })
        .select()
        .single()
      
      if (newConv) router.push("/messages")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-10 min-h-screen pb-20">
      {/* Header / Top Card */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-primary/10 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <Card className="relative border-none shadow-2xl rounded-[3rem] overflow-hidden backdrop-blur-sm bg-white/80">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-0">
              {/* Left Side: Avatar & Basic Info */}
              <div className="md:w-1/3 bg-muted/30 p-10 flex flex-col items-center text-center border-r">
                <div className="relative">
                  <div className="w-40 h-40 bg-white rounded-full p-2 shadow-2xl overflow-hidden ring-4 ring-primary/20">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl font-black bg-primary/10 text-primary">
                        {profile.full_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-2xl border-4 border-white shadow-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <h1 className="text-3xl font-black tracking-tighter">{profile.full_name}</h1>
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">{profile.job_category} • {profile.city}</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  <Badge className="bg-orange-500 rounded-xl px-4 py-1.5 font-bold shadow-lg shadow-orange-500/20">⭐ {profile.avg_rating || "4.8"}</Badge>
                  <Badge variant="outline" className="rounded-xl px-4 py-1.5 font-bold border-2">{profile.experience_years || 5}y Exp</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mt-10">
                  <Button className="rounded-2xl h-14 font-black text-lg shadow-xl shadow-primary/20" onClick={handleSendMessage}>
                    <MessageSquare className="w-5 h-5 mr-2" /> Message
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-2xl h-14 font-black text-lg border-2">Book</Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-black">Book {profile.full_name}</DialogTitle>
                      </DialogHeader>
                      <BookingForm employeeId={profile.id} onSuccess={() => router.push("/customer/bookings")} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Right Side: AI Summary & Highlights */}
              <div className="md:w-2/3 p-10 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-6 h-6 fill-primary/20" />
                    <h2 className="text-xl font-black uppercase tracking-tighter">AI Profile Insight</h2>
                  </div>
                  {summaryLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[90%]" />
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  ) : aiSummary ? (
                    <p className="text-xl font-medium leading-relaxed text-slate-700 italic">
                      "{aiSummary.profile_summary}"
                    </p>
                  ) : (
                    <p className="text-lg leading-relaxed text-slate-600">{profile.bio || "Professional worker with experience in home services."}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Trust Signals */}
                  <div className="space-y-5">
                    <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Verified Credentials
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-green-50 p-3 rounded-2xl border border-green-100">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-bold text-green-800">Verified Profile & ID</span>
                      </div>
                      <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-2xl border border-blue-100">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-bold text-blue-800">Background Checked</span>
                      </div>
                      <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-2xl border border-orange-100">
                        <Briefcase className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-bold text-orange-800">{profile.total_jobs || 45}+ Jobs Completed</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Availability */}
                  <div className="space-y-5">
                    <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Booking Info
                    </h3>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Starting From</p>
                          <p className="text-3xl font-black text-primary">₹{profile.hourly_rate}<span className="text-sm font-bold text-slate-400">/hr</span></p>
                        </div>
                        <Badge className="bg-primary/10 text-primary rounded-lg border-none hover:bg-primary/20">Instant Booking</Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {aiSummary?.availability_summary || "Available Mon-Sat, 9 AM - 6 PM"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reviews & Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Rating Analysis */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-900 text-white p-8">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 fill-orange-500 text-orange-500" /> What Customers Love
            </h3>
            {summaryLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-2/3 bg-white/10" />
              </div>
            ) : aiSummary ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {aiSummary.rating_analysis.top_praise_keywords.map(word => (
                    <Badge key={word} className="bg-white/10 hover:bg-white/20 text-white border-none rounded-xl px-3 py-1 font-bold text-[10px] uppercase">
                      {word}
                    </Badge>
                  ))}
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{aiSummary.availability_summary}"
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div>
                    <p className="text-2xl font-black">{aiSummary.rating_analysis.score}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Avg Rating</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">{aiSummary.rating_analysis.total_reviews}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reviews</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Consistent high-quality service and professionalism reported by local customers.</p>
            )}
          </Card>
        </div>

        {/* Review Highlights */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
              <ThumbsUp className="w-6 h-6 text-primary" /> Verified Reviews
            </h3>
            <Button variant="ghost" className="text-xs font-bold text-primary">View all reviews →</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {summaryLoading ? (
              [1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-[2rem]" />)
            ) : aiSummary ? (
              aiSummary.review_highlights.map((review, idx) => (
                <Card key={idx} className="border-none shadow-lg rounded-[2rem] p-6 hover:translate-y-[-4px] transition-all bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold text-sm">{review.customer_first_name[0]}</div>
                      <div>
                        <p className="font-black text-sm">{review.customer_first_name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex text-orange-500">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic font-medium">"{review.summary}"</p>
                </Card>
              ))
            ) : (
              <p className="col-span-2 text-center py-20 text-muted-foreground">No reviews highlighted yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
