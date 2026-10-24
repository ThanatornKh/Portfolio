/* =========================================================
   02 · DATA → DEPLOY — ฉากปักหมุด อนุภาค 3D เปลี่ยนรูป 4 องก์
   ========================================================= */
import { lazy, Suspense, useRef, useState } from 'react';
import { AI_ACTS } from '../data/content';
import { getWork, pad } from '../data/derived';
import { locActs, useL } from '../data/localize';
import { isNarrow, reduceMotion, ScrollTrigger, useGSAP, gsap } from '../lib/motion';
import { openWorkById } from '../lib/route';
import { sceneProgress, spins } from '../lib/store';
import { useDragRotate } from '../lib/useDragRotate';
import { hasWebGL, useInView, usePageHidden } from '../lib/useInView';
import SectionHead from './ui/SectionHead';
import './Pipeline.css';

const PipelineScene = lazy(() => import('../gl/PipelineScene'));

export default function Pipeline() {
  const L = useL();
  const acts = locActs(L.lang);
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [act, setAct] = useState(0);
  const [gl] = useState(() => hasWebGL());
  const inView = useInView(ref, '0px');
  const hidden = usePageHidden();
  const count = useState(() => (isNarrow() ? 2600 : 6000))[0];
  useDragRotate(stageRef, spins.pipeline);

  useGSAP(
    () => {
      if (reduceMotion) return;
      const root = ref.current!;
      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: s => {
          sceneProgress.pipeline = s.progress;
          root.style.setProperty('--p', s.progress.toFixed(4));
          const a = Math.min(AI_ACTS.length - 1, Math.floor(s.progress * AI_ACTS.length));
          setAct(prev => (prev === a ? prev : a));
        },
      });
      gsap.from('.pipe__gl', { opacity: 0, scale: 0.92, duration: 1.4, scrollTrigger: { trigger: root, start: 'top 70%', once: true } });
    },
    { scope: ref },
  );

  return (
    <section id="pipeline" className={`pipe${reduceMotion ? ' pipe--static' : ''}`} ref={ref}>
      <div className="pipe__stage" ref={stageRef}>
        <p className="sr-only" id="pipe-film-desc">
          {L.tr(
            'อนุภาค 3 มิติเปลี่ยนรูปตามการเลื่อน: กลุ่มข้อมูลดิบ → เกลียว pipeline → โครงข่ายประสาทของโมเดล → ลูกโลกของระบบที่ใช้งานจริง',
            '3D particles change shape as you scroll: a cloud of raw data → a pipeline helix → the neural network of a model → a globe of systems in real use',
          )}
        </p>
        <div className="gl-layer pipe__gl" role="img" aria-describedby="pipe-film-desc">
          {gl && (
            <Suspense fallback={null}>
              <PipelineScene active={inView && !hidden} count={count} />
            </Suspense>
          )}
        </div>
        <div className="pipe__shade" aria-hidden="true" />
        <div className="wrap pipe__inner">
          <SectionHead id="pipeline" title={<>Data → <span className="grad">Deploy</span></>} />
          <div className="pipe__acts" aria-live="polite">
            {acts.map((a, i) => (
              <article key={a.word} className={`pipe__act${i === act ? ' is-on' : ''}`} aria-hidden={!reduceMotion && i !== act}>
                <p className="mono pipe__no">
                  act {pad(i + 1)} / {pad(AI_ACTS.length)}
                </p>
                <h3 className="display">
                  {a.lead} <span className="grad">{a.word}.</span>
                </h3>
                <p className="lead">{a.desc}</p>
                <div className="chips">
                  {a.projects.map(id => {
                    const w = getWork(id);
                    return w ? (
                      <button key={id} className="chip chip--accent" type="button" onClick={() => openWorkById(id)} data-cursor-label="open">
                        {w.code} · {w.name}
                      </button>
                    ) : null;
                  })}
                </div>
              </article>
            ))}
          </div>
          <ol className="pipe__steps mono" aria-hidden="true">
            {AI_ACTS.map((a, i) => (
              <li key={a.word} className={i <= act ? 'is-done' : ''}>
                <i style={{ ['--i' as string]: i }} />
                {pad(i + 1)} {a.word}
              </li>
            ))}
          </ol>
          {gl && (
            <p className="spin-badge mono pipe__spin" aria-hidden="true">
              <span>⟲</span> drag · 360°
            </p>
          )}
          <p className="pipe__meta mono" aria-hidden="true">
            three.js · webgl · <b>{AI_ACTS[act].shape}</b> · {count.toLocaleString('en-US')} pts
          </p>
        </div>
      </div>
    </section>
  );
}
