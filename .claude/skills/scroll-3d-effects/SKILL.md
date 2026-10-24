---
name: scroll-3d-effects
description: Recipes for scroll-driven storytelling with 3D and "AI / developer" styling on plain HTML/CSS/JS sites — pinned scenes, scroll-scrubbed Three.js particle morphs, horizontal 3D cover-flow galleries, card tilt, text scramble, velocity marquees, pixel dissolves, word-by-word reveals and Lenis smooth scrolling. Use when building or extending a portfolio / landing page that should feel like an award-site scroll story, or when adding any scroll-linked 3D effect to this repo.
---

# Scroll-driven 3D effects (AI / developer theme)

Distilled from how current award-level sites are built (see Sources) and from
this portfolio's own implementation (`js/main.js`, `js/scene3d.js`).

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

Load 3D as `<script type="module" src="js/scene3d.js">` that imports three from
the CDN, so a CDN failure only loses the 3D layer, never the page.

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

## Sources

- Framer "Particle Cloud" / "MorphField" components — GPU vertex-shader morphs, 20k+ particles, idle-then-gather pattern
- three.js forum: "ValiCred — Kinetic 3D Particle Morphing & WebGL Lore Scroller" (3.4k particles, 12 shapes, ScrollTrigger-synced); "Animate Particles" and "Instanced particle morph animation" threads (equal vertex counts, per-particle lerp)
- Codrops, "From Shader Uniforms to Clip-Path Wipes: How GSAP Drives My Portfolio" (2026) — Lenis as single scroll source, reduced-motion effort
- Codrops, "The Architecture Behind Trionn: Coordinating GSAP, Three.js, Lenis, and Web Audio"
- utsubo.com "8 Best Three.js Websites of 2026" and svilenkovic.com SOTD 2026 notes — scroll-driven 3D narratives, one strong effect
- Framer / shadcn "scramble text decode" components — decode presets, monospace, reduced-motion handling
