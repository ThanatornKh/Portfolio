/* =========================================================
   03 · FLAGSHIP — การ์ดซ้อนแบบ sticky (React Bits ScrollStack / MotionSites "sticky project cards")
   การ์ดใบก่อนหดและมืดลงเมื่อใบถัดไปเลื่อนขึ้นมาทับ
   ========================================================= */
import { useRef } from 'react';
import { useL } from '../data/localize';
import { FEATURED, pad } from '../data/derived';
import { gsap, reduceMotion, useGSAP } from '../lib/motion';
import { openWorkById } from '../lib/route';
import { onButtonGlow, useSpotlight } from '../lib/useSpotlight';
import ProjectMedia from './ui/ProjectMedia';
import SectionHead from './ui/SectionHead';
import './Flagship.css';

export default function Flagship() {
  const L = useL();
  const ref = useRef<HTMLElement>(null);
  useSpotlight(ref);

  useGSAP(
    () => {
      if (reduceMotion) return;
      const slots = gsap.utils.toArray<HTMLElement>('.flag__slot');
      // "AI scan": เส้นสแกนกวาดลง → ภาพปรากฏตาม → มุมเล็งล็อก → ค่าตัวเลขถอดรหัส
      slots.forEach(slot => {
        const view = slot.querySelector('.scan__view');
        const line = slot.querySelector('.scan__line');
        const tl = gsap.timeline({ scrollTrigger: { trigger: slot, start: 'top 72%', once: true } });
        tl.fromTo(view, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power2.inOut' }, 0)
          .fromTo(line, { top: '0%', opacity: 1 }, { top: '100%', duration: 1.5, ease: 'power2.inOut' }, 0)
          .to(line, { opacity: 0, duration: 0.3 }, 1.45)
          .fromTo(slot.querySelectorAll('.scan__corners i'), { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out' }, 1.1)
          .fromTo(slot.querySelector('.scan__grid'), { opacity: 0.5 }, { opacity: 0, duration: 1.2 }, 0.6)
          .from(slot.querySelector('.scan__tag'), { opacity: 0, x: 10, duration: 0.6 }, 1.25);
        slot.querySelectorAll<HTMLElement>('.scan__readout b').forEach((b, i) =>
          tl.from(b, { duration: 0.9, scrambleText: { text: '{original}', chars: '0123456789<>/#', revealDelay: 0.2 } }, 1.3 + i * 0.1),
        );
      });
      // ซ้อนการ์ดเฉพาะจอใหญ่ (มือถือการ์ดสูงเกินจอ → เรียงต่อกันธรรมดา)
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', () => {
        slots.forEach((slot, i) => {
          const card = slot.querySelector('.flag__card');
          const next = slots[i + 1];
          if (!next || !card) return;
          gsap.to(card, {
            scale: 0.9 + i * 0.012,
            filter: 'brightness(0.45)',
            ease: 'none',
            scrollTrigger: { trigger: next, start: 'top 75%', end: 'top 22%', scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section id="works" className="section flag" ref={ref}>
      <div className="wrap">
        <SectionHead
          id="works"
          title={
            <>
              Flagship <span className="grad">works.</span>
            </>
          }
          sub={L.tr('งานที่ใหญ่และใช้งานจริงที่สุด — ระบบที่ออนไลน์อยู่, ระบบในองค์กร และงานข้อมูลระดับล้านแถว', 'The biggest work, in real use — systems online today, an in-house company system and data work at the scale of millions of rows')}
        />
        <div className="flag__stack">
          {FEATURED.map((fw, i) => {
            const w = L.w(fw);
            const live = fw.links?.find(l => l.label.includes('ระบบจริง') || l.label.includes('เว็บไซต์'));
            return (
              <div className="flag__slot" key={w.id} style={{ ['--i' as string]: i }}>
                <article className="flag__card spot">
                  <div className="flag__info">
                    <div className="flag__top mono">
                      <span className="flag__code">{w.code}</span>
                      <span>{w.category.name}</span>
                      <span className="flag__count">
                        {pad(i + 1)} / {pad(FEATURED.length)}
                      </span>
                    </div>
                    <h3 className="flag__name display">{w.name}</h3>
                    <p className="flag__th">{w.th}</p>
                    <p className="flag__desc">{w.desc}</p>
                    <ul className="flag__hl">
                      {w.highlights.slice(0, 3).map(h => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                    {(w.role || w.note) && <p className="flag__note mono">{w.role ?? w.note}</p>}
                    <div className="chips flag__chips">
                      {w.stack.slice(0, 7).map(s => (
                        <span className="chip" key={s}>
                          {s}
                        </span>
                      ))}
                      {w.stack.length > 7 && <span className="chip">+{w.stack.length - 7}</span>}
                    </div>
                    <div className="flag__cta">
                      <button type="button" className="btn btn--solid" onClick={() => openWorkById(w.id)} onPointerMove={onButtonGlow} data-cursor-label="case study">
                        {L.tr('รายละเอียด', 'Case study')} <span className="arrow">→</span>
                      </button>
                      {live && (
                        <a className="btn btn--glass glass" href={live.url} target="_blank" rel="noopener" onPointerMove={onButtonGlow} data-cursor-label="visit ↗">
                          Live ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <button type="button" className="flag__visual" onClick={() => openWorkById(w.id)} aria-label={L.tr(`ดูรายละเอียด ${w.name}`, `View details: ${w.name}`)} data-cursor-label="open">
                    <span className="flag__frame">
                      <span className="flag__bar" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <em>{live ? live.url.replace(/^https?:\/\//, '') : `${w.id}.local`}</em>
                      </span>
                      <span className="scan__view">
                        <ProjectMedia work={w} className="flag__media hol" />
                        <span className="scan__grid" aria-hidden="true" />
                        <span className="scan__line" aria-hidden="true" />
                        <span className="scan__corners" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                        {w.status && <span className="scan__tag mono">{w.status}</span>}
                      </span>
                      {w.metrics && (
                        <span className="scan__readout mono">
                          <span className="scan__label">analysis ▸</span>
                          {w.metrics.map(([k, v]) => (
                            <span key={k}>
                              {k} <b>{v}</b>
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                    <span className="flag__big display" aria-hidden="true">
                      {pad(i + 1)}
                    </span>
                  </button>
                </article>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
