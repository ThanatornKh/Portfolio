/* =========================================================
   NAV — แถบบน (ซ่อนเมื่อเลื่อนลง โผล่เมื่อเลื่อนขึ้น) + แถบความคืบหน้า
   + เมนูเต็มจอ + rail บอกบทด้านขวา
   ========================================================= */
import { useEffect, useRef } from 'react';
import { CHAPTERS } from '../data/chapters';
import { PROFILE } from '../data/content';
import { gsap, lockScroll, reduceMotion, scrollToTarget, ScrollTrigger, useGSAP } from '../lib/motion';
import { useUI } from '../lib/store';
import './Nav.css';

export function go(e: React.MouseEvent, id: string) {
  e.preventDefault();
  const ui = useUI.getState();
  if (ui.menuOpen) {
    ui.setMenu(false);
    lockScroll(false);
  }
  scrollToTarget(id === 'top' ? 0 : `#${id}`);
}

export default function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const menuOpen = useUI(s => s.menuOpen);
  const setMenu = useUI(s => s.setMenu);
  const chapter = useUI(s => s.chapter);
  const setChapter = useUI(s => s.setChapter);
  const booted = useUI(s => s.booted);
  const current = CHAPTERS.find(c => c.id === chapter) ?? CHAPTERS[0];

  // ซ่อน/แสดงตามทิศการเลื่อน + progress
  useGSAP(() => {
    const nav = navRef.current!;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: self => {
        if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 20);
        if (!useUI.getState().menuOpen) nav.classList.toggle('is-hidden', self.direction === 1 && y > window.innerHeight * 1.2);
      },
    });
    // บทปัจจุบัน
    CHAPTERS.forEach(c => {
      const el = document.getElementById(c.id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        // "แถบตัดสิน" ที่ 1/3 บนของจอ: บทที่กำลังเข้ามาคือบทปัจจุบัน
        start: 'top 33%',
        end: 'bottom 33%',
        onToggle: self => self.isActive && setChapter(c.id),
      });
    });
  }, []);

  // แอนิเมชันเมนูเต็มจอ (ข้ามรอบแรก ไม่งั้นจะปลดล็อกการเลื่อนระหว่าง preloader)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    lockScroll(menuOpen);
    const menu = menuRef.current;
    if (!menu) return;
    if (reduceMotion) return;
    if (menuOpen) {
      gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' });
      gsap.fromTo(menu.querySelectorAll('.menu__item'), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.04, delay: 0.25 });
    }
  }, [menuOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setMenu]);

  return (
    <>
      <header className={`nav${booted ? ' is-in' : ''}`} ref={navRef}>
        <div className="nav__inner">
          <a href="#top" className="nav__brand" onClick={e => go(e, 'top')} data-cursor-label="home" aria-label="กลับด้านบน">
            <span className="nav__mark" aria-hidden="true">TK</span>
            <span className="nav__name">Thanatorn&nbsp;K.</span>
          </a>
          <div className="nav__where mono" aria-live="polite">
            <b>{current.no}</b> ~/{current.path}
          </div>
          <nav className="nav__links" aria-label="เมนูหลัก">
            {(['works', 'stack', 'contact'] as const).map(id => (
              <a key={id} href={`#${id}`} onClick={e => go(e, id)} className="mono" aria-current={chapter === id ? 'true' : undefined}>
                {CHAPTERS.find(c => c.id === id)!.label.replace('Flagship works', 'Works')}
              </a>
            ))}
          </nav>
          <a className="nav__status mono" href={`mailto:${PROFILE.email}`} data-cursor-label="email">
            <i /> Open to internship
          </a>
          <button className="nav__menu" type="button" aria-expanded={menuOpen} aria-controls="menu" onClick={() => setMenu(!menuOpen)} data-cursor-label={menuOpen ? 'close' : 'menu'}>
            <span className="mono">{menuOpen ? 'Close' : 'Menu'}</span>
            <span className={`burger${menuOpen ? ' is-x' : ''}`} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
        <span className="nav__bar" ref={barRef} aria-hidden="true" />
      </header>

      <nav className="rail no-print" ref={railRef} aria-label="บทของหน้า">
        {CHAPTERS.map(c => (
          <a key={c.id} href={`#${c.id}`} onClick={e => go(e, c.id)} className={c.id === chapter ? 'is-active' : ''} aria-current={c.id === chapter ? 'true' : undefined} aria-label={`${c.no} ${c.label}`} data-cursor="none">
            <span className="rail__label mono">{c.label}</span>
            <span className="rail__tick" />
          </a>
        ))}
      </nav>

      {menuOpen && (
        <div
          className="menu"
          id="menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="เมนู"
          data-lenis-prevent
          onClick={e => {
            // ปิดได้ 3 ทาง: Esc, คลิกพื้นที่ว่าง, เลือกลิงก์
            if (!(e.target as Element).closest('a, button')) setMenu(false);
          }}
        >
          <div className="menu__inner wrap">
            <ol className="menu__list">
              {CHAPTERS.map(c => (
                <li key={c.id} className="menu__row">
                  <a href={`#${c.id}`} onClick={e => go(e, c.id)} className="menu__item" data-cursor-label={`go · ${c.no}`}>
                    <span className="mono">{c.no}</span>
                    <span className="display">{c.label}</span>
                  </a>
                </li>
              ))}
            </ol>
            <div className="menu__side">
              <p className="mono">Contact</p>
              <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
              <a href={`tel:${PROFILE.phone.replace(/-/g, '')}`}>{PROFILE.phone}</a>
              <a href={PROFILE.github} target="_blank" rel="noopener">GitHub ↗</a>
              <a href={PROFILE.facebook} target="_blank" rel="noopener">Facebook ↗</a>
              <p className="mono menu__loc">{PROFILE.location}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
