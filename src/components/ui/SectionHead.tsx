/* หัวข้อบทแบบเดียวกันทั้งเว็บ: เลขบท + ชื่อ (scramble) · หัวเรื่องใหญ่ (mask reveal ทีละบรรทัด) · คำอธิบาย (blur-in) */
import { useRef, type ReactNode } from 'react';
import { chapter, type ChapterId } from '../../data/chapters';
import { useLang } from '../../lib/i18n';
import { gsap, reduceMotion, SplitText, useGSAP } from '../../lib/motion';

interface Props {
  id: ChapterId;
  title: ReactNode;
  sub?: ReactNode;
  align?: 'left' | 'center';
}

/** เปลี่ยนภาษา = mount ใหม่ เพื่อให้ SplitText แบ่งบรรทัดใหม่จากข้อความชุดใหม่ (ไม่ชนกับ DOM ที่ React คุม) */
export default function SectionHead(props: Props) {
  const lang = useLang(s => s.lang);
  return <Head key={lang} {...props} />;
}

function Head({ id, title, sub, align = 'left' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const ch = chapter(id);

  useGSAP(
    () => {
      if (reduceMotion) return;
      const root = ref.current!;
      const label = root.querySelector('.sec-head__label');
      const titleEl = root.querySelector('.sec-head__title');
      const subEl = root.querySelector('.sec-head__sub');
      const st = { trigger: root, start: 'top 82%', once: true };
      const tl = gsap.timeline({ scrollTrigger: st });
      if (label) tl.from(label, { duration: 0.8, scrambleText: { text: '{original}', chars: '01<>/{}[]#', revealDelay: 0.15, speed: 0.6 } }, 0);
      tl.from(root.querySelector('.sec-head__meta i'), { scaleX: 0, transformOrigin: 'left', duration: 1 }, 0.1);
      if (subEl) tl.from(subEl, { opacity: 0, y: 24, filter: 'blur(10px)', duration: 1.1 }, 0.35);
      // autoSplit แบ่งบรรทัดใหม่เมื่อฟอนต์โหลด/ความกว้างเปลี่ยน → ต้องคืน tween ของตัวเองจาก onSplit
      // (ถ้าใส่ใน timeline ที่เล่นจบไปแล้ว บรรทัดใหม่จะค้างอยู่ใต้ mask)
      if (titleEl) {
        SplitText.create(titleEl, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: self => gsap.from(self.lines, { yPercent: 110, duration: 1.2, stagger: 0.08, delay: 0.1, scrollTrigger: { ...st } }),
        });
      }
    },
    { scope: ref },
  );

  return (
    <div className={`sec-head sec-head--${align}`} ref={ref}>
      <div className="sec-head__meta mono">
        <b>{ch.no}</b>
        <span className="sec-head__label">{ch.label}</span>
        <i />
      </div>
      <h2 className="sec-head__title display">{title}</h2>
      {sub && <p className="sec-head__sub lead">{sub}</p>}
    </div>
  );
}
