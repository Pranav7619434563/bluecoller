"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ChatWindow from "@/components/messaging/ChatWindow"
import { Skeleton } from "@/components/ui/skeleton"

type Conversation = {
  id: string
  customer_id: string
  employee_id: string
  last_message: string | null
  profiles_customer: { full_name: string } | null
  profiles_worker: { full_name: string } | null
}

export default function MessagesPage() {
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadConversations() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()
      
      if (!profile) return
      setProfileId(profile.id)

      const { data } = await supabase
        .from("conversations")
        .select(`
          id, customer_id, employee_id, last_message,
          profiles_customer:customer_id(full_name),
          profiles_worker:employee_id(full_name)
        `)
        .or(`customer_id.eq.${profile.id},employee_id.eq.${profile.id}`)
        .order("updated_at", { ascending: false })

      if (data) setConversations(data as any)
      setLoading(false)
    }
    loadConversations()
  }, [supabase])

  if (loading) return <div className="container p-8"><Skeleton className="h-96 w-full" /></div>

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-[600px] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-lg">Recent Chats</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              conversations.map((conv) => {
                const otherName = conv.customer_id === profileId 
                  ? conv.profiles_worker?.full_name 
                  : conv.profiles_customer?.full_name
                
                return (
                  <div 
                    key={conv.id}
                    onClick={() => setSelectedId(conv.id)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted transition-colors ${selectedId === conv.id ? "bg-muted border-l-4 border-l-primary" : ""}`}
                  >
                    <p className="font-bold">{otherName}</p>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message || "No messages yet"}</p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          {selectedId ? (
            <ChatWindow conversationId={selectedId} currentProfileId={profileId!} />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <p className="text-muted-foreground">Select a conversation to start chatting</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
