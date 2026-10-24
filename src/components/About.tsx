/* =========================================================
   02 · ABOUT — การ์ดโฮโลแกรม + ข้อความสว่างทีละคำ + profile.json
   ========================================================= */
import { useRef } from 'react';
import { useL } from '../data/localize';
import { gsap, reduceMotion, useGSAP } from '../lib/motion';
import SectionHead from './ui/SectionHead';
import HoloCard from './ui/HoloCard';
import ScrollWords from './ui/ScrollWords';
import './About.css';

export default function About() {
  const L = useL();
  const PROFILE = L.profile;
  const JSON_ROWS: [string, string][] = [
    ['name', PROFILE.name],
    ['role', PROFILE.role],
    ['university', PROFILE.school],
    ['faculty', PROFILE.faculty],
    ['major', PROFILE.major],
    ['year', PROFILE.year],
    ['location', PROFILE.location],
    ['status', 'open to internship'],
  ];
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (reduceMotion) return;
      gsap.from('.about__card', { y: 80, opacity: 0, rotateX: 18, duration: 1.4, scrollTrigger: { trigger: '.about__card', start: 'top 85%', once: true } });
      gsap.from('.about__json .row', { opacity: 0, x: -14, stagger: 0.05, duration: 0.8, scrollTrigger: { trigger: '.about__json', start: 'top 80%', once: true } });
      gsap.from('.about__quote', { opacity: 0, y: 40, filter: 'blur(10px)', duration: 1.2, scrollTrigger: { trigger: '.about__quote', start: 'top 85%', once: true } });
      // การ์ดเลื่อนช้ากว่าเนื้อหาเล็กน้อย (parallax)
      gsap.to('.about__card', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    },
    { scope: ref },
  );

  return (
    <section id="about" className="section about" ref={ref}>
      <div className="wrap about__grid">
        <div className="about__card">
          <HoloCard
            photo={PROFILE.photo}
            alt={PROFILE.name}
            fallback={<span className="about__mono display">TK</span>}
            footer={
              <>
                <span>
                  <b>{PROFILE.name}</b>
                  <small className="mono">Full Stack · KU IT</small>
                </span>
                <span className="mono about__id">ID · TK-2569</span>
              </>
            }
          />
        </div>

        <div className="about__body">
          <SectionHead
            id="about"
            title={
              <>
                Hello, world. <br />
                I'm <span className="grad">Thanatorn.</span>
              </>
            }
          />
          {/* key = ภาษา: แยกคำใหม่และผูกแอนิเมชันกับคำชุดใหม่ */}
          <ScrollWords key={L.lang} className="about__intro" text={PROFILE.intro} />
          <p className="lead about__goal">{PROFILE.goal}</p>

          <div className="about__json spot" aria-label={L.tr('ข้อมูลส่วนตัว', 'Profile details')}>
            <div className="about__json-bar mono">
              <i />
              <i />
              <i />
              <span>profile.json</span>
            </div>
            <pre>
              <span className="row">
                <span className="ln">1</span>
                {'{'}
              </span>
              {JSON_ROWS.map(([k, v], i) => (
                <span className="row" key={k}>
                  <span className="ln">{i + 2}</span>
                  {'  '}
                  <span className="k">"{k}"</span>: <span className="v">"{v}"</span>
                  {i < JSON_ROWS.length - 1 ? ',' : ''}
                </span>
              ))}
              <span className="row">
                <span className="ln">{JSON_ROWS.length + 2}</span>
                {'}'}
              </span>
            </pre>
          </div>

          <blockquote className="about__quote">
            “{PROFILE.quote[0]} <span className="grad">{PROFILE.quote[1]}</span>”
          </blockquote>
        </div>
      </div>
    </section>
  );
}
