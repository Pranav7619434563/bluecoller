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
      id: `mock-${category}-${city}-${i}-${baseSeed}`,
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
    setAiMatches(generateMockWorkers(detectedCategory, currentCity).slice(0, 3));
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
        if (data.error || !data.workers || data.workers.length === 0) {
          setWorkers(generateMockWorkers(category, city));
        } else {
          setWorkers(data.workers);
        }
      } catch (err: any) {
        setWorkers(generateMockWorkers(category, city));
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
        
        if (workersData.workers && workersData.workers.length > 0) {
          setAiMatches(workersData.workers);
        } else {
          setAiMatches(generateMockWorkers(matchData.match.recommended_category, city).slice(0, 3));
        }
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
    router.push("/")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Customer Dashboard</h1>
        <Button variant="outline" onClick={handleSignOut} className="rounded-xl border-slate-200">Sign Out</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-xl bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="search" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Search</TabsTrigger>
          <TabsTrigger value="ai-match" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">AI Match</TabsTrigger>
          <TabsTrigger value="bookings" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Bookings</TabsTrigger>
          <TabsTrigger value="rates" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Negotiate</TabsTrigger>
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
                  <Card key={worker.id} className="group cursor-pointer hover:border-orange-500 transition-all duration-300 hover:shadow-xl rounded-2xl overflow-hidden border-slate-200" onClick={() => router.push(`/customer/employee/${worker.id}`)}>
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
                      <Button className="w-full mt-4 group-hover:bg-orange-600 rounded-xl bg-slate-800 text-white" variant="secondary">View Profile</Button>
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
                      <Card key={worker.id} className="bg-white group cursor-pointer hover:border-orange-500 transition-all duration-300 shadow-sm rounded-2xl overflow-hidden border-slate-200">
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
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center py-8">
                    {aiLoading ? "Analyzing your requirements and matching with experts..." : "AI recommendations will appear here..."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="rounded-3xl border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>Track the status of your service requests.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-2xl">📅</div>
              <p className="text-slate-500 mb-6">You don't have any active bookings.</p>
              <div className="p-8 border rounded-3xl bg-slate-50 border-dashed border-slate-300 max-w-sm">
                <p className="text-sm font-medium mb-4 text-slate-600">Ready to hire a professional?</p>
                <Button className="w-full h-12 rounded-xl font-bold bg-slate-800 text-white" onClick={() => setActiveTab("search")}>
                  Select a Worker
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <CustomerRatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
