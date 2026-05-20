"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, MessageSquare, Navigation, Phone, Star, CheckCircle2, RefreshCw, ChevronLeft, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function CustomerBookingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("all")
  const [bookings, setBookings] = useState<any[]>([])

  // Load and subscribe to real-time events
  useEffect(() => {
    const loadBookings = () => {
      const localBookingsStr = localStorage.getItem("local_bookings")
      if (localBookingsStr) {
        setBookings(JSON.parse(localBookingsStr))
      }
    }

    loadBookings()

    // Listen to storage events from other tabs (multi-tab testing)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "latest_event" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          if (data.event === "BOOKING_RESPONSE") {
            const { bookingId, status, workerName } = data
            setBookings(prev => prev.map(b => b.bookingId === bookingId ? { ...b, status } : b))
            
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
      } else if (e.key === "local_bookings" || e.key === "local_notifications") {
        loadBookings()
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
      console.error("Supabase broadcast channel failed in bookings page:", err)
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Premium Header Background */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-400 text-white pt-12 pb-24 px-4 md:px-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-orange-300 rounded-full blur-3xl opacity-50"></div>
        </div>
        
        <div className="container mx-auto max-w-5xl relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4 mb-2" onClick={() => router.push('/customer/dashboard')}>
              <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
            </Button>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">My Bookings</h1>
            <p className="text-orange-100 text-lg max-w-xl">Track your active services and manage your past bookings all in one place with real-time sync.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 md:px-8 -mt-12 relative z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-orange-500/5 border border-slate-100 inline-flex w-full overflow-x-auto">
            <TabsList className="bg-transparent gap-2 w-full justify-start h-auto">
              <TabsTrigger 
                value="all" 
                className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                All Bookings ({bookings.length})
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Pending ({bookings.filter(b => b.status === "Pending").length})
              </TabsTrigger>
              <TabsTrigger 
                value="accepted" 
                className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Accepted ({bookings.filter(b => b.status === "Accepted").length})
              </TabsTrigger>
              <TabsTrigger 
                value="rejected" 
                className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Rejected ({bookings.filter(b => b.status === "Rejected").length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="rounded-xl px-6 py-3 text-sm font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Completed ({bookings.filter(b => b.status === "Completed").length})
              </TabsTrigger>
            </TabsList>
          </div>

          {["all", "pending", "accepted", "rejected", "completed"].map((tabName) => {
            const filteredBookings = tabName === "all" 
              ? bookings 
              : bookings.filter(b => b.status.toLowerCase() === tabName)

            return (
              <TabsContent key={tabName} value={tabName} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
                {filteredBookings.length === 0 ? (
                  <Card className="border-dashed border-2 border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm py-20 text-center rounded-[2rem]">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calendar className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-700 mb-2">No Bookings Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-8">No service requests match this filter.</p>
                    <Button onClick={() => router.push('/customer/dashboard')} className="rounded-xl h-12 px-8 font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20">
                      Find a Professional
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredBookings.map((booking) => (
                      <Card key={booking.bookingId} className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between bg-white">
                        <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-100 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                                {booking.workerName.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-black text-xl text-slate-800 line-clamp-1">{booking.workerName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600">{booking.category}</Badge>
                                  <span className="flex items-center text-xs font-bold text-amber-500">
                                    <Star className="w-3 h-3 fill-amber-500 mr-0.5" /> {booking.rating || "4.8"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Badge className={`rounded-full px-3 py-1 text-xs font-bold border-none ${
                              booking.status === "Pending" ? "bg-amber-100 text-amber-700" :
                              booking.status === "Accepted" ? "bg-green-100 text-green-700" :
                              booking.status === "Rejected" ? "bg-red-100 text-red-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {booking.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 pt-2">
                             <div className="flex items-center gap-2 text-slate-600">
                               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-slate-500" /></div>
                               <span className="text-sm font-semibold">{booking.date}</span>
                             </div>
                             <div className="flex items-center gap-2 text-slate-600">
                               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-slate-500" /></div>
                               <span className="text-sm font-semibold truncate">{booking.time}</span>
                             </div>
                          </div>
                        </div>
                        
                        <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{booking.location}</p>
                                {booking.address && <p className="text-xs text-slate-500 mt-1"><b>Address:</b> {booking.address}</p>}
                              </div>
                            </div>

                            {booking.job_description && (
                              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border leading-relaxed italic">
                                <b>Job details:</b> {booking.job_description}
                              </div>
                            )}

                            {booking.matchScore && (
                              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50/50 rounded-xl border border-orange-200/50 flex flex-col gap-1.5">
                                <span className="text-xs font-black text-orange-600 flex items-center gap-1">
                                  ✨ AI Match Score: {booking.matchScore}%
                                </span>
                                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                                  "{booking.matchReason}"
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-3 pt-6 border-t border-slate-100">
                             {booking.status === 'Accepted' && (
                               <Button className="flex-1 rounded-xl h-12 bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-500/20">
                                 Message Worker
                               </Button>
                             )}
                             {booking.status === 'Pending' && (
                               <div className="text-center text-xs font-bold text-amber-600 w-full py-3 bg-amber-50 border border-amber-200/50 rounded-xl animate-pulse">
                                 Awaiting worker response...
                               </div>
                             )}
                             {booking.status === 'Rejected' && (
                               <Button variant="outline" className="flex-1 rounded-xl h-12 border-slate-200 text-slate-600 font-bold hover:bg-slate-50" onClick={() => router.push('/customer/dashboard')}>
                                 Find Another Professional
                               </Button>
                             )}
                             {booking.status === 'Completed' && (
                               <>
                                 <Button variant="outline" className="flex-1 rounded-xl h-12 border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                                   <RefreshCw className="w-4 h-4 mr-2" /> Re-book
                                 </Button>
                                 <Button variant="secondary" className="flex-1 rounded-xl h-12 bg-slate-100 text-slate-700 font-bold hover:bg-slate-200">
                                   Review
                                 </Button>
                               </>
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
      </div>
    </div>
  )
}
