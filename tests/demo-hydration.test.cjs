const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Run the real demo's initial render with and without browser globals.
// Effects are held until commit, just as they are during hydration.
function mount(browser) {
  const states = [], effects = [], portals = []
  let cursor = 0, initial = true
  const body = { style: {} }
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../components/Fips199Demo.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText.replaceAll('import.meta.url', JSON.stringify('file:///test/Fips199Demo.tsx'))
  const hooks = {
    ...React,
    useState(value) {
      const index = cursor++
      if (initial) states[index] = value
      return [states[index], next => { states[index] = next }]
    },
    useRef: value => ({ current: value }),
    useEffect: effect => { if (initial) effects.push(effect) },
  }
  vm.runInNewContext(code, {
    exports,
    ...(browser ? { document: { body }, window: {} } : {}),
    require(name) {
      if (name === 'react') return hooks
      if (name === 'react-dom') return { createPortal: (children, target) => { portals.push({ children, target }); return null } }
      if (name === 'framer-motion') return {
        motion: new Proxy({}, { get: (_, tag) => ({ children, initial, animate, exit, transition, whileInView, viewport, whileHover, whileTap, ...props }) => React.createElement(tag, props, children) }),
        AnimatePresence: ({ children }) => children,
        useInView: () => false, useReducedMotion: () => false,
      }
      return require(name)
    },
  })
  return {
    portals, body,
    render() {
      cursor = 0
      const tree = exports.default({ tone: 'light' })
      initial = false
      return renderToStaticMarkup(tree)
    },
    commit() { effects.forEach(effect => effect()) },
  }
}

test('demo server and first browser render match and do not create a portal before commit', () => {
  const server = mount(false), client = mount(true)
  assert.equal(client.render(), server.render())
  assert.equal(server.portals.length, 0)
  assert.equal(client.portals.length, 0, 'first browser render must not add a portal absent from SSR')
  client.commit()
  client.render()
  assert.equal(client.portals.length, 1)
  assert.equal(client.portals[0].target, client.body)
  assert.equal(client.portals[0].children.props.className, 'editorial')
})
