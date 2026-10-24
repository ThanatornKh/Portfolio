/* =========================================================
   HERO 3D — HOLOGRAPHIC ASSEMBLY (signature moment)
   โต๊ะทำงาน Developer แบบโฮโลแกรม: ชิ้นส่วนบินจากมุมกระจาย (exploded view)
   มาประกอบกันทีละชิ้น มีเส้นสแกนกวาดผ่าน วง HUD หมุน และ bloom เรืองแสง
   เลื่อนลง: กล้องบินจากมุม 3/4 เข้าไปในจอโค้ด แล้ว main.js ทำ pixel dissolve ต่อ
   - main.js เขียน progress ของ #hero ไว้ที่ --p และส่ง event 'boot:done'
   - ถ้าโหลดไม่ได้ ภาพลายเส้น SVG เดิมยังแสดงอยู่ (fallback)
   ========================================================= */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const hero = document.getElementById('hero');
const canvas = document.getElementById('heroCanvas');
if (hero && canvas) init().catch(err => { hero.classList.remove('hero-3d'); console.warn('hero3d', err); });

async function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => window.innerWidth < 900;
  const css = getComputedStyle(document.documentElement);
  const BG = new THREE.Color(css.getPropertyValue('--bg').trim() || '#04070d');
  const CYAN = new THREE.Color(css.getPropertyValue('--accent').trim() || '#36d6ff');
  const AMBER = new THREE.Color(css.getPropertyValue('--accent-2').trim() || '#ffb547');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  } catch (e) {
    return;
  }
  const DPR = Math.min(window.devicePixelRatio || 1, narrow() ? 1.5 : 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(BG, 1);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); hero.classList.remove('hero-3d'); });

  const scene = new THREE.Scene();
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 8, 22);
  const camera = new THREE.PerspectiveCamera(32, 1, .05, 60);

  /* ---------- hologram materials ---------- */
  const holoFace = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: CYAN }, uOpacity: { value: 0 }, uGain: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      precision mediump float;
      uniform vec3 uColor; uniform float uOpacity; uniform float uGain;
      varying vec3 vN; varying vec3 vV;
      void main() {
        float f = pow(1. - abs(dot(vN, vV)), 2.2);
        gl_FragColor = vec4(uColor, (.035 + f * .32) * uOpacity * uGain);
      }`,
  });
  // พื้นผิวใหญ่ ๆ (โต๊ะ) มองเฉียงแล้ว fresnel สว่างจัด จึงลด gain ลง
  const deskFace = holoFace.clone();
  deskFace.uniforms.uOpacity = holoFace.uniforms.uOpacity;
  deskFace.uniforms.uGain.value = .3;
  const mkLine = (color = CYAN, opacity = .9) => new THREE.LineBasicMaterial({
    color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    userData: { base: opacity },
  });
  const softLine = mkLine(CYAN, .35);
  const ambient = [softLine]; // วัสดุที่ค่อย ๆ จางเข้าพร้อมกัน

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- parts: ทุกชิ้นถูกบันทึกตำแหน่งจริงไว้ แล้วเริ่มจากมุมกระจาย ---------- */
  const parts = [];
  const rand = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  function part(obj, delay) {
    const lines = [];
    obj.traverse(o => { if (o.isLineSegments || o.isLine) lines.push(o); });
    const mat = mkLine(CYAN, .95);
    lines.forEach(l => { if (!l.userData.keep) l.material = mat; });
    const dir = new THREE.Vector3(rand() - .5, rand() * .8 + .1, rand() - .5).normalize();
    parts.push({
      obj, mat, delay,
      pos: obj.position.clone(), rot: obj.rotation.clone(),
      from: obj.position.clone().add(dir.multiplyScalar(2.2 + rand() * 2.2)),
      fromRot: new THREE.Euler(obj.rotation.x + (rand() - .5) * 2.4, obj.rotation.y + (rand() - .5) * 3, obj.rotation.z + (rand() - .5) * 2.4),
      t: reduce ? 1 : 0, flash: 0, locked: reduce,
    });
    world.add(obj);
    return obj;
  }
  function solid(geo, pos, rot, threshold = 20, face = holoFace) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, face));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, threshold), softLine));
    g.position.set(...pos);
    if (rot) g.rotation.set(...rot);
    return g;
  }
  const lineObj = (pts, mat) => {
    const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))), mat);
    return l;
  };

  /* ---------- floor grid + HUD rings ---------- */
  const grid = new THREE.GridHelper(26, 52, CYAN, CYAN);
  grid.material.transparent = true;
  grid.material.opacity = 0;
  grid.material.blending = THREE.AdditiveBlending;
  grid.material.depthWrite = false;
  grid.material.userData = { base: .1 };
  grid.position.y = -.9;
  ambient.push(grid.material);
  world.add(grid);

  function ring(r, segs, dash, mat) {
    const pts = [];
    for (let i = 0; i < segs; i++) {
      if (dash && i % dash[0] >= dash[1]) continue;
      const a0 = i / segs * Math.PI * 2, a1 = (i + 1) / segs * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a0) * r, Math.sin(a0) * r, 0), new THREE.Vector3(Math.cos(a1) * r, Math.sin(a1) * r, 0));
    }
    return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
  }
  const hudMat = mkLine(CYAN, .45);
  const hudAmber = mkLine(AMBER, .55);
  ambient.push(hudMat, hudAmber);
  const hud = new THREE.Group();
  const r1 = ring(1.25, 160, [8, 5], hudMat);
  const r2 = ring(1.42, 240, [40, 30], hudMat);
  const r3 = ring(1.55, 90, [3, 1], hudAmber);
  const ticks = new THREE.Group();
  for (let i = 0; i < 48; i++) {
    const a = i / 48 * Math.PI * 2, l = i % 4 ? .04 : .1;
    ticks.add(lineObj([[Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0], [Math.cos(a) * (1.62 + l), Math.sin(a) * (1.62 + l), 0]], hudMat));
  }
  hud.add(r1, r2, r3, ticks);
  hud.position.set(0, 1.02, -.32);
  world.add(hud);
  const floorRing = ring(2.4, 200, [6, 3], hudMat);
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.set(0, .002, .2);
  world.add(floorRing);

  /* ---------- desk ---------- */
  part(solid(new THREE.BoxGeometry(4.4, .06, 1.9), [0, -.03, .2], null, 20, deskFace), 0);
  [[-2.05, -.48, -.6], [2.05, -.48, -.6], [-2.05, -.48, 1.0], [2.05, -.48, 1.0]].forEach((p, i) => part(solid(new THREE.BoxGeometry(.06, .84, .06), p), .05 + i * .04));

  /* ---------- monitor ---------- */
  const SCREEN_W = 1.56, SCREEN_H = .88;
  part(solid(new THREE.BoxGeometry(.6, .025, .32), [0, .0125, -.04]), .25);
  part(solid(new THREE.BoxGeometry(.12, .5, .05), [0, .27, -.06]), .32);
  const monitor = part(solid(new THREE.BoxGeometry(1.7, 1.0, .06), [0, 1.02, 0]), .45);

  const sc = document.createElement('canvas');
  sc.width = 1280; sc.height = 722;
  const sctx = sc.getContext('2d');
  const screenTex = new THREE.CanvasTexture(sc);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  screenTex.anisotropy = 4;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, opacity: reduce ? 1 : 0, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
  screen.position.set(0, .02, .031);
  monitor.add(screen);

  const projectsCount = Number(hero.dataset.projects || 0);
  const CODE = [
    [['c', '// ~/thanatorn/portfolio.ts']],
    [['k', 'import'], ['p', ' { '], ['n', 'Developer'], ['p', ' } '], ['k', 'from'], ['s', " '@ku/it'"], ['p', ';']],
    [],
    [['k', 'const'], ['n', ' me'], ['p', ': '], ['n', 'Developer'], ['p', ' = {']],
    [['n', '  name'], ['p', ': '], ['s', "'Thanatorn Khwanmankong'"], ['p', ',']],
    [['n', '  role'], ['p', ': '], ['s', "'Full Stack Developer'"], ['p', ',']],
    [['n', '  stack'], ['p', ': ['], ['s', "'Next.js'"], ['p', ', '], ['s', "'React'"], ['p', ', '], ['s', "'Node.js'"], ['p', '],']],
    [['n', '  projects'], ['p', ': '], ['k', String(projectsCount || 23)], ['p', ',']],
    [['n', '  status'], ['p', ': '], ['s', "'open to internship'"], ['p', ',']],
    [['p', '};']],
    [],
    [['n', 'me'], ['p', '.'], ['n', 'build'], ['p', '('], ['s', "'your next idea'"], ['p', ');']],
  ];
  const COLORS = { c: '#55708a', k: '#ffb547', s: '#9ff0ff', n: '#36d6ff', p: '#8aa4ba' };
  const total = CODE.reduce((n, l) => n + l.reduce((m, [, t]) => m + t.length, 0) + 1, 0);
  try { await document.fonts.load('28px "JetBrains Mono"'); } catch (e) { /* fallback font */ }

  function drawScreen(n, caretOn) {
    sctx.fillStyle = '#03080f';
    sctx.fillRect(0, 0, sc.width, sc.height);
    sctx.strokeStyle = 'rgba(54,214,255,.25)';
    sctx.lineWidth = 2;
    sctx.strokeRect(1, 1, sc.width - 2, sc.height - 2);
    sctx.fillStyle = 'rgba(54,214,255,.07)';
    sctx.fillRect(0, 0, sc.width, 46);
    sctx.font = '20px "JetBrains Mono", monospace';
    sctx.fillStyle = '#8aa4ba';
    sctx.fillText('portfolio.ts — holo-os', 28, 30);
    sctx.fillStyle = '#36d6ff';
    sctx.fillText('● LIVE', sc.width - 110, 30);
    sctx.font = '28px "JetBrains Mono", monospace';
    const lh = 48, x0 = 104, y0 = 104;
    let left = n, cx = x0, cy = y0;
    for (let li = 0; li < CODE.length; li++) {
      if (left < 0 || (left === 0 && li > 0)) break;
      const y = y0 + li * lh;
      sctx.fillStyle = '#2b3e50';
      sctx.fillText(String(li + 1).padStart(2, ' '), 34, y);
      let x = x0;
      for (const [cls, text] of CODE[li]) {
        const piece = text.slice(0, Math.max(0, left));
        left -= piece.length;
        if (!piece) continue;
        sctx.fillStyle = COLORS[cls];
        sctx.fillText(piece, x, y);
        x += sctx.measureText(piece).width;
      }
      cx = x; cy = y;
      left -= 1;
    }
    if (caretOn) { sctx.fillStyle = '#ffb547'; sctx.fillRect(cx + 4, cy - 26, 16, 32); }
    sctx.fillStyle = 'rgba(54,214,255,.07)';
    sctx.fillRect(0, sc.height - 40, sc.width, 40);
    sctx.font = '18px "JetBrains Mono", monospace';
    sctx.fillStyle = '#55708a';
    sctx.fillText(`main ● TypeScript   UTF-8   ${projectsCount || 23} projects   holo-os v1.0`, 28, sc.height - 14);
    screenTex.needsUpdate = true;
  }

  /* ---------- keyboard ---------- */
  const kb = solid(new THREE.BoxGeometry(1.25, .035, .42), [0, .0175, .66]);
  {
    const keyGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(.068, .018, .068));
    const base = keyGeo.attributes.position.array;
    const pos = [];
    const addKey = (x, z, w = 1) => {
      for (let i = 0; i < base.length; i += 3) pos.push(base[i] * w + x, base[i + 1] + .027, base[i + 2] + z);
    };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) addKey(-.56 + c * .08, -.16 + r * .08);
    addKey(0, .16, 6.5);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const keys = new THREE.LineSegments(g, softLine);
    keys.userData.keep = true;
    kb.add(keys);
  }
  part(kb, .6);
  part(solid(new THREE.CapsuleGeometry(.05, .07, 4, 12), [1.0, .05, .66], [Math.PI / 2, 0, 0], 35), .7);

  /* ---------- mug + steam ---------- */
  const mug = new THREE.Group();
  mug.add(solid(new THREE.CylinderGeometry(.095, .085, .2, 28), [0, 0, 0]));
  mug.add(solid(new THREE.TorusGeometry(.055, .012, 6, 18, Math.PI), [.1, 0, 0], [0, 0, -Math.PI / 2]));
  const steam = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 3 + s) * .025 + (s - 1) * .04, t * .32, 0));
    }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), softLine);
    l.userData.keep = true;
    steam.add(l);
  }
  steam.position.y = .12;
  mug.add(steam);
  mug.position.set(-1.3, .1, .45);
  part(mug, .78);

  /* ---------- photo frame (monogram, or the real photo if CORS allows) ---------- */
  const photoFrame = solid(new THREE.BoxGeometry(.42, .54, .03), [-1.55, .3, -.2], [-.12, .38, 0]);
  const mc = document.createElement('canvas');
  mc.width = 256; mc.height = 330;
  const mctx = mc.getContext('2d');
  mctx.fillStyle = '#03080f'; mctx.fillRect(0, 0, 256, 330);
  mctx.strokeStyle = '#36d6ff'; mctx.lineWidth = 3;
  mctx.beginPath();
  mctx.moveTo(128, 70); mctx.lineTo(200, 96); mctx.lineTo(200, 170);
  mctx.quadraticCurveTo(200, 236, 128, 262); mctx.quadraticCurveTo(56, 236, 56, 170); mctx.lineTo(56, 96); mctx.closePath(); mctx.stroke();
  mctx.font = '64px "Michroma", "Chakra Petch", sans-serif'; mctx.fillStyle = '#9ff0ff'; mctx.textAlign = 'center'; mctx.fillText('TK', 128, 192);
  const frameTex = new THREE.CanvasTexture(mc);
  frameTex.colorSpace = THREE.SRGBColorSpace;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(.34, .46), new THREE.MeshBasicMaterial({ map: frameTex, transparent: true, opacity: .9 }));
  photo.position.set(0, 0, .016);
  photoFrame.add(photo);
  part(photoFrame, .9);
  const photoUrl = hero.dataset.photo;
  if (photoUrl) {
    new THREE.TextureLoader().setCrossOrigin('anonymous').load(photoUrl, tex => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const img = tex.image, a = img.width / img.height, target = .34 / .46;
      if (a > target) { tex.repeat.set(target / a, 1); tex.offset.set((1 - target / a) / 2, 0); }
      else { tex.repeat.set(1, a / target); tex.offset.set(0, 1 - a / target); }
      photo.material.map = tex; photo.material.needsUpdate = true;
    }, undefined, () => { /* blocked: keep monogram */ });
  }

  /* ---------- lamp ---------- */
  const lamp = new THREE.Group();
  lamp.add(solid(new THREE.CylinderGeometry(.16, .18, .04, 28), [0, .02, 0]));
  lamp.add(lineObj([[0, .04, 0], [-.15, .78, -.05], [-.15, .78, -.05], [.17, 1.25, .07]], softLine));
  lamp.add(solid(new THREE.SphereGeometry(.03, 10, 8), [-.15, .78, -.05], null, 40));
  lamp.add(solid(new THREE.ConeGeometry(.17, .26, 28, 1, true), [.21, 1.2, .11], [0, 0, -2.2]));
  lamp.position.set(1.65, 0, -.25);
  part(lamp, 1.0);

  /* ---------- dimension lines + labels ---------- */
  const dimMat = mkLine(AMBER, .85);
  ambient.push(dimMat);
  world.add(lineObj([[-.85, 1.62, .03], [.85, 1.62, .03], [-.85, 1.57, .03], [-.85, 1.67, .03], [.85, 1.57, .03], [.85, 1.67, .03]], dimMat));
  world.add(lineObj([[.98, .52, .03], [.98, 1.52, .03], [.93, .52, .03], [1.03, .52, .03], [.93, 1.52, .03], [1.03, 1.52, .03]], dimMat));
  const sprites = [];
  function label(text, pos, size = .085, color = '#9ff0ff') {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = '48px "JetBrains Mono", monospace';
    const w = Math.ceil(ctx.measureText(text).width) + 16;
    c.width = w; c.height = 64;
    ctx.font = '48px "JetBrains Mono", monospace';
    ctx.fillStyle = color; ctx.textBaseline = 'middle';
    ctx.fillText(text, 8, 34);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, userData: { base: 1 } });
    ambient.push(m);
    const s = new THREE.Sprite(m);
    s.scale.set(size * w / 64, size, 1);
    s.position.set(...pos);
    world.add(s);
    sprites.push(s);
  }
  label('1700', [0, 1.7, .03], .07, '#ffb547');
  label('1000', [1.14, 1.02, .03], .07, '#ffb547');
  label('01 DISPLAY ✓', [-.62, 1.66, .03], .062);
  label('02 INPUT ✓', [.55, .14, .95], .062);
  label('03 FUEL ✓', [-1.3, .64, .45], .062);
  label('04 DEVELOPER ✓', [-1.55, .7, -.2], .062);

  /* ---------- floating holo panels ---------- */
  function panelTexture(kind) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 320;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(4,14,24,.82)'; x.fillRect(0, 0, 512, 320);
    x.strokeStyle = '#36d6ff'; x.lineWidth = 2; x.strokeRect(1, 1, 510, 318);
    x.fillStyle = 'rgba(54,214,255,.12)'; x.fillRect(0, 0, 512, 36);
    x.font = '18px "JetBrains Mono", monospace'; x.fillStyle = '#9ff0ff';
    if (kind === 'chart') {
      x.fillText('fx_rates · THB', 16, 24);
      x.strokeStyle = 'rgba(54,214,255,.18)'; x.lineWidth = 1;
      for (let g = 0; g < 4; g++) { x.beginPath(); x.moveTo(24, 90 + g * 55); x.lineTo(490, 90 + g * 55); x.stroke(); }
      x.strokeStyle = '#ffb547'; x.lineWidth = 3; x.beginPath();
      for (let i = 0; i <= 40; i++) { const px = 24 + i * 11.6, py = 220 - Math.sin(i * .45) * 40 - i * 1.8 + Math.sin(i * 1.7) * 10; i ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.stroke();
    } else if (kind === 'git') {
      x.fillText('git log --graph', 16, 24);
      x.strokeStyle = '#36d6ff'; x.lineWidth = 2;
      x.beginPath(); x.moveTo(40, 60); x.lineTo(40, 300); x.stroke();
      x.beginPath(); x.moveTo(40, 120); x.quadraticCurveTo(80, 140, 80, 170); x.lineTo(80, 230); x.quadraticCurveTo(80, 250, 40, 270); x.stroke();
      [70, 120, 170, 230, 270].forEach((y, i) => {
        const cx = i === 2 || i === 3 ? 80 : 40;
        x.fillStyle = i === 0 ? '#ffb547' : '#03080f'; x.beginPath(); x.arc(cx, y, 8, 0, 7); x.fill(); x.stroke();
        x.fillStyle = '#b4c7d8'; x.fillText(['feat: holo hero', 'feat: collection', 'fix: mobile', 'feat: data', 'init'][i], 110, y + 6);
      });
    } else {
      x.fillText('terminal', 16, 24);
      x.font = '20px "JetBrains Mono", monospace';
      ['$ docker compose up -d', '✓ db  ✓ api  ✓ web', '$ npm run build', '✓ compiled in 2.1s', '$ git push origin main', '→ deploy: success'].forEach((t, i) => {
        x.fillStyle = t.startsWith('$') ? '#e6f3ff' : '#36d6ff'; x.fillText(t, 20, 74 + i * 40);
      });
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }
  const panels = [
    { kind: 'terminal', pos: [-2.45, 1.9, -1.9], rot: .34 },
    { kind: 'chart', pos: [2.5, 2.0, -1.6], rot: -.4 },
    { kind: 'git', pos: [-.3, 2.55, -2.6], rot: .05 },
  ].map(({ kind, pos, rot }, i) => {
    const m = new THREE.MeshBasicMaterial({ map: panelTexture(kind), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, userData: { base: .95 } });
    ambient.push(m);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .75), m);
    mesh.position.set(...pos);
    mesh.rotation.y = rot;
    mesh.userData = { base: pos.slice(), phase: i * 2.1 };
    world.add(mesh);
    return mesh;
  });

  /* ---------- scan plane (กวาดผ่านระหว่างประกอบ) ---------- */
  const scanMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), scanMat);
  scan.rotation.x = -Math.PI / 2;
  scan.position.z = .2;
  const scanEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(5.2, 2.6)), mkLine(CYAN, 1));
  scan.add(scanEdge);
  world.add(scan);

  /* ---------- camera path: มุม 3/4 → หน้าจอ → เข้าไปในจอ ---------- */
  const screenZ = .031, screenY = 1.04;
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.9, 2.35, 6.6),
    new THREE.Vector3(2.0, 1.75, 4.6),
    new THREE.Vector3(.35, 1.2, 2.7),
    new THREE.Vector3(0, screenY, screenZ + 1.25),
    new THREE.Vector3(0, screenY, screenZ + .62),
  ], false, 'catmullrom', .5);
  const look = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.15, .75, 0),
    new THREE.Vector3(-.05, .9, 0),
    new THREE.Vector3(0, 1.0, 0),
    new THREE.Vector3(0, screenY, 0),
    new THREE.Vector3(0, screenY, 0),
  ]);
  const introFrom = new THREE.Vector3(6.5, 4.2, 11);

  /* ---------- post-processing: bloom ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .85, .5, .12);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H, false);
    composer.setPixelRatio(narrow() ? 1 : DPR);
    composer.setSize(W, H);
    bloom.resolution.set(W * (narrow() ? .5 : .75), H * (narrow() ? .5 : .75));
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- state + loop (lerp แบบไม่ขึ้นกับ framerate) ---------- */
  const damp = (cur, target, ease, dt) => cur + (target - cur) * (1 - Math.pow(1 - ease, dt * 60));
  const easeOutExpo = t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
  const state = { p: 0, intro: reduce ? 1 : 0, mx: 0, my: 0, tmx: 0, tmy: 0, typed: reduce ? total : 0, fade: reduce ? 1 : 0 };
  let started = reduce, startAt = 0, typingAt = 0;
  const clock = new THREE.Clock();
  const start = () => { if (!started) { started = true; startAt = clock.elapsedTime; } };
  if (document.documentElement.classList.contains('booted')) start();
  window.addEventListener('boot:done', start, { once: true });
  window.addEventListener('pointermove', e => {
    state.tmx = e.clientX / window.innerWidth * 2 - 1;
    state.tmy = e.clientY / window.innerHeight * 2 - 1;
  }, { passive: true });

  // เริ่มต้น: ชิ้นส่วนอยู่ในตำแหน่งกระจาย
  if (!reduce) parts.forEach(pt => { pt.obj.position.copy(pt.from); pt.obj.rotation.copy(pt.fromRot); pt.obj.scale.setScalar(.5); });

  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const ASSEMBLE = 1.15; // วินาทีต่อชิ้น
  let running = false, visible = true, assembledAt = -1;

  function frame() {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    const t = clock.elapsedTime;
    const since = started ? t - startAt : 0;
    if (started) {
      state.intro = damp(state.intro, 1, .03, dt);
      state.fade = damp(state.fade, 1, .06, dt);
    }
    const pTarget = parseFloat(hero.style.getPropertyValue('--p')) || 0;
    state.p = reduce ? pTarget : damp(state.p, pTarget, .12, dt);
    state.mx = damp(state.mx, state.tmx, .05, dt);
    state.my = damp(state.my, state.tmy, .05, dt);

    /* assembly */
    let allLocked = true;
    for (const pt of parts) {
      if (!pt.locked) {
        const k = started ? Math.min(1, Math.max(0, (since - pt.delay * 1.25) / ASSEMBLE)) : 0;
        pt.t = k;
        const e = easeOutExpo(k);
        pt.obj.position.lerpVectors(pt.from, pt.pos, e);
        pt.obj.rotation.set(
          pt.fromRot.x + (pt.rot.x - pt.fromRot.x) * e,
          pt.fromRot.y + (pt.rot.y - pt.fromRot.y) * e,
          pt.fromRot.z + (pt.rot.z - pt.fromRot.z) * e);
        pt.obj.scale.setScalar(.5 + .5 * e);
        if (k >= 1) { pt.locked = true; pt.flash = 1; }
        else allLocked = false;
      }
      pt.flash = Math.max(0, pt.flash - dt * 1.8);
      const flicker = pt.locked ? 1 : .55 + .45 * Math.sin(t * 40 + pt.delay * 9);
      pt.mat.opacity = Math.min(1, (pt.mat.userData.base * flicker + pt.flash * .9) * Math.min(1, pt.t * 3 + (reduce ? 1 : 0)));
      pt.mat.color.copy(CYAN).lerp(AMBER, pt.flash * .85);
    }
    if (allLocked && assembledAt < 0) assembledAt = t;
    holoFace.uniforms.uOpacity.value = state.fade;
    ambient.forEach(m => { m.opacity = m.userData.base * state.fade; });
    screenMat.opacity = reduce ? 1 : Math.min(1, Math.max(0, (since - .9) * 1.5));

    /* scan plane: sweeps while assembling, then every few seconds */
    const scanCycle = assembledAt < 0 ? Math.min(1, since / 2.8) : ((t - assembledAt) % 7) / 2.2;
    if (scanCycle <= 1 && !reduce && started) {
      scan.position.y = -.1 + scanCycle * 2.0;
      const a = Math.sin(scanCycle * Math.PI);
      scanMat.opacity = a * (assembledAt < 0 ? .1 : .04);
      scanEdge.material.opacity = a * (assembledAt < 0 ? .9 : .35);
    } else {
      scanMat.opacity = 0; scanEdge.material.opacity = 0;
    }

    /* typing after the screen has assembled */
    if (since > 1.4 && state.typed < total && t - typingAt > .03) { state.typed += 2; typingAt = t; drawScreen(state.typed, true); }
    else if (Math.floor(t * 2) !== Math.floor((t - dt) * 2)) drawScreen(state.typed, Math.floor(t * 2) % 2 === 0);

    /* HUD motion */
    r1.rotation.z = t * .25; r2.rotation.z = -t * .12; r3.rotation.z = t * .06; ticks.rotation.z = -t * .03;
    floorRing.rotation.z = t * .05;
    panels.forEach(m => {
      const b = m.userData.base;
      m.position.y = b[1] + Math.sin(t * .6 + m.userData.phase) * .06;
    });
    steam.children.forEach((s, i) => { s.position.y = ((t * .12 + i * .1) % .12) - .06; });

    /* camera: 0.04 → 0.7 of the hero scroll flies along the path into the screen */
    const e0 = Math.min(1, Math.max(0, (state.p - .04) / .66));
    const e = e0 < .5 ? 4 * e0 * e0 * e0 : 1 - Math.pow(-2 * e0 + 2, 3) / 2;
    path.getPointAt(e, camPos);
    look.getPointAt(e, camLook);
    const k = 1 - e;
    camPos.x += state.mx * .45 * k;
    camPos.y += -state.my * .25 * k;
    if (state.intro < 1) camPos.lerpVectors(introFrom, camPos, 1 - Math.pow(1 - state.intro, 3));
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    hud.visible = e < .85;
    panels.forEach(m => { m.material.opacity = m.material.userData.base * state.fade * (1 - Math.min(1, e * 1.4)); });

    const off = 1 - Math.min(1, e * 1.6);
    if (narrow()) camera.setViewOffset(W, H, 0, -H * .17 * off, W, H);
    else camera.setViewOffset(W, H, -W * .2 * off, H * .02 * off, W, H);

    // ลด bloom ตอนเข้าใกล้จอ ให้อ่านโค้ดได้ชัด
    bloom.strength = (narrow() ? .65 : .85) * (1 - e * .8);
    composer.render(dt);
  }

  function loop() {
    if (!running) return;
    if (started) frame(); // ระหว่าง boot ฉากถูกบังอยู่ ไม่ต้องเรนเดอร์ซ้ำ (warm-up ทำไปแล้วตอน init)
    requestAnimationFrame(loop);
  }
  const setRunning = on => {
    const was = running;
    running = on && visible && !reduce;
    if (running && !was) { clock.getDelta(); requestAnimationFrame(loop); }
  };
  let inView = true;
  new IntersectionObserver(([en]) => { inView = en.isIntersecting; setRunning(inView); }).observe(hero);
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; setRunning(inView); });

  drawScreen(state.typed, true);
  renderer.compile(scene, camera);
  frame();
  hero.classList.add('hero-3d');
  window.dispatchEvent(new Event('hero3d:ready'));
  if (reduce) { state.fade = 1; frame(); }
}
