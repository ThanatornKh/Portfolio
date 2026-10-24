import { useEffect, useState, type RefObject } from 'react';

/** true เมื่อ element อยู่ในจอ (ใช้เปิด/ปิด frameloop ของ Canvas) */
export function useInView(ref: RefObject<Element | null>, rootMargin = '10% 0px') {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/** true เมื่อแท็บถูกซ่อน */
export function usePageHidden() {
  const [hidden, setHidden] = useState(typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return hidden;
}

/** WebGL ใช้ได้ไหม */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
