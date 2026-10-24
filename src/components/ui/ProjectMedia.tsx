import { useState } from 'react';
import type { Work } from '../../data/types';
import Blueprint from './Blueprint';

/** ภาพหลักของผลงาน — ถ้าไม่มีภาพหรือโหลดไม่ได้ แสดง blueprint แทน */
export default function ProjectMedia({ work, index = 0, className = '', eager = false }: { work: Work; index?: number; className?: string; eager?: boolean }) {
  const src = work.images?.[index];
  const [failed, setFailed] = useState(false);
  return (
    <div className={`media ${className}`}>
      {src && !failed ? (
        <img src={src} alt={`${work.name} — ภาพหน้าจอ ${index + 1}`} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />
      ) : (
        <Blueprint cat={work.cat} code={work.code} label={work.name} />
      )}
    </div>
  );
}
