/* =========================================================
   STACK SCENE — กลุ่มดาวเทคโนโลยี 3D
   ดาวใหญ่ = กลุ่มทักษะ · ดาวเล็ก = เทคโนโลยี (ขนาดตามจำนวนผลงานที่ใช้)
   เส้น = อยู่ในกลุ่มเดียวกัน / ใช้ร่วมกันในผลงานตั้งแต่ 2 ชิ้นขึ้นไป
   ========================================================= */
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, OrbitControls, Text } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import monoFont from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url';
import { SKILLS } from '../data/content';
import { TECHS, WORKS } from '../data/derived';
import { finePointer, reduceMotion } from '../lib/motion';
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
  // เทคโนโลยีที่ใช้ด้วยกันในผลงาน ≥ 2 ชิ้น
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
const ICE = new THREE.Color('#a9d6e8'); // เทคโนโลยีที่ใช้บ่อย: ฟ้าน้ำแข็ง
const DIM = new THREE.Color('#222222');

function Graph({ hover, focusGroup, onHover }: { hover: string | null; focusGroup: number | null; onHover: (id: string | null) => void }) {
  const { nodes, edges } = useMemo(buildGraph, []);
  const group = useRef<THREE.Group>(null);

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
  const lit = (i: number) => {
    if (hoverIdx >= 0) return i === hoverIdx || !!neighbours.get(hoverIdx)?.has(i);
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
      const on = lit(a) && lit(b) && (hoverIdx < 0 || a === hoverIdx || b === hoverIdx);
      const c = on ? (nodes[a].hub || nodes[b].hub ? WHITE : STEEL) : DIM;
      const k = on ? (hoverIdx >= 0 || focusGroup !== null ? 1 : 0.42) : 0.3;
      for (let j = 0; j < 2; j++) col.setXYZ(i * 2 + j, c.r * k, c.g * k, c.b * k);
    });
    col.needsUpdate = true;
  }, [hoverIdx, focusGroup, lines]);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    // ทัชสกรีนใช้การปัดแนวนอนหมุน (เมาส์ใช้ OrbitControls หมุนได้ทุกทิศ)
    stepSpin(spins.stack, dt);
    g.rotation.y = (reduceMotion ? 0 : state.clock.elapsedTime * 0.04) + spins.stack.angle;
    g.position.y = reduceMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
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
            <mesh
              onPointerOver={e => {
                e.stopPropagation();
                onHover(nd.id);
              }}
              onPointerOut={() => onHover(null)}
              onClick={e => {
                e.stopPropagation();
                onHover(nd.id);
              }}
            >
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
                color={nd.hub ? '#f2f2ef' : '#a9a9a4'}
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
    </group>
  );
}

/** จอแคบ → ถอยกล้องออกให้ป้ายไม่ล้นกรอบ */
function FitCamera() {
  const camera = useThree(st => st.camera);
  const scene = useThree(st => st.scene);
  const width = useThree(st => st.size.width);
  useEffect(() => {
    const L = width < 520 ? 13 : width < 900 ? 10.5 : 8.5;
    camera.position.setLength(L);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.near = L - 1.5;
      scene.fog.far = L + 6.5;
    }
  }, [camera, scene, width]);
  return null;
}

export default function StackScene({ active, hover, focusGroup, onHover }: { active: boolean; hover: string | null; focusGroup: number | null; onHover: (id: string | null) => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 40, position: [0, 1.4, 8.4] }}
      frameloop={reduceMotion ? 'demand' : active ? 'always' : 'never'}
      onPointerMissed={() => onHover(null)}
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 7, 15]} />
      <FitCamera />
      <Graph hover={hover} focusGroup={focusGroup} onHover={onHover} />
      <OrbitControls enableZoom={false} enablePan={false} enableRotate={finePointer} autoRotate={!reduceMotion} autoRotateSpeed={0.5} enableDamping dampingFactor={0.06} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.4} luminanceThreshold={0.5} luminanceSmoothing={0.3} />
      </EffectComposer>
    </Canvas>
  );
}
