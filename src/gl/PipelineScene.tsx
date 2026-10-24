/* =========================================================
   PIPELINE SCENE — อนุภาค 6,000 จุดเปลี่ยนรูปตามการเลื่อน (คำนวณใน vertex shader)
   JS อัปเดตแค่ uniform uMorph / uTime ต่อเฟรม
   ========================================================= */
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { reduceMotion } from '../lib/motion';
import { sceneProgress, spins } from '../lib/store';
import { stepSpin } from '../lib/useDragRotate';
import { makeShapes } from './shapes';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    const { shapes, rand, rand2 } = makeShapes(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(shapes[0], 3));
    shapes.forEach((s, i) => g.setAttribute(`aP${i}`, new THREE.BufferAttribute(s, 3)));
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    g.setAttribute('aRand2', new THREE.BufferAttribute(rand2, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMorph: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: 30 },
        uDpr: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uA: { value: new THREE.Color('#f2f2ef') },
        uB: { value: new THREE.Color('#8fa3b0') },
        uC: { value: new THREE.Color('#a9d6e8') },
      },
      vertexShader: /* glsl */ `
        uniform float uMorph, uTime, uSize, uDpr;
        attribute vec3 aP0, aP1, aP2, aP3;
        attribute float aRand, aRand2;
        varying float vAlpha, vMix, vAcc;
        vec3 pick(float i) { return i < .5 ? aP0 : i < 1.5 ? aP1 : i < 2.5 ? aP2 : aP3; }
        void main() {
          float seg = floor(min(uMorph, 2.999));
          float t = clamp((uMorph - seg - aRand * .3) / .7, 0., 1.);
          t = t * t * (3. - 2. * t);
          vec3 p = mix(pick(seg), pick(seg + 1.), t);
          float swirl = sin(t * 3.14159) * .4;
          p += swirl * vec3(sin(aRand * 40.), cos(aRand2 * 40.), sin(aRand * 23.));
          p += .02 * vec3(sin(uTime * 1.3 + aRand * 40.), cos(uTime * 1.1 + aRand2 * 30.), sin(uTime * .9 + aRand * 20.));
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          gl_PointSize = uSize * uDpr * (.5 + aRand2 * .8) / -mv.z;
          gl_Position = projectionMatrix * mv;
          vAlpha = smoothstep(13., 5., -mv.z) * (.3 + .6 * aRand2);
          vMix = clamp(p.x * .18 + .5, 0., 1.);
          vAcc = step(.965, aRand);
        }`,
      fragmentShader: /* glsl */ `
        precision mediump float;
        uniform vec3 uA, uB, uC;
        varying float vAlpha, vMix, vAcc;
        void main() {
          float d = length(gl_PointCoord - .5);
          if (d > .5) discard;
          float a = pow(smoothstep(.5, .0, d), 1.7) * vAlpha;
          vec3 col = mix(mix(uA, uB, vMix), uC, vAcc);
          gl_FragColor = vec4(col, a);
        }`,
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state, dt) => {
    const p = sceneProgress.pipeline;
    const x = Math.min(3.999, p * 4);
    const act = Math.floor(x);
    const target = act + (act < 3 ? smoothstep(0.5, 0.95, x - act) : 0);
    const u = material.uniforms;
    u.uMorph.value = target; // ตาม scroll ตรง ๆ (Lenis หน่วงให้แล้ว ไม่ซ้อน easing อีกชั้น)
    u.uTime.value = state.clock.elapsedTime;
    const pts = ref.current;
    if (pts) {
      stepSpin(spins.pipeline, dt);
      pts.rotation.y = state.clock.elapsedTime * 0.06 + sceneProgress.pointerX * 0.3 + spins.pipeline.angle;
      pts.rotation.x = sceneProgress.pointerY * 0.12 + spins.pipeline.tilt;
    }
  });

  return <points ref={ref} geometry={geometry} material={material} />;
}

export default function PipelineScene({ active, count }: { active: boolean; count: number }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 38, position: [0, 0, 8] }}
      frameloop={reduceMotion ? 'demand' : active ? 'always' : 'never'}
    >
      <color attach="background" args={['#050505']} />
      <Particles count={count} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.2} luminanceSmoothing={0.4} />
      </EffectComposer>
    </Canvas>
  );
}
