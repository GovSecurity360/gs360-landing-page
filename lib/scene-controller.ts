import { buildSceneTimeline, sceneAt, portraitReveal, type SceneRange } from "./scene-timeline"
import type { OpeningTransition } from "@/components/ShaBackground"

export function mountSceneJourney(host: HTMLElement, camera: { current: OpeningTransition }) {
  const stage = host.querySelector<HTMLElement>(".scene-stage")!
  const panels = Array.from(host.querySelectorAll<HTMLElement>(".scene-panel"))
  const contents = panels.map(panel => panel.querySelector<HTMLElement>(".journey-content")!)
  const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>(".scene-controls button"))
  const scanLine = host.querySelector<HTMLElement>(".scene-scan-line")
  const teamIndex = panels.findIndex(panel => panel.dataset.sceneId === "about")
  const portraits = teamIndex < 0 ? [] : Array.from(panels[teamIndex].querySelectorAll<HTMLElement>(".team-section > .portrait-grid .portrait-image"))
  let portraitTops: number[] = []
  const media = window.matchMedia("(min-width: 900px) and (min-height: 650px) and (prefers-reduced-motion: no-preference)")
  let ranges: SceneRange[] = [], pinned = false, frame = 0, focusFrame = 0, position = 0, target = 0, lastTime = 0, active = -1
  let configured = false
  let viewportHeight = 0
  let dimensions = ""
  const decodeHash = (hash: string) => { try { return decodeURIComponent(hash) } catch { return hash } }
  const total = () => ranges.at(-1)?.end ?? 0
  const rootTop = () => window.scrollY + host.getBoundingClientRect().top
  function readTarget() { target = Math.max(0, Math.min(total(), -host.getBoundingClientRect().top)) }
  function render(time = performance.now()) {
    frame = 0
    const dt = lastTime ? Math.min(64, time - lastTime) : 16.67
    position = Math.abs(position - target) < .5 ? target : target + (position - target) * Math.exp(-dt / 85)
    lastTime = time
    const state = sceneAt(ranges, position)
    camera.current = { zoom: state.zoom, panX: state.panX, dim: state.dim, daylight: state.daylight, paper: state.paper, contentOpacity: state.outgoing, platformOpacity: state.incoming }
    host.dataset.lighting = state.daylight >= .5 ? "day" : "night"
    if (scanLine) {
      scanLine.style.opacity = String(state.scanOpacity)
      scanLine.style.transform = `translateY(${state.scanReveal * viewportHeight}px)`
    }
    panels.forEach((panel, i) => {
      const opacity = i === state.index ? state.outgoing : i === state.index + 1 ? state.incoming : 0
      const hidden = opacity < .04
      const scanning = state.kind === "scan" && i === state.index + 1
      // A partially revealed form must not accept focus behind the scan edge.
      const inert = opacity < .95 || (scanning && state.scanReveal < .999)
      if (inert && panel.contains(document.activeElement)) buttons[state.active]?.focus({ preventScroll: true })
      if (panel.inert !== inert) panel.inert = inert
      const hiddenValue = String(inert)
      if (panel.getAttribute("aria-hidden") !== hiddenValue) panel.setAttribute("aria-hidden", hiddenValue)
      panel.style.opacity = String(opacity)
      panel.style.visibility = hidden ? "hidden" : ""
      const x = i === state.index ? state.outgoingX : i === state.index + 1 ? state.incomingX : 0
      panel.style.transform = x ? `translateX(${x}px)` : ""
      panel.style.clipPath = scanning && state.scanReveal < 1 ? `inset(0 0 ${(1 - state.scanReveal) * 100}% 0)` : ""
      const offset = i === state.index ? state.offset : i < state.index ? ranges[i].overflow : 0
      if (Math.abs(panel.scrollTop - offset) > .5) panel.scrollTop = offset
    })
    const teamEntering = state.index + 1 === teamIndex
    const teamReading = state.index === teamIndex
    portraits.forEach((portrait, i) => {
      const opacity = teamEntering || teamReading
        ? portraitReveal(portraitTops[i], teamReading ? state.offset : 0, viewportHeight, teamEntering ? state.progress : 1, i)
        : 1
      portrait.style.opacity = String(opacity)
      portrait.style.transform = opacity < 1 ? `translateY(${(1 - opacity) * 14}px)` : ""
    })
    if (active !== state.active) {
      active = state.active
      host.dataset.activeScene = panels[active].dataset.sceneId
      buttons.forEach((button, i) => i === active ? button.setAttribute("aria-current", "step") : button.removeAttribute("aria-current"))
      window.dispatchEvent(new Event("gs360:scenechange"))
    }
    if (Math.abs(position - target) >= .5) frame = requestAnimationFrame(render)
    else lastTime = 0
  }
  function schedule() {
    if (!pinned) return
    readTarget()
    if (!frame) frame = requestAnimationFrame(render)
  }
  function goTo(id: string, smooth = true) {
    const index = id === "top" || id === "opening" ? 0 : panels.findIndex(panel => panel.dataset.sceneId === id || Array.from(panel.querySelectorAll<HTMLElement>("[id]")).some(el => el.id === id))
    if (index < 0) return false
    if (!pinned) { (document.getElementById(id) ?? panels[index]).scrollIntoView({ behavior: "auto" }); return true }
    const element = document.getElementById(id)
    let local = 0
    if (element && panels[index].contains(element)) local = element.getBoundingClientRect().top - panels[index].getBoundingClientRect().top + panels[index].scrollTop - 90
    const offset = Math.max(0, Math.min(ranges[index].overflow, local))
    const top = rootTop() + ranges[index].start + ranges[index].lead + offset
    window.scrollTo({ top, behavior: smooth ? "smooth" : "instant" })
    if (!smooth) { cancelAnimationFrame(frame); readTarget(); position = target; render() }
    return true
  }
  function configure() {
    // ResizeObserver also fires at registration; identical geometry must not
    // restart a transition or move the reader.
    const signature = [media.matches, window.innerHeight, ...contents.map(content => content.scrollHeight)].join(":")
    if (signature === dimensions) return
    dimensions = signature
    cancelAnimationFrame(frame)
    frame = 0
    const prior = ranges.length ? sceneAt(ranges, target) : null
    const priorRange = prior ? ranges[prior.index] : null
    const priorLocal = priorRange ? Math.max(0, target - priorRange.start) : 0
    const priorTransition = priorRange && target > priorRange.readEnd
      ? (target - priorRange.readEnd) / (priorRange.end - priorRange.readEnd) : null
    const wasPinned = pinned
    pinned = media.matches
    host.dataset.sceneMode = pinned ? "pinned" : "flow"
    if (!pinned) {
      delete host.dataset.lighting
      host.style.removeProperty("height")
      resetVisuals()
      panels.forEach(panel => { panel.scrollTop = 0 })
      camera.current = { zoom: 1, dim: .1, contentOpacity: 1, platformOpacity: 1 }
      return
    }
    viewportHeight = stage.clientHeight
    ranges = buildSceneTimeline(contents.map(content => content.scrollHeight), viewportHeight)
    // Measure untransformed portrait positions only on layout changes, not frames.
    portraits.forEach(portrait => { portrait.style.removeProperty("transform") })
    portraitTops = portraits.map(portrait => portrait.getBoundingClientRect().top - panels[teamIndex].getBoundingClientRect().top + panels[teamIndex].scrollTop)
    host.style.height = `${viewportHeight + total()}px`
    if (configured && wasPinned && prior) {
      const next = ranges[Math.min(prior.index, ranges.length - 1)]
      const nextPosition = priorTransition !== null
        ? next.readEnd + priorTransition * (next.end - next.readEnd)
        : next.start + Math.min(priorLocal, next.readEnd - next.start)
      if (Math.abs(nextPosition - target) > 1) window.scrollTo({ top: rootTop() + nextPosition, behavior: "instant" })
    }
    readTarget(); position = target; render()
    if (!configured && window.location.hash) goTo(decodeHash(window.location.hash.slice(1)), false)
    configured = true
  }
  function click(event: MouseEvent) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return
    const anchor = (event.target as Element)?.closest<HTMLAnchorElement>('a[href^="#"]')
    if (!anchor) return
    const id = decodeHash(anchor.hash.slice(1)) || "top"
    if (goTo(id)) { event.preventDefault(); window.history.pushState(null, "", `#${id}`) }
  }
  function hashChange() { goTo(decodeHash(window.location.hash.slice(1)) || "top", false) }
  function focusIn(event: FocusEvent) {
    if (!pinned) return
    const element = event.target as HTMLElement
    const index = panels.findIndex(panel => panel.contains(element))
    if (index < 0) return
    cancelAnimationFrame(focusFrame)
    focusFrame = requestAnimationFrame(() => {
      focusFrame = 0
      const panel = panels[index]
      const rect = element.getBoundingClientRect()
      let offset = panel.scrollTop
      if (rect.top < 90) offset += rect.top - 90
      if (rect.bottom > viewportHeight - 80) offset += rect.bottom - viewportHeight + 80
      offset = Math.max(0, Math.min(ranges[index].overflow, offset))
      if (Math.abs(offset - sceneAt(ranges, target).offset) > 1) {
        window.scrollTo({ top: rootTop() + ranges[index].start + ranges[index].lead + offset, behavior: "instant" })
        cancelAnimationFrame(frame); readTarget(); position = target; render()
      }
    })
  }
  const observer = new ResizeObserver(configure)
  contents.forEach(content => observer.observe(content))
  window.addEventListener("scroll", schedule, { passive: true })
  window.addEventListener("resize", configure)
  window.addEventListener("hashchange", hashChange)
  document.addEventListener("click", click)
  host.addEventListener("focusin", focusIn)
  media.addEventListener("change", configure)
  configure()
  function resetVisuals() {
    panels.forEach(panel => {
      panel.inert = false; panel.removeAttribute("aria-hidden")
      for (const property of ["opacity", "visibility", "transform", "clip-path"]) panel.style.removeProperty(property)
    })
    portraits.forEach(portrait => { portrait.style.removeProperty("opacity"); portrait.style.removeProperty("transform") })
    if (scanLine) { scanLine.style.removeProperty("opacity"); scanLine.style.removeProperty("transform") }
  }
  return {
    goTo,
    dispose() {
      cancelAnimationFrame(frame); cancelAnimationFrame(focusFrame); observer.disconnect()
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", configure); window.removeEventListener("hashchange", hashChange)
      document.removeEventListener("click", click); host.removeEventListener("focusin", focusIn); media.removeEventListener("change", configure)
      resetVisuals()
    },
  }
}
