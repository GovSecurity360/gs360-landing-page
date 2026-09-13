const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(file, globals = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(require.resolve(file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  vm.runInNewContext(code, { exports, ...globals })
  return exports
}
const timeline = load('../lib/scene-timeline.ts')
test('every transition meets the next camera stop continuously and preserves reading distance', () => {
  const ranges = timeline.buildSceneTimeline([800, 800, 1800, 2400, 3000, 1300], 800)
  assert.equal(ranges.length, 6)
  ranges.forEach((range, i) => {
    const read = timeline.sceneAt(ranges, range.readEnd)
    assert.equal(read.index, i)
    assert.equal(read.offset, range.overflow)
    if (i === 5) return
    const next = timeline.sceneAt(ranges, range.end)
    assert.equal(next.index, i + 1)
    assert.equal(next.outgoing, 1)
    for (const key of ['zoom', 'panX', 'dim']) assert.ok(Math.abs(timeline.sceneAt(ranges, range.end - .001)[key] - next[key]) < .001)
    assert.equal(timeline.sceneAt(ranges, range.start).outgoing, 1)
  })
})

function mount() {
  const frames = new Map(), events = new Map(), documentEvents = new Map()
  let y = 0, now = 0, seq = 0, disconnected = false, observerCallback
  let focused = null
  const contents = [800, 800, 1800, 2400, 3000, 1300].map(scrollHeight => ({ scrollHeight }))
  const portraits = Array.from({ length: 8 }, (_, i) => ({
    style: { removeProperty(key) { delete this[key] } },
    getBoundingClientRect: () => ({ top: 400 + Math.floor(i / 4) * 600 - panels[4].scrollTop }),
  }))
  const ids = ['opening', 'platform', 'workflow', 'fips199-demo', 'about', 'contact']
  const panels = ids.map((id, i) => {
    const attrs = new Map()
    return {
      dataset: { sceneId: id }, scrollTop: 0, inert: false,
      style: { removeProperty(key) { delete this[key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] } },
      querySelector: () => contents[i], querySelectorAll: name => i === 4 && name.includes('.portrait-image') ? portraits : [],
      getAttribute: key => attrs.get(key), setAttribute: (key, val) => attrs.set(key, val), removeAttribute: key => attrs.delete(key),
      contains: el => el === focused && focused === id,
      getBoundingClientRect: () => ({ top: 0 }),
    }
  })
  const buttons = ids.map(() => ({ focus() { focused = null }, setAttribute() {}, removeAttribute() {} }))
  const mediaEvents = new Map()
  const media = { matches: true, addEventListener: (k, fn) => mediaEvents.set(k, fn), removeEventListener: k => mediaEvents.delete(k) }
  const scanLine = { style: { removeProperty(key) { delete this[key] } } }
  const host = {
    dataset: {}, style: { removeProperty(key) { delete this[key] } },
    getBoundingClientRect: () => ({ top: -y }),
    querySelector: name => name === '.scene-scan-line' ? scanLine : { clientHeight: 800 },
    querySelectorAll: name => name === '.scene-panel' ? panels : buttons,
    addEventListener() {}, removeEventListener() {},
  }
  const win = {
    get scrollY() { return y }, innerHeight: 800,
    matchMedia: () => media, location: { hash: '' }, history: { pushState() {} },
    scrollTo({ top }) { y = top; events.get('scroll')?.() },
    addEventListener: (k, fn) => events.set(k, fn), removeEventListener: k => events.delete(k),
    dispatchEvent(event) { events.get(event.type)?.() },
  }
  const doc = { get activeElement() { return focused }, getElementById: () => null,
    addEventListener: (k, fn) => documentEvents.set(k, fn), removeEventListener: k => documentEvents.delete(k) }
  const controller = load('../lib/scene-controller.ts', {
    require: () => timeline, window: win, document: doc, Event,
    performance: { now: () => now },
    requestAnimationFrame(fn) { frames.set(++seq, fn); return seq },
    cancelAnimationFrame(id) { frames.delete(id) },
    ResizeObserver: class { constructor(fn) { observerCallback = fn } observe() {} disconnect() { disconnected = true } },
  }).mountSceneJourney(host, { current: {} })
  return {
    controller, host, panels, contents, frames, events, media, mediaEvents, documentEvents, scanLine, portraits,
    resize: () => observerCallback(), focus: id => { focused = id },
    get y() { return y }, get focused() { return focused }, get disconnected() { return disconnected },
    scroll(top) { y = top; events.get('scroll')() },
    settle() {
      for (let i = 0; i < 150 && frames.size; i++) {
        now += 1000 / 60
        const work = [...frames.values()]; frames.clear(); work.forEach(fn => fn(now))
      }
      assert.equal(frames.size, 0)
    },
  }
}
test('controller reaches all six scenes, coalesces input, restores focus, and reverses', () => {
  const m = mount()
  assert.equal(m.host.dataset.sceneMode, 'pinned')
  assert.equal(m.panels[1].inert, true)
  m.focus('opening')
  m.controller.goTo('about', false)
  m.settle()
  assert.equal(m.host.dataset.activeScene, 'about')
  assert.equal(m.panels[4].inert, false)
  assert.equal(m.focused, null)
  const start = m.y
  m.scroll(start + 500); m.scroll(start + 600)
  assert.equal(m.frames.size, 1)
  m.settle()
  assert.ok(m.panels[4].scrollTop >= 599)
  m.controller.goTo('contact', false); m.settle()
  assert.equal(m.host.dataset.activeScene, 'contact')
  m.controller.goTo('top', false); m.settle()
  assert.equal(m.panels[0].inert, false)
  assert.equal(m.panels[4].inert, true)
  m.controller.dispose()
  assert.equal(m.events.size, 0)
  assert.equal(m.frames.size, 0)
  assert.equal(m.mediaEvents.size, 0)
  assert.equal(m.documentEvents.size, 0)
  assert.ok(m.disconnected)
})

test('five distinct transitions zoom, drift, scan, pull back, then settle', () => {
  const transition = timeline.sceneTransition
  const kinds = ['zoom', 'drift', 'scan', 'pullback', 'settle']
  kinds.forEach((kind, i) => assert.equal(transition(i, .5).kind, kind))
  assert.ok(transition(0, 1).zoom > transition(0, 0).zoom)
  assert.equal(transition(1, 1).zoom, transition(1, 0).zoom)
  assert.ok(transition(1, 1).panX < transition(1, 0).panX)
  assert.ok(transition(1, .5).outgoingX < 0 && transition(1, .5).incomingX > 0)
  assert.equal(transition(2, 0).scanReveal, 0)
  assert.equal(transition(2, 1).scanReveal, 1)
  assert.ok(transition(2, .6).scanOpacity > 0)
  assert.equal(transition(2, 1).scanOpacity, 0)
  assert.ok(transition(3, 1).zoom < transition(3, 0).zoom)
  assert.equal(transition(4, 0).zoom, transition(4, 1).zoom)
  assert.equal(transition(4, 0).panX, transition(4, 1).panX)
  assert.ok(transition(4, 1).dim > transition(4, 0).dim)
  // Scrubbing backwards must be a pure reversal, not a time-based replay.
  for (let i = 0; i < 5; i++) {
    const forward = Array.from({ length: 21 }, (_, n) => transition(i, n / 20))
    for (let n = 20; n >= 0; n--) assert.deepEqual(transition(i, n / 20), forward[n])
  }
})

test('daylight changes between text scenes and remains continuous on reverse scroll', () => {
  for (let step = 0; step <= 100; step++) {
    const state = timeline.sceneTransition(0, step / 100)
    if (state.outgoing > 0) assert.equal(state.daylight, 0, 'white hero text keeps its dark background')
    if (state.incoming > 0) assert.equal(state.daylight, 1, 'navy platform text waits for the light background')
  }
  for (let i = 0; i < 5; i++) {
    const end = timeline.sceneTransition(i, 1), next = timeline.sceneTransition(i + 1, 0)
    assert.equal(end.daylight, next.daylight)
    assert.deepEqual(end.paper, next.paper)
  }
})

test('daylight text and form boundary colors contrast with every scene paper', () => {
  const css = fs.readFileSync(require.resolve('../styles/daylight.css'), 'utf8')
  const rgb = hex => hex.match(/\w\w/g).map(pair => parseInt(pair, 16))
  const luminance = color => color.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0)
  const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05)
  for (let i = 1; i < 6; i++) {
    const paper = timeline.sceneTransition(i, 0).paper
    // Include the darkest glyph pixels behind text, not just an empty surface.
    const textured = paper.map((c, n) => c * .9505 + [36, 68, 90][n] * .0495)
    for (const token of ['ink', 'muted', 'accent']) {
      const hex = css.match(new RegExp('--day-' + token + ': #(\\w{6})'))[1]
      assert.ok(contrast(rgb(hex), textured) >= 4.5, token + ' on scene ' + i)
    }
    const inputLine = css.match(/--day-input-line: #(\w{6})/)[1]
    assert.ok(contrast(rgb(inputLine), textured) >= 3, 'form boundary on scene ' + i)
  }
})

test('portrait reveal staggers arrival, follows reading, and never changes layout', () => {
  const reveal = timeline.portraitReveal
  assert.ok(reveal(400, 0, 800, .7, 0) > reveal(400, 0, 800, .7, 3))
  assert.equal(reveal(400, 0, 800, 1, 7), 1)
  assert.equal(reveal(1000, 0, 800, 1, 0), 0)
  assert.equal(reveal(1000, 600, 800, 1, 0), 1)
})

test('controller applies portrait stagger on entry and removes it in reduced-layout fallback', () => {
  const m = mount()
  const ranges = timeline.buildSceneTimeline(m.contents.map(c => c.scrollHeight), 800)
  m.scroll(ranges[3].readEnd + (ranges[3].end - ranges[3].readEnd) * .7); m.settle()
  assert.ok(Number(m.portraits[0].style.opacity) > Number(m.portraits[3].style.opacity))
  m.controller.goTo('about', false); m.settle()
  assert.equal(Number(m.portraits[0].style.opacity), 1)
  assert.equal(Number(m.portraits[4].style.opacity), 0)
  m.scroll(m.y + 700); m.settle()
  assert.equal(Number(m.portraits[4].style.opacity), 1)
  m.media.matches = false; m.mediaEvents.get('change')()
  assert.ok(m.portraits.every(p => p.style.opacity === undefined && p.style.transform === undefined))
  m.controller.dispose()
})

test('scan reveal keeps partially hidden demo controls inert and cleans up on reverse and fallback', () => {
  const m = mount()
  const ranges = timeline.buildSceneTimeline(m.contents.map(c => c.scrollHeight), 800)
  m.scroll(ranges[2].readEnd + (ranges[2].end - ranges[2].readEnd) * .65); m.settle()
  assert.match(m.panels[3].style.clipPath, /inset/)
  assert.equal(m.panels[3].inert, true)
  assert.equal(m.panels[3].style.visibility, '')
  assert.ok(Number(m.scanLine.style.opacity) > 0)
  m.controller.goTo('fips199-demo', false); m.settle()
  assert.equal(m.panels[3].style.clipPath, '')
  assert.equal(m.panels[3].inert, false)
  assert.equal(Number(m.scanLine.style.opacity), 0)
  m.controller.goTo('platform', false); m.settle()
  assert.equal(m.panels[3].style.clipPath, '')
  m.media.matches = false; m.mediaEvents.get('change')()
  assert.equal(m.scanLine.style.opacity, undefined)
  assert.ok(m.panels.every(p => p.style.transform === undefined))
  m.controller.dispose()
})
test('content expansion preserves reading position; unchanged resize does not restart a transition', () => {
  const m = mount()
  m.controller.goTo('about', false); m.settle()
  const before = m.y
  m.contents[2].scrollHeight += 400
  m.resize()
  assert.equal(m.y, before + 400)
  assert.equal(m.host.dataset.activeScene, 'about')
  const ranges = timeline.buildSceneTimeline(m.contents.map(c => c.scrollHeight), 800)
  m.scroll(ranges[4].readEnd + 320); m.settle()
  const transitionY = m.y
  m.resize()
  assert.equal(m.y, transitionY)
  m.media.matches = false; m.mediaEvents.get('change')()
  assert.equal(m.host.dataset.sceneMode, 'flow')
  assert.ok(m.panels.every(panel => !panel.inert && !panel.getAttribute('aria-hidden')))
  assert.equal(m.host.style.height, undefined)
  m.controller.dispose()
})
