"use client"

import { useEffect, useRef, type RefObject } from "react"

// Decorative pixels don't need Retina resolution. Bound both canvas allocations,
// including on ultrawide screens, independently of the device's pixel ratio.
export const MAX_BACKGROUND_PIXELS = 2_000_000
export const HASH_TILE_HEIGHT = 275
const FRAME_INTERVAL = 1000 / 24
const LINE_HEIGHT = 13.75
const SCROLL_PX_PER_SECOND = 6.5

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

// Shared by the scroll handoff and renderer. Zoom changes drawing coordinates,
// never the canvas dimensions or the browser's composited layer size.
export function openingTransition(progress: number, immersive = true, reduced = false) {
  const p = Number.isFinite(progress) ? clamp(progress) : 0
  if (reduced) return { zoom: 1, dim: 0, contentOpacity: 1, platformOpacity: 1 }
  const platformOpacity = smooth((p - .44) / .32)
  return {
    zoom: immersive ? 1 + 1.6 * smooth((p - .12) / .6) : 1,
    dim: platformOpacity * .25,
    contentOpacity: 1 - smooth((p - .08) / .32),
    platformOpacity,
  }
}

export type OpeningTransition = ReturnType<typeof openingTransition> & { panX?: number; daylight?: number; paper?: number[] }
const RESTING_TRANSITION = openingTransition(0)

// Time-based damping feels the same on 60 Hz and high-refresh displays.
export function smoothScrollProgress(current: number, target: number, elapsedMs: number) {
  if (Math.abs(current - target) < .0005) return target
  return target + (current - target) * Math.exp(-Math.max(0, Math.min(elapsedMs, 64)) / 85)
}

export function backgroundSize(width: number, height: number) {
  const scale = Math.min(1, Math.sqrt(MAX_BACKGROUND_PIXELS / Math.max(1, width * height)))
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scale,
  }
}

export default function ShaBackground({ handoff }: { handoff?: RefObject<OpeningTransition> } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    const ctx = canvas?.getContext("2d")
    if (!canvas || !host || !ctx) return

    const tile = document.createElement("canvas")
    const tileCtx = tile.getContext("2d")
    if (!tileCtx) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    let lastFrame = -Infinity
    const start = performance.now()
    let disposed = false
    let width = 0
    let height = 0
    let scale = 1
    let scanGradient: CanvasGradient | null = null
    let drawnZoom = -1
    let drawnDim = -1
    let drawnPanX = -1
    let drawnDaylight = -1
    const drawnPaper = [0, 0, 0]
    const defaultPaper = [233, 240, 245]

    function draw(time: number) {
      if (disposed) return
      const transition: OpeningTransition = reducedMotion.matches ? RESTING_TRANSITION : handoff?.current ?? RESTING_TRANSITION
      const panX = transition.panX ?? 0
      const daylight = transition.daylight ?? 0
      const paper = transition.paper ?? defaultPaper
      const cameraMoving = Math.abs(transition.zoom - drawnZoom) > .00001 || Math.abs(transition.dim - drawnDim) > .00001 || Math.abs(panX - drawnPanX) > .00001 || Math.abs(daylight - drawnDaylight) > .00001 || paper.some((channel, i) => Math.abs(channel - drawnPaper[i]) > .001)
      // Zoom must follow display refresh, not the idle code-drift frame cap.
      if (cameraMoving || time - lastFrame >= FRAME_INTERVAL || reducedMotion.matches) {
        lastFrame = time
        drawnZoom = transition.zoom
        drawnDim = transition.dim
        drawnPanX = panX
        drawnDaylight = daylight
        paper.forEach((channel, i) => { drawnPaper[i] = channel })
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        const elapsed = reducedMotion.matches ? 0 : (time - start) / 1000
        const offset = (elapsed * SCROLL_PX_PER_SECOND * scale) % tile.height

        // Reuse pre-rendered glyphs: no text shaping, random generation, React
        // state changes, or new image/canvas allocation inside the frame loop.
        const zoom = transition.zoom
        ctx!.setTransform(zoom, 0, 0, zoom, canvas!.width * (.5 * (1 - zoom) + panX), canvas!.height * .6 * (1 - zoom))
        for (let y = -offset; y < canvas!.height; y += tile.height) {
          ctx!.drawImage(tile, 0, y)
        }
        ctx!.setTransform(1, 0, 0, 1, 0, 0)

        if (daylight > 0) {
          // Recolor the same glyph mask in place, without another backing store.
          ctx!.globalCompositeOperation = "source-in"
          ctx!.fillStyle = `rgb(${225 - 189 * daylight}, ${240 - 172 * daylight}, ${252 - 162 * daylight})`
          ctx!.globalAlpha = 1 - daylight * .45
          ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
          ctx!.globalCompositeOperation = "destination-over"
          ctx!.globalAlpha = daylight
          ctx!.fillStyle = `rgb(${paper[0]}, ${paper[1]}, ${paper[2]})`
          ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
          ctx!.globalCompositeOperation = "source-over"
          ctx!.globalAlpha = 1
        }

        if (transition.dim > 0 && daylight < 1) {
          ctx!.fillStyle = "#03101c"
          ctx!.globalAlpha = transition.dim * (1 - daylight)
          ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
          ctx!.globalAlpha = 1
        }

        if (!reducedMotion.matches && scanGradient) {
          const scanY = ((elapsed % 8) / 8) * (canvas!.height + 40) - 20
          ctx!.fillStyle = scanGradient
          ctx!.globalAlpha = 0.08 * (1 - daylight * .85)
          ctx!.fillRect(0, scanY - 12, canvas!.width, 26)
          ctx!.globalAlpha = 0.65 * (1 - daylight * .85)
          ctx!.fillRect(0, scanY, canvas!.width, Math.max(1, 2 * scale))
          ctx!.globalAlpha = 1
        }
      }
      if (!reducedMotion.matches) frame = requestAnimationFrame(draw)
    }

    function restart() {
      cancelAnimationFrame(frame)
      lastFrame = -Infinity
      frame = requestAnimationFrame(draw)
    }

    function resize() {
      if (disposed) return
      const nextWidth = Math.ceil(host!.clientWidth)
      const nextHeight = Math.ceil(host!.clientHeight)
      if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return
      width = nextWidth
      height = nextHeight
      const size = backgroundSize(width, height)
      scale = size.scale
      canvas!.width = size.width
      canvas!.height = size.height
      tile.width = size.width
      tile.height = Math.max(1, Math.min(size.height, Math.ceil(HASH_TILE_HEIGHT * scale)))
      tileCtx!.setTransform(scale, 0, 0, scale, 0, 0)
      tileCtx!.font = "11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      tileCtx!.fillStyle = "rgba(225, 240, 252, 0.09)"
      tileCtx!.textBaseline = "top"
      const charWidth = tileCtx!.measureText("0").width || 7
      const columns = Math.ceil(width / charWidth) + 1
      const alphabet = "0123456789abcdef"
      for (let y = 0; y < HASH_TILE_HEIGHT; y += LINE_HEIGHT) {
        let line = ""
        for (let x = 0; x < columns; x++) line += alphabet[Math.floor(Math.random() * 16)]
        tileCtx!.fillText(line, 0, y)
      }
      scanGradient = ctx!.createLinearGradient(0, 0, canvas!.width, 0)
      scanGradient.addColorStop(0, "rgba(124,201,255,0)")
      scanGradient.addColorStop(0.5, "rgba(124,201,255,0.65)")
      scanGradient.addColorStop(1, "rgba(124,201,255,0)")
      restart()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    reducedMotion.addEventListener("change", restart)
    resize()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      reducedMotion.removeEventListener("change", restart)
      // Release backing stores as soon as the opening leaves view.
      canvas.width = canvas.height = 1
      tile.width = tile.height = 1
      scanGradient = null
    }
  }, [handoff])

  return (
    <div className="sha-background" aria-hidden="true">
      <div className="sha-emblem" />
      <canvas ref={canvasRef} className="sha-canvas" />
    </div>
  )
}
