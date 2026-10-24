/* =========================================================
   04 · UNDER THE HOOD
   (1) Annotated plate — ภาพหน้าจอจริงของ B&P Parking + จุดอธิบาย + เส้นชี้ (SVG)
   (2) Quality report — "เอกสาร" พื้นกระดาษ กราฟแท่งวาดครั้งเดียวเมื่อเลื่อนมาถึง
   pattern จาก scroll-film-site skill (8.5 annotated plate, 8.7 certificate)
   ========================================================= */
import { useCallback, useEffect, useRef, useState } from 'react';
import { reduceMotion } from '../lib/motion';
import { openWorkById } from '../lib/route';
import SectionHead from './ui/SectionHead';
import './UnderTheHood.css';

const NOTES = [
  { id: 'n1', x: 11, y: 43.7, title: 'RBAC 4 บทบาท', body: 'เมนูแสดงตามสิทธิ์ และตรวจซ้ำ 2 ชั้นทั้งที่ proxy และ server action — logout บังคับได้ทันทีด้วย sessionVersion' },
  { id: 'n2', x: 63, y: 30, title: 'จองช่องแบบไม่ชนกัน', body: 'FOR UPDATE SKIP LOCKED กันรถสองคันได้ช่องเดียวกัน แม้กดพร้อมกันจากหลายตู้' },
  { id: 'n3', x: 66, y: 68, title: 'ที่ว่างเรียลไทม์ (SSE)', body: 'สถานะ 4 ชั้นอัปเดตทันทีที่รถเข้า–ออก ผ่าน Server-Sent Events ไม่ต้องรีเฟรช' },
  { id: 'n4', x: 23, y: 52, title: 'รับเงินพร้อมเพย์', body: 'webhook แบบ idempotent (Redis) + ตรวจลายเซ็น HMAC + ตรวจยอดซ้ำฝั่งเซิร์ฟเวอร์ · เดโม่ใช้ผู้ให้บริการจำลอง' },
  { id: 'n5', x: 94, y: 15.3, title: 'ออนไลน์จริง', body: 'Docker Compose บน VPS หลัง Nginx + HTTPS พร้อม health check' },
];

const REPORT = [
  { project: 'B&P Parking', id: 'bp-parking', check: 'Unit & integration tests', tool: 'Vitest', value: '328', v: 328 / 328 },
  { project: 'B&P Parking', id: 'bp-parking', check: 'Code coverage', tool: 'Vitest', value: '99.2%', v: 0.992 },
  { project: 'B&P Parking', id: 'bp-parking', check: 'SonarQube issues resolved', tool: 'SonarQube', value: '77 → 0', v: 1 },
  { project: 'FixStatusCar', id: 'fixstatuscar', check: 'UI + API automation cases', tool: 'Robot Framework', value: '115', v: 115 / 328 },
  { project: 'Thai IT Jobs', id: 'thai-it-jobs', check: 'Data pipeline tests', tool: 'pytest', value: '119', v: 119 / 328 },
];

function Plate() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState('n1');
  const [lines, setLines] = useState<Record<string, string>>({});

  // วาดเส้นชี้: เริ่มที่ขอบซ้ายของโน้ต → ข้อศอกที่ 1/3 → จบที่ "ขอบ" วงของ marker
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.getBoundingClientRect();
    const next: Record<string, string> = {};
    NOTES.forEach(n => {
      const note = wrap.querySelector<HTMLElement>(`[data-note="${n.id}"]`);
      const mk = wrap.querySelector<HTMLElement>(`#mk-${n.id}`);
      if (!note || !mk) return;
      const a = note.getBoundingClientRect();
      const m = mk.getBoundingClientRect();
      const x0 = a.left - w.left - 10;
      const y0 = a.top + 14 - w.top;
      const cx = m.left + m.width / 2 - w.left;
      const cy = m.top + m.height / 2 - w.top;
      const r = m.width / 2 + 3;
      const elbowX = x0 + (cx - x0) / 3;
      const ang = Math.atan2(cy - y0, cx - elbowX);
      next[n.id] = `M${x0.toFixed(1)},${y0.toFixed(1)} H${elbowX.toFixed(1)} L${(cx - Math.cos(ang) * r).toFixed(1)},${(cy - Math.sin(ang) * r).toFixed(1)}`;
    });
    setLines(next);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    measure();
    return () => ro.disconnect();
  }, [measure]);

  return (
    <div className="anat" ref={wrapRef}>
      <figure className="anat__stage">
        <img src={`${import.meta.env.BASE_URL}projects/bp-dashboard.jpg`} alt="B&P Parking — แดชบอร์ดผู้ดูแล (ภาพจากระบบที่รันด้วย Docker)" loading="lazy" onLoad={measure} />
        {NOTES.map((n, i) => (
          <button
            key={n.id}
            id={`mk-${n.id}`}
            type="button"
            className={`anat__mk${active === n.id ? ' is-on' : ''}`}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            onPointerEnter={() => setActive(n.id)}
            onFocus={() => setActive(n.id)}
            aria-label={`${String(i + 1).padStart(2, '0')} ${n.title}`}
            data-cursor-label="inspect"
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
        <figcaption className="mono">FS-02 · B&amp;P Parking · admin dashboard · seeded demo data</figcaption>
      </figure>
      <ol className="anat__notes">
        {NOTES.map((n, i) => (
          <li
            key={n.id}
            data-note={n.id}
            tabIndex={0}
            className={active === n.id ? 'is-on' : ''}
            onPointerEnter={() => setActive(n.id)}
            onFocus={() => setActive(n.id)}
          >
            <span className="mono">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <b>{n.title}</b>
              <p>{n.body}</p>
            </div>
          </li>
        ))}
        <li className="anat__more">
          <button type="button" className="btn btn--glass" onClick={() => openWorkById('bp-parking')} data-cursor-label="case study">
            ดูผลงานเต็ม <span className="arrow">→</span>
          </button>
        </li>
      </ol>
      <svg className="anat__leads" aria-hidden="true">
        {NOTES.map(n => (
          <path key={n.id} d={lines[n.id] ?? ''} className={active === n.id ? 'is-on' : ''} pathLength={1} />
        ))}
      </svg>
    </div>
  );
}

function Report() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(reduceMotion);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`paper${inView ? ' in' : ''}`} ref={ref}>
      <header className="paper__head">
        <div>
          <p className="mono">Quality report</p>
          <h3 className="display">Tested, measured, shipped.</h3>
        </div>
        <dl className="paper__meta mono">
          <div>
            <dt>No.</dt>
            <dd>0443 / 2569</dd>
          </div>
          <div>
            <dt>Scope</dt>
            <dd>3 projects · 5 checks</dd>
          </div>
        </dl>
      </header>
      <table className="paper__table">
        <thead>
          <tr className="mono">
            <th scope="col">Project</th>
            <th scope="col">Check</th>
            <th scope="col">Tool</th>
            <th scope="col" className="paper__num">Result</th>
            <th scope="col" className="paper__barcol">
              <span className="sr-only">สัดส่วน</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {REPORT.map(r => (
            <tr key={r.check}>
              <th scope="row">
                <button type="button" onClick={() => openWorkById(r.id)}>
                  {r.project}
                </button>
              </th>
              <td>{r.check}</td>
              <td className="mono">{r.tool}</td>
              <td className="paper__num">{r.value}</td>
              <td className="paper__barcol" aria-hidden="true">
                <span className="paper__bar" style={{ ['--v' as string]: r.v }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="paper__foot mono">
        <span>ตัวเลขจาก repository และรายงานผลทดสอบของแต่ละโปรเจกต์</span>
        <span className="paper__sign">T. Khwanmankong · MMXXVI</span>
      </footer>
    </div>
  );
}

export default function UnderTheHood() {
  return (
    <section id="hood" className="section hood">
      <div className="wrap">
        <SectionHead
          id="hood"
          title={
            <>
              Under the <span className="grad">hood.</span>
            </>
          }
          sub="เจาะดูระบบจริงหนึ่งตัวว่าข้างในออกแบบอย่างไร — และตัวเลขคุณภาพที่วัดได้จากงานจริง"
        />
        <Plate />
        <Report />
      </div>
    </section>
  );
}
