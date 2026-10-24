/* ภาพปกแบบพิมพ์เขียว สำหรับผลงานที่ไม่มีภาพหน้าจอ (หรือภาพโหลดไม่ได้) */
import { useId } from 'react';
import type { CategoryId } from '../../data/types';

const GLYPHS: Record<CategoryId, string> = {
  // จอ + มือถือ + ฐานข้อมูล
  fullstack:
    'M70 70h170v110H70z M70 92h170 M84 81h4 M94 81h4 M104 81h4 M86 108h70 M86 122h110 M86 136h90 M86 150h50 M262 96h52v96h-52z M280 182h16 M120 210c0-8 40-8 40 0v34c0 8-40 8-40 0z M120 210c0 8 40 8 40 0 M120 226c0 8 40 8 40 0 M196 196v24h-36 M288 192v40h-128',
  // กราฟ + โหนด
  data: 'M70 230h250 M70 230V70 M96 230v-50 M126 230v-90 M156 230v-70 M186 230v-120 M216 230v-60 M96 180l30-40 30 20 30-50 30 60 M262 104a10 10 0 1 0 20 0a10 10 0 1 0-20 0 M300 150a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M262 196a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M280 110l24 34 M308 158l-28 34',
  // หน้าต่างเบราว์เซอร์
  web: 'M60 70h270v170H60z M60 96h270 M74 83h4 M84 83h4 M94 83h4 M120 78h180v10H120z M80 116h110v64H80z M206 116h104 M206 132h84 M206 148h94 M80 196h230 M80 212h160',
  // ชิป + คลื่นสัญญาณ
  iot: 'M140 110h110v110H140z M160 130h70v70h-70z M150 110V92 M170 110V92 M190 110V92 M210 110V92 M230 110V92 M150 238v-18 M170 238v-18 M190 238v-18 M210 238v-18 M230 238v-18 M140 130h-18 M140 150h-18 M140 170h-18 M140 190h-18 M140 210h-18 M268 130h-18 M268 150h-18 M268 170h-18 M268 190h-18 M268 210h-18 M290 92a40 40 0 0 1 0 56 M306 76a62 62 0 0 1 0 88',
  // จอยเกม
  game: 'M110 140c0-24 18-36 40-36h90c22 0 40 12 40 36l14 64c4 20-18 30-32 16l-26-26h-82l-26 26c-14 14-36 4-32-16z M146 150v30 M131 165h30 M236 156a6 6 0 1 0 12 0a6 6 0 1 0-12 0 M254 174a6 6 0 1 0 12 0a6 6 0 1 0-12 0',
};

export default function Blueprint({ cat, code, label }: { cat: CategoryId; code: string; label: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg className="blueprint" viewBox="0 0 390 300" role="img" aria-label={`${label} — ภาพปกแบบพิมพ์เขียว`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={`bp-grid-${uid}`} width="15" height="15" patternUnits="userSpaceOnUse">
          <path d="M15 0H0V15" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" />
        </pattern>
        <linearGradient id={`bp-glow-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2f2ef" />
          <stop offset="1" stopColor="#8b949b" />
        </linearGradient>
      </defs>
      <rect width="390" height="300" fill="#0b0b0b" />
      <rect width="390" height="300" fill={`url(#bp-grid-${uid})`} />
      <path d={GLYPHS[cat]} fill="none" stroke={`url(#bp-glow-${uid})`} strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" />
      <text x="20" y="30" fill="#f2f2ef" fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="2">
        {code}
      </text>
      <text x="20" y="282" fill="#7d7d78" fontFamily="JetBrains Mono, monospace" fontSize="10">
        {label.toUpperCase().slice(0, 30)}
      </text>
      <text x="370" y="282" fill="#55554f" fontFamily="JetBrains Mono, monospace" fontSize="9" textAnchor="end">
        BLUEPRINT
      </text>
    </svg>
  );
}
