/* การ์ดโปรไฟล์โฮโลแกรม — เอียงตามเมาส์ + ฟอยล์สีรุ้ง (เทคนิคจาก React Bits ProfileCard) */
import { useRef, useState, type ReactNode } from 'react';
import { finePointer, reduceMotion } from '../../lib/motion';
import './HoloCard.css';

export default function HoloCard({ photo, alt, fallback, footer }: { photo: string; alt: string; fallback: ReactNode; footer: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const raf = useRef(0);

  const onMove = (e: React.PointerEvent) => {
    if (!finePointer || reduceMotion) return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty('--px', `${(x * 100).toFixed(1)}%`);
      el.style.setProperty('--py', `${(y * 100).toFixed(1)}%`);
      el.style.setProperty('--rx', `${((0.5 - y) * 14).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${((x - 0.5) * 18).toFixed(2)}deg`);
      el.style.setProperty('--active', '1');
    });
  };
  const onLeave = () => {
    const el = ref.current!;
    cancelAnimationFrame(raf.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--active', '0');
  };

  return (
    <div className="holo" ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} data-cursor data-cursor-label="hologram">
      <div className="holo__body">
        <div className="holo__tile">
          {!failed ? <img src={photo} alt={alt} loading="lazy" onError={() => setFailed(true)} /> : <div className="holo__fallback">{fallback}</div>}
          <span className="holo__foil" aria-hidden="true" />
          <span className="holo__glare" aria-hidden="true" />
          <span className="holo__scan" aria-hidden="true" />
        </div>
        <div className="holo__footer">{footer}</div>
      </div>
    </div>
  );
}
