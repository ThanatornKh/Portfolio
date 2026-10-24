---
name: scroll-film-site
description: Build cinematic brand / product / local-business websites where a pre-rendered video is scrubbed by scroll on a <canvas> ("scroll film") — frame pipeline, tiered loading engine, Lenis, multi-brand theming, section pattern library (variant catalog, annotated plate, process docket, certificate, reserve form, local-business contact), plus a portfolio page with hover video previews. Use for perfume, skincare, watch, leather, tech, gadget or shop websites that need Apple-style scroll animation.
---

# Scroll Film Site

เทคนิค: นำวิดีโอสินค้ามาแตกเป็นภาพทีละเฟรม แล้วใช้ตำแหน่ง scroll กำหนดว่าจะวาดเฟรมไหนลง `<canvas>` ผู้ใช้จะรู้สึกเหมือนกำลัง "เลื่อนหนัง" ด้วยตัวเอง (แนวเดียวกับหน้าสินค้าของ Apple)

ใช้เมื่อ: ทำเว็บแบรนด์ สินค้า หรือธุรกิจท้องถิ่น ที่มีวิดีโอหรือ 3D render และต้องการ animation ผูกกับ scroll โดยไม่ใช้ WebGL หรือ framework

ไม่เหมาะเมื่อ: ไม่มีวิดีโอต้นฉบับ, เนื้อหาเยอะจนภาพไม่ใช่จุดเด่น, หรือต้องการให้วัตถุโต้ตอบได้จริง (กรณีนั้นใช้ three.js)

---

## 0. ที่มา: วิเคราะห์จาก ascentatrack.com (7 หน้า, engine เดียวกัน)

| เว็บ | ประเภท | ธีม / พื้นหลัง | ฟอนต์ | scenes | จุดเด่นที่ควรเรียนรู้ |
|---|---|---|---|---|---|
| **/** (หน้า portfolio) | Agency | มืด | – | hero → work → included → how → note | การ์ดงานแต่ละชิ้นเป็น poster + วิดีโอ preview ที่เล่นตอน hover หรือตอนเลื่อนมาเห็น |
| **parfum** | น้ำหอม | มืด, ทอง | serif italic + sans | hero → accord → notes → collection → maison → acquire | grid 6 กลิ่น, checkout 3 ขั้น (demo), มี 4 ชุดเฟรม (portrait/desktop/ultra/32:9) |
| **pivoine** | สกินแคร์ | สว่าง blush `#f4e8ee`, plum | Playfair Display + Manrope | hero → bloom → cream → texture → line → collection | ใช้ engine เดิมแต่สลับธีมเป็นสว่างได้ด้วย tokens อย่างเดียว |
| **meridian** | นาฬิกา | ดำ `#020203`, น้ำเงิน + ทอง | Instrument | hero → 6 executions → anatomy → frontal quote → certificate → reserve | catalog แบบ "plate", ภาพมีจุดอธิบายพร้อมเส้นชี้ SVG, section เอกสารบนพื้นกระดาษ, ฟอร์มนัดหมาย |
| **maisonroux** | กระเป๋าหนัง | เขียวดำ `#0b0f0c` | Public Sans + Instrument Serif | hero → atelier docket → cuir → 10 leathers → registre | ขั้นตอนการผลิตที่มีเวลากำกับ, ตัวเลือกหนัง, วางหัวข้อ hero ตามตำแหน่งที่วัดจากภาพ |
| **noema** | Headset (tech) | สว่างฟ้า `#c3d2f0` | Instrument + Archivo | hero → system → optics → numbers → manifesto → uses → specs → reserve | engine เวอร์ชันล่าสุดที่จูนเรื่อง memory หนักที่สุด, ข้อความวางบนหรือล่างแยกตาม scene |
| **taller** | อู่ซ่อมรถ (local) | มืดอุ่น `#080706` | Archivo | hero → work → process → services → FAQ → call → where | JSON-LD `AutoRepair`, ลิงก์ `tel:` และ Maps, skip link ไปที่เบอร์โทร, คำบรรยายหนังสำหรับ screen reader |

สิ่งที่สรุปได้: **engine (film + Lenis + checkout + form) ตัวเดียวใช้กับทุกแบรนด์** ส่วนที่เปลี่ยนมีแค่ CSS tokens, ข้อความ, ชุดเฟรม, รูปสินค้า และการเลือก section จาก pattern library

---

## 1. สถาปัตยกรรม

```
film.mp4 ──ffmpeg──► frames/landscape/f_0001.webp …     hi-res 16:9
          │      └──► frames/portrait/f_0001.webp  …     hi-res 9:16 (art-directed crop)
          └──ffmpeg──► frames/landscape-lo/ , portrait-lo/   lo-res ทุก 3 เฟรม (โหลดก่อน)
                         ▼
               build_motion.py ──► motion.js   (window.__FILM_MOTION)

engine/                       ← ใช้ซ้ำทุกแบรนด์ ห้ามใส่สีหรือข้อความของแบรนด์
  scroll-film.js  site.js (nav, menu, plate, form)  base.css  checkout.js  checkout.css
brands/<brand>/
  index.html  brand.css  frames/  motion.js  catalog/*.webp  logo.png
```

โครงหน้า
```
<canvas data-film-canvas>        position:fixed, z-index 0, อยู่หลังทุก section
<main>                            z-index 1
  .scene[data-film="0-0.2"]       scene ที่ภาพเคลื่อน (ช่วง = สัดส่วนของหนัง 0–1)
  .scene[data-film="0.2-0.55"]
  .content                        section ทึบ (catalog, ฟอร์ม) ปิดทับ canvas และค้างเฟรมไว้
```

หลักสำคัญ
1. ช่วงเฟรมใน `data-film` เป็น**สัดส่วน 0–1 ของหนัง** ไม่ใช่เลขเฟรม ทำให้แต่ละชุดเฟรมมีจำนวนเฟรมต่างกันได้
2. ช่วงเฟรมผูกกับ **scene ใน DOM** ไม่ใช่เปอร์เซ็นต์ของทั้งหน้า จึงยังถูกต้องเมื่อ layout มือถือสูงไม่เท่ากับ desktop ถ้าไม่ได้ใส่ `data-film` เลย ระบบจะกระจายหนังทั้งเรื่องไปตามความสูงของทุก `.scene`
3. เลือกชุดเฟรมตาม `orientation` **ครั้งเดียวตอนโหลดหน้า** (ถ้าเปลี่ยนชุดกลางทาง ต้องทิ้งภาพที่ decode แล้วทั้งหมด จึงควร reload แทน)
4. canvas ต้องไม่มีวันว่าง: โหลดชุด lo-res ให้ครบก่อน แล้วค่อยแทนด้วย hi-res
5. ความสูงของ scene คือระยะ scroll ของช่วงเฟรมนั้น ถ้า scene สูงขึ้น ภาพจะเคลื่อนช้าลง
6. **มี lerp ได้แค่ตัวเดียว** ถ้า Lenis ทำ smooth ให้ scroll แล้ว film ต้องวาดเฟรมที่ตรงกับ scroll ทันที ห้ามมี easing ซ้อนอีกชั้น (smoothing 2 ชั้นต่อกันคือสาเหตุอันดับ 1 ของความหน่วง)

---

## 2. ขั้นตอนทำงาน (สำหรับ Claude)

1. เลือกประเภทเว็บ (สินค้า luxury, สกินแคร์, tech หรือ local business) แล้วเลือก scenes จาก pattern library (หัวข้อ 8)
2. ตรวจสอบวิดีโอ: ความยาว 4–10 วินาที, กล้องเคลื่อนต่อเนื่องไม่มี hard cut, พื้นหลังเป็นสีเดียวกับ `--bg` ถ้าต้องต่อ 2 คลิป ให้ต่อเป็น reel เดียวที่ใช้ตัวนับเฟรมชุดเดียวกัน ถ้ายังไม่มีวิดีโอ ให้ใช้ placeholder frames
3. แตกเฟรม hi และ lo ทั้ง 2 ทิศ (หัวข้อ 3) แล้วรัน `build_motion.py`
4. คัดลอก `engine/` แล้วสร้าง `brand.css` ที่มีเฉพาะ tokens (หัวข้อ 6)
5. เขียน scenes ใส่ `data-film` วางข้อความไม่ให้ทับตัวสินค้า แล้วปรับความสูงของ scene จนจังหวะดูดี
6. ใส่ส่วนประกอบเสริมจาก `site.js` ตามที่ต้องใช้ (nav, plate, form) และสำหรับ local business ใส่ JSON-LD
7. เปิด `__film.stats` ดูคุณภาพการวาดเฟรม แล้วทดสอบตาม checklist (หัวข้อ 11)

---

## 3. เตรียมเฟรม

```bash
B=brands/x/frames; mkdir -p $B/{landscape,portrait,landscape-lo,portrait-lo}
VF_L="fps=30,scale=1920:-2:flags=lanczos"
VF_P="fps=30,crop=ih*9/16:ih:(iw-ih*9/16)*0.5:0,scale=720:-2:flags=lanczos"   # ปรับ 0.5 ให้ตรงตำแหน่งวัตถุ

# hi-res
ffmpeg -i film.mp4 -an -vf "$VF_L" -c:v libwebp -quality 78 -compression_level 6 $B/landscape/f_%04d.webp
ffmpeg -i film.mp4 -an -vf "$VF_P" -c:v libwebp -quality 75 -compression_level 6 $B/portrait/f_%04d.webp

# lo-res: เอาทุก 3 เฟรม (0,3,6,…)
SEL="select='not(mod(n\,3))'"
ffmpeg -i film.mp4 -an -vf "fps=30,$SEL,scale=480:-2" -fps_mode vfr -c:v libwebp -quality 45 $B/landscape-lo/f_%04d.webp
ffmpeg -i film.mp4 -an -vf "fps=30,crop=ih*9/16:ih:(iw-ih*9/16)*0.5:0,$SEL,scale=320:-2" -fps_mode vfr -c:v libwebp -quality 45 $B/portrait-lo/f_%04d.webp
# ffmpeg รุ่นเก่าใช้ -vsync vfr แทน -fps_mode vfr

for d in $B/*; do echo "$d $(ls $d | wc -l)"; done   # lo ต้องได้ ceil(hi/3) พอดี
```

กฎของ pipeline (ได้มาจากเว็บต้นแบบ)
- **Art-direct แยกตามอุปกรณ์**: crop แนวตั้งให้ "bake" ไว้ในไฟล์ โดยวัดว่าวัตถุอยู่ช่วงไหนของเฟรม (ตัวอย่าง: วัตถุอยู่ในช่วง 56% ตรงกลาง) อย่า crop ตอน runtime ถ้ามีงบ ให้ render วิดีโอแนวตั้งแยกไปเลย ถ้ามีจอ ultrawide ให้เพิ่มชุด 21:9 หรือ 32:9
- **ห้ามขยายไฟล์ master** ความละเอียดของต้นฉบับคือเพดาน ถ้าภาพแตกให้กลับไป render ใหม่ อย่าใช้วิธี upscale
- **RIFE** (`rife-ncnn-vulkan`) แทรกเฟรมเมื่อเฟรมน้อยจนกระตุก หลังแทรกเฟรมแล้วให้ sharpen อีกรอบ (ภาพจาก RIFE จะนุ่ม) และ**คำนวณ motion curve หลังแทรกเฟรม** ไม่ใช่ก่อน
- **ต่อหลายคลิปเป็น reel เดียว**: เลขเฟรมต่อเนื่อง engine ไม่ต้องรู้ว่ามีรอยต่อ
- **จำนวนเฟรมขึ้นกับ memory** ไม่ใช่ความชอบ (คำนวณได้ในหัวข้อ 5) บนจอสัมผัสให้ใช้ทุก 2 เฟรมได้

งบประมาณ
| ชุด | จำนวนเฟรม | ขนาดต่อเฟรม | รวม |
|---|---|---|---|
| landscape hi | 150–240 | 40–120 KB | ≤ ~15 MB |
| portrait hi | 120–240 | 20–60 KB | ≤ ~8 MB |
| lo (ต่อชุด) | hi ÷ 3 | 3–8 KB | ≤ ~500 KB |

---

## 4. build_motion.py

วิดีโอมักมีช่วงที่ภาพเคลื่อนเร็วและช่วงที่ภาพเคลื่อนช้า สคริปต์นี้วัดความต่างระหว่างเฟรม แล้วสร้าง curve สะสม เพื่อให้การ scroll ระยะเท่ากันได้การเคลื่อนไหวเท่ากัน ให้รันกับโฟลเดอร์ hi-res เท่านั้น (ชื่อโฟลเดอร์จะเป็น key)

```python
#!/usr/bin/env python3
"""usage: python build_motion.py frames/landscape frames/portrait > motion.js
requires: pip install opencv-python numpy"""
import sys, json
from pathlib import Path
import numpy as np
import cv2

def curve(folder):
    paths = sorted(Path(folder).glob("*.webp")) or sorted(Path(folder).glob("*.png"))
    c, prev = [0.0], None
    for p in paths:
        img = cv2.imread(str(p), cv2.IMREAD_GRAYSCALE)
        img = cv2.resize(img, (160, 90), interpolation=cv2.INTER_AREA)
        if prev is not None:
            # +0.05 กันไม่ให้ curve แบนสนิทในช่วงที่ภาพนิ่ง
            c.append(c[-1] + float(cv2.absdiff(img, prev).mean()) + 0.05)
        prev = img
    c = np.array(c)
    return (c / c[-1]).round(5).tolist() if c[-1] > 0 else c.tolist()

sets = {Path(f).name: curve(f) for f in sys.argv[1:]}
print("window.__FILM_MOTION=" + json.dumps(sets, separators=(",", ":")) + ";")
```

---

## 5. Engine

### 5.1 scroll-film.js (เวอร์ชันพื้นฐาน: Image + lo/hi + prefetch ตามทิศ)

เหมาะกับ 100–240 เฟรม/ชุด ซึ่งครอบคลุมงานส่วนใหญ่ ถ้าเกินกว่านั้นหรือต้องการภาพคมระดับ 4K ให้ดู 5.2

```js
/* scroll-scrubbed image sequence on <canvas>, two-tier (lo → hi) loading
   reads: canvas[data-landscape|data-portrait|data-lo-step|data-root], .scene[data-film="p0-p1"]
   optional: window.Lenis, window.__FILM_MOTION */
(() => {
  const canvas = document.querySelector('[data-film-canvas]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const SET = matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
  const N = Number(canvas.dataset[SET]) || 1;
  const STEP = Number(canvas.dataset.loStep) || 3;
  const ROOT = canvas.dataset.root || 'frames';
  const pad = i => String(i + 1).padStart(4, '0');
  const MOTION = window.__FILM_MOTION?.[SET] ?? null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- image sequence ---------- */
  function sequence(count, src) {
    const imgs = new Array(count), ready = new Uint8Array(count), pending = new Array(count);
    function load(i) {
      if (i < 0 || i >= count) return Promise.resolve();
      if (pending[i]) return pending[i];
      const img = new Image();
      img.decoding = 'async';
      img.src = src(i);
      imgs[i] = img;
      pending[i] = img.decode().then(() => { ready[i] = 1; }, () => {});
      return pending[i];
    }
    function nearest(i) {
      for (let d = 0; d < count; d++) {
        if (i - d >= 0 && ready[i - d]) return i - d;
        if (i + d < count && ready[i + d]) return i + d;
      }
      return -1;
    }
    return { count, imgs, ready, load, nearest };
  }

  const hi = sequence(N, i => `${ROOT}/${SET}/f_${pad(i)}.webp`);
  const lo = sequence(Math.ceil(N / STEP), j => `${ROOT}/${SET}-lo/f_${pad(j)}.webp`);

  // หยาบไปละเอียด: 0, ทุก 32, 16, 8, 4, 2, 1
  function coarseToFine(n) {
    const order = [0], seen = new Set([0]);
    for (let step = 32; step >= 1; step >>= 1)
      for (let i = 0; i < n; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    if (!seen.has(n - 1)) order.push(n - 1);
    return order;
  }
  async function preload(seq, order, concurrency = 6) {
    let k = 0;
    const worker = async () => { while (k < order.length) await seq.load(order[k++]); };
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  /* ---------- scroll → frame ---------- */
  let scenes = [];
  function measure() {
    const top = el => el.getBoundingClientRect().top + window.scrollY;
    const tagged = [...document.querySelectorAll('[data-film]')];
    if (tagged.length) {
      scenes = tagged.map(el => {
        const [p0, p1] = el.dataset.film.split('-').map(Number);
        const start = top(el);
        return { f0: p0 * (N - 1), f1: p1 * (N - 1), start, end: start + el.offsetHeight };
      }).sort((a, b) => a.start - b.start);
    } else {                                   // ไม่ได้ tag: กระจายหนังตลอดทุก .scene
      const all = [...document.querySelectorAll('.scene')];
      const start = all.length ? top(all[0]) : 0;
      const last = all[all.length - 1];
      const end = last ? top(last) + last.offsetHeight : document.documentElement.scrollHeight;
      scenes = [{ f0: 0, f1: N - 1, start, end }];
    }
  }

  // motion curve: ระยะ scroll เท่ากัน = การเคลื่อนไหวเท่ากัน (f0, f1 เป็นทศนิยมได้)
  function equalize(f0, f1, t) {
    const c = MOTION;
    if (!c || c.length !== N) return f0 + (f1 - f0) * t;
    const at = f => { const i = Math.floor(f), j = Math.min(N - 1, i + 1); return c[i] + (c[j] - c[i]) * (f - i); };
    const target = at(f0) + (at(f1) - at(f0)) * t;
    let a = Math.floor(f0), b = Math.ceil(f1);
    while (b - a > 1) {
      const mid = (a + b) >> 1;
      c[mid] <= target ? (a = mid) : (b = mid);
    }
    const span = c[b] - c[a] || 1;
    return a + (target - c[a]) / span;
  }

  function frameAt(y) {
    if (!scenes.length) return 0;
    let f = scenes[0].f0;
    for (const s of scenes) {
      if (y >= s.end) { f = s.f1; continue; }
      if (y >= s.start) f = equalize(s.f0, s.f1, (y - s.start) / (s.end - s.start || 1));
      break;
    }
    return Math.min(N - 1, Math.max(0, Math.round(f)));
  }

  /* ---------- drawing ---------- */
  const stats = { exact: 0, near: 0, lo: 0, none: 0 };   // ดูใน console: __film.stats
  let shown = '';

  function drawCover(img) {
    const cw = canvas.width, ch = canvas.height;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // "เฟรมคมที่อยู่ใกล้ๆ ดีกว่าเฟรมที่ตรงแต่เบลอ" — ตอน scroll เร็ว เฟรม i กับ i±2 แทบแยกไม่ออก
  function pick(want) {
    if (hi.ready[want]) return { img: hi.imgs[want], key: 'h' + want, kind: 'exact' };
    const h = hi.nearest(want);
    if (h >= 0 && Math.abs(h - want) < STEP) return { img: hi.imgs[h], key: 'h' + h, kind: 'near' };
    const j = Math.min(lo.count - 1, Math.round(want / STEP));
    if (lo.ready[j]) return { img: lo.imgs[j], key: 'l' + j, kind: 'lo' };
    const l = lo.nearest(j);
    if (l >= 0) return { img: lo.imgs[l], key: 'l' + l, kind: 'lo' };
    if (h >= 0) return { img: hi.imgs[h], key: 'h' + h, kind: 'near' };
    return null;
  }

  let lastWant = 0, vel = 0;
  function tick() {
    const want = frameAt(window.scrollY + innerHeight * 0.5);   // เส้นกลางจอเป็นตัวอ้างอิง
    vel = vel * 0.8 + (want - lastWant) * 0.2;                    // หน่วย: เฟรมต่อ animation frame
    lastWant = want;

    // prefetch ไปตามทิศที่กำลังเลื่อน ระยะมองล่วงหน้าวัดเป็น "เวลา" (~10 animation frames)
    hi.load(want);
    const dir = vel >= 0 ? 1 : -1;
    const lead = Math.min(24, Math.ceil(Math.abs(vel) * 10));
    for (let k = 1; k <= lead; k++) hi.load(want + dir * k);

    const p = pick(want);
    if (!p) { stats.none++; return; }
    if (p.key === shown) return;
    drawCover(p.img);
    stats[p.kind]++;
    shown = p.key;
  }

  // ขนาด canvas ต้องวัดจากกล่อง CSS ของตัวเอง ไม่ใช่ innerWidth (scrollbar กินพื้นที่ไป ~15px ทำให้ภาพถูก resample ทุกครั้งที่วาด)
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    shown = '';
    measure();
  }
  new ResizeObserver(resize).observe(canvas);
  new ResizeObserver(measure).observe(document.body);    // ฟอนต์หรือรูปโหลดเสร็จแล้วความสูงเปลี่ยน
  canvas.addEventListener('contextrestored', () => { shown = ''; });   // GPU reset → วาดใหม่ ไม่ปล่อยให้จอดำค้าง

  /* ---------- smooth scroll + loop (lerp ตัวเดียว คือของ Lenis) ---------- */
  const lenis = !reduce && window.Lenis ? new Lenis({ lerp: 0.1 }) : null;   // touch ใช้แรงเหวี่ยงของ OS เอง
  function loop(t) { lenis?.raf(t); tick(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);

  (async () => {
    await Promise.all([lo.load(0), hi.load(0)]);
    await preload(lo, coarseToFine(lo.count), 8);      // lo ไฟล์เล็ก โหลดครบเร็ว
    await preload(hi, coarseToFine(N), 6);
  })();

  matchMedia('(orientation: portrait)').addEventListener('change', () => location.reload());

  // anchor link ให้เลื่อนผ่าน Lenis
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    const id = a?.getAttribute('href');
    if (!lenis || !id || id.length < 2) return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el);
  });

  window.__film = { stats, lenis, frameAt, set: SET, frames: N };
})();
```

อ่านค่า `__film.stats`
- `exact` สูง = ดี / `lo` สูงตอนเปิดหน้า = ปกติ / `lo` ยังสูงหลังผ่านไป 10 วินาที = hi-res ใหญ่เกินไป ให้ลด quality หรือจำนวนเฟรม / `none` > 0 = lo ยังโหลดไม่ทัน ให้ลดขนาด lo หรือ preload เฟรมแรกให้ดีขึ้น

### 5.2 Engine ขั้นสูง (เมื่อเฟรมเยอะหรือภาพละเอียดสูงมาก)

ใช้เมื่อหนังยาว 400–800 เฟรม หรือต้องการภาพที่คมเป็น native บนจอ 4K/5K ซึ่งเว็บต้นแบบเวอร์ชันหลัง (Meridian, Maison Roux, Noema) ใช้แนวนี้

**โครง tier**
| tier | อะไร | อยู่ที่ไหน | ใช้ตอนไหน |
|---|---|---|---|
| boot | ความละเอียดต่ำ, strided หยาบไปละเอียด | ImageBitmap | ทันทีที่เปิดหน้า (canvas ไม่ว่าง) |
| resident (scrub) | ความละเอียดใกล้เคียงกับจอ, strided (ทุก n เฟรม) | ImageBitmap | ตอน scroll |
| bytes | ไฟล์ hi-res ที่ยังบีบอัดอยู่ (blob) | JS memory (เล็ก) | วัตถุดิบสำหรับ native |
| native window | decode จาก bytes เฉพาะ ~6–30 เฟรมรอบตำแหน่งปัจจุบัน เอียงไปทางที่กำลังเลื่อน | ImageBitmap (LRU, `.close()` เมื่อหลุดออกจากช่วง) | ภาพคมทั้งตอนหยุดและตอนเลื่อนช้า |

**กฎที่ได้มาจากการวัดจริง**
1. ลำดับการโหลด: boot → **bytes** → resident ถ้าโหลด bytes ไว้ท้ายสุด native tier จะสร้างไม่ได้นานมาก
2. ความละเอียดของ scrub tier ต้องใกล้เคียงกับจอ ถ้า scrub เป็น 960 แต่ native เป็น 2560 ตอนหยุด scroll ภาพจะ "กระตุกเปลี่ยน" ให้เห็นชัด ถ้า scrub เป็น native อยู่แล้ว ไม่ต้องมี detail tier
3. ระยะ native window วัดเป็น**เวลา** (ใช้ความเร็วของหนังเป็นเฟรมต่อ animation frame) ไม่ใช่จำนวนพิกเซล และให้ decode เฟรมที่ใกล้ที่สุดก่อน
4. decode ใน **Worker หลายตัว** แล้ว transfer ImageBitmap กลับมา (worker ตัวเดียวทำได้แค่ ~20 เฟรม/วินาที ที่ 4K) ถ้า worker ตัวไหนพัง ให้ reject เฉพาะงานของ worker ตัวนั้น
5. Worker ที่สร้างจาก `blob:` URL จะ resolve relative URL ไม่ได้ (404 เงียบๆ) **ต้องส่ง absolute URL เท่านั้น**
6. decode **เฉพาะแถบที่จะแสดงจริง** (cover-fit ตัดขอบทิ้งไปอยู่แล้ว) ด้วย `createImageBitmap(blob, sx, sy, sw, sh, { resizeWidth })`
7. **Safari ไม่สนใจ `resizeWidth`** และคืนภาพเต็มขนาดกลับมาเงียบๆ (≈33 MB ต่อเฟรม) ต้องตรวจ `bmp.width` แล้วย่อเองด้วย OffscreenCanvas
8. ImageBitmap อยู่นอก JS heap (heap แสดงแค่ ~1 MB ทั้งที่จริงใช้ไป 2 GB) ต้องคำนวณงบเอง: iPhone ใช้ได้ประมาณ 250 MB, desktop ใช้ `navigator.deviceMemory` ไม่ควรเกิน ~25%
9. canvas ขนาด 4–5K มีโอกาสเจอ GPU context loss แน่นอน ต้องรองรับ `contextrestored` ไม่อย่างนั้นจอจะดำถาวร
10. progress bar ให้เขียน `el.style.transform` ตรงๆ ห้ามอัปเดต custom property บน `<html>` ทุกเฟรม เพราะจะทำให้ style ทั้งเอกสารถูกคำนวณใหม่ (มือถือรู้สึกได้ชัด)

```js
/* decoder pool — worker จาก blob, transfer ImageBitmap กลับ */
const WORKER_SRC = `
self.onmessage = async ({ data: { id, url, crop, width } }) => {
  try {
    const blob = await (await fetch(url)).blob();
    const opt = width ? { resizeWidth: width, resizeQuality: 'high' } : {};
    let bmp = crop ? await createImageBitmap(blob, crop.sx, crop.sy, crop.sw, crop.sh, opt)
                   : await createImageBitmap(blob, opt);
    if (width && bmp.width > width * 1.05) {             // Safari: resizeWidth ถูกเมิน
      const h = Math.round(bmp.height * width / bmp.width);
      const oc = new OffscreenCanvas(width, h);
      oc.getContext('2d').drawImage(bmp, 0, 0, width, h);
      bmp.close();
      bmp = oc.transferToImageBitmap();
    }
    self.postMessage({ id, bmp }, [bmp]);
  } catch (e) { self.postMessage({ id, error: String(e) }); }
};`;

function decoderPool(n = Math.min(4, navigator.hardwareConcurrency || 2)) {
  const src = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
  const jobs = new Map();
  let seq = 0, rr = 0;
  const workers = Array.from({ length: n }, (_, w) => {
    const wk = new Worker(src);
    wk.onmessage = ({ data }) => {
      const job = jobs.get(data.id);
      if (!job) return;
      jobs.delete(data.id);
      data.error ? job.reject(new Error(data.error)) : job.resolve(data.bmp);
    };
    wk.onerror = () => {                                  // reject เฉพาะงานของ worker ตัวนี้
      for (const [id, job] of jobs) if (job.w === w) { jobs.delete(id); job.reject(new Error('worker')); }
    };
    return wk;
  });
  return (url, opts = {}) => new Promise((resolve, reject) => {
    const id = ++seq, w = rr++ % n;
    jobs.set(id, { resolve, reject, w });
    workers[w].postMessage({ id, url: new URL(url, location.href).href, ...opts });   // absolute เท่านั้น
  });
}

/* งบ memory → จำนวนเฟรมที่เก็บเป็น bitmap ได้ */
function frameBudget(w, h) {
  const touch = matchMedia('(pointer: coarse)').matches;
  const mb = touch ? 250 : Math.min(4000, (navigator.deviceMemory || 4) * 1024 * 0.25);
  return Math.floor(mb * 1024 * 1024 / (w * h * 4));
}
```

### 5.3 โหมดอัดวิดีโอ (`?film=1`)

ใช้สำหรับอัดหน้าจอไปทำวิดีโอโปรโมทหรือ preview ในหน้า portfolio ไม่ได้มีไว้สำหรับผู้ใช้ทั่วไป
- ซ่อน scrollbar (`html{scrollbar-width:none}`) เพื่อให้ canvas กว้างเท่าจอพอดี ภาพวาดแบบ 1:1
- โหลดทุกเฟรมเก็บไว้ทั้งหมด ไม่ต้องคืน memory และเพิ่มจำนวน decode พร้อมกัน
- ลด lerp ของ Lenis ให้ภาพเคลื่อนต่อเนื่องเหมือนกล้อง
- ซ่อน UI ที่ลอยอยู่ (cookie, chat)

---

## 6. ธีมหลายแบรนด์

แบ่ง tokens เป็น 3 ชั้น เพื่อให้ engine ไม่ต้องรู้จักแบรนด์ใดเลย
1. **base.css** กำหนดค่า default
2. **checkout.css / form** ใช้ token ของตัวเอง (`--co-*`) ที่ fallback ไปหา base
3. **brand.css** override เฉพาะ token ห้ามมี selector ของ component

```css
/* engine/base.css */
:root {
  --bg: #0b0908; --ink: #f3ece2; --muted: #b4a891; --accent: #c9a35b;
  --line: color-mix(in srgb, var(--ink) 14%, transparent);
  --scrim: rgb(0 0 0 / .55);
  --serif: Georgia, serif; --sans: system-ui, sans-serif;
  --e-out: cubic-bezier(.16, 1, .3, 1); --e-io: cubic-bezier(.65, 0, .35, 1);
  --pad: clamp(16px, 3vw, 44px); --measure: 64ch;
  --scene-h: 160vh;
}
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--sans); }
h1, h2 { font-family: var(--serif); font-weight: 400; }

.film { position: fixed; inset: 0; z-index: 0; width: 100%; height: 100lvh; display: block; pointer-events: none; }
.page { position: relative; z-index: 1; }
.scene { position: relative; min-height: var(--scene-h); display: grid; padding: 0 var(--pad); }
.scene.top    { align-items: start; padding-top: 18vh; }     /* วางข้อความหลบวัตถุทีละ scene */
.scene.bottom { align-items: end;   padding-bottom: 14vh; }
.scene::before { content: ""; position: absolute; inset: 0; pointer-events: none;
                 background: linear-gradient(90deg, var(--scrim), transparent 60%); }
.content { position: relative; background: var(--bg); }

/* checkout / form */
:root {
  --co-accent: var(--accent); --co-ink: var(--ink); --co-muted: var(--muted); --co-line: var(--line);
  --co-glass: color-mix(in srgb, var(--bg) 70%, transparent);
  --co-serif: var(--serif); --co-sans: var(--sans); --co-ok: #2fbf84; --co-bad: #e0776a;
}
```

Preset
```css
/* Dark luxe — น้ำหอม, เครื่องประดับ */
:root { --bg:#0b0908; --ink:#f3ece2; --muted:#b4a891; --accent:#c9a35b; --serif:"Cormorant Garamond",serif; --sans:"Inter",sans-serif; }
/* Void + metal — นาฬิกา, ยานยนต์ */
:root { --bg:#020203; --ink:#f4f1ec; --muted:rgb(244 241 236/.6); --accent:#6e8fc9; --serif:"Instrument Serif",serif; --sans:"Instrument Sans",sans-serif; }
/* Forest leather — หนัง, งานคราฟต์ */
:root { --bg:#0b0f0c; --ink:#efe8dc; --muted:#a9a293; --accent:#b7834a; --serif:"Instrument Serif",serif; --sans:"Public Sans",sans-serif; }
/* Blush light — สกินแคร์, ดอกไม้ */
:root { --bg:#f4e8ee; --ink:#2a1830; --muted:#4e3a55; --accent:#7a4b78; --scrim:rgb(244 232 238/.7); --serif:"Playfair Display",serif; --sans:"Manrope",sans-serif; }
/* Sky light — tech, gadget */
:root { --bg:#c3d2f0; --ink:#0d1526; --muted:#3b4a66; --accent:#1f3fbf; --scrim:rgb(195 210 240/.65); --serif:"Instrument Serif",serif; --sans:"Archivo",sans-serif; }
/* Garage — local business, อู่ซ่อม */
:root { --bg:#080706; --ink:#f2ede6; --muted:#a39a8e; --accent:#e2702b; --serif:"Archivo",sans-serif; --sans:"Archivo",sans-serif; }
```
ธีมสว่าง: scrim ต้องเป็นสีสว่าง และวิดีโอต้อง render บนพื้นหลังสีเดียวกับ `--bg` ไม่อย่างนั้นจะเห็นขอบ canvas

section แบบ "พื้นกระดาษ" (เช่นใบรับรอง) ให้ override tokens ในขอบเขตของ section นั้น:
```css
.paper { --bg:#d7dce2; --ink:#0b1526; --muted:rgb(11 21 38/.66); --line:rgb(11 21 38/.17); background:var(--bg); color:var(--ink); }
```

---

## 7. HTML พื้นฐาน

```html
<head>
  <script>document.documentElement.classList.add('js')</script>
  <link rel="preload" as="image" href="frames/landscape-lo/f_0001.webp" media="(orientation: landscape)">
  <link rel="preload" as="image" href="frames/portrait-lo/f_0001.webp"  media="(orientation: portrait)">
  <link rel="stylesheet" href="https://unpkg.com/lenis/dist/lenis.css">
  <link rel="stylesheet" href="../../engine/base.css">
  <link rel="stylesheet" href="brand.css">                 <!-- ต้องโหลดหลัง engine -->
</head>
<body>
  <a class="skip" href="#collection">Skip to the collection</a>
  <p class="sr-only" id="film-desc">คำบรรยายสั้นๆ ว่าในหนังเกิดอะไรขึ้น</p>
  <canvas class="film" data-film-canvas data-landscape="180" data-portrait="150" data-lo-step="3"
          role="img" aria-describedby="film-desc"></canvas>

  <header class="nav">…</header>
  <main class="page">
    <section class="scene" id="top" data-film="0-0.2">…</section>
    …
  </main>

  <script src="https://unpkg.com/lenis/dist/lenis.min.js"></script>
  <script src="motion.js"></script>
  <script src="../../engine/scroll-film.js"></script>
  <script src="../../engine/site.js"></script>
</body>
```

---

## 8. Section pattern library

เลือกใช้ตามประเภทเว็บ แต่ละ pattern มีโครง HTML/CSS หรือ JS สั้นๆ ให้ (ทุกตัวอ่านค่าจาก tokens)

### 8.1 Hero
- headline **อยู่นิ่ง** ไม่ขยับตาม scroll (เว็บต้นแบบทดสอบแล้วว่าการให้ headline ขยับตาม scroll ไม่ได้ผล)
- **วัดตำแหน่งเพื่อวาง ไม่ใช่เพื่อ animate**: วัดว่าตัวสินค้าอยู่ฝั่งไหนของเฟรมแรก แล้ววาง headline ไว้ฝั่งตรงข้าม ถ้ามีข้อความชุดถัดไปมาแทนที่ ต้องอยู่**คอลัมน์เดียวกัน**
- องค์ประกอบ: eyebrow (แบรนด์ · ข้อมูลจำเพาะ) → headline 2 บรรทัด → body 1 ประโยค → CTA หลัก + ปุ่มรอง → "SCROLL"

### 8.2 Story / Accord / System
eyebrow `01 — THE SYSTEM` → heading 2 บรรทัด → body 2–3 ประโยค อาจมี 2 คอลัมน์ย่อยเป็น "ชิ้น A / ชิ้น B"

### 8.3 รายละเอียดเป็นชั้น (I / II / III)
ใช้กับ notes ของน้ำหอม, ประโยชน์ของสกินแคร์ หรือ feature ของ gadget ในแต่ละแถวมีเลขโรมัน + ชื่อ + คำอธิบาย 1 บรรทัด + ป้าย (Top/Heart/Base)

### 8.4 Variant catalog ("plates")
ใช้กับสินค้าที่มีหลายรุ่น (6 วัสดุนาฬิกา, 10 หนัง, 6 กลิ่น, 4 ผลิตภัณฑ์)
- เรียงตามราคา แต่ละชิ้นแสดง: `PLATE 01` · รหัสรุ่น · ชื่อ · วัสดุ · ตาราง spec (CASE / DIAL / DELIVERY) · ราคา · ปุ่ม
- รูป studio 16:9 ที่แสดงผ่าน "หน้าต่าง" สี่เหลี่ยมจัตุรัส: ใช้ `object-fit: cover; object-position: 78% 50%` และ**ต้องให้ `sizes` บอกขนาดที่วาดจริง** (เช่น ภาพถูกขยาย 1.8 เท่าของหน้าต่าง) ไม่อย่างนั้น browser จะเลือกไฟล์ที่เล็กเกินไป
```html
<figure class="plate-win"><img src="card-argent-560.webp"
  srcset="card-argent-560.webp 560w, card-argent-1120.webp 1120w, hero-argent-1920.webp 1920w"
  sizes="(max-width: 768px) 180vw, 60vw" alt="Argent — steel, horizon blue dial"></figure>
```
```css
.plate-win { aspect-ratio: 1; overflow: hidden; }
.plate-win img { width: 100%; height: 100%; object-fit: cover; object-position: 78% 50%; }
```

### 8.5 Annotated plate (ภาพมีจุดอธิบายพร้อมเส้นชี้)
ชี้ที่โน้ตแล้ว marker ของโน้ตนั้นจะสว่างขึ้นและเส้นนำจะถูกวาดออกมา (ทำงานได้ทั้ง hover และ focus)
```html
<div class="anat">
  <div class="stage">
    <img src="anatomy.webp" alt="">
    <svg class="leads" aria-hidden="true"><path class="lead" data-for="n1"/></svg>
    <span class="mk" id="mk-n1" style="left:62%;top:28%">01</span>
  </div>
  <ol class="notes"><li tabindex="0" data-note="n1"><b>01 The bezel</b> …</li></ol>
</div>
```
```js
// พิกัดทั้งหมดเป็นพิกเซลของ .stage, SVG ครอบ stage พอดี
function drawLead(stage, note, mk, path) {
  const s = stage.getBoundingClientRect(), n = note.getBoundingClientRect(), m = mk.getBoundingClientRect();
  const x0 = n.left - s.left, y0 = n.top + n.height / 2 - s.top;               // จุดเริ่มที่ขอบโน้ต
  const cx = m.left + m.width / 2 - s.left, cy = m.top + m.height / 2 - s.top, r = m.width / 2;
  const elbowX = x0 + (cx - x0) / 3;                                             // ข้อศอกที่ 1/3 ของระยะ
  const ang = Math.atan2(cy - y0, cx - elbowX);
  const x1 = cx - Math.cos(ang) * r, y1 = cy - Math.sin(ang) * r;                // จบที่ "ขอบ" วง ไม่ใช่กลางวง
  path.setAttribute('d', `M${x0},${y0} H${elbowX} L${x1},${y1}`);
  const len = path.getTotalLength();                                             // dasharray ต้องรู้ความยาว
  path.style.strokeDasharray = path.style.strokeDashoffset = len;
}
// .lead.on { stroke-dashoffset: 0; transition: stroke-dashoffset .6s var(--e-out) }
// วาดใหม่ทุกครั้งที่ขนาดเปลี่ยน (ResizeObserver บน stage) เพราะปลายทั้งสองขยับตามโน้ต
```

### 8.6 Process docket / timeline
ใช้กับขั้นตอนการผลิต (เช่น 6 ขั้นที่มีเวลากำกับ) หรือขั้นตอนบริการของ local business (4 ขั้น "You call → bring it → we call → you decide") แต่ละแถว: เลข · ชื่อ · คำอธิบาย 1 ประโยค · เวลา (`1h10`) ส่วนหัวมี "ONE DOCKET · ชื่อสถานที่"

### 8.7 Certificate / document (พื้นกระดาษ)
section ที่ใช้ `.paper` tokens เป็นเหมือนเอกสารจริง (ใบรับรอง, ผลทดสอบ, ใบสั่ง) มีเลขกำกับ `NO. 0001 / 0300` กราฟแท่งจะวาดออกจากเส้นศูนย์**แค่ครั้งเดียว**เมื่อเลื่อนมาถึง แล้วอยู่นิ่ง (เป็น motion เดียวใน section)
```css
.bar { transform: scaleX(0); transform-origin: left; transition: transform 1.1s var(--e-out); }
.bar.neg { transform-origin: right; }
.paper.in .bar { transform: scaleX(var(--v)); }   /* --v = |ค่า| / ค่าสูงสุด */
```

### 8.8 Manifesto / frontal quote
scene เต็มจอที่มีประโยคเดียว ตัวใหญ่ ใช้ serif กึ่งกลาง และมีลายเซ็นด้านล่าง (`MERIDIAN · MMXXVI`) ใช้คั่นระหว่างส่วนข้อมูลกับฟอร์ม

### 8.9 Numbers / Specs
ตัวเลขใหญ่ 3–4 ตัว (412 g · 6 axes · 4 elements) ตามด้วยตาราง spec แบบ 2 คอลัมน์ `<dl>`

### 8.10 Reserve / appointment form
```html
<form id="reserve" action="/api/reserve" method="post" novalidate>
  <input name="name" required autocomplete="name">
  <input name="email" type="email" required autocomplete="email">
  <select name="ref"><option value="">Not decided yet</option>…</select>
  <textarea name="message"></textarea>
  <input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">  <!-- honeypot -->
  <p class="summary" role="alert" hidden></p>
  <button>Request an appointment</button>
</form>
```
```js
const form = document.querySelector('#reserve');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;     // แค่ "อะไรสักอย่าง@อะไรสักอย่าง.อะไรสักอย่าง" regex ที่ยาวเกินไปจะ reject อีเมลที่ใช้ได้จริง
form?.addEventListener('submit', async e => {
  e.preventDefault();                            // action/method ยังใช้ได้ถ้าไม่มี JS
  const bad = [];
  if (!form.name.value.trim()) bad.push(form.name);
  if (!EMAIL.test(form.email.value.trim())) bad.push(form.email);
  form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  bad.forEach(el => el.setAttribute('aria-invalid', 'true'));
  const sum = form.querySelector('.summary');
  if (bad.length) {                              // นับให้ตรงจริง ห้ามเขียนข้อความตายตัว
    sum.textContent = bad.length === 1 ? 'One field needs attention.' : `${bad.length} fields need attention.`;
    sum.hidden = false; bad[0].focus(); return;
  }
  if (form.website.value) return done();         // bot: แกล้งทำว่าสำเร็จ
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    let data = null;
    try { data = await res.json(); } catch {}   // 404/500 คืนค่าเป็น HTML ไม่ใช่ JSON
    if (!res.ok || !data?.ok) throw new Error();
    done();
  } catch { sum.textContent = 'Could not send. Please try again or email us.'; sum.hidden = false; }
  function done() { form.replaceChildren(Object.assign(document.createElement('p'), { textContent: 'Thank you — we reply within two working days.' })); }
});
```

### 8.11 Collection grid / checkout
- grid 4–6 ชิ้นบนพื้นทึบ: รูป · ชื่อ · ส่วนผสมหรือ notes · ราคา
- ปุ่มส่งข้อมูลผ่าน `data-*`: `<button data-add="cream" data-price="128">`
- **ห้ามเก็บเลขบัตรเองถ้าไม่มี payment provider จริง** ถ้าเป็น demo ต้องระบุให้ชัดว่าเป็น demo ส่วนงานจริงให้ส่งไป Stripe Checkout หรือ Omise (ไทย)

### 8.12 Local business (อู่, ร้านอาหาร, คลินิก, ร้านตัดผม)
- เบอร์โทรเป็น CTA หลัก: อยู่ใน nav ตลอด, มี skip link "Skip to phone number", และมีปุ่ม `tel:` ลอยอยู่บนมือถือ
- section: hero → งานที่ทำ → ขั้นตอนบริการ → บริการ → FAQ (`<details>`) → โทร → แผนที่และเวลาเปิด
- JSON-LD ใช้ subtype ที่ตรงที่สุด (`AutoRepair`, `Restaurant`, `HairSalon`, `Dentist`…)
```html
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "AutoRepair", "name": "…", "telephone": "+66…",
  "address": { "@type": "PostalAddress", "streetAddress": "…", "addressLocality": "…", "addressCountry": "TH" },
  "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "08:00", "closes": "18:00" }],
  "url": "https://…" }
</script>
<a href="tel:+66XXXXXXXXX">0XX-XXX-XXXX</a>
<a href="https://maps.google.com/?q=ที่อยู่+ที่เข้ารหัส+URL">Get directions</a>
```

---

## 9. ส่วนประกอบร่วม (site.js)

**Nav: section ที่ active** — ใช้ "แถบตัดสิน" ที่ 1/3 บนของจอ section ที่ active คือ section ที่**กำลังเข้ามา** ไม่ใช่ section ที่กินพื้นที่มากที่สุด (ถ้า section ยาว 5 จอ วิธีหลังจะตอบช้าเสมอ)
```js
const links = new Map([...document.querySelectorAll('.nav a[href^="#"]')].map(a => [a.hash.slice(1), a]));
const navIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  links.forEach(a => a.removeAttribute('aria-current'));
  links.get(e.target.id)?.setAttribute('aria-current', 'true');
}), { rootMargin: '0px 0px -66% 0px' });
links.forEach((_, id) => { const s = document.getElementById(id); s && navIO.observe(s); });
```

**เมนูมือถือ** — ต้องปิดได้ 3 ทาง: กด Escape, คลิกข้างนอก, และเลือกลิงก์ เมื่อขยายเป็น desktop ให้ reset state (ไม่อย่างนั้นพอกลับมาจอแคบ เมนูจะเปิดค้างเอง)
```js
const btn = document.querySelector('.menu-btn'), panel = document.querySelector('.menu');
const setOpen = v => { btn.setAttribute('aria-expanded', v); panel.toggleAttribute('data-open', v); };
btn?.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', e => e.key === 'Escape' && setOpen(false));
document.addEventListener('click', e => { if (btn && !panel.contains(e.target) && !btn.contains(e.target)) setOpen(false); });
panel?.addEventListener('click', e => e.target.closest('a') && setOpen(false));
matchMedia('(min-width: 769px)').addEventListener('change', e => e.matches && setOpen(false));
```

**Text reveal** — ใช้ CSS scroll-driven animation และมี IntersectionObserver เป็น fallback สำหรับ browser ที่ไม่รองรับ
```css
@keyframes rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  .reveal { animation: rise linear both; animation-timeline: view(); animation-range: entry 10% cover 30%; }
}
@supports not (animation-timeline: view()) {
  .js .reveal { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--e-out), transform .9s var(--e-out); }
  .js .reveal.in { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) { .reveal { animation: none !important; opacity: 1 !important; transform: none !important; } }
```
```js
if (!CSS.supports('animation-timeline: view()')) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.25 });
  document.querySelectorAll('.reveal, .paper').forEach(el => io.observe(el));
}
```
(`.paper` ยังต้องใช้ class `.in` สำหรับกราฟ ให้ observe แยกถ้า browser รองรับ scroll-driven)

**Progress bar** — `bar.style.transform = \`scaleX(${p})\`` เขียนตรงๆ ใน tick

---

## 10. หน้า Portfolio (รวมงานหลายแบรนด์)

การ์ดงานแต่ละชิ้นเป็น poster + วิดีโอสั้นที่อัดจากโหมด `?film=1` เล่นตอน hover บน desktop และเล่นตอนเลื่อนมาเห็นบนมือถือ
```html
<a class="work" href="/meridian/">
  <video muted loop playsinline preload="none" poster="meridian/poster.webp"
         aria-hidden="true" tabindex="-1" width="1080" height="676">
    <source src="meridian/preview.mp4" type="video/mp4"></video>
  <h3>Meridian</h3><p>Watch brand</p>
</a>
```
```js
const hover = matchMedia('(hover: hover)').matches;
document.querySelectorAll('.work video').forEach(v => {
  const play = () => v.play().catch(() => {}), stop = () => v.pause();
  if (hover) {
    const card = v.closest('.work');
    card.addEventListener('pointerenter', play); card.addEventListener('pointerleave', stop);
    card.addEventListener('focusin', play);      card.addEventListener('focusout', stop);
  } else {
    new IntersectionObserver(([e]) => e.isIntersecting ? play() : stop(), { threshold: 0.6 }).observe(v);
  }
});
```

---

## 11. Checklist ก่อนส่งงาน

Film
- [ ] เฟรมแรกขึ้นภายใน ~1 วินาที (preload lo frame แรก)
- [ ] scroll เร็วสุดแล้วไม่เห็น canvas ว่าง (`__film.stats.none` = 0)
- [ ] มี lerp ตัวเดียว (ของ Lenis) ไม่มี easing ซ้อนใน film
- [ ] จำนวนไฟล์ใน lo = ceil(hi / STEP), `data-landscape` และ `data-portrait` ตรงกับจำนวนไฟล์จริง
- [ ] จอแนวนอนและแนวตั้งได้ชุดเฟรมที่ถูกต้อง, หมุนจอแล้ว reload ถูกต้อง
- [ ] iPhone Safari: ไม่ crash (memory ไม่เกิน ~250 MB), URL bar ยุบแล้วภาพไม่กระโดด (`100lvh`)
- [ ] ปิดแท็บไปนานๆ แล้วกลับมา canvas ไม่ดำ (`contextrestored`)

เนื้อหาและการเข้าถึง
- [ ] headline ใน hero ไม่ทับตัวสินค้าในเฟรมแรก ทั้งแนวนอนและแนวตั้ง
- [ ] ตัวหนังสือบนภาพมี contrast ≥ 4.5:1 ทั้งธีมมืดและธีมสว่าง (ใช้ scrim)
- [ ] canvas มีคำบรรยาย (`aria-describedby`), เนื้อหาทั้งหมดอยู่ใน HTML จริง, มี skip link
- [ ] `prefers-reduced-motion`: ปิด Lenis และ reveal แต่ยังอ่านเนื้อหาได้ครบ
- [ ] nav active ถูกต้อง, เมนูมือถือปิดได้ทั้ง 3 ทาง
- [ ] ฟอร์ม: มี honeypot, ข้อความสรุป error นับถูกต้อง, รองรับ response ที่ไม่ใช่ JSON

โครงสร้าง
- [ ] `brand.css` มีแค่ tokens (engine ใช้ซ้ำได้จริง)
- [ ] local business: มี JSON-LD, `tel:`, ลิงก์แผนที่ และเวลาเปิด
- [ ] ขนาดเฟรมรวมไม่เกินงบประมาณ และ cache header ของ `/frames/` เป็นแบบยาว (immutable)
- [ ] ไม่มีฟอร์มบัตรเครดิตจริงถ้าไม่ได้เชื่อม payment provider
