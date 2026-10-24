/* =========================================================
   PORTFOLIO — rendering & interactions
   (ข้อมูลทั้งหมดอยู่ใน js/data.js)
   ========================================================= */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const pad = n => String(n).padStart(2, '0');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // random แบบกำหนด seed ได้ — layout เดิมทุกครั้งที่โหลด
  const seeded = seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const hashStr = s => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

  /* ---------- derived data ---------- */
  const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
  // เรียงผลงานตามลำดับหมวดหมู่ แล้วใส่รหัส เช่น FS-01
  const ordered = [];
  CATEGORIES.forEach(c => {
    PROJECTS.filter(p => p.cat === c.id).forEach((p, i) => {
      p.code = `${c.code}-${pad(i + 1)}`;
      p.no = ordered.length + 1;
      p.path = `~/projects/${c.id}/${p.id}`;
      p.images = p.images || [];
      p.links = p.links || [];
      ordered.push(p);
    });
  });
  const byId = Object.fromEntries(ordered.map(p => [p.id, p]));
  const featured = ordered.filter(p => p.featured);
  const countIn = id => ordered.filter(p => p.cat === id).length;

  const techMap = new Map();
  ordered.forEach(p => p.stack.forEach(t => {
    if (!techMap.has(t)) techMap.set(t, { name: t, cats: new Set(), projects: [] });
    const o = techMap.get(t);
    o.cats.add(p.cat);
    o.projects.push(p);
  }));
  const techs = [...techMap.values()];

  /* =========================================================
     BLUEPRINT COVER — ภาพปกเส้นแบบพิมพ์เขียว สำหรับผลงานที่ไม่มีรูป
     ========================================================= */
  const S = 'stroke="#0b0b0b" stroke-width="1.3" fill="none"';
  const GLYPHS = {
    fullstack: `
      <rect x="230" y="135" width="250" height="175" ${S}/>
      <line x1="230" y1="158" x2="480" y2="158" ${S}/>
      <circle cx="244" cy="147" r="3" ${S}/><circle cx="256" cy="147" r="3" ${S}/><circle cx="268" cy="147" r="3" ${S}/>
      <rect x="244" y="171" width="52" height="125" ${S} stroke-dasharray="3 4"/>
      <rect x="308" y="171" width="158" height="50" ${S}/>
      <rect x="308" y="231" width="74" height="65" ${S}/><rect x="392" y="231" width="74" height="65" ${S}/>
      <path d="M520 175v110c0 7 16 13 36 13s36-6 36-13V175" ${S}/>
      <ellipse cx="556" cy="175" rx="36" ry="12" ${S}/>
      <path d="M520 212c0 7 16 13 36 13s36-6 36-13M520 249c0 7 16 13 36 13s36-6 36-13" ${S}/>
      <path d="M480 230h40" ${S} stroke-dasharray="4 4"/>`,
    web: `
      <rect x="285" y="125" width="210" height="190" ${S} stroke-dasharray="4 5"/>
      <rect x="315" y="150" width="210" height="190" fill="#f5f5f3" stroke="#0b0b0b" stroke-width="1.3"/>
      <line x1="315" y1="174" x2="525" y2="174" ${S}/>
      <path d="M392 232l-26 22 26 22M448 232l26 22-26 22M432 222l-24 64" ${S}/>`,
    iot: `
      <rect x="345" y="190" width="110" height="110" ${S}/>
      <rect x="370" y="215" width="60" height="60" ${S} stroke-dasharray="3 4"/>
      ${[0, 1, 2, 3, 4].map(i => {
        const o = 360 + i * 20;
        return `<path d="M${o} 190v-14M${o} 300v14M345 ${o - 155}h-14M455 ${o - 155}h14" ${S}/>`;
      }).join('')}
      <circle cx="400" cy="152" r="3.5" fill="#0b0b0b"/>
      <path d="M383 135a24 24 0 0 1 34 0M371 123a41 41 0 0 1 58 0M359 111a58 58 0 0 1 82 0" ${S}/>`,
    backend: [0, 1, 2].map(i => {
      const y = 140 + i * 58;
      return `<rect x="290" y="${y}" width="220" height="46" ${S}/>
        <path d="M308 ${y + 17}h90M308 ${y + 29}h60" ${S}/>
        <circle cx="470" cy="${y + 23}" r="5" ${S}/><circle cx="490" cy="${y + 23}" r="5" ${S}/>`;
    }).join('') + `<path d="M400 314v24M330 338h140" ${S}/>`,
    data: `
      <path d="M280 125v200h260" ${S}/>
      <path d="M280 275h260M280 225h260M280 175h260" stroke="#0b0b0b" stroke-width=".6" stroke-dasharray="3 5" fill="none"/>
      <polyline points="295,295 340,250 385,268 430,200 475,214 520,150" ${S}/>
      ${[[295, 295], [340, 250], [385, 268], [430, 200], [475, 214], [520, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#f5f5f3" stroke="#0b0b0b" stroke-width="1.3"/>`).join('')}`,
    game: `
      <path d="M380 140l78 45v90l-78 45-78-45v-90z" ${S}/>
      <path d="M302 185l78 45 78-45M380 230v90" ${S}/>
      <path d="M302 275l78-45M458 275l-78-45M380 140v90" stroke="#0b0b0b" stroke-width=".7" stroke-dasharray="3 5" fill="none"/>
      <circle cx="520" cy="285" r="30" ${S}/>
      <ellipse cx="520" cy="285" rx="30" ry="9" ${S} stroke-dasharray="3 4"/>`,
  };

  // ภาพลายเส้นเฉพาะของแต่ละผลงาน (ไม่มี = ใช้ภาพของหมวด)
  const T = (x, y, s, size = 12, anchor = 'middle') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="#0b0b0b">${s}</text>`;
  const arrow = (x1, y1, x2, y2) => {
    const a = Math.atan2(y2 - y1, x2 - x1), h = 10;
    const p1 = [x2 - h * Math.cos(a - .4), y2 - h * Math.sin(a - .4)], p2 = [x2 - h * Math.cos(a + .4), y2 - h * Math.sin(a + .4)];
    return `<path d="M${x1} ${y1}L${x2} ${y2}M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${x2} ${y2}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}" ${S}/>`;
  };
  const PROJECT_GLYPHS = {
    'smart-parking-3d': [300, 252, 204, 156].map(c => `<path d="M260 ${c}L400 ${c - 42}L540 ${c}L400 ${c + 42}Z" ${S}${c === 156 ? '' : ' stroke-dasharray="5 4"'}/>`).join('') + `
      <path d="M260 156V300M540 156V300M400 198V342" ${S}/>
      <path d="M338 150l22-8 22 8-22 8zM418 162l22-8 22 8-22 8z" ${S}/>
      <circle cx="580" cy="230" r="4" fill="#0b0b0b"/>
      <path d="M592 218a16 16 0 0 1 0 24M601 209a28 28 0 0 1 0 42" ${S}/>
      ${T(612, 290, 'ESP32', 11, 'start')}`,
    'equipment-management': `
      <rect x="290" y="110" width="220" height="240" rx="6" ${S}/>
      <rect x="360" y="98" width="80" height="26" rx="4" fill="#f5f5f3" stroke="#0b0b0b" stroke-width="1.3"/>
      ${[0, 1, 2, 3].map(i => `<rect x="310" y="${148 + i * 36}" width="16" height="16" ${S}/><path d="M340 ${156 + i * 36}H${470 - i * 22}" ${S}/>`).join('')}
      <path d="M313 155l5 5 9-10M313 191l5 5 9-10" ${S}/>
      ${[0, 4, 7, 9, 14, 17, 22, 26, 28, 33, 38, 41, 46, 50, 53, 58, 63, 66, 71, 75].map((o, i) => `<path d="M${330 + o * 2} 300v30" stroke="#0b0b0b" stroke-width="${i % 3 ? 1 : 2.4}"/>`).join('')}`,
    'fleet-management': `
      <path d="M150 170C260 120 330 210 430 160S580 110 620 135" ${S} stroke-dasharray="5 6"/>
      <circle cx="150" cy="170" r="5" fill="#0b0b0b"/>
      <path d="M620 100c-14 0-22 10-22 22 0 16 22 36 22 36s22-20 22-36c0-12-8-22-22-22z" ${S}/><circle cx="620" cy="121" r="6" ${S}/>
      <rect x="230" y="210" width="200" height="96" ${S}/>
      <path d="M430 236h60l40 40v30H430zM442 246h42l26 26h-68z" ${S}/>
      <circle cx="285" cy="312" r="22" fill="#f5f5f3" stroke="#0b0b0b" stroke-width="1.3"/><circle cx="485" cy="312" r="22" fill="#f5f5f3" stroke="#0b0b0b" stroke-width="1.3"/>
      <path d="M190 334H610" ${S}/>`,
    'angular-first-app': `
      <rect x="340" y="116" width="120" height="40" ${S}/>${T(400, 140, '&lt;app-root&gt;', 11)}
      ${[220, 340, 460].map(x => `<rect x="${x}" y="206" width="120" height="40" ${S}/>${arrow(400, 156, x + 60, 204)}`).join('')}
      ${T(280, 230, 'header', 11)}${T(400, 230, 'main', 11)}${T(520, 230, 'footer', 11)}
      ${[[350, 'card'], [450, 'card']].map(([x, s]) => `<rect x="${x - 40}" y="290" width="80" height="34" ${S} stroke-dasharray="4 4"/>${T(x, 311, s, 10)}${arrow(400, 246, x, 288)}`).join('')}`,
    'sa-schedule-system': `
      <rect x="230" y="120" width="340" height="230" ${S}/>
      <path d="M230 160H570M300 108v24M500 108v24" ${S}/>
      ${[1, 2, 3, 4].map(k => `<path d="M${230 + 68 * k} 160V350" stroke="#0b0b0b" stroke-width=".6"/>`).join('')}
      ${[1, 2, 3].map(k => `<path d="M230 ${160 + 47.5 * k}H570" stroke="#0b0b0b" stroke-width=".6"/>`).join('')}
      ${[[1, 0], [3, 0], [0, 1], [2, 2], [4, 1], [1, 3]].map(([c, r]) => `<rect x="${234 + 68 * c}" y="${164 + 47.5 * r}" width="60" height="39" fill="rgba(11,11,11,.08)" ${S}/>`).join('')}
      <rect x="600" y="240" width="44" height="36" rx="4" ${S}/><path d="M610 240v-12a12 12 0 0 1 24 0v12" ${S}/>`,
    'sa-activity-planner': [210, 330, 450].map((x, ci) => `
      <rect x="${x}" y="120" width="110" height="230" ${S}/><path d="M${x} 150h110" ${S}/>
      ${T(x + 55, 140, ['TODO', 'DOING', 'DONE'][ci], 10)}
      ${Array.from({ length: [2, 3, 1][ci] }, (_, i) => `<rect x="${x + 10}" y="${160 + i * 50}" width="90" height="38" ${S}/><path d="M${x + 20} ${174 + i * 50}h50M${x + 20} ${186 + i * 50}h32" stroke="#0b0b0b" stroke-width=".7"/>`).join('')}`).join('') +
      `<path d="M528 168l8 8 16-16" stroke="#b8121b" stroke-width="2" fill="none"/>`,
    'cambodia-culture-music': `
      <path d="M370 330V220Q400 110 430 220V330M300 330V250Q325 180 350 250V330M450 330V250Q475 180 500 250V330" ${S}/>
      <path d="M372 250h56M372 280h56M302 280h46M452 280h46M380 190h40" stroke="#0b0b0b" stroke-width=".7" fill="none"/>
      <path d="M260 330h280v14H260zM240 344h320v12H240z" ${S}/>
      <path d="M576 150v62M606 140v62M576 150l30-10M576 162l30-10" ${S}/>
      <ellipse cx="568" cy="213" rx="9" ry="6" fill="#0b0b0b"/><ellipse cx="598" cy="203" rx="9" ry="6" fill="#0b0b0b"/>`,
    'portfolio-website': `
      <rect x="220" y="120" width="360" height="230" ${S}/><path d="M220 144h360" ${S}/>
      <circle cx="234" cy="132" r="3" ${S}/><circle cx="246" cy="132" r="3" ${S}/><circle cx="258" cy="132" r="3" ${S}/>
      <path d="M250 196h200M250 224h150" stroke="#0b0b0b" stroke-width="7" fill="none"/>
      <path d="M250 250h240M250 264h200" stroke="#0b0b0b" stroke-width=".8" fill="none"/>
      <rect x="250" y="286" width="96" height="28" rx="14" fill="#0b0b0b"/><rect x="356" y="286" width="80" height="28" rx="14" ${S}/>
      <path d="M520 290v34l9-9 7 15 6-3-7-14h12z" fill="#f5f5f3" stroke="#0b0b0b" stroke-width="1.3"/>`,
    'netpie-device-control': `
      <path d="M300 250a36 36 0 0 1 22-62 52 52 0 0 1 98-14 40 40 0 0 1 60 40 30 30 0 0 1-6 58H312a30 30 0 0 1-12-22z" ${S}/>
      ${T(400, 238, 'NETPIE', 13)}
      ${arrow(370, 282, 370, 318)}${arrow(430, 318, 430, 282)}
      ${T(446, 304, 'MQTT', 10, 'start')}
      <rect x="320" y="320" width="160" height="44" rx="4" ${S}/>
      <rect x="338" y="332" width="44" height="20" rx="10" ${S}/><circle cx="372" cy="342" r="7" fill="#0b0b0b"/>
      <circle cx="450" cy="342" r="7" fill="#b8121b"/>`,
    'dht-lcd-alert': `
      <path d="M300 130v148a24 24 0 1 0 20 0V130a10 10 0 0 0-20 0z" ${S}/>
      <path d="M310 170v128" stroke="#b8121b" stroke-width="5"/><circle cx="310" cy="298" r="12" fill="#b8121b"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<path d="M326 ${150 + i * 22}h${i % 2 ? 6 : 10}" ${S}/>`).join('')}
      <rect x="380" y="170" width="230" height="96" ${S}/><rect x="394" y="184" width="202" height="68" fill="rgba(11,11,11,.06)" ${S}/>
      ${T(408, 212, 'TEMP  28.5°C', 15, 'start')}${T(408, 238, 'HUMID 64 %', 15, 'start')}
      <circle cx="560" cy="310" r="10" fill="#b8121b"/>
      <path d="M560 284v-8M580 292l6-6M540 292l-6-6M586 310h8M534 310h-8" ${S}/>`,
    'mqtt-button-publish': `
      <rect x="240" y="230" width="100" height="96" rx="8" ${S}/>
      <circle cx="290" cy="278" r="30" ${S}/><circle cx="290" cy="278" r="18" fill="#0b0b0b"/>
      ${arrow(345, 278, 462, 278)}${T(404, 264, 'publish', 11)}
      <rect x="380" y="186" width="48" height="32" ${S}/><path d="M380 186l24 18 24-18" ${S}/>
      <circle cx="520" cy="278" r="50" ${S}/>${T(520, 283, 'MQTT', 14)}
      ${T(290, 350, 'WOKWI SIM', 10)}`,
    'mqtt-counter-lcd': `
      <circle cx="285" cy="260" r="50" ${S}/>${T(285, 265, 'MQTT', 14)}
      ${arrow(338, 260, 398, 260)}${T(368, 246, 'sub', 11)}
      <rect x="402" y="212" width="210" height="96" ${S}/><rect x="414" y="224" width="186" height="72" fill="rgba(11,11,11,.06)" ${S}/>
      ${T(507, 274, '0042', 38)}`,
    'spring-boot-workshop': `
      ${[['Controller', 130], ['Service', 202], ['Repository', 274]].map(([s, y]) => `<rect x="260" y="${y}" width="230" height="48" ${S}/>${T(375, y + 29, s, 13)}`).join('')}
      ${arrow(375, 178, 375, 200)}${arrow(375, 250, 375, 272)}
      <rect x="560" y="196" width="76" height="110" rx="12" ${S}/><rect x="552" y="180" width="92" height="20" rx="4" ${S}/>
      ${T(598, 258, '.jar', 15)}
      ${arrow(494, 250, 552, 250)}`,
    'vps-deploy-setup': `
      <circle cx="290" cy="250" r="36" ${S}/><circle cx="290" cy="250" r="12" ${S}/>
      <path d="M326 250h134M436 250v22M456 250v14" ${S}/>
      ${arrow(472, 250, 528, 250)}${T(500, 238, 'ssh', 11)}
      <rect x="540" y="170" width="120" height="160" ${S}/>
      ${[0, 1, 2].map(i => `<path d="M552 ${188 + i * 48}h96v32h-96z" ${S}/><circle cx="636" cy="${204 + i * 48}" r="4" fill="#0b0b0b"/><path d="M562 ${204 + i * 48}h40" ${S}/>`).join('')}
      ${T(600, 350, 'VPS', 12)}`,
    'owasp-juice-shop': `
      <path d="M400 120l100 35v85c0 60-45 95-100 110-55-15-100-50-100-110v-85z" ${S}/>
      <ellipse cx="400" cy="256" rx="26" ry="36" ${S}/><circle cx="400" cy="208" r="12" ${S}/>
      <path d="M374 240h-22M374 260h-24M376 280h-20M426 240h22M426 260h24M424 280h20M390 198l-10-12M410 198l10-12M400 222v70" ${S}/>
      <circle cx="574" cy="196" r="34" ${S}/><path d="M598 220l40 40" stroke="#0b0b0b" stroke-width="4"/>`,
    'airflow-pipeline-lab': `
      ${[[200, 220, 'extract'], [340, 150, 'transform'], [340, 290, 'validate'], [480, 220, 'load']].map(([x, y, s]) => `<rect x="${x}" y="${y}" width="100" height="38" rx="19" ${S}/>${T(x + 50, y + 23, s, 11)}`).join('')}
      ${arrow(300, 232, 338, 178)}${arrow(300, 246, 338, 300)}${arrow(440, 178, 478, 232)}${arrow(440, 300, 478, 246)}
      ${T(400, 120, 'DAG', 12)}`,
  };

  function blueprint(p) {
    const c = catById[p.cat];
    let grid = '';
    for (let x = 0; x <= 800; x += 25) grid += `<line x1="${x}" y1="0" x2="${x}" y2="500" stroke="${x % 100 ? '#ebebe7' : '#dcdcd7'}" stroke-width="${x % 100 ? .6 : .8}"/>`;
    for (let y = 0; y <= 500; y += 25) grid += `<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="${y % 100 ? '#ebebe7' : '#dcdcd7'}" stroke-width="${y % 100 ? .6 : .8}"/>`;
    return `<svg class="bp" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(p.name)}">
      <rect width="800" height="500" fill="#f5f5f3"/>${grid}
      <g>${PROJECT_GLYPHS[p.id] || GLYPHS[c.glyph] || ''}</g>
      <g stroke="#0b0b0b" stroke-width="1" fill="none">
        <path d="M270 378h260M270 371v14M530 371v14M270 378l10-4v8zM530 378l-10-4v8z"/>
      </g>
      <text x="400" y="404" text-anchor="middle" font-size="11" letter-spacing="2" fill="#858580">${esc(p.stack.slice(0, 3).join(' · '))}</text>
      <text x="96" y="62" font-size="15" font-weight="500" letter-spacing="3" fill="#0b0b0b">${p.code}</text>
      <text x="96" y="82" font-size="10" letter-spacing="1" fill="#858580">${esc(p.path)}</text>
      <text x="704" y="62" text-anchor="end" font-size="10" letter-spacing="2" fill="#858580">NO. ${pad(p.no)}</text>
      <text x="96" y="452" font-size="13" font-weight="500" letter-spacing="3" fill="#0b0b0b">${esc(p.name.toUpperCase())}</text>
      <path d="M96 465h40" stroke="#b8121b" stroke-width="2"/>
    </svg>`;
  }

  function media(p, i = 0) {
    const src = p.images[i];
    return src
      ? `<img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" decoding="async" data-pid="${p.id}">`
      : blueprint(p);
  }

  // รูปโหลดไม่ได้ → แทนด้วยภาพ blueprint
  document.addEventListener('error', e => {
    const img = e.target;
    if (img.tagName === 'IMG' && img.dataset.pid && byId[img.dataset.pid]) {
      img.outerHTML = blueprint(byId[img.dataset.pid]);
    }
  }, true);

  /* =========================================================
     HERO — ภาพลายเส้นโต๊ะทำงาน Developer
     ========================================================= */
  function buildRig() {
    const L = 'stroke="#0b0b0b" fill="none"';
    const keys = [];
    for (let r = 0; r < 4; r++) {
      const yA = 674 + r * 16, yB = yA + 12;
      const xl = y => lerp(440, 410, (y - 668) / 72), xr = y => lerp(820, 850, (y - 668) / 72);
      const n = r === 3 ? 3 : 13;
      const widths = r === 3 ? [2, 8, 2] : Array(n).fill(1);
      const total = widths.reduce((a, b) => a + b, 0);
      let acc = 0;
      widths.forEach(w => {
        const g = 3;
        const f0 = acc / total, f1 = (acc + w) / total;
        acc += w;
        const ax0 = lerp(xl(yA), xr(yA), f0) + g, ax1 = lerp(xl(yA), xr(yA), f1) - g;
        const bx0 = lerp(xl(yB), xr(yB), f0) + g, bx1 = lerp(xl(yB), xr(yB), f1) - g;
        keys.push(`<path class="draw" d="M${ax0.toFixed(1)} ${yA}H${ax1.toFixed(1)}L${bx1.toFixed(1)} ${yB}H${bx0.toFixed(1)}Z" ${L} stroke-width=".8"/>`);
      });
    }
    return `
      <text x="40" y="24" font-size="12" fill="#858580" class="fade">FIG. 01 — DEVELOPER WORKSTATION</text>
      <text x="1160" y="24" font-size="12" fill="#858580" text-anchor="end" class="fade">SCALE 1:10 · DWG TK-2568</text>

      <!-- desk -->
      <path class="draw" d="M40 640H1160" ${L} stroke-width="1.2"/>
      <path class="draw" d="M0 772H1200" ${L} stroke-width=".7" stroke-dasharray="2 6"/>

      <!-- dimension lines -->
      <g class="fade" ${L} stroke-width=".8">
        <path d="M330 66H930M330 58v16M930 58v16M330 66l10-4v8zM930 66l-10-4v8z"/>
        <path d="M968 90V480M960 90h16M960 480h16M968 90l-4 10h8zM968 480l-4-10h8z"/>
      </g>
      <text x="630" y="56" font-size="12" fill="#858580" text-anchor="middle" class="fade">600</text>
      <text x="988" y="290" font-size="12" fill="#858580" class="fade">390</text>

      <!-- monitor -->
      <rect class="draw" x="330" y="90" width="600" height="390" rx="16" ${L} stroke-width="1.5"/>
      <rect x="352" y="112" width="556" height="318" fill="#0e0f11"/>
      <circle class="draw" cx="630" cy="455" r="4" ${L} stroke-width="1"/>
      <path class="draw" d="M600 480 585 622M660 480 675 622" ${L} stroke-width="1.3"/>
      <rect class="draw" x="530" y="622" width="200" height="18" rx="9" ${L} stroke-width="1.3"/>

      <!-- keyboard -->
      <path class="draw" d="M440 668H820L850 740H410Z" ${L} stroke-width="1.2"/>
      ${keys.join('')}

      <!-- mouse -->
      <ellipse class="draw" cx="930" cy="705" rx="20" ry="28" ${L} stroke-width="1.2"/>
      <path class="draw" d="M930 678v18" ${L} stroke-width="1"/>

      <!-- coffee -->
      <path class="draw" d="M230 652v58c0 6 13 11 30 11s30-5 30-11v-58" ${L} stroke-width="1.2"/>
      <ellipse class="draw" cx="260" cy="652" rx="30" ry="8" ${L} stroke-width="1.2"/>
      <path class="draw" d="M290 668c22 0 22 34 0 34" ${L} stroke-width="1.2"/>
      <path class="draw steam" d="M248 636c-8-10 8-18 0-28s8-18 0-28M262 632c-8-10 8-18 0-28s8-18 0-28M276 636c-8-10 8-18 0-28" ${L} stroke-width=".9"/>

      <!-- photo frame -->
      <rect class="draw" x="104" y="458" width="136" height="182" ${L} stroke-width="1.3"/>
      <rect x="114" y="468" width="115" height="156" fill="#f5f5f3"/>

      <!-- lamp -->
      <rect class="draw" x="1035" y="628" width="80" height="12" rx="6" ${L} stroke-width="1.2"/>
      <path class="draw" d="M1075 628 1030 430 1110 330" ${L} stroke-width="1.3"/>
      <circle class="draw" cx="1030" cy="430" r="6" ${L} stroke-width="1.2"/>
      <circle class="draw" cx="1110" cy="330" r="5" ${L} stroke-width="1.2"/>
      <path class="draw" d="M1088 318 1140 292 1168 342 1112 356Z" ${L} stroke-width="1.3"/>
      <path class="fade" d="M1130 352 1060 600M1160 346 1150 600" ${L} stroke-width=".7" stroke-dasharray="3 6"/>

      <!-- callouts -->
      <g class="fade" ${L} stroke-width=".8">
        <circle cx="330" cy="110" r="3"/><path d="M330 110 286 70H200"/>
        <circle cx="172" cy="458" r="3"/><path d="M172 458 150 410H60"/>
        <circle cx="260" cy="721" r="3"/><path d="M260 721 220 760H130"/>
        <circle cx="850" cy="740" r="3"/><path d="M850 740 880 760H980"/>
      </g>
      <g class="fade" font-size="11" fill="#0b0b0b">
        <text x="200" y="64">01 DISPLAY</text>
        <text x="60" y="404">02 DEVELOPER</text>
        <text x="130" y="754">03 FUEL</text>
        <text x="900" y="754">04 INPUT</text>
      </g>`;
  }

  const rigSvg = $('#rigSvg');
  rigSvg.innerHTML = buildRig();
  $$('.draw', rigSvg).forEach((el, i) => {
    const len = Math.ceil(el.getTotalLength ? el.getTotalLength() : 1000);
    el.style.setProperty('--len', len);
    el.style.setProperty('--delay', `${.2 + Math.min(i, 40) * .03}s`);
  });
  $$('.fade', rigSvg).forEach(el => el.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 1200, delay: 1400, fill: 'both', easing: 'ease-out' }
  ));

  /* ---------- typing code on the monitor ---------- */
  const codeLines = [
    [['c', '// ~/thanatorn/portfolio.ts']],
    [['k', 'import'], ['p', ' { '], ['n', 'Developer'], ['p', ' } '], ['k', 'from'], ['s', " '@ku/it'"], ['p', ';']],
    [],
    [['k', 'const'], ['n', ' me'], ['p', ': '], ['n', 'Developer'], ['p', ' = {']],
    [['n', '  name'], ['p', ': '], ['s', "'Thanatorn Khwanmankong'"], ['p', ',']],
    [['n', '  role'], ['p', ': '], ['s', "'Full Stack Developer'"], ['p', ',']],
    [['n', '  stack'], ['p', ': ['], ['s', "'Next.js'"], ['p', ', '], ['s', "'React'"], ['p', ', '], ['s', "'Node.js'"], ['p', '],']],
    [['n', '  projects'], ['p', ': '], ['k', String(ordered.length)], ['p', ',']],
    [['n', '  status'], ['p', ': '], ['s', "'open to internship'"], ['p', ',']],
    [['p', '};']],
    [],
    [['n', 'me'], ['p', '.'], ['n', 'build'], ['p', '('], ['s', "'your next idea'"], ['p', ');']],
  ];
  const codeEl = $('#heroCode');
  const totalChars = codeLines.reduce((n, l) => n + l.reduce((m, [, t]) => m + t.length, 0) + 1, 0);

  function renderCode(n) {
    let left = n;
    const lines = [];
    for (const line of codeLines) {
      if (left < 0 || (left === 0 && lines.length)) break;
      let html = '';
      for (const [cls, text] of line) {
        const part = text.slice(0, Math.max(0, left));
        left -= part.length;
        if (part) html += `<span class="${cls}">${esc(part)}</span>`;
      }
      lines.push(html);
      left -= 1; // ขึ้นบรรทัดใหม่
    }
    lines[lines.length - 1] += '<span class="caret"></span>';
    codeEl.innerHTML = lines.map(l => `<span class="ln">${l}</span>`).join('');
  }

  if (reduceMotion) renderCode(totalChars);
  else {
    let typed = 0;
    renderCode(0);
    setTimeout(() => {
      const timer = setInterval(() => {
        typed += 2;
        renderCode(typed);
        if (typed >= totalChars) clearInterval(timer);
      }, 26);
    }, 900);
  }

  /* ---------- hero stats ---------- */
  const stats = [
    { v: ordered.length, k: 'Projects', th: 'ผลงานทั้งหมด' },
    { v: CATEGORIES.length, k: 'Categories', th: 'หมวดหมู่' },
    { v: techs.length, k: 'Technologies', th: 'เทคโนโลยีที่ใช้', plus: true },
    { v: 3, k: 'Year · IT', th: 'ชั้นปี · มหาวิทยาลัยเกษตรศาสตร์' },
  ];
  $('#heroStats').innerHTML = stats.map(s => `
    <div class="spec-item">
      <dd><span class="count" data-to="${s.v}">${pad(s.v)}</span>${s.plus ? '<sup>+</sup>' : ''}</dd>
      <dt>${s.k}<span>${s.th}</span></dt>
    </div>`).join('');

  function countUp(el) {
    const to = +el.dataset.to;
    const t0 = performance.now(), dur = 1400;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = pad(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (!reduceMotion) setTimeout(() => $$('#heroStats .count').forEach(countUp), 600);

  $('#worksCount').textContent = pad(ordered.length);

  /* ---------- hero scroll: zoom into the screen + pixel dissolve ---------- */
  const hero = $('#hero');
  const heroPin = $('.hero-pin');
  const stage = $('#rigStage');
  const screen = $('#rigScreen');
  const heroCopy = $('#heroCopy');
  const heroStats = $('#heroStats');
  const hint = $('#scrollHint');
  const pixCanvas = $('#pixels');
  const pctx = pixCanvas.getContext('2d');
  let geo = null, cells = null, lastQ = -1;

  function measureHero() {
    stage.style.transform = 'none';
    const pin = heroPin.getBoundingClientRect();
    const st = stage.getBoundingClientRect();
    const sc = screen.getBoundingClientRect();
    geo = {
      cx: sc.left - st.left + sc.width / 2,
      cy: sc.top - st.top + sc.height / 2,
      tx: pin.width / 2 - (st.left - pin.left),
      ty: pin.height / 2 - (st.top - pin.top),
      scale: Math.max(pin.width / sc.width, pin.height / sc.height) * 1.06,
    };
    // pixel grid
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    pixCanvas.width = pin.width * dpr;
    pixCanvas.height = pin.height * dpr;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = Math.max(22, Math.round(Math.min(pin.width, pin.height) / 24));
    const nx = Math.ceil(pin.width / size), ny = Math.ceil(pin.height / size);
    const rnd = seeded(2568);
    cells = [];
    for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
      const d = Math.hypot(x / nx - .5, y / ny - .5) / .71;
      cells.push({ x: x * size, y: y * size, s: size, th: rnd() * .8 + d * .2 });
    }
    lastQ = -1;
  }

  function drawPixels(q) {
    q = Math.round(q * 200) / 200;
    if (q === lastQ) return;
    lastQ = q;
    const { width, height } = heroPin.getBoundingClientRect();
    pctx.clearRect(0, 0, width, height);
    if (q <= 0) return;
    for (const c of cells) {
      if (c.th < q) pctx.fillStyle = '#ffffff';
      else if (c.th < q + .07) pctx.fillStyle = c.th < q + .035 ? '#e6e6e2' : '#2a2c30';
      else continue;
      pctx.fillRect(c.x, c.y, c.s + .5, c.s + .5);
    }
  }

  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function updateHero() {
    if (!geo) return;
    const r = hero.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = clamp(-r.top / span);
    const e = easeInOut(clamp((p - .06) / .62));
    const k = 1 + (geo.scale - 1) * e;
    const x = lerp(geo.cx, geo.tx, e) - k * geo.cx;
    const y = lerp(geo.cy, geo.ty, e) - k * geo.cy;
    stage.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;

    const f = clamp(p / .2);
    heroCopy.style.opacity = 1 - f;
    heroCopy.style.transform = `translateY(${-70 * f}px)`;
    heroCopy.style.visibility = f >= 1 ? 'hidden' : '';
    heroStats.style.opacity = 1 - clamp(p / .14);
    heroStats.style.transform = `translateY(${60 * clamp(p / .2)}px)`;
    hint.style.opacity = p > .01 ? 0 : 1;
    rail.classList.toggle('off', p < .98);
    drawPixels(clamp((p - .68) / .26));
  }

  /* =========================================================
     ABOUT — profile.json
     ========================================================= */
  const profile = [
    ['university', 'มหาวิทยาลัยเกษตรศาสตร์'],
    ['faculty', 'ศิลปศาสตร์และวิทยาศาสตร์'],
    ['major', 'เทคโนโลยีสารสนเทศ'],
    ['year', 'ปีที่ 3 · ปีการศึกษา 2568'],
    ['email', '<a href="mailto:Qwanmankong@gmail.com">Qwanmankong@gmail.com</a>'],
    ['phone', '<a href="tel:0616034862">061-603-4862</a>'],
    ['location', 'กรุงเทพมหานคร'],
  ];
  $('#profileCode').innerHTML = [
    '<span class="ln"><span class="p">{</span></span>',
    ...profile.map(([k, v], i) => `<span class="ln">  <span class="k">"${k}"</span><span class="p">: </span><span class="s">"${v}"</span><span class="p">${i < profile.length - 1 ? ',' : ''}</span></span>`),
    '<span class="ln"><span class="p">}</span></span>',
  ].join('');

  /* =========================================================
     PROCESS — ฉากเลื่อน 3 บท: design → build → ship
     ========================================================= */
  const processSec = $('#process');
  const processArt = $('#processArt');
  const processItems = [];
  const processSteps = [];

  $('#processTitles').innerHTML = PROCESS.map((s, i) => `
    <div class="p-item${i === 0 ? ' on' : ''}">
      <h2 class="p-title">I <span class="script">${esc(s.verb)}</span> it.</h2>
      <p class="p-desc">${esc(s.desc)}</p>
      <div class="p-tags">${s.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
      <div class="p-examples">e.g.${s.projects.filter(id => byId[id]).map(id => `<button data-open="${id}">${esc(byId[id].name)}</button>`).join('')}</div>
    </div>`).join('');
  $('#processSteps').innerHTML = PROCESS.map((s, i) => `<li>${pad(i + 1)} ${esc(s.verb)}</li>`).join('');
  processItems.push(...$$('.p-item'));
  processSteps.push(...$$('#processSteps li'));

  // ลายเส้นแต่ละบท: ทุกเส้นใช้ pathLength=1 แล้ววาดตาม scroll ผ่าน --t / --o
  const ln = (d, o, extra = '') => `<path class="ln" pathLength="1" d="${d}" style="--o:${o}" stroke="#0b0b0b" stroke-width="1.4" fill="none" ${extra}/>`;
  const tx = (x, y, s, o, size = 12, anchor = 'start') => `<text class="tx" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="#0b0b0b" style="--o:${o}">${s}</text>`;
  const rectD = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}Z`;
  const STAGES = [
    // design — wireframe
    `${tx(40, 40, 'FIG. 02 — DESIGN / WIREFRAME', 0, 12)}
     ${ln('M140 60H660M140 52v16M660 52v16', 0)}${tx(400, 52, '1440', .1, 11, 'middle')}
     ${ln(rectD(140, 90, 520, 380), 0)}${ln('M140 122H660', .05)}
     ${ln('M158 106h8M174 106h8M190 106h8', .08)}${ln('M520 106h40M572 106h40M624 106h20', .1)}
     ${ln(rectD(170, 146, 460, 110), .12)}${ln('M170 146 630 256M630 146 170 256', .2, 'stroke-width=".6"')}
     ${[170, 330, 490].map((x, i) => ln(rectD(x, 284, 140, 160), .2 + i * .06) + ln(rectD(x + 14, 298, 112, 64), .26 + i * .06, 'stroke-dasharray="1"') + ln(`M${x + 14} 382h90M${x + 14} 398h70M${x + 14} 414h50`, .3 + i * .06, 'stroke-width=".8"')).join('')}
     ${ln('M680 200h40M680 360h40', .35, 'stroke-width=".8"')}${tx(728, 204, 'hero', .4, 11)}${tx(728, 364, 'cards', .4, 11)}
     ${ln('M560 470v34l9-9 7 15 6-3-7-14h12z', .45)}`,
    // build — code → API → database
    `${tx(40, 40, 'FIG. 03 — BUILD / FRONTEND ↔ BACKEND ↔ DATABASE', 0, 12)}
     ${ln(rectD(100, 100, 330, 400), 0)}${ln('M100 132H430', .04)}${tx(116, 121, 'app.ts', .05, 11)}
     ${[[0, 120], [1, 180], [1, 150], [2, 120], [2, 160], [1, 90], [0, 60], [0, 0], [0, 140], [1, 200], [1, 110], [0, 50]].map(([ind, w], i) => w ? ln(`M${130 + ind * 24} ${160 + i * 26}h${w}`, .06 + i * .02, 'stroke-width="5" stroke-linecap="round" opacity=".85"') : '').join('')}
     ${ln('M434 200H516M506 194l10 6-10 6', .3)}${tx(475, 190, 'fetch', .35, 11, 'middle')}
     ${ln(rectD(520, 160, 180, 80), .32)}${tx(610, 205, 'REST API', .4, 13, 'middle')}
     ${ln('M610 240V318M604 308l6 10 6-10', .4)}
     ${ln('M530 340v100c0 12 36 22 80 22s80-10 80-22V340', .42)}${ln('M530 340c0-12 36-22 80-22s80 10 80 22-36 22-80 22-80-10-80-22z', .44)}
     ${ln('M530 380c0 12 36 22 80 22s80-10 80-22', .46, 'stroke-width=".8"')}${tx(610, 430, 'PostgreSQL', .5, 12, 'middle')}`,
    // ship — containers → pipeline → cloud
    `${tx(40, 40, 'FIG. 04 — SHIP / CONTAINER → CI/CD → SERVER', 0, 12)}
     ${[[90, 400], [210, 400], [150, 320]].map(([x, y], i) => ln(rectD(x, y, 110, 74), i * .05) + ln(`M${x + 22} ${y}v74M${x + 44} ${y}v74M${x + 66} ${y}v74M${x + 88} ${y}v74`, .05 + i * .05, 'stroke-width=".7"')).join('')}
     ${tx(205, 500, 'docker compose', .2, 11, 'middle')}
     ${ln('M330 437H380', .2)}
     ${[['build', 410], ['test', 510], ['deploy', 610]].map(([s, x], i) => ln(`M${x + 24} 437a24 24 0 1 1-48 0 24 24 0 1 1 48 0z`, .24 + i * .06) + tx(x, 488, s, .3 + i * .06, 11, 'middle') + (i < 2 ? ln(`M${x + 26} 437H${x + 74}`, .28 + i * .06) : '')).join('')}
     ${ln('M610 411V300M604 310l6-10 6 10', .42)}
     ${ln('M500 270a40 40 0 0 1 22-70 56 56 0 0 1 106-14 44 44 0 0 1 64 44 32 32 0 0 1-6 62H516a32 32 0 0 1-16-22z', .45)}
     ${tx(600, 252, 'VPS · Firebase', .55, 13, 'middle')}
     ${ln('M560 150l10-10M600 132v-14M640 150l-10-10', .6)}`,
  ];
  processArt.innerHTML = `
    <g stroke="#ebebe7" stroke-width=".6">${Array.from({ length: 17 }, (_, i) => `<path d="M${i * 50} 0V600"/>`).join('')}${Array.from({ length: 13 }, (_, i) => `<path d="M0 ${i * 50}H800"/>`).join('')}</g>
    ${STAGES.map((s, i) => `<g class="stage${i === 0 ? ' on' : ''}">${s}</g>`).join('')}`;
  const stageEls = $$('.stage', processArt);

  function updateProcess() {
    const r = processSec.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    if (span <= 0) { stageEls.forEach(g => g.style.setProperty('--t', 1)); return; }
    const p = clamp(-r.top / span) * PROCESS.length;
    const step = Math.min(PROCESS.length - 1, Math.floor(p));
    const local = reduceMotion ? 1 : clamp((p - step) / .6);
    processItems.forEach((el, i) => {
      el.classList.toggle('on', i === step);
      el.classList.toggle('past', i < step);
      $$('button', el).forEach(b => b.tabIndex = i === step ? 0 : -1);
    });
    processSteps.forEach((li, i) => {
      li.classList.toggle('on', i === step);
      li.style.setProperty('--fill', i < step ? 1 : i === step ? clamp(p - step) : 0);
    });
    stageEls.forEach((g, i) => {
      g.classList.toggle('on', i === step);
      g.style.setProperty('--t', i < step ? 1 : i === step ? local : 0);
    });
  }

  /* =========================================================
     CH.03 FLAGSHIP — แกลเลอรีเลื่อนแนวนอน (เลื่อนลง = เลื่อนไปทางขวา)
     ========================================================= */
  const flagSec = $('#works');
  const flagTrack = $('#flagTrack');
  const flagBar = $('#flagBar');
  const flagIndex = $('#flagIndex');
  $('#flagTotal').textContent = pad(featured.length);

  flagTrack.innerHTML = `
    <div class="fl-intro">
      <h2 class="split-title">Selected <span class="script">works</span></h2>
      <p>ผลงานเด่น ${featured.length} ชิ้น จากทั้งหมด ${ordered.length} ชิ้น — เลื่อนลงเพื่อดูทีละชิ้น กดที่ผลงานเพื่อเปิดรายละเอียด</p>
      <div class="hint"><i></i>scroll</div>
    </div>
    ${featured.map((p, i) => `
      <article class="fl-panel" data-open="${p.id}" tabindex="0" role="button" aria-label="ดูรายละเอียด ${esc(p.name)}">
        <div class="fl-media">${media(p)}<span class="fl-badge">${p.code} · ${esc(p.year || '—')}</span></div>
        <div class="fl-info">
          <div class="fl-no">${pad(i + 1)}</div>
          <div><div class="fl-cat">${esc(catById[p.cat].name)}</div><h3 class="fl-name">${esc(p.name)}</h3></div>
          <span class="pill fl-go">Discover <span>→</span></span>
          <p class="fl-desc">${esc(p.desc)}</p>
        </div>
      </article>`).join('')}
    <div class="fl-outro">
      <b>+${ordered.length - featured.length} more</b>
      <p class="section-lead">ผลงานที่เหลือทั้งหมดอยู่ในบทถัดไป แยกตามหมวดหมู่</p>
      <div><a class="pill pill--solid" href="#collection-sec">The collection <span>↓</span></a></div>
    </div>`;
  const flagPanels = $$('.fl-panel', flagTrack);
  let flagDist = 0;

  function measureFlag() {
    flagTrack.style.transform = 'none';
    const last = flagTrack.lastElementChild;
    const gutter = parseFloat(getComputedStyle(flagTrack).paddingLeft) || 0;
    flagDist = Math.max(0, last.offsetLeft + last.offsetWidth + gutter - window.innerWidth);
    flagSec.style.height = reduceMotion ? '' : `${flagDist + window.innerHeight}px`;
  }

  function updateFlag() {
    if (reduceMotion) return;
    const r = flagSec.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = span > 0 ? clamp(-r.top / span) : 0;
    flagTrack.style.transform = `translate3d(${(-flagDist * p).toFixed(1)}px, 0, 0)`;
    flagBar.style.transform = `scaleX(${p})`;
    let best = 0, bd = Infinity;
    flagPanels.forEach((el, i) => {
      const b = el.getBoundingClientRect();
      const c = b.left + b.width / 2 - window.innerWidth / 2;
      el.style.setProperty('--px', `${(-c * .06).toFixed(1)}px`);
      if (Math.abs(c) < bd) { bd = Math.abs(c); best = i; }
    });
    flagIndex.textContent = pad(best + 1);
  }

  // เปิดผลงานด้วยคีย์บอร์ด (Enter / Space) บน panel
  flagTrack.addEventListener('keydown', e => {
    const el = e.target.closest('.fl-panel');
    if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDetail(el.dataset.open, el); }
  });

  /* =========================================================
     FILTERS + GROUPED COLLECTION
     ========================================================= */
  const filters = $('#filters');
  const collection = $('#collection');

  filters.innerHTML = [{ id: 'all', name: 'All' }, ...CATEGORIES].map((c, i) => {
    const n = c.id === 'all' ? ordered.length : countIn(c.id);
    return `<button class="filter" role="tab" data-filter="${c.id}" aria-selected="${i === 0}">${esc(c.name)}<sup>${pad(n)}</sup></button>`;
  }).join('');

  collection.innerHTML = CATEGORIES.map((c, ci) => {
    const items = ordered.filter(p => p.cat === c.id);
    return `
      <section class="group" data-group="${c.id}" aria-labelledby="g-${c.id}">
        <header class="group-side reveal">
          <div class="group-num">${pad(ci + 1)}</div>
          <div class="group-code">${c.code}/ — ${esc(c.th)}</div>
          <h3 class="group-name" id="g-${c.id}">${esc(c.name)}</h3>
          <p class="group-desc">${esc(c.desc)}</p>
          <div class="group-count">${pad(items.length)} ${items.length > 1 ? 'projects' : 'project'}</div>
          <div class="group-meter"><i></i></div>
        </header>
        <div class="cards">
          ${items.map(p => `
            <button class="card reveal" data-open="${p.id}" aria-label="ดูรายละเอียด ${esc(p.name)}">
              <div class="card-media">${media(p)}</div>
              <div class="card-meta"><span>${p.code} · ${esc(p.id)}</span><span>${esc(p.year || '')}</span></div>
              <div class="card-name">${esc(p.name)}</div>
              <div class="card-th">${esc(p.th)}</div>
              <p class="card-desc">${esc(p.desc)}</p>
              <div class="card-tags">${p.stack.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            </button>`).join('')}
        </div>
      </section>`;
  }).join('');
  const groups = $$('.group', collection);

  // แถบความคืบหน้าในแต่ละหมวด (ขณะเลื่อนผ่านการ์ด)
  function updateGroups() {
    const vh = window.innerHeight;
    groups.forEach(g => {
      if (g.hidden) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--g', clamp((vh * .6 - r.top) / Math.max(1, r.height - vh * .3)).toFixed(3));
    });
  }

  function setFilter(id, scroll) {
    $$('.filter', filters).forEach(b => b.setAttribute('aria-selected', b.dataset.filter === id));
    $$('.group', collection).forEach(g => {
      g.hidden = id !== 'all' && g.dataset.group !== id;
      if (!g.hidden) $$('.reveal', g).forEach(el => el.classList.add('in'));
    });
    const active = $(`.filter[data-filter="${id}"]`, filters);
    if (active) filters.scrollTo({ left: active.offsetLeft - 20, behavior: 'smooth' });
    if (scroll) {
      const y = collection.getBoundingClientRect().top + window.scrollY - filters.offsetHeight - 20;
      if (window.scrollY > y || scroll === 'force') window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
  filters.addEventListener('click', e => {
    const b = e.target.closest('.filter');
    if (b) setFilter(b.dataset.filter, true);
  });

  /* =========================================================
     PROJECT DETAIL
     ========================================================= */
  const detail = $('#detail');
  const detailBody = $('#detailBody');
  let openId = null;
  let lastFocus = null;

  function renderDetail(p) {
    const c = catById[p.cat];
    const idx = ordered.indexOf(p);
    const prev = ordered[(idx - 1 + ordered.length) % ordered.length];
    const next = ordered[(idx + 1) % ordered.length];
    $('#detailCode').textContent = `${p.code} · ${pad(idx + 1)} / ${pad(ordered.length)}`;

    detailBody.innerHTML = `
      <div class="d-hero">
        <div class="d-media">
          <div class="d-main" id="dMain">${media(p, 0)}</div>
          ${p.images.length > 1 ? `<div class="d-thumbs">${p.images.map((src, i) => `
            <button class="${i === 0 ? 'active' : ''}" data-img="${i}" aria-label="รูปที่ ${i + 1}">
              <img src="${esc(src)}" alt="" loading="lazy" data-pid="${p.id}">
            </button>`).join('')}</div>` : ''}
        </div>
        <div class="d-info">
          <div class="d-path">${esc(p.path)}</div>
          <div class="d-cat">${esc(c.name)} <span class="th">— ${esc(c.th)}</span></div>
          <h2 class="d-title" id="detailTitle">${esc(p.name)}</h2>
          <div class="d-th">${esc(p.th)}</div>
          <p class="d-overview">${esc(p.overview || p.desc)}</p>

          <dl class="spec-table d-specs">
            <div class="spec-row"><dt>หมวดหมู่</dt><dd>${esc(c.name)}</dd></div>
            <div class="spec-row"><dt>ประเภท</dt><dd>${esc(p.type)}</dd></div>
            ${p.year ? `<div class="spec-row"><dt>ปี</dt><dd>${esc(p.year)}</dd></div>` : ''}
            <div class="spec-row"><dt>เทคโนโลยี</dt><dd class="card-tags">${p.stack.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</dd></div>
          </dl>

          ${p.highlights && p.highlights.length ? `
            <div class="d-sub">// highlights — จุดเด่น</div>
            <ol class="d-highlights">${p.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ol>` : ''}

          ${p.links.length ? `<div class="d-links">${p.links.map((l, i) => `
            <a class="pill${i === 0 ? ' pill--solid' : ''}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} <span>↗</span></a>`).join('')}</div>` : ''}
        </div>
      </div>
      <nav class="d-nav" aria-label="ผลงานอื่น">
        <button data-goto="${prev.id}"><small>← previous</small><strong>${esc(prev.name)}</strong></button>
        <button data-goto="${next.id}"><small>next →</small><strong>${esc(next.name)}</strong></button>
      </nav>`;
    $('#detailScroll').scrollTop = 0;
  }

  // อัปเดต URL ให้แชร์ลิงก์ผลงานได้ (บางเฟรม/เบราว์เซอร์ไม่อนุญาต ก็ข้ามไป)
  function setHash(h) {
    try { history.replaceState(null, '', h || location.pathname + location.search); } catch (e) { /* ignore */ }
  }

  function openDetail(id, opener) {
    const p = byId[id];
    if (!p) return;
    if (!detail.classList.contains('open')) lastFocus = opener || document.activeElement;
    openId = id;
    renderDetail(p);
    detail.classList.add('open');
    detail.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    setHash(`#work/${id}`);
    $('#detailClose').focus({ preventScroll: true, focusVisible: false });
  }

  function closeDetail() {
    if (!openId) return;
    openId = null;
    detail.classList.remove('open');
    detail.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    setHash('');
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open]');
    if (opener) { e.preventDefault(); openDetail(opener.dataset.open, opener); return; }
    const goto = e.target.closest('[data-goto]');
    if (goto) { openDetail(goto.dataset.goto); return; }
    const thumb = e.target.closest('[data-img]');
    if (thumb && openId) {
      const p = byId[openId];
      $('#dMain').innerHTML = media(p, +thumb.dataset.img);
      $$('.d-thumbs button').forEach(b => b.classList.toggle('active', b === thumb));
    }
  });
  $('#detailClose').addEventListener('click', closeDetail);

  document.addEventListener('keydown', e => {
    if (openId) {
      if (e.key === 'Escape') closeDetail();
      const idx = ordered.indexOf(byId[openId]);
      if (e.key === 'ArrowRight') openDetail(ordered[(idx + 1) % ordered.length].id);
      if (e.key === 'ArrowLeft') openDetail(ordered[(idx - 1 + ordered.length) % ordered.length].id);
      if (e.key === 'Tab') trapFocus(e, detail);
    } else if (menu.classList.contains('open')) {
      if (e.key === 'Escape') toggleMenu(false);
    }
  });

  function trapFocus(e, root) {
    const f = $$('a[href], button:not([tabindex="-1"])', root).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function fromHash() {
    const m = location.hash.match(/^#work\/(.+)$/);
    if (m && byId[m[1]]) openDetail(m[1]);
    else if (openId) closeDetail();
  }
  window.addEventListener('hashchange', fromHash);

  /* =========================================================
     CONSTELLATION — แผนที่ดาวของเทคโนโลยี
     ========================================================= */
  const starsSection = $('#skills');
  const starsPin = $('.stars-pin');
  const starsCanvas = $('#starsCanvas');
  const sctx = starsCanvas.getContext('2d');
  const tip = $('#starsTip');
  const catNodes = CATEGORIES.map(c => ({ type: 'cat', c, x: 0, y: 0 }));
  const techNodes = techs.map(t => ({ type: 'tech', t, x: 0, y: 0, phase: seeded(hashStr(t.name))() * 6.28 }));
  let dust = [], W = 0, H = 0, mobile = false, hovered = null, starsP = 0, starsVisible = false, rafId = 0;

  function layoutStars() {
    const r = starsPin.getBoundingClientRect();
    W = r.width; H = r.height;
    mobile = W < 900;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    starsCanvas.width = W * dpr;
    starsCanvas.height = H * dpr;
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const x0 = mobile ? 20 : W * .38, x1 = W - (mobile ? 20 : 60);
    const y0 = mobile ? H * .42 : H * .12, y1 = H - (mobile ? 30 : 70);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const rx = (x1 - x0) / 2 * (mobile ? .66 : .74), ry = (y1 - y0) / 2 * (mobile ? .62 : .7);
    const unit = Math.min(x1 - x0, y1 - y0);

    catNodes.forEach((n, i) => {
      if (mobile) {
        // มือถือ: วางสลับซ้าย-ขวาเป็นขั้นบันได ป้ายชื่อไม่ชนกัน
        n.x = i % 2 ? W * .74 : W * .2;
        n.y = y0 + 20 + i * (y1 - y0 - 40) / (catNodes.length - 1);
      } else {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / catNodes.length) + .3;
        n.x = cx + Math.cos(a) * rx;
        n.y = cy + Math.sin(a) * ry;
      }
    });
    const anchor = id => catNodes.find(n => n.c.id === id);

    techNodes.forEach(n => {
      const rnd = seeded(hashStr(n.t.name));
      const cs = [...n.t.cats].map(anchor);
      if (cs.length === 1) {
        const a = rnd() * Math.PI * 2, d = unit * (.09 + rnd() * .1);
        n.tx = cs[0].x + Math.cos(a) * d;
        n.ty = cs[0].y + Math.sin(a) * d;
      } else {
        n.tx = cs.reduce((s, c) => s + c.x, 0) / cs.length + (rnd() - .5) * 30;
        n.ty = cs.reduce((s, c) => s + c.y, 0) / cs.length + (rnd() - .5) * 30;
      }
      n.x = n.tx; n.y = n.ty;
    });

    // ดันจุด + ป้ายชื่อที่ซ้อนกันออกจากกัน (ใช้กล่องสี่เหลี่ยมของป้าย)
    sctx.font = `400 ${mobile ? 9.5 : 11}px "JetBrains Mono", monospace`;
    techNodes.forEach(n => {
      const s = 2 + Math.min(n.t.projects.length, 6) * .9;
      n.r = s * 2.3;
      n.lw = (!mobile || n.t.projects.length >= 2) ? sctx.measureText(n.t.name).width + 8 : 0;
    });
    const catFont = mobile ? 19 : 28;
    sctx.font = `italic 400 ${catFont}px "Instrument Serif", Georgia, serif`;
    catNodes.forEach(n => {
      const right = n.x >= W * (mobile ? .5 : .66);
      const w = sctx.measureText(n.c.name).width;
      n.right = right;
      n.box = right
        ? [n.x - 26 - w - 8, n.y - catFont * .9, n.x + 22, n.y + catFont * .5]
        : [n.x - 22, n.y - catFont * .9, n.x + 26 + w + 8, n.y + catFont * .5];
    });
    const boxOf = n => [n.x - n.r - 4, n.y - 9, n.x + n.r + 6 + n.lw, n.y + 9];
    const sep = (a, b) => {
      const ox = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
      const oy = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
      if (ox <= 0 || oy <= 0) return null;
      const ca = [(a[0] + a[2]) / 2, (a[1] + a[3]) / 2], cb = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
      return ox < oy * 2.2 ? [Math.sign(ca[0] - cb[0] || 1) * ox, 0] : [0, Math.sign(ca[1] - cb[1] || 1) * oy];
    };
    for (let it = 0; it < 220; it++) {
      for (let i = 0; i < techNodes.length; i++) {
        const a = techNodes[i];
        for (let j = i + 1; j < techNodes.length; j++) {
          const b = techNodes[j];
          const d = sep(boxOf(a), boxOf(b));
          if (d) { a.x += d[0] * .5; a.y += d[1] * .5; b.x -= d[0] * .5; b.y -= d[1] * .5; }
        }
        catNodes.forEach(c => {
          const d = sep(boxOf(a), c.box);
          if (d) { a.x += d[0]; a.y += d[1]; }
        });
      }
      techNodes.forEach(n => {
        n.x += (n.tx - n.x) * .015;
        n.y += (n.ty - n.y) * .015;
        n.x = clamp(n.x, x0, x1 - n.r - n.lw - 6);
        n.y = clamp(n.y, y0, y1);
      });
    }

    const rnd = seeded(7);
    dust = Array.from({ length: Math.round(W * H / 9000) }, () => ({ x: rnd() * W, y: rnd() * H, r: .4 + rnd() * .9, ph: rnd() * 6.28 }));
  }

  function isLit(n) {
    if (!hovered) return true;
    if (n === hovered) return true;
    if (hovered.type === 'tech' && n.type === 'cat') return hovered.t.cats.has(n.c.id);
    if (hovered.type === 'cat' && n.type === 'tech') return n.t.cats.has(hovered.c.id);
    return false;
  }

  function sparkle(x, y, L) {
    sctx.beginPath();
    sctx.moveTo(x, y - L);
    sctx.quadraticCurveTo(x, y, x + L, y);
    sctx.quadraticCurveTo(x, y, x, y + L);
    sctx.quadraticCurveTo(x, y, x - L, y);
    sctx.quadraticCurveTo(x, y, x, y - L);
    sctx.fill();
  }

  function drawStars(time) {
    const t = time / 1000;
    const p = reduceMotion ? 1 : starsP;
    sctx.clearRect(0, 0, W, H);

    // ฝุ่นดาว
    dust.forEach(d => {
      sctx.fillStyle = `rgba(11,11,11,${.1 + .08 * Math.sin(t * .8 + d.ph)})`;
      sctx.beginPath();
      sctx.arc(d.x, d.y, d.r, 0, 6.283);
      sctx.fill();
    });

    // เส้นเชื่อม
    techNodes.forEach((n, i) => {
      const ep = clamp((p - .1 - i * .006) / .3);
      if (ep <= 0) return;
      n.t.cats.forEach(id => {
        const c = catNodes.find(cn => cn.c.id === id);
        const lit = hovered && isLit(n) && isLit(c) && (hovered === n || hovered === c);
        sctx.strokeStyle = lit ? 'rgba(11,11,11,.8)' : `rgba(11,11,11,${hovered ? .05 : .16})`;
        sctx.lineWidth = lit ? 1.1 : .8;
        sctx.beginPath();
        sctx.moveTo(n.x, n.y);
        sctx.lineTo(lerp(n.x, c.x, ep), lerp(n.y, c.y, ep));
        sctx.stroke();
      });
    });

    // หมวดหมู่
    const ca = clamp((p - .02) / .12);
    catNodes.forEach(n => {
      const lit = isLit(n);
      sctx.globalAlpha = ca * (lit ? 1 : .25);
      sctx.strokeStyle = '#0b0b0b';
      sctx.lineWidth = 1;
      sctx.beginPath();
      sctx.arc(n.x, n.y, 15 + (n === hovered ? 3 : 0), 0, 6.283);
      sctx.stroke();
      sctx.fillStyle = n === hovered ? '#b8121b' : '#0b0b0b';
      sctx.beginPath();
      sctx.arc(n.x, n.y, 4, 0, 6.283);
      sctx.fill();

      const lx = n.x + (n.right ? -26 : 26);
      sctx.textAlign = n.right ? 'right' : 'left';
      sctx.fillStyle = '#858580';
      sctx.font = `400 ${mobile ? 9 : 10}px "JetBrains Mono", monospace`;
      sctx.fillText(`${n.c.code} · ${pad(countIn(n.c.id))}`, lx, n.y - (mobile ? 12 : 16));
      sctx.fillStyle = '#0b0b0b';
      sctx.font = `italic 400 ${mobile ? 19 : 28}px "Instrument Serif", Georgia, serif`;
      sctx.fillText(n.c.name, lx, n.y + (mobile ? 6 : 9));
      sctx.globalAlpha = 1;
    });

    // ดาวเทคโนโลยี
    techNodes.forEach((n, i) => {
      const a = clamp((p - .05 - i * .008) / .14);
      if (a <= 0) return;
      const lit = isLit(n);
      const count = n.t.projects.length;
      const s = 2 + Math.min(count, 6) * .9;
      const tw = reduceMotion ? 1 : 1 + .18 * Math.sin(t * 1.6 + n.phase);
      sctx.globalAlpha = a * (lit ? 1 : .18);
      sctx.fillStyle = n === hovered ? '#b8121b' : '#0b0b0b';
      if (count >= 3) {
        sctx.fillStyle = 'rgba(11,11,11,.05)';
        sctx.beginPath();
        sctx.arc(n.x, n.y, s * (mobile ? 2.8 : 4.2) * tw, 0, 6.283);
        sctx.fill();
        sctx.fillStyle = n === hovered ? '#b8121b' : '#0b0b0b';
      }
      sparkle(n.x, n.y, s * 2.3 * tw);
      sctx.beginPath();
      sctx.arc(n.x, n.y, s * .45, 0, 6.283);
      sctx.fill();

      if (!mobile || count >= 2 || n === hovered) {
        sctx.textAlign = 'left';
        sctx.fillStyle = lit ? '#3d3d3b' : '#858580';
        sctx.font = `400 ${mobile ? 9.5 : 11}px "JetBrains Mono", monospace`;
        sctx.fillText(n.t.name, n.x + s * 2.3 + 6, n.y + 4);
      }
      sctx.globalAlpha = 1;
    });
  }

  function starsLoop(time) {
    drawStars(time);
    rafId = starsVisible && !reduceMotion ? requestAnimationFrame(starsLoop) : 0;
  }

  function nodeAt(x, y) {
    let best = null, bd = Infinity;
    [...catNodes, ...techNodes].forEach(n => {
      const d = Math.hypot(n.x - x, n.y - y);
      const rad = n.type === 'cat' ? 30 : 20;
      if (d < rad && d < bd) { best = n; bd = d; }
    });
    return best;
  }

  function showTip(n) {
    if (!n) { tip.hidden = true; return; }
    if (n.type === 'tech') {
      tip.innerHTML = `<b>${esc(n.t.name)}</b><small>ใช้ใน ${n.t.projects.length} ผลงาน</small><ul>${n.t.projects.map(p => `<li>${esc(p.name)}</li>`).join('')}</ul>`;
    } else {
      tip.innerHTML = `<b>${esc(n.c.name)}</b><small>${esc(n.c.th)} · ${pad(countIn(n.c.id))} ผลงาน</small><ul><li>คลิกเพื่อดูผลงานในหมวดนี้</li></ul>`;
    }
    tip.hidden = false;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = n.x + 22, y = n.y + 18;
    if (x + tw > W - 12) x = n.x - tw - 22;
    if (y + th > H - 12) y = n.y - th - 18;
    tip.style.left = `${clamp(x, 12, W - tw - 12)}px`;
    tip.style.top = `${clamp(y, 12, H - th - 12)}px`;
  }

  function setHover(n) {
    if (n === hovered) return;
    hovered = n;
    starsCanvas.style.cursor = n && (n.type === 'cat' || n.t.projects.length === 1) ? 'pointer' : 'default';
    showTip(n);
    if (!rafId) drawStars(performance.now());
  }

  starsCanvas.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = starsCanvas.getBoundingClientRect();
    setHover(nodeAt(e.clientX - r.left, e.clientY - r.top));
  });
  starsCanvas.addEventListener('pointerleave', () => setHover(null));
  starsCanvas.addEventListener('click', e => {
    const r = starsCanvas.getBoundingClientRect();
    const n = nodeAt(e.clientX - r.left, e.clientY - r.top);
    if (!n) { setHover(null); return; }
    if (n.type === 'cat') { setHover(null); setFilter(n.c.id, 'force'); return; }
    if (hovered === n && n.t.projects.length === 1) { openDetail(n.t.projects[0].id); return; }
    if (n.t.projects.length === 1 && e.pointerType === 'mouse') { openDetail(n.t.projects[0].id); return; }
    setHover(n);
  });

  new IntersectionObserver(([en]) => {
    starsVisible = en.isIntersecting;
    if (starsVisible && !rafId) rafId = requestAnimationFrame(starsLoop);
  }).observe(starsSection);

  function updateStars() {
    const r = starsSection.getBoundingClientRect();
    const vh = window.innerHeight;
    starsP = clamp((vh * .6 - r.top) / (r.height * .55));
    if (reduceMotion) drawStars(0);
  }

  /* =========================================================
     SKILLS SPEC SHEET + GIT LOG
     ========================================================= */
  $('#specs').innerHTML = SKILLS.map((s, i) => `
    <div class="spec-line reveal">
      <div class="spec-n">${pad(i + 1)}</div>
      <div class="spec-k">${esc(s.key)}</div>
      <div class="spec-d">${esc(s.desc)}</div>
      <div class="spec-tags">${s.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    </div>`).join('');

  // git log: ผลงานที่ระบุปี เรียงจากใหม่ไปเก่า + การศึกษาเป็น commit แรก
  const shortHash = str => hashStr(str).toString(16).padStart(8, '0').slice(0, 7);
  const years = [...new Set(ordered.filter(p => p.year).map(p => p.year))].sort((a, b) => b - a);
  let headDone = false;
  $('#timeline').innerHTML = years.map(y => `
    <div class="commit-year reveal">${y}</div>
    ${ordered.filter(p => p.year === y).map(p => {
      const head = !headDone ? (headDone = true) : false;
      return `
      <div class="commit commit--project reveal">
        <div class="commit-graph"></div>
        <div class="commit-meta"><b>${shortHash(p.id)}</b>${head ? '<span class="head">(HEAD → main)</span>' : ''}<span class="type">${esc(p.type)}</span></div>
        <div>
          <button class="commit-role" data-open="${p.id}">${esc(p.name)}</button>
          <div class="commit-msg">feat(${catById[p.cat].code.toLowerCase()}): ${esc(p.th)}</div>
        </div>
        <div class="commit-chip">${esc(catById[p.cat].name)}</div>
      </div>`;
    }).join('')}`).join('') + EXPERIENCE.map(x => `
    <div class="commit-year reveal">${esc(x.date.split(/\s/)[0])}</div>
    <div class="commit reveal">
      <div class="commit-graph"></div>
      <div class="commit-meta"><b>${shortHash(x.role + x.org)}</b><span class="head">(initial commit)</span><span class="type">${esc(x.date)}</span></div>
      <div>
        <div class="commit-role">${esc(x.role)}</div>
        <div class="commit-org">${esc(x.org)}</div>
        <p class="commit-desc">${esc(x.desc)}</p>
      </div>
      <div class="commit-chip">${esc(x.chip)}</div>
    </div>`).join('');

  /* =========================================================
     MENU + FOOTER CATEGORY LINKS
     ========================================================= */
  $('#menuCats').innerHTML = CATEGORIES.map(c => `<li><a href="#collection-sec" data-cat="${c.id}">${esc(c.name)}<small>${pad(countIn(c.id))}</small></a></li>`).join('');
  $('#footerCats').insertAdjacentHTML('beforeend', CATEGORIES.map(c => `<a href="#collection-sec" data-cat="${c.id}">${esc(c.name)}</a>`).join(''));

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-cat]');
    if (!a) return;
    e.preventDefault();
    toggleMenu(false);
    setFilter(a.dataset.cat, 'force');
  });

  const menu = $('#menu');
  const menuBtn = $('#menuBtn');
  function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
    $('.menu-label').textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('lock', open);
    nav.classList.remove('hidden');
  }
  menuBtn.addEventListener('click', () => toggleMenu());
  $$('.menu-list a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* =========================================================
     NAV + CHAPTER RAIL + PROGRESS
     ========================================================= */
  const nav = $('#nav');
  const progressBar = $('#progressBar');
  let lastY = window.scrollY;
  function updateNav() {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 10);
    if (!menu.classList.contains('open')) {
      const hide = y > lastY && y > window.innerHeight * 3;
      nav.classList.toggle('hidden', hide);
      document.documentElement.classList.toggle('nav-shown', !hide);
    }
    lastY = y;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.transform = `scaleX(${clamp(y / max)})`;
  }

  const CHAPTERS = [
    ['hero', 'Prologue', 'home'], ['about', 'Hello, world', 'about'], ['process', 'How I work', 'process'],
    ['works', 'Flagship', 'flagship'], ['collection-sec', 'Collection', 'collection'], ['skills', 'Constellation', 'skills'],
    ['experience', 'git log', 'git-log'], ['faq', 'Q&A', 'faq'], ['contact', 'Contact', 'contact'],
  ];
  const rail = $('#rail');
  rail.innerHTML = CHAPTERS.map(([id, name], i) => `<a href="#${id === 'hero' ? 'top' : id}" data-ch="${id}"><span>${esc(name)}&nbsp;</span>${pad(i)}</a>`).join('');
  const navCurrent = $('#navCurrent');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target.id;
      const ch = CHAPTERS.find(c => c[0] === id);
      navCurrent.textContent = `~/${ch[2]}`;
      $$('a', rail).forEach(a => a.classList.toggle('active', a.dataset.ch === id));
      $$('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.section === id));
      en.target.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  CHAPTERS.forEach(([id]) => sectionObs.observe(document.getElementById(id)));

  /* =========================================================
     CH.01 MANIFESTO — คำค่อย ๆ สว่างขึ้นตามการเลื่อน
     ========================================================= */
  const manifesto = $('#manifesto');
  const mText = $('#manifestoText');
  const mMeter = $('#manifestoMeter');
  const rawText = mText.textContent.trim().replace(/\s+/g, ' ');
  const segmenter = window.Intl && Intl.Segmenter ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  const mParts = segmenter ? [...segmenter.segment(rawText)].map(s => s.segment) : rawText.split(/(\s+)/);
  const HL = /^(Frontend|Backend|UI|Database|ครบวงจร)$/;
  mText.innerHTML = mParts.map(w => /^\s+$/.test(w) ? w : `<span class="mw${HL.test(w) ? ' hl' : ''}">${esc(w)}</span>`).join('');
  const mWords = $$('.mw', mText);
  let mLast = -1;

  function updateManifesto() {
    const r = manifesto.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    const p = reduceMotion || span <= 0 ? 1 : clamp(-r.top / (span * .85));
    const n = Math.round(p * mWords.length);
    if (n !== mLast) {
      mWords.forEach((w, i) => w.classList.toggle('on', i < n));
      mLast = n;
    }
    mMeter.style.transform = `scaleX(${p})`;
  }

  /* =========================================================
     SPLIT TITLES — หัวข้อเลื่อนขึ้นจากหน้ากากทีละคำ
     ========================================================= */
  $$('.split-title').forEach(el => {
    let k = 0;
    const out = [];
    [...el.childNodes].forEach(node => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach(w => {
          if (!w) return;
          out.push(/^\s+$/.test(w) ? ' ' : `<span class="w"><span style="--i:${k++}">${esc(w)}</span></span>`);
        });
      } else {
        const free = node.classList && node.classList.contains('script');
        out.push(`<span class="w${free ? ' w--free' : ''}"><span style="--i:${k++}">${node.outerHTML}</span></span>`);
      }
    });
    el.innerHTML = out.join('');
  });

  /* =========================================================
     CH.07 ASKED BEFORE HIRING — คำถาม + เมฆตัวอักษร
     ========================================================= */
  const linkify = s => esc(s).replace(/\[\[([a-z0-9-]+)\]\]/g, (m, id) => byId[id] ? `<button data-open="${id}">${esc(byId[id].name)}</button>` : m);
  $('#faqList').innerHTML = FAQ.map((f, i) => `
    <details class="faq-item reveal"${i === 0 ? ' open' : ''}>
      <summary><small>${pad(i + 1)}</small><span>${esc(f.q)}</span><i></i></summary>
      <div class="faq-a">${linkify(f.a)}</div>
    </details>`).join('');

  // เมฆที่วาดด้วยตัวอักษร ASCII (value noise) — เวอร์ชัน developer ของเมฆ dither
  const faqSec = $('#faq');
  const faqCanvas = $('#faqCanvas');
  const fctx = faqCanvas.getContext('2d');
  const CHARS = ' .·:-=+*#';
  const h2 = (x, y) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const vnoise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y) => vnoise(x, y) * .55 + vnoise(x * 2.1, y * 2.1) * .3 + vnoise(x * 4.3, y * 4.3) * .15;
  let faqW = 0, faqH = 0, faqCell = 14, faqVisible = false, faqRaf = 0, faqLast = 0;

  function sizeFaq() {
    const r = faqSec.getBoundingClientRect();
    faqW = r.width; faqH = r.height;
    faqCell = faqW < 700 ? 13 : 15;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    faqCanvas.width = faqW * dpr;
    faqCanvas.height = faqH * dpr;
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFaq(performance.now());
  }

  function drawFaq(time) {
    const t = time / 1000;
    fctx.clearRect(0, 0, faqW, faqH);
    fctx.font = `${faqCell - 2}px "JetBrains Mono", monospace`;
    fctx.textAlign = 'center';
    fctx.textBaseline = 'middle';
    const cols = Math.ceil(faqW / faqCell), rows = Math.ceil(faqH / faqCell);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // เว้นกลางจอให้อ่านง่าย: เมฆหนาที่ขอบ บางตรงกลาง
        const dx = (x / cols - .5) * 2, dy = (y / rows - .5) * 2;
        const edge = clamp(Math.max(Math.abs(dx) * 1.25, Math.abs(dy) * .9) - .35, 0, 1);
        const n = fbm(x * .06 + t * .04, y * .09 - t * .015);
        const v = clamp((n - .42) / .32) * (.25 + edge * .95);
        const idx = Math.min(CHARS.length - 1, Math.floor(v * CHARS.length));
        if (idx <= 0) continue;
        fctx.fillStyle = `rgba(11,11,11,${(.08 + v * .2).toFixed(3)})`;
        fctx.fillText(CHARS[idx], x * faqCell + faqCell / 2, y * faqCell + faqCell / 2);
      }
    }
  }

  function faqLoop(time) {
    if (time - faqLast > 90) { drawFaq(time); faqLast = time; }
    faqRaf = faqVisible && !reduceMotion ? requestAnimationFrame(faqLoop) : 0;
  }
  new IntersectionObserver(([en]) => {
    faqVisible = en.isIntersecting;
    if (faqVisible && !faqRaf && !reduceMotion) faqRaf = requestAnimationFrame(faqLoop);
  }).observe(faqSec);

  /* =========================================================
     EPILOGUE — โลโก้ท้ายเว็บประกอบตัวจากพิกเซล
     ========================================================= */
  const fmWrap = $('#footerMark');
  const fmCanvas = $('#footerPixels');
  const fmCtx = fmCanvas.getContext('2d');
  let fmCells = [], fmLast = -1, fmW = 0, fmH = 0;

  function sizeFooterMark() {
    const r = fmWrap.getBoundingClientRect();
    fmW = r.width; fmH = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    fmCanvas.width = fmW * dpr;
    fmCanvas.height = fmH * dpr;
    fmCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const size = Math.max(10, Math.round(fmH / 14));
    const rnd = seeded(99);
    fmCells = [];
    for (let y = 0; y < fmH; y += size) for (let x = 0; x < fmW; x += size) {
      fmCells.push({ x, y, s: size, th: rnd() * .85 + (x / fmW) * .15 });
    }
    fmLast = -1;
  }

  function updateFooterMark() {
    const r = fmWrap.getBoundingClientRect();
    let q = reduceMotion ? 1 : clamp((window.innerHeight - r.top) / (r.height + window.innerHeight * .3));
    q = Math.round(q * 100) / 100;
    if (q === fmLast) return;
    fmLast = q;
    fmCtx.clearRect(0, 0, fmW, fmH);
    if (q >= 1) return;
    for (const c of fmCells) {
      if (c.th < q) continue;
      fmCtx.fillStyle = c.th < q + .05 ? '#0b0b0b' : '#f5f5f3';
      fmCtx.fillRect(c.x, c.y, c.s + .5, c.s + .5);
    }
  }

  /* =========================================================
     SCROLL / RESIZE LOOP
     ========================================================= */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateNav();
      updateHero();
      updateStars();
      updateProcess();
      updateManifesto();
      updateFlag();
      updateGroups();
      updateFooterMark();
    });
  }
  function onResize() {
    measureHero();
    measureFlag();
    layoutStars();
    sizeFaq();
    sizeFooterMark();
    lastQ = -1;
    updateHero();
    updateStars();
    updateProcess();
    updateManifesto();
    updateFlag();
    updateGroups();
    updateFooterMark();
    drawStars(performance.now());
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onResize, 120);
  });
  onResize();
  updateNav();
  // วาดใหม่หลังฟอนต์โหลดเสร็จ (ใช้ใน canvas)
  if (document.fonts) document.fonts.ready.then(() => { layoutStars(); drawStars(performance.now()); measureFlag(); updateFlag(); });

  /* =========================================================
     REVEAL ON SCROLL
     ========================================================= */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        revealObs.unobserve(en.target);
      }
    });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .chapter-mark, .split-title').forEach(el => revealObs.observe(el));

  /* =========================================================
     PRINT
     ========================================================= */
  const showAll = () => $$('.reveal').forEach(el => el.classList.add('in'));
  window.addEventListener('beforeprint', showAll);
  $('#printBtn').addEventListener('click', () => { showAll(); window.print(); });

  fromHash();
})();
