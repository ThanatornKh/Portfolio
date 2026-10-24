/* ย่อหน้าที่ "สว่างทีละคำ" ตามการเลื่อน — แยกคำด้วย Intl.Segmenter (ภาษาไทยไม่มีช่องว่าง) */
import { useMemo, useRef } from 'react';
import { gsap, reduceMotion, useGSAP } from '../../lib/motion';

export default function ScrollWords({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => {
    const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment: (t: string) => Iterable<{ segment: string }> } }).Segmenter;
    if (!Seg) return text.split(/(\s+)/);
    return [...new Seg('th', { granularity: 'word' }).segment(text)].map(s => s.segment);
  }, [text]);

  useGSAP(
    () => {
      if (reduceMotion) return;
      gsap.fromTo(
        ref.current!.querySelectorAll('.w'),
        { opacity: 0.14 },
        { opacity: 1, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: ref.current, start: 'top 82%', end: 'bottom 50%', scrub: true } },
      );
    },
    { scope: ref },
  );

  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((w, i) =>
        /^\s+$/.test(w) ? (
          w
        ) : (
          <span key={i} className="w" aria-hidden="true">
            {w}
          </span>
        ),
      )}
    </p>
  );
}
