"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { motion, AnimatePresence, useScroll } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Shield, Globe, Zap, Quote } from "lucide-react"
import Link from "next/link"
import InteractiveGlobe from "@/components/InteractiveGlobe"
import { Montserrat } from 'next/font/google'

const Monsterrat = Montserrat({ subsets: ['latin'], weight: ['400', '600', '700'] })

// --- Globe Background Components ---
type AnimatedGlobeProps = {
  scrollRef: React.MutableRefObject<number>
}

function AnimatedGlobe({ scrollRef }: AnimatedGlobeProps) {
  const group = useRef<THREE.Group | null>(null)

  useFrame(() => {
    const progress = scrollRef.current
    // Clamp progress between 0 and 1 for safety
    const clamped = Math.min(1, Math.max(0, progress))

    const maxZoom = 1.8
    const zoom = 1 + clamped * (maxZoom - 1) // scale from 1 (hero) to ~1.8 (scrolled)
    if (group.current) {
      group.current.scale.set(zoom, zoom, zoom)
    }
  })

  return (
    <group ref={group}>
      <InteractiveGlobe />
    </group>
  )
}

function GlobeBackground() {
  const { scrollYProgress } = useScroll()
  const scrollRef = useRef(0)

  useEffect(() => {
    return scrollYProgress.on("change", (v) => {
      scrollRef.current = v
    })
  }, [scrollYProgress])

  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.15} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#00d4ff" />
        <AnimatedGlobe scrollRef={scrollRef} />
      </Canvas>
    </div>
  )
}

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
            className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-200"
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
            className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-200"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@agency.gov"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Organization</label>
        <input
          className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-600 focus:ring-1 focus:ring-sky-200"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Agency / Office / Integrator"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Message*</label>
        <textarea
          required
          className="w-full rounded-lg bg-white border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none min-h-[120px] focus:border-sky-600 focus:ring-1 focus:ring-sky-200"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us briefly about your mission or what you’re exploring."
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full border border-sky-700 px-5 py-2 text-sm font-semibold text-sky-700 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.16)] hover:bg-sky-700 hover:text-white transition-colors disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send message"}
        </button>
        {status === "success" && (
          <span className="text-xs text-emerald-600">
            Message sent. We&apos;ll be in touch soon.
          </span>
        )}
        {status === "error" && (
          <span className="text-xs text-rose-600">
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
      <GlobeBackground />
      <header className="fixed top-0 left-0 right-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
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
          <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <a href="#product" className="hover:text-sky-700 transition-colors">Product</a>
            <a href="#about" className="hover:text-sky-700 transition-colors">About Us</a>
            <a
              href="#contact"
              className="inline-flex items-center rounded-full border border-sky-700 px-5 py-2 text-sm font-semibold text-sky-700 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.16)] hover:bg-sky-700 hover:text-white transition-colors"
            >
              Get Demo
            </a>
          </nav>
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center text-center px-4 sm:px-6 pt-24">
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
            className="text-base sm:text-xl md:text-2xl mb-8 text-slate-700 font-light tracking-wide drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]"
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
        <div className="inline-block max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900 drop-shadow-[0_0_16px_rgba(255,255,255,0.95)]">
            Activating Intelligent GRC into Action
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-700 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]">
            We believe a GRC platform should serve as the brain of a security program, delivering real-time, comprehensive insight into enterprise and cybersecurity risks across the organization through a single pane of glass.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {/* Card 1 */}
          <div className="grid gap-6 md:grid-cols-2 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md">
            <div className="text-left space-y-4">
              <h3 className="text-2xl font-semibold text-black">
                Live Risk Command Center
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                Make GRC the operational brain of your security
                program, providing real-time, comprehensive insight into enterprise
                and cybersecurity risks across the organization.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-sky-700" />
                  <span>Unified view of controls, risks, and POA&amp;Ms</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-sky-700" />
                  <span>OSCAL-native data model for federal missions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-sky-700" />
                  <span>Continuous visibility aligned with CDM and CMRS</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full h-48 sm:h-56 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <span>Impact Level (FIPS199)</span>
                    <span className="text-sky-700">High</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <span>ATO Package Readiness</span>
                    <span className="text-sky-700">On Track</span>
                  </div>
                  <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 border border-slate-200">
                    <span>Threat Exposure</span>
                    <span className="text-sky-700">23 New Moderate Findings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="grid gap-6 md:grid-cols-2 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md">
            <div className="order-2 md:order-1 flex items-center justify-center">
              <div className="w-full h-48 sm:h-56 rounded-2xl bg-white border border-slate-200 flex flex-col justify-center px-5">
                <p className="text-left text-xs sm:text-sm text-black mb-3">
                  Example workflow
                </p>
                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-200 flex items-center justify-between">
                    <span>Control assessment started</span>
                    <span className="text-sky-700">AC-2</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-200 flex items-center justify-between">
                    <span>AI drafts evidence package</span>
                    <span className="text-sky-700">Ready to review</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-200 flex items-center justify-between">
                    <span>POA&amp;M created & linked</span>
                    <span className="text-sky-700">Owner assigned</span>
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
                  <Globe className="mt-0.5 h-4 w-4 text-sky-700" />
                  <span>Align security, privacy, and mission stakeholders</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-sky-700" />
                  <span>Connect systems, inventories, and controls into one view</span>
                </li>
                <li className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-4 w-4 text-sky-700" />
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
                  <Zap className="mt-0.5 h-4 w-4 text-sky-700" />
                  <span>AI-assisted control narratives and evidence summaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-sky-700" />
                  <span>Prioritized risk and compliance actions for leaders</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 text-sky-700" />
                  <span>Support for CDM-aligned dashboards and insights</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full h-48 sm:h-56 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center gap-3 text-xs sm:text-sm text-slate-700">
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

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 mt-10 mb-4">
        <div className="h-px bg-slate-200/70" />
      </div>

      {/* About Section */}
      <section
        id="about"
        className="relative py-20 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto"
      >
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-slate-900 drop-shadow-[0_0_16px_rgba(255,255,255,0.95)]">
            Built by Federal Operators & Practitioners
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]">
            GovSecurity360 is shaped by leaders who have lived the realities of
            federal missions, responsible for cyber, privacy, data, and risk
            across complex agencies.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Card: Who we are */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md space-y-4">
            <h3 className="text-2xl font-semibold text-black">
              Multi-disciplinary GRC Expertise
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              Our team has served in key federal roles: CIO, CISO, CAIO, CPO,
              CTO, GRC Manager, and SOC Manager - across cabinet-level agencies
              and complex environments.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 text-sky-700" />
                <span>Deep experience with NIST 800-53, FedRAMP, FISMA, and RMF.</span>
              </li>
              <li className="flex items-start gap-2">
                <Globe className="mt-0.5 h-4 w-4 text-sky-700" />
                <span>Hands-on with cross-agency missions, shared services, and TIC/Zero Trust efforts.</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="mt-0.5 h-4 w-4 text-sky-700" />
                <span>Blending security operations, privacy, and data strategy into one integrated view.</span>
              </li>
            </ul>
          </div>

          {/* Card: How we build */}
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-md flex flex-col justify-between gap-6">
            <div>
              <h3 className="text-2xl font-semibold text-black mb-3">
                Principles We Design By
              </h3>
              <p className="text-sm sm:text-base text-slate-600">
                We believe GRC tools should feel intuitive, mission-aligned,
                and responsive to the realities of federal work, not just
                compliance checklists.
              </p>
              <div className="mt-10 flex flex-wrap gap-4 text-xs sm:text-sm text-black">
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
          
          </div>
        </div>

        {/* Stats cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-3xl bg-white border border-slate-200 px-6 py-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.10)] flex flex-col items-center">
            <p className="text-3xl sm:text-5xl font-semibold text-sky-700">
              20+
            </p>
            <p className="mt-3 text-[11px] sm:text-lg font-semibold text-slate-600">
              Years Average Federal &amp; Industry Experience
            </p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200 px-6 py-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.10)] flex flex-col items-center">
            <p className="text-3xl sm:text-5xl font-semibold text-sky-700">
              6
            </p>
            <p className="mt-3 text-[11px] sm:text-lg font-semibold text-slate-600">
              Core Disciplines Across Cyber, Privacy, Data, and GRC
            </p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-200 px-6 py-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.10)] flex flex-col items-center">
            <p className="text-3xl sm:text-5xl font-semibold text-sky-700">
              3
            </p>
            <p className="mt-3 text-[11px] sm:text-lg font-semibold text-slate-600">
              Continents of Mission Experience and Delivery
            </p>
          </div>
        </div>

        {/* Full-width quote / philosophy */}
        <div className="mt-10 rounded-3xl bg-white border border-slate-200 px-6 sm:px-12 py-10 sm:py-12 text-center shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
          <div className="flex flex-col items-center gap-4 max-w-3xl mx-auto">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 border border-sky-100">
              <Quote className="h-6 w-6 text-sky-600" />
            </div>
            <p className="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed">
              “We built GovSecurity360 to move federal security programs beyond static, document-driven compliance. Towards live, actionable visibility into risk that directly supports mission outcomes.”
            </p>
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 mt-10 mb-4">
        <div className="h-px bg-slate-200/70" />
      </div>

      {/* Contact Section */}
      <section
        id="contact"
        className="relative py-20 px-6 sm:px-8 lg:px-12 max-w-6xl mx-auto"
      >
        <div className="rounded-3xl bg-white border border-slate-200 px-6 sm:px-10 py-8 sm:py-10 shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start">
            <div className="text-left space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Contact Us
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Share a bit about your mission, environment, or how you&apos;re thinking
                about intelligent GRC. We&apos;ll follow up with tailored next steps and a secure demo.
              </p>
              <ul className="space-y-1 text-xs sm:text-sm text-slate-500">
                <li>• Ideal for CISOs, CIOs, CAIOs, and GRC leaders</li>
                <li>• Designed for federal, state, and integrator teams</li>
                <li>• No marketing spam, just focused follow-up</li>
              </ul>
            </div>
            <div className="mt-2 md:mt-0">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
