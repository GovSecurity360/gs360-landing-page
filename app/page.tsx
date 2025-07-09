"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Shield, Globe, Zap } from "lucide-react"
import Link from "next/link"
import InteractiveGlobe from "@/components/InteractiveGlobe"
import { Montserrat } from 'next/font/google'

const sora = Montserrat({ subsets: ['latin'], weight: ['400', '600', '700'] })

// ✉️ Email Signup Component
function EmailSignup() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubmitted(true)
      setTimeout(() => setIsSubmitted(false), 3000)
      setEmail("")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="relative"
    >
      <AnimatePresence>
        {isSubmitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center py-8"
          >
            <div className="inline-flex items-center gap-2 text-[#00d4ff] text-lg font-semibold">
              <Shield className="w-5 h-5" />
              {"Secured. You'll be notified."}
            </div>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="Enter your secure email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/60 border-[#00d4ff]/50 text-white placeholder:text-gray-300 focus:border-[#00d4ff] focus:ring-[#00d4ff]/30"
              required
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#00d4ff] to-[#0099cc] hover:from-[#00b8e6] hover:to-[#0088bb] text-black font-semibold px-6 transition-all duration-300"
            >
              Get Notified
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// 🏠 Home Page
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000511] via-[#001122] to-[#000511] text-white">
      {/* Navigation */}
      <nav className="w-full backdrop-blur-md bg-black/30 border-b border-[#00d4ff]/20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`${sora.className} text-xl font-bold italic text-[#00d4ff]`}
          >
            GovSecurity360
          </motion.div>
          <Link href="/contact">
            <Button variant="ghost" className="text-white hover:text-[#00d4ff] hover:bg-[#00d4ff]/10">
              Contact
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-6">
        {/* Background Globe Canvas */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
            <InteractiveGlobe />
          </Canvas>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`${sora.className} text-6xl md:text-8xl font-bold italic mb-6 text-white`}
          >
            GovSecurity360
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl mb-8 text-white font-light tracking-wide"
          >
            Defense-grade AI. Trusted by government. Launching soon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6 mb-12 text-sm"
          >
            <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-[#00d4ff]/70 text-[#00d4ff] backdrop-blur-md shadow-lg shadow-[#00d4ff]/20">
              <Shield className="w-4 h-4" />
              <span>Military-Grade Encryption</span>
            </div>
            <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-[#00d4ff]/70 text-[#00d4ff] backdrop-blur-md shadow-lg shadow-[#00d4ff]/20">
              <Globe className="w-4 h-4" />
              <span>Global Threat Intelligence</span>
            </div>
            <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-[#00d4ff]/70 text-[#00d4ff] backdrop-blur-md shadow-lg shadow-[#00d4ff]/20">
              <Zap className="w-4 h-4" />
              <span>Real-Time Response</span>
            </div>
          </motion.div>

          <div className="w-full max-w-md">
            <EmailSignup />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#00d4ff]/10 bg-black/40" style={{ zIndex: 10 }}>
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-gray-400 text-sm">© 2024 GovSecurity360. Classified. Authorized personnel only.</p>
        </div>
      </footer>
    </div>
  )
}
