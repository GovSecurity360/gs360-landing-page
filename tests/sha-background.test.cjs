const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the actual component with deterministic canvas/browser lifecycle mocks.
const code = ts.transpileModule(
  fs.readFileSync(require.resolve('../components/ShaBackground.tsx'), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
).outputText

function mount(width = 1953, height = 1210, reduced = false) {
  let effect, cleanup, resizeCallback, mediaCallback, nextId = 0
  let glyphDraws = 0, frameDraws = 0, disconnected = false
  const transforms = [], paints = []
  const frames = new Map()
  const context = {
    clearRect() { frameDraws++ }, drawImage() {}, fillRect() { paints.push({ composite: this.globalCompositeOperation, color: this.fillStyle, alpha: this.globalAlpha }) }, setTransform(...args) { transforms.push(args) },
    fillText() { glyphDraws++ }, measureText() { return { width: 7 } },
    createLinearGradient() { return { addColorStop() {} } },
  }
  const host = { clientWidth: width, clientHeight: height }
  const canvas = { width: 300, height: 150, parentElement: host, getContext: () => context }
  const tile = { width: 300, height: 150, getContext: () => context }
  const media = {
    matches: reduced,
    addEventListener(_, fn) { mediaCallback = fn },
    removeEventListener(_, fn) { assert.equal(fn, mediaCallback); mediaCallback = undefined },
  }
  const exports = {}
  vm.runInNewContext(code, {
    exports,
    require: (name) => name === 'react'
      ? { useRef: () => ({ current: canvas }), useEffect: (fn) => { effect = fn } }
      : { jsx() {}, jsxs() {} },
    document: { createElement: () => tile },
    window: { matchMedia: () => media }, performance: { now: () => 0 },
    requestAnimationFrame(fn) { frames.set(++nextId, fn); return nextId },
    cancelAnimationFrame(id) { frames.delete(id) },
    ResizeObserver: class {
      constructor(fn) { resizeCallback = fn }
      observe() {}
      disconnect() { disconnected = true }
    },
  })
  const handoff = { current: exports.openingTransition(0) }
  exports.default({ handoff })
  cleanup = effect()
  return {
    exports, canvas, tile, frames, transforms, paints, context,
    scroll(progress, immersive = true) { handoff.current = exports.openingTransition(progress, immersive) },
    camera(values) { handoff.current = { ...handoff.current, ...values } },
    get glyphDraws() { return glyphDraws },
    get frameDraws() { return frameDraws },
    tick(time) {
      const callbacks = [...frames.values()]
      frames.clear()
      callbacks.forEach((fn) => fn(time))
    },
    resize(w, h) { host.clientWidth = w; host.clientHeight = h; resizeCallback() },
    reduced(value) { media.matches = value; mediaCallback() },
    cleanup() { cleanup(); assert.ok(disconnected); assert.equal(mediaCallback, undefined) },
  }
}

test('both backing stores stay within the pixel budget across viewport sizes', () => {
  for (const [width, height] of [[390, 844], [1953, 1210], [3840, 2160], [7680, 4320], [32768, 100]]) {
    const m = mount(width, height)
    for (const buffer of [m.canvas, m.tile]) {
      assert.ok(buffer.width * buffer.height <= m.exports.MAX_BACKGROUND_PIXELS)
      assert.ok(buffer.width > 0 && buffer.height > 0)
    }
    m.cleanup()
  }
})

test('animation reuses glyphs, throttles drawing, and retains only one scheduled frame', () => {
  const m = mount()
  const glyphs = m.glyphDraws
  m.tick(0)
  m.tick(10)
  assert.equal(m.frameDraws, 1)
  for (let time = 50; time < 10000; time += 50) m.tick(time)
  assert.equal(m.glyphDraws, glyphs)
  assert.equal(m.frames.size, 1)
  m.resize(390, 844)
  assert.equal(m.canvas.width, 390)
  assert.equal(m.canvas.height, 844)
  assert.equal(m.frames.size, 1)
  const resizedGlyphs = m.glyphDraws
  m.resize(390, 844)
  assert.equal(m.glyphDraws, resizedGlyphs)
  m.cleanup()
  assert.equal(m.frames.size, 0)
  assert.equal(m.canvas.width * m.canvas.height, 1)
  assert.equal(m.tile.width * m.tile.height, 1)
})

test('reduced motion draws one static frame and resumes cleanly when changed', () => {
  const m = mount(390, 844, true)
  m.tick(0)
  assert.equal(m.frameDraws, 1)
  assert.equal(m.frames.size, 0)
  m.reduced(false)
  m.tick(100)
  assert.equal(m.frames.size, 1)
  m.reduced(true)
  m.tick(110)
  assert.equal(m.frames.size, 0)
  m.cleanup()
})

test('zoom and reverse scrolling reuse the same bounded backing stores and cached glyphs', () => {
  const m = mount(3840, 2160)
  const dimensions = [m.canvas.width, m.canvas.height, m.tile.width, m.tile.height]
  const glyphs = m.glyphDraws
  let time = 0
  for (const progress of [0, .25, .5, .8, 1, .8, .5, .25, 0]) {
    m.scroll(progress)
    m.tick(time += 50)
    assert.deepEqual([m.canvas.width, m.canvas.height, m.tile.width, m.tile.height], dimensions)
    assert.equal(m.glyphDraws, glyphs)
    assert.deepEqual(m.transforms.at(-1), [1, 0, 0, 1, 0, 0])
    assert.equal(m.frames.size, 1)
  }
  assert.ok(m.transforms.some(([zoom]) => zoom === 2.6))
  m.cleanup()
  assert.equal(m.frames.size, 0)
})

test('scene transition stays dark, settles its zoom, and fully bypasses reduced motion', () => {
  const m = mount()
  const model = m.exports.openingTransition
  assert.equal(model(-1).zoom, 1)
  assert.equal(model(5).zoom, 2.6)
  assert.equal(model(NaN).contentOpacity, 1)
  assert.equal(model(1).dim, .25)
  assert.equal(model(1).platformOpacity, 1)
  assert.equal(model(.8).zoom, model(1).zoom)
  assert.equal(model(1).contentOpacity, 0)
  assert.equal(model(.5, false).zoom, 1)
  assert.equal(model(0).platformOpacity, 0)
  for (const p of [0, .5, 1]) {
    assert.equal(model(p, true, true).zoom, 1)
    assert.equal(model(p, true, true).dim, 0)
    assert.equal(model(p, true, true).contentOpacity, 1)
    assert.equal(model(p, true, true).platformOpacity, 1)
  }
  m.cleanup()
})


test('moving camera redraws on every display frame without rebuilding glyphs', () => {
  const m = mount()
  const glyphs = m.glyphDraws
  for (let i = 0; i < 20; i++) {
    m.scroll(.2 + i * .02)
    const before = m.frameDraws
    m.tick(i * (1000 / 60))
    assert.equal(m.frameDraws, before + 1)
    assert.equal(m.glyphDraws, glyphs)
  }
  const before = m.frameDraws
  m.tick(20 * (1000 / 60))
  assert.equal(m.frameDraws, before, 'settled camera uses the idle throttle')
  m.cleanup()
})

test('scroll damping is refresh-rate independent and does not overshoot on reverse scroll', () => {
  const m = mount()
  const damp = m.exports.smoothScrollProgress
  const run = (hz) => { let p = 0; for (let i = 0; i < hz / 5; i++) p = damp(p, 1, 1000 / hz); return p }
  assert.ok(Math.abs(run(60) - run(120)) < .0001)
  assert.ok(damp(0, 1, 16.67) > 0 && damp(0, 1, 16.67) < .3)
  let p = .9
  for (let i = 0; i < 100; i++) {
    const next = damp(p, 0, 16.67)
    assert.ok(next >= 0 && next <= p)
    p = next
  }
  assert.equal(p, 0)
  m.cleanup()
})

test('sideways camera movement redraws at display rate and keeps viewport coverage without allocating', () => {
  const m = mount(1920, 1080)
  const dimensions = [m.canvas.width, m.canvas.height, m.tile.width, m.tile.height]
  const glyphs = m.glyphDraws
  for (let i = 0; i < 20; i++) {
    m.camera({ zoom: 2.6, panX: -.16 * i / 19 })
    const before = m.frameDraws
    m.tick(i * (1000 / 60))
    assert.equal(m.frameDraws, before + 1)
    const [zoom, , , , x] = m.transforms.at(-2)
    assert.ok(x <= 0 && x + m.canvas.width * zoom >= m.canvas.width)
    assert.equal(m.glyphDraws, glyphs)
    assert.deepEqual([m.canvas.width, m.canvas.height, m.tile.width, m.tile.height], dimensions)
  }
  m.reduced(true); m.tick(400)
  assert.deepEqual(m.transforms.at(-2), [1, 0, 0, 1, 0, 0])
  assert.equal(m.frames.size, 0)
  m.cleanup()
})

test('daylight recolors cached glyphs, restores compositing, and reverses without new buffers', () => {
  const m = mount()
  const dimensions = [m.canvas.width, m.canvas.height, m.tile.width, m.tile.height]
  const glyphs = m.glyphDraws
  let time = 0
  for (const daylight of [0, .25, .5, 1, .5, 0]) {
    m.paints.length = 0
    m.camera({ daylight, paper: [217, 232, 241] })
    m.tick(time += 17)
    if (daylight) {
      assert.ok(m.paints.some(p => p.composite === 'source-in'))
      assert.ok(m.paints.some(p => p.composite === 'destination-over' && p.color === 'rgb(217, 232, 241)'))
      assert.equal(m.context.globalCompositeOperation, 'source-over')
      assert.equal(m.context.globalAlpha, 1)
    } else assert.ok(!m.paints.some(p => p.composite === 'destination-over'))
    assert.deepEqual([m.canvas.width, m.canvas.height, m.tile.width, m.tile.height], dimensions)
    assert.equal(m.glyphDraws, glyphs)
    assert.equal(m.frames.size, 1)
  }
  m.camera({ daylight: 1 }); m.reduced(true)
  m.paints.length = 0; m.tick(200)
  assert.ok(!m.paints.some(p => p.composite === 'destination-over'))
  assert.equal(m.frames.size, 0)
  m.cleanup()
})
