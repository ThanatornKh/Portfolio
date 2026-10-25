/* =========================================================
   HERO — "From pixels to production."
   DOM ซ้อนบน Canvas 3D · ScrollTrigger เขียน progress ให้ฉาก (sceneProgress.hero)
   intro: kicker scramble → หัวเรื่อง blur-in ทีละคำ (MotionSites pattern) → ตัวเลขนับขึ้น
   ========================================================= */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useL } from '../data/localize';
import { WORKS } from '../data/derived';
import { gsap, isNarrow, reduceMotion, ScrollTrigger, SplitText, useGSAP } from '../lib/motion';
import { sceneProgress, spins, useUI } from '../lib/store';
import { useDragRotate } from '../lib/useDragRotate';
import { hasWebGL, useInView, usePageHidden } from '../lib/useInView';
import { onButtonGlow } from '../lib/useSpotlight';
import { go } from './Nav';
import './Hero.css';

const HeroScene = lazy(() => import('../gl/HeroScene'));

const STATS = [
  { n: WORKS.length, th: 'ผลงานในพอร์ต', en: 'works in this portfolio', suffix: '' },
  { n: 4, th: 'ระบบที่ใช้งานจริง', en: 'systems in real use', suffix: '' },
  { n: 443, th: 'test cases อัตโนมัติ', en: 'automated test cases', suffix: '' },
  { n: 5.1, th: 'ล้านแถวใน data pipeline', en: 'million rows in a data pipeline', suffix: 'M', decimals: 1 },
];

export default function Hero() {
  const L = useL();
  const PROFILE = L.profile;
  const ref = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const booted = useUI(s => s.booted);
  const setHeroReady = useUI(s => s.setHeroReady);
  const [gl] = useState(() => hasWebGL());
  const inView = useInView(ref, '0px');
  const hidden = usePageHidden();
  useDragRotate(pinRef, spins.hero);

  useEffect(() => {
    if (!gl) setHeroReady();
  }, [gl, setHeroReady]);

  // เมาส์ → พารัลแลกซ์ของฉาก (canvas อยู่ใต้ข้อความ จึงฟังที่ window)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sceneProgress.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      sceneProgress.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // scroll: progress ของฉาก + ข้อความจางออก
  useGSAP(
    () => {
      if (reduceMotion) return;
      const root = ref.current!;
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: s => {
          sceneProgress.hero = s.progress;
        },
      });
      gsap
        .timeline({ scrollTrigger: { trigger: root, start: 'top top', end: '22% top', scrub: true } })
        // headline อยู่นิ่ง (ไม่เลื่อนตาม scroll) แค่จางออกเมื่อฉากถัดไปเริ่ม — ตาม scroll-film-site
        .to('.hero__copy', { opacity: 0, ease: 'none' }, 0)
        .to('.hero__stats', { opacity: 0, ease: 'none' }, 0)
        .to('.hero__hint', { opacity: 0, ease: 'none' }, 0)
        // มือถือ: ป้าย drag อยู่ล่างจอ (ที่เดียวกับตัวเลข) → ค่อยโผล่เมื่อตัวเลขจางไป
        .fromTo('.hero__spin', { opacity: isNarrow() ? 0 : 1 }, { opacity: 1, ease: 'none' }, 0);
      // คำบรรยายสองช่วง: exploded view → ฉายเป็นผลงานจริง
      const cap = (sel: string, a: string, b: string, c: string, d: string) => {
        gsap.fromTo(sel, { opacity: 0, y: 24 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: root, start: `${a} top`, end: `${b} top`, scrub: true } });
        gsap.to(sel, { opacity: 0, y: -24, ease: 'none', immediateRender: false, scrollTrigger: { trigger: root, start: `${c} top`, end: `${d} top`, scrub: true } });
      };
      cap('.hero__caption--a', '14%', '24%', '34%', '42%');
      cap('.hero__caption--b', '44%', '54%', '70%', '78%');
      gsap.to('.hero__fade', { opacity: 1, ease: 'none', scrollTrigger: { trigger: root, start: '82% top', end: 'bottom bottom', scrub: true } });
    },
    { scope: ref },
  );

  // intro หลัง preloader
  useGSAP(
    () => {
      if (!booted) return;
      const root = ref.current!;
      const counters = root.querySelectorAll<HTMLElement>('[data-count]');
      const setFinal = () =>
        counters.forEach(el => {
          el.textContent = Number(el.dataset.count).toFixed(Number(el.dataset.decimals || 0));
        });
      if (reduceMotion) return setFinal();
      const tl = gsap.timeline({ delay: 0.35 });
      tl.from('.hero__kicker', { duration: 1, scrambleText: { text: '{original}', chars: '01<>/{}#', revealDelay: 0.2 } }, 0);
      SplitText.create('.hero__title', {
        type: 'words',
        onSplit: self => tl.from(self.words, { opacity: 0, y: 40, filter: 'blur(14px)', duration: 1.3, stagger: 0.08, ease: 'expo.out' }, 0.1),
      });
      tl.from('.hero__sub', { opacity: 0, y: 20, filter: 'blur(8px)', duration: 1.1 }, 0.5)
        .from('.hero__cta > *', { opacity: 0, y: 20, stagger: 0.08, duration: 1 }, 0.65)
        .from('.hero__stats > div', { opacity: 0, y: 30, stagger: 0.07, duration: 1 }, 0.75)
        .from('.hero__hint', { opacity: 0, duration: 1 }, 1.2);
      counters.forEach((el, i) => {
        const o = { v: 0 };
        const dec = Number(el.dataset.decimals || 0);
        tl.to(o, { v: Number(el.dataset.count), duration: 1.6, ease: 'power3.out', onUpdate: () => { el.textContent = o.v.toFixed(dec); } }, 0.85 + i * 0.07);
      });
    },
    { scope: ref, dependencies: [booted] },
  );

  return (
    <section id="top" className="hero" ref={ref} aria-label={L.tr('แนะนำตัว', 'Introduction')}>
      <div className="hero__pin" ref={pinRef}>
        <p className="sr-only" id="hero-film-desc">
          {L.tr(
            'ฉาก 3 มิติ: ชิปสี่ชั้นแทน full stack (Infrastructure, Data, Logic/API, Interface) ประกอบตัวเอง แล้วแยกชั้นออกเมื่อเลื่อนลง จากนั้นชั้น Interface ฉายโฮโลแกรมหน้าจอผลงานจริง B&P Parking, Fleet Management และ FX Pipeline ลากเพื่อหมุนได้ 360 องศา',
            '3D scene: a four-layer chip standing for the full stack (Infrastructure, Data, Logic/API, Interface) assembles itself, separates as you scroll, and then the Interface layer projects holograms of real project screens — B&P Parking, Fleet Management and FX Pipeline. Drag to rotate 360 degrees.',
          )}
        </p>
        <div className="gl-layer hero__gl" role="img" aria-describedby="hero-film-desc">
          {gl ? (
            <Suspense fallback={null}>
              <HeroScene active={inView && !hidden} />
            </Suspense>
          ) : (
            <div className="hero__fallback" />
          )}
        </div>
        <div className="hero__shade" aria-hidden="true" />

        <div className="hero__inner wrap">
          <div className="hero__copy">
            {/* key = ภาษา: ScrambleText เขียนทับ text node ตอน intro ทำให้ React อัปเดตข้อความเดิมไม่ได้ */}
            <p key={L.lang} className="hero__kicker mono">{`● Portfolio — vol.02 / ${L.year('2569')}`}</p>
            <h1 className="hero__title display">
              <span className="sr-only">{PROFILE.name} — </span>
              From pixels <br />
              to <span className="grad">production.</span>
            </h1>
            <p className="hero__sub lead">
              <strong>{PROFILE.name}</strong>
              {L.tr(
                ` — Full Stack Developer จาก IT ${PROFILE.school} ที่สร้างระบบครบตั้งแต่หน้าจอจนถึงเซิร์ฟเวอร์จริง`,
                ` — a Full Stack Developer studying IT at ${PROFILE.school} who builds complete systems, from the screen to the production server.`,
              )}
            </p>
            <div className="hero__cta">
              <a href="#works" className="btn btn--solid" onClick={e => go(e, 'works')} onPointerMove={onButtonGlow} data-cursor-label="explore">
                {L.tr('ดูผลงาน', 'View work')} <span className="arrow">→</span>
              </a>
              <a href="#contact" className="btn btn--glass glass" onClick={e => go(e, 'contact')} onPointerMove={onButtonGlow} data-cursor-label="say hi">
                {L.tr('ติดต่อ', 'Contact')}
              </a>
            </div>
          </div>
          <p className="hero__caption hero__caption--a mono" aria-hidden="true">
            <b>01</b> exploded view — the stack I build · 4 layers, one system
          </p>
          <p className="hero__caption hero__caption--b mono" aria-hidden="true">
            <b>02</b> projection — shipped as real products · FS-02 · FS-04 · AI-02
          </p>
        </div>

        <dl className="hero__stats wrap">
          {STATS.map((s, i) => (
            <div key={i}>
              <dt className="mono">{L.tr(s.th, s.en)}</dt>
              <dd className="display">
                <span data-count={s.n} data-decimals={s.decimals ?? 0}>
                  {reduceMotion ? s.n : 0}
                </span>
                {s.suffix}
              </dd>
            </div>
          ))}
        </dl>
        <div className="hero__hint mono" aria-hidden="true">
          <i /> scroll to explode the stack
        </div>
        {gl && (
          <p className="spin-badge mono hero__spin" aria-hidden="true">
            <span>⟲</span> drag · 360°
          </p>
        )}
        <div className="hero__fade" aria-hidden="true" />
      </div>
    </section>
  );
}
