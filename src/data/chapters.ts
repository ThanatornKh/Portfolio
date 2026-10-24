/** สารบัญของหน้า — ใช้ทั้งเมนู แถบบท และหัวข้อแต่ละบท */
export const CHAPTERS = [
  { id: 'top', no: '00', label: 'Home', path: 'home' },
  { id: 'about', no: '01', label: 'About', path: 'about' },
  { id: 'pipeline', no: '02', label: 'Data → Deploy', path: 'data-to-deploy' },
  { id: 'works', no: '03', label: 'Flagship works', path: 'flagship' },
  { id: 'hood', no: '04', label: 'Under the hood', path: 'under-the-hood' },
  { id: 'collection', no: '05', label: 'All projects', path: 'collection' },
  { id: 'stack', no: '06', label: 'Tech stack', path: 'stack' },
  { id: 'journey', no: '07', label: 'Journey', path: 'git-log' },
  { id: 'faq', no: '08', label: 'Q&A', path: 'faq' },
  { id: 'contact', no: '09', label: 'Contact', path: 'contact' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];
export const chapter = (id: ChapterId) => CHAPTERS.find(c => c.id === id)!;
