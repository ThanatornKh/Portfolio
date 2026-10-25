/* =========================================================
   06 · JOURNEY — ไทม์ไลน์ผลงานในรูปแบบ git log (ใหม่สุดอยู่บน)
   ========================================================= */
import { useRef } from 'react';
import { EXPERIENCE } from '../data/content';
import { WORKS } from '../data/derived';
import { locExperience, useL } from '../data/localize';
import { gsap, reduceMotion, useGSAP } from '../lib/motion';
import { openWorkById } from '../lib/route';
import SectionHead from './ui/SectionHead';
import './Journey.css';

/** แฮชสั้นแบบคงที่จาก id (ตกแต่งให้เหมือน git log) */
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7);
};

const YEARS = [...new Set(WORKS.map(w => w.year).filter(Boolean) as string[])].sort((a, b) => Number(b) - Number(a));
const UNDATED = WORKS.filter(w => !w.year);

export default function Journey() {
  const L = useL();
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reduceMotion) return;
      gsap.fromTo('.log__line', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.log', start: 'top 70%', end: 'bottom 70%', scrub: true } });
      gsap.utils.toArray<HTMLElement>('.log__row').forEach(row =>
        gsap.from(row, { opacity: 0, x: -24, duration: 0.9, scrollTrigger: { trigger: row, start: 'top 88%', once: true } }),
      );
    },
    { scope: ref },
  );

  const Row = ({ id, head }: { id: string; head?: boolean }) => {
    const w = L.w(WORKS.find(x => x.id === id)!);
    return (
      <li className="log__row">
        <span className="log__dot" aria-hidden="true" />
        <button type="button" className="log__btn" onClick={() => openWorkById(w.id)} data-cursor-label="git show">
          <span className="log__hash mono">
            {hash(w.id)}
            {head && <em> (HEAD → main)</em>}
          </span>
          <span className="log__msg">
            <span className="mono log__type">feat({w.category.code.toLowerCase()}):</span> {w.name} <span className="log__th">— {w.th}</span>
          </span>
          <span className="log__meta mono">{w.type}</span>
        </button>
      </li>
    );
  };

  return (
    <section id="journey" className="section journey" ref={ref}>
      <div className="wrap">
        <SectionHead
          id="journey"
          title={
            <>
              git log <span className="grad">--graph</span>
            </>
          }
          sub={L.tr('เส้นทางการเรียนและผลงาน เรียงจากล่าสุด — กดที่ commit เพื่อเปิดผลงาน', 'My study and work, newest first — click a commit to open the project')}
        />
        <div className="log">
          <span className="log__line" aria-hidden="true" />
          {YEARS.map((y, yi) => (
            <div className="log__year" key={y}>
              <h3 className="display log__y">{L.year(y)}</h3>
              <ul>
                {WORKS.filter(w => w.year === y).map((w, i) => (
                  <Row key={w.id} id={w.id} head={yi === 0 && i === 0} />
                ))}
              </ul>
            </div>
          ))}
          {UNDATED.length > 0 && (
            <div className="log__year">
              <h3 className="display log__y">{L.tr('งานวิชา & องค์กร', 'Coursework & company')}</h3>
              <ul>
                {UNDATED.map(w => (
                  <Row key={w.id} id={w.id} />
                ))}
              </ul>
            </div>
          )}
          {locExperience(L.lang).map((e, i) => (
            <div className="log__year" key={i}>
              <h3 className="display log__y">{e.date}</h3>
              <ul>
                <li className="log__row log__row--root">
                  <span className="log__dot" aria-hidden="true" />
                  <div className="log__btn">
                    <span className="log__hash mono">
                      {hash(EXPERIENCE[i].org)} <em>(root commit)</em>
                    </span>
                    <span className="log__msg">
                      <span className="mono log__type">init:</span> {e.role} — {e.org}
                    </span>
                    <span className="log__meta mono">{e.chip}</span>
                  </div>
                </li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
