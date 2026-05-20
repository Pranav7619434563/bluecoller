"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Upload, Sparkles, AlertCircle, ShieldCheck, CheckCircle2, FileText, Activity } from "lucide-react"

export function VerificationTab({ profile }: { profile: any }) {
  // ID Extractor State
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState<{
    name: string | null;
    idNumber: string | null;
    dob: string | null;
    docType: string | null;
    confidenceNote?: string;
  } | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    idNumber: "",
    dob: "",
    docType: ""
  })

  // Trust Score State
  const [isGeneratingScore, setIsGeneratingScore] = useState(false)
  const [trustData, setTrustData] = useState<{
    score: number;
    factors: string[];
  } | null>(null)
  // Verification Save State
  const [isVerificationSaved, setIsVerificationSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [showHowCalculated, setShowHowCalculated] = useState(false)

  // Validation logic
  let idError = "";
  if (formData.idNumber && formData.docType) {
    if (formData.docType === "Aadhaar" && !/^\d{12}$/.test(formData.idNumber)) {
      idError = "Aadhaar must be exactly 12 digits.";
    } else if (formData.docType === "PAN" && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.idNumber)) {
      idError = "PAN must be 10 characters (e.g., ABCDE1234F).";
    } else if (formData.docType === "Driving License" && formData.idNumber.length < 10) {
      idError = "Driving License must be at least 10 characters.";
    } else if (formData.docType === "Passport" && formData.idNumber.length < 8) {
      idError = "Passport must be at least 8 characters.";
    } else if (formData.docType === "Voter ID" && !/^[A-Z]{3}[0-9]{7}$/.test(formData.idNumber)) {
      idError = "Voter ID typically has 3 letters and 7 digits.";
    }
  }

  const isFormComplete = !!formData.name && !!formData.idNumber && !idError && !!formData.dob && !!formData.docType;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    toast.info("Analyzing document with AI...")

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        
        const response = await fetch('/api/extract-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String })
        })

        const result = await response.json()
        
        if (result.error) throw new Error(result.error)

        const data = result.data
        setExtractedData(data)
        setFormData({
          name: data.name || "",
          idNumber: data.idNumber || "",
          dob: data.dob || "",
          docType: data.docType || ""
        })

        if (!data.name || !data.idNumber || !data.dob || !data.docType) {
          toast.warning("Some fields could not be extracted. Please fill them manually.")
        } else {
          toast.success("Document analyzed successfully!")
        }
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      toast.error(error.message || "Failed to analyze document")
    } finally {
      setIsExtracting(false)
    }
  }

  const generateTrustScore = async () => {
    setIsGeneratingScore(true)
    try {
      const verificationData = {
        workerProfile: {
          name: profile?.full_name || "Unknown",
          category: profile?.job_category || "General",
          experience: profile?.experience_years || 0,
          rating: profile?.avg_rating || 0,
          city: profile?.city || "Unknown"
        },
        idDetails: {
          nameOnId: formData.name,
          docType: formData.docType,
          idNumber: formData.idNumber,
          dob: formData.dob
        },
        documentQuality: extractedData?.confidenceNote || "Not provided",
        appStats: {
          completedJobsCount: 12,
          responseRatePercent: 92
        }
      }

      const response = await fetch('/api/trust-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationData })
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error)

      setTrustData(result.data)
      toast.success("Trust Score generated!")
    } catch (error: any) {
      toast.error(error.message || "Failed to generate trust score")
    } finally {
      setIsGeneratingScore(false)
    }
  }

  // Save verification details to backend
  const saveVerification = async () => {
    setIsSaving(true)
    try {
      const payload = {
        profileId: profile?.id || null,
        verificationData: {
          name: formData.name,
          docType: formData.docType,
          idNumber: formData.idNumber,
          dob: formData.dob,
          extractedData,
        }
      }
      const response = await fetch('/api/save-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()
      if (result.error) throw new Error(result.error)
      setIsVerificationSaved(true)
      toast.success('Verification details saved successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save verification details')
    } finally {
      setIsSaving(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 stroke-green-500"
    if (score >= 50) return "text-amber-500 stroke-amber-500"
    return "text-red-500 stroke-red-500"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      {/* Document Extractor */}
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-muted/30 pb-6 border-b">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 rounded-xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">ID Verification</CardTitle>
              <CardDescription>Upload your Aadhaar or PAN card to get verified.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 space-y-8">
          {/* Upload Area */}
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileUpload}
              disabled={isExtracting}
            />
            <div className={`border-4 border-dashed rounded-[2rem] p-10 text-center transition-all ${isExtracting ? 'bg-primary/5 border-primary/30' : 'bg-muted/10 border-muted group-hover:bg-primary/5 group-hover:border-primary/30'}`}>
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  {isExtracting ? <Activity className="w-8 h-8 text-primary animate-pulse" /> : <Upload className="w-8 h-8 text-primary" />}
                </div>
                <div>
                  <p className="font-bold text-lg">{isExtracting ? "Analyzing Document..." : "Tap to upload ID Card"}</p>
                  <p className="text-sm text-muted-foreground">AI will automatically extract your details</p>
                </div>
              </div>
            </div>
          </div>

          {/* Document Quality Badge */}
          {extractedData?.confidenceNote && (
            <div className="flex justify-center">
              <Badge variant="outline" className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${extractedData.confidenceNote.toLowerCase().includes('good') ? 'border-green-200 text-green-700 bg-green-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>
                {extractedData.confidenceNote.toLowerCase().includes('good') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                Quality: {extractedData.confidenceNote}
              </Badge>
            </div>
          )}

          {/* Form */}
          <div className="space-y-5 bg-muted/20 p-6 rounded-3xl border">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" /> Extracted Details
            </h3>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className={`rounded-xl h-12 bg-white ${extractedData && !extractedData.name ? 'border-red-500 bg-red-50 ring-red-500 placeholder-red-300' : 'border-none'}`}
                    placeholder={extractedData && !extractedData.name ? "Enter manually" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">ID Type</Label>
                  <Select value={formData.docType} onValueChange={v => setFormData({ ...formData, docType: v })}>
                    <SelectTrigger className={`rounded-xl h-12 bg-white ${extractedData && !extractedData.docType ? 'border-red-500 bg-red-50 ring-red-500' : 'border-none'}`}
                    >
                      <SelectValue placeholder={extractedData && !extractedData.docType ? "Select manually" : "Select ID Type"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="Aadhaar">Aadhaar Card</SelectItem>
                      <SelectItem value="PAN">PAN Card</SelectItem>
                      <SelectItem value="Driving License">Driving License</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Date of Birth Selectors */}
                <div className="grid grid-cols-3 gap-2">
                  <Select
                    onValueChange={v => setFormData({ ...formData, dob: `${v}-${formData.dob?.split('-')[1] || ''}-${formData.dob?.split('-')[2] || ''}` })}
                    value={formData.dob?.split('-')[0] || ''}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-white">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                          {new Date(0, i).toLocaleString('default', { month: 'short' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={v => setFormData({ ...formData, dob: `${formData.dob?.split('-')[0] || ''}-${v}-${formData.dob?.split('-')[2] || ''}` })}
                    value={formData.dob?.split('-')[1] || ''}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-white">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(31)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={v => setFormData({ ...formData, dob: `${formData.dob?.split('-')[0] || ''}-${formData.dob?.split('-')[1] || ''}-${v}` })}
                    value={formData.dob?.split('-')[2] || ''}
                  >
                    <SelectTrigger className="rounded-xl h-12 bg-white">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 100 }, (_, i) => 2025 - i).map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">ID Number</Label>
                  <Input
                    value={formData.idNumber}
                    onChange={e => {
                      let val = e.target.value;
                      if (formData.docType !== "Aadhaar") {
                        val = val.toUpperCase();
                      }
                      setFormData({ ...formData, idNumber: val });
                    }}
                    className={`rounded-xl h-12 bg-white ${extractedData && !extractedData.idNumber ? 'border-red-500 bg-red-50 ring-red-500 placeholder-red-300' : idError ? 'border-red-500 bg-red-50 ring-red-500' : 'border-none'}`}
                    placeholder={extractedData && !extractedData.idNumber ? "Enter manually" : ""}
                  />
                  {idError && <p className="text-red-500 text-xs mt-1 ml-1">{idError}</p>}
                </div>
            <Button onClick={saveVerification} disabled={!isFormComplete || isSaving} className="w-full mt-4 h-12 rounded-xl font-bold shadow-lg">{isSaving ? 'Saving...' : 'Save Verified Details'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Trust Score Generator */}
      <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-white">AI Trust Score</CardTitle>
              <CardDescription className="text-slate-400">Build trust with customers through a high score.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-8 flex flex-col h-full">
          {!trustData ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full space-y-6">
              <div className="w-32 h-32 rounded-full border-4 border-slate-700 flex items-center justify-center">
                <span className="text-4xl font-black text-slate-600">?</span>
              </div>
              <p className="text-slate-400 max-w-sm">Generate your AI-powered trust score to stand out to customers.</p>
              {!isVerificationSaved && (
                <p className="text-amber-400 text-sm bg-amber-400/10 px-4 py-2 rounded-xl">Please complete the ID verification form first to generate your trust score.</p>
              )}
                <Button
                  onClick={generateTrustScore}
                  disabled={isGeneratingScore || !isVerificationSaved}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-2xl h-14 px-8 text-lg font-bold shadow-xl shadow-blue-500/20 disabled:opacity-50"
                >
                  {isGeneratingScore ? <Activity className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                  Generate Trust Score
                </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {/* Circular Badge */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" className="fill-transparent stroke-slate-700 stroke-[8]" />
                  <circle 
                    cx="50" cy="50" r="45" 
                    className={`fill-transparent stroke-[8] transition-all duration-1000 ease-out ${getScoreColor(trustData.score)}`}
                    style={{ strokeDasharray: 283, strokeDashoffset: 283 - (283 * trustData.score) / 100, strokeLinecap: 'round' }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className={`text-6xl font-black ${getScoreColor(trustData.score).split(' ')[0]}`}>
                    {trustData.score}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">out of 100</span>
                </div>
              </div>

              {/* Factors */}
              <div className="w-full space-y-4">
                <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider text-center">Top Influencing Factors</h4>
                <ul className="space-y-3">
                  {trustData.factors.map((factor, i) => (
                    <li key={i} className="flex gap-3 items-start bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-200">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl" onClick={generateTrustScore}>
                Recalculate Score
              </Button>
            </div>
          )}

          {/* How is this calculated */}
          <div className="mt-auto pt-8">
            <button 
              className="w-full text-left text-sm text-slate-400 font-medium hover:text-slate-300 flex justify-between items-center py-2"
              onClick={() => setShowHowCalculated(!showHowCalculated)}
            >
              How is this calculated?
              <span className={`transition-transform ${showHowCalculated ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showHowCalculated && (
              <div className="mt-4 text-xs text-slate-500 leading-relaxed p-4 bg-slate-900/50 rounded-2xl animate-in slide-in-from-top-2">
                Our AI considers multiple verified data points including your identity verification status, customer ratings, job completion rate, platform responsiveness, and selfie-to-ID match score to calculate a fair, unbiased trust rating out of 100.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
