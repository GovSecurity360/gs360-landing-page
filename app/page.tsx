/* eslint-disable */
"use client"

import React, { useEffect, useRef, useState } from "react"
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowUpRight, Shield, Zap, Globe, Layers, Check, Menu, X } from "lucide-react"
import dynamic from "next/dynamic"

const APPLE_PRIMARY_BTN =
  "relative overflow-hidden rounded-full bg-white text-slate-950 ring-1 ring-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out hover:shadow-[0_14px_42px_rgba(0,0,0,0.45)] hover:scale-[1.02] active:scale-[0.98] before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.9),transparent_55%)] before:opacity-80 after:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.35),transparent_35%,rgba(0,0,0,0.08))]"

const APPLE_SECONDARY_BTN =
  "relative overflow-hidden rounded-full bg-white/5 text-white ring-1 ring-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-300 ease-out hover:bg-white/8 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)] hover:scale-[1.02] active:scale-[0.98] before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.18),transparent_55%)] after:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),transparent_40%,rgba(0,0,0,0.20))]"

const APPLE_PRIMARY_BTN_DARK =
  "relative overflow-hidden rounded-full bg-slate-950 text-white ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-none before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.20),transparent_55%)] before:opacity-80 after:content-[''] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(to_bottom,rgba(255,255,255,0.10),transparent_40%,rgba(0,0,0,0.35))]"

type Tone = "dark" | "light"


const InteractiveGlobe = dynamic(() => import("../components/InteractiveGlobe"), { ssr: false })

class GlobeErrorBoundary extends React.Component<
  { tone: Tone; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(err: unknown) {
    // Don’t crash the whole page if WebGL/R3F fails.
    console.error("InteractiveGlobe crashed:", err)
  }

  render() {
    if (this.state.hasError) return <GlobeFallback tone={this.props.tone} />
    return this.props.children
  }
}

function GlobeFallback({ tone }: { tone: Tone }) {
  const stroke = tone === "light" ? "rgba(15, 76, 115, 0.28)" : "rgba(158, 216, 255, 0.28)"
  const stroke2 = tone === "light" ? "rgba(15, 76, 115, 0.18)" : "rgba(158, 216, 255, 0.18)"

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-full"
      aria-hidden
    >
      <circle cx="100" cy="100" r="92" fill="none" stroke={stroke} strokeWidth="2" />
      {/* Latitudes */}
      <ellipse cx="100" cy="100" rx="78" ry="30" fill="none" stroke={stroke2} strokeWidth="1.5" />
      <ellipse cx="100" cy="100" rx="78" ry="55" fill="none" stroke={stroke2} strokeWidth="1.5" />
      {/* Longitudes */}
      <ellipse cx="100" cy="100" rx="30" ry="78" fill="none" stroke={stroke2} strokeWidth="1.5" />
      <ellipse cx="100" cy="100" rx="55" ry="78" fill="none" stroke={stroke2} strokeWidth="1.5" />
      {/* Simple “continent” squiggles (lightweight placeholder) */}
      <path
        d="M58 82c10-14 26-22 44-22 14 0 26 4 36 12-8 2-16 6-22 12-10 10-12 22-26 28-12 6-24 2-32-6-6-6-6-14 0-24z"
        fill="none"
        stroke={stroke2}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M116 120c8-8 20-10 30-6 10 4 16 14 14 22-2 8-12 14-22 14-10 0-20-6-22-14-2-6-2-10 0-16z"
        fill="none"
        stroke={stroke2}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const AGENCY_HASH_LINES = [
  "913a52c3c97e937d7a42531a3014c2437648f5728a303664fa72a76f634129532588358e2a364a51989417852c0f994f31b53e7f9104fa2854911075630327f2",
  "c2985172044cc1848b59d9c2409825b441f77d34328373b64c1187428f64e29712a88481308d279e83605c30b209e513813c9e31d4d620593c5d6e2c949c3365",
  "0d359c402b8d003460df643c7b3be64a3efd8544a478b0c80c102a90198089c25f462580a6c6a49591e3e7f6e30097f4803d1565cc52f1e63d35b5a75877c385",
  "8856c1f103d36b7012d93e5069b222384a362a93325c89307d12f1165a6c384e6224e72782e4e0b0e5ce67540203f56d9573887c2c9927622955f265b7964b49",
  "d6c39f045051152a657e4e137b01859c0490f23075c3f91599d12a39626b801a2310065a4628ff3a08d29759d57a2245b98f58b0f948f219580a43063870678d",
  "2ef4d86b7713e792c3a504c55217ff570a256950787e9c5a1532f741584c30c80d8537553f191143c683b745422ffb769642e88a3857e3f2081d596495f553be",
  "85a87850989f666f44d8b671a539050d5f8485295c5163b843393963286b9760773d726b8f1b63577d6199b5a88e0a6d595806655c65b169b5963a5f80b067a5",
  "026217646536b510c4f826048184d09337efb3227916fae053a473217d125439589d892ff79ef796245f949c5e7b75299447e1744161b96277255909873d1f04",
  "667f3378f7253457a80fa35688539ed3013894874c935b809a7b60098f45a0e0543e33c6ef12845c485459345c207908b6134a41300974f17f415951d668c12a",
  "679261a35560b4a706b29f7f45143a598a4d7d3c015707732a31d90e0b4010373248386f78f65511e646274e1d157a44f51950e4179e875699318b71d60064d7",
  "c2a4b958e727e4e13998b50663673c687b32873427845f1b1b3699c27f30026e6328ecf8449c4701292021570d8a594894371fa79344f6f71d1872583d47d46c",
  "b0e3d16960b777a82b4661858e9942a00c60f2746487950c057cc88849b28a8d438944516314c194a2b27076c8c48a73426e9526e594b29b691079d2b2700e36",
  "6d84989050d2698942b033f99b1a5e12f913d09a2468351545672d9e115ce9a8966ec0155b446a81665a58579977e231b53e4b7b252084c833294c7764843465",
  "c049b49b38ed6b1c556f8f5539d89b3f360e227a8581c81559e394043b37905d6a2e4827018c18731304d981881735d518206d289299d6d7d6f51f422e171b31",
  "761e86a9f73f27f1c1f107f0f679e009405b0b493864705a610996881c15f9af5912ce3f619e048123cc7f3ce37c76899732f9153093950d287178c1b3f94639",
  "338d821262d0f5198e3b5e4359427b0c8d17b2f442f4b52b3149dfc3b2f5170d195a63901b006612d46e99596041c9b20e28f35213601831846b043c945b0a34",
  "f41b7145b5971a17fa2b6ccf5d6f1a8e13d969796e95af445037d2f44c4b638f286810a95c4793f77df5543c7b801a884813c02d1847c0b898d9753c13031139",
  "9d37803e7c845b410495393a62d03a110a26e828135835b869403d15a5193910547781b0f5926c48325a7a726615b3c3c3a4f32e987c268a715f458516089851",
  "0329c29d009b0b60d05513915152865ffb515f40078b17b204642f492b45e7f17b3c4f745e851a665977a407e38719f9411d51a6136113b246a3286f376a8d05",
  "100778c1505312389d71457a66b9ef2567923485c9603d6d0615553e7d56e2978f44d5a9d8ed07c40d1f4b277b75f80f68853b0a701a5501867e3873429e373c",
  "e1190226c6d042173e21245020c7d4221ec8c8c227e7f6782c3c434914a29a21b369c02506b3a0a38f45a6006f23608d81335c9428383a15234125f44810f719",
  "c4d97a5559c58e727e056976f620f305f2fa6b3383088b9c6f24c7f1a30f3676c8c7d5c96d54238779b76c813732d84954471719b023594191c95a00445a49ac",
  "01d782161f365313a078e8741369527f7112959800e882a898b7f8303d2e9c148c3453315a63901b006612d46e99596041c9b20e28f3521345d81b4d3202677",
  "f9d658a3a0e1b212891965c4902319c5040d1645391d8486981451f165e3810d29759d57a2245b98f58b0f948f219580a43063870678d380e32561912f7180",
  "3c961e0e84b2569260c1d68600a73d3170a75f1df649f874d1df00311f99c92694b4131238e218c7c941e7d23d858348b6187760920f7815b399d854045f8f2",
  "741492b45e7f17b204642f492b45e7f17b3c4f745e851a665977a407e38719f9411d51a6136113b246a3286f376a8d052d9a21b369c02506b3a0a38f45a6006f",
  "693a20e4027734a74281315570220c4e1a6c4217117b43f1146313b63297a77e9282362b9a135835b869403d15a5193910547781b0f5926c48325a7a726615b3",
  "d3f219c0117d91f165e3810d29759d57a2245b98f58b0f948f219580a43063870678d380e32561912f718063901b006612d46e99596041c9b20e28f3521360183",
  "26c92d53d2698942b033f99b1a5e12f913d09a2468351545672d9e115ce9a8966ec0155b446a81665a58579977e231b53e4b7b252084c833294c7764843465",
  "2154506c1015f60b4a706b29f7f45143a598a4d7d3c015707732a31d90e0b4010373248386f78f65511e646274e1d157a44f51950e4179e875699318b71d60064d7",
  "771241169622d1410d8a425e4c6020556f8f5539d89b3f360e227a9665a58579977e231b53e4b7b252084c833294c7764843465913a52c3c97e937d7a42531a",
  "03d98767e7c9f801e8c95a00445a49acc4d97a5559c58e727e056976f620f305f2fa6b3383088b9c6f24c7f1a30f3676c8c7d5c96d54238779b76c813732d8495",
  "b03a20e4027734a74281315570220c4e1a6c4217117b43f1146313b63297a77e9282362b9a135835b869403d15a5193910547781b0f5926c48325a7a726615b3",
  "16c4217117b43f1146313b63297a77e9282362b9a135835b869403d15a5193910547781b0f5926c48325a7a726615b3c3c3a4f32e987c268a715f458516089851",
  "73c15d48293963286b9760773d726b8f1b63577d6199b5a88e0a6d595806655c65b169b5963a5f80b067a5b3f27f1c1f107f0f679e009405b0b493864705a610996",
  "54c47f9f36f6d6f44d8b671a539050d5f8485295c5163b843393963286b9760773d726b8f1b63577d6199b5a88e0a6d595806655c65b169b5963a5f80b067a5",
  "10c80c102a90198089c25f46258089c25f462580a6c6a49591e3e7f6e30097f4803d1565cc52f1e63d35b5a75877c3858c8c227e7f6782c3c434914a29a21b369c",
  "6d420f8c3c434914a29a21b369c02506b3a0a38f45a6006f23608d81335c9428383a15234125f44810f719b3f27f1c1f107f0f679e009405b0b493864705a610996",
  "33c6ef12845c485459345c207908b6134a41300974f17f415951d668c12a7a42531a3014c2437648f5728a303664fa72a76f634129532588358e2a364a51989417",
  "8344f6f71d1872583d47d46cc2a4b958e727e4e13998b50663673c687b32873427845f1b1b3699c27f30026e6328ecf8449c4701292021570d8a594894371fa7",
  "2044cc1848b59d9c2409825b441f77d34328373b64c1187428f64e29712a88481308d279e83605c30b209e513813c9e31d4d620593c5d6e2c949c3365c298517204",
  "f4832588358e2a364a51989417852c0f994f31b53e7f9104fa2854911075630327f2913a52c3c97e937d7a42531a3014c2437648f5728a303664fa72a76f634129",
] as const

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

      // 11px font * 1.25 line-height ≈ ~14px/line
      const linePx = 14
      // Generate enough rows so the loop never shows empty space while scrolling.
      const rowsTarget = Math.max(520, Math.ceil(window.innerHeight / linePx) + 420)

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
    <motion.div
      className={`absolute rounded-full ${className}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  )
}

function Header({ solidBg = false }: { solidBg?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 ${
        solidBg ? "bg-black/95 backdrop-blur-md border-b border-white/10" : ""
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
              src="/favicon.png"
              alt="GS360 logo"
              className="h-7 w-auto"
            />
            <span className="font-montserrat text-base font-bold tracking-tight text-slate-50">
              GS360
            </span>
          </motion.a>

          <nav className="hidden md:flex items-center gap-6">
            {["Platform", "Solutions", "About"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
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
            className="md:hidden p-2 text-slate-50"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4"
          >
            <div className="flex flex-col gap-4">
              {["Platform", "Solutions", "About"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-slate-300 hover:text-slate-50 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {item}
                </a>
              ))}
              <a
                href="#contact"
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
          <span className="text-xs font-mono text-slate-300 tracking-wider">NOW IN PRIVATE BETA</span>
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

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border border-white/20 flex justify-center pt-2">
          <motion.div
            className="w-1 h-2 rounded-full bg-white/40"
            animate={{ y: [0, 8, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  index,
  tone = "dark",
}: {
  icon: typeof Shield
  title: string
  description: string
  features: string[]
  index: number
  tone?: Tone
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      className={`card rounded-3xl p-8 hover-lift ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.25, 0.4, 0.25, 1] }}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
          tone === "light" ? "bg-slate-50 border border-slate-200" : "bg-white/5 border border-white/10"
        }`}
      >
        <Icon className={`w-5 h-5 ${tone === "light" ? "text-slate-900" : "text-white"}`} />
      </div>
      <h3 className={`font-syne text-2xl font-bold mb-3 ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>{title}</h3>
      <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mb-6 leading-relaxed`}>{description}</p>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className={`flex items-start gap-3 text-sm ${tone === "light" ? "text-slate-800" : "text-slate-100"}`}>
            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function PlatformSection({ tone = "dark" }: { tone?: Tone }) {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { amount: 0.25 })

  const platformCards = [
    {
      icon: Shield,
      title: "Live Risk Command",
      description:
        "Real-time visibility into your organization's security posture with unified risk dashboards.",
      features: [
        "Unified view of controls, risks, and POA&Ms",
        "OSCAL-native data model",
        "Continuous CDM and CMRS alignment",
      ],
    },
    {
      icon: Layers,
      title: "Mission Workflows",
      description:
        "Purpose-built for federal government with experience-driven, OSCAL-enabled workflows.",
      features: [
        "Align security, privacy, and mission",
        "Connect systems and controls",
        "Design for ATO and monitoring",
      ],
    },
    {
      icon: Zap,
      title: "AI Governance",
      description:
        "Reduce compliance timelines and accelerate assessments with proactive AI intelligence.",
      features: [
        "AI-assisted control narratives",
        "Prioritized risk actions",
        "CDM-aligned dashboards",
      ],
    },
  ] as const

  const cardCount = platformCards.length
  const [activeCard, setActiveCard] = useState(0)

  // Pinned area ref used to determine when to intercept wheel/touch.
  const pinRef = useRef<HTMLDivElement>(null)

  // Virtual progress (0..1) that we control ourselves (instead of page scroll)
  const progressRef = useRef(0)
  // When we hit the top/bottom edge (progress 0 or 1), briefly hold and swallow momentum
  // so a fast scroll doesn’t fling the user past the section.
  const edgeHoldUntilRef = useRef(0)
  const setProgress = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next))
    progressRef.current = clamped
    const idx = Math.min(cardCount - 1, Math.max(0, Math.round(clamped * (cardCount - 1))))
    setActiveCard(idx)
  }

  // Globe rotation speed: idle + boost on interaction
  const [globeSpeed, setGlobeSpeed] = useState(0.12)
  const boostRef = useRef(0)
  const decayRafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (decayRafRef.current) cancelAnimationFrame(decayRafRef.current)
      decayRafRef.current = null
    }
  }, [])

  useEffect(() => {
    const base = 0.12
    const maxBoost = 0.9

    const bumpGlobe = (deltaY: number) => {
      const intensity = Math.min(1, Math.abs(deltaY) / 500)
      boostRef.current = Math.min(maxBoost, intensity * maxBoost)
      setGlobeSpeed(base + boostRef.current)

      if (decayRafRef.current) cancelAnimationFrame(decayRafRef.current)
      const decay = () => {
        boostRef.current = boostRef.current * 0.92
        const next = base + boostRef.current
        setGlobeSpeed(next)
        if (boostRef.current > 0.01) {
          decayRafRef.current = requestAnimationFrame(decay)
        } else {
          boostRef.current = 0
          setGlobeSpeed(base)
          decayRafRef.current = null
        }
      }
      decayRafRef.current = requestAnimationFrame(decay)
    }

    // Roughly ~900px of wheel travel per “step” between cards
    const totalPx = Math.max(900, (cardCount - 1) * 900)

    // Intercept when the pinned interaction block crosses an “active band” line in the viewport.
    // This avoids locking too early (before the globe/card are in view), while still catching fast scrolls.
    const isPinInActiveBand = () => {
      const el = pinRef.current
      if (!el) return false
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const bandY = vh * 0.55 // about mid-lower screen
      return r.top < bandY && r.bottom > bandY
    }

    const getCutTop = () => {
      const cut = document.getElementById("content-cut")
      if (!cut) return -9999
      return cut.getBoundingClientRect().top
    }

    // Fixed header/banner height (so we treat "top" as just below the header).
    const getHeaderH = () => {
      const header = document.querySelector("header")
      const h = header ? header.getBoundingClientRect().height : 0
      return Number.isFinite(h) ? h : 0
    }

    // DOWN: only lock once the cut has passed under the fixed header
    // (meaning the blue hero is no longer visible).
    const isPastBlueBackground = () => {
      const headerH = getHeaderH()
      return getCutTop() <= headerH
    }

    // UP: only lock when we're close to the cut boundary under the header
    // (just before blue would reappear).
    const isNearBlueBackgroundEdge = () => {
      const headerH = getHeaderH()
      const t = getCutTop()
      return t <= headerH && t >= headerH - 180
    }

    const wheelOpts: AddEventListenerOptions = { passive: false, capture: true }
    const touchMoveOpts: AddEventListenerOptions = { passive: false, capture: true }

    const onWheel = (e: WheelEvent) => {
      // Only lock when the pinned interaction block is actually in the active band.
      if (!isPinInActiveBand()) return

      const now = performance.now()
      if (now < edgeHoldUntilRef.current) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      const dyRaw = e.deltaY
      const dy = Math.max(-220, Math.min(220, dyRaw))
      if (!dy) return

      // Gate locking based on blue/white boundary.
      if (dy > 0) {
        // DOWN: don't lock until the blue hero is gone.
        if (!isPastBlueBackground()) return
      } else {
        // UP: don't lock until we're near the top edge of the white content.
        if (!isNearBlueBackgroundEdge()) return
      }

      const p = progressRef.current

      // Only lock if we're still progressing inside this section
      const shouldLock = (dy > 0 && p < 1) || (dy < 0 && p > 0)
      if (!shouldLock) return

      e.preventDefault()
      e.stopPropagation()

      const nextRaw = p + dy / totalPx
      const next = Math.max(0, Math.min(1, nextRaw))
      setProgress(next)
      bumpGlobe(dy)

      // If we just hit an edge in the direction of travel, briefly swallow inertia
      // so the page doesn't fling past the section.
      if ((dy > 0 && next >= 1) || (dy < 0 && next <= 0)) {
        edgeHoldUntilRef.current = now + 220
      }
    }

    // Touch support
    let lastTouchY: number | null = null
    const onTouchStart = (e: TouchEvent) => {
      if (!isPinInActiveBand()) return
      lastTouchY = e.touches[0]?.clientY ?? null
    }
    const onTouchMove = (e: TouchEvent) => {
      if (!isPinInActiveBand()) return
      if (lastTouchY == null) return

      const now = performance.now()
      if (now < edgeHoldUntilRef.current) {
        e.preventDefault()
        return
      }

      const y = e.touches[0]?.clientY
      if (y == null) return

      const dyRaw = lastTouchY - y // swipe up => scroll down
      const dy = Math.max(-220, Math.min(220, dyRaw))

      if (!dy) {
        lastTouchY = y
        return
      }

      // Gate locking based on blue/white boundary.
      if (dy > 0) {
        if (!isPastBlueBackground()) {
          lastTouchY = y
          return
        }
      } else {
        if (!isNearBlueBackgroundEdge()) {
          lastTouchY = y
          return
        }
      }

      const p = progressRef.current
      const shouldLock = (dy > 0 && p < 1) || (dy < 0 && p > 0)
      if (!shouldLock) return

      e.preventDefault()
      const nextRaw = p + dy / totalPx
      const next = Math.max(0, Math.min(1, nextRaw))
      setProgress(next)
      bumpGlobe(dy)

      if ((dy > 0 && next >= 1) || (dy < 0 && next <= 0)) {
        edgeHoldUntilRef.current = now + 220
      }

      lastTouchY = y
    }
    const onTouchEnd = () => {
      lastTouchY = null
    }

    window.addEventListener("wheel", onWheel, wheelOpts)
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, touchMoveOpts)
    window.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener("wheel", onWheel as any, wheelOpts)
      window.removeEventListener("touchstart", onTouchStart as any)
      window.removeEventListener("touchmove", onTouchMove as any, touchMoveOpts)
      window.removeEventListener("touchend", onTouchEnd as any)
    }
  }, [cardCount])

  const metrics = [
    {
      icon: Shield,
      label: "ATO Readiness",
      value: "Faster",
      title: "Move from static compliance to live posture",
      points: [
        "Traceable controls → systems → evidence",
        "OSCAL-ready artifacts and exports",
        "POA&M and risk tracking aligned to mission",
      ],
    },
    {
      icon: Zap,
      label: "Continuous Monitoring",
      value: "Always-on",
      title: "Operationalize risk with real signals",
      points: [
        "Unify CDM/CMRS inputs into one view",
        "Prioritize actions with impact context",
        "Reduce drift with workflow-based follow-through",
      ],
    },
  ]

  const card = platformCards[activeCard]
  const Icon = card.icon

  // Use a content-driven height so the globe/card appear immediately under the heading.
  const stickyHeightClass = "min-h-[520px] lg:min-h-[560px]"

  return (
    <section id="platform" ref={sectionRef} className="relative px-6 pt-20 pb-20 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
        >
          <span className={`section-label mb-4 block ${tone === "light" ? "!text-slate-500" : ""}`}>
            Platform
          </span>
          <h2
            className={`font-syne text-4xl sm:text-5xl md:text-6xl font-bold mb-6 ${
              tone === "light" ? "text-slate-950" : "text-slate-50"
            }`}
          >
            Intelligent GRC
            <br />
            <span className="gradient-text">in action</span>
          </h2>
          <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} text-lg`}>
            A unified command center for real-time, comprehensive insight into enterprise and cybersecurity risks through a single pane of glass.
          </p>
        </motion.div>

        {/* Pinned interaction area (locked scroll) */}
        <div className="relative mt-6">
          <div ref={pinRef} className={`${stickyHeightClass} flex items-start pt-6`}>
            <div className="w-full grid lg:grid-cols-2 gap-10 items-center">
              {/* Globe */}
              <div className="flex justify-center">
                <div
                  className="relative"
                  style={{ width: "min(84vw, 520px)", height: "min(84vw, 520px)" }}
                  aria-hidden
                >
                  <div className="absolute inset-0 pointer-events-none">
                    <GlobeErrorBoundary tone={tone}>
                      <div className="w-full h-full">
                        <React.Suspense fallback={null}>
                          <InteractiveGlobe rotationSpeed={globeSpeed} />
                        </React.Suspense>
                      </div>
                    </GlobeErrorBoundary>
                  </div>

                  <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{
                      border: tone === "light" ? "1px solid rgba(15, 76, 115, 0.18)" : "1px solid rgba(158, 216, 255, 0.18)",
                      boxShadow: tone === "light" ? "0 0 0 1px rgba(15, 76, 115, 0.06)" : "0 0 0 1px rgba(158, 216, 255, 0.06)",
                    }}
                  />
                </div>
              </div>

              {/* Card */}
              <div className="flex justify-center lg:justify-start">
                <div className="w-full max-w-xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCard}
                      initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                      transition={{ duration: 0.25 }}
                      className={`card rounded-3xl p-8 hover-lift ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                          tone === "light"
                            ? "bg-slate-50 border border-slate-200"
                            : "bg-white/5 border border-white/10"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${tone === "light" ? "text-slate-900" : "text-white"}`} />
                      </div>

                      <h3 className={`font-syne text-2xl font-bold mb-3 ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>
                        {card.title}
                      </h3>

                      <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mb-6 leading-relaxed`}>
                        {card.description}
                      </p>

                      <ul className="space-y-3">
                        {card.features.map((feature, i) => (
                          <li
                            key={i}
                            className={`flex items-start gap-3 text-sm ${tone === "light" ? "text-slate-800" : "text-slate-100"}`}
                          >
                            <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 flex items-center gap-2">
                        {platformCards.map((_, i) => (
                          <span
                            key={i}
                            className={`h-2 w-2 rounded-full transition-all ${
                              i === activeCard
                                ? tone === "light"
                                  ? "bg-slate-950"
                                  : "bg-white"
                                : tone === "light"
                                  ? "bg-slate-300"
                                  : "bg-white/30"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="mt-6 text-xs text-slate-500">Scroll to advance through Platform.</div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <motion.div
          className="mt-12 grid md:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
        >
          {metrics.map((m, i) => (
            <motion.div
              key={i}
              className={`card rounded-3xl p-8 hover-lift ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
            >
              <div className="flex items-start justify-between gap-6">
                <div>
                  <span className={`section-label block ${tone === "light" ? "!text-slate-500" : ""}`}>{m.label}</span>
                  <h3 className={`mt-3 font-syne text-2xl font-bold ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>
                    {m.title}
                  </h3>
                </div>

                <div
                  className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                    tone === "light" ? "bg-slate-50 border border-slate-200" : "bg-white/5 border border-white/10"
                  }`}
                >
                  <m.icon className={`w-5 h-5 ${tone === "light" ? "text-slate-900" : "text-white"}`} />
                </div>
              </div>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-syne text-4xl font-bold gradient-text-shine">{m.value}</span>
                <span className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} text-sm`}>by design</span>
              </div>

              <ul className="mt-6 space-y-3">
                {m.points.map((p, idx) => (
                  <li key={idx} className={`flex items-start gap-3 text-sm ${tone === "light" ? "text-slate-800" : "text-slate-100"}`}>
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function AboutSection({ tone = "dark" }: { tone?: Tone }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="about" ref={ref} className="relative py-32 px-6 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className={`section-label mb-4 block ${tone === "light" ? "!text-slate-500" : ""}`}>About</span>
          <h2 className={`font-syne text-4xl sm:text-5xl md:text-6xl font-bold mb-6 ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>
            Built by federal
            <br />
            <span className="gradient-text">operators</span>
          </h2>
          <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} text-lg`}>
            Shaped by leaders who have lived the realities of federal missions,
            responsible for cyber, privacy, data, and risk across complex agencies.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.div
            className={`card rounded-3xl p-8 ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className={`font-syne text-2xl font-bold mb-4 ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>
              Multi-disciplinary Expertise
            </h3>
            <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mb-6`}>
              Our team has served in key federal roles across cabinet-level agencies and complex environments.
            </p>
            <ul className="space-y-3">
              {[
                "Deep experience with NIST 800-53, FedRAMP, FISMA, and RMF",
                "Hands-on with cross-agency missions and Zero Trust efforts",
                "Blending security operations, privacy, and data strategy",
              ].map((item, i) => (
                <li key={i} className={`flex items-start gap-3 text-sm ${tone === "light" ? "text-slate-800" : "text-slate-100"}`}>
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className={`card rounded-3xl p-8 ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className={`font-syne text-2xl font-bold mb-4 ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>Design Principles</h3>
            <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mb-6`}>
              We believe GRC tools should feel intuitive, mission-aligned, and responsive to federal realities.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Mission-first", "Human-centered", "OSCAL-native", "AI with accountability"].map(
                (tag, i) => (
                  <span
                    key={i}
                    className={`px-4 py-2 rounded-full text-sm ${
                      tone === "light"
                        ? "bg-slate-50 border border-slate-200 text-slate-800"
                        : "bg-slate-900/70 border border-white/10 text-slate-100"
                    }`}
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="grid sm:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {[
            { value: "20+", label: "Years Average Experience" },
            { value: "6", label: "Core Disciplines" },
            { value: "3", label: "Continents of Delivery" },
          ].map((stat, i) => (
            <div key={i} className={`card rounded-3xl p-8 text-center ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}>
              <span className="font-syne text-5xl font-bold gradient-text-shine">{stat.value}</span>
              <p className={`mt-3 text-sm ${tone === "light" ? "text-slate-600" : "text-slate-300"}`}>{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          className={`card rounded-3xl p-8 sm:p-12 text-center ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="max-w-3xl mx-auto">
            <p className={`text-xl sm:text-2xl ${tone === "light" ? "text-slate-600" : "text-slate-200"} leading-relaxed italic`}>
              &ldquo;We built GovSecurity360 to move federal security programs beyond static,
              document-driven compliance—towards live, actionable visibility into risk
              that directly supports mission outcomes.&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ContactSection({ tone = "dark" }: { tone?: Tone }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [organization, setOrganization] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

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
    <section id="contact" ref={ref} className="relative py-32 px-6 scroll-mt-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className={`card rounded-3xl p-8 sm:p-12 ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className={`section-label mb-4 block ${tone === "light" ? "!text-slate-500" : ""}`}>Contact</span>
              <h2 className={`font-syne text-4xl sm:text-5xl font-bold mb-6 ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>
                Get in
                <br />
                <span className="gradient-text">touch</span>
              </h2>
              <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mb-8`}>
                Share a bit about your mission, environment, or how you&apos;re thinking
                about intelligent GRC. We&apos;ll follow up with tailored next steps.
              </p>
              <ul className={`space-y-2 text-sm ${tone === "light" ? "text-slate-600" : "text-slate-400"}`}>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-500" />
                  <span>Ideal for CISOs, CIOs, CAIOs, and GRC leaders</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-500" />
                  <span>Designed for federal, state, and integrator teams</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-500" />
                  <span>No marketing spam, just focused follow-up</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={`section-label mb-2 block ${tone === "light" ? "!text-slate-500" : ""}`}>Name</label>
                  <input
                    className={`input-field w-full rounded-xl px-4 py-3 text-sm ${
                      tone === "light" ? "!bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400" : ""
                    }`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className={`section-label mb-2 block ${tone === "light" ? "!text-slate-500" : ""}`}>Email *</label>
                  <input
                    required
                    type="email"
                    className={`input-field w-full rounded-xl px-4 py-3 text-sm ${
                      tone === "light" ? "!bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400" : ""
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@agency.gov"
                  />
                </div>
              </div>

              <div>
                <label className={`section-label mb-2 block ${tone === "light" ? "!text-slate-500" : ""}`}>Organization</label>
                <input
                  className={`input-field w-full rounded-xl px-4 py-3 text-sm ${
                    tone === "light" ? "!bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400" : ""
                  }`}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Agency / Office / Integrator"
                />
              </div>

              <div>
                <label className={`section-label mb-2 block ${tone === "light" ? "!text-slate-500" : ""}`}>Message *</label>
                <textarea
                  required
                  className={`input-field w-full rounded-xl px-4 py-3 text-sm min-h-[120px] resize-none ${
                    tone === "light" ? "!bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400" : ""
                  }`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your mission..."
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${tone === "light" ? APPLE_PRIMARY_BTN_DARK : APPLE_PRIMARY_BTN} px-8 py-3 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <ArrowUpRight className="w-4 h-4" />
                </motion.button>
                {status === "success" && (
                  <span className="text-sm text-green-400">Message sent successfully</span>
                )}
                {status === "error" && (
                  <span className="text-sm text-red-400">Something went wrong. Try again.</span>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Footer({ tone = "dark" }: { tone?: Tone }) {
  return (
    <footer
      className={`border-t py-12 px-6 ${
        tone === "light" ? "bg-white border-slate-200" : "border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <span className={`font-syne text-sm font-semibold ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>GovSecurity360</span>
        </div>
        <p className={`text-xs ${tone === "light" ? "text-slate-500" : "text-slate-500"}`}>
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> GovSecurity360. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default function HomePage() {
  const [tone, setTone] = useState<Tone>("dark")
  const cutRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const el = cutRef.current
      if (!el) return

      // Switch to light theme slightly BEFORE the cut hits the header so the white sections
      // never render with dark-theme (white-on-white) styles.
      const cutTopAbs = el.getBoundingClientRect().top + window.scrollY
      const triggerY = cutTopAbs - 120 // buffer for smoother/earlier switch

      setTone(window.scrollY >= triggerY ? "light" : "dark")
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [])

  return (
    <main className="relative bg-[#020617] text-slate-50 overflow-x-hidden">
      {tone === "dark" && <AnimatedBackground />}
      {tone === "dark" && <div className="noise" />}

      {/* Header stays styled the same; it just gains a black background after the cut */}
      <Header solidBg={tone === "light"} />

      <HeroSection />

      {/* CLEAN CUT into the detailed content sections */}
      <div id="content-cut" ref={cutRef} className="relative z-10 bg-white text-slate-950 pt-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-slate-200" />
        </div>

        <PlatformSection tone="light" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-slate-200" />
        </div>

        <AboutSection tone="light" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-slate-200" />
        </div>

        <ContactSection tone="light" />

        <Footer tone="light" />
      </div>
    </main>
  )
}