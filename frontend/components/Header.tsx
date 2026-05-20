"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Header() {
  const pathname = usePathname()

  const handleGetStartedClick = () => {
    const element = document.getElementById("portal-selection")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <span className="text-xl md:text-2xl font-black tracking-wide bg-gradient-to-r from-[#FF8C00] via-[#F2711C] to-[#E55B00] bg-clip-text text-transparent group-hover:opacity-90 transition-opacity font-sans select-none uppercase">
            BlueCollar Connect
          </span>
        </Link>
        {pathname === "/" && (
          <Button
            onClick={handleGetStartedClick}
            className="bg-[#FF8C00] hover:bg-[#F2711C] text-white font-bold px-5 py-2.5 rounded-full shadow-lg hover:scale-105 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-300 active:scale-[0.98] text-sm animate-in fade-in zoom-in duration-500"
          >
            Get Started
          </Button>
        )}
      </div>
    </header>
  )
}
