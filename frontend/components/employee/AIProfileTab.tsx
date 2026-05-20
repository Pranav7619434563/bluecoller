"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Sparkles, RefreshCw, Plus, Check } from "lucide-react"

type BioOutputs = {
  professional: string
  friendly: string
  seo: string
}

interface AIProfileTabProps {
  workerName: string
  category: string
  experience: number
  currentSkills: string[]
  onUpdateBio: (bio: string) => void
  onAddSkill: (skill: string) => void
}

export function AIProfileTab({
  workerName,
  category,
  experience,
  currentSkills,
  onUpdateBio,
  onAddSkill
}: AIProfileTabProps) {
  const [isGeneratingBio, setIsGeneratingBio] = useState(false)
  const [bioOutputs, setBioOutputs] = useState<BioOutputs | null>(null)
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([])
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false)

  const generateBio = async () => {
    setIsGeneratingBio(true)
    try {
      const prompt = `Generate 3 worker bio versions for:
Name: ${workerName}
Category: ${category}
Skills: ${currentSkills.join(", ")}
Experience: ${experience} years

Version 1: Professional (Formal, expert-sounding)
Version 2: Friendly (Approachable, customer-focused)
Version 3: SEO (Keyword-rich, good for search ranking)

Return ONLY as a JSON object with keys: "professional", "friendly", "seo". No other text.`

      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt
        })
      })

      const data = await response.json()
      const jsonStr = data.response?.match(/\{[\s\S]*\}/)?.[0]
      if (jsonStr) {
        setBioOutputs(JSON.parse(jsonStr))
        toast.success("AI Bios generated!")
      } else {
        throw new Error("Invalid AI response")
      }
    } catch (error) {
      console.error(error)
      toast.error("Groq connection failed. Make sure your API key is correct.")
    } finally {
      setIsGeneratingBio(false)
    }
  }

  const suggestSkills = async () => {
    setIsSuggestingSkills(true)
    try {
      const prompt = `Given these current skills: ${currentSkills.join(", ")} for a ${category} worker, suggest 3-5 additional specific skills to add to this worker profile. 
Return ONLY as a JSON array of strings. No other text.`

      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt
        })
      })

      const data = await response.json()
      const jsonStr = data.response?.match(/\[[\s\S]*\]/)?.[0]
      if (jsonStr) {
        setSuggestedSkills(JSON.parse(jsonStr))
        toast.success("Skill suggestions updated!")
      } else {
        throw new Error("Invalid AI response")
      }
    } catch (error) {
      console.error(error)
      toast.error("Groq connection failed.")
    } finally {
      setIsSuggestingSkills(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-primary/5 pb-8">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                AI Bio Generator
              </CardTitle>
              <CardDescription>Generate professional intros using local Llama 3</CardDescription>
            </div>
            <Button 
              onClick={generateBio} 
              disabled={isGeneratingBio}
              className="rounded-xl h-12 px-6 font-bold"
            >
              {isGeneratingBio ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {isGeneratingBio ? "Generating..." : "Generate Bios"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-6">
          {bioOutputs ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['professional', 'friendly', 'seo'] as const).map((key) => (
                <div key={key} className="space-y-3">
                  <Label className="text-sm font-bold capitalize flex justify-between">
                    {key} Version
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs text-primary font-bold hover:text-primary hover:bg-primary/10"
                      onClick={() => {
                        onUpdateBio(bioOutputs[key])
                        toast.success(`Active bio set to ${key} version`)
                      }}
                    >
                      <Check className="w-3 h-3 mr-1" /> Use this
                    </Button>
                  </Label>
                  <Textarea 
                    value={bioOutputs[key]}
                    onChange={(e) => setBioOutputs({...bioOutputs, [key]: e.target.value})}
                    className="rounded-2xl bg-muted/20 border-none h-48 text-sm leading-relaxed"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-muted text-muted-foreground italic">
              Click "Generate Bios" to create AI-powered profiles using Groq.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-orange-50/50 pb-8">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Plus className="w-6 h-6 text-orange-600" />
                AI Skill Suggester
              </CardTitle>
              <CardDescription>Suggesting new skills based on your profile</CardDescription>
            </div>
            <Button 
              variant="outline"
              onClick={suggestSkills} 
              disabled={isSuggestingSkills}
              className="rounded-xl h-12 px-6 font-bold border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              {isSuggestingSkills ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isSuggestingSkills ? "Thinking..." : "Refresh Suggestions"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="flex flex-wrap gap-3">
            {suggestedSkills.length > 0 ? (
              suggestedSkills.map((skill, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="px-4 py-2 rounded-full cursor-pointer hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all text-sm font-medium border-orange-200 text-orange-700 bg-orange-50/30 group"
                  onClick={() => {
                    onAddSkill(skill)
                    setSuggestedSkills(prev => prev.filter(s => s !== skill))
                  }}
                >
                  {skill}
                  <Plus className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100" />
                </Badge>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic py-4">No suggestions yet. Click refresh to get ideas.</p>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 block">Current Skills</Label>
            <div className="flex flex-wrap gap-2">
              {currentSkills.map(skill => (
                <Badge key={skill} className="bg-slate-800 text-white rounded-full px-4 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
