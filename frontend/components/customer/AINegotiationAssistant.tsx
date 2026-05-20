"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Easing } from "framer-motion"
import { Sparkles, Loader2, IndianRupee, TrendingUp, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const EASE: Easing = [0.22, 1, 0.36, 1]

type NegotiationResult = {
  fairRange: string
  suggestedOffer: string
  professionalReply: string
  tip: string
  verdict: "fair" | "low" | "high"
}

interface AINegotiationAssistantProps {
  workerName?: string
  workerRate?: number
  jobCategory?: string
}

export default function AINegotiationAssistant({
  workerName = "the worker",
  workerRate,
  jobCategory = "services",
}: AINegotiationAssistantProps) {
  const [expanded, setExpanded] = useState(false)
  const [offerPrice, setOfferPrice] = useState(workerRate?.toString() || "")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NegotiationResult | null>(null)

  const analyze = async () => {
    if (!offerPrice || isNaN(Number(offerPrice))) {
      toast.error("Please enter a valid price")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const prompt = `You are a fair pricing expert for blue-collar services in India.

Worker: ${workerName}
Service: ${jobCategory}
Worker's listed rate: ₹${workerRate || "unknown"}/hr
Customer's offered price: ₹${offerPrice}

Analyze whether the customer's offer is fair. Return ONLY a JSON object with these exact keys:
{
  "fairRange": "₹X–₹Y per hour",
  "suggestedOffer": "₹Z",
  "professionalReply": "A professional message the customer can send to negotiate",
  "tip": "One short negotiation tip",
  "verdict": "fair" | "low" | "high"
}`

      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, temperature: 0.3 }),
      })
      const data = await res.json()
      const jsonStr = (data.response || "").match(/\{[\s\S]*\}/)?.[0]
      if (!jsonStr) throw new Error("Could not parse AI response")
      const parsed = JSON.parse(jsonStr) as NegotiationResult
      setResult(parsed)
    } catch {
      toast.error("AI analysis failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const verdictColor = result?.verdict === "fair"
    ? "bg-green-100 text-green-700 border-green-200"
    : result?.verdict === "low"
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-red-100 text-red-700 border-red-200"

  const verdictLabel = result?.verdict === "fair" ? "✅ Fair Offer" : result?.verdict === "low" ? "⚠️ Below Market" : "⬆️ Above Market"

  return (
    <Card className="rounded-2xl border-orange-100 shadow-sm overflow-hidden">
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer py-4 px-5 hover:bg-orange-50/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">AI Negotiation Assistant</CardTitle>
            <CardDescription className="text-xs">Get fair pricing suggestions powered by AI</CardDescription>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <CardContent className="px-5 pb-5 space-y-4">
              {/* Price Input */}
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">Your Offer Price (₹/hr)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      value={offerPrice}
                      onChange={e => setOfferPrice(e.target.value)}
                      placeholder="e.g. 350"
                      className="pl-8 h-10 rounded-xl border-slate-200 focus:border-orange-400 focus:ring-orange-400/20"
                    />
                  </div>
                  {workerRate && (
                    <p className="text-[11px] text-slate-400">Worker's listed rate: ₹{workerRate}/hr</p>
                  )}
                </div>
                <Button
                  onClick={analyze}
                  disabled={loading}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-md shadow-orange-200 shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1" />Analyze</>}
                </Button>
              </div>

              {/* Result */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="space-y-3"
                  >
                    {/* Verdict */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold ${verdictColor}`}>
                      <span>{verdictLabel}</span>
                      <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" />Fair range: {result.fairRange}</span>
                    </div>

                    {/* Suggested Offer */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Suggested Counter-Offer</p>
                      <p className="text-lg font-black text-slate-800">{result.suggestedOffer}<span className="text-sm font-normal text-slate-400"> /hr</span></p>
                    </div>

                    {/* Professional Reply */}
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> Suggested Message
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed italic">"{result.professionalReply}"</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          navigator.clipboard?.writeText(result.professionalReply)
                          toast.success("Message copied to clipboard!")
                        }}
                      >
                        Copy message
                      </Button>
                    </div>

                    {/* Tip */}
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">{result.tip}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
