"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Easing } from "framer-motion"
import { Bell, CheckCheck, Trash2, Loader2, BriefcaseBusiness, CheckCircle2, XCircle, MessageSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const EASE: Easing = [0.22, 1, 0.36, 1]

export type CustomerNotification = {
  id: string
  message: string
  type: "booking_accepted" | "booking_rejected" | "job_completed" | "worker_message" | "new_recommendation" | "info"
  read: boolean
  timestamp: number
  workerName?: string
  bookingId?: string
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return "Just now"
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  return `${Math.floor(diff / 86400)} day ago`
}

function NotifIcon({ type }: { type: CustomerNotification["type"] }) {
  const cls = "w-5 h-5 shrink-0 mt-0.5"
  if (type === "booking_accepted") return <CheckCircle2 className={`${cls} text-green-500`} />
  if (type === "booking_rejected") return <XCircle className={`${cls} text-red-500`} />
  if (type === "job_completed") return <CheckCheck className={`${cls} text-blue-500`} />
  if (type === "worker_message") return <MessageSquare className={`${cls} text-violet-500`} />
  if (type === "new_recommendation") return <Sparkles className={`${cls} text-amber-500`} />
  return <BriefcaseBusiness className={`${cls} text-slate-400`} />
}

const STORAGE_KEY = "customer_notifications"

export default function CustomerNotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<CustomerNotification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const loadFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setNotifications(JSON.parse(raw))
    } catch {}
  }, [])

  const saveToStorage = useCallback((notifs: CustomerNotification[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs))
  }, [])

  // Initial load
  useEffect(() => {
    setLoading(true)
    loadFromStorage()
    setLoading(false)
  }, [loadFromStorage])

  // Listen for cross-tab storage events + Supabase broadcast
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setNotifications(JSON.parse(e.newValue))
        } catch {}
      }
      if (e.key === "latest_event" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue)
          if (data.event === "BOOKING_RESPONSE") {
            const { bookingId, status, workerName } = data
            const notif: CustomerNotification = {
              id: crypto.randomUUID(),
              message: status === "Accepted"
                ? `✅ ${workerName} accepted your booking request`
                : `❌ ${workerName} declined your booking request`,
              type: status === "Accepted" ? "booking_accepted" : "booking_rejected",
              read: false,
              timestamp: Date.now(),
              workerName,
              bookingId,
            }
            setNotifications(prev => {
              const updated = [notif, ...prev]
              saveToStorage(updated)
              return updated
            })
            toast(notif.message, { icon: status === "Accepted" ? "✅" : "❌" })
          }
          if (data.event === "JOB_COMPLETED") {
            const notif: CustomerNotification = {
              id: crypto.randomUUID(),
              message: `🎉 Job completed successfully by ${data.workerName}`,
              type: "job_completed",
              read: false,
              timestamp: Date.now(),
              workerName: data.workerName,
            }
            setNotifications(prev => {
              const updated = [notif, ...prev]
              saveToStorage(updated)
              return updated
            })
            toast.success(`Job completed by ${data.workerName}!`)
          }
        } catch {}
      }
    }

    window.addEventListener("storage", handleStorage)

    // Supabase broadcast
    let channel: any
    try {
      channel = supabase.channel("customer-notif-bell")
      channel
        .on("broadcast", { event: "BOOKING_RESPONSE" }, ({ payload }: any) => {
          const { bookingId, status, workerName } = payload
          const notif: CustomerNotification = {
            id: crypto.randomUUID(),
            message: status === "Accepted"
              ? `✅ ${workerName} accepted your booking request`
              : `❌ ${workerName} declined your booking request`,
            type: status === "Accepted" ? "booking_accepted" : "booking_rejected",
            read: false,
            timestamp: Date.now(),
            workerName,
            bookingId,
          }
          setNotifications(prev => {
            const updated = [notif, ...prev]
            saveToStorage(updated)
            return updated
          })
        })
        .on("broadcast", { event: "JOB_COMPLETED" }, ({ payload }: any) => {
          const notif: CustomerNotification = {
            id: crypto.randomUUID(),
            message: `🎉 Job completed successfully by ${payload.workerName}`,
            type: "job_completed",
            read: false,
            timestamp: Date.now(),
            workerName: payload.workerName,
          }
          setNotifications(prev => {
            const updated = [notif, ...prev]
            saveToStorage(updated)
            return updated
          })
        })
        .subscribe()
    } catch {}

    return () => {
      window.removeEventListener("storage", handleStorage)
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, saveToStorage])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const unread = notifications.filter(n => !n.read).length

  const markRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n)
      saveToStorage(updated)
      return updated
    })
  }

  const markAllRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }))
      saveToStorage(updated)
      return updated
    })
  }

  const clearAll = () => {
    setNotifications([])
    localStorage.removeItem(STORAGE_KEY)
    toast.success("Notifications cleared")
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead() }}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 shadow-sm group"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:text-orange-500 transition-colors" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow"
            >
              {unread > 9 ? "9+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-sm text-slate-800">Notifications</span>
                {unread > 0 && (
                  <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4 rounded-full">
                    {unread}
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                {notifications.length > 0 && (
                  <>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-slate-800 px-2" onClick={markAllRead}>
                      <CheckCheck className="w-3 h-3 mr-1" /> Read all
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-600 px-2" onClick={clearAll}>
                      <Trash2 className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
              {loading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Bell className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">No notifications yet</p>
                  <p className="text-xs text-slate-400 mt-1">Worker updates will appear here</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => markRead(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-orange-50/60 group ${!n.read ? "bg-orange-50/30" : ""}`}
                  >
                    <NotifIcon type={n.type} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-slate-800" : "text-slate-600"}`}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(n.timestamp)}</p>
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
