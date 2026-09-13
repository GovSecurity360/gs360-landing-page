const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const root = path.resolve(__dirname, '..')
const cache = new Map()
function load(relative) {
  const file = path.resolve(root, relative)
  if (cache.has(file)) return cache.get(file)
  const module = { exports: {} }
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText
  vm.runInNewContext(code, {
    module, exports: module.exports, console, process,
    require(name) {
      if (name.endsWith('.css')) return {}
      if (name.startsWith('@/')) {
        const stem = name.slice(2)
        return load(fs.existsSync(path.join(root, stem + '.tsx')) ? stem + '.tsx' : stem + '.ts')
      }
      if (name.startsWith('./')) {
        const stem = path.resolve(path.dirname(file), name)
        return load(path.relative(root, fs.existsSync(stem + '.tsx') ? stem + '.tsx' : stem + '.ts'))
      }
      return require(name)
    },
  }, { filename: file })
  cache.set(file, module.exports)
  return module.exports
}

test('evidence brief renders five accessible tabs and an explicitly illustrative default finding', () => {
  const html = renderToStaticMarkup(React.createElement(load('components/ConnectedView.tsx').default))
  assert.equal((html.match(/role="tab"/g) || []).length, 5)
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1)
  assert.match(html, /role="tabpanel"/)
  assert.match(html, /Illustrative workflow/)
  assert.match(html, /Not live system data/)
  assert.match(html, /Access review is overdue/)
  assert.match(html, /href="#fips199-demo"/)
  assert.doesNotMatch(html, /Keep essential services available/)
})

test('redesign retains team roles, grayscale assets, standards, and advisor disclosure', () => {
  const sections = load('components/EditorialSections.tsx')
  const html = renderToStaticMarkup(React.createElement(sections.PeopleSection))
  for (const text of ['David Han', 'CTO', 'Tim Han', 'Head of Development', 'Executive Advisor, Marketing, Channels &amp; Growth', 'Board of advisors']) assert.ok(html.includes(text), text)
  assert.match(html, /Karen_Newnam.webp/)
  assert.equal((html.match(/loading="lazy"/g) || []).length, 11)
  assert.match(html, /<details class="advisors"/)
  const platform = renderToStaticMarkup(React.createElement(sections.PlatformSection))
  for (const standard of ['NIST 800-53', 'RMF', 'FedRAMP', 'OSCAL', 'FISMA']) assert.ok(platform.includes(standard))
})

test('workflow has no scroll loop and processing does not simulate completed server steps', () => {
  const connected = fs.readFileSync(path.join(root, 'components/ConnectedView.tsx'), 'utf8')
  assert.doesNotMatch(connected, /useScroll|scrollYProgress|requestAnimationFrame|setInterval/)
  const demo = fs.readFileSync(path.join(root, 'components/Fips199Demo.tsx'), 'utf8')
  assert.doesNotMatch(demo, /setStatusIdx|setLoadingPhase|STEP_MS/)
  assert.match(demo, /waiting for the analysis to return/)
  assert.match(demo, /fetch\("\/api\/fips199-demo"/)
  assert.match(demo, /await loadingTask.destroy\(\)/)
})

test('all content shares a single background canvas owned outside the opening stage', () => {
  const Opening = load('components/Opening.tsx').default
  const html = renderToStaticMarkup(React.createElement(Opening, { scenes: [
    { id: 'platform', label: 'Platform', content: React.createElement('p', null, 'Platform scene') },
    { id: 'later-sections', label: 'Later', content: React.createElement('div', { id: 'later-sections' }, 'Demo, people, contact') },
  ] }))
  assert.equal((html.match(/<canvas/g) || []).length, 1)
  assert.match(html, /class="shared-experience"><div class="sha-background"/)
  assert.match(html, /id="later-sections"/)
  const page = fs.readFileSync(path.join(root, 'app/page.tsx'), 'utf8')
  assert.equal((html.match(/class="scene-panel"/g) || []).length, 3)
  for (const id of ['platform', 'workflow', 'fips199-demo', 'about', 'contact']) assert.ok(page.includes('id: "' + id + '"'))
  assert.ok(page.indexOf('<Opening ') < page.indexOf('<Fips199Demo '))
})
