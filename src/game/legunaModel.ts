import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import { createContactShadowMesh } from './models';

const BN = '"Noto Sans Bengali","Kalpurush","Nirmala UI","Shonar Bangla",Arial,sans-serif';

function cv(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

const txt = (
  g: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  sz: number,
  fill: string,
  st?: string
) => {
  g.font = `bold ${sz}px ${BN}`;
  g.textAlign = 'center';
  g.lineJoin = 'round';
  if (st) {
    g.strokeStyle = st;
    g.lineWidth = sz * 0.18;
    g.strokeText(s, x, y);
  }
  g.fillStyle = fill;
  g.fillText(s, x, y);
};

function wear(g: CanvasRenderingContext2D, w: number, h: number, a = 1) {
  for (let i = 0; i < (w * h) / 110 * a; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? '30,24,18' : '235,230,220'},${rnd(0.03, 0.1)})`;
    g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 3), rnd(1, 3));
  }
  for (let i = 0; i < 10 * a; i++) {
    g.fillStyle = `rgba(40,30,20,${rnd(0.03, 0.08)})`;
    g.fillRect(rnd(0, w), rnd(0, h * 0.3), rnd(1, 4), rnd(h * 0.2, h * 0.7));
  }
}

const lerp3 = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

let cachedLungi1: THREE.CanvasTexture | null = null;
let cachedLungi2: THREE.CanvasTexture | null = null;

function getLungiTex1(): THREE.CanvasTexture {
  if (cachedLungi1) return cachedLungi1;
  const lc = cv(128, 128);
  const lg = lc.getContext('2d')!;
  lg.fillStyle = '#1c4fa0';
  lg.fillRect(0, 0, 128, 128);
  lg.fillStyle = '#1d7a46';
  lg.fillRect(0, 0, 64, 64);
  lg.fillRect(64, 64, 64, 64);
  lg.fillStyle = '#eee9da';
  for (let i = 0; i < 128; i += 16) {
    lg.fillRect(i, 0, 3, 128);
    lg.fillRect(0, i, 128, 3);
  }
  const lt = new THREE.CanvasTexture(lc);
  lt.wrapS = lt.wrapT = THREE.RepeatWrapping;
  lt.repeat.set(3, 2);
  cachedLungi1 = lt;
  return lt;
}

function getLungiTex2(): THREE.CanvasTexture {
  if (cachedLungi2) return cachedLungi2;
  const lc2 = cv(128, 128);
  const lg2 = lc2.getContext('2d')!;
  lg2.fillStyle = '#7a1530';
  lg2.fillRect(0, 0, 128, 128);
  lg2.fillStyle = '#d9c58a';
  for (let i = 0; i < 128; i += 21) {
    lg2.fillRect(i, 0, 3, 128);
    lg2.fillRect(0, i, 128, 3);
  }
  const lt2 = new THREE.CanvasTexture(lc2);
  lt2.wrapS = lt2.wrapT = THREE.RepeatWrapping;
  lt2.repeat.set(3, 2);
  cachedLungi2 = lt2;
  return lt2;
}

/**
 * Same to same implementation of BD Leguna 3D Model provided by user
 */
const cachedLegunaDecalMats = new Map<string, THREE.MeshStandardMaterial>();

export function createLegunaModel(textures: ProceduralTexturePack): THREE.Group {
  const L = new THREE.Group();
  L.add(createContactShadowMesh(textures.contactShadow, 2.4, 4.4));

  // Forward in user model is +Z (FZ = 1.0). Rotate PI so front points towards -Z for traffic.
  const root = new THREE.Group();
  root.add(L);
  L.rotation.y = Math.PI;

  const M = (c: number, o: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.6, metalness: 0.08 }, o)
    );

  const mat = {
    blue: M(0x1f4fa3, { roughness: 0.4, metalness: 0.2 }),
    cream: M(0xe9e2cc, { roughness: 0.55 }),
    yellow: M(0xf2c200),
    red: M(0xb4161d),
    black: M(0x16171a, { roughness: 0.85 }),
    rubber: M(0x0e0e10, { roughness: 0.95 }),
    chrome: M(0xdfe3e6, { roughness: 0.15, metalness: 1 }),
    steel: M(0x8a9097, { roughness: 0.45, metalness: 0.8 }),
    glass: M(0xbfe0ee, { roughness: 0.05, transparent: true, opacity: 0.3 }),
    seat: M(0x7a1f1f, { roughness: 0.9 }),
    skin: M(0x9a6a4a, { roughness: 0.7 }),
    hair: M(0x0a0908),
    lamp: M(0xfff6cf, { emissive: 0xffe9a0, emissiveIntensity: 0.9 }),
    amber: M(0xff9a00, { emissive: 0xaa5500 }),
    tail: M(0xb00d0d, { emissive: 0x600000, emissiveIntensity: 0.7 }),
    shirt: M(0x4d7fb0, { roughness: 0.85 }),
    shirt2: M(0xe8e6dc, { roughness: 0.85 }),
    gamcha: M(0xc02a2a, { roughness: 0.9 }),
    bag: M(0x8c6b3a, { roughness: 0.95 }),
    bag2: M(0x3a6f4a, { roughness: 0.95 }),
    white: M(0xe6e8e8, { roughness: 0.5, metalness: 0.1 }),
    orange: M(0xe3963e, { roughness: 0.8 }),
    dark: M(0x0f1012, { roughness: 0.8 }),
    gl2: M(0x2a3a44, { roughness: 0.05, transparent: true, opacity: 0.45 }),
  };

  const addMesh = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, p = L, shadow = false) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = shadow;
    o.receiveShadow = false;
    p.add(o);
    return o;
  };

  const B = (w: number, h: number, d: number, m: THREE.Material | THREE.Material[], x: number, y: number, z: number, p = L) =>
    addMesh(new THREE.BoxGeometry(w, h, d), m as THREE.Material, x, y, z, p);

  const SP = (
    r: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    p = L,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    const o = addMesh(new THREE.SphereGeometry(r, 8, 6), m, x, y, z, p);
    o.scale.set(sx, sy, sz);
    return o;
  };

  const CY = (
    rt: number,
    rb: number,
    h: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    p = L,
    n = 10
  ) => addMesh(new THREE.CylinderGeometry(rt, rb, h, n), m, x, y, z, p);

  function decal(
    w: number,
    h: number,
    fn: (g: CanvasRenderingContext2D, w: number, h: number) => void,
    pw: number,
    ph: number,
    x: number,
    y: number,
    z: number,
    ry: number,
    rz = 0
  ) {
    const key = `${w}_${h}_${pw}_${ph}_${Math.round(x * 100)}_${Math.round(y * 100)}_${Math.round(z * 100)}_${Math.round(ry * 100)}`;
    let decalMat = cachedLegunaDecalMats.get(key);
    if (!decalMat) {
      const c = cv(w, h);
      const g = c.getContext('2d')!;
      fn(g, w, h);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      decalMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.7,
        transparent: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      });
      cachedLegunaDecalMats.set(key, decalMat);
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), decalMat);
    m.rotation.order = 'YXZ';
    m.rotation.set(0, ry, rz);
    m.position.set(x, y, z);
    L.add(m);
    return m;
  }

  const lungi = M(0xffffff, { map: getLungiTex1(), roughness: 0.92 });
  const lungi2 = M(0xffffff, { map: getLungiTex2(), roughness: 0.92 });

  const limb = (
    a: number[],
    b: number[],
    r: number,
    m: THREE.Material,
    p = L,
    r2?: number
  ) => {
    const A = new THREE.Vector3(...a);
    const Bv = new THREE.Vector3(...b);
    const d = Bv.clone().sub(A);
    const len = d.length();
    const o = addMesh(new THREE.CylinderGeometry(r2 === undefined ? r : r2, r, len, 12), m, 0, 0, 0, p);
    o.position.copy(A).add(Bv).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return o;
  };

  function human(o: {
    k?: number;
    x: number;
    y: number;
    z: number;
    ry?: number;
    shirt: THREE.Material;
    lungi?: THREE.Material;
    seat?: boolean;
    gamcha?: boolean;
    hands?: number[][];
  }) {
    const k = o.k || 1;
    const g = new THREE.Group();
    g.position.set(o.x, o.y, o.z);
    g.rotation.y = o.ry || 0;
    L.add(g);
    const sh = o.shirt;
    const lgMat = o.lungi || lungi;
    const base = o.seat ? 0.34 : 0.86 * k;
    if (o.seat) {
      for (const s of [-1, 1]) {
        const hip = [s * 0.09 * k, base, 0];
        const knee = [s * 0.1 * k, base + 0.02, 0.4 * k];
        const ank = [s * 0.1 * k, 0.06, 0.46 * k];
        const low = lerp3(knee, ank, 0.62);
        limb(hip, knee, 0.105 * k, lgMat, g, 0.09 * k);
        limb(knee, low, 0.085 * k, lgMat, g, 0.08 * k);
        limb(low, ank, 0.036 * k, mat.skin, g);
        B(0.09 * k, 0.05, 0.18 * k, mat.black, s * 0.1 * k, 0.03, 0.52 * k, g);
      }
      SP(0.2 * k, lgMat, 0, base + 0.03, 0, g, 1, 0.55, 0.9);
    } else {
      for (const s of [-1, 1]) {
        limb([s * 0.075 * k, 0.05, 0], [s * 0.075 * k, 0.3 * k, 0], 0.036 * k, mat.skin, g);
        B(0.09 * k, 0.05, 0.18 * k, mat.black, s * 0.075 * k, 0.025, 0.04 * k, g);
      }
      addMesh(new THREE.CylinderGeometry(0.15 * k, 0.2 * k, 0.6 * k, 20), lgMat, 0, 0.57 * k, 0, g);
      SP(0.17 * k, lgMat, 0, 0.86 * k, 0, g, 1, 0.5, 0.9);
    }
    CY(0.13 * k, 0.115 * k, 0.5 * k, sh, 0, base + 0.28 * k, 0, g);
    SP(0.17 * k, sh, 0, base + 0.52 * k, 0, g, 1.25, 0.4, 0.7);
    CY(0.04 * k, 0.05 * k, 0.1 * k, mat.skin, 0, base + 0.62 * k, 0, g);
    SP(0.115 * k, mat.skin, 0, base + 0.74 * k, 0.01 * k, g, 1, 1.1, 1);
    SP(0.118 * k, mat.hair, 0, base + 0.78 * k, -0.02 * k, g, 1, 0.9, 1.02);
    SP(0.014 * k, mat.skin, 0, base + 0.73 * k, 0.118 * k, g, 1, 1.4, 1.2);
    SP(0.04 * k, mat.hair, 0, base + 0.69 * k, 0.108 * k, g, 1, 0.18, 0.4);
    for (const s of [-1, 1]) SP(0.011 * k, mat.skin, s * 0.115 * k, base + 0.74 * k, 0, g, 1, 2.2, 1.5);
    if (o.gamcha) {
      const gtor = addMesh(new THREE.TorusGeometry(0.085 * k, 0.022, 8, 20), mat.gamcha, 0, base + 0.6 * k, 0, g);
      gtor.rotation.x = Math.PI / 2;
    }
    for (const s of [-1, 1]) {
      const S0 = [s * 0.2 * k, base + 0.5 * k, 0];
      const H = (o.hands && o.hands[s > 0 ? 1 : 0]) || [s * 0.24 * k, base - 0.02, 0.14 * k];
      const E = lerp3(S0, H, 0.5);
      E[0] += s * 0.05 * k;
      E[1] -= 0.07 * k;
      E[2] -= 0.02 * k;
      limb(S0, E, 0.036 * k, sh, g, 0.032 * k);
      limb(E, H, 0.03 * k, mat.skin, g, 0.03 * k);
      SP(0.04 * k, mat.skin, H[0], H[1], H[2], g);
    }
    return g;
  }

  const FZ = 1.0,
    RZ = -1.3,
    WX = 0.74,
    HW = 0.7;

  // ---------- chassis & 4 wheels ----------
  B(1.0, 0.1, 3.4, mat.dark, 0, 0.42, -0.4);
  B(1.5, 0.08, 0.5, mat.dark, 0, 0.38, FZ);
  B(1.5, 0.08, 0.5, mat.dark, 0, 0.38, RZ);
  B(1.5, 0.06, 0.06, mat.steel, 0, 0.27, FZ);
  B(1.5, 0.06, 0.06, mat.steel, 0, 0.27, RZ);

  function wheel(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0.27, z);
    L.add(g);
    const w = 0.17,
      rz = (o: THREE.Mesh) => {
        o.rotation.z = Math.PI / 2;
        return o;
      };
    rz(addMesh(new THREE.CylinderGeometry(0.27, 0.27, w, 14), mat.rubber, 0, 0, 0, g));
    rz(addMesh(new THREE.CylinderGeometry(0.17, 0.17, w + 0.02, 12), mat.steel, 0, 0, 0, g));
    rz(addMesh(new THREE.CylinderGeometry(0.05, 0.05, w + 0.05, 8), mat.chrome, 0, 0, 0, g));
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      rz(addMesh(new THREE.CylinderGeometry(0.014, 0.014, w + 0.06, 6), mat.chrome, 0, Math.sin(a) * 0.11, Math.cos(a) * 0.11, g));
    }
  }

  for (const s of [-1, 1])
    for (const z of [FZ, RZ]) {
      wheel(s * WX, z);
      const f = addMesh(new THREE.TorusGeometry(0.32, 0.03, 8, 24, Math.PI), mat.dark, s * WX, 0.27, z);
      f.rotation.y = Math.PI / 2;
    }

  // ---------- cab (white Suzuki-type) ----------
  function sidePanel(sx: number) {
    const sh = new THREE.Shape();
    [
      [0, 0.4],
      [0, 1.55],
      [0.78, 1.55],
      [1.1, 1.1],
      [1.3, 0.95],
      [1.3, 0.4],
    ].forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
    const h = new THREE.Path();
    [
      [0.12, 1.17],
      [0.12, 1.47],
      [0.76, 1.47],
      [1.03, 1.14],
    ].forEach((p, i) => (i ? h.lineTo(p[0], p[1]) : h.moveTo(p[0], p[1])));
    sh.holes.push(h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    g.translate(sx > 0 ? HW : -HW + 0.05, 0, 0);
    const m = new THREE.Mesh(g, mat.white);
    m.castShadow = true;
    m.receiveShadow = false;
    L.add(m);
    const gs = new THREE.ShapeGeometry(
      new THREE.Shape(
        [
          [0.12, 1.17],
          [0.12, 1.47],
          [0.76, 1.47],
          [1.03, 1.14],
        ].map((p) => new THREE.Vector2(p[0], p[1]))
      )
    );
    gs.rotateY(-Math.PI / 2);
    gs.translate(sx * (HW - 0.02), 0, 0);
    L.add(new THREE.Mesh(gs, mat.gl2));
    B(0.02, 0.9, 0.02, mat.dark, sx * (HW + 0.005), 0.95, 0.1);
    B(0.02, 0.9, 0.02, mat.dark, sx * (HW + 0.005), 0.95, 1.02);
    B(0.02, 0.02, 0.92, mat.dark, sx * (HW + 0.005), 0.5, 0.56);
    B(0.05, 0.03, 0.12, mat.steel, sx * (HW + 0.03), 0.98, 0.2);
    B(0.03, 0.3, 0.03, mat.dark, sx * 0.84, 1.18, 1.0);
    B(0.05, 0.13, 0.1, mat.dark, sx * 0.86, 1.28, 1.0);
  }

  sidePanel(1);
  sidePanel(-1);
  B(1.4, 0.06, 0.82, mat.white, 0, 1.55, 0.4);
  B(1.4, 0.9, 0.04, mat.white, 0, 1.02, 0.0);
  B(1.4, 0.05, 1.3, mat.dark, 0, 0.47, 0.65);
  const ws = B(1.3, 0.58, 0.02, mat.glass, 0, 1.32, 0.96);
  ws.rotation.x = -0.62;
  const bon = B(1.4, 0.04, 0.34, mat.white, 0, 1.03, 1.22);
  bon.rotation.x = 0.69;
  B(1.4, 0.55, 0.04, mat.white, 0, 0.675, 1.29);
  B(1.4, 0.3, 0.04, mat.white, 0, 0.58, 0.0);
  B(1.4, 0.12, 0.3, mat.dark, 0, 0.9, 0.95);

  for (const s of [-1, 1]) {
    B(0.24, 0.12, 0.03, mat.lamp, s * 0.5, 0.76, 1.315);
    B(0.1, 0.05, 0.03, mat.amber, s * 0.62, 0.6, 1.315);
  }
  B(0.5, 0.14, 0.03, mat.dark, 0, 0.76, 1.315);
  for (let i = 0; i < 3; i++) B(0.46, 0.012, 0.035, mat.chrome, 0, 0.72 + i * 0.04, 1.33);
  B(1.5, 0.14, 0.12, mat.dark, 0, 0.47, 1.34);
  for (const s of [-1, 1]) SP(0.07, mat.dark, s * 0.75, 0.47, 1.34);
  const wip = B(0.02, 0.4, 0.015, mat.black, 0.1, 1.3, 1.0);
  wip.rotation.z = -0.7;

  // cab seats + car steering wheel (driver on the right = -x, Bangladesh)
  for (const s of [-1, 1]) {
    B(0.42, 0.1, 0.4, mat.seat, s * 0.33, 0.67, 0.35);
    B(0.4, 0.2, 0.4, mat.black, s * 0.33, 0.57, 0.35);
    B(0.42, 0.5, 0.08, mat.seat, s * 0.33, 0.97, 0.12);
  }
  const st = new THREE.Group();
  st.position.set(-0.33, 1.0, 0.72);
  st.rotation.x = 0.5;
  L.add(st);
  addMesh(new THREE.TorusGeometry(0.17, 0.02, 12, 32), mat.black, 0, 0, 0, st);
  B(0.34, 0.025, 0.02, mat.black, 0, 0, 0, st);
  B(0.025, 0.17, 0.02, mat.black, 0, -0.085, 0, st);
  const stHub = addMesh(new THREE.CylinderGeometry(0.04, 0.045, 0.04, 16), mat.chrome, 0, 0, 0, st);
  stHub.rotation.x = Math.PI / 2;
  limb([-0.33, 0.98, 0.75], [-0.33, 0.85, 0.9], 0.025, mat.black);

  // ---------- passenger box ----------
  const BZ0 = -2.14,
    BL = 2.14,
    BC = BZ0 + BL / 2;
  B(1.4, 0.05, BL, mat.dark, 0, 0.6, BC);
  for (const s of [-1, 1]) {
    B(0.04, 0.48, BL, mat.white, s * HW, 0.77, BC);
    for (let i = 0; i < 6; i++) B(0.045, 0.012, BL, M(0xbfc3c4), s * HW, 0.57 + i * 0.075, BC);
    B(0.05, 0.1, BL, mat.orange, s * (HW + 0.002), 0.58, BC);
    B(0.045, 0.25, BL, mat.black, s * HW, 1.135, BC);
    for (let i = 0; i < 6; i++) B(0.04, 0.38, 0.04, mat.black, s * HW, 1.45, BZ0 + 0.05 + (i * (BL - 0.1)) / 5);
    B(0.06, 0.09, BL, mat.blue, s * HW, 1.62, BC);
    B(0.4, 0.1, 1.9, mat.seat, s * 0.5, 0.8, BC - 0.05);
    B(0.38, 0.2, 1.9, mat.black, s * 0.5, 0.7, BC - 0.05);
  }
  B(1.4, 0.25, 0.04, mat.black, 0, 1.135, BZ0);
  B(1.4, 0.04, 0.04, mat.blue, 0, 1.62, BZ0);
  B(0.04, 0.38, 0.04, mat.black, 0, 1.45, BZ0);

  // canopy (orange tarpaulin, arched)
  {
    const Rcan = 3.25,
      th = 2 * Math.asin(0.8 / Rcan),
      len = 2.8;
    const g = new THREE.CylinderGeometry(Rcan, Rcan, len, 40, 1, true, -th / 2, th);
    const m = new THREE.Mesh(g, mat.orange);
    m.rotation.x = -Math.PI / 2;
    m.position.set(0, 1.83 - Rcan, BZ0 - 0.06 + len / 2);
    m.castShadow = m.receiveShadow = true;
    L.add(m);
    for (const s of [-1, 1]) B(0.02, 0.13, len, mat.orange, s * 0.795, 1.69, BZ0 - 0.06 + len / 2);
    B(1.6, 0.12, 0.02, mat.orange, 0, 1.7, BZ0 - 0.06);
  }

  // rear step, bumper, grab bar, lights
  B(1.2, 0.06, 0.36, mat.steel, 0, 0.44, BZ0 - 0.2);
  B(1.45, 0.08, 0.08, mat.black, 0, 0.5, BZ0 - 0.12);
  B(1.2, 0.03, 0.03, mat.chrome, 0, 1.5, BZ0 + 0.02);
  for (const s of [-1, 1]) {
    B(0.1, 0.16, 0.03, mat.tail, s * 0.62, 0.72, BZ0 - 0.01);
    B(0.06, 0.06, 0.03, mat.amber, s * 0.62, 0.58, BZ0 - 0.01);
  }

  // ---------- decals ----------
  const dx = (s: number) => (s > 0 ? Math.PI / 2 : -Math.PI / 2);
  for (const s of [-1, 1]) {
    decal(
      640,
      200,
      (g, w, h) => {
        g.fillStyle = 'rgba(0,0,0,0)';
        txt(g, 'পরিবহন', w * 0.58, h * 0.78, 130, '#c93a2a');
        g.fillStyle = '#c93a2a';
        g.beginPath();
        g.arc(70, 100, 52, 0, 7);
        g.fill();
        g.fillStyle = '#e6e8e8';
        g.beginPath();
        g.arc(70, 100, 24, 0, 7);
        g.fill();
        wear(g, w, h, 0.8);
      },
      1.65,
      0.36,
      s * (HW + 0.023),
      0.8,
      BC - 0.05,
      dx(s)
    );

    decal(
      900,
      70,
      (g, w) => {
        txt(g, 'সিলেট ভ্রমণ লেগুনা সার্ভিস ০১৭৫৭-১৬৯৫৩৩', w / 2, 52, 50, '#c93a2a');
        wear(g, w, 70, 0.4);
      },
      1.9,
      0.085,
      s * (HW + 0.03),
      0.58,
      BC - 0.05,
      dx(s)
    );

    decal(
      640,
      110,
      (g, w) => {
        txt(g, 'মাশা আল্লাহ', w * 0.42, 80, 84, '#c93a2a');
        txt(g, 'সিলেট', w * 0.9, 80, 64, '#c93a2a');
        wear(g, w, 110, 0.4);
      },
      2.0,
      0.11,
      s * 0.806,
      1.69,
      BC - 0.05,
      dx(s)
    );

    decal(
      240,
      90,
      (g, w, h) => {
        g.fillStyle = '#d9dcdc';
        g.fillRect(0, 0, w, h);
        txt(g, 'CARRY', w / 2, 60, 46, '#555');
        wear(g, w, h, 0.6);
      },
      0.28,
      0.1,
      s * (HW + 0.026),
      0.6,
      0.75,
      dx(s)
    );
  }

  decal(
    420,
    120,
    (g, w, h) => {
      g.fillStyle = '#f2c200';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#f7f5ea';
      g.fillRect(8, 8, w - 16, h - 16);
      txt(g, 'সিলেট-ঠ ১২-৩৪৫৬', w / 2, 82, 56, '#111');
      wear(g, w, h, 0.5);
    },
    0.34,
    0.1,
    0,
    0.6,
    1.312,
    0
  );

  const decRearPlate = decal(
    420,
    120,
    (g, w, h) => {
      g.fillStyle = '#f2c200';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#f7f5ea';
      g.fillRect(8, 8, w - 16, h - 16);
      txt(g, 'সিলেট-ঠ ১২-৩৪৫৬', w / 2, 82, 56, '#111');
      wear(g, w, h, 0.5);
    },
    0.4,
    0.11,
    -0.25,
    0.5,
    BZ0 - 0.17,
    Math.PI
  );
  decRearPlate.rotation.x = 0;

  // ---------- people ----------
  // driver (right seat), passenger in cab, helper at the rear, 3 passengers on the box benches
  human({
    x: -0.33,
    y: 0.47,
    z: 0.35,
    seat: true,
    k: 0.8,
    shirt: mat.shirt,
    lungi: lungi,
    gamcha: true,
    hands: [
      [-0.17, 0.53, 0.37],
      [0.17, 0.53, 0.37],
    ],
  });

  human({
    x: 0.33,
    y: 0.47,
    z: 0.35,
    seat: true,
    k: 0.76,
    shirt: M(0xb06a2a, { roughness: 0.85 }),
    lungi: lungi2,
  });

  human({
    x: 0.3,
    y: 0.47,
    z: BZ0 - 0.2,
    k: 0.78,
    shirt: mat.shirt2,
    lungi: lungi2,
    gamcha: true,
    hands: [
      [-0.2, 1.0, 0.22],
      [0.2, 1.0, 0.22],
    ],
  });

  human({
    x: -0.5,
    y: 0.6,
    z: -0.7,
    ry: Math.PI / 2,
    seat: true,
    k: 0.78,
    shirt: M(0x3a8a6a, { roughness: 0.85 }),
    lungi: lungi,
  });

  human({
    x: 0.5,
    y: 0.6,
    z: -1.1,
    ry: -Math.PI / 2,
    seat: true,
    k: 0.78,
    shirt: M(0x8a3a3a, { roughness: 0.85 }),
    lungi: lungi2,
  });

  human({
    x: -0.5,
    y: 0.6,
    z: -1.65,
    ry: Math.PI / 2,
    seat: true,
    k: 0.78,
    shirt: M(0x6a6a7a, { roughness: 0.85 }),
    lungi: lungi,
  });

  return root;
}
