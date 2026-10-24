/* =========================================================
   CONTENT — แก้ไข / เพิ่มผลงาน ทักษะ และประสบการณ์ได้ที่ไฟล์นี้
   รูปในโปรเจกต์ใส่ไว้ที่ public/projects/ แล้วอ้างด้วย asset('projects/ชื่อไฟล์')
   ========================================================= */
import type { AiAct, Category, Experience, Faq, ProcessStep, Project, SkillGroup } from './types';

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const PROFILE = {
  name: 'Thanatorn Khwanmankong',
  role: 'Full Stack Developer',
  school: 'มหาวิทยาลัยเกษตรศาสตร์',
  faculty: 'คณะศิลปศาสตร์และวิทยาศาสตร์',
  major: 'เทคโนโลยีสารสนเทศ',
  year: 'ปีที่ 4 · ปีการศึกษา 2569',
  location: 'กรุงเทพมหานคร',
  email: 'Qwanmankong@gmail.com',
  phone: '061-603-4862',
  github: 'https://github.com/ThanatornKh',
  facebook: 'https://www.facebook.com/tanatorn.qwanmankong?locale=th_TH',
  photo: 'https://i.ibb.co/pjhgCmzb/9613.jpg',
  quote: ['ทำปัจจุบันให้ดี —', 'แล้วจะมีอนาคต'],
  intro: 'ฉันเป็นนักศึกษาสาขาเทคโนโลยีสารสนเทศที่หลงใหลในการพัฒนาซอฟต์แวร์แบบครบวงจร มีความสามารถทั้งฝั่ง Frontend และ Backend สามารถสร้างระบบที่ใช้งานได้จริงตั้งแต่ UI ไปจนถึง Database',
  goal: 'ต้องการหาประสบการณ์ฝึกงาน เพื่อพัฒนาทักษะ และเติบโตในสายงาน Full Stack Development ได้เรียนรู้จากการทำงานจริง ร่วมงานกับทีมที่มีความกระตือรือร้น และมีโอกาสได้สร้างผลงานในอนาคต',
};

/* หมวดหมู่ผลงาน (ลำดับในอาร์เรย์ = ลำดับที่แสดงบนเว็บ) */
export const CATEGORIES: Category[] = [
  {
    id: 'fullstack',
    code: 'FS',
    name: 'Full Stack & Mobile',
    th: 'ระบบครบวงจร เว็บ + แอป + backend',
    desc: 'Next.js · React · Expo · Node.js · PostgreSQL · Docker — ระบบที่ออนไลน์และใช้งานได้จริง',
    glyph: 'fullstack',
  },
  {
    id: 'data',
    code: 'AI',
    name: 'Data & AI',
    th: 'วิศวกรรมข้อมูล BI และปัญญาประดิษฐ์',
    desc: 'Python · Airflow · DuckDB · Power BI · Machine Learning',
    glyph: 'data',
  },
  {
    id: 'web',
    code: 'WB',
    name: 'Web & Firebase',
    th: 'เว็บไซต์และระบบบน Firebase',
    desc: 'HTML · CSS · JavaScript · Firebase Auth · Cloud Firestore',
    glyph: 'web',
  },
  {
    id: 'iot',
    code: 'IO',
    name: 'IoT & Embedded',
    th: 'อุปกรณ์ IoT และระบบสมองกลฝังตัว',
    desc: 'ESP32 · C++ · MQTT · NETPIE',
    glyph: 'iot',
  },
  {
    id: 'game',
    code: 'GM',
    name: 'Game & 3D',
    th: 'เกมและงานสามมิติ',
    desc: 'Unity · 3D Modeling',
    glyph: 'game',
  },
];

/* ผลงานทั้งหมด (ตาม PORTFOLIO.md + งานจากเว็บเวอร์ชันแรก)
   - images: ใส่ URL รูปได้หลายรูป (ไม่มีรูป = ระบบวาดภาพปกแบบ blueprint ให้อัตโนมัติ)
   - featured: true = แสดงในบทผลงานเด่น
   - role: บทบาทในงานกลุ่ม · note: ข้อควรรู้ที่ต้องบอกผู้อ่านตรง ๆ */
export const PROJECTS: Project[] = [
  /* ---------- FULL STACK & MOBILE ---------- */
  {
    id: 'fixstatuscar',
    cat: 'fullstack',
    name: 'FixStatusCar',
    th: 'ระบบแจ้งซ่อมรถยนต์ (Final 498)',
    desc: 'ระบบติดตามงานซ่อมรถสำหรับอู่ — เว็บพนักงาน + แอป Android ลูกค้า จ่ายเงินด้วย PromptPay QR และเทสต์อัตโนมัติ 115 เคส',
    overview: 'ระบบติดตามงานซ่อมรถสำหรับอู่ เว็บพนักงาน (ช่าง/ผู้ดูแล) ใช้รับรถ ตรวจสภาพ ออกใบเสนอราคา ซ่อม รับเงิน และส่งมอบ ส่วนแอป Android ให้ลูกค้าแจ้งซ่อม ติดตามสถานะ อนุมัติรายการ จ่ายเงินด้วย QR พร้อมเพย์ แนบสลิป และเคลมประกัน วิชาปัญหาพิเศษ 02739498 มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน ออนไลน์ใช้งานจริง',
    highlights: [
      '3 บทบาท (ลูกค้า / ช่าง / ผู้ดูแล) ครอบคลุมวงจร แจ้งซ่อม → เสนอราคา → อนุมัติ → ซ่อม + อัปโหลดรูป → ชำระเงิน → ส่งมอบ',
      'ชำระเงินด้วย PromptPay QR + ตรวจสลิป แจ้งเตือนเงินเข้าทาง LINE',
      'เก็บรูปงานซ่อม/สลิปใน MinIO · worker ทำงานตามเวลา · MFA สำหรับพนักงาน',
      'CI/CD: GitHub Actions → GHCR → VPS พร้อมสคริปต์ setup-vps.sh และ change-domain.sh',
      'QA: Robot Framework 115 เคส (UI + API) · E2E วงจรงานซ่อมผ่าน API จริง · SonarQube Quality Gate ผ่าน',
      'ไล่แก้บั๊กจริงที่เจอจากการทดสอบ เช่น rate limit จากช่องค้นหา, token ยังใช้ได้หลัง logout, CSP บล็อกรูป',
    ],
    stack: ['Node.js', 'Express', 'Prisma', 'Zod', 'Next.js', 'React', 'Tailwind CSS', 'Expo', 'React Native', 'PostgreSQL', 'Redis', 'MinIO', 'Docker', 'GitHub Actions', 'Nginx', 'Vitest', 'Robot Framework', 'Playwright', 'SonarQube'],
    type: 'Final Project · Full Stack + Mobile + QA',
    status: 'ONLINE',
    metrics: [['Robot tests', '115'], ['Roles', '3'], ['Pipeline', 'CI/CD → VPS']],
    year: '2569',
    role: 'งานคู่ — รับผิดชอบฝั่ง Mobile App ของลูกค้า (Expo / React Native)',
    links: [
      { label: 'เปิดระบบจริง', url: 'https://fixstatuscar.duckdns.org' },
      { label: 'ดูซอร์สโค้ด', url: 'https://github.com/ExDevilish/fixstatuscar' },
    ],
    featured: true,
  },
  {
    id: 'bp-parking',
    cat: 'fullstack',
    name: 'B&P Parking',
    th: 'ระบบบริหารที่จอดรถอาคาร 4 ชั้น (Project 499)',
    desc: 'เว็บแอดมิน/เจ้าหน้าที่ + แอป Android ลูกค้า — ที่ว่างเรียลไทม์ จ่ายพร้อมเพย์ เทสต์ 328 เคส coverage 99.2%',
    overview: 'ระบบบริหารที่จอดรถครบวงจร เว็บสำหรับแอดมินและเจ้าหน้าที่ (ตู้รับบัตร, ป้อมขาเข้า, ตู้ขาออกแบบสแกน, แดชบอร์ด, การเงิน) และแอป Android สำหรับลูกค้า (ดูที่ว่าง, สแกนรับบัตร, จ่ายพร้อมเพย์, แสดง QR ออก) สร้างด้วย Next.js 16 App Router + Server Actions, PostgreSQL, Redis และ Expo ออนไลน์ใช้งานจริง',
    highlights: [
      'RBAC 4 บทบาท ตรวจสิทธิ์ 2 ชั้นทั้งที่ proxy และ server action · CSP + security headers · บังคับ logout ทันทีด้วย sessionVersion',
      'จองช่องจอดกัน race condition ด้วย FOR UPDATE SKIP LOCKED',
      'Payment webhook แบบ idempotent (Redis) + ตรวจลายเซ็น HMAC + ตรวจยอดซ้ำฝั่งเซิร์ฟเวอร์',
      'Fee engine แบบ pure function · ticket state machine · ที่ว่างเรียลไทม์ผ่าน Server-Sent Events',
      'โมดูลการเงิน: รายรับรายวัน/เดือน/ปี แยก VAT 7% export Excel และใบกำกับภาษี',
      'PDPA: worker ปิดบังทะเบียนรถของตั๋วที่เก่ากว่า 90 วัน',
      'เทสต์ 328 เคส coverage 99.2% · SonarQube 77 ปัญหา → 0 · Robot Framework 7 ชุด',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'Redis', 'Auth.js', 'Zod', 'Server-Sent Events', 'Expo', 'React Native', 'Docker', 'Cloudflare Tunnel', 'Nginx', 'Vitest', 'Robot Framework', 'SonarQube'],
    type: 'Project 499 · Full Stack + Mobile',
    status: 'ONLINE',
    metrics: [['Tests', '328'], ['Coverage', '99.2%'], ['Sonar issues', '77 → 0']],
    year: '2569',
    note: 'ระบบชำระเงินในเดโม่ใช้ผู้ให้บริการจำลอง (Mock) ยังไม่ได้ต่อ payment gateway จริง',
    images: [
      asset('projects/bp-dashboard.jpg'),
      asset('projects/bp-slots.jpg'),
      asset('projects/bp-ticket.jpg'),
      asset('projects/bp-login.jpg'),
      asset('projects/bp-kiosk.jpg'),
    ],
    links: [
      { label: 'เปิดระบบจริง', url: 'https://bpparking.duckdns.org' },
      { label: 'ดูซอร์สโค้ด', url: 'https://github.com/ThanatornKh/bp-parking' },
    ],
    featured: true,
  },
  {
    id: 'rxv-housekeeping',
    cat: 'fullstack',
    name: 'RXV Wellness Village',
    th: 'ระบบข้อมูลแผนกแม่บ้านโรงแรม (Housekeeping)',
    desc: 'ระบบที่ใช้งานจริงในองค์กร แทนแบบฟอร์ม Excel/กระดาษ — 9 แบบฟอร์ม, REST API 24 endpoint, หน้าวิเคราะห์ข้อมูล',
    overview: 'ระบบบันทึกและวิเคราะห์ข้อมูลของแผนกแม่บ้านโรงแรม แทนแบบฟอร์ม Excel และกระดาษเดิม ใช้ได้ทั้งบนคอมพิวเตอร์และมือถือในเครือข่ายเดียวกัน ทุกเครื่องเห็นข้อมูลชุดเดียวกันผ่านเซิร์ฟเวอร์กลาง',
    highlights: [
      'แบบฟอร์ม/รายงาน 9 ชุด เช่น Housekeeping Daily Report, Room Attendant, Linen Inventory, Minibar Inventory',
      'หน้าเวอร์ชันมือถือแยกสำหรับพนักงานหน้างาน',
      'REST API 24 endpoint: sync สถานะ, archive CSV/XLSX, ยอดยกมาข้ามเดือน, snapshot, analytics',
      'หน้าวิเคราะห์ข้อมูล: timeline กิจกรรม, สรุปผ้า, สต็อก และแจ้งเตือนของ minibar ใกล้หมดอายุ',
      'Archive เป็น CSV อัตโนมัติทุกเที่ยงคืน + ส่งออก .xlsx · รองรับ 40+ ภาษา',
      'สคริปต์ Python นำเข้าข้อมูลเก่าจาก Excel 7 ไฟล์ · start.bat ดับเบิลคลิกเดียวเปิดเซิร์ฟเวอร์',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express', 'SQLite', 'Python', 'openpyxl'],
    type: 'ระบบใช้งานจริงในองค์กร',
    status: 'IN USE · LAN',
    metrics: [['Forms', '9'], ['API endpoints', '24'], ['Languages', '40+']],
    note: 'เป็นระบบภายในเครือข่าย LAN ของบริษัท — repo เป็น private จึงไม่มีภาพหน้าจอที่มีข้อมูลจริง',
    featured: true,
  },
  {
    id: 'fleet-management',
    cat: 'fullstack',
    name: 'Fleet Management Platform',
    th: 'ระบบจัดการยานพาหนะโลจิสติกส์',
    desc: 'แดชบอร์ดเรียลไทม์ ติดตามเที่ยววิ่งและ checkpoint วางแผนซ่อมบำรุง และ Alert Engine แบบ pluggable',
    overview: 'แพลตฟอร์มจัดการรถขนส่งสำหรับบริษัทโลจิสติกส์ มีแดชบอร์ด ติดตามเที่ยววิ่งและ checkpoint วางแผนซ่อมบำรุง และระบบแจ้งเตือนอัตโนมัติ ทำเป็นข้อสอบคัดเลือกสหกิจศึกษาตำแหน่ง Software Developer พร้อม README อธิบายเหตุผลการเลือกเทคโนโลยีและ trade-off',
    highlights: [
      '10 หน้า: Dashboard, Vehicles, Drivers, Trips, Maintenance, Audit Log และอื่น ๆ',
      'JWT access token 15 นาที + refresh token 7 วัน ต่ออายุอัตโนมัติด้วย Axios interceptor',
      'Role-based access (ADMIN / DISPATCHER)',
      'Alert Engine แบบ pluggable — เพิ่มกฎผ่าน registerRule() มี 5 กฎ เช่น ซ่อมบำรุงเลยกำหนด ใบขับขี่ใกล้หมดอายุ',
      'Audit Log แบบ append-only ผ่าน middleware',
      'Nginx reverse proxy รวม front + back ไว้ที่ port 80 · เอกสาร API แบบ OpenAPI',
    ],
    stack: ['React', 'Vite', 'Tailwind CSS', 'Recharts', 'Node.js', 'Express', 'MySQL', 'Sequelize', 'JWT', 'Docker', 'Nginx', 'OpenAPI'],
    type: 'ข้อสอบคัดเลือกสหกิจศึกษา',
    status: 'DOCKER · DEMO',
    metrics: [['Pages', '10'], ['Alert rules', '5'], ['Token TTL', '15m / 7d']],
    year: '2569',
    images: [
      asset('projects/fleet-dashboard.jpg'),
      asset('projects/fleet-trip.jpg'),
      asset('projects/fleet-maintenance.jpg'),
      asset('projects/fleet-vehicles.jpg'),
    ],
    links: [{ label: 'ดูซอร์สโค้ด', url: 'https://github.com/ThanatornKh/Software_Developer_Coop_Sections_Exam' }],
    featured: true,
  },
  {
    id: 'hypercar-sales',
    cat: 'fullstack',
    name: 'HyperCar Sales',
    th: 'เว็บขายรถซูเปอร์คาร์ Full Stack',
    desc: 'สมัคร/เข้าสู่ระบบ ดูรถ สั่งซื้อ ติดตามออเดอร์ และหน้าแอดมินจัดการสต็อก — React + Node.js/Express REST API',
    overview: 'เว็บขายรถ HyperCar แบบ Full Stack ผู้ใช้สมัครและเข้าสู่ระบบ ดูรถ สั่งซื้อ ติดตามคำสั่งซื้อ และมีหน้าแอดมินจัดการสต็อกรถ อัปโหลดรูป อัปเดตสถานะออเดอร์ พร้อมแดชบอร์ดสถิติ',
    highlights: [
      'REST API: Auth, Cars (CRUD + อัปโหลดรูปด้วย Multer), Orders, Dashboard stats',
      'แยกสิทธิ์ผู้ใช้/แอดมินด้วย middleware authenticateToken + isAdmin',
      'Redis cache ข้อมูลรถ และ seed script สร้างข้อมูลตัวอย่าง',
      'Bruno collection สำหรับทดสอบ API ทุก endpoint',
      'หน้า Frontend: Home, Cars, Car Detail, Orders, Admin, Login, Register',
    ],
    stack: ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'MySQL', 'Redis', 'JWT', 'Docker', 'Bruno'],
    type: 'Full Stack Web Application',
    status: 'LOCAL',
    metrics: [['Pages', '7'], ['Cache', 'Redis']],
    year: '2569',
    images: [
      'https://i.ibb.co/Q7cxnZp2/car-new-project.png',
      asset('projects/hypercar-pgadmin.jpg'),
    ],
  },

  /* ---------- DATA & AI ---------- */
  {
    id: 'thai-it-jobs',
    cat: 'data',
    name: 'Thai IT Jobs 2014–2026',
    th: 'ตลาดแรงงานไอทีไทย — Big Data + Power BI',
    desc: 'Pipeline เก็บและวิเคราะห์ประกาศงานไอทีไทยย้อนหลัง 13 ปี จาก 10 แหล่ง รวม 2,213,972 แถว พร้อม NLP, ML และ Power BI',
    overview: 'Pipeline เก็บและวิเคราะห์ประกาศงานไอทีไทยย้อนหลัง 13 ปี จาก 10 แหล่ง รวม 2,213,972 แถว ทำความสะอาดข้อมูล จัดหมวดด้วย NLP ภาษาไทย สร้างโมเดล ML แล้วแสดงผลบน Power BI และเว็บแดชบอร์ด',
    highlights: [
      'Crawler รายวัน (ตีสอง) จาก JobThai, JobTopGun, JobPub, JobsDB, InternTH ฯลฯ + Common Crawl + data.go.th',
      'เคารพ robots.txt และตัดข้อมูลติดต่อบุคคล (PII) ออกก่อนเก็บ',
      'จัดหมวดจังหวัด/ประเภทงานด้วย PyThaiNLP และโมเดล LightGBM',
      'เก็บข้อมูลด้วย DuckDB + Parquet · จัดลำดับงานด้วย Airflow และ Spark',
      'รายงาน Power BI 5 หน้า + เว็บแดชบอร์ด · pytest 119 เทสต์',
    ],
    stack: ['Python', 'DuckDB', 'Parquet', 'pandas', 'PyThaiNLP', 'LightGBM', 'FastAPI', 'Apache Airflow', 'Apache Spark', 'Docker', 'Power BI', 'pytest'],
    type: 'Data Engineering / BI',
    status: 'PRIVATE DATA',
    metrics: [['Rows', '2,213,972'], ['Sources', '10'], ['Tests', '119']],
    year: '2569',
    note: 'repo เป็น private และข้อมูลห้ามเผยแพร่ — แสดงเฉพาะภาพรวมและตัวเลขสรุป',
    featured: true,
  },
  {
    id: 'fx-multi-source-pipeline',
    cat: 'data',
    name: 'FX Multi-Source Pipeline',
    th: 'ไปป์ไลน์อัตราแลกเปลี่ยนเงินบาทจาก 3 แหล่ง',
    desc: 'รวมอัตราแลกเปลี่ยน THB กับ JPY · USD · EUR · KRW ย้อนหลัง 6 ปี จาก 3 แหล่ง ด้วย Airflow + PostgreSQL + Streamlit',
    overview: 'ข้อสอบปลายภาควิชา 02739452 แพลตฟอร์มข้อมูลขนาดใหญ่และการวิเคราะห์ รวบรวมอัตราแลกเปลี่ยนเงินบาทเทียบ JPY / USD / EUR / KRW รายวันย้อนหลัง 6 ปี จาก Frankfurter (ECB), Yahoo Finance และ x-rates.com รวมและตัดซ้ำเหลือราว 6,200 แถว ตรวจคุณภาพก่อน publish แล้วแสดงบน Streamlit dashboard',
    highlights: [
      'แต่ละแหล่งอยู่ใน TaskGroup รันขนานกัน · scrape รายวันด้วย Dynamic Task Mapping',
      'merge_dedup ใช้ trigger_rule=all_done — แหล่งไหนล่มก็ยังรวมจากแหล่งที่เหลือได้',
      'UPSERT รันซ้ำแล้วจำนวนแถวไม่เพิ่ม · ใช้ค่ามัธยฐานข้ามแหล่ง + เก็บ spread_pct',
      'quality_check ตรวจ 5 ข้อ แล้วแยกไป publish หรือ quarantine',
      'Dashboard 3 หน้า: KPI + กราฟ + ดาวน์โหลด CSV, สรุปวันนี้, Pipeline Status',
    ],
    stack: ['Python', 'Apache Airflow', 'PostgreSQL', 'Streamlit', 'BeautifulSoup', 'Docker'],
    type: 'ข้อสอบปลายภาค',
    status: 'DOCKER',
    metrics: [['Rows', '~6,200'], ['Sources', '3'], ['Quality checks', '5']],
    year: '2569',
    images: [
      asset('projects/fx-dashboard.jpg'),
      asset('projects/fx-dag.jpg'),
      asset('projects/fx-today.jpg'),
      asset('projects/fx-status.jpg'),
    ],
    links: [{ label: 'ดูซอร์สโค้ด', url: 'https://github.com/ThanatornKh/02739452-15-6621653778' }],
  },
  {
    id: 'tomato-leaf-disease',
    cat: 'data',
    name: 'Tomato Leaf Disease Detection',
    th: 'ตรวจหาโรคในใบมะเขือเทศด้วย AI',
    desc: 'เทรนโมเดล AI ด้วย Python เพื่อตรวจหาโรคในใบมะเขือเทศจากรูปภาพ',
    overview: 'การเทรนโมเดล AI ด้วย Python เพื่อจำแนกโรคในใบมะเขือเทศจากรูปภาพ (Detection of Diseases in Tomato Leaves) พร้อมเอกสารสรุปผล',
    highlights: [
      'เตรียมชุดข้อมูลรูปภาพใบมะเขือเทศ',
      'เทรนโมเดลจำแนกโรคด้วย Python',
      'สรุปผลในรูปแบบเอกสารรายงาน',
    ],
    stack: ['Python', 'Machine Learning'],
    type: 'AI Project',
    status: 'REPORT',
    metrics: [['Task', 'Image classification']],
    year: '2568',
    images: [asset('projects/tomato-ai.jpg')],
    links: [{ label: 'ดูเอกสาร', url: 'https://drive.google.com/file/d/1oLcsiPh3tTIaNIxgWfoCaf2vIuGOyBbj/view?usp=drive_link' }],
  },

  /* ---------- WEB & FIREBASE ---------- */
  {
    id: 'devilish-hypercars',
    cat: 'web',
    name: 'DEVILISH | HyperCar',
    th: 'ร้านค้าขายรถยนต์ออนไลน์',
    desc: 'ระบบร้านค้าขายรถยนต์ออนไลน์ครบวงจร Frontend + Backend พร้อมระบบจัดการสินค้า',
    overview: 'เว็บร้านค้าขายรถยนต์ HyperCar ออนไลน์แบบครบวงจรทั้ง Frontend และ Backend พร้อมระบบจัดการสินค้า เปิดใช้งานจริงบน Firebase Hosting',
    highlights: [
      'หน้าร้านแสดงรถแต่ละรุ่น',
      'ระบบจัดการสินค้าฝั่งหลังบ้าน',
      'เปิดใช้งานจริงบน Firebase Hosting',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Firebase'],
    type: 'Web Application',
    status: 'ONLINE',
    metrics: [['Hosting', 'Firebase']],
    year: '2569',
    images: [asset('projects/devilish-hero.jpg')],
    links: [{ label: 'เปิดเว็บไซต์', url: 'https://devilish-car.web.app/' }],
  },
  {
    id: 'sa-schedule-system',
    cat: 'web',
    name: 'Schedule System',
    th: 'ระบบจัดตารางเรียน (Firebase Auth)',
    desc: 'ระบบจัดตารางเรียนพร้อมระบบสมาชิก สมัคร/เข้าสู่ระบบ เปลี่ยนรหัสผ่าน แก้ไขโปรไฟล์ เก็บข้อมูลบน Firestore',
    overview: 'ระบบจัดตารางเรียนพร้อมระบบสมาชิก ผู้ใช้สมัคร เข้าสู่ระบบ เปลี่ยนรหัสผ่าน และแก้ไขโปรไฟล์ได้ ข้อมูลเก็บบน Cloud Firestore เป็นงานวิชา System Analysis',
    highlights: [
      'สมัคร / เข้าสู่ระบบ / เปลี่ยนรหัสผ่าน ด้วย Firebase Authentication',
      'แก้ไขโปรไฟล์และจัดตารางเรียน',
      'เก็บข้อมูลบน Cloud Firestore',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Firebase Auth', 'Cloud Firestore'],
    type: 'งานวิชา System Analysis',
    status: 'COURSE',
    metrics: [['Auth', 'Firebase']],
  },
  {
    id: 'sa-activity-planner',
    cat: 'web',
    name: 'Activity Planner',
    th: 'ระบบวางแผนกิจกรรม (Firebase)',
    desc: 'เข้าสู่ระบบด้วย Google, ปฏิทินกิจกรรมรายเดือน, หน้าจัดการกิจกรรม และหน้าการแจ้งเตือน',
    overview: 'ระบบวางแผนกิจกรรม มีหน้าเข้าสู่ระบบที่รองรับบัญชี Google ปฏิทินกิจกรรมรายเดือน หน้าจัดการกิจกรรม และหน้าการแจ้งเตือน เป็นงานวิชา System Analysis',
    highlights: [
      'เข้าสู่ระบบด้วย Firebase Authentication (รองรับ Google)',
      'ปฏิทินกิจกรรมรายเดือน',
      'หน้าจัดการกิจกรรมและหน้าการแจ้งเตือน',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Firebase Auth', 'Cloud Firestore'],
    type: 'งานวิชา System Analysis',
    status: 'COURSE',
    metrics: [['Login', 'Google']],
  },

  /* ---------- IOT & EMBEDDED ---------- */
  {
    id: 'smart-home-monitor',
    cat: 'iot',
    name: 'Smart Home: Smoke + DHT Monitor',
    th: 'ระบบตรวจจับควันและความร้อนในบ้าน',
    desc: 'ESP32 วัดอุณหภูมิ/ความชื้นและควัน เกินค่าที่ตั้งไว้สั่งพัดลม buzzer และไฟเตือน ควบคุมผ่าน NETPIE',
    overview: 'ระบบเฝ้าระวังในบ้านบน ESP32 วัดอุณหภูมิและความชื้น (DHT11) และควัน (MQ-2) ถ้าเกินค่าที่ตั้งไว้จะสั่งพัดลม 2 ตัวระบายความร้อนและดูดควันออก พร้อม buzzer และไฟ RGB เตือน ส่งข้อมูลขึ้น NETPIE Shadow และรับคำสั่งควบคุมจากคลาวด์ผ่าน MQTT รันบนบอร์ดจริงได้',
    highlights: [
      'วัดอุณหภูมิ/ความชื้นด้วย DHT11 และควันด้วย MQ-2',
      'เกินค่าที่ตั้ง → พัดลม 2 ตัว + buzzer + ไฟ RGB ทำงานอัตโนมัติ',
      'ส่งข้อมูลขึ้น NETPIE Shadow และรับคำสั่งผ่าน MQTT',
      'ตั้งค่าและติดตามผ่าน Application',
    ],
    stack: ['C++', 'ESP32', 'PlatformIO', 'Arduino', 'MQTT', 'NETPIE', 'DHT11', 'MQ-2'],
    type: 'Embedded / IoT',
    status: 'HARDWARE',
    metrics: [['Sensors', 'DHT11 · MQ-2'], ['Protocol', 'MQTT']],
    year: '2569',
    images: [asset('projects/smart-home-box.jpg')],
  },

  /* ---------- GAME & 3D ---------- */
  {
    id: 'monkey-adventure',
    cat: 'game',
    name: 'Monkey Adventure',
    th: 'เกมผจญภัยของลิงเก็บผลไม้',
    desc: 'เกมผจญภัยของลิงตัวหนึ่งที่ต้องเก็บผลไม้ทำแต้มเพื่อผ่านด่าน',
    overview: 'เกมผจญภัยของลิงตัวหนึ่งที่ต้องเก็บผลไม้ทำแต้มเพื่อผ่านด่าน ปั้นโมเดลและพัฒนาเกมด้วย Unity',
    highlights: [
      'ปั้นโมเดลตัวละครและฉาก',
      'ระบบเก็บผลไม้ทำแต้ม',
      'ระบบผ่านด่าน',
    ],
    stack: ['Unity', '3D Modeling'],
    type: 'Game',
    status: 'PLAYABLE',
    metrics: [['Engine', 'Unity']],
    year: '2567',
    images: [asset('projects/monkey-game.jpg')],
  },
];

/* วิธีทำงาน (projects = id ของผลงานที่เป็นตัวอย่าง) */
export const PROCESS: ProcessStep[] = [
  {
    verb: 'design',
    desc: 'วิเคราะห์โจทย์และออกแบบระบบก่อนลงมือเขียน — UML, โครงหน้าจอ, ข้อมูล และ flow การใช้งาน',
    tags: ['System Analysis', 'UML', 'Database Design', 'UI Flow'],
    projects: ['bp-parking', 'sa-schedule-system'],
  },
  {
    verb: 'build',
    desc: 'พัฒนาได้ทั้งเว็บ แอปมือถือ และ backend ตั้งแต่ UI ไปจนถึง Database รวมถึงงาน IoT และงานข้อมูล',
    tags: ['Next.js', 'React', 'Expo', 'Node.js', 'PostgreSQL', 'ESP32'],
    projects: ['fixstatuscar', 'fleet-management'],
  },
  {
    verb: 'test',
    desc: 'เขียนเทสต์และตรวจคุณภาพโค้ดจริงจัง — unit test, Robot Framework E2E และ SonarQube จนผ่าน Quality Gate',
    tags: ['Vitest', 'Robot Framework', 'Playwright', 'SonarQube', 'pytest'],
    projects: ['bp-parking', 'fixstatuscar'],
  },
  {
    verb: 'ship',
    desc: 'รันระบบด้วย Docker วาง CI/CD แล้ว deploy ขึ้น VPS หลัง Nginx + HTTPS ให้ใช้งานได้จริง',
    tags: ['Docker', 'GitHub Actions', 'VPS', 'Nginx', 'Cloudflare Tunnel'],
    projects: ['fixstatuscar', 'bp-parking'],
  },
];

/* บท 3D "From data to deploy" — อนุภาคเปลี่ยนรูปตามการเลื่อน */
export const AI_ACTS: AiAct[] = [
  {
    lead: 'Collect the',
    word: 'signal',
    shape: 'signal.cloud',
    desc: 'เก็บข้อมูลจากหลายแหล่ง — crawler ประกาศงาน 10 แหล่ง, API อัตราแลกเปลี่ยน และเซนเซอร์บนบอร์ด ESP32',
    projects: ['thai-it-jobs', 'fx-multi-source-pipeline', 'smart-home-monitor'],
  },
  {
    lead: 'Clean the',
    word: 'pipeline',
    shape: 'etl.helix',
    desc: 'จัดลำดับงานด้วย Apache Airflow — รวมข้อมูล ตัดซ้ำ ผ่าน quality gate ก่อน publish (2.2 ล้านแถวใน Thai IT Jobs)',
    projects: ['thai-it-jobs', 'fx-multi-source-pipeline'],
  },
  {
    lead: 'Teach the',
    word: 'model',
    shape: 'cnn.layers',
    desc: 'NLP ภาษาไทยด้วย PyThaiNLP, โมเดล LightGBM และโมเดลจำแนกโรคในใบมะเขือเทศจากรูปภาพ',
    projects: ['thai-it-jobs', 'tomato-leaf-disease'],
  },
  {
    lead: 'Ship the',
    word: 'product',
    shape: 'prod.globe',
    desc: 'ต่อเป็นระบบที่คนใช้งานจริง — Power BI, Streamlit dashboard และระบบที่ออนไลน์อยู่บน VPS',
    projects: ['thai-it-jobs', 'fixstatuscar', 'bp-parking'],
  },
];

/* คำถามที่พบบ่อย — ใส่ [[project-id]] เพื่อทำเป็นลิงก์ไปที่ผลงาน */
export const FAQ: Faq[] = [
  {
    q: 'ตอนนี้เรียนอะไร อยู่ชั้นปีไหน?',
    a: 'นิสิตปีที่ 4 สาขาเทคโนโลยีสารสนเทศ คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ (ปีการศึกษา 2569) เรียนครอบคลุม Internet, Database, Web Dev, Mobile App, IoT และ Software Engineering',
  },
  {
    q: 'ถนัดงานด้านไหนที่สุด?',
    a: 'Full Stack — ทำได้ทั้งเว็บ แอปมือถือ และ backend เช่น [[fixstatuscar]], [[bp-parking]] และ [[fleet-management]]',
  },
  {
    q: 'มีระบบที่ออนไลน์ใช้งานจริงไหม?',
    a: 'มี — [[fixstatuscar]] และ [[bp-parking]] ออนไลน์อยู่บน VPS หลัง Nginx + HTTPS ส่วน [[rxv-housekeeping]] ใช้งานจริงในเครือข่ายภายในบริษัท และ [[devilish-hypercars]] เปิดบน Firebase Hosting',
  },
  {
    q: 'เรื่องคุณภาพโค้ดและการทดสอบทำอะไรบ้าง?',
    a: '[[bp-parking]] มีเทสต์ 328 เคส coverage 99.2% และแก้ SonarQube จาก 77 ปัญหาเหลือ 0 ส่วน [[fixstatuscar]] มี Robot Framework 115 เคส ทั้ง UI และ API',
  },
  {
    q: 'นอกจากเว็บ ทำอะไรได้อีกบ้าง?',
    a: 'งานข้อมูลและ BI เช่น [[thai-it-jobs]] และ [[fx-multi-source-pipeline]], งาน AI เช่น [[tomato-leaf-disease]], งาน IoT บน ESP32 เช่น [[smart-home-monitor]] และเกมด้วย Unity',
  },
  {
    q: 'กำลังมองหาอะไร ติดต่อทางไหนได้บ้าง?',
    a: 'มองหาโอกาสฝึกงานสาย Full Stack, Frontend, Backend หรือ Mobile — ติดต่อได้ที่ Qwanmankong@gmail.com · 061-603-4862 · github.com/ThanatornKh',
  },
];

/* ทักษะ — จัดแบบ spec sheet */
export const SKILLS: SkillGroup[] = [
  { key: 'Frontend', desc: 'สร้างหน้าเว็บแบบ Responsive และ Interactive', tags: ['HTML5', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Angular'] },
  { key: 'Mobile', desc: 'แอป Android สำหรับลูกค้าจริง จาก Codebase เดียว', tags: ['Expo', 'React Native', 'Flutter'] },
  { key: 'Backend', desc: 'REST API, Server Actions, Real-time (SSE) และงาน background worker', tags: ['Node.js', 'Express', 'Prisma', 'Zod', 'Auth.js', 'JWT', 'Java Spring Boot'] },
  { key: 'Database', desc: 'ออกแบบฐานข้อมูล SQL, cache และ object storage', tags: ['PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'MinIO', 'Firebase'] },
  { key: 'DevOps', desc: 'Container, CI/CD และ deploy ขึ้นเซิร์ฟเวอร์จริง', tags: ['Docker', 'GitHub Actions', 'Nginx', 'VPS', 'Cloudflare Tunnel'] },
  { key: 'Testing & QA', desc: 'Unit / E2E test และตรวจคุณภาพโค้ด', tags: ['Vitest', 'Robot Framework', 'Playwright', 'pytest', 'SonarQube'] },
  { key: 'Data & AI', desc: 'Pipeline ข้อมูล, NLP ภาษาไทย, Machine Learning และ BI', tags: ['Python', 'Apache Airflow', 'DuckDB', 'PyThaiNLP', 'LightGBM', 'Power BI', 'Streamlit'] },
  { key: 'IoT', desc: 'เขียนโปรแกรมบอร์ด ESP32 อ่านเซนเซอร์และส่งข้อมูลขึ้นคลาวด์', tags: ['ESP32', 'C++', 'PlatformIO', 'MQTT', 'NETPIE'] },
];

/* การศึกษา & ประสบการณ์ */
export const EXPERIENCE: Experience[] = [
  {
    date: '2566 – ปัจจุบัน',
    role: 'นิสิต ปริญญาตรี',
    org: 'มหาวิทยาลัยเกษตรศาสตร์ — คณะศิลปศาสตร์และวิทยาศาสตร์',
    desc: 'ศึกษาสาขาเทคโนโลยีสารสนเทศ ครอบคลุม Internet, Database, Web Dev, Mobile App, IoT และ Software Engineering',
    chip: 'Education',
  },
];
