/* =========================================================
   STACK SCENE — กลุ่มดาวเทคโนโลยี 3D
   ดาวใหญ่ = กลุ่มทักษะ · ดาวเล็ก = เทคโนโลยี (ขนาดตามจำนวนผลงานที่ใช้)
   เส้น = อยู่ในกลุ่มเดียวกัน / ใช้ร่วมกันในผลงานตั้งแต่ 3 ชิ้นขึ้นไป
   คลิกดาว = ล็อกโฟกัส: กล้องเลื่อนเข้าไปหาดาวนั้นแล้วตามไว้ หมุนรอบดาวได้ 360°
   คลิกที่ว่าง / Esc / ปุ่มปลดล็อก = ถอยกลับมามองทั้งกลุ่ม
   ========================================================= */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, OrbitControls, Text } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url';
import { SKILLS } from '../data/content';
import { TECHS, WORKS } from '../data/derived';
import { damp, finePointer, reduceMotion } from '../lib/motion';
import { spins } from '../lib/store';
import { stepSpin } from '../lib/useDragRotate';

export interface StarNode {
  id: string;
  label: string;
  hub: boolean;
  group: number;
  pos: THREE.Vector3;
  size: number;
  uses: number;
}

const rng = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export function buildGraph() {
  const r = rng(42);
  const nodes: StarNode[] = [];
  const index = new Map<string, number>();
  const edges: [number, number][] = [];
  const usage = new Map(TECHS.map(t => [t.name, t.works.length]));
  const n = SKILLS.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  SKILLS.forEach((g, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const pos = new THREE.Vector3(Math.cos(golden * i) * rad, y * 0.75, Math.sin(golden * i) * rad).multiplyScalar(3.1);
    index.set(`hub:${g.key}`, nodes.length);
    nodes.push({ id: `hub:${g.key}`, label: g.key, hub: true, group: i, pos, size: 0.16, uses: 0 });
  });
  SKILLS.forEach((g, gi) => {
    const hub = nodes[gi];
    g.tags.forEach(tag => {
      let ti = index.get(tag);
      if (ti === undefined) {
        const dir = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
        const pos = hub.pos.clone().add(dir.multiplyScalar(0.75 + r() * 0.6));
        const uses = usage.get(tag) ?? 0;
        ti = nodes.length;
        index.set(tag, ti);
        nodes.push({ id: tag, label: tag, hub: false, group: gi, pos, size: 0.045 + Math.min(uses, 6) * 0.012, uses });
      }
      edges.push([gi, ti]);
    });
  });
  // เทคโนโลยีที่ใช้ด้วยกันในผลงาน ≥ 3 ชิ้น
  const pair = new Map<string, number>();
  WORKS.forEach(w => {
    const ids = w.stack.map(s => index.get(s)).filter((v): v is number => v !== undefined && !nodes[v].hub);
    for (let a = 0; a < ids.length; a++)
      for (let b = a + 1; b < ids.length; b++) {
        const k = ids[a] < ids[b] ? `${ids[a]}-${ids[b]}` : `${ids[b]}-${ids[a]}`;
        pair.set(k, (pair.get(k) ?? 0) + 1);
      }
  });
  pair.forEach((c, k) => {
    if (c < 3) return;
    const [a, b] = k.split('-').map(Number);
    if (nodes[a].group !== nodes[b].group) edges.push([a, b]);
  });
  return { nodes, edges };
}

const WHITE = new THREE.Color('#f2f2ef'); // ดาวกลุ่ม/เส้นหลัก
const STEEL = new THREE.Color('#8b949b'); // เส้นรอง: เทาเหล็ก
const ICE = new THREE.Color('#a9d6e8'); // เทคโนโลยีที่ใช้บ่อย + เป้าล็อกโฟกัส: ฟ้าน้ำแข็ง
const DIM = new THREE.Color('#222222');
const ORIGIN = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

/** ระยะกล้องตอนล็อกโฟกัส (ก่อนคูณสัดส่วนจอ) — ดาวกลุ่มถอยมากกว่าให้เห็นดาวลูกครบ */
const FOCUS_DIST = { hub: 4.8, leaf: 3.4 };

/** สถานะโฟกัสที่ Graph เขียนทุกเฟรม แล้ว CameraRig อ่าน (ไม่ผ่าน React state) */
interface Focus {
  on: boolean;
  pos: THREE.Vector3;
  dist: number;
  /** มุมหมุนจากการปัดบนทัชสกรีนที่ยังไม่ได้ส่งให้กล้อง (ตอนล็อก กล้องโคจรรอบดาวแทนการหมุนทั้งกลุ่ม) */
  yaw: number;
  /** 0 → 1: ช่วงที่กล้องโค้งไปยังทิศ dir (หยุดทันทีเมื่อผู้ใช้ลากเอง) */
  fly: number;
  /** ทิศกล้องจากดาวที่ล็อก (world) — คำนวณครั้งเดียวตอนล็อกเมื่อ plan = true */
  dir: THREE.Vector3;
  plan: boolean;
  /** สัดส่วนระยะกล้องตามขนาดจอ (CameraRig เขียน) */
  scale: number;
}

/* ---------- เลือกมุมกล้องตอนล็อก: ลองทิศรอบดาวแล้วเอาทิศที่ "ชัดที่สุด" ---------- */
// ตัดมุมก้ม/เงยชันออก (ป้ายจะเอียงและ OrbitControls หมุนต่อได้ไม่ลื่น)
const VIEWS = Array.from({ length: 96 }, (_, i) => {
  const y = 1 - ((i + 0.5) / 96) * 2;
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
}).filter(v => v.y > -0.35 && v.y < 0.6);

/** คะแนนต่ำ = ดี: ไม่มีดาว/ป้ายอื่นทับดาวบนจอ · อยู่ด้านนอกกลุ่ม · หมุนกล้องจากมุมเดิมไม่ไกล · เงยเล็กน้อย */
function bestView(world: THREE.Vector3[], nodes: StarNode[], sel: number, from: THREE.Vector3, dist: number, out: THREE.Vector3) {
  const p = world[sel];
  const outward = p.clone().normalize();
  const cam = new THREE.Vector3();
  const v = new THREE.Vector3();
  const block = (q: THREE.Vector3, d: THREE.Vector3, reach: number, weight: number) => {
    cam.copy(p).addScaledVector(d, dist);
    v.subVectors(q, cam);
    const z = -v.dot(d); // ความลึกจากกล้อง (ดาวที่ล็อกอยู่ที่ z = dist)
    if (z < 0.3) return 0;
    // ระยะห่างจากดาวบนจอ (ฉายไปที่ระนาบความลึกของดาว)
    const lat = (v.addScaledVector(d, z).length() * dist) / z;
    const overlap = Math.exp(-((lat / reach) ** 2)) * weight;
    // อยู่หน้าดาว = บัง (หนัก) · อยู่หลังดาว = ทับกันบนจอ (เบากว่า และจางลงตามหมอก)
    return z < dist ? overlap * 1.5 : overlap * 0.6 * Math.max(0, 1 - (z - dist) / 6);
  };
  const label = new THREE.Vector3();
  let best = Infinity;
  VIEWS.forEach(d => {
    let cost = (1 - d.dot(outward)) * 0.6 + (1 - d.dot(from)) * 0.5 + Math.abs(d.y - 0.25) * 0.3;
    world.forEach((q, i) => {
      if (i === sel) return;
      const hub = nodes[i].hub;
      cost += block(q, d, hub ? 0.75 : 0.3, hub ? 3 : 1);
      // ป้ายชื่อกลุ่มตัวใหญ่ลอยเหนือดาวกลุ่ม ก็นับเป็นสิ่งบังด้วย
      if (hub) cost += block(label.copy(q).setY(q.y + 0.42), d, 0.9, 2.5);
    });
    if (cost < best) {
      best = cost;
      out.copy(d);
    }
  });
}

interface GraphProps {
  hover: string | null;
  selected: string | null;
  focusGroup: number | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}

function Graph({ hover, selected, focusGroup, onHover, onSelect, focus }: GraphProps & { focus: Focus }) {
  const { nodes, edges } = useMemo(buildGraph, []);
  const group = useRef<THREE.Group>(null);
  const turn = useRef({ drift: 0, spin: 0, last: spins.stack.angle });
  const invalidate = useThree(st => st.invalidate);

  const neighbours = useMemo(() => {
    const m = new Map<number, Set<number>>();
    edges.forEach(([a, b]) => {
      if (!m.has(a)) m.set(a, new Set());
      if (!m.has(b)) m.set(b, new Set());
      m.get(a)!.add(b);
      m.get(b)!.add(a);
    });
    return m;
  }, [edges]);

  const hoverIdx = hover ? nodes.findIndex(nd => nd.id === hover) : -1;
  const selIdx = selected ? nodes.findIndex(nd => nd.id === selected) : -1;
  // ลำดับการไฮไลต์: ดาวที่ชี้อยู่ → กลุ่มที่ชี้ใน spec list → ดาวที่ล็อกไว้
  const centre = hoverIdx >= 0 ? hoverIdx : focusGroup === null ? selIdx : -1;

  useEffect(() => {
    if (selIdx < 0) return;
    focus.fly = 0;
    focus.plan = true;
  }, [selIdx, focus]);
  const lit = (i: number) => {
    if (centre >= 0) return i === centre || !!neighbours.get(centre)?.has(i);
    if (focusGroup !== null) return nodes[i].group === focusGroup;
    return true;
  };

  const lines = useMemo(() => {
    const pos = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      nodes[a].pos.toArray(pos, i * 6);
      nodes[b].pos.toArray(pos, i * 6 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(edges.length * 6), 3));
    return g;
  }, [edges, nodes]);

  // สีเส้นเปลี่ยนเฉพาะตอน hover/focus เปลี่ยน (ไม่ใช่ทุกเฟรม)
  useEffect(() => {
    const col = lines.getAttribute('color') as THREE.BufferAttribute;
    edges.forEach(([a, b], i) => {
      const on = lit(a) && lit(b) && (centre < 0 || a === centre || b === centre);
      const c = on ? (nodes[a].hub || nodes[b].hub ? WHITE : STEEL) : DIM;
      const k = on ? (centre >= 0 || focusGroup !== null ? 1 : 0.42) : 0.3;
      for (let j = 0; j < 2; j++) col.setXYZ(i * 2 + j, c.r * k, c.g * k, c.b * k);
    });
    col.needsUpdate = true;
    invalidate();
  }, [centre, focusGroup, lines]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = turn.current;
    // ทัชสกรีนใช้การปัดแนวนอนหมุน (เมาส์ใช้ OrbitControls หมุนได้ทุกทิศ)
    stepSpin(spins.stack, dt);
    const d = spins.stack.angle - t.last;
    t.last = spins.stack.angle;
    focus.on = selIdx >= 0;
    if (focus.on) {
      focus.yaw += d;
      if (spins.stack.dragging) focus.fly = 1;
    }
    else {
      t.spin += d;
      if (!reduceMotion) t.drift += dt * 0.04;
    }
    g.rotation.y = t.drift + t.spin;
    g.position.y = reduceMotion || focus.on ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    if (focus.on) {
      const nd = nodes[selIdx];
      g.updateMatrixWorld();
      focus.pos.copy(nd.pos).applyMatrix4(g.matrixWorld);
      focus.dist = nd.hub ? FOCUS_DIST.hub : FOCUS_DIST.leaf;
      if (focus.plan) {
        focus.plan = false;
        const world = nodes.map(n => n.pos.clone().applyMatrix4(g.matrixWorld));
        const from = state.camera.position.clone().sub(focus.pos).normalize();
        bestView(world, nodes, selIdx, from, focus.dist * focus.scale, focus.dir);
      }
    }
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lines}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} toneMapped={false} />
      </lineSegments>
      {nodes.map((nd, i) => {
        const on = lit(i);
        const color = nd.hub ? WHITE : nd.uses >= 3 ? ICE : STEEL;
        return (
          <group key={nd.id} position={nd.pos}>
            {/* พื้นที่คลิก: ใหญ่กว่าตัวดาว เพื่อให้แตะโดนง่ายทั้งเมาส์และนิ้ว */}
            <mesh
              visible={false}
              onPointerOver={e => {
                e.stopPropagation();
                onHover(nd.id);
              }}
              onPointerOut={() => onHover(null)}
              onClick={e => {
                e.stopPropagation();
                // ลากเพื่อหมุนแล้วปล่อยบนดาว ≠ คลิก
                if (e.delta > 6) return;
                onSelect(nd.id);
              }}
            >
              <sphereGeometry args={[Math.max(nd.size * 2, 0.15), 10, 8]} />
            </mesh>
            <mesh>
              <sphereGeometry args={[nd.size, 16, 12]} />
              <meshBasicMaterial color={color} toneMapped={false} transparent opacity={on ? 1 : 0.18} />
            </mesh>
            {nd.hub && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[nd.size * 1.7, nd.size * 1.85, 48]} />
                <meshBasicMaterial color={WHITE} toneMapped={false} transparent opacity={on ? 0.6 : 0.1} side={THREE.DoubleSide} />
              </mesh>
            )}
            <Billboard>
              <Text
                font={monoFont}
                fontSize={nd.hub ? 0.2 : 0.105}
                position={[0, nd.size + (nd.hub ? 0.2 : 0.1), 0]}
                color={i === selIdx ? '#ffffff' : nd.hub ? '#f2f2ef' : '#a9a9a4'}
                fillOpacity={on ? 1 : 0.18}
                anchorX="center"
                anchorY="bottom"
                letterSpacing={nd.hub ? 0.04 : 0.01}
              >
                {nd.hub ? nd.label.toUpperCase() : nd.label}
              </Text>
            </Billboard>
          </group>
        );
      })}
      <Reticle node={selIdx >= 0 ? nodes[selIdx] : null} />
    </group>
  );
}

/* ---------- เป้าล็อก: วงใน + มุมเล็งหมุนช้า หดเข้าหาดาวตอนล็อก (เหมือน TargetCursor) ---------- */
const arcSegments = (r: number, starts: number[], len: number, steps = 12) => {
  const pts: number[] = [];
  starts.forEach(a0 => {
    for (let i = 0; i < steps; i++) {
      const a = a0 + (len * i) / steps;
      const b = a0 + (len * (i + 1)) / steps;
      pts.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(b) * r, Math.sin(b) * r, 0);
    }
  });
  return pts;
};

function Reticle({ node }: { node: StarNode | null }) {
  const ref = useRef<THREE.Group>(null);
  const arcs = useRef<THREE.Group>(null);
  const last = useRef<StarNode | null>(null);
  const k = useRef(0);

  const parts = useMemo(() => {
    const quarter = [0, 1, 2, 3].map(q => (q * Math.PI) / 2);
    const ring = arcSegments(1, [0], Math.PI * 2, 48);
    // ขีดเล็งด้านนอก 4 ทิศ
    quarter.forEach(a => ring.push(Math.cos(a) * 1.75, Math.sin(a) * 1.75, 0, Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0));
    const geo = (pts: number[]) => new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const mat = (c: THREE.Color) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    return {
      ring: new THREE.LineSegments(geo(ring), mat(WHITE)),
      arcs: new THREE.LineSegments(geo(arcSegments(1.4, quarter.map(a => a + Math.PI / 10), Math.PI * 0.3)), mat(ICE)),
    };
  }, []);

  useEffect(() => {
    if (!node) return;
    last.current = node;
    k.current = 0; // เปลี่ยนเป้า = เล่นจังหวะล็อกใหม่
  }, [node]);

  useFrame((_, dt) => {
    const g = ref.current;
    const n = last.current;
    if (!g || !n) return;
    k.current = reduceMotion ? (node ? 1 : 0) : damp(k.current, node ? 1 : 0, 0.12, dt);
    g.visible = k.current > 0.01;
    g.position.copy(n.pos);
    g.scale.setScalar(Math.max(n.size * 2, 0.15) * (1 + (1 - k.current) * 1.6));
    if (arcs.current && !reduceMotion) arcs.current.rotation.z += dt * 0.5;
    (parts.ring.material as THREE.LineBasicMaterial).opacity = k.current * 0.85;
    (parts.arcs.material as THREE.LineBasicMaterial).opacity = k.current;
  });

  return (
    <group ref={ref} visible={false}>
      <Billboard>
        <primitive object={parts.ring} />
        <group ref={arcs}>
          <primitive object={parts.arcs} />
        </group>
      </Billboard>
    </group>
  );
}

/* ---------- กล้อง: เลื่อนจุดหมุนไปหาดาวที่ล็อก + ปรับระยะตามขนาดจอ ---------- */
type Controls = { target: THREE.Vector3; addEventListener: (type: 'start', fn: () => void) => void; removeEventListener: (type: 'start', fn: () => void) => void };

function CameraRig({ focus }: { focus: Focus }) {
  const width = useThree(st => st.size.width);
  const controls = useThree(st => st.controls) as unknown as Controls | null;
  const fit = width < 520 ? 13 : width < 900 ? 10.5 : 8.5;
  const step = useMemo(() => new THREE.Vector3(), []);
  const turn = useMemo(() => new THREE.Quaternion(), []);
  const part = useMemo(() => new THREE.Quaternion(), []);
  const before = useMemo(() => new THREE.Vector3(), []);
  const first = useRef(true);
  const lift = useRef(0);

  // ผู้ใช้เริ่มลากเอง = เลิกบังคับทิศกล้อง
  useEffect(() => {
    if (!controls) return;
    const stop = () => {
      focus.fly = 1;
    };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls, focus]);

  useFrame((state, dt) => {
    if (!controls) return;
    const cam = state.camera as THREE.PerspectiveCamera;
    // เฟรมแรก / ลดการเคลื่อนไหว = กระโดดไปเลย ไม่ไหล
    const k = first.current || reduceMotion ? 1 : 1 - Math.exp(-dt * 3.2);
    first.current = false;
    // ตอนล็อก ยกภาพขึ้นครึ่งหนึ่งของแผงข้อมูลด้านล่าง ดาวที่ล็อกจึงอยู่กลาง "พื้นที่ที่มองเห็นจริง"
    const { width: w, height: h } = state.size;
    lift.current += ((focus.on ? Math.min(64, h * 0.08) : 0) - lift.current) * k;
    const y = Math.round(lift.current);
    if (!cam.view || cam.view.fullWidth !== w || cam.view.fullHeight !== h || cam.view.offsetY !== y) cam.setViewOffset(w, h, 0, y, w, h);
    // เลื่อนจุดหมุนไปหาดาว โดยเลื่อนกล้องไปเท่ากัน มุมมองจึงไม่สะบัด
    step.subVectors(focus.on ? focus.pos : ORIGIN, controls.target).multiplyScalar(k);
    controls.target.add(step);
    cam.position.add(step);
    step.subVectors(cam.position, controls.target);
    // ปัดบนทัชสกรีนตอนล็อก = โคจรรอบดาว
    if (focus.yaw) {
      step.applyAxisAngle(UP, -focus.yaw);
      focus.yaw = 0;
    }
    const len = step.length();
    // ช่วงล็อกใหม่: โค้งกล้องไปยังทิศที่ bestView เลือก ดาวที่ล็อกจึงไม่ถูกดาวอื่นบัง
    if (focus.on && focus.fly < 1) {
      focus.fly = reduceMotion ? 1 : Math.min(1, focus.fly + dt / 1.6);
      step.divideScalar(len || 1);
      turn.setFromUnitVectors(step, focus.dir);
      step.applyQuaternion(part.identity().slerp(turn, k));
    }
    focus.scale = fit / 8.5;
    const want = focus.on ? focus.dist * focus.scale : fit;
    const next = len + (want - len) * k;
    before.copy(cam.position);
    cam.position.copy(controls.target).addScaledVector(step.normalize(), next);
    cam.lookAt(controls.target);
    // โหมดลดการเคลื่อนไหววาดเฉพาะเมื่อสั่ง: กล้องเพิ่งกระโดด → วาดอีกเฟรมให้ป้าย (Billboard) หันตามกล้องใหม่
    if (reduceMotion && before.distanceToSquared(cam.position) > 1e-8) state.invalidate();
    // หมอกตามระยะกล้อง: ล็อกใกล้แล้วดาวไกลค่อย ๆ จางให้มีความลึก
    const fog = state.scene.fog;
    if (fog instanceof THREE.Fog) {
      fog.near = next - 1.5;
      fog.far = next + 6.5;
    }
  });
  return null;
}

export default function StackScene({ active, ...graph }: GraphProps & { active: boolean }) {
  const focus = useMemo<Focus>(() => ({ on: false, pos: new THREE.Vector3(), dist: FOCUS_DIST.leaf, yaw: 0, fly: 1, dir: new THREE.Vector3(0, 0, 1), plan: false, scale: 1 }), []);
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 40, position: [0, 1.4, 8.4] }}
      frameloop={reduceMotion ? 'demand' : active ? 'always' : 'never'}
      onPointerMissed={() => {
        graph.onHover(null);
        graph.onSelect(null);
      }}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 7, 15]} />
      <Graph {...graph} focus={focus} />
      <CameraRig focus={focus} />
      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableRotate={finePointer}
        autoRotate={!reduceMotion && !graph.selected}
        autoRotateSpeed={0.5}
        enableDamping
        dampingFactor={0.06}
      />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.5} luminanceSmoothing={0.3} />
      </EffectComposer>
    </Canvas>
  );
}
