/* =========================================================
   CORE SCENE — มุดเข้าไปดูข้อมูลในชิป AI
   die ของชิป · หน่วยความจำ 10 ก้อน (= ผลงาน 10 ชิ้น) · บัสส่งแพ็กเก็ตข้อมูลเข้า tensor core 8×8
   · โฮโลแกรม hex dump เหนือ core
   ตำแหน่งกล้องผูกกับ scroll ตรง ๆ (sceneProgress.core) · ลากหมุน 360° ผ่าน spins.core
   ========================================================= */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url';
import { WORKS } from '../data/derived';
import { damp, reduceMotion, span } from '../lib/motion';
import { coreFrame, sceneProgress, spins } from '../lib/store';
import { stepSpin } from '../lib/useDragRotate';
import { fadeTexture, floorplanTexture, hexTexture, memoryTexture } from './textures';

const ICE = new THREE.Color('#cfe8f2');
const STEEL = new THREE.Color('#5f6b73');
const DIM = new THREE.Color('#15181b');
const smooth = (t: number) => t * t * (3 - 2 * t);

/** ผังบน die: หน่วยความจำ 5 ก้อนบน + 5 ก้อนล่าง ล้อม tensor core ตรงกลาง */
const BANKS = WORKS.map((w, i) => ({
  id: w.id,
  code: w.code,
  pos: new THREE.Vector3(-3 + (i % 5) * 1.5, 0.09, i < 5 ? -2.75 : 2.75),
}));
const BANK = { w: 1.12, h: 0.18, d: 0.78 };
const CORE_N = 8;
const CORE_PITCH = 0.27;
const CORE_EDGE = (CORE_N * CORE_PITCH) / 2;

/** เส้นทางบัสแบบ Manhattan: ขอบหน่วยความจำ → ลงมาที่ช่องทางเดินสาย → เลี้ยวเข้าขอบ core */
function routeOf(p: THREE.Vector3) {
  const s = Math.sign(p.z);
  const x = THREE.MathUtils.clamp(p.x, -CORE_EDGE + 0.15, CORE_EDGE - 0.15);
  const y = 0.03;
  return [
    new THREE.Vector3(p.x, y, p.z - s * BANK.d * 0.5),
    new THREE.Vector3(p.x, y, s * 1.75),
    new THREE.Vector3(x, y, s * 1.75),
    new THREE.Vector3(x, y, s * CORE_EDGE),
  ];
}
const ROUTES = BANKS.map(b => {
  const pts = routeOf(b.pos);
  const lens = pts.slice(1).map((q, i) => q.distanceTo(pts[i]));
  return { pts, lens, total: lens.reduce((a, c) => a + c, 0) };
});
const PER_ROUTE = 4;

function pointOn(route: (typeof ROUTES)[number], t: number, out: THREE.Vector3) {
  let d = t * route.total;
  for (let i = 0; i < route.lens.length; i++) {
    if (d <= route.lens[i]) return out.lerpVectors(route.pts[i], route.pts[i + 1], d / route.lens[i]);
    d -= route.lens[i];
  }
  return out.copy(route.pts[route.pts.length - 1]);
}

function Die({ active, onHover, onSelect }: { active: string; onHover: (id: string | null) => void; onSelect: (id: string) => void }) {
  const group = useRef<THREE.Group>(null);
  const cells = useRef<THREE.InstancedMesh>(null);
  const packets = useRef<THREE.InstancedMesh>(null);
  const holo = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);
  const bankMats = useRef<THREE.MeshStandardMaterial[]>([]);
  const lift = useRef<number[]>(BANKS.map(() => 0));
  const pointer = useRef({ x: 0 });

  const tex = useMemo(
    () => ({
      floor: floorplanTexture(),
      mem: memoryTexture(),
      hex: hexTexture(),
      beam: fadeTexture([[0, 0], [0.06, 1], [0.45, 0.35], [1, 0]]),
      holoFade: fadeTexture([[0, 0], [0.22, 1], [0.78, 1], [1, 0]]),
    }),
    [],
  );
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3(), c: new THREE.Color() }), []);

  const busLines = useMemo(
    () =>
      ROUTES.map(r => {
        const g = new THREE.BufferGeometry().setFromPoints(r.pts);
        return new THREE.Line(g, new THREE.LineBasicMaterial({ color: STEEL, transparent: true, opacity: 0.5, toneMapped: false }));
      }),
    [],
  );

  const activeIdx = BANKS.findIndex(b => b.id === active);

  // ลดการเคลื่อนไหว (frameloop demand): วาดใหม่เมื่อฉากพร้อม (หลังฟอนต์ของ Text โหลด) และเมื่อเปลี่ยนก้อนที่อ่าน
  const invalidate = useThree(s => s.invalidate);
  useEffect(() => {
    if (reduceMotion) invalidate();
  }, [active, invalidate]);

  useFrame((state, dt) => {
    // ลดการเคลื่อนไหว: หยุดเวลาไว้ที่จังหวะหนึ่ง ภาพนิ่งยังเห็นคลื่นใน tensor core
    const t = reduceMotion ? 1.2 : state.clock.elapsedTime;
    const g = group.current;
    if (g) {
      stepSpin(spins.core, dt);
      pointer.current.x = damp(pointer.current.x, sceneProgress.pointerX, 0.05, dt);
      g.rotation.y = spins.core.angle + (reduceMotion ? 0 : pointer.current.x * 0.12);
    }

    // tensor core: คลื่นทแยงแบบ systolic array (เหมือนคูณเมทริกซ์)
    const ci = cells.current;
    if (ci) {
      for (let i = 0; i < CORE_N; i++)
        for (let j = 0; j < CORE_N; j++) {
          const k = i * CORE_N + j;
          const wave = 0.5 + 0.5 * Math.sin(t * 2.6 - (i + j) * 0.55);
          const hgt = 0.06 + wave * wave * 0.32;
          tmp.p.set((i - (CORE_N - 1) / 2) * CORE_PITCH, hgt / 2, (j - (CORE_N - 1) / 2) * CORE_PITCH);
          tmp.s.set(1, hgt / 0.1, 1);
          ci.setMatrixAt(k, tmp.m.compose(tmp.p, tmp.q, tmp.s));
          ci.setColorAt(k, tmp.c.copy(DIM).lerp(ICE, Math.pow(wave, 3)));
        }
      ci.instanceMatrix.needsUpdate = true;
      if (ci.instanceColor) ci.instanceColor.needsUpdate = true;
    }

    // แพ็กเก็ตข้อมูลวิ่งตามบัส — เส้นของก้อนที่กำลังอ่านสว่างและเร็วกว่า
    const pk = packets.current;
    if (pk) {
      ROUTES.forEach((r, ri) => {
        const on = ri === activeIdx;
        for (let j = 0; j < PER_ROUTE; j++) {
          const k = ri * PER_ROUTE + j;
          const u = reduceMotion ? j / PER_ROUTE : (t * (on ? 0.42 : 0.16) + j / PER_ROUTE + ri * 0.137) % 1;
          pointOn(r, u, tmp.p);
          tmp.p.y = 0.06;
          tmp.s.setScalar(on ? 1.25 : 0.8);
          pk.setMatrixAt(k, tmp.m.compose(tmp.p, tmp.q, tmp.s));
          pk.setColorAt(k, tmp.c.copy(on ? ICE : STEEL).multiplyScalar(on ? 2.2 : 0.9));
        }
        const lm = busLines[ri].material as THREE.LineBasicMaterial;
        lm.color.copy(on ? ICE : STEEL);
        lm.opacity = on ? 0.95 : 0.4;
      });
      pk.instanceMatrix.needsUpdate = true;
      if (pk.instanceColor) pk.instanceColor.needsUpdate = true;
    }

    // หน่วยความจำ: ก้อนที่กำลังอ่านยกขึ้นและเรืองแสง
    BANKS.forEach((_, i) => {
      const on = i === activeIdx;
      lift.current[i] = reduceMotion ? (on ? 1 : 0) : damp(lift.current[i], on ? 1 : 0, 0.12, dt);
      const m = bankMats.current[i];
      if (m) m.emissiveIntensity = 0.35 + lift.current[i] * 1.6;
    });

    // โฮโลแกรม hex dump เลื่อนขึ้นเรื่อย ๆ และหันหน้าเข้ากล้องเสมอ (อ่านได้ทุกมุมที่ลากหมุน) + ลำแสงจาง ๆ
    if (!reduceMotion) tex.hex.offset.y = (tex.hex.offset.y - dt * 0.05) % 1;
    const h = holo.current;
    if (h && g) {
      g.worldToLocal(tmp.p.copy(state.camera.position));
      h.rotation.y = Math.atan2(tmp.p.x, tmp.p.z);
      (h.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.08 * Math.sin(t * 3.1);
    }
    if (beam.current) (beam.current.material as THREE.MeshBasicMaterial).opacity = 0.11 + 0.03 * Math.sin(t * 2.2);
  });

  return (
    <group ref={group}>
      {/* แผ่นรองชิป + die */}
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[10.2, 0.3, 10.2]} />
        <meshStandardMaterial color="#090909" roughness={0.75} metalness={0.3} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color="#0b0c0d" roughness={0.55} metalness={0.45} emissive="#ffffff" emissiveMap={tex.floor} emissiveIntensity={0.32} />
      </mesh>

      {busLines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}

      {/* หน่วยความจำ = ผลงานแต่ละชิ้น */}
      {BANKS.map((b, i) => (
        <group key={b.id} position={b.pos}>
          <mesh
            position-y={0}
            onPointerOver={e => {
              e.stopPropagation();
              onHover(b.id);
            }}
            onPointerOut={() => onHover(null)}
            onClick={e => {
              e.stopPropagation();
              if (e.delta > 6) return;
              onSelect(b.id);
            }}
          >
            <boxGeometry args={[BANK.w, BANK.h, BANK.d]} />
            <meshStandardMaterial
              ref={m => {
                if (m) bankMats.current[i] = m;
              }}
              color="#0d0f10"
              roughness={0.35}
              metalness={0.6}
              emissive="#cfe8f2"
              emissiveMap={tex.mem}
              emissiveIntensity={0.35}
            />
          </mesh>
          <Text font={monoFont} fontSize={0.15} rotation-x={-Math.PI / 2} position={[0, BANK.h / 2 + 0.006, BANK.d / 2 + 0.16]} color="#e8eef0" anchorX="center" anchorY="middle" letterSpacing={0.08}>
            {b.code}
          </Text>
        </group>
      ))}

      {/* tensor core */}
      <instancedMesh ref={cells} args={[undefined, undefined, CORE_N * CORE_N]}>
        <boxGeometry args={[CORE_PITCH * 0.82, 0.1, CORE_PITCH * 0.82]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments position={[0, 0.02, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(CORE_EDGE * 2 + 0.14, 0.02, CORE_EDGE * 2 + 0.14)]} />
        <lineBasicMaterial color={ICE} toneMapped={false} />
      </lineSegments>
      <Text font={monoFont} fontSize={0.12} rotation-x={-Math.PI / 2} position={[0, 0.02, CORE_EDGE + 0.28]} color="#9fb3bd" anchorX="center" letterSpacing={0.12}>
        TENSOR CORE · 8×8
      </Text>

      <instancedMesh ref={packets} args={[undefined, undefined, ROUTES.length * PER_ROUTE]}>
        <boxGeometry args={[0.07, 0.035, 0.07]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* ลำแสง + โฮโลแกรมข้อมูลเหนือ core */}
      <mesh ref={beam} position={[0, 0.85, 0]}>
        <cylinderGeometry args={[CORE_EDGE * 0.9, CORE_EDGE * 1.05, 1.6, 32, 1, true]} />
        <meshBasicMaterial color={ICE} alphaMap={tex.beam} transparent opacity={0.11} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} fog={false} />
      </mesh>
      <mesh ref={holo} position={[0, 1.55, 0]}>
        <planeGeometry args={[2.1, 1.3]} />
        <meshBasicMaterial map={tex.hex} alphaMap={tex.holoFade} color={ICE} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ---------- กล้อง: มุมสูงทั้ง die → ดิ่งตามบัส → จ่อ tensor core (ผูกกับ scroll ตรง ๆ) ---------- */
const CAM = [new THREE.Vector3(0.6, 10.5, 7.2), new THREE.Vector3(4.6, 3.6, 5.2), new THREE.Vector3(3.3, 2.6, 4.7)];
const LOOK = [new THREE.Vector3(0, 0, 0.3), new THREE.Vector3(0, 0.2, 0), new THREE.Vector3(0, 1, 0)];

const HALF_H_FOV = Math.tan(THREE.MathUtils.degToRad(22));

function Rig() {
  const camera = useThree(s => s.camera) as THREE.PerspectiveCamera;
  const size = useThree(s => s.size);
  const invalidate = useThree(s => s.invalidate);
  const v = useMemo(() => ({ p: new THREE.Vector3(), l: new THREE.Vector3() }), []);
  useEffect(() => {
    coreFrame.redraw = invalidate;
    return () => {
      coreFrame.redraw = null;
    };
  }, [invalidate]);
  useFrame(() => {
    const p = reduceMotion ? 0.62 : sceneProgress.core;
    const a = smooth(span(p, 0, 0.55));
    const b = smooth(span(p, 0.55, 1));
    v.p.lerpVectors(CAM[0], CAM[1], a).lerp(CAM[2], b);
    v.l.lerpVectors(LOOK[0], LOOK[1], a).lerp(LOOK[2], b);
    camera.position.copy(v.p);
    camera.lookAt(v.l);

    // จอแนวตั้ง: ขยายมุมกล้องให้เห็นกว้างเท่าจอแนวนอน (ภาพที่เกินบน/ล่างถูกหัวข้อกับ HUD บังอยู่แล้ว)
    const { width: W, height: H } = size;
    camera.fov = Math.max(34, THREE.MathUtils.radToDeg(2 * Math.atan(HALF_H_FOV / (W / H))));
    // เลื่อนภาพให้ชิปอยู่กลางพื้นที่ว่าง — จอแคบ ขอบบนขยับขึ้นตามหัวข้อที่จางหาย (ตรงกับ --fade ใน Core.css)
    const f = coreFrame;
    const fade = f.stacked && !reduceMotion ? span(p, 0.08, 0.22) : 0;
    const top = f.top + (f.topAfter - f.top) * fade;
    const ox = f.right > f.left ? THREE.MathUtils.clamp((f.left + f.right) / 2 - W / 2, -W * 0.08, W * 0.08) : 0;
    const oy = f.bottom > top ? THREE.MathUtils.clamp((top + f.bottom) / 2 - H / 2, -H * 0.22, H * 0.22) : 0;
    camera.setViewOffset(W, H, -ox, -oy, W, H);
  });
  return null;
}

export default function CoreScene({ active, live, onHover, onSelect }: { active: string; live: boolean; onHover: (id: string | null) => void; onSelect: (id: string) => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 34, near: 0.1, far: 60, position: [0.6, 10.5, 7.2] }}
      frameloop={reduceMotion ? 'demand' : live ? 'always' : 'never'}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 7, 21]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 7, 4]} intensity={1.1} color="#e6f4fa" />
      <pointLight position={[0, 1.6, 0]} intensity={4} distance={5} color="#cfe8f2" />
      <Die active={active} onHover={onHover} onSelect={onSelect} />
      <Rig />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.6} luminanceSmoothing={0.25} />
        <Vignette offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  );
}
