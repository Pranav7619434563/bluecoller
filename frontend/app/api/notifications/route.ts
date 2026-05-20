import { NextResponse } from "next/server"

// Notification schema:
// { id, senderId, receiverId, type, message, status, createdAt, role }

const globalRef = global as any
if (!globalRef.notificationsStore) {
  globalRef.notificationsStore = new Map<string, any[]>()
}
const store = globalRef.notificationsStore as Map<string, any[]>

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { id, senderId, receiverId, type, message, role } = body

    if (!receiverId || !message) {
      return NextResponse.json({ error: "receiverId and message are required" }, { status: 400 })
    }

    const notification = {
      id: id || crypto.randomUUID(),
      senderId: senderId || "system",
      receiverId,
      type: type || "info",
      message,
      status: "unread",
      createdAt: new Date().toISOString(),
      role: role || "customer",
    }

    const existing = store.get(receiverId) || []
    store.set(receiverId, [notification, ...existing].slice(0, 100)) // cap at 100

    return NextResponse.json({ success: true, notification })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save notification" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const receiverId = searchParams.get("receiverId")

    if (!receiverId) {
      return NextResponse.json({ error: "receiverId query param required" }, { status: 400 })
    }

    const notifications = store.get(receiverId) || []
    return NextResponse.json({ notifications })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { receiverId, notificationId } = await req.json()
    const existing = store.get(receiverId) || []
    const updated = existing.map((n: any) =>
      n.id === notificationId ? { ...n, status: "read" } : n
    )
    store.set(receiverId, updated)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update notification" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const receiverId = searchParams.get("receiverId")
    if (receiverId) store.set(receiverId, [])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
