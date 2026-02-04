/* eslint-disable */
"use client"

import React, { useEffect, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion, useInView, useScroll, useTransform } from "framer-motion"
import { ArrowRight, ArrowUpRight, Shield, Zap, Globe, Layers, Check, Menu, X } from "lucide-react"
import dynamic from "next/dynamic"
import { link } from "fs"

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

function BinaryRain({ tone = "light" }: { tone?: Tone }) {
  // Subtle parallax: two independent rain layers that drift at different rates on scroll.
  const { scrollY } = useScroll()
  const farY = useTransform(scrollY, (v) => -v * 0.02)
  const nearY = useTransform(scrollY, (v) => -v * 0.04)

  type Drop = {
    id: number
    seed: number
    left: number
    delay: number
    duration: number
    opacity: number
    fontSize: number
  }

  const generateDrops = (opts: {
    count: number
    minGap: number
    opacityBase: number
    opacityVar: number
    durationBase: number
    durationVar: number
    fontSize: number
    seedSalt: number
  }): Drop[] => {
    const { count, minGap, opacityBase, opacityVar, durationBase, durationVar, fontSize, seedSalt } = opts

    // Deterministic PRNG seeded from crypto so the layout is stable during the session,
    // but randomized per reload.
    let x = 0
    try {
      const buf = new Uint32Array(1)
      crypto.getRandomValues(buf)
      x = (buf[0] + seedSalt) >>> 0
    } catch {
      x = (Math.floor(Math.random() * 2 ** 32) + seedSalt) >>> 0
    }

    const rand = () => {
      x = (x * 1664525 + 1013904223) >>> 0
      return x / 0xffffffff
    }

    const used: number[] = []

    const pickLeft = () => {
      for (let tries = 0; tries < 50; tries++) {
        const v = 3 + rand() * 94 // keep inside edges a bit
        if (used.every((u) => Math.abs(u - v) > minGap)) {
          used.push(v)
          return v
        }
      }
      const v = 3 + rand() * 94
      used.push(v)
      return v
    }

    return Array.from({ length: count }, (_, i) => {
      const left = pickLeft()
      return {
        id: i,
        seed: Math.floor(rand() * 1_000_000_000),
        left,
        delay: rand() * 6,
        duration: durationBase + rand() * durationVar,
        opacity: opacityBase + rand() * opacityVar,
        fontSize,
      }
    })
  }

  // Avoid SSR/CSR hydration mismatch: don’t randomize on the server render.
  // Render no drops for SSR + first client paint, then generate drops after mount.
  const [mounted, setMounted] = React.useState(false)
  const [farDrops, setFarDrops] = React.useState<Drop[]>([])
  const [nearDrops, setNearDrops] = React.useState<Drop[]>([])

  useEffect(() => {
    setMounted(true)

    setFarDrops(
      generateDrops({
        count: 10,
        minGap: 7,
        opacityBase: 0.18,
        opacityVar: 0.06,
        durationBase: 10.5,
        durationVar: 5.5,
        fontSize: 10,
        seedSalt: 101,
      }),
    )

    setNearDrops(
      generateDrops({
        count: 18,
        minGap: 3.6,
        opacityBase: 0.12,
        opacityVar: 0.08,
        durationBase: 7.0,
        durationVar: 3.6,
        fontSize: 12,
        seedSalt: 202,
      }),
    )
  }, [])

  // Light tint so it reads on white; keep very subtle.
  const color = tone === "light" ? "rgb(15, 76, 115)" : "rgb(226, 232, 240)"

  const columnText = (seed: number, density: "far" | "near") => {
    // Short “droplet” stream: mostly blank lines with a small cluster of 0/1s.
    const totalLines = density === "far" ? 22 : 28

    // Deterministic pseudo-rng so hydration is stable.
    let x = (seed + 1) * 99991
    const rand = () => {
      x = (x * 1664525 + 1013904223) >>> 0
      return x / 0xffffffff
    }

    const bitsCount = density === "far" ? 7 + Math.floor(rand() * 6) : 11 + Math.floor(rand() * 9)
    const used = new Set<number>()
    while (used.size < bitsCount) used.add(Math.floor(rand() * totalLines))

    let out = ""
    for (let i = 0; i < totalLines; i++) {
      if (used.has(i)) out += (rand() < 0.5 ? "0" : "1") + "\n"
      else out += "\n"
    }
    return out
  }

  const renderDrop = (d: Drop, density: "far" | "near") => (
    <div
      key={`${density}-${d.id}`}
      className="gs360-rain-drop"
      style={{
        left: `${d.left}%`,
        animationDelay: `${d.delay}s`,
        animationDuration: `${d.duration}s`,
        opacity: d.opacity,
        color,
        fontSize: `${d.fontSize}px`,
      }}
    >
      <div className="gs360-rain-stream">{columnText(d.seed, density)}</div>
    </div>
  )

  return (
    <div
      className="gs360-rain pointer-events-none absolute inset-0 overflow-hidden z-0"
      style={{ opacity: "var(--gs360-rain-opacity, 0.18)" as any }}
      aria-hidden
    >
      <motion.div className="absolute inset-0" style={{ y: farY }}>
        {mounted ? farDrops.map((d) => renderDrop(d, "far")) : null}
      </motion.div>

      <motion.div className="absolute inset-0" style={{ y: nearY }}>
        {mounted ? nearDrops.map((d) => renderDrop(d, "near")) : null}
      </motion.div>
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
              src="/favicon.png"
              alt="GS360 logo"
              className="h-7 w-auto"
            />
            <span className="font-montserrat text-base font-bold tracking-tight text-slate-50">
              GS360
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

  // One-time globe “arrival” animation (not scroll-driven):
  // when the Platform section first enters view, the globe scales up quickly and spins fast for ~3s.
  const [globeArrived, setGlobeArrived] = useState(false)
  const globeSpeed = 0.12

  useEffect(() => {
    if (inView && !globeArrived) setGlobeArrived(true)
  }, [inView, globeArrived])

  const capabilities = [
    {
      key: "live-risk-command" as const,
      icon: Shield,
      title: "Live Risk Command",
      description:
        "Real-time visibility into your organization’s security posture with unified risk dashboards.",
      bullets: [
        "Unified view of controls, risks, and POA&Ms",
        "Cross-system traceability (control → system → evidence)",
        "Mission-aligned POA&M and risk tracking",
      ],
    },
    {
      key: "mission-workflows" as const,
      icon: Layers,
      title: "Mission Workflows",
      description: "Purpose-built for government teams with experience-driven, OSCAL-enabled workflows. Automation is at the heart of driving your security workloads.",
      bullets: [
        "Have your mission define the ATO, FedRAMP, and CDM process",
        "Connect your systems, assets, controls, people, and business processes to enrich risk data",
        "Align security, privacy, responsible AI principles, and mission with impact",
      ],
    },
    {
      key: "ai-governance" as const,
      icon: Zap,
      title: "AI Governance",
      description: "Reduce compliance timelines and accelerate assessments with proactive AI assistance.",
      bullets: ["AI-assisted control narratives", "Prioritized risk actions", "CDM-aligned dashboards"],
    },
  ]

  const [activeKey, setActiveKey] = useState<(typeof capabilities)[number]["key"]>(capabilities[0].key)
  const active = capabilities.find((c) => c.key === activeKey) ?? capabilities[0]


  return (
    <section
      id="platform"
      ref={sectionRef}
      className="relative isolate overflow-hidden px-6 pt-24 pb-16 md:pb-20 lg:pb-24 scroll-mt-24 min-h-screen"
      style={{ ["--gs360-rain-opacity" as any]: 0.58 }}
    >
      <BinaryRain tone={tone} />
      <div className="relative z-20 max-w-7xl mx-auto">
        {/* Capability selector “nav” */}
        <div className="flex justify-center">
          <div
            role="tablist"
            aria-label="Platform capabilities"
            className="flex flex-wrap justify-center gap-2"
          >
            {capabilities.map((c) => {
              const Icon = c.icon
              const selected = c.key === activeKey

              const pillBase =
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

              const pillIdle =
                tone === "light"
                  ? "bg-white border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-950 focus-visible:ring-offset-white"
                  : "bg-white/5 border-white/10 text-white hover:bg-white/8 hover:border-white/20 focus-visible:ring-white focus-visible:ring-offset-black"

              const pillActive =
                tone === "light"
                  ? "bg-slate-950 border-slate-950 text-white shadow-[0_12px_28px_rgba(2,6,23,0.14)] focus-visible:ring-slate-950 focus-visible:ring-offset-white"
                  : "bg-white border-white text-slate-950 shadow-[0_12px_28px_rgba(0,0,0,0.30)] focus-visible:ring-white focus-visible:ring-offset-black"

              return (
                <button
                  key={c.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveKey(c.key)}
                  className={`${pillBase} ${selected ? pillActive : pillIdle}`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      selected
                        ? tone === "light"
                          ? "text-white"
                          : "text-slate-950"
                        : tone === "light"
                          ? "text-slate-900"
                          : "text-white"
                    }`}
                  />
                  <span>{c.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Space between selector row and the main content */}
        <div className="mt-12 grid lg:grid-cols-[1fr_minmax(280px,520px)_1fr] gap-10 items-start">
          {/* Left column: Intro only */}
          <div className="space-y-8">
            <div>
              <span className={`section-label mb-4 block ${tone === "light" ? "!text-slate-500" : ""}`}>Platform</span>
              <h2
                className={`font-syne font-bold tracking-tight leading-[0.95] ${
                  "text-4xl sm:text-5xl md:text-6xl"
                } ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}
              >
                Intelligent GRC
                <br />
                <span className={tone === "light" ? "text-slate-950" : "text-slate-50"}>in Action</span>
              </h2>
              <p
                className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mt-6 text-base sm:text-lg leading-relaxed`}
              >
                A unified command center for real-time, comprehensive insight into enterprise and cybersecurity risk —
                through a single pane of glass.
              </p>
            </div>
          </div>

          {/* Center: globe (sits a bit lower than the selector row) */}
          <div className="lg:sticky lg:top-36 flex flex-col items-center">
            {/* Globe */}
            <div
              className="relative mt-4"
              style={{
                width: "clamp(260px, 40vw, 520px)",
                height: "clamp(260px, 40vw, 520px)",
              }}
              aria-hidden
            >
              <motion.div
                className="absolute inset-0"
                style={{ willChange: "transform, opacity, filter" }}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={
                  globeArrived
                    ? { opacity: 1, y: 0, filter: "blur(0px)" }
                    : { opacity: 0, y: 20, filter: "blur(10px)" }
                }
                transition={{ duration: 1, delay: 1, ease: [0.25, 0.4, 0.25, 1] }}
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
              </motion.div>
            </div>
          </div>

          {/* Right column: Selector (outside) + active details (card) */}
          <div className="space-y-6">
            {/* Details card only */}
            <div
              className={`rounded-3xl p-6 sm:p-8 ${tone === "light" ? "bg-transparent" : "bg-transparent"}`}
            >
              <motion.div
                key={active.key}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <h3
                      className={`font-syne text-2xl sm:text-3xl font-bold ${
                        tone === "light" ? "text-slate-950" : "text-slate-50"
                      }`}
                    >
                      {active.title}
                    </h3>
                    <p
                      className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mt-4 leading-relaxed`}
                    >
                      {active.description}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {active.bullets.map((item, i) => (
                    <li
                      key={i}
                      className={`flex items-start gap-3 text-sm ${
                        tone === "light" ? "text-slate-800" : "text-slate-100"
                      }`}
                    >
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutSection({ tone = "dark" }: { tone?: Tone }) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="about" ref={ref} className="relative pt-14 pb-20 md:pt-18 md:pb-24 px-6 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className={`section-label mb-4 block ${tone === "light" ? "!text-slate-500" : ""}`}>About</span>
          <h2 className={`font-syne text-4xl sm:text-5xl md:text-6xl font-bold mb-6 ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>
            Built by former risk executives
            <br />
            <span className="text-slate-950">and operators</span>
          </h2>
          <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} text-lg`}>
            Forged by leaders who have decades of experience living the realities of federal missions,
            constraints, and the weight of responsibility that comes with executing cyber, privacy, data, and
            risk governance across complex Departments and Agencies.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
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
              Our team has served in key leadership and operations roles throughout the government including the Whitehouse, Department of War, the Intelligence Community and the federal civilian executive branch Department portfolio.
            </p>
            <ul className="space-y-3">
              {[
                "Unparalleled experience with FISMA, NIST RMF/CSF, CNSS, 800-53 and the Privacy Act.",
                "Hands-on with cross-agency missions and critical contributors to the Federal Zero Trust Architecture.",
                "Proven track record of blending security operations, privacy, risk management and data strategies for success.",
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
          className="grid sm:grid-cols-3 gap-6 mb-10"
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
              <span className={`font-syne text-5xl font-bold ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>{stat.value}</span>
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
              &ldquo;We built GovSecurity360 to move federal security programs beyond static, document-driven compliance to continuous, AI-powered risk visibility—deeply aligned to actionable RMF process and designed to directly support mission outcomes with greater speed, lower cost, and higher confidence.&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Fips199DemoSection({ tone = "light" }: { tone?: Tone }) {
  const [description, setDescription] = useState("")
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const [filePreflight, setFilePreflight] = useState<
    | { status: "idle"; message?: string }
    | { status: "ok"; message: string }
    | { status: "warn"; message: string }
    | { status: "bad"; message: string }
  >({ status: "idle" })

  const [warningOpen, setWarningOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<"upload" | "submit" | null>(null)

  const [isRunning, setIsRunning] = useState(false)
  const [statusIdx, setStatusIdx] = useState(0)
  const [showResults, setShowResults] = useState(false)

  type FipsRow = {
    infoType: string
    c: string
    i: string
    a: string
    justification?: string
  }

  const [aiRows, setAiRows] = useState<FipsRow[] | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const isProbablyText = (buf: Uint8Array) => {
    const n = Math.min(buf.length, 4096)
    let bad = 0
    for (let i = 0; i < n; i++) {
      const b = buf[i]
      if (b === 0) bad++
      else if (b < 9) bad++
      else if (b > 13 && b < 32) bad++
    }
    return bad / Math.max(1, n) < 0.02
  }

  const startsWithBytes = (buf: Uint8Array, bytes: number[]) => {
    if (buf.length < bytes.length) return false
    for (let i = 0; i < bytes.length; i++) if (buf[i] !== bytes[i]) return false
    return true
  }

  const preflightFile = async (
    f: File,
  ): Promise<{ ok: boolean; level: "ok" | "warn" | "bad"; message: string }> => {
    const name = (f?.name ?? "").toLowerCase()
    const ext = name.includes(".") ? name.split(".").pop() : ""

    // allowlist
    const allowedExts = ["txt", "md", "csv", "json", "yaml", "yml", "xml", "log", "docx", "pdf"]
    if (!(typeof ext === "string" && allowedExts.includes(ext))) {
      return {
        ok: false,
        level: "bad",
        message: "Unsupported file type. Please upload .txt/.md/.json (or .docx/.pdf).",
      }
    }

    // size cap (demo)
    const MAX_BYTES = 3_500_000
    if (f.size > MAX_BYTES) {
      return {
        ok: false,
        level: "bad",
        message: "File too large for demo. Please upload a small sanitized file.",
      }
    }

    try {
      const head = new Uint8Array(await f.slice(0, 16).arrayBuffer())

      if (ext === "pdf") {
        // %PDF-
        const ok = startsWithBytes(head, [0x25, 0x50, 0x44, 0x46, 0x2d])
        if (!ok) {
          return { ok: false, level: "bad", message: "This file does not look like a valid PDF (signature mismatch)." }
        }
        return {
          ok: true,
          level: "ok",
          message: "Preflight OK: PDF signature verified. Text will be extracted locally (no file upload).",
        }
      }

      if (ext === "docx") {
        // DOCX is a ZIP container: PK\x03\x04
        const ok = startsWithBytes(head, [0x50, 0x4b, 0x03, 0x04])
        if (!ok) {
          return { ok: false, level: "bad", message: "This .docx does not look valid (ZIP signature mismatch)." }
        }
        return {
          ok: true,
          level: "ok",
          message: "Preflight OK: DOCX signature verified. Text will be extracted locally (no file upload).",
        }
      }

      // text-ish files
      const okText = isProbablyText(head)
      if (!okText) {
        return { ok: false, level: "bad", message: "This file does not look like readable text. Please upload a text-based file." }
      }

      return { ok: true, level: "ok", message: "Preflight OK: text file verified. Only extracted text will be sent." }
    } catch {
      return {
        ok: true,
        level: "warn",
        message: "Preflight warning: could not fully verify signature. Proceeding with local text extraction.",
      }
    }
  }

  const sanitizeExtractedText = (t: string) => {
    const cleaned = (t ?? "")
      .replace(/\u0000/g, "")
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return cleaned.length > 40000 ? cleaned.slice(0, 40000) : cleaned
  }
  const acceptDroppedFile = async (f: File) => {
    const pre = await preflightFile(f)

    if (!pre.ok) {
      setFile(null)
      setFilePreflight({ status: "bad", message: pre.message })
      setApiError(pre.message)
      setAiRows(null)
      setShowResults(false)
      return
    }

    setFile(f)
    setFilePreflight({ status: pre.level, message: pre.message })
    setApiError(null)
    setAiRows(null)
    setShowResults(false)
  }

  const readFileAsText = async (f: File): Promise<string> => {
    // Demo guardrails: keep it small.
    const MAX_BYTES = 3_500_000
    if (f.size > MAX_BYTES) {
      throw new Error("File too large for demo. Please upload a small sanitized file.")
    }

    const name = (f?.name ?? "").toLowerCase()
    const ext = name.includes(".") ? name.split(".").pop() : ""

    // Plain text-like files
    const textExts = ["txt", "md", "csv", "json", "yaml", "yml", "xml", "log"]
    if (f.type?.startsWith("text/") || (typeof ext === "string" && textExts.includes(ext))) {
      const t = await f.text()
      return String(t ?? "").trim()
    }

    // .docx: extract raw text client-side
    if (ext === "docx") {
      const buf = await f.arrayBuffer()
      // Mammoth doesn't always ship TS types; import the main module and treat as `any`.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const mammoth: any = await import("mammoth")
      const result = await mammoth.extractRawText({ arrayBuffer: buf })
      const text = String(result?.value ?? "").trim()
      if (!text) throw new Error("Could not extract text from .docx. Please try a small sanitized .txt file instead.")
      return text
    }

    // .pdf: extract text client-side using pdf.js
    if (ext === "pdf") {
      const buf = await f.arrayBuffer()

      // Use the main pdfjs-dist entry (TypeScript can resolve it more reliably than deep legacy paths).
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const pdfjs: any = await import("pdfjs-dist")

      // Ensure the worker is set (bundled with pdfjs-dist). If this fails, pdfjs may still work in "fake worker" mode.
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString()
      } catch {
        // ignore
      }

      const loadingTask = pdfjs.getDocument({ data: buf })
      const pdf = await loadingTask.promise

      // Limit pages/size so we don't create huge prompts.
      const maxPages = Math.min(pdf.numPages || 0, 25)
      let out = ""

      for (let p = 1; p <= maxPages; p++) {
        // eslint-disable-next-line no-await-in-loop
        const page = await pdf.getPage(p)
        // eslint-disable-next-line no-await-in-loop
        const content = await page.getTextContent()
        const pageText = (content?.items || [])
          .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()

        if (pageText) out += pageText + "\n"

        // Prevent runaway text
        if (out.length > 40_000) break
      }

      const text = out.trim()
      if (!text) {
        throw new Error(
          "Could not extract text from this PDF (it may be scanned). Please upload a text-based PDF or a small sanitized .txt file.",
        )
      }

      return text
    }

    throw new Error("Unsupported file type for this demo. Please upload a small sanitized .txt/.md/.json (or .docx/.pdf) file.")
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper to reliably extract a file from DataTransfer (handles Safari)
  const getDroppedFile = (dt: DataTransfer | null | undefined): File | null => {
    if (!dt) return null
    const f = dt.files && dt.files.length > 0 ? dt.files[0] : null
    if (f) return f

    // Safari sometimes prefers items
    const items = dt.items ? Array.from(dt.items) : []
    const fileItem = items.find((it) => it.kind === "file")
    return fileItem ? fileItem.getAsFile() : null
  }

  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  const examples = [
    {
      key: "Federal Grants Management System",
      title: "Federal Grants Management System",
      text:
        "This system manages the full lifecycle of federal grant and financial assistance programs, including application intake, eligibility review, award creation, fund disbursement tracking, and post-award monitoring. It supports the agency mission by improving compliance and audit readiness, reducing manual processing, and ensuring timely, transparent delivery of funds to eligible recipients.",
    },
    {
      key: "Public Health Surveillance System",
      title: "Public Health Surveillance System",
      text:
        "This system supports public health operations by collecting case reports and laboratory results, managing investigations, and providing dashboards for trend analysis and outbreak response. It supports the agency mission by improving detection and response timelines, enabling coordinated case management, and producing accurate reporting for leadership and partner organizations.",
    },
    {
      key: "Mission Planning & C2 System",
      title: "Mission Planning & C2 System",
      text:
        "This system supports operational planning and command-and-control coordination by managing mission plans, tasking, situational reporting, and collaboration across mission partners. It supports the mission by increasing situational awareness, accelerating decision-making, and ensuring mission activities and approvals are tracked and available to authorized users.",
    },
  ]

  const statuses = [
    "Analyzing your system description...",
    "Identifying information types (NIST 800-60)...",
    "Mapping potential data categories...",
    "Turning words into impact levels... (the fun part)",
    "Consulting the compliance gremlins... please stand by",
  ]

  const surface = tone === "light" ? "bg-white border border-slate-200/80" : "bg-white/5 border border-white/10"
  const textStrong = tone === "light" ? "text-slate-950" : "text-slate-50"
  const textMuted = tone === "light" ? "text-slate-600" : "text-slate-300"

  const openWarning = (action: "upload" | "submit") => {
    setPendingAction(action)
    setWarningOpen(true)
  }

  const continueWarning = () => {
    const action = pendingAction
    setWarningOpen(false)
    setPendingAction(null)

    if (action === "upload") {
      fileInputRef.current?.click()
      return
    }

    if (action === "submit") {
      void runDemo()
    }
  }

  const cancelWarning = () => {
    setWarningOpen(false)
    setPendingAction(null)
  }

  const runDemo = async () => {
    const hasText = description.trim().length > 0
    const hasFile = !!file
    if (!hasText && !hasFile) {
      setApiError("Please enter a brief system description or upload a small sanitized file.")
      return
    }

    // Live demo: call a small API endpoint, but *always* play the full status sequence.
    setShowResults(false)
    setIsRunning(true)
    setStatusIdx(0)
    setApiError(null)
    setAiRows(null)

    // Read file text (best-effort) before kicking off the request.
    let fileText = ""
    if (file) {
      try {
        fileText = sanitizeExtractedText(await readFileAsText(file))
      } catch (e: any) {
        // Non-fatal: keep going with the description only.
        setApiError(e?.message ? String(e.message) : "File could not be read. Continuing with text input only.")
        fileText = ""
      }
    }

    // Start request in parallel with the status animation.
    // If the API returns an error quickly (e.g., 400 from guardrails),
    // stop the long animation early so the user sees the message.
    const requestState = {
      settled: false,
      hadError: false,
    }

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

    const waitUpTo = async (ms: number) => {
      // Poll in small increments so we can bail out quickly on early errors.
      const step = 200
      let waited = 0
      while (waited < ms) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(step)
        waited += step
        if (requestState.settled && requestState.hadError) return true
      }
      return false
    }

    const requestPromise = fetch("/api/fips199-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        exampleKey: selectedExample,
        fileName: file?.name ?? null,
        fileText: fileText || null,
      }),
    })
      .then(async (res) => {
        const text = await res.text()
        const json = text ? JSON.parse(text) : null
        if (!res.ok) {
          const msg =
            json && (json.error || json.message)
              ? String(json.error || json.message)
              : text || "Request failed."
          const err: any = new Error(msg)
          err.status = res.status
          throw err
        }
        return json
      })
      .then((json) => {
        requestState.settled = true
        return json
      })
      .catch((err: any) => {
        requestState.settled = true
        requestState.hadError = true
        return { error: err?.message ? String(err.message) : "Request failed." }
      })

    for (let i = 0; i < statuses.length; i++) {
      setStatusIdx(i)
      const shouldStop = await waitUpTo(7000)
      if (shouldStop) break
    }

    // tiny pause to feel like it “lands” on the final step (only on success path)
    if (!requestState.settled || !requestState.hadError) {
      await new Promise((r) => setTimeout(r, 550))
    }

    const result = await requestPromise

    // If the API returned an error (e.g., 400 from nonsense guardrails),
    // stay on the prompt view and surface the message.
    if (result?.error) {
      setApiError(String(result.error))
      setAiRows(null)
      setIsRunning(false)
      setShowResults(false)
      return
    }

    if (result && Array.isArray(result.rows) && result.rows.length > 0) {
      // Normalize shape defensively
      const normalized = result.rows
        .map((r: any) => ({
          infoType: String(r.infoType ?? r.information_type ?? ""),
          c: String(r.c ?? r.confidentiality ?? ""),
          i: String(r.i ?? r.integrity ?? ""),
          a: String(r.a ?? r.availability ?? ""),
          justification: r.justification ? String(r.justification) : undefined,
        }))
        .filter((r: any) => r.infoType)

      setAiRows(normalized)
    } else {
      // No rows returned — keep the user on the prompt view with a clear message.
      setApiError("No results were returned. Please provide a clearer system description (or upload a small sanitized text file).")
      setAiRows(null)
      setIsRunning(false)
      setShowResults(false)
      return
    }

    setIsRunning(false)
    setShowResults(true)
  }

  const onPickExample = (ex: (typeof examples)[number]) => {
    setSelectedExample(ex.key)
    setDescription(ex.text)
  }

  const demoRows = [
    { infoType: "Grants Management", c: "Moderate", i: "Moderate", a: "Moderate" },
    { infoType: "Financial Transactions", c: "Moderate", i: "High", a: "Moderate" },
    { infoType: "Personally Identifiable Information", c: "High", i: "Moderate", a: "Low" },
    { infoType: "Audit & Compliance Records", c: "Low", i: "High", a: "Moderate" },
    { infoType: "Operational Reporting", c: "Low", i: "Moderate", a: "Moderate" },
  ]

  const rowsForTable: Array<{ infoType: string; c: string; i: string; a: string; justification?: string }> =
    aiRows && aiRows.length > 0 ? aiRows : demoRows

  // Extracted Clear handler
  const handleClear = () => {
    setFile(null)
    setFilePreflight({ status: "idle" })
    setSelectedExample(null)
    setDescription("")
    setAiRows(null)
    setApiError(null)
    setIsRunning(false)
    setStatusIdx(0)
    setShowResults(false)
  }
  return (
    <section
      id="fips199-demo"
      ref={ref}
      className="relative min-h-screen pt-28 pb-44 md:pb-60 px-6 scroll-mt-24 bg-white text-slate-950"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className={`section-label mb-4 block ${tone === "light" ? "!text-slate-500" : ""}`}>Demo</span>
          <h2 className={`font-syne text-4xl sm:text-5xl md:text-6xl font-bold ${textStrong}`}>Try us out!</h2>
          <p className={`${textMuted} mt-5 text-lg leading-relaxed`}>
            Try a guided demo: describe your system or upload a sanitized file, then preview how GS360 maps information types to CIA impact levels.
          </p>
        </motion.div>

        <div className="mt-14 flex justify-center">
          {!showResults ? (
            /* Prompting card (first view) */
            <motion.div
              className={`w-full max-w-5xl rounded-3xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(2,6,23,0.08)] ${surface}`}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h3 className={`font-syne text-xl font-bold ${textStrong}`}>
                    Briefly describe what your system does and what mission or business need it supports.
                    <span className="inline-flex items-baseline ml-3 gap-2">
                      <button
                        type="button"
                        onClick={() => openWarning("upload")}
                        className="inline-flex items-center justify-center rounded-full px-4 py-px text-sm font-medium bg-[#2C58A8] text-white ring-1 ring-[#2C58A8]/35 hover:bg-[#3563B7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C58A8]/45 focus-visible:ring-offset-2"
                      >
                        Upload file
                      </button>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center justify-center rounded-full px-4 py-px text-sm font-medium bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50"
                      >
                        Clear
                      </button>
                    </span>
                  </h3>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null
                      if (f) void acceptDroppedFile(f)
                      else {
                        setFile(null)
                        setFilePreflight({ status: "idle" })
                      }
                    }}
                  />
                </div>

                {/* Clear button moved above, so remove this right-side Clear button */}
              </div>

              <div className="mt-3 grid lg:grid-cols-[1fr_280px] gap-4">
                <div
                  className={
                    "relative rounded-2xl " +
                    (isDragOver
                      ? "ring-2 ring-[#2C58A8]/50 bg-[#2C58A8]/[0.04]"
                      : "")
                  }
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOver(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOver(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOver(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOver(false)
                    const f = getDroppedFile(e.dataTransfer)
                    if (f) void acceptDroppedFile(f)
                  }}
                >
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setSelectedExample(null)
                      setDescription(e.target.value)
                      setApiError(null)
                      setAiRows(null)
                      setShowResults(false)
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragOver(true)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragOver(true)
                      try {
                        // nicer UX indicator
                        e.dataTransfer.dropEffect = "copy"
                      } catch {
                        // ignore
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragOver(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragOver(false)
                      const f = getDroppedFile(e.dataTransfer)
                      if (f) void acceptDroppedFile(f)
                    }}
                    placeholder="Enter here..."
                    className="w-full min-h-[260px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/20"
                  />

                  {/* Drop hint overlay */}
                  {isDragOver ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl">
                      <div className="rounded-xl bg-white/90 border border-slate-200 px-4 py-2 text-xs text-slate-700 shadow-[0_10px_30px_rgba(2,6,23,0.10)]">
                        Drop file to upload
                      </div>
                    </div>
                  ) : null}

                  {file ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-slate-600">
                        Selected file: <span className="font-medium text-slate-900">{file.name}</span>
                      </div>
                      {filePreflight.status !== "idle" ? (
                        <div
                          className={
                            "text-[11px] " +
                            (filePreflight.status === "ok"
                              ? "text-emerald-700"
                              : filePreflight.status === "warn"
                                ? "text-amber-700"
                                : "text-red-700")
                          }
                        >
                          {filePreflight.message}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-slate-500">
                      Tip: you can also drag &amp; drop a file into this box (.txt, .docx, .pdf).
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-700">Want one fast? Choose an example below:</p>
                  <div className="mt-3 space-y-2">
                    {examples.map((ex) => {
                      const active = selectedExample === ex.key
                      return (
                        <button
                          key={ex.key}
                          type="button"
                          onClick={() => onPickExample(ex)}
                          className={`w-full text-left rounded-xl px-3 py-2 text-xs font-medium transition-colors border ${
                            active
                              ? "bg-slate-950 text-white border-slate-950"
                              : "bg-white text-slate-900 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {ex.title}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 text-[11px] text-slate-600 leading-relaxed">
                    Tip: use fictional or sanitized examples only.
                  </div>
                </div>
              </div>

              {apiError ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {apiError}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const hasText = description.trim().length > 0
                    const hasFile = !!file
                    if (!hasText && !hasFile) {
                      setApiError("Please enter a brief system description or upload a small sanitized file.")
                      return
                    }
                    openWarning("submit")
                  }}
                  disabled={isRunning || (description.trim().length === 0 && !file)}
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium bg-green-600 text-white hover:bg-green-600/95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          ) : (
            /* Categorization card (second view) */
            <motion.div
              className={`w-full max-w-5xl rounded-3xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(2,6,23,0.08)] ${surface}`}
              initial={{ opacity: 0, y: 18 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className={`font-syne text-2xl font-bold ${textStrong}`}>FIPS 199: Data Categorization</h3>
                  <p className={`${textMuted} mt-2 text-sm leading-relaxed`}>Review and revise (if needed) the results below.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResults(false)
                      setIsRunning(false)
                      setStatusIdx(0)
                      setApiError(null)
                    }}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <div className="hidden sm:block w-2 h-12 rounded-full bg-slate-200" aria-hidden />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-4 gap-x-10 bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-700">
                  <div>Information Type</div>
                  <div>Confidentiality (NIST)</div>
                  <div>Integrity (NIST)</div>
                  <div>Availability (NIST)</div>
                </div>

                <div className="relative">
                  {rowsForTable.map((r, idx) => {
                    const blurred = idx >= 2
                    return (
                      <div
                        key={r.infoType}
                        className={`grid grid-cols-4 gap-x-10 px-4 py-3 text-sm border-t border-slate-100 ${
                          blurred ? "filter blur-[6px] opacity-65 select-none" : ""
                        }`}
                      >
                        <div className="font-medium text-slate-900">{r.infoType}</div>
                        <div className="text-slate-700">{r.c}</div>
                        <div className="text-slate-700">{r.i}</div>
                        <div className="text-slate-700">{r.a}</div>
                      </div>
                    )
                  })}

                  {/* Paywall / CTA overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end">
                    <div className="h-28 bg-gradient-to-t from-white via-white/95 to-transparent" />
                    <div className="pointer-events-auto px-4 pb-5">
                      <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-md p-4 flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-700">
                          Want to see more?
                          <span className="block text-[12px] text-slate-500">Get a tailored walkthrough and full output.</span>
                        </p>
                        <a
                          href="#contact"
                          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-slate-950 text-white hover:opacity-95"
                        >
                          Contact
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Warning modal */}
      <AnimatePresence>
        {warningOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="p-6">
                <p className="text-sm font-semibold text-slate-900">
                  By continuing, you affirm that you have not entered or uploaded any sensitive information.
                </p>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Do not include PII, PHI, CUI, classified information, or other non-public government data. Use fictional or sanitized examples only.
                </p>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={continueWarning}
                    className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-600/95"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={cancelWarning}
                    className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-600/95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            className="fixed inset-0 z-[190] flex items-end sm:items-center justify-center bg-black/30 px-6 pb-6 sm:pb-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl rounded-2xl bg-slate-950 text-white border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.99 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              role="status"
              aria-live="polite"
            >
              <div className="p-6 sm:p-7">
                <p className="text-sm font-semibold text-white/90">Processing System…</p>
                <div className="mt-4 space-y-2 text-sm">
                  {statuses.map((s, i) => {
                    const done = i < statusIdx
                    const active = i === statusIdx
                    return (
                      <div key={s} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                            done
                              ? "bg-green-500/20 border-green-400/40"
                              : active
                                ? "bg-white/10 border-white/30"
                                : "bg-white/5 border-white/15"
                          }`}
                          aria-hidden
                        >
                          {done ? (
                            <span className="text-[11px]">✓</span>
                          ) : (
                            <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : "bg-white/30"}`} />
                          )}
                        </span>
                        <span className={`${done ? "text-white/70" : active ? "text-white" : "text-white/60"}`}>{s}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function MeetTheTeamSection({ tone = "light" }: { tone?: Tone }) {
  const [expanded, setExpanded] = useState(false)

  // Founders array
  const founders = [
    {
      id: "01",
      name: "Oki Mek",
      role: "CEO",
      image: "/team/Oki_Mek.png",
      initials: "OM",
      linkedin: "https://www.linkedin.com/in/oki-mek/",
    },
    {
      id: "02",
      name: "Rodi Bachara",
      role: "Business Development",
      image: "/team/Rodi_Bechara.png",
      initials: "RB",
      linkedin: "https://www.linkedin.com/in/rodi-bechara-50913910/",
    },
    {
      id: "03",
      name: "David Han",
      role: "Head of Operations",
      image: "/team/David_Han.png",
      initials: "DH",
      linkedin: "https://www.linkedin.com/in/david-han-4246233aa/",
    },
    {
      id: "04",
      name: "Steven Hernandez",
      role: "CISO",
      image: "/team/Steven_Hernandez.png",
      initials: "SH",
      linkedin: "https://www.linkedin.com/in/sthernandez/",
    },
    {
      id: "05",
      name: "Tim Han",
      role: "Unicorn AI Developer",
      image: "/team/Tim_Han.png",
      initials: "TH",
      linkedin: "https://www.linkedin.com/in/timothyhan12/",
    },
  ]

  // Advisors array
  const advisors = [
    {
      id: "a01",
      name: "Pamela Patenaude",
      role: "Advisor",
      image: "/team/Pamela_Patenaude.jpg",
      initials: "PP",
      linkedin: "https://www.linkedin.com/in/pamela-patenaude-9794847a/",
    },
    {
      id: "a02",
      name: "Margaret Weichert",
      role: "Advisor",
      image: "/team/Margaret_Weichert.png",
      initials: "MW",
      linkedin: "https://www.linkedin.com/in/mweichert/",
    },
    {
      id: "a03",
      name: "Jenny Hudgins",
      role: "Advisor",
      image: "/team/Jenny_Hudgins.png",
      initials: "JH",
      linkedin: "https://www.linkedin.com/in/jenny-hudgins-42993a82/",
    },
  ]

  // (stackTransform removed)

  const surface = tone === "light" ? "bg-white border border-slate-200/80" : "bg-white/5 border border-white/10"
  const textStrong = tone === "light" ? "text-slate-950" : "text-slate-50"
  const textMuted = tone === "light" ? "text-slate-600" : "text-slate-300"

  // Collapsed stack (Meet the team button)
  const renderCollapsedStack = (members: typeof founders) => {
    return (
      <div className="mt-10 flex flex-col items-center">
          <div className="relative w-full flex items-center justify-center min-h-[520px] sm:min-h-[560px] overflow-visible">
            <div
              className="absolute inset-0 z-[3000] flex items-center justify-center"
              style={{ pointerEvents: "none" }}
            >
              <button
                type="button"
                onClick={() => setExpanded(true)}
                style={{ pointerEvents: "auto" }}
                className={`${tone === "light" ? APPLE_PRIMARY_BTN_DARK : APPLE_PRIMARY_BTN} px-7 py-3 text-sm font-medium flex items-center gap-2 group`}
              >
                <span>Meet the team</span>
                <span className="text-base leading-none opacity-70 transition-transform group-hover:translate-x-0.5">›</span>
              </button>
            </div>

            {members.map((m, idx) => {
              const collapsedZ = 1000 + (members.length - idx)
              return (
                <div
                  key={m.id}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ zIndex: collapsedZ }}
                >
                  <motion.div
                    layout
                    layoutId={`team-card-${m.id}`}
                    initial={false}
                    animate={{ x: 0, y: 0, rotate: 0, scale: 1 - idx * 0.02, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  >
                    <motion.div
                      className={`group relative w-[min(360px,88vw)] sm:w-[340px] lg:w-[360px] rounded-3xl overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.14)] filter blur-[8px] opacity-80 select-none pointer-events-none ${surface}`}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    >
                      <div className="relative h-[220px]">
                        <div
                          className={
                            tone === "light"
                              ? "absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,76,115,0.16),transparent_60%)]"
                              : "absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(158,216,255,0.18),transparent_60%)]"
                          }
                        />

                        <img
                          src={m.image}
                          alt={m.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-95"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).style.display = "none"
                          }}
                          loading="lazy"
                        />

                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <div className="flex items-end justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-syne text-lg font-bold text-white truncate">{m.name}</p>
                              <p className="text-sm text-white/85 truncate">{m.role}</p>
                            </div>
                            <div className="shrink-0 w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white font-semibold">
                              {m.initials}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>
              )
            })}
          </div>
      </div>
    )
  }

  const renderExpandedSection = (
    title: string,
    description: string,
    members: typeof founders,
  ) => {
    return (
      <div className="mt-12">
        <div className="text-center max-w-3xl mx-auto">
          <h4 className={`font-syne text-2xl sm:text-3xl font-bold ${textStrong}`}>{title}</h4>
          <p className={`${textMuted} mt-3 leading-relaxed`}>{description}</p>
        </div>

        <div className="mt-10 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
          {members.map((m) => (
            <motion.div
              key={m.id}
              layout
              layoutId={`team-card-${m.id}`}
              className="relative"
              initial={false}
              animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <motion.div
                className={`group relative w-[min(360px,88vw)] sm:w-[340px] lg:w-[360px] rounded-3xl overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.14)] ${surface}`}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <div className="relative h-[220px]">
                  <div
                    className={
                      tone === "light"
                        ? "absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,76,115,0.16),transparent_60%)]"
                        : "absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(158,216,255,0.18),transparent_60%)]"
                    }
                  />

                  <img
                    src={m.image}
                    alt={m.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-95"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = "none"
                    }}
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors duration-300" />

                  {m.linkedin ? (
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${m.name} on LinkedIn`}
                      className="absolute top-4 right-4 z-20 inline-flex items-center justify-center rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-md opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-white/15"
                      onClick={(e) => e.stopPropagation()}
                    >
                      LinkedIn
                      <span className="ml-1 opacity-80">↗</span>
                    </a>
                  ) : null}

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-syne text-lg font-bold text-white truncate">{m.name}</p>
                        <p className="text-sm text-white/85 truncate">{m.role}</p>
                      </div>
                      <div className="shrink-0 w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white font-semibold">
                        {m.initials}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section id="team" className="relative pt-24 pb-32 px-6 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <span className={`section-label mb-3 block ${tone === "light" ? "!text-slate-500" : ""}`}>Meet the Team</span>
          <h3 className={`font-syne text-3xl sm:text-4xl font-bold ${textStrong}`}>Strategists, operators, builders, and partners</h3>
          <p className={`${textMuted} mt-4 leading-relaxed`}>
            Click “Meet the team” to expand. Hover a card to see more.
          </p>
        </div>

        <LayoutGroup>
          {!expanded ? (
            renderCollapsedStack(founders)
          ) : (
            <>
              {renderExpandedSection(
                "Founders",
                "Core operators building GovSecurity360 day-to-day.",
                founders,
              )}

              {renderExpandedSection(
                "Board of Advisors",
                "Seasoned leaders helping shape strategy, security, and go-to-market.",
                advisors,
              )}

              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all ring-1 ${
                    tone === "light"
                      ? "bg-slate-950 text-white ring-slate-950 hover:opacity-95"
                      : "bg-white text-slate-950 ring-white hover:bg-white/95"
                  }`}
                >
                  Close team
                </button>
              </div>
            </>
          )}
        </LayoutGroup>
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
                <span className="text-slate-950">touch</span>
              </h2>
              <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mb-8`}>
                Share your most daunting risk challenges or a bit about your mission, environment, or how you&apos;re thinking
                about intelligent risk management through GRC. We&apos;ll follow up with tailored next steps.
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
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <img src="/favicon.png" alt="GovSecurity360" className="w-5 h-5" />
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
        <PlatformSection tone="light" />

        <Fips199DemoSection tone="light" />

        <AboutSection tone="light" />

        <MeetTheTeamSection tone="light" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-slate-200" />
        </div>

        <ContactSection tone="light" />

        <Footer tone="light" />
      </div>
    </main>
  )
}