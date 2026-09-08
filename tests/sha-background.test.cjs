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
  const frames = new Map()
  const context = {
    clearRect() { frameDraws++ }, drawImage() {}, fillRect() {}, setTransform() {},
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
  exports.default()
  cleanup = effect()
  return {
    exports, canvas, tile, frames,
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
