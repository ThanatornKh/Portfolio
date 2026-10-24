/* =========================================================
   PROJECTIONS — โฮโลแกรมหน้าจอผลงานจริงที่ชั้น Interface ฉายขึ้นมา
   เรื่องที่เล่า: "stack ที่ผมสร้าง → กลายเป็นระบบที่ใช้งานจริง"
   hologram shader: RGB split · scanline · แถบแสงกวาด · glitch เป็นจังหวะ · ขอบเรืองแสง
   ภาพมาจาก public/projects (โดเมนเดียวกัน จึงใช้เป็น texture ได้)
   ========================================================= */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { span } from '../lib/motion';
import { sceneProgress } from '../lib/store';
import { getWork } from '../data/derived';

// วางเรียงตามแกนขวาของมุมกล้องช่วงท้าย (≈ (0.73, 0, -0.68)) จอจึงไม่ทับกัน
const SCREENS = [
  { id: 'bp-parking', img: 'projects/bp-dashboard.jpg', pos: [-1.72, 2.2, 1.6], tilt: 0.12 },
  { id: 'fleet-management', img: 'projects/fleet-dashboard.jpg', pos: [0, 2.62, 0], tilt: 0 },
  { id: 'fx-multi-source-pipeline', img: 'projects/fx-dashboard.jpg', pos: [1.72, 2.2, -1.6], tilt: -0.12 },
] as const;
const W = 1.72;
const H = W * 0.625;
const EMITTER = new THREE.Vector3(0, 1.32, 0);

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform float uTime, uOpacity, uReveal, uSeed;
  uniform vec3 uTint;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 uv = vUv;
    // แถบ glitch แนวนอนสุ่มเป็นจังหวะ
    float tick = floor(uTime * 7. + uSeed * 10.);
    float band = step(.982, hash(floor(uv.y * 36.) + tick)) * step(.55, hash(tick + uSeed));
    uv.x += band * (hash(tick * 1.7) - .5) * .05;
    float split = .0022 + band * .012;
    vec3 col = vec3(
      texture2D(uMap, uv + vec2(split, 0.)).r,
      texture2D(uMap, uv).g,
      texture2D(uMap, uv - vec2(split, 0.)).b);
    float lum = dot(col, vec3(.299, .587, .114));
    vec3 holo = mix(col * .9, uTint * lum * 1.25, .45);
    float scan = .82 + .18 * sin(uv.y * 820. + uTime * 3.);
    float sweep = exp(-pow((fract(uTime * .14 + uSeed) - (1. - uv.y)) * 12., 2.)) * .35;
    vec2 e2 = abs(uv * 2. - 1.);
    float edge = max(smoothstep(.985, 1., e2.x), smoothstep(.975, 1., e2.y));
    float flicker = .94 + .06 * sin(uTime * 31. + uSeed * 9.) * sin(uTime * 7.3);
    // เปิดภาพจากบนลงล่าง พร้อมเส้นสแกนสว่างตรงขอบ
    float cut = 1. - uv.y;
    float shown = step(cut, uReveal);
    float lead = smoothstep(.04, 0., abs(cut - uReveal)) * step(uReveal, .999);
    vec3 c = (holo * scan * flicker + uTint * (sweep + edge * .9)) * shown + uTint * lead * 1.6;
    float a = uOpacity * max(shown * (.86 + edge * .14), lead);
    gl_FragColor = vec4(c, a);
  }`;

export default function Projections() {
  const base = import.meta.env.BASE_URL;
  const maps = useTexture(SCREENS.map(s => `${base}${s.img}`));
  const camera = useThree(s => s.camera);
  const screenRefs = useRef<(THREE.Group | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const mats = useMemo(
    () =>
      maps.map((map, i) => {
        map.colorSpace = THREE.SRGBColorSpace;
        map.anisotropy = 8;
        return new THREE.ShaderMaterial({
          uniforms: {
            uMap: { value: map },
            uTime: { value: 0 },
            uOpacity: { value: 0 },
            uReveal: { value: 0 },
            uSeed: { value: i * 0.37 },
            uTint: { value: new THREE.Color('#d6edf6') },
          },
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
          toneMapped: false,
        });
      }),
    [maps],
  );

  // ลำแสงจากชั้น Interface ไปยังมุมล่างของแต่ละจอ
  const beams = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SCREENS.length * 4 * 3), 3));
    const m = new THREE.LineBasicMaterial({ color: '#cfe8f2', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    return new THREE.LineSegments(g, m);
  }, []);

  useFrame(state => {
    const t = state.clock.elapsedTime;
    const proj = span(sceneProgress.hero, 0.5, 0.8);
    const pos = beams.geometry.getAttribute('position') as THREE.BufferAttribute;
    SCREENS.forEach((s, i) => {
      const g = screenRefs.current[i];
      if (!g) return;
      const k = span(proj, i * 0.14, 0.62 + i * 0.14);
      const e = 1 - Math.pow(1 - k, 3);
      g.visible = k > 0.001;
      g.position.set(s.pos[0] * (0.5 + 0.5 * e), THREE.MathUtils.lerp(EMITTER.y, s.pos[1], e) + Math.sin(t * 0.8 + i) * 0.03 * e, s.pos[2] * (0.5 + 0.5 * e));
      g.lookAt(camera.position);
      g.rotateY(s.tilt);
      g.scale.set(0.35 + 0.65 * e, Math.max(0.001, e), 1);
      const u = mats[i].uniforms;
      u.uTime.value = t;
      u.uOpacity.value = Math.min(1, k * 1.6);
      u.uReveal.value = span(k, 0.25, 1);
      const label = labelRefs.current[i];
      if (label) label.style.opacity = String(span(k, 0.7, 1));
      // มุมล่างซ้าย/ขวา (world) → ลำแสง
      g.updateMatrixWorld();
      [-1, 1].forEach((sx, j) => {
        tmp.set((sx * W) / 2, -H / 2, 0).applyMatrix4(g.matrixWorld);
        const o = (i * 4 + j * 2) * 3;
        pos.array[o] = EMITTER.x;
        pos.array[o + 1] = EMITTER.y;
        pos.array[o + 2] = EMITTER.z;
        pos.array[o + 3] = tmp.x;
        pos.array[o + 4] = tmp.y;
        pos.array[o + 5] = tmp.z;
      });
    });
    pos.needsUpdate = true;
    (beams.material as THREE.LineBasicMaterial).opacity = 0.28 * span(proj, 0.05, 0.4);
  });

  return (
    <>
      <primitive object={beams} />
      {SCREENS.map((s, i) => {
        const w = getWork(s.id);
        return (
          <group key={s.id} ref={el => { screenRefs.current[i] = el; }} visible={false}>
            <mesh material={mats[i]}>
              <planeGeometry args={[W, H]} />
            </mesh>
            <Html position={[-W / 2, -H / 2 - 0.08, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
              <div className="proj-label" ref={el => { labelRefs.current[i] = el; }} style={{ opacity: 0 }}>
                <b>{w?.code}</b> {w?.name} <em>· {w?.status}</em>
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}
