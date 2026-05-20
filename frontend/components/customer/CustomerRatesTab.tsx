"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Sparkles, RefreshCw, TrendingUp, MessageSquareQuote,
  Copy, Check, Zap, IndianRupee, Info, BarChart3
} from "lucide-react"
import { CATEGORIES, INDIAN_CITIES } from "@/lib/constants"

// Static competitor ranges per category (₹/hr)
const COMPETITOR_RANGES: Record<string, { low: number; high: number }> = {
  Plumber:          { low: 300, high: 700 },
  Electrician:      { low: 350, high: 750 },
  Carpenter:        { low: 400, high: 850 },
  Painter:          { low: 250, high: 600 },
  Welder:           { low: 400, high: 900 },
  Mason:            { low: 350, high: 700 },
  "AC Technician":  { low: 500, high: 1200 },
  "Home Cleaner":   { low: 200, high: 450 },
  Driver:           { low: 300, high: 600 },
  "Security Guard": { low: 250, high: 500 },
  Cook:             { low: 300, high: 700 },
  Gardener:         { low: 200, high: 450 },
  "Pest Control":   { low: 400, high: 900 },
  Helper:           { low: 150, high: 350 },
  Fabricator:       { low: 450, high: 950 },
  "Tile Worker":    { low: 350, high: 750 },
  Roofer:           { low: 400, high: 800 },
  "HVAC Technician":{ low: 500, high: 1100 },
}

const TONES = [
  { id: "firm",     label: "Firm",     emoji: "💪", desc: "Professional and strict on budget", color: "bg-red-50 border-red-200 text-red-700" },
  { id: "friendly", label: "Friendly", emoji: "😊", desc: "Warm and approachable",        color: "bg-green-50 border-green-200 text-green-700" },
  { id: "flexible", label: "Flexible", emoji: "🤝", desc: "Open to negotiation",          color: "bg-blue-50 border-blue-200 text-blue-700" },
]

export function CustomerRatesTab() {

  // ── Feature 1: AI Dynamic Pricing ──────────────────────────────────────────
  const [pricingCity, setPricingCity]           = useState("Mumbai")
  const [pricingCategory, setPricingCategory]   = useState("Plumber")
  const [urgency, setUrgency]                   = useState<"normal" | "urgent">("normal")
  const [rating, setRating]                     = useState(4.0)
  const [aiRate, setAiRate]                     = useState<number | null>(null)
  const [aiReason, setAiReason]                 = useState("")
  const [fetchingRate, setFetchingRate]         = useState(false)

  // ── Feature 2: AI Negotiation Assistant ────────────────────────────────────
  const [workerMessage, setWorkerMessage]       = useState("")
  const [tone, setTone]                         = useState<"firm" | "friendly" | "flexible">("friendly")
  const [negotiationResult, setNegotiationResult] = useState<{ amount: number; reply: string } | null>(null)
  const [fetchingReplies, setFetchingReplies]   = useState(false)
  const [copied, setCopied]                     = useState(false)

  const competitorRange = COMPETITOR_RANGES[pricingCategory] ?? { low: 300, high: 700 }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  async function callGroq(prompt: string): Promise<string> {
    const res = await fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", prompt }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return (data.response as string) ?? ""
  }

  // ── Feature 1 handler ───────────────────────────────────────────────────────
  async function getAIRate() {
    setFetchingRate(true)
    setAiRate(null)
    setAiReason("")
    try {
      const prompt = `You are a pricing expert advising a customer hiring a blue-collar worker in India.
Given:
- City: ${pricingCity}
- Service category: ${pricingCategory}
- Urgency: ${urgency}
- Worker review rating: ${rating}/5

Suggest a fair and optimal hourly rate in Indian Rupees (INR) for the customer to pay this worker.
Return ONLY a valid JSON object with exactly two keys:
{"rate": <number>, "reason": "<one sentence explanation>"}
No markdown, no extra text.`

      const text = await callGroq(prompt)
      const match = text.match(/\{[\s\S]*?\}/)
      if (!match) throw new Error("Could not parse AI response")
      const parsed = JSON.parse(match[0])
      if (!parsed.rate || !parsed.reason) throw new Error("Invalid response structure")
      setAiRate(Number(parsed.rate))
      setAiReason(parsed.reason)
      toast.success("AI rate estimate ready!")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to get AI rate. Try again.")
    } finally {
      setFetchingRate(false)
    }
  }

  // ── Feature 2 handler ───────────────────────────────────────────────────────
  async function generateReplies() {
    if (!workerMessage.trim()) { toast.error("Paste the worker's message first"); return }
    setFetchingReplies(true)
    setNegotiationResult(null)
    try {
      const toneInstructions = {
        firm:     "Be polite but firm. The customer's budget is fixed. Propose a lower counter amount.",
        friendly: "Be warm and respectful. Acknowledge the worker's price and suggest a small discount.",
        flexible: "Be open. Propose a fair middle-ground amount that works for both parties.",
      }[tone]

      const prompt = `You are a customer in India trying to hire a service worker.
The worker sent you this price quote or message: "${workerMessage}"
Tone instruction: ${toneInstructions}

Analyze the worker's quoted price. Propose a single best counter-offer amount (as a number in INR) and write ONE short professional reply under 25 words.
Return ONLY a valid JSON object:
{"amount": <number>, "reply": "<counter-offer reply>"}
No markdown, no extra text.`

      const text = await callGroq(prompt)
      const match = text.match(/\{[\s\S]*?\}/)
      if (!match) throw new Error("Could not parse response")
      const parsed = JSON.parse(match[0])
      if (!parsed.amount || !parsed.reply) throw new Error("Invalid response structure")
      setNegotiationResult({ amount: Number(parsed.amount), reply: parsed.reply })
      toast.success("Counter-offer generated!")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to generate counter-offer. Try again.")
    } finally {
      setFetchingReplies(false)
    }
  }

  async function copyReply(text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── FEATURE 1: AI Dynamic Pricing ──────────────────────────────────── */}
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50/60 pb-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/15 p-3 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Fair Pricing Estimator</CardTitle>
              <CardDescription>Get an estimate of what you should pay based on city, service & worker rating</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">

          {/* Inputs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* City */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City</Label>
              <Select value={pricingCity} onValueChange={setPricingCity}>
                <SelectTrigger className="rounded-2xl h-12 bg-muted/20 border-none px-4 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-64">
                  {INDIAN_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Service */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Service</Label>
              <Select value={pricingCategory} onValueChange={setPricingCategory}>
                <SelectTrigger className="rounded-2xl h-12 bg-muted/20 border-none px-4 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-64">
                  {CATEGORIES.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Urgency</Label>
              <div className="flex gap-2 h-12">
                {(["normal", "urgent"] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setUrgency(u)}
                    className={`flex-1 rounded-2xl text-sm font-bold border-2 transition-all ${
                      urgency === u
                        ? u === "urgent"
                          ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200"
                          : "bg-green-500 border-green-500 text-white shadow-lg shadow-green-200"
                        : "bg-muted/20 border-transparent text-muted-foreground hover:border-muted"
                    }`}
                  >
                    {u === "urgent" ? <><Zap className="w-3 h-3 inline mr-1" />Urgent</> : "Normal"}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Worker's Rating</Label>
              <Select value={String(rating)} onValueChange={v => setRating(Number(v))}>
                <SelectTrigger className="rounded-2xl h-12 bg-muted/20 border-none px-4 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {[5.0, 4.8, 4.5, 4.3, 4.0, 3.8, 3.5, 3.0].map(r => (
                    <SelectItem key={r} value={String(r)}>⭐ {r.toFixed(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Competitor range pill */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 border border-blue-100 w-fit">
            <BarChart3 className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs font-bold text-blue-700">
              Market range for {pricingCategory}:
            </span>
            <span className="text-xs font-black text-blue-800">
              ₹{competitorRange.low} – ₹{competitorRange.high}/hr
            </span>
            <Info className="w-3 h-3 text-blue-400 shrink-0" />
          </div>

          {/* Get AI Rate button */}
          <Button
            onClick={getAIRate}
            disabled={fetchingRate}
            className="h-14 px-10 rounded-2xl font-black text-base shadow-xl shadow-orange-200"
          >
            {fetchingRate
              ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Calculating...</>
              : <><Sparkles className="w-4 h-4 mr-2" /> Get Fair Price Estimate</>
            }
          </Button>

          {/* AI Rate result */}
          {aiRate !== null && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-5 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl border-2 border-orange-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Estimated Fair Rate</p>
                  <div className="flex items-center gap-1">
                    <IndianRupee className="w-7 h-7 text-orange-600 font-black" />
                    <span className="text-5xl font-black text-orange-600">{aiRate}</span>
                    <span className="text-xl text-orange-400 self-end mb-1">/hr</span>
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">AI Reasoning</p>
                  <p className="text-sm text-foreground leading-relaxed bg-white/70 rounded-2xl px-4 py-3 border border-orange-100">
                    {aiReason}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── FEATURE 2: AI Negotiation Assistant ────────────────────────────── */}
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50/60 pb-8">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/15 p-3 rounded-2xl">
              <MessageSquareQuote className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">AI Negotiation Assistant</CardTitle>
              <CardDescription>Paste a worker's price quote and get smart counter-replies to negotiate</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-7">

          {/* Tone selector */}
          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reply Tone</Label>
            <div className="flex flex-wrap gap-3">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id as typeof tone)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                    tone === t.id
                      ? t.color + " shadow-md scale-[1.03]"
                      : "bg-muted/20 border-transparent text-muted-foreground hover:border-muted"
                  }`}
                >
                  <span className="text-base">{t.emoji}</span>
                  <div className="text-left">
                    <div>{t.label}</div>
                    <div className="text-[10px] font-normal opacity-70">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Customer message input */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Worker's Message / Price Quote
            </Label>
            <Textarea
              rows={4}
              value={workerMessage}
              onChange={e => setWorkerMessage(e.target.value)}
              placeholder={`e.g. "I can do it for ₹500/hr." or "It will cost ₹1200 total for the repair."`}
              className="rounded-2xl bg-muted/20 border-none focus-visible:ring-purple-400 px-5 py-4 leading-relaxed text-sm resize-none"
            />
          </div>

          {/* Generate button */}
          <Button
            onClick={generateReplies}
            disabled={fetchingReplies}
            className="h-14 px-10 rounded-2xl font-black text-base bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-200"
          >
            {fetchingReplies
              ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Generating replies...</>
              : <><Sparkles className="w-4 h-4 mr-2" /> Generate Counter-Offers</>
            }
          </Button>

          {/* Single negotiation result */}
          {negotiationResult && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 p-6 rounded-3xl bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-100 space-y-5">
              {/* Negotiated Amount */}
              <div className="flex items-center gap-4">
                <div className="bg-purple-600 p-3 rounded-2xl">
                  <IndianRupee className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-0.5">Your Counter-Offer</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-purple-700">₹{negotiationResult.amount}</span>
                    <span className="text-sm text-purple-400 font-medium">/hr</span>
                  </div>
                </div>
              </div>

              {/* Reply message */}
              <div className="bg-white rounded-2xl border border-purple-100 px-5 py-4">
                <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
                  {TONES.find(t => t.id === tone)?.emoji} Suggested Reply
                </p>
                <p className="text-sm text-foreground font-medium leading-relaxed">{negotiationResult.reply}</p>
              </div>

              {/* Copy button */}
              <Button
                onClick={() => copyReply(negotiationResult.reply)}
                className={`w-full h-12 rounded-2xl font-bold transition-all ${
                  copied
                    ? "bg-green-500 hover:bg-green-500 shadow-green-200 shadow-lg"
                    : "bg-purple-600 hover:bg-purple-700 shadow-purple-200 shadow-xl"
                }`}
              >
                {copied
                  ? <><Check className="w-4 h-4 mr-2" /> Copied to Clipboard!</>
                  : <><Copy className="w-4 h-4 mr-2" /> Copy Reply</>
                }
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
