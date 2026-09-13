export type SceneRange = { start: number; readEnd: number; end: number; overflow: number; lead: number }
const clamp = (n: number, low = 0, high = 1) => Math.max(low, Math.min(high, n))
const ease = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t) }

// Camera stops are shared by both ends of each transition, including in reverse.
const stops = [
  { zoom: 1, panX: 0, dim: 0, paper: [217, 232, 241] },
  { zoom: 2.6, panX: 0, dim: .25, paper: [217, 232, 241] },
  { zoom: 2.6, panX: -.16, dim: .25, paper: [233, 240, 245] },
  { zoom: 2.6, panX: -.16, dim: .25, paper: [244, 248, 251] },
  { zoom: 1.65, panX: -.04, dim: .20, paper: [248, 250, 252] },
  { zoom: 1.65, panX: -.04, dim: .30, paper: [225, 237, 245] },
]
export function sceneTransition(index: number, progress: number) {
  const p = clamp(progress)
  const t = ease(p)
  const from = stops[Math.min(index, stops.length - 1)]
  const to = stops[Math.min(index + 1, stops.length - 1)]
  const kind = ["zoom", "drift", "scan", "pullback", "settle"][index] ?? "rest"
  const scanReveal = kind === "scan" ? ease((p - .28) / .72) : 1
  return {
    kind, progress: p,
    // Lighting changes between the white hero's exit and navy copy's entrance.
    daylight: index === 0 ? ease((p - .45) / .18) : 1,
    paper: from.paper.map((channel, i) => channel + (to.paper[i] - channel) * t),
    zoom: from.zoom + (to.zoom - from.zoom) * t,
    panX: from.panX + (to.panX - from.panX) * t,
    dim: from.dim + (to.dim - from.dim) * t,
    outgoing: 1 - ease(p / (kind === "settle" ? .65 : .45)),
    incoming: index === 0 ? ease((p - .63) / .37) : kind === "scan" ? ease((p - .28) / .12) : ease((p - (kind === "settle" ? .25 : .45)) / (kind === "settle" ? .75 : .55)),
    outgoingX: kind === "drift" ? -36 * t : 0,
    incomingX: kind === "drift" ? 36 * (1 - t) : 0,
    scanReveal,
    scanOpacity: kind === "scan" ? ease((p - .28) / .08) * (1 - ease((p - .90) / .10)) : 0,
  }
}

export function portraitReveal(top: number, offset: number, viewport: number, entrance: number, index: number) {
  const reading = ease((viewport - 80 - top + offset) / 140 - (index % 4) * .06)
  const arrival = ease((entrance - .4 - index * .025) / .4)
  return reading * arrival
}

export function buildSceneTimeline(heights: number[], viewport: number): SceneRange[] {
  const h = Math.max(1, viewport)
  let start = 0
  return heights.map((height, i) => {
    const overflow = Math.max(0, height - h)
    const readEnd = start + overflow + h * .24
    const end = readEnd + (i === heights.length - 1 ? 0 : h * .8)
    const range = { start, readEnd, end, overflow, lead: h * .12 }
    start = end
    return range
  })
}
export function sceneAt(ranges: SceneRange[], position: number) {
  let index = ranges.findIndex(r => position < r.end)
  if (index < 0) index = ranges.length - 1
  const range = ranges[index]
  const transition = range.end > range.readEnd ? clamp((position - range.readEnd) / (range.end - range.readEnd)) : 0
  const motion = sceneTransition(index, transition)
  return {
    ...motion,
    index, active: motion.incoming >= .5 && motion.scanReveal >= .5 ? index + 1 : index,
    offset: clamp(position - range.start - range.lead, 0, range.overflow),
  }
}
