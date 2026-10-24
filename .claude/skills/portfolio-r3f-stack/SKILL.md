---
name: portfolio-r3f-stack
description: How this portfolio is built and how to extend it — React + Vite + TypeScript, React Three Fiber scenes (stack-core chip with exploded view and hologram projections, particle morph, tech constellation), GSAP ScrollTrigger + Lenis on one ticker, sharp black/white theme, AI-scan HUD, 360° drag-rotate, preloader, testing with Playwright/SwiftShader and GitHub Pages deploy. Use when changing any section, adding a project, adding a 3D scene or effect, or verifying the site.
---

# Portfolio stack (React · R3F · GSAP · Lenis)

## Map

| Path | Role |
|---|---|
| `src/data/content.ts` | All content. Projects have `images`, `links`, `role`, `note`, `status`, `metrics`. |
| `src/data/derived.ts` | `WORKS` (codes like `FS-01`), `TECHS`, `FEATURED`, `STATS` |
| `src/lib/motion.ts` | Registers GSAP plugins once and drives Lenis from `gsap.ticker`. Exports `damp`, `span`, `reduceMotion`. |
| `src/lib/store.ts` | zustand UI state, plus `sceneProgress` and `spins` (plain objects read in `useFrame`) |
| `src/lib/useDragRotate.ts` | 360° drag with inertia; touch: horizontal swipe only (`touch-action: pan-y`) |
| `src/gl/*Scene.tsx` | Lazy-loaded R3F canvases. Each takes `active` and switches `frameloop` between `always` and `never`. |
| `src/gl/Projections.tsx` | Hologram shader over real screenshots; beams from the chip's interface layer |
| `src/components/UnderTheHood.tsx` | Annotated plate (B&P dashboard) and the Quality Report on paper |
| `src/components/*` | One file per chapter, plus a CSS file next to it |

## Rules that keep it smooth

- **One clock.** Lenis runs from `gsap.ticker`, and `lenis.on('scroll', ScrollTrigger.update)` keeps ScrollTrigger in step.
- **Scroll → 3D.** A ScrollTrigger `onUpdate` writes `sceneProgress.x`, and `useFrame` reads it. Never call `setState` per frame.
- **Section progress.** `span(p, a, b)` maps a range of the section's progress onto 0..1. Then:
  - smooth it with `t * t * (3 - 2t)`;
  - move the camera with `lerp` and a framerate-independent `1 - exp(-dt * k)`.
- **SplitText with `autoSplit`.** Return the tween from `onSplit` and give it its own ScrollTrigger. Adding it to a shared timeline that has already played leaves the re-split lines stuck under their mask (a bug we hit).
- **Canvases.**
  - Run `frameloop="never"` when off-screen or when the tab is hidden.
  - Use `dpr={[1, 1.75]}`, `antialias: false` when bloom runs anyway, and `EffectComposer multisampling={0}`.
- **Lighting.** Use `Environment` with `Lightformer`s and `frames={1}`: reflections with no HDR download.
- **Procedural textures.** `src/gl/textures.ts` draws on canvas and uses the result as an `emissiveMap`: black = off, white = glow.
- **Images used as textures** must be same-origin (`public/projects`). Remote images (i.ibb.co) are DOM `<img>` only.

## Rules adopted from `scroll-film-site` (owner-provided skill)

- **One lerp only.** Lenis already smooths scroll, so the camera position, the chip explode and the particle morph map scroll progress **directly**. Only pointer parallax and spin inertia are damped. Two smoothing layers in series feel laggy.
- **The hero headline stays still.** It only fades as the next scene starts. Captions that replace it sit in the same left column, opposite the object.
- **Active chapter = the one entering.** Use a "decision band" at the top third: ScrollTrigger `start: 'top 33%'`, `end: 'bottom 33%'`. Set `aria-current` on nav and rail links.
- **The menu closes three ways:** Esc, a click on empty space, and choosing a link.
- **Canvas layers** use `height: 100lvh` (no gap when the iOS URL bar collapses). Each has `role="img"` and an `sr-only` description.
- **Annotated plate** (`UnderTheHood.tsx`): markers are positioned in % of the screenshot. SVG leads run from the note's edge, elbow at 1/3, and end at the marker's rim. `pathLength=1` makes the dash reveal easy. Redraw with a ResizeObserver. Hide the leads when stacked on mobile.
- **Paper certificate:** scoped tokens (`.paper { --bg; --ink; --line }`). Bars draw from zero **once** (IntersectionObserver adds `.in`, then `transform: scaleX(var(--v))`). That is the only motion in the section.
- **JSON-LD `Person`** in `index.html`.

## Theme (sharp, "serious")

- **Colours:** black `#050505`, ink `#f2f2ef`, greys. Ice `#a9d6e8` appears only on tiny details (status dots, hologram tint).
- **Type:**
  - display: Archivo Variable at `font-stretch: 125%`, uppercase;
  - body: IBM Plex Sans Thai;
  - labels: JetBrains Mono, uppercase, letter-spacing 0.14em.
- **Shapes:** square corners, 1px lines. Buttons are rectangles whose fill wipes up from the bottom on hover.
- **Emphasis** is a grey second line (`.grad`), never a gradient or glow.
- **Ampersand:** Archivo's `&` reads like "ε", so a `FontFace('Amp', …, { unicodeRange: 'U+0026' })` from IBM Plex is first in `--display`.

## Signature effects

1. **Stack-core chip** (`HeroScene.tsx`).
   - Four layers, each assembling with GSAP `intro` values and an emissive flash when it locks.
   - Exploded view between hero progress 0.08 and 0.48, with drei `Html` labels per layer.
2. **Hologram projections** (0.5 → 0.8).
   - Planes face the camera (`lookAt`).
   - The shader does an RGB split, scanlines, a sweeping band, glitch bands and a top-down reveal with a bright leading edge.
   - The planes sit along the camera's right axis so they never overlap.
3. **AI scan** on flagship cards.
   - `clip-path` reveal synced with a scan line, plus corner brackets and a status tag.
   - `metrics` decode with ScrambleText.
4. **Hologram hover** (`.hol`): scanlines, a light sweep and a 1.5px RGB split via `drop-shadow`.
5. **Sticky stacking cards**: the previous card scales to about 0.9 and dims, desktop only (`gsap.matchMedia`).

## Verify (sandbox)

- `npm run build`, then `npx vite preview --port 4173`.
- Playwright with Chromium flags `--use-angle=swiftshader --enable-unsafe-swiftshader`.
- Route `https://i.ibb.co/**` to placeholders.
- Check on desktop (1440×900), mobile (390×844, `isMobile`) and `reducedMotion: 'reduce'`:
  - no page errors;
  - `document.documentElement.scrollWidth === innerWidth`. The marquee once stretched the mobile layout viewport to 24,000px; the fix is `overflow-x: clip` on `html` and sections.
  - the boot overlay disappears;
  - screenshots taken at section progress points.
- SwiftShader is slow: boot takes about 5–6 s there and about 1–2 s on real GPUs.
- `THREE.Clock` deprecation warnings come from the libraries and are harmless.

## Deploy

`.github/workflows/deploy.yml` builds on pull requests and deploys `dist/` to Pages on `main`. Set Settings → Pages → Source to **GitHub Actions** once.
