/* =========================================================
   07 · Q&A — accordion (details/summary) · [[id]] = ลิงก์ไปผลงาน
   ========================================================= */
import { useRef, type ReactNode } from 'react';
import { FAQ } from '../data/content';
import { getWork } from '../data/derived';
import { gsap, reduceMotion, useGSAP } from '../lib/motion';
import { openWorkById } from '../lib/route';
import SectionHead from './ui/SectionHead';
import './Faq.css';

function withLinks(text: string): ReactNode[] {
  return text.split(/(\[\[[a-z0-9-]+\]\])/).map((part, i) => {
    const m = part.match(/^\[\[([a-z0-9-]+)\]\]$/);
    const w = m && getWork(m[1]);
    return w ? (
      <button key={i} type="button" className="faq__link" onClick={() => openWorkById(w.id)}>
        {w.name}
      </button>
    ) : (
      part
    );
  });
}

export default function Faq() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (reduceMotion) return;
      gsap.from('.faq__item', { opacity: 0, y: 30, stagger: 0.07, duration: 0.9, scrollTrigger: { trigger: '.faq__list', start: 'top 80%', once: true } });
    },
    { scope: ref },
  );

  const toggle = (e: React.MouseEvent<HTMLElement>) => {
    const det = (e.currentTarget as HTMLElement).parentElement as HTMLDetailsElement;
    const body = det.querySelector<HTMLElement>('.faq__a');
    if (reduceMotion || !body) return;
    e.preventDefault();
    if (det.open) {
      gsap.to(body, { height: 0, opacity: 0, duration: 0.5, ease: 'expo.inOut', onComplete: () => { det.open = false; gsap.set(body, { clearProps: 'all' }); } });
    } else {
      det.open = true;
      gsap.from(body, { height: 0, opacity: 0, duration: 0.7, ease: 'expo.out', clearProps: 'all' });
    }
  };

  return (
    <section id="faq" className="section faq" ref={ref}>
      <div className="wrap faq__grid">
        <SectionHead
          id="faq"
          title={
            <>
              Asked before <span className="grad">hiring.</span>
            </>
          }
          sub="คำถามที่มักถูกถามก่อนรับเข้าทำงาน — ตอบจากผลงานจริงข้างบน"
        />
        <div className="faq__list">
          {FAQ.map((f, i) => (
            <details className="faq__item spot" key={f.q} open={i === 0}>
              <summary onClick={toggle} data-cursor-label="toggle">
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="faq__q">{f.q}</span>
                <span className="faq__icon" aria-hidden="true" />
              </summary>
              <div className="faq__a">
                <p>{withLinks(f.a)}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
