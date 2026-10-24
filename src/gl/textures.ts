/* =========================================================
   PROCEDURAL TEXTURES — วาดด้วย canvas ไม่ต้องโหลดไฟล์ภาพ
   ใช้เป็น emissiveMap: ดำ = ไม่เรืองแสง · สว่าง = เรืองแสง (bloom จับ)
   ========================================================= */
import * as THREE from 'three';

const rng = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function make(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** ลายวงจรบน PCB — เส้นทองแดงแนวตั้ง/นอน/45° วิ่งเข้าหาพื้นที่ die ตรงกลาง */
export function traceTexture(size = 1024) {
  return make(size, (g, s) => {
    const r = rng(11);
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    const step = s / 64;
    const snap = (v: number) => Math.round(v / step) * step;
    const inner = [s * 0.3, s * 0.7];
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let i = 0; i < 130; i++) {
      const side = Math.floor(r() * 4);
      let x = side === 0 ? step * 2 : side === 1 ? s - step * 2 : snap(r() * s);
      let y = side === 2 ? step * 2 : side === 3 ? s - step * 2 : snap(r() * s);
      if (side < 2) y = snap(s * 0.08 + r() * s * 0.84);
      else x = snap(s * 0.08 + r() * s * 0.84);
      const tx = snap(inner[0] + r() * (inner[1] - inner[0]));
      const ty = snap(inner[0] + r() * (inner[1] - inner[0]));
      const bright = 0.35 + r() * 0.65;
      g.strokeStyle = `rgba(255,255,255,${bright})`;
      g.lineWidth = r() > 0.85 ? 3 : 1.6;
      g.beginPath();
      g.moveTo(x, y);
      // วิ่งแกนหลักก่อน แล้วเลี้ยว 45° เข้าหาเป้า
      const horizontalFirst = side < 2;
      const mid = horizontalFirst ? { x: tx - Math.sign(tx - x) * Math.abs(ty - y), y } : { x, y: ty - Math.sign(ty - y) * Math.abs(tx - x) };
      g.lineTo(mid.x, mid.y);
      g.lineTo(tx, ty);
      g.stroke();
      g.fillStyle = `rgba(255,255,255,${bright})`;
      g.beginPath();
      g.arc(x, y, 3.2, 0, Math.PI * 2);
      g.fill();
      // จุด via ระหว่างทาง
      if (r() > 0.5) {
        g.beginPath();
        g.arc(mid.x, mid.y, 2.4, 0, Math.PI * 2);
        g.fill();
      }
    }
    // ช่องว่างตรงกลางสำหรับ die + กรอบ
    g.fillStyle = '#000';
    g.fillRect(s * 0.33, s * 0.33, s * 0.34, s * 0.34);
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = 2;
    g.strokeRect(s * 0.32, s * 0.32, s * 0.36, s * 0.36);
    // ขอบบอร์ด
    g.strokeStyle = 'rgba(255,255,255,.5)';
    g.strokeRect(step, step, s - step * 2, s - step * 2);
  });
}

/** ฐาน socket — กริดละเอียด + มุมเล็ง + ป้ายรุ่น */
export function socketTexture(size = 1024) {
  return make(size, (g, s) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    const n = 32;
    g.strokeStyle = 'rgba(255,255,255,.16)';
    g.lineWidth = 1;
    for (let i = 1; i < n; i++) {
      const p = (i / n) * s;
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, s);
      g.moveTo(0, p);
      g.lineTo(s, p);
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineWidth = 4;
    const m = s * 0.04;
    const L = s * 0.12;
    [
      [m, m, 1, 1],
      [s - m, m, -1, 1],
      [m, s - m, 1, -1],
      [s - m, s - m, -1, -1],
    ].forEach(([x, y, dx, dy]) => {
      g.beginPath();
      g.moveTo(x + dx * L, y);
      g.lineTo(x, y);
      g.lineTo(x, y + dy * L);
      g.stroke();
    });
    g.strokeStyle = 'rgba(255,255,255,.55)';
    g.lineWidth = 2;
    g.strokeRect(s * 0.18, s * 0.18, s * 0.64, s * 0.64);
    g.fillStyle = 'rgba(255,255,255,.85)';
    g.font = `500 ${s * 0.028}px "JetBrains Mono", monospace`;
    g.fillText('STACK CORE · TK-01', s * 0.06, s * 0.955);
    g.textAlign = 'right';
    g.fillText('FULL STACK / 2569', s * 0.94, s * 0.955);
  });
}

/** die ซิลิคอน — บล็อกคอร์ 4×4 + บัส */
export function dieTexture(size = 512) {
  return make(size, (g, s) => {
    const r = rng(5);
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    const pad = s * 0.08;
    const cell = (s - pad * 2) / 4;
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const x = pad + i * cell + 6;
        const y = pad + j * cell + 6;
        const w = cell - 12;
        g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.08})`;
        g.fillRect(x, y, w, w);
        g.strokeStyle = 'rgba(255,255,255,.75)';
        g.lineWidth = 1.5;
        g.strokeRect(x, y, w, w);
        g.strokeStyle = 'rgba(255,255,255,.3)';
        for (let k = 1; k < 4; k++) {
          g.beginPath();
          g.moveTo(x + (w * k) / 4, y + 4);
          g.lineTo(x + (w * k) / 4, y + w - 4);
          g.stroke();
        }
      }
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = 3;
    g.strokeRect(pad * 0.5, pad * 0.5, s - pad, s - pad);
  });
}

/** ชั้น interface — wireframe หน้าจอ UI (sidebar · cards · กราฟ) */
export function uiTexture(size = 1024) {
  return make(size, (g, s) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    const W = (a: number) => a * s;
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineWidth = 3;
    g.strokeRect(W(0.06), W(0.06), W(0.88), W(0.88));
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(W(0.06), W(0.15));
    g.lineTo(W(0.94), W(0.15));
    g.moveTo(W(0.26), W(0.15));
    g.lineTo(W(0.26), W(0.94));
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,.95)';
    [0.09, 0.115, 0.14].forEach(x => {
      g.beginPath();
      g.arc(W(x), W(0.105), W(0.008), 0, Math.PI * 2);
      g.fill();
    });
    g.globalAlpha = 0.6;
    for (let i = 0; i < 7; i++) g.fillRect(W(0.09), W(0.2 + i * 0.06), W(0.13 - (i % 3) * 0.02), W(0.012));
    g.globalAlpha = 1;
    // การ์ดสถิติ
    for (let i = 0; i < 3; i++) {
      g.strokeRect(W(0.3 + i * 0.21), W(0.2), W(0.18), W(0.14));
      g.fillRect(W(0.32 + i * 0.21), W(0.23), W(0.06), W(0.03));
    }
    // กราฟ
    g.strokeRect(W(0.3), W(0.38), W(0.6), W(0.32));
    g.beginPath();
    const pts = [0.62, 0.55, 0.6, 0.48, 0.5, 0.44, 0.47, 0.42, 0.45];
    pts.forEach((v, i) => {
      const x = W(0.32 + i * 0.07);
      const y = W(v + 0.02);
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.lineWidth = 3;
    g.stroke();
    // ตาราง
    g.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = 0.7;
      g.fillRect(W(0.3), W(0.75 + i * 0.045), W(0.6 - (i % 2) * 0.15), W(0.01));
    }
    g.globalAlpha = 1;
    g.font = `500 ${W(0.026)}px "JetBrains Mono", monospace`;
    g.fillText('~/portfolio.tsx', W(0.62), W(0.115));
  });
}

/** กรอบสแกน — เส้นขอบสี่เหลี่ยมเรืองแสงบาง ๆ ที่กวาดผ่านชั้นของชิป */
export function scanTexture(size = 512) {
  return make(size, (g, s) => {
    g.clearRect(0, 0, s, s);
    const m = s * 0.06;
    g.shadowColor = 'rgba(255,255,255,1)';
    g.shadowBlur = s * 0.03;
    g.strokeStyle = 'rgba(255,255,255,.95)';
    g.lineWidth = s * 0.006;
    g.strokeRect(m, m, s - m * 2, s - m * 2);
    g.shadowBlur = 0;
    const grd = g.createLinearGradient(0, 0, 0, s);
    grd.addColorStop(0, 'rgba(255,255,255,.05)');
    grd.addColorStop(0.5, 'rgba(255,255,255,.015)');
    grd.addColorStop(1, 'rgba(255,255,255,.05)');
    g.fillStyle = grd;
    g.fillRect(m, m, s - m * 2, s - m * 2);
  });
}

/* ---------- ฉาก Inside the core ---------- */

/** floorplan ของ die — กริดละเอียด + แถว standard cell (มองใกล้แล้วเห็นเหมือนลายวงจรจริง) */
export function floorplanTexture(size = 1024) {
  return make(size, (g, s) => {
    const r = rng(23);
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = 'rgba(255,255,255,.05)';
    g.lineWidth = 1;
    for (let p = 0; p <= s; p += s / 64) {
      g.beginPath();
      g.moveTo(p, 0);
      g.lineTo(p, s);
      g.moveTo(0, p);
      g.lineTo(s, p);
      g.stroke();
    }
    // แถว standard cell
    const rowH = s / 96;
    for (let y = rowH; y < s - rowH; y += rowH * 1.6) {
      let x = s * 0.02;
      while (x < s * 0.98) {
        const w = rowH * (0.6 + r() * 4);
        g.fillStyle = `rgba(255,255,255,${0.03 + r() * 0.1})`;
        g.fillRect(x, y, w, rowH * 0.8);
        x += w + rowH * (0.2 + r() * 0.8);
      }
    }
    // power ring ขอบ die
    g.strokeStyle = 'rgba(255,255,255,.55)';
    g.lineWidth = 3;
    g.strokeRect(s * 0.015, s * 0.015, s * 0.97, s * 0.97);
    g.strokeStyle = 'rgba(255,255,255,.18)';
    g.strokeRect(s * 0.035, s * 0.035, s * 0.93, s * 0.93);
  });
}

/** เซลล์หน่วยความจำ — ช่องเล็ก ๆ สว่าง/มืดแบบสุ่ม เหมือนบิตที่เก็บอยู่ */
export function memoryTexture(size = 256) {
  return make(size, (g, s) => {
    const r = rng(41);
    g.fillStyle = '#000';
    g.fillRect(0, 0, s, s);
    const n = 16;
    const c = s / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        g.fillStyle = `rgba(255,255,255,${r() > 0.55 ? 0.55 + r() * 0.4 : 0.06})`;
        g.fillRect(i * c + 2, j * c + 2, c - 4, c - 4);
      }
    g.strokeStyle = 'rgba(255,255,255,.8)';
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, s - 3, s - 3);
  });
}

/** hex dump แบบพื้นโปร่งใส — ใช้เป็นโฮโลแกรมข้อมูลที่เลื่อนขึ้นเหนือ tensor core (repeat แนวตั้ง) */
export function hexTexture(w = 512, h = 1024) {
  const r = rng(77);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.font = '500 20px "JetBrains Mono", ui-monospace, monospace';
  g.textBaseline = 'top';
  const hex = (n: number, d = 2) => n.toString(16).toUpperCase().padStart(d, '0');
  for (let y = 8, addr = 0x1f40; y < h - 24; y += 30, addr += 8) {
    const bytes = Array.from({ length: 8 }, () => hex(Math.floor(r() * 256))).join(' ');
    g.fillStyle = 'rgba(255,255,255,.35)';
    g.fillText(hex(addr, 4), 14, y);
    g.fillStyle = `rgba(255,255,255,${0.45 + r() * 0.5})`;
    g.fillText(bytes, 96, y);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** ไล่ความเข้มแนวตั้ง (stops = [ตำแหน่งจากล่าง 0–1, ความเข้ม 0–1]) — ใช้เป็น alphaMap ให้ลำแสง/โฮโลแกรมจางที่ขอบ
 *  alphaMap อ่านช่องสีเขียว จึงวาดเป็นเทาทึบ ไม่ใช้ค่า alpha ของ canvas */
export function fadeTexture(stops: [number, number][]) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 256, 0, 0);
  for (const [at, v] of stops) {
    const k = Math.round(v * 255);
    grad.addColorStop(at, `rgb(${k},${k},${k})`);
  }
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(c);
}
