/* =========================================================
   CONTENT (EN) — ฉบับภาษาอังกฤษของเนื้อหาใน content.ts
   แก้ข้อความไทยที่ content.ts แล้วอย่าลืมแก้คู่ภาษาอังกฤษที่นี่ด้วย
   (ข้อมูลที่ไม่ใช่ข้อความ เช่น stack, รูป, ลิงก์, ตัวเลข ใช้ร่วมกันจาก content.ts)
   ========================================================= */
import type { CategoryId, Experience, Faq, Project } from './types';

export const PROFILE_EN = {
  school: 'Kasetsart University',
  faculty: 'Faculty of Liberal Arts and Science',
  major: 'Information Technology',
  year: 'Year 4 · Academic year 2026',
  location: 'Bangkok',
  quote: ['Do the present well —', 'and the future will follow.'],
  intro:
    "I'm an Information Technology student who loves building software end to end. I work on both the frontend and the backend, and I build systems people actually use — from the UI all the way down to the database.",
  goal: "I'm looking for an internship where I can sharpen my skills and grow as a Full Stack Developer — learning from real work, building alongside a driven team, and shipping things that matter.",
};

export const CATEGORIES_EN: Record<CategoryId, { th: string; desc?: string }> = {
  fullstack: { th: 'End-to-end systems: web + app + backend', desc: 'Next.js · React · Expo · Node.js · PostgreSQL · Docker — systems that are online and in real use' },
  data: { th: 'Data engineering, BI and AI' },
  web: { th: 'Websites and Firebase systems' },
  iot: { th: 'IoT devices and embedded systems' },
  game: { th: 'Games and 3D' },
};

type ProjectText = Partial<Pick<Project, 'th' | 'desc' | 'overview' | 'highlights' | 'type' | 'role' | 'note'>>;

export const PROJECTS_EN: Record<string, ProjectText> = {
  fixstatuscar: {
    th: 'Car repair tracking system (Final project 498)',
    desc: 'Repair tracking for auto shops — a staff web app plus a customer Android app, PromptPay QR payments and 115 automated tests',
    overview:
      'A repair-tracking system for auto shops. Staff (mechanics and admins) use the web app to check cars in, inspect them, issue quotes, repair, take payment and hand cars back. Customers use the Android app to request repairs, follow progress, approve items, pay by PromptPay QR, attach slips and claim warranties. Special Problems course 02739498, Kasetsart University, Kamphaeng Saen campus. Online and in real use.',
    highlights: [
      '3 roles (customer / mechanic / admin) covering the whole loop: request → quote → approve → repair + photo upload → pay → hand over',
      'PromptPay QR payments with slip checking and LINE alerts when money arrives',
      'Repair photos and slips stored in MinIO · scheduled worker jobs · MFA for staff',
      'CI/CD: GitHub Actions → GHCR → VPS, with setup-vps.sh and change-domain.sh scripts',
      'QA: 115 Robot Framework cases (UI + API) · end-to-end repair flow through the real API · SonarQube Quality Gate passed',
      'Fixed real bugs found in testing, e.g. rate limits hit from the search box, tokens still valid after logout, CSP blocking images',
    ],
    role: 'Pair project — I built the customer mobile app (Expo / React Native)',
    note: 'Screenshots are from the repo running locally, with made-up data (sample customers, cars and repair jobs)',
  },
  'bp-parking': {
    th: 'Parking management for a 4-storey building (Project 499)',
    desc: 'Admin/staff web app + customer Android app — live free spaces, PromptPay payments, 328 tests at 99.2% coverage',
    overview:
      'A complete parking management system. The web app serves admins and staff (ticket kiosk, entry booth, scan-to-exit kiosk, dashboard, finance) and the Android app serves customers (free spaces, scan to take a ticket, PromptPay payment, exit QR). Built with Next.js 16 App Router + Server Actions, PostgreSQL, Redis and Expo. Online and in real use.',
    highlights: [
      'RBAC with 4 roles, checked twice (proxy and server action) · CSP + security headers · instant forced logout via sessionVersion',
      'Race-free slot booking with FOR UPDATE SKIP LOCKED',
      'Idempotent payment webhook (Redis) + HMAC signature check + server-side amount check',
      'Pure-function fee engine · ticket state machine · live free spaces over Server-Sent Events',
      'Finance module: daily / monthly / yearly revenue, 7% VAT split, Excel export and tax invoices',
      'PDPA: a worker masks licence plates on tickets older than 90 days',
      '328 tests at 99.2% coverage · SonarQube 77 issues → 0 · 7 Robot Framework suites',
    ],
    note: 'Payments in the demo use a mock provider; no real payment gateway is connected',
  },
  'rxv-housekeeping': {
    th: 'Hotel housekeeping data system',
    desc: 'In real use inside the company, replacing Excel and paper forms — 9 forms, a 24-endpoint REST API and an analytics page',
    overview:
      "A system for recording and analysing the hotel housekeeping department's data, replacing the old Excel and paper forms. It works on computers and phones on the same network, and every device sees the same data through a central server.",
    highlights: [
      '9 forms and reports, e.g. Housekeeping Daily Report, Room Attendant, Linen Inventory, Minibar Inventory',
      'A separate mobile version for staff on the floor',
      '24-endpoint REST API: status sync, CSV/XLSX archive, month-to-month carry-over, snapshots, analytics',
      'Analytics page: activity timeline, linen summary, stock and alerts for minibar items near expiry',
      'Automatic CSV archive every midnight + .xlsx export · 40+ languages',
      'Python script to import old data from 7 Excel files · start.bat starts the server in one double-click',
    ],
    type: 'In-house system in real use',
    note: "Runs on the company's internal LAN — screenshots are from the repo running locally with made-up data, not the hotel's real data",
  },
  'fleet-management': {
    th: 'Logistics fleet management system',
    desc: 'Real-time dashboard, trip and checkpoint tracking, maintenance planning and a pluggable Alert Engine',
    overview:
      'A fleet platform for a logistics company: dashboard, trip and checkpoint tracking, maintenance planning and automatic alerts. Built as the co-op selection exam for a Software Developer position, with a README explaining the technology choices and trade-offs.',
    highlights: [
      '10 pages: Dashboard, Vehicles, Drivers, Trips, Maintenance, Audit Log and more',
      '15-minute JWT access token + 7-day refresh token, renewed automatically by an Axios interceptor',
      'Role-based access (ADMIN / DISPATCHER)',
      'Pluggable Alert Engine — add rules with registerRule(); 5 rules such as overdue maintenance and licences about to expire',
      'Append-only Audit Log via middleware',
      'Nginx reverse proxy serves front and back on port 80 · OpenAPI docs',
    ],
    type: 'Co-op selection exam',
  },
  'thai-it-jobs': {
    th: 'Thai IT job market — Big Data + Power BI',
    desc: 'A pipeline that collects and analyses 13 years of Thai IT job ads from 10 sources — 5,134,246 rows, with NLP, ML and Power BI',
    overview:
      'A pipeline that collects and analyses 13 years of Thai IT job ads from 10 sources, 5,134,246 rows in total. It cleans the data, classifies it with Thai NLP, trains ML models, and presents the results in Power BI and a web dashboard.',
    highlights: [
      'Daily crawler (2 a.m.) from JobThai, JobTopGun, JobPub, JobsDB, InternTH and more + Common Crawl + data.go.th',
      'Respects robots.txt and strips personal contact data (PII) before storing',
      'Province and job-type classification with PyThaiNLP and a LightGBM model',
      'Storage in DuckDB + Parquet · orchestration with Airflow and Spark',
      '5-page Power BI report + web dashboard · 119 pytest tests',
    ],
    note: 'The repo is private and the data may not be published — only the overview and summary numbers are shown (screenshots from the dashboard running locally)',
  },
  'fx-multi-source-pipeline': {
    th: 'Baht exchange-rate pipeline from 3 sources',
    desc: 'Merges THB rates against JPY · USD · EUR · KRW over 6 years from 3 sources with Airflow + PostgreSQL + Streamlit',
    overview:
      'Final exam for 02739452 Big Data Platforms and Analytics. It collects daily baht rates against JPY / USD / EUR / KRW for the past 6 years from Frankfurter (ECB), Yahoo Finance and x-rates.com, merges and de-duplicates them into about 6,200 rows, checks quality before publishing, and shows the result on a Streamlit dashboard.',
    highlights: [
      'Each source runs in its own TaskGroup in parallel · daily scraping with Dynamic Task Mapping',
      'merge_dedup uses trigger_rule=all_done — if one source fails, the rest still merge',
      'UPSERT can re-run without adding rows · median across sources + stored spread_pct',
      'quality_check runs 5 checks, then routes to publish or quarantine',
      '3-page dashboard: KPIs + charts + CSV download, today’s summary, pipeline status',
    ],
    type: 'Final exam',
  },
  'tomato-leaf-disease': {
    th: 'AI detection of tomato leaf diseases',
    desc: 'Trained an AI model in Python to detect diseases in tomato leaves from photos',
    overview: 'Training an AI model in Python to classify diseases in tomato leaves from photos (Detection of Diseases in Tomato Leaves), with a written report of the results.',
    highlights: ['Prepared a dataset of tomato leaf images', 'Trained a disease classifier in Python', 'Summarised the results in a report'],
  },
  'devilish-hypercars': {
    th: 'Online car store',
    desc: 'A complete online car store, frontend + backend, with product management',
    overview: 'An online HyperCar store built end to end, frontend and backend, with product management. Live on Firebase Hosting.',
    highlights: ['Storefront showing each model', 'Back-office product management', 'Live on Firebase Hosting'],
  },
  'smart-home-monitor': {
    th: 'Home smoke and heat detector',
    desc: 'An ESP32 reads temperature, humidity and smoke; past the set limits it switches on fans, a buzzer and warning lights, controlled through NETPIE',
    overview:
      'A home monitoring system on an ESP32. It reads temperature and humidity (DHT11) and smoke (MQ-2). Past the set limits it runs 2 fans to vent heat and smoke, sounds a buzzer and lights an RGB warning. Data goes up to NETPIE Shadow and control commands come back from the cloud over MQTT. Runs on real hardware.',
    highlights: [
      'Temperature and humidity from a DHT11, smoke from an MQ-2',
      'Past the limit → 2 fans + buzzer + RGB light switch on automatically',
      'Sends data to NETPIE Shadow and receives commands over MQTT',
      'Configured and monitored from an app',
    ],
  },
  'monkey-adventure': {
    th: 'Monkey fruit-collecting adventure game',
    desc: 'An adventure game where a monkey collects fruit for points to clear each level',
    overview: 'An adventure game where a monkey collects fruit for points to clear each level. Models built and game developed in Unity.',
    highlights: ['Modelled the character and scenes', 'Fruit collection and scoring', 'Level progression'],
  },
};

/** ป้ายลิงก์ภาษาไทย → อังกฤษ */
export const LINK_EN: Record<string, string> = {
  เปิดระบบจริง: 'Open live system',
  ดูซอร์สโค้ด: 'View source code',
  ดูเอกสาร: 'Read the report',
  เปิดเว็บไซต์: 'Open website',
};

/** ตามลำดับเดียวกับ PROCESS ใน content.ts */
export const PROCESS_EN = [
  'Analyse the problem and design before writing code — UML, screen layouts, data and user flows',
  'Build web apps, mobile apps and backends, from the UI down to the database, plus IoT and data work',
  'Take testing and code quality seriously — unit tests, Robot Framework E2E and SonarQube until the Quality Gate passes',
  'Run on Docker, set up CI/CD and deploy to a VPS behind Nginx + HTTPS so it is actually usable',
];

/** ตามลำดับเดียวกับ AI_ACTS ใน content.ts */
export const AI_ACTS_EN = [
  'Collect data from many sources — a job-ad crawler over 10 sites, exchange-rate APIs and sensors on an ESP32 board',
  'Orchestrate with Apache Airflow — merge, de-duplicate and pass a quality gate before publishing (5.1 million rows in Thai IT Jobs)',
  'Thai NLP with PyThaiNLP, a LightGBM model and an image model that classifies tomato leaf diseases',
  'Turn it into something people use — Power BI, a Streamlit dashboard and systems running online on a VPS',
];

export const FAQ_EN: Faq[] = [
  {
    q: 'What are you studying, and which year?',
    a: 'Fourth-year Information Technology student, Faculty of Liberal Arts and Science, Kasetsart University (academic year 2026). Coursework covers the Internet, databases, web development, mobile apps, IoT and software engineering.',
  },
  {
    q: 'What are you strongest at?',
    a: 'Full stack — web apps, mobile apps and backends, e.g. [[fixstatuscar]], [[bp-parking]] and [[fleet-management]].',
  },
  {
    q: 'Do you have systems in real use?',
    a: 'Yes — [[fixstatuscar]] and [[bp-parking]] run online on a VPS behind Nginx + HTTPS, [[rxv-housekeeping]] is in daily use on a company network, and [[devilish-hypercars]] is live on Firebase Hosting.',
  },
  {
    q: 'What do you do about code quality and testing?',
    a: '[[bp-parking]] has 328 tests at 99.2% coverage and went from 77 SonarQube issues to 0. [[fixstatuscar]] has 115 Robot Framework cases covering both UI and API.',
  },
  {
    q: 'What else can you do besides web?',
    a: 'Data and BI work such as [[thai-it-jobs]] and [[fx-multi-source-pipeline]], AI such as [[tomato-leaf-disease]], IoT on ESP32 such as [[smart-home-monitor]], and games in Unity.',
  },
  {
    q: 'What are you looking for, and how can I reach you?',
    a: 'An internship in full stack, frontend, backend or mobile — reach me at Qwanmankong@gmail.com · 061-603-4862 · github.com/ThanatornKh',
  },
];

export const SKILLS_EN: Record<string, string> = {
  Frontend: 'Responsive, interactive web interfaces',
  Mobile: 'Android apps for real customers from a single codebase',
  Backend: 'REST APIs, Server Actions, real-time (SSE) and background workers',
  Database: 'SQL database design, caching and object storage',
  DevOps: 'Containers, CI/CD and deploying to real servers',
  'Testing & QA': 'Unit / E2E tests and code-quality checks',
  'Data & AI': 'Data pipelines, Thai NLP, machine learning and BI',
  IoT: 'Programming ESP32 boards to read sensors and send data to the cloud',
};

export const EXPERIENCE_EN: Experience[] = [
  {
    date: '2023 – present',
    role: "Bachelor's student",
    org: 'Kasetsart University — Faculty of Liberal Arts and Science',
    desc: 'Studying Information Technology: the Internet, databases, web development, mobile apps, IoT and software engineering.',
    chip: 'Education',
  },
];
