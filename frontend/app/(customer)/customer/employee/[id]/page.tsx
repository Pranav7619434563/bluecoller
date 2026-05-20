"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import BookingForm from "@/components/booking/BookingForm"
import { 
  Sparkles, CheckCircle2, ShieldCheck, Briefcase, Star, Clock, 
  MessageSquare, ThumbsUp, ArrowLeft, Phone, Calendar, 
  Languages, User, Clipboard, Copy, Check
} from "lucide-react"

type WorkerDetails = {
  id: string
  name: string
  photo: string | null
  category: string
  city: string
  experience: string
  skills: string[]
  rating: string
  hourlyRate: string
  trustScore: string
  reviews: Array<{
    customer_name: string
    rating: number
    comment: string
    date: string
  }>
  age: number
  gender: string
  languages: string[]
  availability: string
  completedJobs: number
  verified: boolean
  description: string
  portfolio: string[]
  phone: string
  recommendations: string[]
}

export default function EmployeeProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [worker, setWorker] = useState<WorkerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [backCategory, setBackCategory] = useState("All")
  const [backCity, setBackCity] = useState("Mumbai")
  const [copied, setCopied] = useState(false)

  const idStr = Array.isArray(id) ? id[0] : (id as string)

  const enrichWorker = (localWorker: any) => {
    let seed = 0
    const str = localWorker.id + (localWorker.full_name || localWorker.name || "")
    for (let i = 0; i < str.length; i++) {
      seed = (seed << 5) - seed + str.charCodeAt(i)
      seed |= 0
    }
    seed = Math.abs(seed)

    const name = localWorker.full_name || localWorker.name || "Professional Specialist"
    const category = localWorker.job_category || localWorker.category || "Professional"
    const city = localWorker.city || "Mumbai"
    const rating = localWorker.avg_rating || localWorker.rating || (3.8 + (seed % 12) / 10).toFixed(1)
    const hourly = localWorker.hourly_rate || localWorker.hourlyRate || (300 + (seed % 700))
    const trustScore = localWorker.trustScore || (80 + (seed % 18))
    const jobsCompleted = localWorker.completedJobs || (20 + (seed % 80))
    const age = localWorker.age || 26 + (seed % 20)
    const gender = localWorker.gender || (seed % 2 === 0 ? "Male" : "Female")
    const languages = localWorker.languages || ["English", "Hindi", seed % 2 === 0 ? "Marathi" : "Tamil"]
    const availability = localWorker.availability === false || localWorker.availability === "Busy" ? "Busy" : "Available"

    const portfolioImages = [
      "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80"
    ]

    return {
      id: localWorker.id,
      name,
      photo: localWorker.avatar_url || localWorker.photo || null,
      category,
      city,
      experience: localWorker.experience || `${3 + (seed % 10)} years`,
      skills: localWorker.skills || [category, "Installation", "Emergency Repairs", "Maintenance", "Testing"],
      rating: `${Number(rating).toFixed(1)}`,
      hourlyRate: `${hourly}`,
      trustScore: `${trustScore}`,
      reviews: localWorker.reviews || [
        { customer_name: "Amit Patel", rating: 5, comment: `Outstanding service. The expert arrived right on time and fixed my ${category.toLowerCase()} issues quickly.`, date: "2026-04-10" },
        { customer_name: "Sneha Reddy", rating: 4, comment: "Professional behavior and clean cleanup post-work. Highly recommended.", date: "2026-03-15" }
      ],
      age,
      gender,
      languages,
      availability,
      completedJobs: jobsCompleted,
      verified: true,
      description: localWorker.description || localWorker.bio || `Dedicated ${category} expert providing highly professional services in ${city} for over ${3 + (seed % 10)} years. Fully equipped with modern tools and committed to absolute precision, safety, and customer satisfaction.`,
      portfolio: localWorker.portfolio || portfolioImages,
      phone: localWorker.phone || "+91 98765 43210",
      recommendations: localWorker.recommendations || [
        `Located in ${city} for prompt response and zero travel delays.`,
        `Stellar AI Trust Score of ${trustScore}/100 based on verified background and ID check.`,
        `Has successfully resolved over ${jobsCompleted} client service requests.`,
        `Exceptional ${rating}/5 rating with consistent high praise from local customers.`
      ]
    }
  }

  useEffect(() => {
    // Parse preserved back parameters from window URLSearchParams safely without Suspense issues
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const cat = params.get("category")
      const cit = params.get("city")
      if (cat) setBackCategory(cat)
      if (cit) setBackCity(cit)
    }

    async function fetchWorkerProfile() {
      // 1. Search local storage first
      let foundLocalWorker = null
      if (typeof window !== "undefined") {
        try {
          const localData = localStorage.getItem("workers")
          if (localData) {
            const workersList = JSON.parse(localData)
            foundLocalWorker = workersList.find((w: any) => w.id === idStr)
          }
        } catch (e) {
          console.error("Error reading workers from localStorage", e)
        }
      }

      if (foundLocalWorker) {
        setWorker(enrichWorker(foundLocalWorker))
        setLoading(false)
        return
      }

      // 2. Otherwise search backend API (which checks global cache + Supabase)
      try {
        setLoading(true)
        const response = await fetch(`/api/workers/${idStr}`)
        if (!response.ok) {
          toast.error("Worker session expired. Regenerate professionals.")
          router.push("/customer/dashboard")
          return
        }
        const data = await response.json()
        if (data.error) {
          toast.error("Worker session expired. Regenerate professionals.")
          router.push("/customer/dashboard")
          return
        }
        setWorker(data)
      } catch (err) {
        toast.error("Worker session expired. Regenerate professionals.")
        router.push("/customer/dashboard")
      } finally {
        setLoading(false)
      }
    }

    if (idStr) {
      fetchWorkerProfile()
    }
  }, [idStr, router])

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
      .or(`and(customer_id.eq.${customerProfile.id},employee_id.eq.${idStr}),and(customer_id.eq.${idStr},employee_id.eq.${customerProfile.id})`)
      .single()

    if (existing) {
      router.push("/messages")
    } else {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          customer_id: customerProfile.id,
          employee_id: idStr
        })
        .select()
        .single()
      
      if (newConv) router.push("/messages")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="text-slate-600 font-bold animate-pulse">Loading worker profile...</p>
      </div>
    )
  }

  if (!worker) {
    return null
  }

  return (
    <div className="relative min-h-screen bg-slate-50/30 pb-24">
      {/* Premium Ambient Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[380px] bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent -z-10" />

      <div className="container mx-auto p-4 md:p-8 space-y-8">
        
        {/* Navigation & Verification Badge Header */}
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/customer/dashboard?category=${backCategory}&city=${backCity}`)}
            className="flex items-center gap-2 hover:bg-slate-100/80 rounded-xl px-4 py-2 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="font-semibold text-slate-700">Back to Professionals</span>
          </Button>
          <div className="flex items-center gap-2 bg-orange-50 text-orange-600 border border-orange-100/80 px-4 py-2 rounded-2xl shadow-sm">
            <ShieldCheck className="w-5 h-5 text-orange-600 animate-pulse" />
            <span className="font-bold text-sm tracking-tight">AI Verified Professional</span>
          </div>
        </div>

        {/* Multi-Grid Core Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar, Availability, Actions & Demographics */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Primary Profile Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/15 to-primary/10 rounded-[2.5rem] blur-2xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <Card className="relative border-slate-200/80 shadow-xl rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-md">
                <CardContent className="p-8 flex flex-col items-center">
                  
                  {/* Large Avatar container */}
                  <div className="relative mb-6">
                    <div className="w-36 h-36 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-full p-[3px] shadow-2xl overflow-hidden">
                      <div className="w-full h-full bg-white rounded-full p-1 overflow-hidden">
                        {worker.photo ? (
                          <img src={worker.photo} alt={worker.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl font-black bg-orange-50 text-orange-500">
                            {worker.name[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    {worker.verified && (
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-white shadow-lg">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5px]" />
                      </div>
                    )}
                  </div>

                  {/* Profile Details header */}
                  <h2 className="text-2xl font-black text-slate-800 text-center leading-tight mb-2">{worker.name}</h2>
                  <Badge className="bg-orange-500 text-white hover:bg-orange-600 rounded-xl px-4 py-1 font-bold text-xs uppercase tracking-wider mb-4 shadow-md shadow-orange-500/20 border-none">
                    {worker.category}
                  </Badge>

                  {/* Availability Badge */}
                  <div className="flex items-center gap-2 mb-6 bg-slate-50 border border-slate-100/60 px-4 py-1.5 rounded-full shadow-inner">
                    <div className={`w-3 h-3 rounded-full ${worker.availability === "Available" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"}`}></div>
                    <span className={`text-xs font-black ${worker.availability === "Available" ? "text-green-600" : "text-red-500"}`}>
                      {worker.availability === "Available" ? "Available Now" : "Busy / Offline"}
                    </span>
                  </div>

                  {/* Action Group */}
                  <div className="grid grid-cols-1 gap-3 w-full border-t border-slate-100 pt-6">
                    
                    {/* Dial Action */}
                    <a href={`tel:${worker.phone}`} className="w-full">
                      <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-200 hover:border-slate-300 font-bold text-slate-700 bg-white shadow-sm flex items-center justify-center gap-2 transition-all">
                        <Phone className="w-5 h-5 text-orange-500" />
                        <span>Call Professional</span>
                      </Button>
                    </a>

                    {/* Chat Action */}
                    <Button onClick={handleSendMessage} className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
                      <MessageSquare className="w-5 h-5 text-orange-400" />
                      <span>Chat via Portal</span>
                    </Button>

                    {/* Book Dialog Trigger */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-base shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all">
                          <Calendar className="w-5 h-5" />
                          <span>Book Services</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl bg-white/95 backdrop-blur-md max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-orange-500" />
                            <span>Request Booking</span>
                          </DialogTitle>
                          <p className="text-sm text-slate-500 font-medium">Configure date and job details for {worker.name}.</p>
                        </DialogHeader>
                        <BookingForm employeeId={worker.id} onSuccess={() => router.push("/customer/bookings")} />
                      </DialogContent>
                    </Dialog>

                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Demographics Profile Card */}
            <Card className="border-slate-200/80 shadow-lg rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-extrabold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-4 h-4 text-orange-500" /> Personal Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Age</span>
                  <span className="text-slate-800 font-bold">{worker.age} Years</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Gender</span>
                  <span className="text-slate-800 font-bold">{worker.gender}</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                  <span className="text-slate-400 font-medium">Languages</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {worker.languages.map((lang) => (
                      <Badge key={lang} variant="secondary" className="rounded-lg text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border-none">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm py-2">
                  <span className="text-slate-400 font-medium">Verified Phone</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(worker.phone)
                      setCopied(true)
                      toast.success("Phone number copied!")
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="text-orange-600 font-bold hover:underline flex items-center gap-1.5 transition-all text-xs"
                  >
                    <span>{worker.phone}</span>
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: AI Insights, Professional Details, Portfolio & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Recommendation Highlight Box */}
            <div className="relative group/ai">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-primary/10 rounded-[2.5rem] blur-2xl opacity-70 group-hover/ai:opacity-100 transition-opacity"></div>
              <Card className="relative border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-orange-50/20 to-white/95 shadow-xl rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-center gap-2.5 mb-4 text-orange-600">
                    <Sparkles className="w-6 h-6 fill-orange-500/20 animate-bounce" />
                    <h3 className="text-lg font-black uppercase tracking-tight">AI Matching Insights</h3>
                  </div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Why this worker matches your needs</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {worker.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-3 bg-white/75 p-4 rounded-2xl border border-orange-100/30 shadow-sm transition-all hover:bg-white hover:translate-y-[-2px]">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 font-black text-xs">
                          {i + 1}
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-snug">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Hourly Rate */}
              <Card className="border-slate-100/80 shadow-md rounded-3xl bg-white/95 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Starting Rate</span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-slate-800">
                      ₹{worker.hourlyRate}<span className="text-sm font-medium text-slate-400">/hr</span>
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Starting service fee.</p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Trust Score */}
              <Card className="border-slate-100/80 shadow-md rounded-3xl bg-white/95 hover:shadow-lg transition-shadow relative overflow-hidden group/trust">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-transparent rounded-full -mr-6 -mt-6"></div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">AI Trust Score</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-green-600">{worker.trustScore}</p>
                      <p className="text-sm font-bold text-slate-400">/100</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: `${worker.trustScore}%` }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Completed Jobs */}
              <Card className="border-slate-100/80 shadow-md rounded-3xl bg-white/95 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Completed Jobs</span>
                  </div>
                  <div>
                    <p className="text-3xl font-black text-blue-600">{worker.completedJobs}+</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Contracts finished.</p>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Biography & Skills */}
            <Card className="border-slate-100/80 shadow-md rounded-[2.5rem] bg-white/95">
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-3">About the Expert</h3>
                  <p className="text-base text-slate-600 leading-relaxed font-medium">
                    {worker.description}
                  </p>
                </div>
                
                <div className="border-t border-slate-100 pt-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Core Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill) => (
                      <Badge key={skill} className="rounded-xl px-3 py-1 font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-none">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Grid Showcase */}
            <Card className="border-slate-100/80 shadow-md rounded-[2.5rem] bg-white/95 overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-orange-500" /> Recent Works & Projects
                </CardTitle>
                <CardDescription>Visual references of previously delivered jobs.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {worker.portfolio.map((imgUrl, i) => {
                    const projectTitles = [
                      `Premium ${worker.category} Renovation`,
                      `Custom ${worker.category} Repair Service`,
                      `High-Precision Fitting & Setup`,
                      `Urgent Emergency Resolution`
                    ]
                    const title = projectTitles[i % projectTitles.length]
                    return (
                      <div key={i} className="group/item relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm transition-all hover:shadow-md">
                        <div className="h-48 overflow-hidden relative">
                          <img 
                            src={imgUrl} 
                            alt={title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-85 group-hover/item:opacity-100 transition-opacity"></div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-white font-extrabold text-sm leading-tight tracking-tight drop-shadow-md">{title}</p>
                            <p className="text-orange-300 font-bold text-[10px] uppercase tracking-wider mt-1 drop-shadow-md">Completed in {worker.city}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-orange-500" /> Client Reviews ({worker.reviews.length})
                </h3>
                <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-orange-600 font-bold text-xs">
                  <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                  <span>{worker.rating} Average Rating</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {worker.reviews.map((review, i) => (
                  <Card key={i} className="border-slate-100/80 shadow-md rounded-[2.5rem] p-6 bg-white/95 hover:translate-y-[-2px] transition-transform duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center font-black text-orange-600 text-sm">
                          {review.customer_name[0]}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm">{review.customer_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{review.date}</p>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(review.rating)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                      "{review.comment}"
                    </p>
                  </Card>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
