/* รูปทรงของอนุภาค (จำนวนจุดเท่ากันทุกรูป) — cloud → helix → neural → globe */
export function makeShapes(N: number) {
  let seed = 2568;
  const rnd = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;

  const cloud = () => {
    const a = new Float32Array(N * 3);
    const centers = Array.from({ length: 6 }, () => [gauss() * 2, gauss() * 1.4, gauss() * 1.2]);
    for (let i = 0; i < N; i++) {
      let x, y, z;
      if (rnd() < 0.55) {
        const c = centers[i % centers.length];
        x = c[0] + gauss() * 0.45;
        y = c[1] + gauss() * 0.45;
        z = c[2] + gauss() * 0.45;
      } else {
        const r = 2.6 * Math.cbrt(rnd()), th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
        x = r * Math.sin(ph) * Math.cos(th) * 1.25;
        y = r * Math.cos(ph) * 0.85;
        z = r * Math.sin(ph) * Math.sin(th);
      }
      a.set([x, y, z], i * 3);
    }
    return a;
  };

  const helix = () => {
    const a = new Float32Array(N * 3);
    const strand = (t: number, phase: number) => {
      const ang = t * Math.PI * 6 + phase;
      return [(t - 0.5) * 5.4, Math.cos(ang) * 1.05, Math.sin(ang) * 1.05];
    };
    for (let i = 0; i < N; i++) {
      let p: number[];
      if (rnd() < 0.82) p = strand(rnd(), rnd() < 0.5 ? 0 : Math.PI);
      else {
        const t = (Math.floor(rnd() * 28) + 0.5) / 28;
        const A = strand(t, 0), B = strand(t, Math.PI), u = rnd();
        p = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u];
      }
      a.set([p[0] + gauss() * 0.035, p[1] + gauss() * 0.035, p[2] + gauss() * 0.035], i * 3);
    }
    return a;
  };

  const neural = () => {
    const a = new Float32Array(N * 3);
    const layersX = [-2.3, -0.8, 0.8, 2.3], counts = [5, 8, 8, 3];
    const nodes = layersX.map((x, l) =>
      Array.from({ length: counts[l] }, (_, k) => [x, (k - (counts[l] - 1) / 2) * (3.4 / Math.max(counts[l] - 1, 1)) * (counts[l] > 1 ? 1 : 0), (rnd() - 0.5) * 0.5]),
    );
    const all = nodes.flat();
    for (let i = 0; i < N; i++) {
      let p: number[];
      if (rnd() < 0.42) {
        const n = all[Math.floor(rnd() * all.length)];
        const r = 0.1 * Math.cbrt(rnd()), th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
        p = [n[0] + r * Math.sin(ph) * Math.cos(th), n[1] + r * Math.cos(ph), n[2] + r * Math.sin(ph) * Math.sin(th)];
      } else {
        const l = Math.floor(rnd() * 3);
        const A = nodes[l][Math.floor(rnd() * counts[l])], B = nodes[l + 1][Math.floor(rnd() * counts[l + 1])], u = rnd();
        p = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u + gauss() * 0.008, A[2] + (B[2] - A[2]) * u];
      }
      a.set(p, i * 3);
    }
    return a;
  };

  const globe = () => {
    const a = new Float32Array(N * 3);
    const nSphere = Math.floor(N * 0.76), golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      let p: number[];
      if (i < nSphere) {
        const y = 1 - (i / (nSphere - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
        p = [Math.cos(th) * r * 1.6, y * 1.6, Math.sin(th) * r * 1.6];
      } else {
        const ring = i % 2, t = rnd() * Math.PI * 2, R = ring ? 2.25 : 1.95, tilt = ring ? 0.35 : -0.6;
        const x = Math.cos(t) * R, z = Math.sin(t) * R;
        p = [x, z * Math.sin(tilt), z * Math.cos(tilt)];
      }
      a.set(p, i * 3);
    }
    return a;
  };

  const rand = new Float32Array(N), rand2 = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    rand[i] = rnd();
    rand2[i] = rnd();
  }
  return { shapes: [cloud(), helix(), neural(), globe()], rand, rand2 };
}
