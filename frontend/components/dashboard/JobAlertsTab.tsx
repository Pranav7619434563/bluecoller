"use client"

import { useEffect, useState } from "react"
import { getNotificationsFor, markNotificationRead, pushSharedNotification } from "@/lib/notifications"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Bell, CheckCircle2, IndianRupee, MapPin } from "lucide-react"

type Notification = {
  id: string
  title: string
  description: string
  time: string
  type: 'job' | 'system'
  isUrgent?: boolean
  read: boolean
}

export default function JobAlertsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const syncNotifications = () => {
    const workerNotifs = getNotificationsFor('worker');
    const mapped: Notification[] = workerNotifs.map((n: any) => ({
      id: n.id,
      title: n.title,
      description: n.workerMessage || n.message,
      time: n.time,
      type: n.type || 'system',
      isUrgent: n.isUrgent || false,
      read: n.read
    }));
    setNotifications(mapped);
  }

  useEffect(() => {
    syncNotifications()
    const interval = setInterval(syncNotifications, 3000)
    window.addEventListener('storage', syncNotifications)
    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', syncNotifications)
    }
  }, [])

  const acceptJob = (id: string) => {
    const notif = notifications.find(n => n.id === id);
    const title = notif ? notif.title : "Home Service Job";

    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      markNotificationRead(idx, 'worker');
    }

    pushSharedNotification({
      id: `accept_${id}_${Date.now()}`,
      icon: '🔧',
      title: 'Worker Accepted Your Job',
      message: `Rajesh Kumar accepted: ${title} in Bandra West. ETA: 20 mins.`,
      time: new Date().toLocaleTimeString('en-IN'),
      forWorker: true,
      forCustomer: true,
      workerMessage: `You accepted: ${title} — Bandra West • ₹1200`,
      customerMessage: `Rajesh Kumar is on his way for: ${title} in Bandra West`,
      read: false
    });

    toast.success("Job accepted! Contact details sent to your SMS.", {
      description: "Customer: Samarth, Phone: +91 98765 43210"
    })
    syncNotifications()
  }

  const jobs = notifications.filter(n => n.type === 'job')
  const system = notifications.filter(n => n.type === 'system')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="border-none shadow-xl rounded-[2rem] p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-black">Open Job Requests</h3>
          <Badge className="bg-green-500 animate-pulse">Live</Badge>
        </div>
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30 animate-bounce" />
            <p className="text-sm font-semibold">Waiting for new job requests...</p>
            <p className="text-xs mt-1">Make sure you are ONLINE in settings.</p>
          </div>
        ) : (
          jobs.map(n => (
            <div key={n.id} className="p-6 rounded-[1.5rem] border-2 border-primary/10 bg-primary/5 hover:border-primary/30 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-black text-lg">{n.title}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {n.time} • Andheri, Mumbai
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-primary flex items-center justify-end"><IndianRupee className="w-4 h-4" />1,200</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Est. Earning</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{n.description}</p>
              <div className="flex gap-3">
                <Button className="flex-1 rounded-xl h-12 font-black shadow-lg shadow-primary/20" onClick={() => acceptJob(n.id)}>Accept Job Now</Button>
                <Button variant="outline" className="rounded-xl h-12">Details</Button>
              </div>
            </div>
          ))
        )}
      </Card>
      
      <Card className="border-none shadow-xl rounded-[2rem] p-8">
        <h3 className="text-2xl font-black mb-6">Recent Activity</h3>
        {system.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No recent activity logs.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {system.map(n => (
              <div key={n.id} className="flex gap-4 p-4 rounded-2xl bg-muted/30">
                <div className="bg-primary/20 p-3 rounded-xl h-fit"><CheckCircle2 className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="font-bold text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.description}</p>
                  <p className="text-[10px] text-primary mt-2 font-bold">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
