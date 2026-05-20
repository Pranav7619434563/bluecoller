"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, Send, X, Volume2, VolumeX, Bot, User as UserIcon } from "lucide-react"
import { useVoice, LANG_CONFIG } from "@/hooks/useVoice"

type Message = {
  role: "user" | "assistant"
  content: string
}

const welcomeMessages = {
  english: "Hello! How can I help you find a worker today?",
  hindi: "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?",
  kannada: "ನಮಸ್ಕಾರ! ಇಂದು ನಿಮಗೆ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಲು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
};

export default function VoiceChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi' | 'kannada'>('english')
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSpokenRef = useRef<string | null>(null)

  // Integrate voice hook passing state setters and transcripts
  const {
    isRecording,
    isMuted,
    startListening,
    speakText,
    toggleMute,
  } = useVoice(selectedLanguage, (transcript) => {
    handleSend(transcript);
  }, setInput);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Reset messages when language changes to prevent LLM history-language-bias and speech overlap
  useEffect(() => {
    setMessages([]);
    lastSpokenRef.current = null;
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      const existingAudio = document.getElementById('voice-fallback-audio') as HTMLAudioElement;
      if (existingAudio) {
        existingAudio.pause();
        existingAudio.remove();
      }
    }
  }, [selectedLanguage]);

  // Auto-speak every new AI reply in the correct selected language voice without repeating on lang toggles
  useEffect(() => {
    if (messages.length === 0) {
      lastSpokenRef.current = null;
      return;
    }
    const last = messages[messages.length - 1];
    if (last.role === 'assistant' && last.content !== lastSpokenRef.current && !isMuted) {
      lastSpokenRef.current = last.content;
      speakText(last.content, selectedLanguage);
    }
  }, [messages, selectedLanguage, speakText, isMuted]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return
    const userMessage: Message = { role: "user", content: text }
    const currentHistory = [...messages]
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          history: currentHistory, 
          language: selectedLanguage 
        })
      })

      const data = await res.json()
      const aiResponse = data.reply || data.error || "Connection lost. Please try again."

      setMessages(current => [...current, { role: "assistant", content: aiResponse }])
    } catch (err) {
      setMessages(current => [...current, { role: "assistant", content: "Error communicating with assistant. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-2xl z-50 bg-primary hover:scale-110 transition-transform duration-300 group"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-8 h-8" /> : <Volume2 className="w-8 h-8 group-hover:animate-bounce" />}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-[90vw] md:w-96 h-[600px] max-h-[70vh] shadow-2xl z-50 flex flex-col border-none ring-1 ring-primary/20 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CardHeader className="bg-primary text-primary-foreground p-5 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <CardTitle className="text-xl">WorkForce AI</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {/* Language Selector Dropdown using strict LANG_CONFIG keys */}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-primary-foreground/10 text-white border-none rounded-lg px-2 py-1 text-xs outline-none cursor-pointer hover:bg-primary-foreground/20 transition-all font-semibold"
              >
                <option value="english" className="text-zinc-800">{LANG_CONFIG.english.label}</option>
                <option value="hindi" className="text-zinc-800">{LANG_CONFIG.hindi.label}</option>
                <option value="kannada" className="text-zinc-800">{LANG_CONFIG.kannada.label}</option>
              </select>

              <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 text-white h-8 w-8" onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 text-white h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-muted/50">
            <ScrollArea className="flex-1 p-5">
              <div className="space-y-6">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl rounded-tl-none text-sm shadow-sm border border-primary/10 max-w-[85%] leading-relaxed">
                    {welcomeMessages[selectedLanguage]}
                  </div>
                </div>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl text-sm shadow-sm max-w-[85%] leading-relaxed ${msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-white dark:bg-zinc-800 rounded-tl-none border border-primary/10"
                      }`}>
                      {msg.content}
                      {msg.role === "assistant" && (
                        <div className="mt-2 flex justify-end">
                          <button onClick={() => speakText(msg.content, selectedLanguage, true)} className="text-primary/40 hover:text-primary transition-colors">
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-primary/10 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-5 border-t flex gap-2 bg-white dark:bg-zinc-900 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
              <Button
                variant="outline"
                size="icon"
                className={`rounded-xl h-12 w-12 transition-all ${isRecording ? "animate-pulse bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.7)] scale-105" : "hover:bg-primary/5"}`}
                onClick={startListening}
              >
                <Mic className={isRecording ? "text-white w-5 h-5 animate-pulse" : "w-5 h-5"} />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={LANG_CONFIG[selectedLanguage]?.placeholder}
                className="rounded-xl h-12 bg-muted/50 border-none focus-visible:ring-primary px-4"
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              />
              <Button size="icon" className="rounded-xl h-12 w-12 shadow-md shadow-primary/20" onClick={() => handleSend(input)}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}


