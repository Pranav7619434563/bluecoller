"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, MessageSquare, Navigation, Phone, Star, CheckCircle2, RefreshCw, ChevronLeft } from "lucide-react"

// Mock Data for demonstration
const ACTIVE_BOOKINGS = [
  {
    id: "BK-10492",
    workerName: "Rajesh Kumar",
    category: "Plumber",
    date: "Today",
    time: "2:00 PM - 3:00 PM",
    status: "On the way",
    amount: "₹1,200",
    location: "Andheri West, Mumbai",
    rating: 4.8
  },
  {
    id: "BK-10493",
    workerName: "Amit Singh",
    category: "Electrician",
    date: "Tomorrow",
    time: "10:00 AM - 12:00 PM",
    status: "Confirmed",
    amount: "₹850",
    location: "Andheri West, Mumbai",
    rating: 4.9
  }
]

const PAST_BOOKINGS = [
  {
    id: "BK-10350",
    workerName: "Suresh Patil",
    category: "Carpenter",
    date: "12 May 2026",
    status: "Completed",
    amount: "₹3,500",
    rating: 5.0
  },
  {
    id: "BK-10211",
    workerName: "Vijay Verma",
    category: "Painter",
    date: "01 May 2026",
    status: "Completed",
    amount: "₹12,000",
    rating: 4.7
  }
]

export default function CustomerBookingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("active")

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
            <p className="text-orange-100 text-lg max-w-xl">Track your active services and manage your past bookings all in one place.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 md:px-8 -mt-12 relative z-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-orange-500/5 border border-slate-100 inline-flex w-full md:w-auto overflow-x-auto">
            <TabsList className="bg-transparent gap-2 w-full justify-start h-auto">
              <TabsTrigger 
                value="active" 
                className="rounded-xl px-8 py-3 text-sm font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Active Bookings ({ACTIVE_BOOKINGS.length})
              </TabsTrigger>
              <TabsTrigger 
                value="past" 
                className="rounded-xl px-8 py-3 text-sm font-bold data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600 data-[state=active]:shadow-sm transition-all"
              >
                Past Bookings ({PAST_BOOKINGS.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {ACTIVE_BOOKINGS.length === 0 ? (
               <Card className="border-dashed border-2 border-slate-200 bg-white/50 backdrop-blur-sm shadow-sm py-20 text-center rounded-[2rem]">
                 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-slate-400" />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-700 mb-2">No Active Bookings</h3>
                 <p className="text-slate-500 max-w-md mx-auto mb-8">You don't have any upcoming services scheduled right now.</p>
                 <Button onClick={() => router.push('/customer/dashboard')} className="rounded-xl h-12 px-8 font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20">
                    Find a Professional
                 </Button>
               </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ACTIVE_BOOKINGS.map((booking) => (
                  <Card key={booking.id} className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300">
                    <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner shrink-0">
                            {booking.workerName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-black text-xl text-slate-800 line-clamp-1">{booking.workerName}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="bg-white border-slate-200 text-slate-600">{booking.category}</Badge>
                              <span className="flex items-center text-xs font-bold text-amber-500">
                                <Star className="w-3 h-3 fill-amber-500 mr-0.5" /> {booking.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`rounded-full px-3 py-1 text-xs font-bold ${booking.status === 'On the way' ? 'bg-green-100 text-green-700 animate-pulse border-none' : 'bg-blue-100 text-blue-700 border-none'}`}>
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-6">
                         <div className="flex items-center gap-2 text-slate-600">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-slate-500" /></div>
                           <span className="text-sm font-semibold">{booking.date}</span>
                         </div>
                         <div className="flex items-center gap-2 text-slate-600">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-slate-500" /></div>
                           <span className="text-sm font-semibold text-nowrap truncate">{booking.time}</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-white space-y-6">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{booking.location}</p>
                          <p className="text-xs text-slate-500 mt-1">Estimated total: <span className="font-bold text-slate-700">{booking.amount}</span></p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4 border-t border-slate-100">
                         {booking.status === 'On the way' && (
                           <Button className="flex-1 rounded-xl h-12 bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-500/20 group-hover:-translate-y-1 transition-transform">
                             <Navigation className="w-4 h-4 mr-2" /> Track
                           </Button>
                         )}
                         <Button variant="outline" className="flex-1 rounded-xl h-12 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 group-hover:-translate-y-1 transition-transform">
                           <MessageSquare className="w-4 h-4 mr-2" /> Message
                         </Button>
                         <Button variant="outline" size="icon" className="rounded-xl h-12 w-12 border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0 group-hover:-translate-y-1 transition-transform">
                           <Phone className="w-4 h-4" />
                         </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-lg text-slate-800">Booking History</h3>
               </div>
               <div className="divide-y divide-slate-100">
                 {PAST_BOOKINGS.map((booking) => (
                   <div key={booking.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6 group">
                     <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-black text-lg">
                         {booking.workerName.charAt(0)}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800 text-lg">{booking.workerName}</h4>
                         <p className="text-sm text-slate-500 font-medium">{booking.category} • {booking.date}</p>
                       </div>
                     </div>
                     
                     <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                       <div className="text-left md:text-right">
                         <p className="font-black text-slate-800">{booking.amount}</p>
                         <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1">
                           <CheckCircle2 className="w-3 h-3" /> {booking.status}
                         </p>
                       </div>
                       <div className="flex gap-2 w-full md:w-auto">
                         <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl h-10 text-xs font-bold border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors">
                           <RefreshCw className="w-3 h-3 mr-2" /> Re-book
                         </Button>
                         <Button variant="secondary" size="sm" className="flex-1 md:flex-none rounded-xl h-10 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                           <Star className="w-3 h-3 mr-2" /> Review
                         </Button>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
