/* =========================================================
   08 · CONTACT — CTA ใหญ่ + ช่องทางติดต่อ + เทอร์มินัลที่พิมพ์คำสั่งได้จริง
   ========================================================= */
import { useRef, useState, type ReactNode } from 'react';
import { CATEGORIES, PROFILE, SKILLS } from '../data/content';
import { countIn, TECHS, WORKS } from '../data/derived';
import { gsap, reduceMotion, SplitText, useGSAP } from '../lib/motion';
import { openWorkById } from '../lib/route';
import { onButtonGlow, useSpotlight } from '../lib/useSpotlight';
import './Contact.css';

type Line = { kind: 'cmd' | 'out' | 'err'; node: ReactNode };

const findWork = (q: string) => {
  const s = q.toLowerCase();
  return WORKS.find(w => w.id === s || w.code.toLowerCase() === s) ?? WORKS.find(w => w.id.includes(s) || w.name.toLowerCase().includes(s));
};

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [copied, setCopied] = useState(false);
  const history = useRef<string[]>([]);
  const hIdx = useRef(0);
  useSpotlight(cardsRef);

  const print = (more: Line[]) => {
    setLines(l => [...l, ...more]);
    requestAnimationFrame(() => outRef.current?.scrollTo({ top: outRef.current.scrollHeight }));
  };
  const out = (node: ReactNode): Line => ({ kind: 'out', node });
  const kv = (k: string, v: ReactNode) => out(
    <>
      <span className="k">{k}</span>
      {v}
    </>,
  );

  const COMMANDS: Record<string, (arg: string) => Line[]> = {
    help: () => [
      ['help', 'แสดงคำสั่งทั้งหมด'],
      ['whoami', 'ข้อมูลเจ้าของ portfolio'],
      ['ls [หมวด]', 'ดูหมวด หรือผลงานในหมวด เช่น ls fs'],
      ['open <ผลงาน>', 'เปิดรายละเอียด เช่น open bp-parking'],
      ['stack', 'เทคโนโลยีที่ใช้บ่อยที่สุด'],
      ['skills', 'กลุ่มทักษะ'],
      ['contact', 'ช่องทางติดต่อ'],
      ['hire', 'สถานะรับงาน'],
      ['clear', 'ล้างหน้าจอ'],
    ].map(([k, v]) => kv(k, v)),
    whoami: () => [out(`${PROFILE.name.toLowerCase()} — ${PROFILE.role.toLowerCase()}`), out(`${PROFILE.major} ${PROFILE.year} · ${PROFILE.school}`)],
    ls: arg => {
      if (!arg) return [...CATEGORIES.map(c => kv(`${c.code}/`, `${c.name} · ${countIn(c.id)} ผลงาน`)), out('พิมพ์ ls fs เพื่อดูผลงานในหมวด')];
      const c = CATEGORIES.find(x => x.id === arg.toLowerCase() || x.code.toLowerCase() === arg.toLowerCase().replace('/', ''));
      if (!c) return [{ kind: 'err', node: `ls: ไม่พบหมวด '${arg}' — ลอง ls` }];
      return WORKS.filter(w => w.cat === c.id).map(w =>
        kv(
          w.code,
          <button type="button" onClick={() => openWorkById(w.id)}>
            {w.name}
          </button>,
        ),
      );
    },
    open: arg => {
      if (!arg) return [{ kind: 'err', node: 'open: ต้องระบุผลงาน เช่น open fleet' }];
      const w = findWork(arg);
      if (!w) return [{ kind: 'err', node: `open: ไม่พบผลงาน '${arg}'` }];
      setTimeout(() => openWorkById(w.id), 250);
      return [out(`opening ${w.code} · ${w.name} …`)];
    },
    stack: () =>
      [...TECHS]
        .sort((a, b) => b.works.length - a.works.length)
        .slice(0, 10)
        .map(t => kv(t.name, `${'▮'.repeat(t.works.length)} ${t.works.length}`)),
    skills: () => SKILLS.map(s => kv(s.key, s.tags.join(' · '))),
    contact: () => [
      kv('email', <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>),
      kv('phone', <a href={`tel:${PROFILE.phone.replace(/-/g, '')}`}>{PROFILE.phone}</a>),
      kv('github', <a href={PROFILE.github} target="_blank" rel="noopener">github.com/ThanatornKh</a>),
    ],
    hire: () => [out('available for internship · ฝึกงาน — Full Stack / Frontend / Backend / Mobile'), out(<a href={`mailto:${PROFILE.email}`}>→ {PROFILE.email}</a>)],
    sudo: () => [{ kind: 'err', node: 'permission denied — ลอง hire แทน' }],
  };

  const run = (raw: string) => {
    const line = raw.trim();
    if (!line) return;
    history.current.push(line);
    hIdx.current = history.current.length;
    const [cmd, ...rest] = line.split(/\s+/);
    if (cmd.toLowerCase() === 'clear') return setLines([]);
    const fn = COMMANDS[cmd.toLowerCase()];
    print([{ kind: 'cmd', node: line }, ...(fn ? fn(rest.join(' ')) : [{ kind: 'err' as const, node: `command not found: ${cmd} — พิมพ์ help` }])]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    if (e.key === 'ArrowUp' && hIdx.current > 0) {
      el.value = history.current[--hIdx.current];
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      hIdx.current = Math.min(history.current.length, hIdx.current + 1);
      el.value = history.current[hIdx.current] ?? '';
      e.preventDefault();
    } else if (e.key === 'Tab' && el.value) {
      const [cmd, arg] = el.value.split(/\s+/);
      const pool = arg !== undefined ? WORKS.map(w => `${cmd} ${w.id}`) : Object.keys(COMMANDS).concat('clear');
      const hit = pool.find(c => c.startsWith(el.value) && c !== el.value);
      if (hit) {
        el.value = hit;
        e.preventDefault();
      }
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${PROFILE.email}`;
    }
  };

  useGSAP(
    () => {
      if (reduceMotion) return;
      SplitText.create('.contact__title', {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: self => gsap.from(self.lines, { yPercent: 110, stagger: 0.1, duration: 1.3, scrollTrigger: { trigger: '.contact__title', start: 'top 85%', once: true } }),
      });
      gsap.from('.contact__card', { opacity: 0, y: 30, stagger: 0.08, duration: 1, scrollTrigger: { trigger: '.contact__cards', start: 'top 85%', once: true } });
      gsap.from('.term', { opacity: 0, y: 60, rotateX: 12, duration: 1.3, scrollTrigger: { trigger: '.term', start: 'top 85%', once: true } });
    },
    { scope: ref },
  );

  return (
    <section id="contact" className="section contact" ref={ref}>
      <div className="contact__glow" aria-hidden="true" />
      <div className="wrap">
        <p className="mono contact__kicker">
          <b>08</b> Contact
        </p>
        <h2 className="contact__title display">
          Let's build <br />
          something <span className="grad">together.</span>
        </h2>
        <p className="lead contact__lead">
          กำลังมองหาโอกาสฝึกงานสาย Full Stack, Frontend, Backend หรือ Mobile — ยินดีนำเสนอผลงานเพิ่มเติมและพูดคุยรายละเอียดตามต้องการ
        </p>
        <div className="contact__cta">
          <a className="btn btn--solid" href={`mailto:${PROFILE.email}`} onPointerMove={onButtonGlow} data-cursor-label="send mail">
            ส่งอีเมล <span className="arrow">→</span>
          </a>
          <button className="btn btn--glass glass" type="button" onClick={copy} onPointerMove={onButtonGlow} data-cursor-label="copy">
            {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกอีเมล'}
          </button>
          <button className="btn btn--glass glass" type="button" onClick={() => window.print()} onPointerMove={onButtonGlow} data-cursor-label="print">
            พิมพ์ / PDF
          </button>
        </div>

        <div className="contact__grid">
          <div className="contact__cards" ref={cardsRef}>
            {[
              ['email', PROFILE.email, `mailto:${PROFILE.email}`],
              ['phone', PROFILE.phone, `tel:${PROFILE.phone.replace(/-/g, '')}`],
              ['github', 'github.com/ThanatornKh', PROFILE.github],
              ['facebook', 'Thanatorn Khwanmankong', PROFILE.facebook],
            ].map(([k, v, href]) => (
              <a key={k} className="contact__card spot" href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener" data-cursor-label={k}>
                <span className="mono">{k}</span>
                <span className="contact__val">{v}</span>
                <span className="contact__arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
            <p className="mono contact__loc">📍 {PROFILE.location}</p>
          </div>

          <div className="term" onClick={() => inRef.current?.focus()}>
            <div className="term__bar mono">
              <i />
              <i />
              <i />
              <span>zsh — ~/thanatorn</span>
            </div>
            <div className="term__out" ref={outRef} data-lenis-prevent>
              <p>
                <b>$</b> whoami
              </p>
              <p className="out">{PROFILE.name.toLowerCase()} — full stack developer</p>
              <p>
                <b>$</b> cat status.txt
              </p>
              <p className="out">
                available for <strong>internship · ฝึกงาน</strong> — พิมพ์ <strong>help</strong> เพื่อดูคำสั่ง
              </p>
              {lines.map((l, i) => (
                <p key={i} className={l.kind === 'cmd' ? '' : l.kind}>
                  {l.kind === 'cmd' ? (
                    <>
                      <b>$</b> {l.node}
                    </>
                  ) : (
                    l.node
                  )}
                </p>
              ))}
            </div>
            <form
              className="term__form"
              onSubmit={e => {
                e.preventDefault();
                run(inRef.current!.value);
                inRef.current!.value = '';
              }}
            >
              <label htmlFor="term-in" className="mono">
                $
              </label>
              <input id="term-in" ref={inRef} autoComplete="off" spellCheck={false} placeholder="help · ls · open bp-parking · stack" onKeyDown={onKey} aria-label="พิมพ์คำสั่งเทอร์มินัล" />
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
