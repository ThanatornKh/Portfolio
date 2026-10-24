---
name: motion-site-patterns
description: Patterns extracted from AI motion-site tools (MotionSites prompt library, Emergent app builder) and the open-source component libraries they lean on (React Bits, Magic UI) — cinematic heroes, blur-in text, liquid-glass buttons, tech marquees, sticky stacking cards, lock-on target cursor, holographic cards, spotlight/border-glow cards, animated beams, decrypt text and shader backgrounds. Use when designing or building a premium animated landing page / portfolio in React, or when the user mentions MotionSites, Emergent, Lovable-style prompts, React Bits or Magic UI.
---

# Motion-site patterns (extracted)

The tools studied:

- **MotionSites** — a paid prompt library: hero and landing-page prompts plus looping video backgrounds, made to paste into Lovable or Cursor.
- **Emergent** — a multi-agent app builder: a manager agent splits the job, then front-end and back-end agents build in parallel and fix their own errors.
- **React Bits** — 110+ animated React components (license: MIT + Commons Clause).
- **Magic UI** — animated React components, MIT.

This file keeps what makes their output look premium and maps each pattern onto
this repo's stack: React + Vite, GSAP, Lenis, React Three Fiber.

## 1. Work like the tools do

1. **Spec first, per section.** MotionSites prompts are spec sheets, not vibes.
   - They name the stack, fonts and weights, exact sizes per breakpoint, colours, spacing, and every hover state.
   - Before coding a section, write the same kind of spec: layout, type scale, tokens, motion (property, duration, ease, stagger, trigger) and states.
2. **Plan → build → verify → refine** (Emergent's loop).
   - Build one section at a time.
   - Screenshot it at desktop and mobile widths before moving on.
   - Refine at section level, never page-wide rewrites.
3. **One cinematic hero.** Every MotionSites example spends its budget on the
   first screen: a full-bleed moving background, a two-line headline, a glass
   CTA and a marquee. The sections after it are calm and organised.

## 2. Pattern catalogue

### Cinematic hero

- **Background:** full-bleed motion — a looping video (`autoPlay muted loop playsInline`, `object-fit: cover`, with a fade in and out at the loop seam) or a WebGL shader or 3D scene.
- **Headline:** two lines, tight tracking (`-0.04em`). The second line overlaps the first by about 12px, or changes colour or weight.
- **Support:** a small uppercase label above (tracking `0.2em`) and a one-line subtitle, `max-width` around 40ch.
- **CTAs:** two, one solid and one glass.
- **Below the fold:** a logo or tech marquee.

### Blur-in text (the signature MotionSites entrance)

```js
gsap.from(split.words, { opacity: 0, filter: 'blur(12px)', y: 24, duration: 1.1, ease: 'expo.out', stagger: 0.06 });
```

- Split by words. Thai has no spaces, so split by lines or by `Intl.Segmenter` words.
- Total time ≤ 1.2 s.

### Liquid glass surface

```css
.glass {
  background: linear-gradient(180deg, rgb(255 255 255 / .10), rgb(255 255 255 / .03));
  backdrop-filter: blur(18px) saturate(1.6);
  border: 1px solid rgb(255 255 255 / .14);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .25), inset 0 -1px 0 rgb(255 255 255 / .05), 0 10px 30px -10px rgb(0 0 0 / .6);
}
```

Add a moving specular highlight with a `radial-gradient` at `--mx/--my`,
updated on pointer move.

### Tech / logo loop (marquee)

- Duplicate the track once and animate `translateX(-50%)` linearly.
- Fade the edges with `mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)`.
- Pause on hover and under reduced motion.
- Optionally scale speed by scroll velocity (`ScrollTrigger.getVelocity()`).

### Sticky stacking cards (React Bits ScrollStack / MotionSites "sticky project cards")

- Each card sits in a `position: sticky` slot with `top: calc(15% + i * 24px)`.
- For each card, `depth` is how many later cards have reached their sticky top. Then:
  - `scale = max(0.85, 1 - depth * 0.05)`;
  - dim the card with an overlay `opacity = depth * 0.15`;
  - optional `rotateX(-depth * 2deg)` with `transform-origin: 50% 0`.
- Compute it in one scroll callback and write the values with `gsap.quickSetter`.

### Lock-on target cursor (React Bits TargetCursor)

- **Shape:** four corner brackets spin slowly around the pointer.
- **Lock-on:** over a `[data-cursor]` element, the brackets spring to its bounding box plus padding and show a label from `data-cursor-label`.
- **Physics:** critically damped springs, `v += (k * (goal - x) - c * v) * dt`, two sub-steps per frame. The rAF loop **sleeps** when nothing moves.
- **Scope:**
  - fine pointers only;
  - keep the native cursor for text inputs;
  - re-target on scroll (`elementFromPoint`), so the lock follows content that scrolls under a still mouse.

### Holographic card (React Bits ProfileCard / HoloCard)

- Pointer drives CSS variables `--px --py` (0–100%) plus tilt `--rx --ry`.
- Layers over the photo:
  - **Sheen:** a `radial-gradient` at the pointer.
  - **Holo:** a `repeating-linear-gradient` spectrum plus diagonal bars, with `background-blend-mode: color, hard-light`, `mix-blend-mode: color-dodge`, and the position driven by `--py`.
  - **Glare:** a radial gradient with `mix-blend-mode: overlay`.
- At rest, holo opacity ≈ 0.15; on hover, ≈ 0.6.

### Spotlight and border glow cards (Magic UI MagicCard / React Bits BorderGlow)

```css
.card { background: radial-gradient(400px circle at var(--mx) var(--my), rgb(77 225 255 / .10), transparent 40%), var(--panel); }
.card::before { /* border light */
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
  background: radial-gradient(300px circle at var(--mx) var(--my), var(--cyan), transparent 40%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
}
```

Set `--mx/--my` on the **grid container** from one pointer listener, so
neighbouring cards light up too (bento effect).

### Animated beams (Magic UI AnimatedBeam)

- Draw an SVG quadratic path between two DOM nodes, measured relative to the container and recomputed by a ResizeObserver.
- Use two strokes: a faint base path, and a short gradient that travels along the path.
- The gradient travels by animating `x1/x2` from `10%→110%` and `0%→100%`.
- Good for "data → pipeline → model → product" diagrams.

### Decrypt / scramble text

- GSAP `ScrambleTextPlugin` with `chars: '01<>/{}[]#'`, revealing left to right.
- Mono labels only. Keep the real text in `aria-label`.

### Count-up stats

- Tween a number from 0 when the element enters the viewport (`ScrollTrigger once: true`), with `snap: { value: 1 }`.
- Use `font-variant-numeric: tabular-nums`.

### Shader backgrounds (React Bits GridScan / FaultyTerminal / LightRays)

- A full-screen triangle with a fragment shader and a handful of uniforms: time, resolution, pointer, colours.
- The loop sleeps when the element is off-screen or the tab is hidden. Cap DPR at 1.5.
- Under reduced motion, render one frame.
- Ideas for a dev theme:
  - a perspective grid with a scan band;
  - a CRT glyph field (terminal);
  - god-rays from the top.

## 3. Rules the good outputs share

- **Colour:** one accent colour plus one highlight colour. Everything else is neutrals at 3–4 opacities.
- **Type:**
  - one display face (tight tracking at large sizes) and one mono face for labels;
  - body text 16–18px at a 1.6 line height.
- **Motion:**
  - entrances last 0.6–1.2 s with `expo.out` or `power3.out`;
  - hovers last 0.2–0.4 s;
  - nothing loops faster than 8 s, except cursors and marquees.
- **Respect the user:**
  - under `prefers-reduced-motion`, show final states with no loops;
  - every effect has a static fallback;
  - touch devices get no cursor or hover-only content.
- **Organised:** the same section header everywhere (index, label, rule, title), one grid, and one spacing scale.

## Sources

- MotionSites prompts, as shared publicly by Viktor Oddy on X (cinematic hero, sticky project cards, liquid-glass CTA).
- Emergent product page and tutorials (manager / front-end / back-end agents, section-level refinement).
- React Bits source (`DavidHDev/react-bits`): TargetCursor, ProfileCard, HoloCard, ScrollStack, MagicBento, BorderGlow, GridScan, FaultyTerminal, LightRays.
- Magic UI source (`magicuidesign/magicui`): animated-beam, border-beam, magic-card, marquee, number-ticker, terminal.
