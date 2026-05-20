import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import VoiceChatbot from "@/components/chatbot/VoiceChatbot";
import Header from "@/components/Header";
import AnimatePresenceProvider from "@/components/providers/AnimatePresenceProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "WorkForce AI - Blue Collar Job Marketplace",
  description: "Find trusted plumbers, electricians, carpenters, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Header />
            <AnimatePresenceProvider>
              {children}
            </AnimatePresenceProvider>
          </div>
          <VoiceChatbot />
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
