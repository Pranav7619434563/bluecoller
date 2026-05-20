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
import { Bell, User, Camera, FileText, CheckCircle2, Upload, Trash2, LayoutDashboard, Search, Settings, IndianRupee, MapPin, Sparkles, RefreshCw, Plus, Check, Briefcase, Clock, Lock, ShieldCheck, AlertCircle } from "lucide-react"
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
  avatar_url?: string | null
  skills?: string[] | null
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

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

export default function EmployeeDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [isLiveMode, setIsLiveMode] = useState(false)

  // New States
  const [projects, setProjects] = useState<Project[]>([])
  const [newProject, setNewProject] = useState({ title: "", description: "", imageUrl: "" })
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [skills, setSkills] = useState<string[]>(["Punctual", "Hardworking"])
  const [completedJobs, setCompletedJobs] = useState<string[]>(["Bathroom Tap Repair", "Kitchen Sink Installation", "Water Tank Cleaning"])
  
  // AI States
  const [isGeneratingBio, setIsGeneratingBio] = useState(false)
  const [bioOutputs, setBioOutputs] = useState<{ professional: string, friendly: string, seo: string } | null>(null)
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false)

  // Additional profile settings fields
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [workingHours, setWorkingHours] = useState("9:00 AM - 6:00 PM")
  const [availableDays, setAvailableDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"])
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  
  // Security
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Documents & verification settings states
  const [docType, setDocType] = useState("Aadhaar Card")
  const [docIdNumber, setDocIdNumber] = useState("xxxx-xxxx-5634")
  const [docFileName, setDocFileName] = useState("Aadhaar_Front_Verified.jpg")
  const [docFileUrl, setDocFileUrl] = useState<string | null>(null)
  const [docUploadDate, setDocUploadDate] = useState("2026-05-20")
  const [docStatus, setDocStatus] = useState("Verified Pro")
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  
  // Loading/saving/error states
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState(false)
  const [settingsActiveSection, setSettingsActiveSection] = useState<"personal" | "professional" | "availability" | "documents" | "security">("personal")

  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const docFileInputRef = useRef<HTMLInputElement>(null)

  // Hydrate settings on tab change
  useEffect(() => {
    if (activeTab === "settings") {
      const loadSettings = async () => {
        setSettingsLoading(true)
        setSettingsError(false)
        try {
          // Get user auth details for Email
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setEmail(user.email || "")
          }

          // Hydrate from localStorage profileData if it exists
          const cached = localStorage.getItem("profileData")
          if (cached) {
            const cachedData = JSON.parse(cached)
            setPhone(cachedData.phone || "")
            setAddress(cachedData.address || "")
            setWorkingHours(cachedData.workingHours || "9:00 AM - 6:00 PM")
            setAvailableDays(cachedData.availableDays || ["Mon", "Tue", "Wed", "Thu", "Fri"])
            setDocType(cachedData.documentType || "Aadhaar Card")
            setDocIdNumber(cachedData.idNumber || "xxxx-xxxx-5634")
            setDocFileName(cachedData.fileName || "Aadhaar_Front_Verified.jpg")
            setDocFileUrl(cachedData.fileUrl || null)
            setDocUploadDate(cachedData.uploadDate || "2026-05-20")
            setDocStatus(cachedData.verificationStatus || "Verified Pro")
          } else {
            // Provide sensible defaults if not in cache
            setPhone("+91 98765 43210")
            setAddress("Andheri West, Mumbai")
            setDocType("Aadhaar Card")
            setDocIdNumber("xxxx-xxxx-5634")
            setDocFileName("Aadhaar_Front_Verified.jpg")
            setDocFileUrl(null)
            setDocUploadDate("2026-05-20")
            setDocStatus("Verified Pro")
          }
          
          // Fetch the latest profile directly from database to avoid dependency on outer profile state
          if (user) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", user.id)
              .single()

            if (profileData) {
              setProfilePhoto(profileData.avatar_url || null)
              if (profileData.skills) {
                setSkills(profileData.skills)
              }
              // Also sync the outer profile state to match database!
              setProfile(profileData)
            }
          }
          
          // Simulate a beautiful modern loading sequence (once only)
          await new Promise((resolve) => setTimeout(resolve, 800))
        } catch (err) {
          console.error("Failed to load settings:", err)
          setSettingsError(true)
        } finally {
          setSettingsLoading(false)
        }
      }
      loadSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, supabase])

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2 MB.")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setProfilePhoto(base64)
      toast.success("Profile photo updated! Save changes to persist.")
    }
    reader.readAsDataURL(file)
  }

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("Document Upload Action Triggered:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 1. File Type Validation
    const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    const hasValidExtension = /\.(jpg|jpeg|png|pdf)$/i.test(file.name)
    if (!supportedTypes.includes(file.type) && !hasValidExtension) {
      toast.error("Unsupported file type. Please select .jpg, .jpeg, .png, or .pdf")
      console.warn("Upload Failed: Unsupported file type", file.type);
      return
    }

    // 2. File Size Validation (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum allowed size is 10MB.")
      console.warn("Upload Failed: File too large", file.size);
      return
    }

    // 3. Trigger upload animation progress
    setIsUploadingDoc(true)
    setUploadProgress(0)

    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        
        // 4. On Successful Upload: read file
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = reader.result as string
          setDocFileUrl(base64)
          setDocFileName(file.name)
          setDocUploadDate(new Date().toISOString().split('T')[0])
          setDocStatus("Pending") // Change status immediately to Pending
          setIsUploadingDoc(false)
          setUploadProgress(null)
          
          toast.success("Document uploaded successfully! Save changes to persist.")
          console.log("Document Upload Success - Metadata Updated:", {
            fileName: file.name,
            uploadDate: new Date().toISOString().split('T')[0],
            verificationStatus: "Pending"
          });
        }
        reader.readAsDataURL(file)
      }
    }, 150)
  }

  const handleSaveSettings = async () => {
    if (!profile) return
    setSaving(true)
    
    // Get user auth details
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || ""

    const profileData = {
      fullName: profile.full_name,
      phone,
      email,
      city: profile.city,
      address,
      jobCategory: profile.job_category,
      skills,
      experienceYears: profile.experience_years,
      hourlyRate: profile.hourly_rate,
      bio: profile.bio,
      availability: profile.availability,
      workingHours,
      availableDays,
      avatarUrl: profilePhoto,
      // Document Metadata
      documentType: docType,
      idNumber: docIdNumber,
      fileName: docFileName,
      fileUrl: docFileUrl,
      uploadDate: docUploadDate,
      verificationStatus: docStatus
    }

    console.log("Save Changes Action Triggered - Profile & Document Metadata:", {
      userId,
      docType,
      docIdNumber,
      docFileName,
      docUploadDate,
      docStatus
    });

    try {
      // 1. Save to local storage under 'profileData'
      localStorage.setItem("profileData", JSON.stringify(profileData))

      // 2. Save to local storage under 'userData'
      const userData = {
        userId,
        fullName: profile.full_name,
        email,
        phone,
        city: profile.city,
        category: profile.job_category
      }
      localStorage.setItem("userData", JSON.stringify(userData))

      // 3. Save to backend PUT /api/profile/update
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fullName: profile.full_name,
          phone,
          email,
          city: profile.city,
          address,
          jobCategory: profile.job_category,
          skills,
          experienceYears: profile.experience_years,
          hourlyRate: profile.hourly_rate,
          bio: profile.bio,
          availability: profile.availability,
          workingHours,
          availableDays,
          avatarUrl: profilePhoto,
          // Document properties
          documentType: docType,
          idNumber: docIdNumber,
          fileName: docFileName,
          fileUrl: docFileUrl,
          uploadDate: docUploadDate,
          verificationStatus: docStatus
        })
      })

      if (!response.ok) {
        throw new Error("Backend API update returned non-ok status")
      }

      const result = await response.json()
      if (result.error) throw new Error(result.error)

      console.log("Save Changes Success - Database & Cache Synced:", result);
      toast.success("Changes saved successfully ✅", {
        duration: 3000,
        style: { borderRadius: "1rem" }
      })
    } catch (err: any) {
      console.error("Save Changes Action Failed:", err)
      toast.error("Unable to save changes. Please try again.", {
        duration: 3000,
        style: { borderRadius: "1rem" }
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }

    setIsUpdatingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setIsUpdatingPassword(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Password updated successfully!")
      setNewPassword("")
      setConfirmPassword("")
    }
  }
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  // Respond to dynamic booking Accept/Reject
  const respondToBooking = async (bookingId: string, status: "Accepted" | "Rejected") => {
    try {
      // 1. Update localStorage local_bookings status
      const localBookingsStr = localStorage.getItem("local_bookings")
      let customerId = ""
      let customerName = ""
      let bookingCategory = "Services"
      if (localBookingsStr) {
        const allBookings = JSON.parse(localBookingsStr)
        const updatedBookings = allBookings.map((b: any) => {
          if (b.bookingId === bookingId) {
            customerId = b.customerId
            customerName = b.customerName
            bookingCategory = b.category
            return { ...b, status }
          }
          return b
        })
        localStorage.setItem("local_bookings", JSON.stringify(updatedBookings))
      }

      // 2. Update database (optional check)
      try {
        await supabase
          .from("bookings")
          .update({ status })
          .eq("bookingId", bookingId)
      } catch (e) {
        console.warn("DB update skipped or failed", e)
      }

      // 3. Update local state
      setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status } : b))

      // 4. Add system notification
      const workerName = profile?.full_name || "Rahul Kumar"
      const description = status === "Accepted"
        ? `You accepted the booking from ${customerName}. Portal notifications dispatched.`
        : `You rejected the booking request from ${customerName}.`
      
      const newNotif: Notification = {
        id: "notif-" + Date.now(),
        title: status === "Accepted" ? "Booking Accepted" : "Booking Request Rejected",
        description,
        time: "Just now",
        type: "system",
        read: false
      }
      setNotifications(prev => {
        const updated = [newNotif, ...prev]
        localStorage.setItem("local_notifications", JSON.stringify(updated))
        return updated
      })

      // 5. Emit Event for Customer Dashboard to sync instantly in real-time
      const responseEvent = {
        event: "BOOKING_RESPONSE",
        bookingId,
        status,
        workerName,
        timestamp: Date.now()
      }
      localStorage.setItem("latest_event", JSON.stringify(responseEvent))

      // Also broadcast via Supabase channel
      try {
        const channel = supabase.channel("dashboard-sync")
        channel.subscribe((statusSub: string) => {
          if (statusSub === "SUBSCRIBED") {
            channel.send({
              type: "broadcast",
              event: "BOOKING_RESPONSE",
              payload: responseEvent
            })
          }
        })
      } catch (err) {
        console.error("Supabase response broadcast failed", err)
      }

      if (status === "Accepted") {
        toast.success(`Booking Accepted! Customer has been notified.`, {
          description: `Customer will receive: "Your booking has been accepted by ${workerName}"`
        })
      } else {
        toast.info(`Booking Request Rejected.`, {
          description: `Customer will receive: "Your booking request was rejected"`
        })
      }

    } catch (err: any) {
      toast.error("Failed to respond to booking: " + err.message)
    }
  }

  // Mark a job as completed and notify customer in real-time
  const markJobComplete = async (bookingId: string) => {
    try {
      const localBookingsStr = localStorage.getItem("local_bookings")
      let customerName = "Customer"
      if (localBookingsStr) {
        const allBookings = JSON.parse(localBookingsStr)
        const updated = allBookings.map((b: any) => {
          if (b.bookingId === bookingId) {
            customerName = b.customerName
            return { ...b, status: "Completed" }
          }
          return b
        })
        localStorage.setItem("local_bookings", JSON.stringify(updated))
      }

      setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status: "Completed" } : b))

      const workerName = profile?.full_name || "Worker"
      const newNotif: Notification = {
        id: "notif-" + Date.now(),
        title: "Job Marked Complete",
        description: `You marked the job from ${customerName} as completed.`,
        time: "Just now",
        type: "system",
        read: false,
      }
      setNotifications(prev => {
        const updated = [newNotif, ...prev]
        localStorage.setItem("local_notifications", JSON.stringify(updated))
        return updated
      })

      // Fire JOB_COMPLETED event so customer gets notified instantly
      const event = { event: "JOB_COMPLETED", bookingId, workerName, timestamp: Date.now() }
      localStorage.setItem("latest_event", JSON.stringify(event))

      try {
        const ch = supabase.channel("dashboard-sync")
        ch.subscribe((s: string) => {
          if (s === "SUBSCRIBED") {
            ch.send({ type: "broadcast", event: "JOB_COMPLETED", payload: event })
          }
        })
      } catch {}

      toast.success("Job marked as complete! Customer has been notified. 🎉")
    } catch (err: any) {
      toast.error("Failed to mark complete: " + err.message)
    }
  }

  // Load and subscribe to real-time events
  useEffect(() => {
    const loadLocalData = () => {
      if (!profile) return
      
      const localBookingsStr = localStorage.getItem("local_bookings")
      if (localBookingsStr) {
        const parsedBookings = JSON.parse(localBookingsStr)
        // Filter bookings belonging to this worker
        const workerBookings = parsedBookings.filter((b: any) => 
          b.workerId === profile.id || 
          b.workerId === "mock-profile-id" || 
          b.workerId === "worker-1" ||
          (profile.job_category && b.category === profile.job_category)
        )
        setBookings(workerBookings)
      }

      const localNotifsStr = localStorage.getItem("local_notifications")
      if (localNotifsStr) {
        setNotifications(JSON.parse(localNotifsStr))
      } else {
        const defaults: Notification[] = [
          {
            id: "default-1",
            title: "Welcome to Workforce AI Pro",
            description: "Complete your profile details to start receiving job requests in real-time.",
            time: "1 hour ago",
            type: "system",
            read: false
          }
        ]
        setNotifications(defaults)
        localStorage.setItem("local_notifications", JSON.stringify(defaults))
      }
    }

    loadLocalData()

    // Real-Time Storage Event Sync for Local Multi-Tab Bidirectional Communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "latest_event" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          if (data.event === "NEW_JOB_REQUEST") {
            const booking = data.booking
            if (
              profile && (
                booking.workerId === profile.id ||
                booking.workerId === "mock-profile-id" ||
                booking.workerId === "worker-1" ||
                (profile.job_category && booking.category === profile.job_category)
              )
            ) {
              setBookings(prev => {
                if (prev.some(b => b.bookingId === booking.bookingId)) return prev
                return [booking, ...prev]
              })

              const newNotif: Notification = {
                id: "notif-" + Date.now(),
                title: "New Booking Request",
                description: `New booking request from ${booking.customerName} for ${booking.category} on ${booking.date} at ${booking.time}.`,
                time: "Just now",
                type: "job",
                isUrgent: true,
                read: false
              }
              setNotifications(prev => {
                const updated = [newNotif, ...prev]
                localStorage.setItem("local_notifications", JSON.stringify(updated))
                return updated
              })

              toast.success(`New Job Request: ${booking.customerName} requested ${booking.category}!`)
            }
          }
        } catch (err) {
          console.error("Error parsing storage event:", err)
        }
      } else if (e.key === "local_bookings" || e.key === "local_notifications") {
        loadLocalData()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Supabase Realtime Broadcast Channel Listener
    let channel: any = null
    try {
      channel = supabase.channel("dashboard-sync")
      channel
        .on("broadcast", { event: "NEW_JOB_REQUEST" }, ({ payload }: any) => {
          if (
            profile && (
              payload.workerId === profile.id ||
              payload.workerId === "mock-profile-id" ||
              payload.workerId === "worker-1" ||
              (profile.job_category && payload.category === profile.job_category)
            )
          ) {
            setBookings(prev => {
              if (prev.some(b => b.bookingId === payload.bookingId)) return prev
              return [payload, ...prev]
            })

            const newNotif: Notification = {
              id: "notif-" + Date.now(),
              title: "New Booking Request Received (Real-time)",
              description: `New request from ${payload.customerName} for ${payload.category} on ${payload.date} at ${payload.time}.`,
              time: "Just now",
              type: "job",
              isUrgent: true,
              read: false
            }
            setNotifications(prev => {
              const updated = [newNotif, ...prev]
              localStorage.setItem("local_notifications", JSON.stringify(updated))
              return updated
            })

            toast.success(`Real-Time Job Request: ${payload.customerName} requested ${payload.category}!`)
          }
        })
        .subscribe()
    } catch (e) {
      console.error("Supabase channel subscribe failed:", e)
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [profile, supabase])

  useEffect(() => {
    if (profile) {
      setJobsLoading(true)
      const timer = setTimeout(() => {
        setJobsLoading(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [profile])

  // Restore role from URL to preserve context and sync sessions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get("role");
      
      if (urlRole === "worker" || localStorage.getItem("role") === "worker") {
        localStorage.setItem("mock_role", "worker");
        localStorage.setItem("role", "worker");
      }

      // Secure client-side check to prevent direct access/back-button traversal after sign out
      async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser()
        const cachedRole = localStorage.getItem("role")
        if (!user || cachedRole !== "worker") {
          router.replace("/")
        }
      }
      checkAuth()
    }
  }, [router, supabase]);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const cachedRole = localStorage.getItem("role")
        if (!user || cachedRole !== "worker") {
          router.replace("/")
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

          // Synchronize/populate userData cache in localStorage if missing
          const localUserData = localStorage.getItem("userData")
          if (!localUserData) {
            const userData = {
              userId: user.id,
              fullName: displayName,
              email: user.email || "",
              phone: profileData.phone || "",
              city: profileData.city || "",
              category: profileData.job_category || ""
            }
            localStorage.setItem("userData", JSON.stringify(userData))
          }
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

  const projectFileInputRef = useRef<HTMLInputElement>(null)

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

  const acceptJob = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
    toast.success("Job accepted! Contact details sent to your SMS.", {
        description: "Customer: Samarth, Phone: +91 98765 43210"
    })
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
            </div>
            <div>
                <h1 className="text-3xl font-black tracking-tight">{profile.full_name || "Worker Name"}</h1>
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
                                </div>
                            ))
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl" onClick={() => {
                setIsLiveMode(true)
                setActiveTab("settings")
            }}>
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
                <Briefcase className="w-4 h-4" /> Job Alerts
              </TabsTrigger>
              <TabsTrigger value="notifications_tab" className="rounded-xl px-8 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex gap-2 relative">
                <Bell className="w-4 h-4" /> Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full h-4 w-4 font-black">
                    {unreadCount}
                  </span>
                )}
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
            <div className="grid grid-cols-1 gap-8">
                <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-black">Open Job Requests</h3>
                        <Badge className="bg-green-500 animate-pulse">Live Sync</Badge>
                    </div>
                    {jobsLoading ? (
                        <div className="space-y-4">
                            <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading job requests...</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2].map((i) => (
                                    <div key={i} className="p-6 rounded-[1.5rem] border border-slate-200 bg-slate-50/50 space-y-4 animate-pulse">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24 bg-slate-200/60" />
                                                <Skeleton className="h-6 w-48 bg-slate-200/60" />
                                                <Skeleton className="h-4 w-32 bg-slate-200/60" />
                                            </div>
                                            <div className="space-y-2 text-right">
                                                <Skeleton className="h-4 w-20 bg-slate-200/60 ml-auto" />
                                                <Skeleton className="h-4 w-16 bg-slate-200/60 ml-auto" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-12 w-full bg-slate-200/60 rounded-xl" />
                                        <div className="flex gap-4">
                                            <Skeleton className="h-10 w-full bg-slate-200/60 rounded-xl" />
                                            <Skeleton className="h-10 w-full bg-slate-200/60 rounded-xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : bookings.filter(b => b.status === "Pending").length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground animate-in fade-in duration-300">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p className="font-bold text-lg">No pending job requests</p>
                            <p className="text-sm">You're all caught up! New customer requests will appear here instantly.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {bookings.filter(b => b.status === "Pending").map(b => (
                                <div key={b.bookingId} className="p-6 rounded-[1.5rem] border-2 border-primary/10 bg-primary/5 hover:border-primary/30 transition-all space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg">New Job Request</span>
                                            <h4 className="font-black text-xl mt-3">Customer: {b.customerName}</h4>
                                            <p className="text-xs text-muted-foreground mt-1"><b>Location:</b> {b.location}</p>
                                            <p className="text-xs text-muted-foreground"><b>Category:</b> {b.category}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-primary">{b.date}</p>
                                            <p className="text-xs text-muted-foreground">{b.time}</p>
                                        </div>
                                    </div>

                                    {b.matchScore && (
                                        <div className="p-3 bg-white/80 rounded-xl border border-orange-200/50 flex flex-col gap-1 shadow-sm">
                                            <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                                                ✨ AI Match Score: {b.matchScore}%
                                            </span>
                                            <span className="text-[11px] text-muted-foreground italic leading-relaxed">
                                                "{b.matchReason}"
                                            </span>
                                        </div>
                                    )}

                                    {b.job_description && (
                                        <div className="text-xs text-slate-700 leading-relaxed bg-white/60 p-3 rounded-xl border">
                                            <b className="text-slate-800">Job Details:</b> {b.job_description}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button className="flex-1 rounded-xl h-12 font-black bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/10" onClick={() => respondToBooking(b.bookingId, "Accepted")}>
                                            Accept
                                        </Button>
                                        <Button variant="destructive" className="flex-1 rounded-xl h-12 font-black shadow-md shadow-red-500/10" onClick={() => respondToBooking(b.bookingId, "Rejected")}>
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Accepted Bookings — Mark Complete */}
                {bookings.filter(b => b.status === "Accepted").length > 0 && (
                  <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black">Active Jobs</h3>
                      <Badge className="bg-blue-500">In Progress</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {bookings.filter(b => b.status === "Accepted").map(b => (
                        <div key={b.bookingId} className="p-6 rounded-[1.5rem] border-2 border-blue-100 bg-blue-50/40 hover:border-blue-300 transition-all space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg">Active</span>
                              <h4 className="font-black text-xl mt-3">Customer: {b.customerName}</h4>
                              <p className="text-xs text-muted-foreground mt-1"><b>Category:</b> {b.category}</p>
                              <p className="text-xs text-muted-foreground"><b>Date:</b> {b.date}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-black text-blue-600">{b.time}</p>
                            </div>
                          </div>
                          <Button
                            className="w-full rounded-xl h-12 font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                            onClick={() => markJobComplete(b.bookingId)}
                          >
                            ✅ Mark Job as Complete
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
            </div>
        </TabsContent>

        <TabsContent value="notifications_tab">
            <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black">Worker Notifications</h3>
                    {notifications.some(n => !n.read) && (
                        <Button variant="ghost" size="sm" className="font-bold text-xs" onClick={() => {
                            const updated = notifications.map(n => ({ ...n, read: true }))
                            setNotifications(updated)
                            localStorage.setItem("local_notifications", JSON.stringify(updated))
                            toast.success("All notifications marked as read")
                        }}>
                            Mark all as read
                        </Button>
                    )}
                </div>
                {notifications.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold">All clear!</p>
                        <p className="text-sm">You have no recent notifications.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map(n => (
                            <div key={n.id} className={`flex gap-4 p-5 rounded-2xl border transition-all ${!n.read ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-transparent"}`}>
                                <div className="bg-primary/20 p-3 rounded-xl h-fit shrink-0">
                                    <Bell className="w-5 h-5 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-slate-800">{n.title}</p>
                                        {!n.read && <Badge className="bg-red-500 px-1.5 py-0 text-[8px] font-black h-3.5 border-none">NEW</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{n.description}</p>
                                    <p className="text-[10px] text-primary font-bold mt-1">{n.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </TabsContent>

        <TabsContent value="settings">
          {settingsLoading ? (
            <Card className="border-none shadow-xl rounded-[2rem] p-12 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
              <RefreshCw className="w-12 h-12 text-primary animate-spin" />
              <p className="text-xl font-bold tracking-wide animate-pulse">Loading profile settings...</p>
            </Card>
          ) : settingsError ? (
            <Card className="border-none shadow-xl rounded-[2rem] p-12 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-xl font-bold tracking-wide text-red-500">Unable to load profile settings</p>
              <Button onClick={() => setActiveTab("notifications")} variant="outline" className="rounded-xl">Go Back</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Column: Sidebar Menu */}
              <Card className="border-none shadow-xl rounded-[2rem] p-6 lg:col-span-1 h-fit bg-card/65 backdrop-blur-md">
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSettingsActiveSection("personal")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${settingsActiveSection === "personal" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted/50"}`}
                  >
                    <User className="w-4 h-4" /> Personal Info
                  </button>
                  <button
                    onClick={() => setSettingsActiveSection("professional")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${settingsActiveSection === "professional" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted/50"}`}
                  >
                    <Briefcase className="w-4 h-4" /> Professional details
                  </button>
                  <button
                    onClick={() => setSettingsActiveSection("availability")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${settingsActiveSection === "availability" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted/50"}`}
                  >
                    <Clock className="w-4 h-4" /> Availability
                  </button>
                  <button
                    onClick={() => setSettingsActiveSection("documents")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${settingsActiveSection === "documents" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted/50"}`}
                  >
                    <FileText className="w-4 h-4" /> Documents & verification
                  </button>
                  <button
                    onClick={() => setSettingsActiveSection("security")}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${settingsActiveSection === "security" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted/50"}`}
                  >
                    <Lock className="w-4 h-4" /> Security & account
                  </button>
                </div>
              </Card>

              {/* Right Column: Active Card View */}
              <div className="lg:col-span-3 space-y-8">
                {settingsActiveSection === "personal" && (
                  <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
                    <h3 className="text-2xl font-black">Personal Information</h3>
                    <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b">
                      <div className="relative group cursor-pointer" onClick={() => profilePhotoInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-muted flex items-center justify-center bg-muted/30">
                          {profilePhoto ? (
                            <img src={profilePhoto} className="w-full h-full object-cover" alt="Profile avatar" />
                          ) : (
                            <User className="w-12 h-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <input
                          ref={profilePhotoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoUpload}
                        />
                      </div>
                      <div className="text-center md:text-left space-y-1">
                        <h4 className="font-bold text-lg">Profile Photo</h4>
                        <p className="text-xs text-muted-foreground">Upload a professional, clean portrait picture. Max 2MB.</p>
                        {profilePhoto && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-red-500 font-bold" onClick={() => setProfilePhoto(null)}>
                            Remove Photo
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                        <Input
                          value={profile.full_name || ""}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          placeholder="Rajesh Kumar"
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</Label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                        <Input
                          value={email}
                          disabled
                          placeholder="rajesh@workforce.ai"
                          className="rounded-xl h-12 bg-muted/20 opacity-70 cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">City / District</Label>
                        <Input
                          value={profile.city || ""}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          placeholder="Mumbai"
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Work Address</Label>
                        <Input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Flat 304, Link Heights, Andheri West, Mumbai, Maharashtra"
                          className="rounded-xl h-12"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {settingsActiveSection === "professional" && (
                  <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
                    <h3 className="text-2xl font-black">Professional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Job Category</Label>
                        <Select value={profile.job_category || ""} onValueChange={(v) => setProfile({ ...profile, job_category: v })}>
                          <SelectTrigger className="rounded-xl h-12">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Experience (Years)</Label>
                        <Input
                          type="number"
                          value={profile.experience_years || ""}
                          onChange={(e) => setProfile({ ...profile, experience_years: Number(e.target.value) })}
                          placeholder="5"
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Hourly Price (₹)</Label>
                        <Input
                          type="number"
                          value={profile.hourly_rate || ""}
                          onChange={(e) => setProfile({ ...profile, hourly_rate: Number(e.target.value) })}
                          placeholder="400"
                          className="rounded-xl h-12"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Work Bio / Description</Label>
                        <Textarea
                          rows={4}
                          value={profile.bio || ""}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          placeholder="Experienced electrician specializing in luxury house wiring, emergency repairs, and smart appliance setups..."
                          className="rounded-2xl py-3 px-4"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Skills Tag Capsules</Label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {skills.map((skill) => (
                            <Badge key={skill} className="bg-slate-800 text-white rounded-full px-4 py-1.5 flex items-center gap-2 group text-xs font-semibold">
                              {skill}
                              <button
                                type="button"
                                onClick={() => setSkills(skills.filter((s) => s !== skill))}
                                className="opacity-60 group-hover:opacity-100 text-sm font-black"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a new skill tag..."
                            className="rounded-xl h-11 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                const val = e.currentTarget.value.trim()
                                if (val && !skills.includes(val)) {
                                  setSkills([...skills, val])
                                  e.currentTarget.value = ""
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl h-11"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement
                              const val = input.value.trim()
                              if (val && !skills.includes(val)) {
                                  setSkills([...skills, val])
                                  input.value = ""
                              }
                            }}
                          >
                            Add Tag
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {settingsActiveSection === "availability" && (
                  <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
                    <h3 className="text-2xl font-black">Availability Details</h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Working Hours</Label>
                        <Input
                          value={workingHours}
                          onChange={(e) => setWorkingHours(e.target.value)}
                          placeholder="e.g. 9:00 AM - 6:00 PM"
                          className="rounded-xl h-12"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Available Days</Label>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                            const isSelected = availableDays.includes(day)
                            return (
                              <Badge
                                key={day}
                                onClick={() => {
                                  if (isSelected) {
                                    setAvailableDays(availableDays.filter((d) => d !== day))
                                  } else {
                                    setAvailableDays([...availableDays, day])
                                  }
                                }}
                                className={`rounded-full px-5 py-2 cursor-pointer transition-all border text-xs font-bold ${isSelected ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20" : "bg-white text-muted-foreground border-muted-foreground/20 hover:bg-muted"}`}
                              >
                                {day}
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {settingsActiveSection === "documents" && (
                  <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6 animate-in fade-in duration-300">
                    <h3 className="text-2xl font-black">Verification & Documents</h3>
                    
                    {/* Dynamic Status Box */}
                    {docStatus === "Verified Pro" ? (
                      <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 p-4 rounded-2xl transition-all duration-300">
                        <div>
                          <h4 className="font-bold text-green-700">Verification Status</h4>
                          <p className="text-xs text-green-600/80">Your identity details are fully secured and verified by AI.</p>
                        </div>
                        <Badge className="bg-green-500 hover:bg-green-600">Verified Pro</Badge>
                      </div>
                    ) : docStatus === "Pending" ? (
                      <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl animate-pulse transition-all duration-300">
                        <div>
                          <h4 className="font-bold text-amber-700">Verification Status</h4>
                          <p className="text-xs text-amber-600/80">Your document has been uploaded and is pending verification by AI.</p>
                        </div>
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Pending</Badge>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 p-4 rounded-2xl transition-all duration-300">
                        <div>
                          <h4 className="font-bold text-red-700">Verification Status</h4>
                          <p className="text-xs text-red-600/80">Please upload a valid document to verify your identity.</p>
                        </div>
                        <Badge className="bg-red-500 hover:bg-red-600">Unverified</Badge>
                      </div>
                    )}

                    <div className="space-y-4">
                      <Label className="text-sm font-bold">Uploaded Document Details</Label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Document Type</Label>
                          <Select value={docType} onValueChange={(v) => {
                            setDocType(v);
                            console.log("Document Type Changed:", v);
                          }}>
                            <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-none px-4">
                              <SelectValue placeholder="Select Document Type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-xl">
                              <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                              <SelectItem value="PAN Card">PAN Card</SelectItem>
                              <SelectItem value="Driving License">Driving License</SelectItem>
                              <SelectItem value="Passport">Passport</SelectItem>
                              <SelectItem value="Voter ID">Voter ID</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">ID Number / Reference</Label>
                          <Input
                            value={docIdNumber}
                            onChange={(e) => {
                              setDocIdNumber(e.target.value);
                              console.log("ID Number Changed:", e.target.value);
                            }}
                            placeholder="e.g. xxxx-xxxx-5634"
                            className="rounded-xl h-12 bg-muted/20 border-none px-4"
                          />
                        </div>
                      </div>
                      
                      {/* Hidden Input file selector */}
                      <input
                        ref={docFileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={handleDocUpload}
                        disabled={isUploadingDoc}
                      />

                      {/* Dynamic Upload Card & Preview */}
                      <div 
                        className={`relative group overflow-hidden border-4 border-dashed rounded-[2rem] p-6 text-center bg-muted/5 transition-all cursor-pointer min-h-[220px] flex items-center justify-center ${isUploadingDoc ? 'border-primary/40 bg-primary/5' : 'hover:bg-primary/5 hover:border-primary/30'}`}
                        onClick={() => !isUploadingDoc && docFileInputRef.current?.click()}
                      >
                        {isUploadingDoc ? (
                          // 1. Loading and Progress Spinner
                          <div className="space-y-4 animate-in fade-in duration-300 flex flex-col items-center">
                            <div className="relative w-16 h-16 flex items-center justify-center">
                              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                            </div>
                            <div>
                              <p className="font-bold text-lg">Uploading Document...</p>
                              <p className="text-sm font-black text-primary mt-1">{uploadProgress}% Complete</p>
                            </div>
                            {/* Real progress track bar */}
                            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden mt-2 border">
                              <div 
                                className="h-full bg-primary transition-all duration-150 ease-out" 
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        ) : docFileUrl ? (
                          // 2. Base64 Uploaded File is present (Dynamic Upload)
                          <div className="w-full space-y-4 relative group">
                            {docFileName.toLowerCase().endsWith('.pdf') ? (
                              <div className="space-y-3 py-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                  <FileText className="w-8 h-8 text-primary" />
                                </div>
                                <p className="font-bold text-slate-800">{docFileName}</p>
                                <p className="text-xs text-muted-foreground">Uploaded & Verified on {docUploadDate}</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="relative max-w-sm mx-auto rounded-2xl overflow-hidden shadow-md border-4 border-white bg-white group/preview">
                                  <img 
                                    src={docFileUrl} 
                                    className="max-h-48 mx-auto object-contain rounded-xl hover:scale-105 transition-transform duration-300" 
                                    alt="Uploaded ID preview" 
                                  />
                                </div>
                                <p className="font-bold text-slate-800">{docFileName}</p>
                                <p className="text-xs text-muted-foreground">Uploaded & Verified on {docUploadDate}</p>
                              </div>
                            )}
                            
                            {/* Hover Edit Overlay */}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center z-10">
                              <Button 
                                type="button" 
                                variant="secondary" 
                                className="rounded-xl font-bold bg-white text-primary hover:bg-slate-100 shadow-md animate-in zoom-in duration-200"
                              >
                                Replace File
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // 3. Fallback View: Default Hardcoded File Details in state
                          <div className="w-full space-y-4 relative group">
                            {docFileName.toLowerCase().endsWith('.pdf') ? (
                              <div className="space-y-3 py-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                  <FileText className="w-8 h-8 text-primary" />
                                </div>
                                <p className="font-bold text-slate-800">{docFileName}</p>
                                <p className="text-xs text-muted-foreground">Uploaded & Verified on {docUploadDate}</p>
                              </div>
                            ) : (
                              <div className="space-y-3 py-4 animate-in fade-in duration-300">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                                  <FileText className="w-8 h-8 text-primary" />
                                </div>
                                <p className="font-bold text-slate-800">{docFileName}</p>
                                <p className="text-xs text-muted-foreground">Uploaded & Verified on {docUploadDate}</p>
                              </div>
                            )}

                            {/* Hover Edit Overlay */}
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center z-10">
                              <Button 
                                type="button" 
                                variant="secondary" 
                                className="rounded-xl font-bold bg-white text-primary hover:bg-slate-100 shadow-md animate-in zoom-in duration-200"
                              >
                                Upload New File
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {settingsActiveSection === "security" && (
                  <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
                    <h3 className="text-2xl font-black">Security & Account</h3>
                    
                    <form onSubmit={handleUpdatePassword} className="space-y-4 pb-6 border-b">
                      <h4 className="font-bold text-lg">Change Password</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">New Password</Label>
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="rounded-xl h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Confirm New Password</Label>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="rounded-xl h-12"
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={isUpdatingPassword} className="rounded-xl h-12 px-6 font-bold shadow-md shadow-primary/10">
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </Button>
                    </form>

                    <div className="space-y-4 pt-2">
                      <h4 className="font-bold text-lg text-red-500">Danger Zone</h4>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-red-500/10 border border-red-500/20 rounded-2xl gap-4">
                        <div>
                          <h5 className="font-bold text-red-700">Logout from Account</h5>
                          <p className="text-xs text-red-600/80">Sign out of your active session on this device.</p>
                        </div>
                        <Button variant="destructive" className="rounded-xl font-bold h-12 px-6" onClick={handleSignOut}>
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Control Action Buttons */}
                <div className="flex gap-4 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    className="rounded-xl h-12 px-8 font-bold"
                    onClick={() => {
                      // Revert locally cached copy
                      const cached = localStorage.getItem("profileData")
                      if (cached) {
                        const cachedData = JSON.parse(cached)
                        setPhone(cachedData.phone || "")
                        setAddress(cachedData.address || "")
                        setWorkingHours(cachedData.workingHours || "9:00 AM - 6:00 PM")
                        setAvailableDays(cachedData.availableDays || ["Mon", "Tue", "Wed", "Thu", "Fri"])
                      }
                      setActiveTab("notifications")
                      toast.info("Changes canceled.")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-xl h-12 px-8 font-black shadow-lg shadow-primary/20"
                    onClick={handleSaveSettings}
                    disabled={saving}
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
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
