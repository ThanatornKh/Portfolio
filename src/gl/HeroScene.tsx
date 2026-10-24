/* =========================================================
   HERO SCENE — "STACK CORE"
   ชิป 4 ชั้นแทน full stack: INFRA · DATA · LOGIC · INTERFACE
   - หลัง preloader: ชิ้นส่วนบินมาประกอบทีละชั้น (assembly) + แฟลชตอนล็อก
   - เลื่อนลง: ชั้นแยกออกแบบ exploded view พร้อมป้ายเทคโนโลยี
   - เลื่อนต่อ: ชั้น Interface ฉายโฮโลแกรมหน้าจอผลงานจริงขึ้นมา (Projections.tsx)
   - ค่าที่เปลี่ยนทุกเฟรมเก็บใน ref/อ็อบเจกต์ ไม่ใช้ setState ใน useFrame (r3f-best-practices)
   ========================================================= */
import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Grid, Html, Lightformer, RoundedBox, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { gsap, reduceMotion, span } from '../lib/motion';
import { sceneProgress, spins, useUI } from '../lib/store';
import { stepSpin } from '../lib/useDragRotate';
import { dieTexture, scanTexture, socketTexture, traceTexture, uiTexture } from './textures';
import Projections from './Projections';

const ICE = new THREE.Color('#cfe8f2'); // เส้นเรืองแสงสีขาวอมฟ้า (ไม่ใช่นีออน)
const STEEL = new THREE.Color('#8fa3b0');

interface LayerDef {
  key: string;
  no: string;
  name: string;
  techs: string;
  y: number; // ตำแหน่งตอนประกอบ
  ey: number; // ตำแหน่งตอนแยก
  rot: number;
  half: number;
}

export const LAYERS: LayerDef[] = [
  { key: 'infra', no: 'L1', name: 'Infrastructure', techs: 'Docker · GitHub Actions · Nginx · VPS', y: 0, ey: -1.2, rot: 0, half: 1.75 },
  { key: 'data', no: 'L2', name: 'Data', techs: 'PostgreSQL · Redis · Prisma · DuckDB', y: 0.2, ey: -0.38, rot: 0.06, half: 1.5 },
  { key: 'logic', no: 'L3', name: 'Logic / API', techs: 'Node.js · Express · Server Actions · Zod', y: 0.275, ey: 0.44, rot: -0.05, half: 0.75 },
  { key: 'ui', no: 'L4', name: 'Interface', techs: 'Next.js · React · Expo · Tailwind', y: 0.43, ey: 1.26, rot: 0.08, half: 1.25 },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/* ---------- ชิป ---------- */
function Chip() {
  const booted = useUI(s => s.booted);
  const groupRef = useRef<THREE.Group>(null);
  const layerRefs = useRef<(THREE.Group | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const connRef = useRef<THREE.Group>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const intro = useRef({ a: reduceMotion ? 1 : 0, b: reduceMotion ? 1 : 0, c: reduceMotion ? 1 : 0, d: reduceMotion ? 1 : 0 });
  const flash = useRef([0, 0, 0, 0]);
  const locked = useRef([reduceMotion, reduceMotion, reduceMotion, reduceMotion]);
  const tex = useMemo(() => ({ trace: traceTexture(), socket: socketTexture(), die: dieTexture(), ui: uiTexture(), scan: scanTexture() }), []);

  const mats = useMemo(() => {
    const base = new THREE.MeshStandardMaterial({ color: '#0b111b', metalness: 0.85, roughness: 0.32, emissive: ICE, emissiveMap: tex.socket, emissiveIntensity: 0.55 });
    const pcb = new THREE.MeshStandardMaterial({ color: '#101317', metalness: 0.6, roughness: 0.38, emissive: ICE, emissiveMap: tex.trace, emissiveIntensity: 0.9 });
    const die = new THREE.MeshPhysicalMaterial({
      color: '#1b2133',
      metalness: 1,
      roughness: 0.16,
      iridescence: 1,
      iridescenceIOR: 1.6,
      iridescenceThicknessRange: [120, 820],
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      emissive: STEEL,
      emissiveMap: tex.die,
      emissiveIntensity: 0.7,
    });
    const glass = new THREE.MeshPhysicalMaterial({ color: '#e8f4f8', metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.12, depthWrite: false });
    const ui = new THREE.MeshBasicMaterial({ map: tex.ui, color: ICE, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const gold = new THREE.MeshStandardMaterial({ color: '#c9b48a', metalness: 1, roughness: 0.3 });
    const smd = new THREE.MeshStandardMaterial({ color: '#141b26', metalness: 0.6, roughness: 0.4 });
    const line = new THREE.MeshBasicMaterial({ color: ICE, transparent: true, opacity: 0, toneMapped: false });
    const scan = new THREE.MeshBasicMaterial({ map: tex.scan, color: ICE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    return { base, pcb, die, glass, ui, gold, smd, line, scan };
  }, [tex]);
  const emissives = [mats.base, mats.pcb, mats.die];
  const baseEmissive = [0.55, 0.9, 0.7];

  // ลูกบอลบัดกรี (BGA) ใต้ PCB + ชิ้นส่วน SMD รอบ die — instanced ทั้งคู่
  const balls = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(0.034, 10, 8), mats.gold, 18 * 18);
    const o = new THREE.Object3D();
    let i = 0;
    for (let x = 0; x < 18; x++)
      for (let z = 0; z < 18; z++) {
        o.position.set(-1.36 + x * 0.16, -0.075, -1.36 + z * 0.16);
        o.updateMatrix();
        m.setMatrixAt(i++, o.matrix);
      }
    m.count = i;
    return m;
  }, [mats.gold]);
  const smds = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.035, 0.055), mats.smd, 44);
    const o = new THREE.Object3D();
    let i = 0;
    for (let k = 0; k < 11; k++) {
      const t = -0.8 + k * 0.16;
      for (const [x, z, r] of [
        [t, -0.98, 0],
        [t, 0.98, 0],
        [-0.98, t, Math.PI / 2],
        [0.98, t, Math.PI / 2],
      ] as const) {
        o.position.set(x, 0.058, z);
        o.rotation.set(0, r, 0);
        o.updateMatrix();
        m.setMatrixAt(i++, o.matrix);
      }
    }
    return m;
  }, [mats.smd]);
  // วงแหวนขีดสีอำพันรอบฐาน
  const ticks = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.004, 0.02), new THREE.MeshBasicMaterial({ color: '#d9d9d4', toneMapped: false, transparent: true, opacity: 0.45 }), 72);
    const o = new THREE.Object3D();
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      o.position.set(Math.cos(a) * 2.95, 0, Math.sin(a) * 2.95);
      o.rotation.set(0, -a, 0);
      o.scale.set(i % 6 === 0 ? 2.2 : 1, 1, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    return m;
  }, []);
  const ringRef = useRef<THREE.Group>(null);
  const base = useRef({ y: 0, x: 0 });

  // assembly หลัง preloader
  useEffect(() => {
    if (!booted || reduceMotion) return;
    const tl = gsap.timeline({ delay: 0.15 });
    (['a', 'b', 'c', 'd'] as const).forEach((k, i) => tl.to(intro.current, { [k]: 1, duration: 1.5, ease: 'none' }, i * 0.22));
    return () => {
      tl.kill();
    };
  }, [booted]);

  useEffect(
    () => () => {
      Object.values(tex).forEach(t => t.dispose());
      Object.values(mats).forEach(m => m.dispose());
    },
    [tex, mats],
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const p = sceneProgress.hero;
    const explode = smooth(span(p, 0.08, 0.48));
    const proj = span(p, 0.5, 0.75);
    const it = [intro.current.a, intro.current.b, intro.current.c, intro.current.d];

    LAYERS.forEach((L, i) => {
      const g = layerRefs.current[i];
      if (!g) return;
      const e = easeOutExpo(it[i]);
      const from = i % 2 ? 3.6 : -3.4;
      g.position.y = THREE.MathUtils.lerp(L.y, L.ey, explode) + (1 - e) * from;
      g.rotation.y = (1 - e) * (i % 2 ? 1.6 : -1.4) + explode * L.rot;
      g.scale.setScalar(0.55 + 0.45 * e);
      g.visible = it[i] > 0.001;
      if (it[i] >= 0.999 && !locked.current[i]) {
        locked.current[i] = true;
        flash.current[i] = 1;
      }
      flash.current[i] = Math.max(0, flash.current[i] - dt * 1.6);
      const label = labelRefs.current[i];
      if (label) label.style.opacity = String(span(explode, 0.35 + i * 0.12, 0.7 + i * 0.1) * (1 - proj * 0.65));
    });
    emissives.forEach((m, i) => {
      m.emissiveIntensity = baseEmissive[i] * (0.9 + 0.1 * Math.sin(t * 1.4 + i)) + flash.current[i] * 3;
    });
    mats.ui.opacity = 0.65 + 0.12 * Math.sin(t * 2.2) + flash.current[3] * 0.4;

    // เส้นเชื่อมแนวตั้งระหว่างชั้นตอนแยก
    const conn = connRef.current;
    if (conn) {
      const top = THREE.MathUtils.lerp(LAYERS[3].y, LAYERS[3].ey, explode);
      const bottom = THREE.MathUtils.lerp(LAYERS[0].y, LAYERS[0].ey, explode);
      conn.position.y = (top + bottom) / 2;
      conn.scale.y = Math.max(0.001, top - bottom);
      mats.line.opacity = explode * 0.55;
    }
    // ระนาบสแกนกวาดขึ้นลงตอนแยกชั้น
    const scan = scanRef.current;
    if (scan) {
      const cycle = (t * 0.35) % 1;
      scan.position.y = -1.3 + cycle * 2.8;
      mats.scan.opacity = (0.15 + explode * 0.6) * Math.sin(cycle * Math.PI) * (1 - proj * 0.7);
    }
    if (ringRef.current) ringRef.current.rotation.y = t * 0.08;

    // เอียงตามเมาส์ + หมุนช้า ๆ
    // มุมพื้นฐาน (เมาส์ + ลอยช้า ๆ) + มุมจากการลากหมุน 360°
    const g = groupRef.current;
    if (g) {
      const k = 1 - Math.exp(-dt * 3);
      const spin = spins.hero;
      stepSpin(spin, dt);
      base.current.y += (sceneProgress.pointerX * 0.35 + Math.sin(t * 0.25) * 0.12 + explode * 0.5 - base.current.y) * k;
      base.current.x += (sceneProgress.pointerY * 0.12 - base.current.x) * k;
      g.rotation.y = base.current.y + spin.angle;
      g.rotation.x = base.current.x + spin.tilt;
    }
  });

  return (
    <group ref={groupRef}>
      {/* L1 · INFRA — ฐาน socket */}
      <group ref={el => { layerRefs.current[0] = el; }}>
        <RoundedBox args={[3.5, 0.18, 3.5]} radius={0.06} smoothness={3} material={mats.base} />
        <LayerLabel i={0} innerRef={el => { labelRefs.current[0] = el; }} />
      </group>
      {/* L2 · DATA — PCB + ลูกบอล + SMD */}
      <group ref={el => { layerRefs.current[1] = el; }}>
        <RoundedBox args={[3, 0.08, 3]} radius={0.03} smoothness={3} material={mats.pcb} />
        <primitive object={balls} />
        <primitive object={smds} />
        {[
          [-1.15, -1.15],
          [1.15, -1.15],
          [-1.15, 1.15],
          [1.15, 1.15],
        ].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.07, z]} material={mats.smd}>
            <boxGeometry args={[0.46, 0.06, 0.3]} />
          </mesh>
        ))}
        <LayerLabel i={1} innerRef={el => { labelRefs.current[1] = el; }} />
      </group>
      {/* L3 · LOGIC — die ซิลิคอนสีรุ้ง */}
      <group ref={el => { layerRefs.current[2] = el; }}>
        <RoundedBox args={[1.5, 0.07, 1.5]} radius={0.02} smoothness={2} material={mats.die} />
        <LayerLabel i={2} innerRef={el => { labelRefs.current[2] = el; }} />
      </group>
      {/* L4 · INTERFACE — กระจกโฮโลแกรม + wireframe UI */}
      <group ref={el => { layerRefs.current[3] = el; }}>
        <RoundedBox args={[2.5, 0.05, 2.5]} radius={0.02} smoothness={2} material={mats.glass} />
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.ui}>
          <planeGeometry args={[2.36, 2.36]} />
        </mesh>
        <LayerLabel i={3} innerRef={el => { labelRefs.current[3] = el; }} />
      </group>

      {/* เส้นเชื่อม 4 มุม (scale.y = ระยะระหว่างชั้นบนสุด-ล่างสุด) */}
      <group ref={connRef}>
        {[
          [-1.25, -1.25],
          [1.25, -1.25],
          [-1.25, 1.25],
          [1.25, 1.25],
        ].map(([x, z]) => (
          <mesh key={`c${x}${z}`} position={[x, 0, z]} material={mats.line}>
            <boxGeometry args={[0.008, 1, 0.008]} />
          </mesh>
        ))}
      </group>

      <mesh ref={scanRef} rotation={[-Math.PI / 2, 0, 0]} material={mats.scan}>
        <planeGeometry args={[4.2, 4.2]} />
      </mesh>

      {/* วงแหวน HUD ที่พื้น */}
      <group ref={ringRef} position={[0, -0.32, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.55, 2.565, 160]} />
          <meshBasicMaterial color={ICE} transparent opacity={0.3} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.3, 3.31, 160, 1, 0, Math.PI * 1.2]} />
          <meshBasicMaterial color={STEEL} transparent opacity={0.25} toneMapped={false} />
        </mesh>
        <primitive object={ticks} />
      </group>
    </group>
  );
}

function LayerLabel({ i, innerRef }: { i: number; innerRef: (el: HTMLDivElement | null) => void }) {
  const L = LAYERS[i];
  return (
    <Html position={[L.half + 0.1, 0, L.half * 0.55]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="chip-label" ref={innerRef} style={{ opacity: 0 }}>
        <i />
        <div>
          <span className="mono">
            <b>{L.no}</b> {L.name}
          </span>
          <p>{L.techs}</p>
        </div>
      </div>
    </Html>
  );
}

/* ---------- กล้อง: มุม 3/4 → มุมข้างเห็นชั้นแยก → เข้าใกล้ ---------- */
function Rig() {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera;
  const size = useThree(s => s.size);
  const booted = useUI(s => s.booted);
  const introCam = useRef(reduceMotion ? 1 : 0);
  const v = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), A: new THREE.Vector3(5.4, 4.3, 6.6), B: new THREE.Vector3(6.6, 1.25, 6.1), D: new THREE.Vector3(7.6, 2.7, 8.2) }), []);

  useEffect(() => {
    if (!booted || reduceMotion) return;
    const tw = gsap.to(introCam, { current: 1, duration: 2.6, ease: 'expo.out', delay: 0.1 });
    return () => {
      tw.kill();
    };
  }, [booted]);

  useFrame((_, dt) => {
    const p = sceneProgress.hero;
    const e = smooth(span(p, 0.06, 0.48));
    const d = smooth(span(p, 0.5, 0.78)); // ถอยออกให้เห็นโฮโลแกรมที่ฉายขึ้นมา
    const narrow = size.width < 900;
    v.pos.copy(v.A).lerp(v.B, e).lerp(v.D, d);
    // จอแคบ (มือถือ) ถอยกล้องให้เห็นทั้งชิปและโฮโลแกรม
    v.pos.multiplyScalar((narrow ? 1.5 : 1) * (1 + (1 - introCam.current) * 0.7));
    v.pos.x += sceneProgress.pointerX * 0.4;
    v.pos.y += -sceneProgress.pointerY * 0.25;
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 5);
    camera.position.lerp(v.pos, k);
    v.look.set(0, 0.05 + d * 1.05, 0);
    camera.lookAt(v.look);
    // จัดชิปไปทางขวาของข้อความบนจอใหญ่ / ลงล่างบนมือถือ แล้วค่อยกลับกลางตอนแยกชั้น
    const off = 1 - e;
    camera.setViewOffset(size.width, size.height, narrow ? 0 : -size.width * 0.26 * off, narrow ? -size.height * 0.16 * off : 0, size.width, size.height);
  });
  return null;
}

function Ready() {
  const setHeroReady = useUI(s => s.setHeroReady);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => setHeroReady());
  });
  return null;
}

export default function HeroScene({ active }: { active: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 30, near: 0.1, far: 60, position: [9, 7, 11] }}
      frameloop={reduceMotion ? 'demand' : active ? 'always' : 'never'}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', e => e.preventDefault());
      }}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 9, 24]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#dff6ff" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" scale={[10, 2, 1]} position={[0, 6, -4]} rotation-x={Math.PI / 2.5} />
        <Lightformer form="rect" intensity={3} color="#ffffff" scale={[4, 6, 1]} position={[-6, 2, 2]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.2} color="#cfe3ec" scale={[4, 6, 1]} position={[6, 1, -2]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.2} color="#e9dcc2" scale={3} position={[2, 4, 5]} />
      </Environment>
      <Chip />
      <Suspense fallback={null}>
        <Projections />
      </Suspense>
      <Grid
        position={[0, -1.62, 0]}
        args={[30, 30]}
        cellSize={0.4}
        cellThickness={0.6}
        sectionSize={2}
        sectionThickness={1}
        cellColor="#161616"
        sectionColor="#2c2c2c"
        fadeDistance={22}
        fadeStrength={1.4}
        infiniteGrid
      />
      <Sparkles count={50} scale={[11, 5, 11]} size={1.6} speed={0.2} opacity={0.35} color="#ffffff" position={[0, 0.6, 0]} />
      <Rig />
      <Ready />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.75} luminanceSmoothing={0.2} />
        <Noise premultiply opacity={0.3} blendFunction={BlendFunction.SOFT_LIGHT} />
        <Vignette offset={0.2} darkness={0.8} />
      </EffectComposer>
    </Canvas>
  );
}
