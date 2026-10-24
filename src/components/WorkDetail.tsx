/* =========================================================
   WORK DETAIL — หน้ารายละเอียดผลงาน (overlay เต็มจอ, URL #/work/<id>)
   แกลเลอรี + ข้อมูล + บทบาท/ข้อควรรู้ + ลิงก์ · ←/→ เปลี่ยนรูป · Esc ปิด · ก่อนหน้า/ถัดไป
   ========================================================= */
import { useEffect, useRef, useState } from 'react';
import { WORKS, getWork } from '../data/derived';
import { useL } from '../data/localize';
import { gsap, lockScroll, reduceMotion } from '../lib/motion';
import { setWorkHash } from '../lib/route';
import { useUI } from '../lib/store';
import { onButtonGlow } from '../lib/useSpotlight';
import ProjectMedia from './ui/ProjectMedia';
import './WorkDetail.css';

export default function WorkDetail() {
  const openId = useUI(s => s.openId);
  const openWork = useUI(s => s.openWork);
  const L = useL();
  const base = openId ? getWork(openId) : undefined;
  const work = base && L.w(base);
  const [img, setImg] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const close = () => {
    const root = rootRef.current;
    const done = () => {
      openWork(null);
      setWorkHash(null);
    };
    if (!root || reduceMotion) return done();
    gsap.to(root, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut', onComplete: done });
  };

  const step = (d: number) => {
    if (!work) return;
    const i = WORKS.findIndex(w => w.id === work.id);
    const next = WORKS[(i + d + WORKS.length) % WORKS.length];
    openWork(next.id);
    setWorkHash(next.id);
  };

  useEffect(() => {
    setImg(0);
    rootRef.current?.querySelector('.wd__scroll')?.scrollTo({ top: 0 });
  }, [openId]);

  useEffect(() => {
    if (!work) return;
    lastFocus.current = document.activeElement as HTMLElement;
    lockScroll(true);
    closeRef.current?.focus({ preventScroll: true });
    const root = rootRef.current;
    if (root && !reduceMotion) {
      gsap.fromTo(root, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.8, ease: 'expo.inOut' });
      gsap.from(root.querySelectorAll('.wd__reveal'), { y: 40, opacity: 0, stagger: 0.06, duration: 1, delay: 0.35 });
    }
    return () => {
      lockScroll(false);
      lastFocus.current?.focus?.({ preventScroll: true });
    };
    // เปิดใหม่เฉพาะตอนเปลี่ยนจากปิด → เปิด
  }, [!!work]);

  useEffect(() => {
    if (!work) return;
    const n = work.images?.length ?? 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' && n > 1) setImg(i => (i + 1) % n);
      if (e.key === 'ArrowLeft' && n > 1) setImg(i => (i - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!work) return null;
  const images = work.images ?? [];
  const idx = WORKS.findIndex(w => w.id === work.id);

  return (
    <div className="wd" ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="wd-title">
      <div className="wd__bar wrap">
        <span className="mono">
          <b>{work.code}</b> · {String(idx + 1).padStart(2, '0')} / {WORKS.length}
        </span>
        <div className="wd__nav">
          <button type="button" className="mono" onClick={() => step(-1)} data-cursor-label="prev">
            ← prev
          </button>
          <button type="button" className="mono" onClick={() => step(1)} data-cursor-label="next">
            next →
          </button>
          <button type="button" className="wd__close" ref={closeRef} onClick={close} aria-label={L.tr('ปิดรายละเอียด', 'Close details')} data-cursor-label="close">
            <span className="mono">Close</span>
            <i aria-hidden="true">×</i>
          </button>
        </div>
      </div>

      <div className="wd__scroll" data-lenis-prevent>
        <div className="wrap wd__grid">
          <div className="wd__gallery wd__reveal">
            <ProjectMedia key={`${work.id}-${img}`} work={work} index={img} className="wd__main" eager />
            {images.length > 1 && (
              <div className="wd__thumbs" role="tablist" aria-label={L.tr('ภาพหน้าจอ', 'Screenshots')}>
                {images.map((src, i) => (
                  <button key={src} type="button" role="tab" aria-selected={i === img} className={i === img ? 'is-on' : ''} onClick={() => setImg(i)} aria-label={L.tr(`ภาพที่ ${i + 1}`, `Screenshot ${i + 1}`)}>
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            {!images.length && <p className="mono wd__noimg">{L.tr('ยังไม่มีภาพหน้าจอที่เผยแพร่ได้ — แสดงภาพปกแบบ blueprint', 'No screenshots can be published yet — showing a blueprint cover')}</p>}
          </div>

          <div className="wd__info">
            <p className="mono wd__path wd__reveal">
              ~/projects/{work.cat}/{work.id}
            </p>
            <p className="mono wd__cat wd__reveal">
              {work.category.name} — {work.category.th}
            </p>
            <h2 id="wd-title" className="display wd__title wd__reveal">
              {work.name}
            </h2>
            <p className="wd__th wd__reveal">{work.th}</p>
            <p className="wd__overview wd__reveal">{work.overview}</p>
            {work.role && (
              <p className="wd__callout wd__callout--role wd__reveal">
                <span className="mono">{L.tr('บทบาท', 'Role')}</span>
                {work.role}
              </p>
            )}
            {work.note && (
              <p className="wd__callout wd__reveal">
                <span className="mono">{L.tr('หมายเหตุ', 'Note')}</span>
                {work.note}
              </p>
            )}
            <h3 className="mono wd__h wd__reveal">Highlights</h3>
            <ul className="wd__hl wd__reveal">
              {work.highlights.map(h => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            <dl className="wd__meta wd__reveal">
              <div>
                <dt className="mono">{L.tr('ประเภท', 'Type')}</dt>
                <dd>{work.type}</dd>
              </div>
              {work.year && (
                <div>
                  <dt className="mono">{L.tr('ปี', 'Year')}</dt>
                  <dd>{work.year}</dd>
                </div>
              )}
              <div>
                <dt className="mono">{L.tr('เทคโนโลยี', 'Stack')}</dt>
                <dd className="chips">
                  {work.stack.map(s => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            {work.links && (
              <div className="wd__links wd__reveal">
                {work.links.map((l, i) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener" className={`btn ${i === 0 ? 'btn--solid' : 'btn--glass glass'}`} onPointerMove={onButtonGlow} data-cursor-label="visit ↗">
                    {l.label} <span className="arrow">↗</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
