---
name: scroll-3d-effects
description: Recipes for scroll-driven storytelling with 3D and "AI / developer" styling on plain HTML/CSS/JS sites — pinned scenes, a holographic part-assembly hero with bloom, scroll-scrubbed Three.js particle morphs, camera fly-throughs, horizontal 3D cover-flow galleries, card tilt, text scramble, velocity marquees, pixel dissolves, word-by-word reveals, boot preloaders, cursor reticles, interactive terminals and Lenis smooth scrolling. Use when building or extending a portfolio / landing page that should feel like an award-site scroll story, or when adding any scroll-linked 3D effect to this repo.
---

# Scroll-driven 3D effects (AI / developer theme)

Distilled from how current award-level sites are built (see Sources) and from
this portfolio's own implementation (`js/main.js`, `js/hero3d.js`, `js/scene3d.js`).

## The pattern everyone converges on

1. **One scroll source of truth.** Native scroll (optionally smoothed by Lenis)
   drives everything. Never animate on `wheel` deltas directly.
2. **Pinned scenes.** A tall section (`height: 300–500vh`) holds a
   `position: sticky; top: 0; height: 100svh` child. Progress is
   `p = clamp(-rect.top / (rect.height - innerHeight))`.
3. **Scrub, don't trigger.** Map `p` straight onto the visual state (morph
   amount, translateX, stroke-dashoffset, word count). Scrolling back
   reverses it for free.
4. **One strong effect per chapter**, everything around it quiet.
   2026 SOTD winners favour restraint over stacking effects.
5. **GPU for the heavy part.** Particle interpolation happens in the vertex
   shader; JS only updates one or two uniforms per frame.

## Stack and pinned versions

| Need | Use | Notes |
|---|---|---|
| 3D | `three@0.169.0` ES module from jsDelivr | single file, no relative imports (r171+ splits into `three.core.js`) |
| Smooth scroll | `lenis@1.3.26` UMD (`dist/lenis.min.js`, global `Lenis`) | skip on reduced motion; touch stays native |
| Timelines | vanilla rAF + progress math | GSAP ScrollTrigger is the common alternative when timelines get complex |

Load 3D as `<script type="module">` files that `import * as THREE from 'three'`
through an importmap, so a CDN failure only loses the 3D layer, never the page:

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/" } }
</script>
```

The importmap is what lets `three/addons/postprocessing/*.js` (bloom) resolve
their own bare `'three'` import.

## Recipes

### 1. Scroll-scrubbed particle morph (Three.js)

Same particle count for every shape; each shape is a `Float32Array` attribute.

```js
geo.setAttribute('position', new THREE.BufferAttribute(shapes[0], 3));
shapes.forEach((s, i) => geo.setAttribute(`aP${i}`, new THREE.BufferAttribute(s, 3)));
geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
```

```glsl
uniform float uMorph;   // 0..N-1, scrubbed from scroll
attribute vec3 aP0, aP1, aP2, aP3; attribute float aRand;
vec3 pick(float i){ return i < .5 ? aP0 : i < 1.5 ? aP1 : i < 2.5 ? aP2 : aP3; }
void main(){
  float seg = floor(min(uMorph, 2.999));
  float t = clamp((uMorph - seg - aRand * .3) / .7, 0., 1.);   // per-particle stagger
  t = t * t * (3. - 2. * t);
  vec3 p = mix(pick(seg), pick(seg + 1.), t);
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_PointSize = uSize * uDpr / -mv.z;
  gl_Position = projectionMatrix * mv;
}
```

- Hold each shape before morphing: `uMorph = act + smoothstep(.45, .95, frac)`.
- Shapes are procedural (noise cloud, helix, layered neural net, Fibonacci globe)
  so there is nothing to download.
- Light backgrounds: normal blending, ink-coloured points, `depthWrite: false`.
  Dark backgrounds: additive blending reads as glow.
- Counts: ~6k desktop, ~2.5k mobile. Cap DPR at 2. Stop the rAF loop when the
  section leaves the viewport (IntersectionObserver).

### 2. Horizontal gallery with 3D cover-flow

Pin the section, set its height to `trackWidth - innerWidth + innerHeight`,
translate the track by `-dist * p`. Per panel, from its centre offset `c`:

```js
const k = clamp(c / innerWidth, -1, 1);
el.style.transform = `rotateY(${-k * 28}deg) translateZ(${-Math.abs(k) * 160}px)`;
```

Parent needs `perspective: 1600px`; the track needs `transform-style: preserve-3d`.
Add inner image parallax with a CSS variable (`--px`) instead of a second transform.

### 3. Card tilt + glare (desktop only)

On `pointermove` over the card media set `--rx`, `--ry` (±6deg) and `--gx`,
`--gy` for a radial-gradient highlight; reset on `pointerleave`. Gate with
`matchMedia('(hover: hover) and (pointer: fine)')`.

### 4. Text scramble / decode

Monospace text resolves left-to-right through a glyph set
(`!<>-_\/[]{}=+*^?#01`). Run once when the element enters the viewport,
~600ms total, keep the final text in the DOM for screen readers (set
`aria-label` to the real text while scrambling).

### 5. Velocity marquee

A tech-stack band whose base speed is boosted by scroll velocity
(`v = (scrollY - lastY) / dt`, eased) and skewed by it (`skewX(clamp(v * .02, -8, 8)deg)`).
Duplicate the content once so the loop is seamless (translate modulo width).

### 6. Pixel dissolve between scenes

A canvas over the pinned scene; precompute cells with a random threshold
(plus a little distance-from-centre bias). For dissolve progress `q`, paint
cells whose threshold `< q`, with a thin band of mid-grey / ink cells at the
edge. Redraw only when `q` changes (quantise to 1/200).

### 7. Word-by-word reveal

Split the paragraph with `Intl.Segmenter(lang, { granularity: 'word' })`
(required for Thai, which has no spaces), wrap words in spans and light the
first `round(p * n)` of them.

### 8. Lenis smooth scroll

```js
const lenis = new Lenis({ lerp: .1, anchors: true });
requestAnimationFrame(function raf(t){ lenis.raf(t); requestAnimationFrame(raf); });
```

- Add `data-lenis-prevent` to every inner scroller (modals, menus) and call
  `lenis.stop()` / `lenis.start()` when a modal opens/closes.
- Replace `window.scrollTo({behavior:'smooth'})` with `lenis.scrollTo(y)`.
- Remove `scroll-behavior: smooth` from `html` while Lenis is active
  (Lenis adds `html.lenis`).

### 9. Holographic part assembly (hero signature moment)

Every object is a `Group` of a fresnel face mesh plus `EdgesGeometry` lines.
Record each part's final transform, start it from an "exploded" position,
and ease it home one part at a time; flash amber when it locks.

```glsl
// hologram face: transparent centre, bright rim
float f = pow(1. - abs(dot(vN, vV)), 2.2);
gl_FragColor = vec4(uColor, (.035 + f * .32) * uOpacity * uGain);
```

```js
const k = clamp((since - part.delay * 1.25) / 1.15);   // 1.15 s per part
const e = k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);      // easeOutExpo
part.obj.position.lerpVectors(part.from, part.pos, e);
part.obj.scale.setScalar(.5 + .5 * e);
if (k >= 1 && !part.locked) { part.locked = true; part.flash = 1; }
mat.color.copy(CYAN).lerp(AMBER, part.flash * .85);   // lock flash
```

- Materials: `AdditiveBlending`, `depthWrite: false`, `DoubleSide`.
- Large flat surfaces (a desk top) read as a blown-out slab at grazing angles,
  because of the fresnel term plus front and back faces. Give them their own
  material clone with `uGain ≈ .3`, and share the opacity uniform object.
- Extras that sell it:
  - a scan plane sweeping up during assembly, then every ~7 s;
  - dashed HUD rings rotating at different speeds;
  - amber dimension lines and sprite labels ("01 DISPLAY ✓");
  - floating panels drawn on `CanvasTexture`;
  - a typing code screen, also a `CanvasTexture`, redrawn only when a character is added.
- Start the assembly on the preloader's `boot:done` event, not on load, so the
  user actually sees it.

### 10. Bloom post-processing

```js
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .85, .5, .12); // strength, radius, threshold
composer.addPass(bloom);
composer.addPass(new OutputPass());          // tone mapping + sRGB at the end
```

- Keep the threshold above ~.1. At .05, every faint face blooms and the scene turns to mush.
- Render bloom at reduced resolution (`.75×` desktop, `.5×` mobile) and set
  `composer.setPixelRatio(1)` on mobile.
- Lower `bloom.strength` as the camera approaches text (screens, labels) so it stays legible.

### 11. Camera fly-through on scroll

`CatmullRomCurve3` for position and a second one for the look-at target.
Map hero progress `.04 → .7` onto `t`, apply an in-out cubic, and fade the
pointer parallax as `t → 1`. Use `camera.setViewOffset()` to frame the
subject off-centre: right of the copy on desktop, below it on mobile. No
CSS transforms on the canvas.

### 12. Boot preloader (terminal style)

- Show **real** progress from real tasks: `document.fonts.ready`, the 3D
  scene's `ready` event (with its own timeout), and `window.load`.
- Cap the duration:
  - first visit ≈ 1.1 s min and 2.4 s max;
  - repeat visit (flag in `sessionStorage`) ≈ 0.35 s min and 1 s max.
- Back the rAF cap with a real `setTimeout`, so a slow device never traps the user.
- Skippable by click, Enter, Esc or Space. `lenis.stop()` while booting.
  `html.booting body { overflow: hidden }`.
- Reduced motion: finish immediately.
- While the overlay covers the scene, don't re-render it. Compile once
  (`renderer.compile(scene, camera)`) and render one frame as a warm-up.

### 13. Cursor reticle and magnetic buttons (fine pointers only)

- Gate both on `(hover: hover) and (pointer: fine)` and no reduced motion.
- Keep the native cursor.
- Cursor states must mean something: `type`, `drag · explore`, `open`, `filter`, `mail`, `visit ↗`.
- Magnetic pull is at most ~25% of the element's size, and the element
  eases back via a CSS `transition: transform`.

### 14. Interactive terminal

- Implement it as a `<form>` with a labelled `<input>`. Commands map to
  functions: `help`, `ls [cat]`, `open <project>`, `skills`, `stack`,
  `contact`, `hire`, `clear`.
- History works with ↑/↓ and Tab completes command names and project ids.
- Output lines use `esc()` on every interpolated value.
- Keep the static contact info visible above the prompt, so the terminal is a bonus and never the only way in.

## Frame-loop rules (from the award-site skills)

- **Framerate-independent damping:**
  `cur += (target - cur) * (1 - Math.pow(1 - ease, dt * 60))`, with `dt` clamped to 1/30.
- Pause the loop when the canvas is off-screen (IntersectionObserver) or the
  tab is hidden (`visibilitychange`). Reset the clock on resume.
- Handle `webglcontextlost`: call `preventDefault()` and fall back to the
  static layer (here, the SVG rig).
- Shaders: `precision mediump float`. Cap DPR at 2 on desktop and 1.5 on mobile.
  Use `antialias: false` when bloom runs anyway.
- Every canvas and SVG colour comes from the CSS tokens (`--bg`, `--accent`,
  `--accent-2`), so one theme switch recolours WebGL too.

## Dark "holographic" theme tokens

```css
--bg:#04070d; --ink:#e6f3ff; --mute:#6f8698; --accent:#36d6ff; --accent-2:#ffb547;
--line:rgba(110,190,255,.13); --glow:0 0 22px rgba(54,214,255,.35);
```

- Fonts: Chakra Petch (display), JetBrains Mono (labels), Kanit (Thai).
- Ornament:
  - grid and glow on `body::before`;
  - scanlines and vignette on `body::after` with `pointer-events: none`;
  - chamfered buttons via `clip-path`;
  - fixed corner brackets;
  - a vertical readout up the left edge, so it never covers content.
- Keep the look original. Don't use film names, logos or characters.

## Non-negotiables

- **Reduced motion**: no Lenis, no pinning (sections `height: auto`), morphs
  jump to their final state, loops stop. Test with Playwright `reducedMotion: 'reduce'`.
- **Readable at rest**: nothing important waits at `opacity: 0` for an observer
  without a JS-off fallback (`.js` class gates hidden states).
- **Fallbacks**: if WebGL or the CDN fails, add a class and show the captions
  as a static list; never a blank pinned screen.
- **Mobile**: shorter pinned sections (~70%), fewer particles, no tilt, no
  cursor effects; check `scrollWidth === innerWidth`.
- **Print**: hide canvases, unpin scenes, reveal everything.

## Testing recipe (sandboxed environments)

The CDN and Google Fonts may be unreachable. In Playwright, `context.route()`
the CDN URLs to local `node_modules` copies (`npm i three@0.169.0 lenis@1.3.26`)
and fonts to `@fontsource/*` CSS. Headless Chromium renders WebGL through
SwiftShader, so screenshots of the 3D scene are real. Scroll to each chapter's
progress points (`top + (height - innerHeight) * p`) and screenshot.

### Screenshots of real projects with Docker (one project at a time)

- Start the project's own `docker compose` stack, seed it, screenshot it with
  Playwright, then run `docker compose down -v` before the next project.
- Behind a TLS-intercepting proxy, mirror the project's Dockerfile and add the proxy CA:

  ```dockerfile
  COPY --from=certs ca-bundle.crt /usr/local/share/ca-certificates/proxy.crt
  ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/proxy.crt
  ```

  Build with `docker build --build-context certs=<dir> --network host`.
- Import SQL seeds with `--default-character-set=utf8mb4`. Without it, Thai text turns into mojibake.

## Sources

- Framer "Particle Cloud" / "MorphField" components — GPU vertex-shader morphs, 20k+ particles, idle-then-gather pattern
- three.js forum: "ValiCred — Kinetic 3D Particle Morphing & WebGL Lore Scroller" (3.4k particles, 12 shapes, ScrollTrigger-synced); "Animate Particles" and "Instanced particle morph animation" threads (equal vertex counts, per-particle lerp)
- Codrops, "From Shader Uniforms to Clip-Path Wipes: How GSAP Drives My Portfolio" (2026) — Lenis as single scroll source, reduced-motion effort
- Codrops, "The Architecture Behind Trionn: Coordinating GSAP, Three.js, Lenis, and Web Audio"
- utsubo.com "8 Best Three.js Websites of 2026" and svilenkovic.com SOTD 2026 notes — scroll-driven 3D narratives, one strong effect
- Framer / shadcn "scramble text decode" components — decode presets, monospace, reduced-motion handling
- Claude skills on GitHub, read and distilled for this file:
  - `tsogjavklann/awwwards-3d` — damping formula, context-loss handling, shader warm-up, low-end detection;
  - `SandroHub013/awwwards-skill` — preloader caps and real progress; cursor and magnetic rules; mask transitions;
  - `tponscr-debug/claude-skill-awwwards` — one signature moment per page, jury scoring;
  - `laasya2005/building-3d-scroll-portfolios` — camera-path scroll scenes, fallbacks.
- three.js examples: `webgl_postprocessing_unreal_bloom`, fresnel/hologram shader pattern
