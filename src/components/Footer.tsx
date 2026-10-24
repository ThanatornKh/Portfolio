import { useRef } from 'react';
import { useTr } from '../lib/i18n';
import { CHAPTERS } from '../data/chapters';
import { CATEGORIES, PROFILE } from '../data/content';
import { gsap, reduceMotion, useGSAP } from '../lib/motion';
import { useUI } from '../lib/store';
import { go } from './Nav';
import './Footer.css';

export default function Footer() {
  const tr = useTr();
  const ref = useRef<HTMLElement>(null);
  const setFilter = useUI(s => s.setFilter);
  useGSAP(
    () => {
      if (reduceMotion) return;
      gsap.from('.footer__word span', { yPercent: 100, opacity: 0, stagger: 0.04, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.footer__word', start: 'top 95%', once: true } });
    },
    { scope: ref },
  );
  return (
    <footer className="footer" ref={ref}>
      <div className="wrap">
        <div className="footer__cols">
          <div>
            <p className="mono">Navigation</p>
            {CHAPTERS.slice(1).map(c => (
              <a key={c.id} href={`#${c.id}`} onClick={e => go(e, c.id)}>
                {c.label}
              </a>
            ))}
          </div>
          <div>
            <p className="mono">Categories</p>
            {CATEGORIES.map(c => (
              <a
                key={c.id}
                href="#collection"
                onClick={e => {
                  setFilter(c.id);
                  go(e, 'collection');
                }}
              >
                {c.name}
              </a>
            ))}
          </div>
          <div>
            <p className="mono">Contact</p>
            <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
            <a href={`tel:${PROFILE.phone.replace(/-/g, '')}`}>{PROFILE.phone}</a>
            <a href={PROFILE.github} target="_blank" rel="noopener">
              GitHub ↗
            </a>
            <a href={PROFILE.facebook} target="_blank" rel="noopener">
              Facebook ↗
            </a>
          </div>
          <div>
            <p className="mono">Built with</p>
            <span>React · Vite · TypeScript</span>
            <span>Three.js · React Three Fiber</span>
            <span>GSAP · Lenis</span>
            <span className="footer__small">{tr('ฉาก 3D และภาพปกวาดด้วยโค้ดทั้งหมด', 'All 3D scenes and cover art are drawn in code')}</span>
          </div>
        </div>
        <p className="footer__word display" aria-label="Thanatorn">
          {'THANATORN'.split('').map((ch, i) => (
            <span key={i} aria-hidden="true">
              {ch}
            </span>
          ))}
          <i aria-hidden="true">.</i>
        </p>
        <div className="footer__base mono">
          <span>
            © {tr('2569', '2026')} {PROFILE.name} · {tr('สงวนลิขสิทธิ์', 'All rights reserved')}
          </span>
          <span>vol.02 · HOLO-OS</span>
          <a href="#top" onClick={e => go(e, 'top')}>
            Back to top ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
