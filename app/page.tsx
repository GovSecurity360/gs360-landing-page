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

const Monsterrat = Montserrat({ subsets: ['latin'], weight: ['400', '600', '700'] })

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
    <main className="relative text-white bg-gradient-to-b from-[#000511] via-[#001122] to-[#000511] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center text-center px-4 sm:px-6">
        <div className="absolute inset-0 z-0 w-full h-full">
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
            <InteractiveGlobe />
          </Canvas>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center pt-12 sm:pt-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`${Monsterrat.className} text-4xl sm:text-6xl md:text-8xl font-bold italic mb-6 text-white`}
          >
            GovSecurity360
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-base sm:text-xl md:text-2xl mb-8 text-white font-light tracking-wide"
          >
            Defense-grade intelligence. Built for compliance. Launching soon.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 text-sm px-2"
          >
            <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-[#00d4ff]/70 text-[#00d4ff] backdrop-blur-md shadow-lg shadow-[#00d4ff]/20 text-xs sm:text-sm">
              <Shield className="w-4 h-4" />
              <span>NIST-Compliance Automation</span>
            </div>
            <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-[#00d4ff]/70 text-[#00d4ff] backdrop-blur-md shadow-lg shadow-[#00d4ff]/20 text-xs sm:text-sm">
              <Globe className="w-4 h-4" />
              <span>CMRS-Enabled Risk Monitoring</span>
            </div>
            <div className="flex items-center gap-2 bg-black/80 px-4 py-2 rounded-full border border-[#00d4ff]/70 text-[#00d4ff] backdrop-blur-md shadow-lg shadow-[#00d4ff]/20 text-xs sm:text-sm">
              <Zap className="w-4 h-4" />
              <span>AI-Enhanced GRC Platform</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative py-20 px-6 sm:px-12 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-[#00d4ff]">Activating Intelligent GRC into Action</h2>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
          We believe a GRC platform should serve as the brain of a security program—providing
          real-time, comprehensive insight into both enterprise and cybersecurity risks across the organization.
        </p>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
          GovSecurity360 is purpose-built for the federal government: a mission-ready,
          government-grade GRC solution, fully OSCAL-enabled and powered by AI-enhanced 
          intelligence.
        </p>
        <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
          GovSecurity360 helps agencies reduce compliance timelines, accelerate assessments, 
          and move beyond static reporting to enable proactive, real-time risk governance. 
          It places intelligent, actionable GRC directly into the hands of agency leaders, 
          security executives, and operators to truly achieve Continuous Diagnostics Mitigation (CDM).
        </p>
      </section>

      {/* About Section */}
      <section className="relative py-20 px-6 sm:px-12 max-w-5xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-[#00d4ff]">About Us</h2>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
          We are former government operators and industry executives who have served in key
          federal roles—including CIO, CISO, CAIO, CPO, CTO, GRC Manager, and SOC Manager.
        </p>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
          Our vision is to make GRC the operational brain of every security program, enabling smarter, faster, and more aligned risk and compliance decisions.
        </p>
        <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
          We built GovSecurity360 to shift security programs away from outdated document 
          repositories and static compliance checks toward live, actionable visibility 
          into enterprise and cybersecurity risks, clearly aligned with organizational missions. 
          Agencies gain the ability to respond rapidly, confidently, and intelligently through continuous governance and real-time insights.
        </p>
      </section>

      {/* Contact Section */}
      <section className="relative py-20 px-6 sm:px-12 max-w-3xl mx-auto text-center border-t border-white/10">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-[#00d4ff]">Contact Us</h2>
        <p className="text-lg text-gray-300">
          Reach out to us at <a href="mailto:info@govsecurity360.com" className="text-[#00d4ff] underline">info@govsecurity360.com</a>
        </p>
      </section>
    </main>
  )
}

