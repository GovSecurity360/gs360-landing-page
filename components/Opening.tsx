"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useInView, useScroll, useTransform, MotionConfig } from "framer-motion"
import { ArrowRight, Shield, Globe, Layers, Menu, X } from "lucide-react"

const APPLE_PRIMARY_BTN =
  "relative overflow-hidden rounded-full bg-white text-slate-950 ring-1 ring-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out hover:shadow-[0_14px_42px_rgba(0,0,0,0.45)] hover:scale-[1.02] active:scale-[0.98] before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.9),transparent_55%)] before:opacity-80 after:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35),transparent_35%,rgba(0,0,0,0.08))]"

const APPLE_SECONDARY_BTN =
  "relative overflow-hidden rounded-full bg-white/5 text-white ring-1 ring-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-300 ease-out hover:bg-white/8 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)] hover:scale-[1.02] active:scale-[0.98] before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_55%)] after:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),transparent_40%,rgba(0,0,0,0.20))]"

const APPLE_PRIMARY_BTN_DARK =
  "relative overflow-hidden rounded-full bg-slate-950 text-white ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-none before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.20),transparent_55%)] before:opacity-80 after:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),transparent_40%,rgba(0,0,0,0.35))]"

function AnimatedBackground() {
  const [binaryText, setBinaryText] = useState("")

  useEffect(() => {
    let raf = 0

    const buildBinary = () => {
      // Render a continuous hex stream that fills the full width.
      // (No per-hash chunking/spaces; we generate fixed-width lines of raw hex.)

      // Match the CSS font settings below (monospace, ~11px)
      const measureCharPx = () => {
        const el = document.createElement("span")
        el.style.position = "absolute"
        el.style.visibility = "hidden"
        el.style.whiteSpace = "pre"
        el.style.fontFamily =
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        el.style.fontSize = "11px"
        el.textContent = "0".repeat(120)
        document.body.appendChild(el)
        const w = el.getBoundingClientRect().width
        el.remove()
        const px = w / 120
        return Number.isFinite(px) && px > 0 ? px : 7
      }

      const charPx = measureCharPx()
      const lineChars = Math.max(80, Math.floor(window.innerWidth / charPx) - 2)

      const randomHex = (n: number) => {
        // Generate exactly `n` hex characters.
        const bytesNeeded = Math.ceil(n / 2)
        try {
          const bytes = new Uint8Array(bytesNeeded)
          crypto.getRandomValues(bytes)
          const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
          return hex.slice(0, n)
        } catch {
          let out = ""
          for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 16).toString(16)
          return out
        }
      }

      // One viewport per copy; the duplicated text makes a seamless bounded loop.
      const linePx = 11 * 1.25
      const rowsTarget = Math.ceil(window.innerHeight / linePx) + 4

      const rows: string[] = []
      for (let r = 0; r < rowsTarget; r++) {
        rows.push(randomHex(lineChars))
      }

      setBinaryText(rows.join("\n") + "\n")
    }

    buildBinary()

    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(buildBinary)
    }

    window.addEventListener("resize", onResize, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
    }
  }, [])

  const dataStreams = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: (i * 7) % 100,
    delay: (i * 0.4) % 4,
    duration: 3 + (i % 3),
    opacity: 0.2 + (i % 3) * 0.1,
  }))

  const glitchLines = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    top: 10 + i * 12,
    delay: i * 0.2,
  }))

  return (
    <div className="animated-bg" style={{ ["--hash-speed" as any]: "200s" }}>
      <div className="hex-grid" />
      <div className="cyber-grid" />
      <div className="circuit-traces" />
      {dataStreams.map((s) => (
        <div
          key={s.id}
          className="data-stream"
          style={{
            left: `${s.left}%`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            opacity: s.opacity,
          }}
        />
      ))}
      <div className="cyber-glow" />
      <div className="cyber-glow" />
      <div className="cyber-glow" />
      <div className="logo-emblem" />
      <div className="scan-line" />
      <div className="scan-line" />
      <div className="glitch-lines">
        {glitchLines.map((line) => (
          <div
            key={line.id}
            className="glitch-line"
            style={{
              top: `${line.top}%`,
              animationDelay: `${line.delay}s`,
            }}
          />
        ))}
      </div>
      <div
        className="binary-overlay"
        style={{
          opacity: 0.1,
          color: "rgba(255, 255, 255, 0.88)",
          textShadow: "0 0 6px rgba(255,255,255,0.22)",
        }}
      >
        <div className="binary-loop" aria-hidden>
          {binaryText}{binaryText}
        </div>
      </div>
      <div className="cyber-scanlines" />
      <div className="grain-overlay" />
      <div className="vignette" />
    </div>
  )
}

function AnimatedText({ children, delay = 0 }: { children: string; delay?: number }) {
  const words = children.split(" ")
  return (
    <span className="inline">
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: delay + i * 0.05, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full ${className}`}
    />
  )
}

function Header({ solidBg = false }: { solidBg?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)

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

          <nav className="hidden md:flex items-center gap-6">
            {["Platform", "Demo", "About"].map((item, i) => (
              <motion.a
                key={item}
                href={
                  item === 'Demo'
                    ? '#fips199-demo'
                    : `#${item.toLowerCase()}`
                }
                className="text-sm text-slate-300 hover:text-slate-50 transition-colors link-underline"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <motion.a
              href="#contact"
              className={`${APPLE_PRIMARY_BTN} px-4 py-2 text-sm font-medium`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
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
            <div className="flex flex-col gap-4">
              {["Platform", "Demo", "About"].map((item) => (
                <a
                  key={item}
                  href={
                    item === 'Demo'
                      ? '#fips199-demo'
                      : `#${item.toLowerCase()}`
                  }
                  className="text-slate-300 hover:text-slate-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setMobileOpen(false)}
                className={`${APPLE_PRIMARY_BTN} px-4 py-2 text-sm font-medium text-center mt-2`}
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </motion.div>
    </header>
  )
}

function HeroSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100])

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <FloatingOrb className="w-[600px] h-[600px] bg-white/5 blur-[120px] -top-40 -left-40" delay={0} />
      <FloatingOrb className="w-[500px] h-[500px] bg-white/5 blur-[100px] -bottom-20 -right-20" delay={2} />
      <FloatingOrb className="w-[300px] h-[300px] bg-white/10 blur-[80px] top-1/2 left-1/2" delay={4} />

      <div className="absolute inset-0 grid-pattern opacity-50" />

      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-32 pb-20"
        style={{ opacity, scale, y }}
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
          <motion.a
            href="#contact"
            className={`${APPLE_PRIMARY_BTN} px-8 py-4 text-base font-medium flex items-center gap-2 group`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Request Demo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.a>
          <motion.a
            href="#platform"
            className={`${APPLE_SECONDARY_BTN} px-8 py-4 text-base font-medium`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Explore Platform
          </motion.a>
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
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


export default function Opening() {
  const ref = useRef<HTMLDivElement>(null)
  const visible = useInView(ref, { margin: "100px" })
  const [tabVisible, setTabVisible] = useState(true)

  useEffect(() => {
    const syncVisibility = () => setTabVisible(!document.hidden)
    syncVisibility()
    document.addEventListener("visibilitychange", syncVisibility)
    return () => document.removeEventListener("visibilitychange", syncVisibility)
  }, [])
  return (
    <MotionConfig reducedMotion="user">
      <div ref={ref} className="opening" id="top">
        <Header solidBg />
        {visible && tabVisible && <AnimatedBackground />}
        <HeroSection />
      </div>
    </MotionConfig>
  )
}
