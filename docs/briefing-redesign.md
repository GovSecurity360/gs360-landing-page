# Federal briefing preview

Local design experiment based on the clean checkout at `63d7ae3`.
Nothing is committed, pushed, or deployed by this change.

- Preserves the SHA opening's initial appearance, optimized portraits, team titles, and API contracts.
- Replaces the scroll-driven workflow with a compact Radix Tabs evidence brief.
- Labels all workflow records as illustrative, not actual product screenshots or live data.
- Refines the platform, demo, people, and contact sections with scoped `styles/briefing.css` rules.
- Removes timer-driven analysis checklist states; processing now waits for the real response.
- Adds no dependencies, images, videos, external fonts, or background animation loops.

## Returning to the previous design

The pre-experiment versions of the seven modified tracked files are available at `63d7ae3`:
`app/layout.tsx`, `components/ConnectedView.tsx`, `components/ContactSection.tsx`,
`components/EditorialSections.tsx`, `components/Fips199Demo.tsx`,
`styles/connected-view.css`, and `styles/globals.css`.

The experiment also adds `styles/briefing.css`, `tests/briefing.test.cjs`, and this note.
If reverting later, review intervening edits before restoring any file. Do not reset
the entire repository or discard unrelated work.

## Checks

Run `node --test tests/*.test.cjs`, `pnpm exec tsc --noEmit`, and `pnpm build`.
The tests cover server-rendered structure, preserved content, analysis-state
contracts, and the existing SHA canvas memory safeguards. They do not replace
interactive browser testing or measurement of real browser memory.

## Earlier two-scene prototype (superseded below)

Opening and the platform overview now share a single sticky viewport and one dark
SHA canvas. Native document scrolling advances the scene: headline fades out, code
zooms to 2.6x, then the overview fades in and stays still. A 240svh outer container
provides the scroll travel; the renderer remains viewport-sized and capped at two
million pixels. No white wash, scan docking, scroll interception, video, or new canvas.

`PlatformOverview` moves the existing introductory copy into Opening as server-rendered
children. The detailed workflow, capabilities, demo, people, and contact remain in
normal document flow after the prototype. Scene navigation buttons replay the two
states. Inactive scenes are inert and hidden from accessibility APIs; focused controls
are moved to persistent scene navigation when their scene becomes inactive.

The enhancement uses `styles/opening-scenes.css`. Below 900px width or 700px height,
with reduced motion, without JavaScript, or when either scene is too tall, both scenes
are readable in normal flow on the same dark background. Offscreen/tab-hidden canvas
cleanup remains in place. Scroll handling is event-driven and coalesced.

Automated checks cover allocation reuse while zooming, reversible scene values, inert
states, focus handling, overflow fallback, and listener cleanup. Actual browser memory
and visual quality have not been measured in browser QA.

Local preview builds use `.next-dev`, while production builds retain `.next`.
This prevents a validation build from overwriting the running preview's manifests
and assets. Both generated folders are ignored by Git.

This prototype also changes app/page.tsx to pass the overview into Opening, moves the
platform introduction out of PlatformSection, and imports opening-scenes.css in the
layout. Reverting the scenes must undo those changes together while retaining earlier
briefing changes. Do not restore whole files without reviewing their combined edits.

## Shared background and scroll smoothing (background retained)

The current iteration lifts the only SHA canvas outside the opening stage into a
fixed, viewport-sized layer behind the entire page. It remains visible through the
workflow, demo, people, contact, and footer. `styles/shared-background.css` provides
dark surfaces and light text while retaining the demo's light input/results panel.
The canvas no longer unmounts after leaving the opening (it is now intentionally
used by the later sections), but still releases its backing stores when the browser
tab is hidden or the component unmounts. Its pixel cap is unchanged.

This iteration originally left later sections in normal flow. That cutoff is replaced
by the full-page scene journey below.

Scroll positions now pass through time-based damping with a short settling period.
The camera redraws on each display frame while its zoom or dim value changes, and
returns to the lower code-drift rate while idle. Scroll geometry is read on input,
not during the easing frames. Glyph tiles are reused and no canvas allocation occurs
while zooming. Tests cover 60/120 Hz damping equivalence, per-frame moving-camera
redraws, idle throttling, one-canvas ownership, and cleanup. This is not a measurement
of actual browser frame rate or memory consumption.

## Full-page scene journey

All six scenes now belong to one sticky stage: opening, platform overview, workflow,
demo, team, and contact/footer. Native page scroll controls each scene's reading
distance, followed by a fade-out, code zoom, and fade-in. The background camera rests
while reading. Long scenes scroll their content within the stage before transitioning;
there is no independent wheel handler or nested user-controlled scrollbar.

`lib/scene-timeline.ts` calculates reading/transition ranges from actual content heights.
`lib/scene-controller.ts` coalesces scroll input, damps motion, handles hash navigation
and focus, and remeasures expanding content without losing the reading position.
The demo's warning and processing overlays are portaled outside the stage and lock
background scrolling. Existing API calls and content remain unchanged.

At widths below 900px, heights below 650px, or with reduced motion enabled, content
remains in normal flow on the same background. Without JavaScript it also stays readable.
Only the existing bounded SHA canvas is used; no extra canvases or media were added.

Tests cover all scene boundaries, reverse travel, long-content reading distances,
dynamic height changes, focus/inert states, reduced-layout fallback, listener cleanup,
and canvas reuse. Browser frame rate, visual quality, and memory still require
interactive review. Reverting this iteration requires reviewing Opening, page.tsx,
the new scene libraries/CSS/tests, and the demo overlay changes together.

## Varied transitions and final-scene footer

The scene timeline now interpolates between fixed camera stops instead of zooming
deeper at every boundary. Opening zooms in, platform-to-workflow pans sideways,
workflow-to-demo uses a top-to-bottom scan reveal, demo-to-team pulls back with
staggered portrait images, and contact gently fades in with a stationary camera.
All effects derive from scroll position and reverse without timers. Portrait
positions are measured on layout changes, never during the animation loop.

The scan uses one decorative line and a viewport-sized clip on the incoming panel.
Demo controls remain inert until the reveal completes; the hydration-safe portaled
warning and processing overlays remain outside the scene stage. Reduced-motion
and small-screen fallback remove clips, transforms, and portrait opacity changes.
The existing canvas handles the lateral camera move without resizing its buffers.

The pinned contact scene is a minimum-viewport-height flex column. Contact takes
available space and the footer sits at the bottom, with room inside its lower edge
for scene navigation. Long forms still extend naturally rather than overlapping
a fixed footer.

## Dark-to-daylight palette

The original opening stays dark. In the first scene handoff, its text exits before
the canvas brightens; navy platform text enters only once the light surface is
fully established. Subsequent camera stops progress from pale blue to cool near-white,
then light blue for contact. The footer stays navy.

The same cached glyph mask is recolored in place using canvas compositing, with
reduced glyph opacity on light surfaces. No extra canvas, video, full-screen blur,
or text regeneration is added. The persistent header and scene navigation use a
light theme after the handoff; footer navigation stays dark. Mobile, reduced-motion,
and no-JS layouts have readable light section surfaces independently of the canvas.

The palette is scoped in `styles/daylight.css`, imported after the existing styles.
To revert just this experiment, review that import/file, the daylight/paper fields
in the scene timeline/controller and canvas renderer, and their tests. Retain the
previous varied transitions, footer layout, and hydration fix.

Automated checks cover handoff timing, palette continuity, cached-buffer reuse,
compositing cleanup, and text/input-boundary contrast against the paper colors
including the code tint. These checks are not a full browser accessibility audit.
