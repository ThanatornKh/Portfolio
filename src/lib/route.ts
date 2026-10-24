import { useEffect } from 'react';
import { useUI } from './store';
import { getWork } from '../data/derived';

const PREFIX = '#/work/';

/** URL แบบ #/work/<id> เปิดหน้ารายละเอียดผลงาน — แชร์ลิงก์ได้ ใช้ได้บนโฮสต์ static */
export function useWorkRoute() {
  const openWork = useUI(s => s.openWork);
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash;
      const id = h.startsWith(PREFIX) ? decodeURIComponent(h.slice(PREFIX.length)) : null;
      openWork(id && getWork(id) ? id : null);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [openWork]);
}

/** เปลี่ยน URL โดยไม่เลื่อนหน้า (บาง iframe ห้าม history API จึงครอบ try ไว้) */
export function setWorkHash(id: string | null) {
  try {
    const url = id ? `${PREFIX}${encodeURIComponent(id)}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, '', url);
  } catch {
    /* sandboxed frame — ข้ามได้ */
  }
}

export function openWorkById(id: string) {
  useUI.getState().openWork(id);
  setWorkHash(id);
}
