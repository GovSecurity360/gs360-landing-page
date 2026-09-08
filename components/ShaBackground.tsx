"use client"

import { useEffect, useRef } from "react"

// Decorative pixels don't need Retina resolution. Bound both canvas allocations,
// including on ultrawide screens, independently of the device's pixel ratio.
export const MAX_BACKGROUND_PIXELS = 2_000_000
export const HASH_TILE_HEIGHT = 275
const FRAME_INTERVAL = 1000 / 24
const LINE_HEIGHT = 13.75
const SCROLL_PX_PER_SECOND = 6.5

export function backgroundSize(width: number, height: number) {
  const scale = Math.min(1, Math.sqrt(MAX_BACKGROUND_PIXELS / Math.max(1, width * height)))
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scale,
  }
}

export default function ShaBackground() {
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

    function draw(time: number) {
      if (disposed) return
      if (time - lastFrame >= FRAME_INTERVAL || reducedMotion.matches) {
        lastFrame = time
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        const elapsed = reducedMotion.matches ? 0 : (time - start) / 1000
        const offset = (elapsed * SCROLL_PX_PER_SECOND * scale) % tile.height

        // Reuse pre-rendered glyphs: no text shaping, random generation, React
        // state changes, or new image/canvas allocation inside the frame loop.
        for (let y = -offset; y < canvas!.height; y += tile.height) {
          ctx!.drawImage(tile, 0, Math.round(y))
        }

        if (!reducedMotion.matches && scanGradient) {
          const scanY = ((elapsed % 8) / 8) * (canvas!.height + 40) - 20
          ctx!.fillStyle = scanGradient
          ctx!.globalAlpha = 0.08
          ctx!.fillRect(0, scanY - 12, canvas!.width, 26)
          ctx!.globalAlpha = 0.65
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
  }, [])

  return (
    <div className="sha-background" aria-hidden="true">
      <div className="sha-emblem" />
      <canvas ref={canvasRef} className="sha-canvas" />
    </div>
  )
}
