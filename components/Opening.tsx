"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, MotionConfig } from "framer-motion"
import { ArrowRight, Shield, Globe, Layers, Menu, X } from "lucide-react"
import ShaBackground, { openingTransition } from "./ShaBackground"
import { mountSceneJourney } from "@/lib/scene-controller"

const navigation = [
  { label: "Platform", id: "platform" },
  { label: "Demo", id: "fips199-demo" },
  { label: "About", id: "about" },
]

function AnimatedText({ children, delay = 0 }: { children: string; delay?: number }) {
  const words = children.split(" ")
  return (
    <span className="inline">
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + i * 0.05, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

function Header({ solidBg = false }: { solidBg?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const sections = [...navigation.map(item => item.id), "contact"]
      .map(id => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null)
    let frame = 0
    const update = () => {
      frame = 0
      const journey = document.getElementById("top")
      if (journey?.dataset.sceneMode === "pinned") {
        const scene = journey.dataset.activeScene
        setActiveSection(scene === "workflow" ? "platform" : scene === "opening" ? null : scene ?? null)
        return
      }
      const readingLine = Math.min(120, window.innerHeight * 0.22)
      const current = sections.find(section => {
        const bounds = section.getBoundingClientRect()
        const bottom = section.id === "platform"
          ? document.getElementById("platform-details")?.getBoundingClientRect().bottom ?? bounds.bottom
          : bounds.bottom
        return bounds.top <= readingLine && bottom > readingLine
      })
      setActiveSection(current?.id ?? null)
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    // Resizing a section (demo results, portraits, mobile layout) can move
    // the reading position without a scroll event.
    const observer = new ResizeObserver(schedule)
    sections.forEach(section => observer.observe(section))
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    window.addEventListener("gs360:scenechange", schedule)
    schedule()
    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("gs360:scenechange", schedule)
    }
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        solidBg ? "bg-black/95 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)]" : ""
      }`}
    >
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className="mx-auto max-w-7xl px-6 py-3"
      >
        <div className="flex items-center justify-between">
          <motion.a
            href="#"
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src="/brand-icon.webp"
              alt="GS360 logo"
              className="h-7 w-auto"
            />
            <span className="font-montserrat text-base tracking-tight text-slate-50">
              GovSecurity360
            </span>
          </motion.a>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
            {navigation.map((item, i) => (
              <motion.a
                key={item.id}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? "location" : undefined}
                className="site-nav-link text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <motion.a
              href="#contact"
              className="site-button site-button--light site-button--compact"
              aria-current={activeSection === "contact" ? "location" : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Get Started
            </motion.a>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-slate-50"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-4">
              {navigation.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  aria-current={activeSection === item.id ? "location" : undefined}
                  className="site-nav-link site-nav-link--mobile"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className="site-button site-button--light mt-2"
                aria-current={activeSection === "contact" ? "location" : undefined}
              >
                Get Started
              </a>
            </nav>
          </motion.div>
        )}
      </motion.div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="opening-hero relative min-h-screen flex items-center justify-center overflow-hidden">
      <motion.div
        className="opening-content relative z-10 max-w-5xl mx-auto px-6 text-center pt-32 pb-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-300 tracking-wider">NOW LAUNCHED</span>
        </motion.div>

        <h1 className="font-montserrat text-5xl sm:text-7xl md:text-8xl tracking-tight leading-[0.9] mb-8 text-slate-50">
          <AnimatedText delay={0.2}>Security</AnimatedText>
          <br />
          <span>
            <AnimatedText delay={0.4}>Intelligence</AnimatedText>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto mb-12 text-balance"
        >
          Simple | Seamless | Secure
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#contact"
            className="site-button site-button--light site-button--hero"
          >
            Request Demo
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#platform"
            className="site-button site-button--outline site-button--hero"
          >
            Explore Platform
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-20 flex items-center justify-center gap-8 sm:gap-16 text-slate-400"
        >
          {[
            { label: "NIST 800-53", icon: Shield },
            { label: "FedRAMP", icon: Layers },
            { label: "OSCAL Native", icon: Globe },
          ].map((item, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2 text-xs font-mono tracking-wider"
              whileHover={{ color: "#fff" }}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <div
        className="opening-scroll-cue absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2">
          <div
            className="w-1 h-2 rounded-full bg-white/40"
          />
        </div>
      </div>
    </section>
  )
}


export type JourneyScene = { id: string; label: string; content: React.ReactNode; className?: string }

export default function Opening({ scenes }: { scenes: JourneyScene[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const journey = useRef<ReturnType<typeof mountSceneJourney> | null>(null)
  const [tabVisible, setTabVisible] = useState(true)
  const handoff = useRef(openingTransition(0))

  useEffect(() => {
    if (!ref.current) return
    const controller = mountSceneJourney(ref.current, handoff)
    journey.current = controller
    return () => { controller.dispose(); journey.current = null }
  }, [])

  useEffect(() => {
    const syncVisibility = () => setTabVisible(!document.hidden)
    syncVisibility()
    document.addEventListener("visibilitychange", syncVisibility)
    return () => document.removeEventListener("visibilitychange", syncVisibility)
  }, [])

  const allScenes: JourneyScene[] = [
    { id: "opening", label: "Opening", content: <HeroSection /> },
    ...scenes,
  ]
  return (
    <MotionConfig reducedMotion="user">
      <div className="shared-experience">
        {tabVisible && <ShaBackground handoff={handoff} />}
        <div ref={ref} className="opening scene-experience" id="top">
          <Header solidBg />
          <div className="scene-stage">
            {allScenes.map(scene => (
              <div key={scene.id} className="scene-panel" data-scene-id={scene.id}>
                <div className={`journey-content ${scene.className ?? ""}`}>
                  {scene.content}
                </div>
              </div>
            ))}
            <div className="scene-scan-line" aria-hidden="true" />
            <nav className="scene-controls" aria-label="Choose a scene">
              {allScenes.map((scene, index) => (
                <button key={scene.id} type="button" onClick={() => journey.current?.goTo(scene.id)}>
                  {String(index + 1).padStart(2, "0")} <span>{scene.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
