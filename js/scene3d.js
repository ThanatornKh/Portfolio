/* =========================================================
   CH.03 FROM DATA TO DEPLOY — อนุภาค 3D เปลี่ยนรูปตามการเลื่อน
   cloud (ข้อมูลดิบ) → helix (pipeline) → neural (โมเดล) → globe (ระบบจริง)
   main.js เป็นคนคำนวณ progress ของ section แล้วเขียนไว้ที่ --p
   ไฟล์นี้แค่วาด ถ้าโหลด three.js หรือ WebGL ไม่ได้ หน้าเว็บยังใช้งานได้ตามปกติ
   ========================================================= */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const sec = document.getElementById('ai');
const canvas = document.getElementById('neuralCanvas');
if (sec && canvas) init();

function init() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth < 900;
  const N = mobile ? 2600 : 6000;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    sec.classList.add('no-3d');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xffffff, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(0, 0, 8);

  /* ---------- procedural shapes (same particle count each) ---------- */
  let seed = 2568;
  const rnd = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;

  function cloud() {
    const a = new Float32Array(N * 3);
    const centers = Array.from({ length: 6 }, () => [gauss() * 2, gauss() * 1.4, gauss() * 1.2]);
    for (let i = 0; i < N; i++) {
      let x, y, z;
      if (rnd() < .55) {
        const c = centers[i % centers.length];
        x = c[0] + gauss() * .45; y = c[1] + gauss() * .45; z = c[2] + gauss() * .45;
      } else {
        const r = 2.6 * Math.cbrt(rnd()), th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
        x = r * Math.sin(ph) * Math.cos(th) * 1.25; y = r * Math.cos(ph) * .85; z = r * Math.sin(ph) * Math.sin(th);
      }
      a.set([x, y, z], i * 3);
    }
    return a;
  }

  function helix() {
    const a = new Float32Array(N * 3);
    const strand = (t, phase) => {
      const ang = t * Math.PI * 6 + phase;
      return [(t - .5) * 5.4, Math.cos(ang) * 1.05, Math.sin(ang) * 1.05];
    };
    for (let i = 0; i < N; i++) {
      let p;
      if (rnd() < .82) {
        p = strand(rnd(), rnd() < .5 ? 0 : Math.PI);
      } else {
        const t = (Math.floor(rnd() * 28) + .5) / 28;
        const A = strand(t, 0), B = strand(t, Math.PI), u = rnd();
        p = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u];
      }
      a.set([p[0] + gauss() * .035, p[1] + gauss() * .035, p[2] + gauss() * .035], i * 3);
    }
    return a;
  }

  function neural() {
    const a = new Float32Array(N * 3);
    const layersX = [-2.3, -.8, .8, 2.3], counts = [5, 8, 8, 3];
    const nodes = layersX.map((x, l) => Array.from({ length: counts[l] }, (_, k) => [
      x, (k - (counts[l] - 1) / 2) * (3.4 / Math.max(counts[l] - 1, 1)) * (counts[l] > 1 ? 1 : 0), (rnd() - .5) * .5,
    ]));
    const all = nodes.flat();
    for (let i = 0; i < N; i++) {
      let p;
      if (rnd() < .42) {
        const n = all[Math.floor(rnd() * all.length)];
        const r = .1 * Math.cbrt(rnd()), th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
        p = [n[0] + r * Math.sin(ph) * Math.cos(th), n[1] + r * Math.cos(ph), n[2] + r * Math.sin(ph) * Math.sin(th)];
      } else {
        const l = Math.floor(rnd() * 3);
        const A = nodes[l][Math.floor(rnd() * counts[l])], B = nodes[l + 1][Math.floor(rnd() * counts[l + 1])], u = rnd();
        p = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u + gauss() * .008, A[2] + (B[2] - A[2]) * u];
      }
      a.set(p, i * 3);
    }
    return a;
  }

  function globe() {
    const a = new Float32Array(N * 3);
    const nSphere = Math.floor(N * .76), golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      let p;
      if (i < nSphere) {
        const y = 1 - (i / (nSphere - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
        p = [Math.cos(th) * r * 1.6, y * 1.6, Math.sin(th) * r * 1.6];
      } else {
        const ring = i % 2, t = rnd() * Math.PI * 2, R = ring ? 2.25 : 1.95, tilt = ring ? .35 : -.6;
        const x = Math.cos(t) * R, z = Math.sin(t) * R;
        p = [x, z * Math.sin(tilt), z * Math.cos(tilt)];
      }
      a.set(p, i * 3);
    }
    return a;
  }

  const shapes = [cloud(), helix(), neural(), globe()];
  const rand = new Float32Array(N), rand2 = new Float32Array(N);
  for (let i = 0; i < N; i++) { rand[i] = rnd(); rand2[i] = rnd(); }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(shapes[0], 3));
  shapes.forEach((s, i) => geo.setAttribute(`aP${i}`, new THREE.BufferAttribute(s, 3)));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.setAttribute('aRand2', new THREE.BufferAttribute(rand2, 1));

  const uniforms = {
    uMorph: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: mobile ? 22 : 26 },
    uDpr: { value: renderer.getPixelRatio() },
    uInk: { value: new THREE.Color('#0b0b0b') },
    uAccent: { value: new THREE.Color('#b8121b') },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */`
      uniform float uMorph, uTime, uSize, uDpr;
      attribute vec3 aP0, aP1, aP2, aP3;
      attribute float aRand, aRand2;
      varying float vAlpha, vAcc;
      vec3 pick(float i) { return i < .5 ? aP0 : i < 1.5 ? aP1 : i < 2.5 ? aP2 : aP3; }
      void main() {
        float seg = floor(min(uMorph, 2.999));
        float t = clamp((uMorph - seg - aRand * .3) / .7, 0., 1.);
        t = t * t * (3. - 2. * t);
        vec3 p = mix(pick(seg), pick(seg + 1.), t);
        // ระหว่างเปลี่ยนรูป อนุภาคลอยออกเล็กน้อยแล้วค่อยเข้าที่
        float swirl = sin(t * 3.14159) * .35;
        p += swirl * vec3(sin(aRand * 40.), cos(aRand2 * 40.), sin(aRand * 23.));
        p += .018 * vec3(sin(uTime * 1.3 + aRand * 40.), cos(uTime * 1.1 + aRand2 * 30.), sin(uTime * .9 + aRand * 20.));
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_PointSize = uSize * uDpr * (.55 + aRand2 * .7) / -mv.z;
        gl_Position = projectionMatrix * mv;
        vAlpha = smoothstep(12., 5.5, -mv.z) * (.35 + .65 * aRand2);
        vAcc = step(.965, aRand);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uInk, uAccent;
      varying float vAlpha, vAcc;
      void main() {
        float d = length(gl_PointCoord - .5);
        if (d > .5) discard;
        float a = smoothstep(.5, .15, d) * vAlpha;
        gl_FragColor = vec4(mix(uInk, uAccent, vAcc), a);
      }`,
  });

  const points = new THREE.Points(geo, material);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  /* ---------- sizing ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const narrow = w < 900;
    group.position.set(narrow ? 0 : 1.55, narrow ? -1.2 : -.1, 0);
    group.scale.setScalar(narrow ? Math.min(.95, camera.aspect * 1.2) : Math.min(.92, camera.aspect / 1.75));
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- input + loop ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', e => {
    mouse.tx = e.clientX / window.innerWidth - .5;
    mouse.ty = e.clientY / window.innerHeight - .5;
  }, { passive: true });

  const shapeEl = document.getElementById('neuralShape');
  const countEl = document.getElementById('neuralCount');
  if (countEl) countEl.textContent = `${N.toLocaleString('en-US')} pts`;
  const SHAPES = ['signal.cloud', 'etl.helix', 'cnn.layers', 'prod.globe'];

  const progress = () => parseFloat(sec.style.getPropertyValue('--p')) || 0;
  const target = p => {
    // แต่ละรูปค้างไว้ช่วงหนึ่ง แล้วค่อยเปลี่ยนไปรูปถัดไป
    const x = Math.min(p, .9999) * 4, act = Math.floor(x), f = x - act;
    const e = Math.min(1, Math.max(0, (f - .5) / .42));
    return Math.min(3, act + e * e * (3 - 2 * e));
  };

  let morph = reduce ? 3 : 0, running = false, last = 0;
  const clock = new THREE.Clock();

  function frame() {
    const t = clock.getElapsedTime();
    const goal = reduce ? 3 : target(progress());
    morph += (goal - morph) * .1;
    uniforms.uMorph.value = morph;
    uniforms.uTime.value = t;
    mouse.x += (mouse.tx - mouse.x) * .05;
    mouse.y += (mouse.ty - mouse.y) * .05;
    group.rotation.y = (reduce ? -.3 : -.3 + Math.sin(t * .15) * .32) + mouse.x * .45;
    group.rotation.x = .12 + Math.sin(t * .2) * .06 + mouse.y * .25;
    renderer.render(scene, camera);
    const idx = Math.min(3, Math.round(morph));
    if (shapeEl && idx !== last) { shapeEl.textContent = SHAPES[idx]; last = idx; }
  }

  function loop() {
    if (!running) return;
    frame();
    requestAnimationFrame(loop);
  }

  new IntersectionObserver(([en]) => {
    if (reduce) { frame(); return; }
    running = en.isIntersecting;
    if (running) { clock.getDelta(); requestAnimationFrame(loop); }
  }).observe(sec);

  sec.classList.add('has-3d');
  frame();
}
