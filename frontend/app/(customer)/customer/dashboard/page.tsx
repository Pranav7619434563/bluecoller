"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { CATEGORIES, INDIAN_CITIES, CITY_REGION_MAP, REGIONAL_NAMES, Region } from "@/lib/constants"
import { CustomerRatesTab } from "@/components/customer/CustomerRatesTab"
import CustomerNotificationBell from "@/components/customer/CustomerNotificationBell"
import AIMatchPanel from "@/components/customer/AIMatchPanel"
import AINegotiationAssistant from "@/components/customer/AINegotiationAssistant"
import { Calendar, Clock, MapPin, Star, Sparkles, RefreshCw } from "lucide-react"

type WorkerProfile = {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  job_category: string | null
  hourly_rate: number | null
  avg_rating: number | null
  availability: boolean
}

// Simple hash function to create a seed from a string
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// Simple helper to generate unique UUIDs
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "uuid-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now().toString(36);
};

// Helper to generate mock workers if AI fails or for consistent demo
const generateMockWorkers = (category: string, city: string): WorkerProfile[] => {
  const region: Region = CITY_REGION_MAP[city] || "North";
  const { maleFirst, femaleFirst, last } = REGIONAL_NAMES[region];

  const workers: WorkerProfile[] = [];
  const baseSeed = hashString(category + city + "salt_v2");

  for (let i = 0; i < 10; i++) {
    // Alternate gender or use seed to decide
    const isFemale = (baseSeed + i) % 2 === 0;
    const firstNames = isFemale ? femaleFirst : maleFirst;
    
    const fIdx = (baseSeed + (i * 17) + (city.length * 3)) % firstNames.length;
    const lIdx = (baseSeed * (i + 11) + (category.length * 7)) % last.length;

    let fullName = `${firstNames[fIdx]} ${last[lIdx]}`;
    if (city === "Mandya" && i % 3 === 0) {
      fullName = `${firstNames[fIdx]} Gowda`;
    }

    workers.push({
      id: generateUUID(),
      full_name: fullName,
      avatar_url: null,
      city: city,
      job_category: category === "All" ? "Professional" : category,
      hourly_rate: 300 + ((baseSeed + i * 50) % 700),
      avg_rating: 3.5 + ((baseSeed + i * 3) % 15) / 10,
      availability: ((baseSeed + i) % 10) < 8 // 80% online
    });
  }

  return workers;
};


export default function CustomerDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [workers, setWorkers] = useState<WorkerProfile[]>([])
  const [activeTab, setActiveTab] = useState("search")
  const [bookings, setBookings] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])

  // AI Match States
  const [aiDescription, setAiDescription] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMatches, setAiMatches] = useState<WorkerProfile[]>([])
  const [matchResult, setMatchResult] = useState<{
    recommended_category: string,
    confidence: string,
    reasoning: string,
    tags: string[]
  } | null>(null)

  // Filters
  const [category, setCategory] = useState("All")
  const [city, setCity] = useState("Mumbai")

  // Restore category, city, and role from URL to preserve filters and context, and verify active user sessions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      const cit = params.get("city");
      const urlRole = params.get("role");
      
      if (cat) setCategory(cat);
      if (cit) setCity(cit);
      
      // Ensure customer role is hydrated and synced to local storage
      if (urlRole === "customer" || localStorage.getItem("role") === "customer") {
        localStorage.setItem("mock_role", "customer");
        localStorage.setItem("role", "customer");
      }

      // Secure client-side check to prevent direct access/back-button traversal after sign out
      async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser()
        const cachedRole = localStorage.getItem("role")
        if (!user || cachedRole !== "customer") {
          router.replace("/")
        }
      }
      checkAuth()
    }
  }, [router, supabase]);

  // Load bookings and listen for real-time changes
  useEffect(() => {
    const loadBookings = () => {
      const localBookingsStr = localStorage.getItem("local_bookings")
      if (localBookingsStr) {
        setBookings(JSON.parse(localBookingsStr))
      }
    }

    const loadNotifications = () => {
      const localNotificationsStr = localStorage.getItem("customer_notifications")
      if (localNotificationsStr) {
        setNotifications(JSON.parse(localNotificationsStr))
      } else {
        setNotifications([])
      }
    }
    
    loadBookings()
    loadNotifications()

    // Listen to storage events from other tabs (multi-tab testing)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "latest_event" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          if (data.event === "BOOKING_RESPONSE") {
            const { bookingId, status, workerName } = data
            setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status } : b))
            
            // Add notification to localStorage
            const message = status === "Accepted"
              ? `🔔 Booking accepted by ${workerName}`
              : `🔔 Booking rejected by ${workerName}`
              
            const newNotif = {
              id: crypto.randomUUID(),
              bookingId,
              workerName,
              message,
              read: false,
              timestamp: Date.now()
            }
            
            const existingNotifsStr = localStorage.getItem("customer_notifications")
            const notifs = existingNotifsStr ? JSON.parse(existingNotifsStr) : []
            if (!notifs.some((n: any) => n.bookingId === bookingId && n.message === message)) {
              notifs.unshift(newNotif)
              localStorage.setItem("customer_notifications", JSON.stringify(notifs))
              setNotifications(notifs)
            }

            if (status === "Accepted") {
              toast.success("Booking Accepted!", {
                description: `Your booking has been accepted by ${workerName}`
              })
            } else if (status === "Rejected") {
              toast.error("Booking Request Rejected", {
                description: `Your booking request was rejected`
              })
            }
          }
        } catch (err) {
          console.error("Error parsing latest_event storage event:", err)
        }
      } else if (e.key === "local_bookings") {
        loadBookings()
      } else if (e.key === "customer_notifications") {
        loadNotifications()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Listen to Supabase broadcast channel
    let channel: any = null
    try {
      channel = supabase.channel("dashboard-sync")
      channel
        .on("broadcast", { event: "BOOKING_RESPONSE" }, ({ payload }: any) => {
          const { bookingId, status, workerName } = payload
          setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status } : b))
          
          // Add notification to localStorage
          const message = status === "Accepted"
            ? `🔔 Booking accepted by ${workerName}`
            : `🔔 Booking rejected by ${workerName}`
            
          const newNotif = {
            id: crypto.randomUUID(),
            bookingId,
            workerName,
            message,
            read: false,
            timestamp: Date.now()
          }
          
          const existingNotifsStr = localStorage.getItem("customer_notifications")
          const notifs = existingNotifsStr ? JSON.parse(existingNotifsStr) : []
          if (!notifs.some((n: any) => n.bookingId === bookingId && n.message === message)) {
            notifs.unshift(newNotif)
            localStorage.setItem("customer_notifications", JSON.stringify(notifs))
            setNotifications(notifs)
          }

          if (status === "Accepted") {
            toast.success("Booking Accepted!", {
              description: `Your booking has been accepted by ${workerName}`
            })
          } else if (status === "Rejected") {
            toast.error("Booking Request Rejected", {
              description: `Your booking request was rejected`
            })
          }
        })
        .subscribe()
    } catch (err) {
      console.error("Supabase broadcast channel failed in customer dashboard:", err)
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "notifications") {
      const localNotificationsStr = localStorage.getItem("customer_notifications")
      if (localNotificationsStr) {
        const notifs = JSON.parse(localNotificationsStr)
        const updated = notifs.map((n: any) => ({ ...n, read: true }))
        localStorage.setItem("customer_notifications", JSON.stringify(updated))
        setNotifications(updated)
      }
    }
  }

  // Helper to save generated workers to localStorage and persist them in the backend API
  const saveWorkersToLocalStorage = async (newWorkers: WorkerProfile[]) => {
    try {
      const existingStr = localStorage.getItem("workers");
      let existing: WorkerProfile[] = [];
      if (existingStr) {
        existing = JSON.parse(existingStr);
      }
      const merged = [...existing];
      for (const nw of newWorkers) {
        const idx = merged.findIndex(w => w.id === nw.id);
        if (idx > -1) {
          merged[idx] = nw;
        } else {
          merged.push(nw);
        }
      }
      localStorage.setItem("workers", JSON.stringify(merged));

      // Optional backend persistence
      await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workers: newWorkers })
      });
    } catch (e) {
      console.error("Failed to save workers to localStorage/backend", e);
    }
  };

  // Mock AI matching logic
  const mockAiMatch = (description: string, currentCity: string) => {
    const desc = description.toLowerCase();
    let detectedCategory = "None";

    if (/\bleak\b|\bpipe\b|\btap\b|\bplumb\b/i.test(desc)) detectedCategory = "Plumber";
    else if (/\bwire\b|\bcurrent\b|\bfan\b|\blight\b|\belectric\b/i.test(desc)) detectedCategory = "Electrician";
    else if (/\bwood\b|\bdoor\b|\bfurniture\b|\bcarpenter\b/i.test(desc)) detectedCategory = "Carpenter";
    else if (/\bpaint\b|\bwall\b|\bcolor\b/i.test(desc)) detectedCategory = "Painter";
    else if (/\bac\b|\bair condition\b|\bcool\b|\bfridge\b/i.test(desc)) detectedCategory = "AC Technician";
    else if (/\bclean\b|\bwash\b|\bdust\b/i.test(desc)) detectedCategory = "Home Cleaning";
    else if (/\bcook\b|\bfood\b|\bmeal\b|\bchef\b/i.test(desc)) detectedCategory = "Cook";
    else if (/\bdriver\b|\bdriving\b|\bchauffeur\b/i.test(desc)) detectedCategory = "Driver";
    else if (/\bteach\b|\btutor\b|\bstudy\b|\bscience\b|\bmath\b|\bschool\b/i.test(desc)) detectedCategory = "Home Tutor";
    else if (/\byoga\b|\bgym\b|\btrainer\b|\bfitness\b/i.test(desc)) detectedCategory = "Yoga Instructor";

    if (detectedCategory === "None") {
      setMatchResult({
        recommended_category: "None",
        confidence: "low",
        reasoning: "Match Not Found",
        tags: ["no-match"]
      });
      setAiMatches([]);
      return;
    }

    setMatchResult({
      recommended_category: detectedCategory,
      confidence: "medium",
      reasoning: "Detected keyword matching in your description.",
      tags: [detectedCategory.toLowerCase(), "quick-match"]
    });
    const matched = generateMockWorkers(detectedCategory, currentCity).slice(0, 3);
    setAiMatches(matched);
    saveWorkersToLocalStorage(matched);
  };

  useEffect(() => {
    async function loadWorkers() {
      setLoading(true)
      try {
        const response = await fetch("/api/anthropic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: "generate_workers", category, city })
        });
        const data = await response.json();
        
        let fetchedWorkers: WorkerProfile[] = [];
        if (data.error || !data.workers || data.workers.length === 0) {
          fetchedWorkers = generateMockWorkers(category, city);
        } else {
          // Overwrite AI response IDs to guarantee clean UUIDs
          fetchedWorkers = data.workers.map((w: any) => ({
            ...w,
            id: w.id && w.id.length > 8 && w.id.includes("-") ? w.id : generateUUID()
          }));
        }
        
        setWorkers(fetchedWorkers);
        saveWorkersToLocalStorage(fetchedWorkers);
      } catch (err: any) {
        const mockWorkers = generateMockWorkers(category, city);
        setWorkers(mockWorkers);
        saveWorkersToLocalStorage(mockWorkers);
      } finally {
        setLoading(false)
      }
    }
    loadWorkers()
  }, [category, city])

  const handleAiMatch = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please describe your job first");
      return;
    }
    setAiLoading(true);
    setMatchResult(null);
    setAiMatches([]);

    try {
      // Step 1: Categorize the requirement
      const matchResponse = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          task: "match_requirement", 
          description: aiDescription,
          city: city 
        })
      });
      const matchData = await matchResponse.json();
      
      if (matchData.match) {
        setMatchResult(matchData.match);
        
        if (matchData.match.recommended_category === "None") {
          setAiMatches([]);
          toast.error("No relevant professional found for this requirement.");
          setAiLoading(false);
          return;
        }

        // Step 2: Fetch workers for the recommended category
        const workersResponse = await fetch("/api/anthropic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            task: "generate_workers", 
            category: matchData.match.recommended_category, 
            city: city 
          })
        });
        const workersData = await workersResponse.json();
        
        let fetchedAiMatches: WorkerProfile[] = [];
        if (workersData.workers && workersData.workers.length > 0) {
          // Overwrite AI response IDs to guarantee clean UUIDs
          fetchedAiMatches = workersData.workers.map((w: any) => ({
            ...w,
            id: w.id && w.id.length > 8 && w.id.includes("-") ? w.id : generateUUID()
          }));
        } else {
          fetchedAiMatches = generateMockWorkers(matchData.match.recommended_category, city).slice(0, 3);
        }
        
        setAiMatches(fetchedAiMatches);
        saveWorkersToLocalStorage(fetchedAiMatches);
        toast.success("AI found the perfect match!");
      } else {
        throw new Error("AI could not categorize your request");
      }
    } catch (err: any) {
      toast.error("AI matching failed. Falling back to simple search.");
      mockAiMatch(aiDescription, city);
    } finally {
      setAiLoading(false);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    
    // Completely clear all session & role parameters from local state caches
    localStorage.removeItem("mock_role")
    localStorage.removeItem("role")
    localStorage.removeItem("userData")
    localStorage.removeItem("profileData")
    
    toast.success("Signed out successfully")
    router.replace("/")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Customer Dashboard</h1>
        <div className="flex items-center gap-3">
          <CustomerNotificationBell />
          <Button variant="outline" onClick={handleSignOut} className="rounded-xl border-slate-200">Sign Out</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="search" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Search</TabsTrigger>
          <TabsTrigger value="ai-match" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">AI Match</TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Bookings</TabsTrigger>
          <TabsTrigger value="rates" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Negotiate</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm relative">
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold border-2 border-slate-100 animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-xl">Find Professionals</CardTitle>
              <CardDescription>Select a category and city to see professionals near you.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-600">Job Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent className="max-h-80 rounded-xl">
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-600">City / District</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200"><SelectValue placeholder="Select City" /></SelectTrigger>
                  <SelectContent className="max-h-80 rounded-xl">
                    {INDIAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="overflow-hidden rounded-2xl">
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
              {workers.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-3xl bg-slate-50 border-slate-200">
                  <p className="text-slate-500 mb-2">No workers found matching your criteria.</p>
                  <Button variant="link" onClick={() => { setCategory("All"); setCity("Mumbai") }}>Reset filters</Button>
                </div>
              ) : (
                workers.map(worker => (
                  <Card key={worker.id} className="group cursor-pointer hover:border-orange-500 transition-all duration-300 hover:shadow-xl rounded-2xl overflow-hidden border-slate-200" onClick={() => router.push(`/customer/employee/${worker.id}?category=${category}&city=${city}`)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">{worker.full_name}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            {worker.job_category} • {worker.city}
                          </CardDescription>
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${worker.availability ? "bg-green-500" : "bg-red-500"} shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="flex items-center gap-1">⭐ {Number(worker.avg_rating).toFixed(1)}</span>
                        <span className="text-orange-600 font-bold text-base">₹{worker.hourly_rate}/hr</span>
                      </div>
                      <Button className="w-full mt-4 group-hover:bg-orange-600 rounded-xl bg-slate-800 text-white" variant="secondary" onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/customer/employee/${worker.id}?category=${category}&city=${city}`);
                      }}>View Profile</Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-match">
          <Card className="border-orange-200 bg-orange-50/30 rounded-3xl overflow-hidden shadow-sm">
            <CardHeader>
              <CardTitle className="text-orange-600">AI Matchmaker</CardTitle>
              <CardDescription>Describe your needs and we'll generate professional recommendations for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-600">Select Your City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-12 rounded-xl bg-white border-slate-200"><SelectValue placeholder="Select City" /></SelectTrigger>
                    <SelectContent className="max-h-80 rounded-xl">
                      {INDIAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-600">What do you need help with?</Label>
                  <Input
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="Describe your job (e.g. leaking tap in bathroom...)"
                    className="bg-white h-12 rounded-xl border-slate-200"
                  />
                </div>
              </div>
              <Button className="w-full md:w-auto px-8 h-12 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white" onClick={handleAiMatch} disabled={aiLoading}>
                {aiLoading ? "AI is matching..." : "Find My Match"}
              </Button>

              <div className="pt-6 border-t border-orange-100 space-y-6">
                {matchResult && (
                  <div className="bg-white p-6 rounded-2xl border border-orange-100 shadow-sm animate-in zoom-in duration-300">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-orange-600 font-bold text-lg flex items-center gap-2">
                        ✨ AI Analysis Result
                      </h4>
                      <Badge className={`${
                        matchResult.confidence === 'high' ? 'bg-green-100 text-green-700' : 
                        matchResult.confidence === 'medium' ? 'bg-orange-100 text-orange-700' : 
                        'bg-red-100 text-red-700'
                      } border-none rounded-lg text-[10px] font-black uppercase px-2 py-0.5`}>
                        {matchResult.confidence} Confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-800 font-medium mb-1">
                      Recommended: <span className="text-orange-600 underline underline-offset-4">{matchResult.recommended_category}</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-4 italic leading-relaxed">
                      "{matchResult.reasoning}"
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {matchResult.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 text-[10px] lowercase font-medium">#{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {matchResult?.recommended_category === "None" && (
                   <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-3xl bg-red-50/30 border-red-100">
                    <p className="text-red-500 font-bold mb-2">Match Not Found</p>
                    <p className="text-xs text-slate-500 max-w-xs text-center leading-relaxed">
                      Your requirement does not match any of our available professional service categories. Please try describing a repair, maintenance, or educational task.
                    </p>
                  </div>
                )}

                {aiMatches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiMatches.map(worker => (
                      <Card key={worker.id} className="bg-white group cursor-pointer hover:border-orange-500 transition-all duration-300 shadow-sm rounded-2xl overflow-hidden border-slate-200" onClick={() => router.push(`/customer/employee/${worker.id}?category=${category}&city=${city}`)}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <CardTitle className="text-lg group-hover:text-orange-600 transition-colors">{worker.full_name}</CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                {worker.job_category} • {worker.city}
                              </CardDescription>
                            </div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center text-sm font-medium">
                            <span className="flex items-center gap-1">⭐ {Number(worker.avg_rating).toFixed(1)}</span>
                            <span className="text-orange-600 font-bold text-base">₹{worker.hourly_rate}/hr</span>
                          </div>
                          <Button className="w-full mt-4 group-hover:bg-orange-600 rounded-xl bg-slate-800 text-white" variant="secondary" onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/customer/employee/${worker.id}?category=${category}&city=${city}`);
                          }}>View Profile</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-8">
                    {aiLoading ? "Analyzing your requirements and matching with experts..." : "AI recommendations will appear here..."}
                  </p>
                )}

                {/* AI Confidence Score Panel */}
                {workers.length > 0 && (
                  <AIMatchPanel
                    workers={workers}
                    city={city}
                    jobDescription={aiDescription}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800">My Service Bookings</CardTitle>
                  <CardDescription className="text-sm text-slate-500">Track and manage your service requests in real-time.</CardDescription>
                </div>
                <Badge className="bg-orange-500 hover:bg-orange-600 font-bold px-3 py-1 text-xs border-none">
                  ✨ Live Updates Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {bookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">📅</div>
                  <p className="text-slate-500 font-medium mb-6">You don't have any active bookings yet.</p>
                  <div className="p-6 border rounded-2xl bg-slate-50 border-dashed border-slate-300 max-w-sm">
                    <p className="text-sm font-medium mb-4 text-slate-600">Looking for a professional?</p>
                    <Button className="w-full h-11 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white" onClick={() => setActiveTab("search")}>
                      Find Professional Now
                    </Button>
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="all" className="space-y-6">
                  <TabsList className="flex flex-wrap h-auto bg-slate-100 p-1 rounded-xl max-w-fit gap-1">
                    <TabsTrigger value="all" className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      All ({bookings.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Pending ({bookings.filter(b => b.status === "Pending").length})
                    </TabsTrigger>
                    <TabsTrigger value="accepted" className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Accepted ({bookings.filter(b => b.status === "Accepted").length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Rejected ({bookings.filter(b => b.status === "Rejected").length})
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="rounded-lg px-4 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      Completed ({bookings.filter(b => b.status === "Completed").length})
                    </TabsTrigger>
                  </TabsList>

                  {["all", "pending", "accepted", "rejected", "completed"].map((tabName) => {
                    const filteredBookings = tabName === "all" 
                      ? bookings 
                      : bookings.filter(b => b.status.toLowerCase() === tabName);

                    return (
                      <TabsContent key={tabName} value={tabName} className="space-y-6 mt-0">
                        {filteredBookings.length === 0 ? (
                          <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-500 text-sm font-semibold">No bookings found in this section</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredBookings.map((booking) => (
                              <Card key={booking.bookingId} className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/40 space-y-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg">
                                        {booking.workerName.charAt(0)}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-slate-800 text-base">{booking.workerName}</h4>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{booking.category}</Badge>
                                      </div>
                                    </div>
                                    <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase font-black border-none ${
                                      booking.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                      booking.status === "Accepted" ? "bg-green-100 text-green-700" :
                                      booking.status === "Rejected" ? "bg-red-100 text-red-700" :
                                      "bg-blue-100 text-blue-700"
                                    }`}>
                                      {booking.status}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="font-medium">{booking.date}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="font-medium truncate">{booking.time}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-2 text-xs text-slate-600">
                                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                      <p className="leading-relaxed"><b className="text-slate-700">Location:</b> {booking.location}</p>
                                    </div>

                                    {booking.address && (
                                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                                        <b>Address:</b> {booking.address}
                                      </p>
                                    )}

                                    {booking.job_description && (
                                      <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border leading-relaxed">
                                        <b>Description:</b> {booking.job_description}
                                      </p>
                                    )}

                                    {booking.matchScore && (
                                      <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50/50 rounded-xl border border-orange-200/50 flex flex-col gap-1">
                                        <span className="text-[11px] font-black text-orange-600 flex items-center gap-1">
                                          ✨ AI Match Score: {booking.matchScore}%
                                        </span>
                                        <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                          "{booking.matchReason}"
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                                    {booking.status === "Accepted" && (
                                      <Button size="sm" className="flex-1 rounded-lg h-9 bg-green-500 hover:bg-green-600 text-white font-bold text-xs">
                                        Message Worker
                                      </Button>
                                    )}
                                    {booking.status === "Pending" && (
                                      <p className="text-center text-[11px] text-amber-600 font-bold w-full py-1 bg-amber-50 border border-amber-200/50 rounded-lg animate-pulse">
                                        Awaiting professional response...
                                      </p>
                                    )}
                                    {booking.status === "Rejected" && (
                                      <Button size="sm" variant="outline" className="flex-1 rounded-lg h-9 border-slate-200 text-slate-700 font-bold text-xs" onClick={() => setActiveTab("search")}>
                                        Book Another Worker
                                      </Button>
                                    )}
                                    {booking.status === "Completed" && (
                                      <Button size="sm" variant="secondary" className="flex-1 rounded-lg h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs">
                                        Review Service
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    )
                  })}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <AINegotiationAssistant
            jobCategory={category !== "All" ? category : undefined}
          />
          <CustomerRatesTab />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="rounded-3xl border border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between p-6">
              <div>
                <CardTitle className="text-2xl font-black text-slate-800">Notifications</CardTitle>
                <CardDescription className="text-sm text-slate-500">View updates for your service bookings.</CardDescription>
              </div>
              {notifications.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl text-xs font-semibold"
                  onClick={() => {
                    localStorage.setItem("customer_notifications", JSON.stringify([]))
                    setNotifications([])
                    toast.success("Notifications cleared")
                  }}
                >
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">🔔</div>
                  <p className="text-slate-500 font-medium">No notifications yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Book a worker to receive real-time updates.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                        notif.message.toLowerCase().includes("accepted") ? "bg-green-50/40 border-green-100 hover:border-green-200" :
                        notif.message.toLowerCase().includes("rejected") ? "bg-red-50/40 border-red-100 hover:border-red-200" :
                        "bg-blue-50/40 border-blue-100 hover:border-blue-200"
                      }`}
                    >
                      <div className="text-xl shrink-0 mt-0.5">
                        {notif.message.toLowerCase().includes("accepted") ? "✅" :
                         notif.message.toLowerCase().includes("rejected") ? "❌" :
                         "📩"}
                      </div>
                      <div className="space-y-1 flex-1">
                        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                          {notif.message}
                        </p>
                        {notif.workerName && (
                          <p className="text-xs text-slate-500">
                            Professional: <span className="font-bold text-slate-600">{notif.workerName}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-2"></span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
