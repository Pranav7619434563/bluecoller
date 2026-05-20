"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Bell, User, Camera, FileText, CheckCircle2, Upload, Trash2, LayoutDashboard, Search, History, Settings, IndianRupee, MapPin, Sparkles, RefreshCw, Plus, Check } from "lucide-react"
import { VerificationTab } from "@/components/employee/VerificationTab"

type Profile = {
  id: string
  full_name: string
  city: string | null
  pincode: string | null
  bio: string | null
  job_category: string | null
  hourly_rate: number | null
  daily_rate: number | null
  project_rate: number | null
  availability: boolean
  experience_years: number | null
  avg_rating: number | null
  profile_views: number | null
}

type Project = {
  id: string
  title: string
  description: string
  imageUrl: string
}

type Notification = {
  id: string
  title: string
  description: string
  time: string
  type: 'job' | 'system'
  isUrgent?: boolean
  read: boolean
}

const CATEGORIES = [
  "Plumber", "Electrician", "Carpenter", "Painter", "Welder", "Mason", 
  "AC Technician", "Home Cleaner", "Driver", "Security Guard", "Cook", 
  "Gardener", "Pest Control", "Helper", "Fabricator", "Tile Worker", 
  "Roofer", "HVAC Technician"
]

export default function EmployeeDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVerificationSaved, setIsVerificationSaved] = useState(false);
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [isLiveMode, setIsLiveMode] = useState(false)

  // New States
  const [projects, setProjects] = useState<Project[]>([])
  const [newProject, setNewProject] = useState({ title: "", description: "", imageUrl: "" })
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [documents, setDocuments] = useState<{ id?: string, cert?: string }>({})
  const [skills, setSkills] = useState<string[]>(["Punctual", "Hardworking"])
  const [completedJobs, setCompletedJobs] = useState<string[]>(["Bathroom Tap Repair", "Kitchen Sink Installation", "Water Tank Cleaning"])
  
  // AI States
  const [isGeneratingBio, setIsGeneratingBio] = useState(false)
  const [bioOutputs, setBioOutputs] = useState<{ professional: string, friendly: string, seo: string } | null>(null)
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false)
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Urgent: AC Repair Needed",
      description: "Customer in Andheri West needs immediate AC servicing.",
      time: "2 mins ago",
      type: "job",
      isUrgent: true,
      read: false
    },
    {
      id: "2",
      title: "Profile Verified",
      description: "Your document verification is complete. You are now a Verified Pro!",
      time: "1 hour ago",
      type: "system",
      read: false
    }
  ])

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push("/login")
          return
        }

        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (error) {
          toast.error("Failed to load profile")
        } else {
          // Priority: Metadata Name (most recent from auth) > Database Name > Email prefix
          const metadataName = user.user_metadata?.full_name;
          const dbName = profileData.full_name;
          
          // If metadata exists, we trust it as the name from registration/login
          const displayName = metadataName || dbName || user.email?.split('@')[0] || "New Worker";

          setProfile({ ...profileData, full_name: displayName });
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router, supabase])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        city: profile.city,
        pincode: profile.pincode,
        bio: profile.bio,
        job_category: profile.job_category,
        experience_years: profile.experience_years,
      })
      .eq("id", profile.id)

    setSaving(false)
    if (error) toast.error("Update failed")
    else toast.success("Profile updated successfully!")
  }

  const handleFinalize = () => {
    if (!profile?.job_category || !profile?.city) {
        toast.error("Please complete your profile details first.")
        setActiveTab("profile")
        return
    }
    setIsLiveMode(true)
    setActiveTab("notifications")
    toast.success("Dashboard Live! You are now ready to receive jobs.")
  }

  const addProject = () => {
    if (!newProject.title) {
        toast.error("Project title is required")
        return
    }
    const project: Project = {
        id: Math.random().toString(36).substr(2, 9),
        ...newProject,
        imageUrl: newProject.imageUrl || "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=800&auto=format&fit=crop&q=60"
    }
    setProjects([...projects, project])
    setNewProject({ title: "", description: "", imageUrl: "" })
    setIsProjectDialogOpen(false)
    toast.success("Project added to portfolio!")
  }

  const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
  const projectFileInputRef = useRef<HTMLInputElement>(null)
  const idFileInputRef = useRef<HTMLInputElement>(null);
  
  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image of your ID card.');
      if (idFileInputRef.current) idFileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`ID image must be less than 2 MB (selected ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      if (idFileInputRef.current) idFileInputRef.current.value = '';
      return;
    }
    toast.info('Verifying ID card...');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const resp = await fetch('/api/extract-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 })
        });
        const result = await resp.json();
        if (result.error) throw new Error(result.error);
        const data = result.data;
        // Basic validation: ensure a doc type is identified
        if (!data.docType) {
          toast.error('Unable to detect ID type. Please upload a valid ID card image.');
          return;
        }
        setExtractedData(data);
        setFormData({
          name: data.name || "",
          idNumber: data.idNumber || "",
          dob: data.dob || "",
          docType: data.docType || ""
        });
        toast.success('ID card verified and data extracted!');
      } catch (err: any) {
        toast.error(err.message || 'Failed to verify ID card');
      }
    };
    reader.readAsDataURL(file);
  };

  const saveVerification = async () => {
    if (!isFormComplete) {
      toast.error('Please complete all fields before saving.');
      return;
    }
    toast.info('Saving verification details...');
    try {
      const resp = await fetch('/api/save-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, documents })
      });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setIsVerificationSaved(true);
      toast.success('Verification details saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save verification');
    }
  };

  const handleProjectImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file (JPG, PNG, WEBP, etc.)")
      if (projectFileInputRef.current) projectFileInputRef.current.value = ''
      return
    }

    // Validate file size (max 2 MB)
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Image size must be less than 2 MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`)
      if (projectFileInputRef.current) projectFileInputRef.current.value = ''
      return
    }

    toast.info("Processing image...")
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setNewProject(prev => ({ ...prev, imageUrl: base64 }))
      toast.success("Image uploaded successfully!")
    }
    reader.onerror = () => {
      toast.error("Failed to read the image file.")
    }
    reader.readAsDataURL(file)
  }, [])

  const handleFileUpload = (type: 'project' | 'id' | 'cert') => {
    if (type === 'id') {
      // Trigger hidden file input for ID verification
      idFileInputRef.current?.click();
      return;
    }
    if (type === 'project') {
      projectFileInputRef.current?.click()
      return
    }
    toast.info("Uploading file...")
    setTimeout(() => {
        if (type === 'id') setDocuments({...documents, id: "Aadhar_Card.pdf"})
        if (type === 'cert') setDocuments({...documents, cert: "Skill_Certificate.png"})
        toast.success("File uploaded successfully!")
    }, 1000)
  }

  const acceptJob = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
    toast.success("Job accepted! Contact details sent to your SMS.", {
        description: "Customer: Samarth, Phone: +91 98765 43210"
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const generateBio = async () => {
    if (!profile) return
    setIsGeneratingBio(true)
    try {
      const uniqueSeed = Math.random().toString(36).substring(7);
      const timestamp = new Date().toISOString();
      const prompt = `Generate 3 worker bio versions for:
Name: ${profile.full_name}
Category: ${profile.job_category}
Skills: ${skills.join(", ")}
Experience: ${profile.experience_years} years

Version 1: Professional (Formal, expert-sounding)
Version 2: Friendly (Approachable, customer-focused)
Version 3: SEO (Keyword-rich, good for search ranking)

Return ONLY as a JSON object with keys: "professional", "friendly", "seo". No other text.

CRITICAL: To make this generation completely unique, dynamic, and organic (Seed: ${uniqueSeed}, Timestamp: ${timestamp}):
1. Do NOT use the exact same opening sentences or typical clichés.
2. Vary the tone, vocabulary, style, and highlight different aspects of the employee's expertise (e.g., focus on reliable project delivery, creative problem solving, efficiency, or technical precision).
3. Ensure that the generated text is completely unique and different from other runs, avoiding repetitive structures.`;

      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          prompt: prompt,
          temperature: 1.1
        })
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const bioText = data.response || ""
      const jsonStr = bioText.match(/\{[\s\S]*\}/)?.[0]
      
      if (jsonStr) {
        setBioOutputs(JSON.parse(jsonStr))
        toast.success("AI Bios generated!")
      } else {
        console.error("AI Response:", bioText)
        throw new Error("Could not parse AI response as JSON. Try again.")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "AI generation failed.")
    } finally {
      setIsGeneratingBio(false)
    }
  }

  const suggestSkills = async () => {
    if (!profile) return
    setIsSuggestingSkills(true)
    try {
      const prompt = `Given these completed jobs: ${completedJobs.join(", ")} and current skills: ${skills.join(", ")}, suggest 3-5 additional specific skills to add to this worker profile. 
Return ONLY as a JSON array of strings. No other text.`

      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          prompt: prompt
        })
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const skillText = data.response || ""
      const jsonStr = skillText.match(/\[[\s\S]*\]/)?.[0]
      
      if (jsonStr) {
        setSuggestedSkills(JSON.parse(jsonStr))
        toast.success("Skill suggestions updated!")
      } else {
        console.error("AI Response:", skillText)
        throw new Error("Could not parse AI suggestions. Try again.")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Skill suggestion failed.")
    } finally {
      setIsSuggestingSkills(false)
    }
  }

  if (loading) {
    return (
      <div className="container p-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (!profile) return <div className="p-8 text-center">Error loading profile.</div>

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 rounded-3xl border shadow-sm backdrop-blur-md bg-opacity-80">
        <div className="flex items-center gap-5">
            <div className="relative group">
                <div className="bg-primary/20 p-4 rounded-2xl group-hover:bg-primary/30 transition-colors">
                    <User className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight">{isLiveMode ? "Live Dashboard" : "Setup Mode"}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{profile.city || "Location not set"}</span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">{profile.job_category}</Badge>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="relative h-12 w-12 rounded-xl">
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-background font-black animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Notifications</SheetTitle>
                        <SheetDescription>Recent alerts for your profile.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                        {notifications.length === 0 ? (
                            <div className="text-center py-10 opacity-50">No new alerts</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`p-4 rounded-2xl border transition-all ${n.isUrgent ? "bg-orange-50 border-orange-200" : "bg-card"}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-sm">{n.title}</h4>
                                        <Badge variant="secondary" className="text-[10px]">{n.time}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{n.description}</p>
                                    {n.type === 'job' && (
                                        <div className="flex gap-2">
                                            <Button size="sm" className="h-8 text-xs font-bold" onClick={() => acceptJob(n.id)}>Accept Job</Button>
                                            <Button size="sm" variant="ghost" className="h-8 text-xs">Dismiss</Button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Badge variant={profile.availability ? "default" : "secondary"} className={`px-4 py-2 rounded-xl text-xs font-bold ${profile.availability ? "bg-green-500" : ""}`}>
                {profile.availability ? "ONLINE" : "OFFLINE"}
            </Badge>

            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={() => setIsLiveMode(!isLiveMode)}>
                <Settings className="w-6 h-6" />
            </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        {!isLiveMode ? (
          <div className="bg-card p-1 rounded-2xl border shadow-sm max-w-fit mx-auto">
            <TabsList className="bg-transparent gap-1">
              <TabsTrigger value="profile" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Profile</TabsTrigger>
              <TabsTrigger value="experience" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Portfolio</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Verification</TabsTrigger>
              <TabsTrigger value="finalize" className="rounded-xl px-6 bg-primary/10 text-primary font-bold">Go Live</TabsTrigger>
            </TabsList>
          </div>
        ) : (
          <div className="bg-card p-1 rounded-2xl border shadow-sm max-w-fit mx-auto">
            <TabsList className="bg-transparent gap-1">
              <TabsTrigger value="notifications" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2">
                <IndianRupee className="w-4 h-4" /> Job Alerts
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2">
                <History className="w-4 h-4" /> Earnings
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2">
                <Settings className="w-4 h-4" /> Profile settings
              </TabsTrigger>
            </TabsList>
          </div>
        )}

        <TabsContent value="profile">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-muted/30 pb-8">
              <CardTitle className="text-2xl">Professional Bio</CardTitle>
              <CardDescription>Tell customers why they should hire you.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleProfileUpdate} className="space-y-8 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold ml-1">Display Name</Label>
                    <Input 
                      value={profile.full_name || ""} 
                      onChange={e => setProfile({...profile, full_name: e.target.value})} 
                      placeholder="e.g. Rajesh Kumar"
                      className="rounded-2xl h-14 bg-muted/20 border-none focus-visible:ring-primary px-5"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-bold ml-1">Work Category</Label>
                    <Select value={profile.job_category || ""} onValueChange={v => setProfile({...profile, job_category: v})}>
                      <SelectTrigger className="rounded-2xl h-14 bg-muted/20 border-none px-5">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold ml-1">About You & Skills</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={generateBio} 
                      disabled={isGeneratingBio}
                      className="rounded-xl h-9 border-primary/20 text-primary hover:bg-primary/5"
                    >
                      {isGeneratingBio ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                      Generate AI Bio
                    </Button>
                  </div>
                  <Textarea 
                    rows={5} 
                    value={profile.bio || ""} 
                    onChange={e => setProfile({...profile, bio: e.target.value})} 
                    placeholder="e.g. I have 10 years experience in luxury plumbing..." 
                    className="rounded-2xl bg-muted/20 border-none focus-visible:ring-primary px-5 py-4 leading-relaxed"
                  />

                  {bioOutputs && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-primary/5 rounded-[2rem] border border-primary/10 animate-in zoom-in duration-300">
                      {(['professional', 'friendly', 'seo'] as const).map((key) => (
                        <div key={key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{key}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 text-[10px] font-bold text-primary"
                              onClick={() => {
                                setProfile({...profile, bio: bioOutputs[key]})
                                toast.success("Bio updated!")
                              }}
                            >
                              <Check className="w-3 h-3 mr-1" /> Use this
                            </Button>
                          </div>
                          <Textarea 
                            value={bioOutputs[key]}
                            onChange={(e) => setBioOutputs({...bioOutputs, [key]: e.target.value})}
                            className="rounded-xl bg-white/50 text-xs h-32 border-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-bold ml-1">Skill Tags</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={suggestSkills} 
                      disabled={isSuggestingSkills}
                      className="text-orange-600 font-bold hover:bg-orange-50"
                    >
                      {isSuggestingSkills ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <Plus className="w-3 h-3 mr-2" />}
                      Suggest Skills
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map(skill => (
                      <Badge key={skill} className="bg-slate-800 text-white rounded-full px-4 py-1 flex items-center gap-2 group">
                        {skill}
                        <button type="button" onClick={() => setSkills(skills.filter(s => s !== skill))} className="opacity-50 group-hover:opacity-100">×</button>
                      </Badge>
                    ))}
                  </div>

                  {suggestedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 animate-in slide-in-from-bottom duration-300">
                      <span className="text-[10px] font-bold text-orange-600 uppercase w-full mb-1">AI Suggestions:</span>
                      {suggestedSkills.map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="px-3 py-1 rounded-full cursor-pointer hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all text-xs font-medium border-orange-200 text-orange-700 bg-white"
                          onClick={() => {
                            setSkills([...skills, skill])
                            setSuggestedSkills(prev => prev.filter(s => s !== skill))
                          }}
                        >
                          {skill} +
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={saving} className="h-14 px-12 rounded-2xl text-lg font-black shadow-xl shadow-primary/20">
                    {saving ? "Saving..." : "Save Profile Details"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <VerificationTab profile={profile} />
        </TabsContent>

        {/* Other tabs follow the same premium styling... */}
        <TabsContent value="experience">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black">Project Portfolio</h2>
                        <p className="text-muted-foreground">High quality photos attract more customers.</p>
                    </div>
                    <Button onClick={() => setIsProjectDialogOpen(true)} className="rounded-xl font-bold">+ Add Project</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {projects.length === 0 ? (
                        <div className="col-span-3 py-20 bg-muted/20 rounded-[2rem] border-4 border-dashed border-muted flex flex-col items-center justify-center text-center">
                            <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="font-bold text-lg">No work photos added yet</p>
                            <Button variant="link" onClick={() => setIsProjectDialogOpen(true)}>Click to add your first job photo</Button>
                        </div>
                    ) : (
                        projects.map(p => (
                            <div key={p.id} className="relative group rounded-3xl overflow-hidden shadow-lg aspect-square">
                                <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <h4 className="text-white font-black text-lg">{p.title}</h4>
                                    <p className="text-white/70 text-xs line-clamp-2">{p.description}</p>
                                    <Button variant="destructive" size="icon" className="absolute top-4 right-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setProjects(projects.filter(x => x.id !== p.id))}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </TabsContent>

        <TabsContent value="finalize">
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-gradient-to-br from-primary to-orange-600 text-primary-foreground p-12 md:p-20 text-center relative">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative space-y-8">
                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl text-6xl transform hover:rotate-12 transition-transform cursor-pointer">✨</div>
                <div className="space-y-4">
                    <h2 className="text-5xl font-black tracking-tighter">Ready for Business?</h2>
                    <p className="text-xl text-white/80 max-w-lg mx-auto leading-relaxed">Your profile looks incredible! Finalize now to start appearing in customer searches for <b>{profile.job_category || "Technician"}</b> jobs.</p>
                </div>
                <Button size="lg" className="h-20 px-20 text-2xl font-black bg-white text-primary hover:bg-white/90 rounded-[2rem] shadow-2xl shadow-black/20 group" onClick={handleFinalize}>
                    Finalize & Go Live <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Live Mode Content */}
        <TabsContent value="notifications">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black">Open Job Requests</h3>
                        <Badge className="bg-green-500 animate-pulse">Live</Badge>
                    </div>
                    {notifications.filter(n => n.type === 'job').map(n => (
                        <div key={n.id} className="p-6 rounded-[1.5rem] border-2 border-primary/10 bg-primary/5 hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-black text-lg">{n.title}</h4>
                                    <p className="text-xs text-muted-foreground">{n.time} • Andheri, Mumbai</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-primary">₹1,200</p>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Earning</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{n.description}</p>
                            <div className="flex gap-3">
                                <Button className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-primary/20" onClick={() => acceptJob(n.id)}>Accept Job Now</Button>
                                <Button variant="outline" className="rounded-xl h-12">Details</Button>
                            </div>
                        </div>
                    ))}
                </Card>
                <Card className="border-none shadow-xl rounded-[2rem] p-8">
                    <h3 className="text-2xl font-black mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                        {notifications.filter(n => n.type === 'system').map(n => (
                            <div key={n.id} className="flex gap-4 p-4 rounded-2xl bg-muted/30">
                                <div className="bg-primary/20 p-3 rounded-xl h-fit"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                                <div>
                                    <p className="font-bold text-sm">{n.title}</p>
                                    <p className="text-xs text-muted-foreground">{n.description}</p>
                                    <p className="text-[10px] text-primary mt-1 font-bold">{n.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </TabsContent>
      </Tabs>

      {/* Experience Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl max-w-lg">
            <DialogHeader>
                <DialogTitle className="text-3xl font-black">Add Project Photo</DialogTitle>
                <DialogDescription className="text-lg">Upload your work to get more bookings.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-6">
                <div className="space-y-2">
                    <Label className="font-bold ml-1 text-sm">Project Title</Label>
                    <Input 
                        value={newProject.title} 
                        onChange={e => setNewProject({...newProject, title: e.target.value})} 
                        placeholder="e.g. Master Bedroom Painting" 
                        className="rounded-2xl h-14 bg-muted/30 border-none px-5"
                    />
                </div>
                <input
                    ref={projectFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProjectImageUpload}
                />
                <div 
                    className="border-4 border-dashed rounded-[2rem] p-12 text-center bg-muted/10 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all group"
                    onClick={() => projectFileInputRef.current?.click()}
                >
                    {newProject.imageUrl ? (
                        <div className="space-y-3">
                            <img src={newProject.imageUrl} className="h-32 mx-auto rounded-2xl object-cover shadow-xl" alt="Project preview" />
                            <p className="text-sm font-black text-green-500">Image Uploaded! ✨</p>
                            <p className="text-xs text-muted-foreground">Click to change photo</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">Tap to select work photo</p>
                            <p className="text-xs text-muted-foreground">Max size: 2 MB • JPG, PNG, WEBP</p>
                        </div>
                    )}
                </div>
            </div>
            <DialogFooter>
                <Button className="w-full h-16 rounded-2xl text-xl font-black shadow-xl shadow-primary/20" onClick={addProject}>Save to Portfolio</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
