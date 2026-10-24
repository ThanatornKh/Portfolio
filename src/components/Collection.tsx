/* =========================================================
   04 · ALL PROJECTS — ผลงานทั้งหมด จัดเป็นหมวด
   แท็บกรองหมวด + GSAP Flip จัดตำแหน่งการ์ดใหม่แบบลื่น · การ์ด spotlight border
   ========================================================= */
import { useLayoutEffect, useRef } from 'react';
import { CATEGORIES } from '../data/content';
import { countIn, WORKS } from '../data/derived';
import type { CategoryId } from '../data/types';
import { Flip, gsap, reduceMotion, ScrollTrigger, useGSAP } from '../lib/motion';
import { openWorkById } from '../lib/route';
import { useUI } from '../lib/store';
import { useSpotlight } from '../lib/useSpotlight';
import ProjectMedia from './ui/ProjectMedia';
import SectionHead from './ui/SectionHead';
import './Collection.css';

export default function Collection() {
  const ref = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const filter = useUI(s => s.filter);
  const setFilter = useUI(s => s.setFilter);
  const flipState = useRef<Flip.FlipState | null>(null);
  useSpotlight(gridRef);

  const choose = (f: CategoryId | 'all') => {
    if (f === filter) return;
    if (!reduceMotion && gridRef.current) flipState.current = Flip.getState(gridRef.current.querySelectorAll('.card'));
    setFilter(f);
  };

  // หลัง React วาดการ์ดชุดใหม่ → Flip จากตำแหน่งเดิม
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !gridRef.current) return;
    flipState.current = null;
    Flip.from(state, {
      targets: gridRef.current.querySelectorAll('.card'),
      duration: 0.8,
      ease: 'expo.out',
      absolute: true,
      scale: true,
      onEnter: els => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6 }),
      onLeave: els => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.3 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }, [filter]);

  useGSAP(
    () => {
      if (reduceMotion) return;
      ScrollTrigger.batch('.card', {
        start: 'top 90%',
        once: true,
        onEnter: els => gsap.from(els, { opacity: 0, y: 50, filter: 'blur(8px)', stagger: 0.08, duration: 1, clearProps: 'opacity,transform,translate,rotate,scale,filter' }),
      });
    },
    { scope: ref },
  );

  const shown = WORKS.filter(w => filter === 'all' || w.cat === filter);
  const cat = CATEGORIES.find(c => c.id === filter);

  return (
    <section id="collection" className="section coll" ref={ref}>
      <div className="wrap">
        <SectionHead
          id="collection"
          title={
            <>
              All <span className="grad">projects.</span>
            </>
          }
          sub={`${WORKS.length} ผลงาน ใน ${CATEGORIES.length} หมวด — กดที่การ์ดเพื่อดูรายละเอียด ภาพหน้าจอ และลิงก์`}
        />

        <div className="coll__tabs" role="tablist" aria-label="กรองตามหมวด">
          <button role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'is-on' : ''} onClick={() => choose('all')} type="button" data-cursor-label="filter">
            All <sup>{WORKS.length}</sup>
          </button>
          {CATEGORIES.map(c => (
            <button key={c.id} role="tab" aria-selected={filter === c.id} className={filter === c.id ? 'is-on' : ''} onClick={() => choose(c.id)} type="button" data-cursor-label="filter">
              {c.name} <sup>{countIn(c.id)}</sup>
            </button>
          ))}
        </div>
        <p className="coll__catdesc mono" aria-live="polite">
          {cat ? (
            <>
              <b>{cat.code}/</b> {cat.th} — {cat.desc}
            </>
          ) : (
            <>
              <b>ALL/</b> เรียงตามหมวด: {CATEGORIES.map(c => c.name).join(' · ')}
            </>
          )}
        </p>

        <div className="coll__grid" ref={gridRef}>
          {shown.map(w => (
            <article key={w.id} className="card spot" data-flip-id={w.id}>
              <button type="button" className="card__hit" onClick={() => openWorkById(w.id)} aria-label={`ดูรายละเอียด ${w.name}`} data-cursor-label="open" />
              <div className="card__visual">
                <ProjectMedia work={w} className="card__media hol" />
                {w.status && <span className="card__status mono">{w.status}</span>}
              </div>
              <div className="card__body">
                <div className="card__meta mono">
                  <span className="card__code">{w.code}</span>
                  <span>{w.category.name}</span>
                  {w.year && <span className="card__year">{w.year}</span>}
                </div>
                <h3 className="card__name">{w.name}</h3>
                <p className="card__th">{w.th}</p>
                <p className="card__desc">{w.desc}</p>
                <div className="chips">
                  {w.stack.slice(0, 3).map(s => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))}
                  {w.stack.length > 3 && <span className="chip">+{w.stack.length - 3}</span>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
