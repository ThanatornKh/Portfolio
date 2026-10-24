# Thanatorn Khwanmankong — Portfolio (vol.02)

Scroll-story portfolio with real-time 3D. Built with **React + Vite + TypeScript**, **React Three Fiber / drei / postprocessing** (Three.js), **GSAP** (ScrollTrigger, SplitText, ScrambleText, Flip) and **Lenis** smooth scroll.

## Chapters

| # | Section | What happens |
|---|---|---|
| 00 | Hero — *From pixels to production* | A 4-layer "stack core" chip assembles after the preloader, explodes on scroll (Infra · Data · Logic · Interface), then projects holograms of real project screens. Drag to rotate 360°. |
| 01 | About | Holographic profile card, word-by-word reveal, `profile.json` |
| 02 | Data → Deploy | 6,000 particles morph cloud → helix → neural net → globe (vertex shader). Drag to rotate. |
| 03 | Flagship works | Sticky stacking cards with an "AI scan" over each screenshot and real metrics |
| 04 | All projects | Category filters with GSAP Flip |
| 05 | Tech stack | 3D constellation of every technology used, linked to projects. Click a star (or a group in the list) to lock focus on it: the camera flies to the clearest angle and orbits it. Esc or a click on empty space releases. |
| 06 | Journey | `git log --graph` timeline |
| 07 | Q&A | Accordion with links into projects |
| 08 | Contact | Interactive terminal (`help`, `ls`, `open <project>`, `stack` …) |

Project pages open as an overlay at `#/work/<id>` (shareable links, works on static hosting).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run preview    # serve dist/
```

## Edit content

Everything lives in `src/data/content.ts` — profile, categories, projects (with `images`, `links`, `role`, `note`, `status`, `metrics`), process, FAQ, skills, education.
Put screenshots in `public/projects/` and reference them with `asset('projects/<file>')`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The build uses relative paths (`base: './'`), so it also works from any sub-folder or static host.

## Accessibility & performance

- `prefers-reduced-motion`: no smooth scroll, no pinning, scenes render a single still frame.
- 3D canvases pause when off-screen or when the tab is hidden; three.js scenes are lazy-loaded chunks.
- Without WebGL the page still works (static fallbacks).

## Skills used to build this

`.claude/skills/` contains the official GSAP skills (MIT, GreenSock), `motion-site-patterns` (patterns extracted from MotionSites / Emergent / React Bits / Magic UI), `scroll-film-site` (analysis of the ascentatrack.com engine, provided by the owner) and `portfolio-r3f-stack` (how this site is put together).
