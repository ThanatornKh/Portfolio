export type CategoryId = 'fullstack' | 'data' | 'web' | 'iot' | 'game';

export interface Category {
  id: CategoryId;
  code: string;
  name: string;
  th: string;
  desc: string;
  glyph: string;
}

export interface Project {
  id: string;
  cat: CategoryId;
  name: string;
  th: string;
  desc: string;
  overview: string;
  highlights: string[];
  stack: string[];
  type: string;
  year?: string;
  images?: string[];
  links?: { label: string; url: string }[];
  featured?: boolean;
  /** บทบาทในงานกลุ่ม */
  role?: string;
  /** ข้อควรรู้ที่ต้องบอกผู้อ่านตรง ๆ */
  note?: string;
  /** สถานะสั้น ๆ เช่น ONLINE / LAN / PRIVATE (แสดงบนป้าย HUD) */
  status?: string;
  /** ตัวเลขจริงจากผลงาน — แสดงเป็นค่าที่ "สแกน" ได้บนการ์ด */
  metrics?: [string, string][];
}

export interface ProcessStep {
  verb: string;
  desc: string;
  tags: string[];
  projects: string[];
}

export interface AiAct {
  lead: string;
  word: string;
  shape: string;
  desc: string;
  projects: string[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface SkillGroup {
  key: string;
  desc: string;
  tags: string[];
}

export interface Experience {
  date: string;
  role: string;
  org: string;
  desc: string;
  chip: string;
}

/** ผลงานพร้อมรหัส/ลำดับที่คำนวณแล้ว */
export interface Work extends Project {
  no: number;
  code: string;
  category: Category;
}
