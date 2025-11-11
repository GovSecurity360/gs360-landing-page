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

function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [organization, setOrganization] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus("idle")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, organization, message }),
      })

      if (res.ok) {
        setStatus("success")
        setName("")
        setEmail("")
        setOrganization("")
        setMessage("")
      } else {
        setStatus("error")
      }
    } catch (err) {
      console.error(err)
      setStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input
            className="w-full rounded-lg bg-gray-200 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-[#00d4ff]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email*</label>
          <input
            required
            type="email"
            className="w-full rounded-lg bg-gray-200 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-[#00d4ff]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@agency.gov"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Organization</label>
        <input
          className="w-full rounded-lg bg-gray-200 border border-white/15 px-3 py-2 text-sm text-white outline-none focus:border-[#00d4ff]"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Agency / Office / Integrator"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Message*</label>
        <textarea
          required
          className="w-full rounded-lg bg-gray-200 border border-white/15 px-3 py-2 text-sm text-white outline-none min-h-[120px] focus:border-[#00d4ff]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us briefly about your mission or what you’re exploring."
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full border border-sky-700 px-5 py-2 text-sm font-semibold text-sky-700 bg-transparent hover:bg-sky-100 hover:text-black transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send message"}
        </button>
        {status === "success" && (
          <span className="text-xs text-green-400">
            Message sent. We&apos;ll be in touch soon.
          </span>
        )}
        {status === "error" && (
          <span className="text-xs text-red-400">
            Something went wrong. Please try again.
          </span>
        )}
      </div>
    </form>
  )
}

// 🏠 Home Page
export default function HomePage() {
  return (
    <main className="relative text-slate-900 bg-gradient-to-b from-white via-slate-50 to-slate-100 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="GovSecurity360 logo"
              className="h-7 w-7 rounded-full"
            />
            <span className={`${Monsterrat.className} text-lg font-semibold`}>
              GS360
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-700">
            <a href="#product" className="hover:text-[#00d4ff] transition-colors">Product</a>
            <a href="#about" className="hover:text-[#00d4ff] transition-colors">About Us</a>
            <a
              href="#contact"
              className="rounded-full border border-sky-700 px-4 py-2 text-sm font-semibold text-sky-700 bg-transparent hover:bg-sky-100 hover:text-black transition-colors"
            >
              Get Demo
            </a>
          </nav>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center text-center px-4 sm:px-6 pt-24">
        <div className="absolute inset-0 z-0 w-full h-full">
          <Canvas
            camera={{ position: [0, 0, 8], fov: 45 }}
            gl={{ alpha: true }}
            style={{ background: "transparent" }}
          >
            <ambientLight intensity={0.15} />
            <pointLight position={[10, 10, 10]} intensity={0.8} color="#00d4ff" />
            <InteractiveGlobe />
          </Canvas>
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center pt-12 sm:pt-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`${Monsterrat.className} text-4xl sm:text-6xl md:text-8xl font-bold italic mb-6 text-slate-900`}
          >
            GovSecurity360
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-base sm:text-xl md:text-2xl mb-8 text-slate-700 font-light tracking-wide"
          >
            Simple | Seamless | Secure
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 text-sm px-2"
          >
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 text-sky-700 shadow-[0_6px_18px_rgba(15,23,42,0.14)] text-xs sm:text-sm">
              <Shield className="w-4 h-4" />
              <span>NIST-Compliance Automation</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 text-sky-700 shadow-[0_6px_18px_rgba(15,23,42,0.14)] text-xs sm:text-sm">
              <Globe className="w-4 h-4" />
              <span>CMRS-Enabled Risk Monitoring</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 text-sky-700 shadow-[0_6px_18px_rgba(15,23,42,0.14)] text-xs sm:text-sm">
              <Zap className="w-4 h-4" />
              <span>AI-Enhanced GRC Platform</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section
        id="product"
        className="relative py-20 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto text-center"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900">
          Activating Intelligent GRC into Action
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto">
          We believe a GRC platform should serve as the brain of a security program, providing real-time, comprehensive insight into enterprise and cybersecurity risks across the organization.
        </p>

        <div className="mt-12 space-y-8">
          {/* Card 1 */}
          <div className="grid gap-6 md:grid-cols-2 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md">
            <div className="text-left space-y-4">
              <h3 className="text-2xl font-semibold text-black">
                Live Risk Command Center
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                Make GRC the operational brain of your security
                program—providing real-time, comprehensive insight into enterprise
                and cybersecurity risks across the organization.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>Unified view of controls, risks, and POA&amp;Ms</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>OSCAL-native data model for federal missions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>Continuous visibility aligned with CDM and CMRS</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full h-48 sm:h-56 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 flex items-center justify-center">
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <span>Enterprise Risk</span>
                    <span className="text-sky-500">Medium</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <span>Cyber Risk</span>
                    <span className="text-sky-500">Elevated</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <span>Compliance Health</span>
                    <span className="text-sky-500">On Track</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="grid gap-6 md:grid-cols-2 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md">
            <div className="order-2 md:order-1 flex items-center justify-center">
              <div className="w-full h-48 sm:h-56 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 flex flex-col justify-center px-5">
                <p className="text-left text-xs sm:text-sm text-black mb-3">
                  Example workflow
                </p>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-200 flex items-center justify-between">
                    <span>Control assessment started</span>
                    <span className="text-sky-500">AC-2</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-200 flex items-center justify-between">
                    <span>AI drafts evidence package</span>
                    <span className="text-sky-500">Ready to review</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-200 flex items-center justify-between">
                    <span>POA&amp;M created & linked</span>
                    <span className="text-sky-500">Owner assigned</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 text-left space-y-4">
              <h3 className="text-2xl font-semibold text-black">
                Integrated, Mission-Ready Workflows
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                GovSecurity360 is purpose-built for the federal government: an
                experience-driven, mission-ready, government-grade GRC solution,
                fully OSCAL-enabled and powered by AI-enhanced intelligence.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>Align security, privacy, and mission stakeholders</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>Connect systems, inventories, and controls into one view</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>Design for ATO, continuous monitoring, and sustainment</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 3 */}
          <div className="grid gap-6 md:grid-cols-2 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md">
            <div className="text-left space-y-4">
              <h3 className="text-2xl font-semibold text-black">
                Proactive, AI-Enhanced Governance
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                GovSecurity360 helps agencies reduce compliance timelines,
                accelerate assessments, and move beyond static reporting to
                proactive, real-time risk governance.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>AI-assisted control narratives and evidence summaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>Prioritized risk and compliance actions for leaders</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                  <span>Support for CDM-aligned dashboards and insights</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full h-48 sm:h-56 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-3 text-xs sm:text-sm text-slate-700">
                <span className="rounded-full bg-white px-4 py-2 border border-slate-200">
                  "Next 30 days: top 5 risks identified"
                </span>
                <span className="rounded-full bg-white px-4 py-2 border border-slate-200">
                  "AI suggests 3 control updates for AC-2, AU-6, SC-7"
                </span>
                <span className="rounded-full bg-white px-4 py-2 border border-slate-200">
                  "Leadership-ready summary generated"
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className="relative py-20 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto"
      >
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900">
            Built by Federal Operators & Practitioners
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-600">
            GovSecurity360 is shaped by leaders who have lived the realities of
            federal missions—responsible for cyber, privacy, data, and risk
            across complex agencies.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Card: Who we are */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md space-y-4">
            <h3 className="text-2xl font-semibold text-white">
              Multi-disciplinary GRC Expertise
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Our team has served in key federal roles—CIO, CISO, CAIO, CPO,
              CTO, GRC Manager, and SOC Manager—across cabinet-level agencies
              and complex environments.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                <span>Deep experience with NIST 800-53, FedRAMP, FISMA, and RMF.</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                <span>Hands-on with cross-agency missions, shared services, and TIC/Zero Trust efforts.</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="mt-0.5 h-4 w-4 text-[#00d4ff]" />
                <span>Blending security operations, privacy, and data strategy into one integrated view.</span>
              </li>
            </ul>
          </div>

          {/* Card: How we build */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-white">
                Principles We Design By
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                We believe GRC tools should feel intuitive, mission-aligned,
                and responsive to the realities of federal work—not just
                compliance checklists.
              </p>
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-black">
                <span className="rounded-full bg-gray-100 px-3 py-1 border border-white/10">
                  Mission-first experience
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 border border-white/10">
                  Human-centered workflows
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 border border-white/10">
                  OSCAL-native from day one
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 border border-white/10">
                  AI with clear accountability
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm text-slate-600 pt-2 border-t border-white/5">
              <div className="text-left">
                <p className="text-lg sm:text-xl font-semibold text-sky-700">
                  20+
                </p>
                <p className="text-[11px] sm:text-xs">
                  years average federal & industry experience
                </p>
              </div>
              <div className="text-left">
                <p className="text-lg sm:text-xl font-semibold text-sky-700">
                  6
                </p>
                <p className="text-[11px] sm:text-xs">
                  core disciplines across cyber, privacy, data, and GRC
                </p>
              </div>
              <div className="text-left">
                <p className="text-lg sm:text-xl font-semibold text-sky-700">
                  3
                </p>
                <p className="text-[11px] sm:text-xs">
                  continents of mission experience and delivery
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width quote / philosophy */}
        <div className="mt-10 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 px-6 sm:px-10 py-8 text-center">
          <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-3xl mx-auto">
            “We built GovSecurity360 to move federal security programs beyond
            static, document-driven compliance—toward live, actionable
            visibility into risk that directly supports mission outcomes.”
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="relative py-20 px-6 sm:px-12 max-w-3xl mx-auto text-center border-t border-white/10"
      >
        <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-slate-900">
          Contact Us
        </h2>
        <p className="text-sm sm:text-base text-slate-600 mb-4">
          Share a bit about your mission, environment, or how you&apos;re thinking
          about intelligent GRC. We&apos;ll follow up with next steps and a demo.
        </p>
        <div className="mt-6">
          <ContactForm />
        </div>
      </section>
    </main>
  )
}
