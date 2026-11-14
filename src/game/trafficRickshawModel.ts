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

// Cached textures
let cachedLungi1: THREE.CanvasTexture | null = null;
let cachedLungi2: THREE.CanvasTexture | null = null;
let cachedHoodTex: THREE.CanvasTexture | null = null;

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
  lt.colorSpace = THREE.SRGBColorSpace;
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
  lt2.colorSpace = THREE.SRGBColorSpace;
  lt2.wrapS = lt2.wrapT = THREE.RepeatWrapping;
  lt2.repeat.set(3, 2);
  cachedLungi2 = lt2;
  return lt2;
}

function getHoodTex(): THREE.CanvasTexture {
  if (cachedHoodTex) return cachedHoodTex;
  const c = cv(512, 256);
  const g = c.getContext('2d')!;
  const cols = ['#d62839', '#f7b32b', '#2b9348', '#1d4e89', '#e0457b'];
  for (let i = 0; i < 16; i++) {
    g.fillStyle = cols[i % 5];
    g.fillRect(i * 32, 0, 32, 256);
  }
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 8; j++) {
      const x = i * 32 + 16;
      const y = j * 32 + 16;
      const f = ['#fff', '#ffe27a', '#ffd0e0', '#cfe9ff'][(i + j) % 4];
      g.fillStyle = f;
      for (let p = 0; p < 5; p++) {
        g.beginPath();
        g.arc(x + Math.cos(p * 1.256) * 6, y + Math.sin(p * 1.256) * 6, 4.2, 0, 7);
        g.fill();
      }
      g.fillStyle = '#c4162a';
      g.beginPath();
      g.arc(x, y, 3, 0, 7);
      g.fill();
    }
  }
  g.fillStyle = 'rgba(255,255,255,.85)';
  for (let x = 0; x < 512; x += 16) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 8, 14);
    g.lineTo(x + 16, 0);
    g.fill();
    g.beginPath();
    g.moveTo(x, 256);
    g.lineTo(x + 8, 242);
    g.lineTo(x + 16, 256);
    g.fill();
  }
  wear(g, 512, 256, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedHoodTex = tex;
  return tex;
}

/**
 * Same to same implementation of BD Rickshaw 3D Model provided by user
 */
const cachedRickshawDecalMats = new Map<string, THREE.MeshStandardMaterial>();

export function createTrafficRickshawModel(
  textures: ProceduralTexturePack,
  variant: number = 0
): THREE.Group {
  // L is the root group of the rickshaw
  const L = new THREE.Group();
  L.add(createContactShadowMesh(textures.contactShadow, 1.8, 2.8));

  // Forward in user's model is +Z (FZ = 1.38). In game engine traffic moves towards -Z, so rotate PI.
  const root = new THREE.Group();
  root.add(L);
  L.rotation.y = Math.PI;

  const M = (c: number, o: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.6, metalness: 0.08 }, o)
    );

  const pal = Math.abs(variant) % 4;
  const bodyGreenPal = [0x1d7c46, 0x0f5f6e, 0x7c1d31, 0x1e40af][pal];
  const frameBluePal = [0x1d4e89, 0x065f46, 0x6b21a8, 0x991b1b][pal];
  const shirtPullerPal = [0x3b6e9c, 0x166534, 0x9a3412, 0x475569][pal];
  const cushionPal = [0x991b1b, 0x065f46, 0x1e3a8a, 0x854d0e][pal];

  const mat = {
    blue: M(0x1f4fa3, { roughness: 0.45, metalness: 0.2 }),
    cream: M(0xe6dec8, { roughness: 0.58 }),
    yellow: M(0xe5b219, { roughness: 0.52 }),
    red: M(0xab1920, { roughness: 0.52 }),
    black: M(0x16181c, { roughness: 0.85 }),
    rubber: M(0x101114, { roughness: 0.94 }),
    chrome: M(0xdbe1e8, { roughness: 0.18, metalness: 0.9 }),
    steel: M(0x828992, { roughness: 0.46, metalness: 0.78 }),
    glass: M(0xbfe0ee, { roughness: 0.08, transparent: true, opacity: 0.32 }),
    seat: M(0x6e1f1f, { roughness: 0.88 }),
    skin: M(0x9a6a4a, { roughness: 0.72 }),
    hair: M(0x0a0908),
    lamp: M(0xfff6cf, { emissive: 0xffe9a0, emissiveIntensity: 0.85 }),
    amber: M(0xe88b12, { emissive: 0x994a00 }),
    tail: M(0xb00d0d, { emissive: 0x600000, emissiveIntensity: 0.65 }),
    shirt: M(shirtPullerPal, { roughness: 0.86 }),
    shirt2: M(0xe6e3d8, { roughness: 0.86 }),
    gamcha: M(0xb82828, { roughness: 0.9 }),
    bag: M(0x8c6b3a, { roughness: 0.95 }),
    bag2: M(0x3a6f4a, { roughness: 0.95 }),
    green: M(bodyGreenPal, { roughness: 0.48, metalness: 0.14 }),
    redp: M(0xb91c2a, { roughness: 0.46, metalness: 0.18 }),
    blue2: M(frameBluePal, { roughness: 0.45, metalness: 0.22 }),
    yel: M(0xe5a922, { roughness: 0.5 }),
    pink: M(0xc83d6b, { roughness: 0.52 }),
    dark: M(0x15171c, { roughness: 0.74 }),
    cush: M(cushionPal, { roughness: 0.64 }),
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
    const key = `${w}_${h}_${pw}_${ph}_${Math.round(y * 100)}_${Math.round(z * 100)}_${Math.round(ry * 100)}`;
    let decalMat = cachedRickshawDecalMats.get(key);
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
      cachedRickshawDecalMats.set(key, decalMat);
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
    const lg = o.lungi || lungi;
    const base = o.seat ? 0.34 : 0.86 * k;
    if (o.seat) {
      for (const s of [-1, 1]) {
        const hip = [s * 0.09 * k, base, 0];
        const knee = [s * 0.1 * k, base + 0.02, 0.4 * k];
        const ank = [s * 0.1 * k, 0.06, 0.46 * k];
        const low = lerp3(knee, ank, 0.62);
        limb(hip, knee, 0.105 * k, lg, g, 0.09 * k);
        limb(knee, low, 0.085 * k, lg, g, 0.08 * k);
        limb(low, ank, 0.036 * k, mat.skin, g);
        B(0.09 * k, 0.05, 0.18 * k, mat.black, s * 0.1 * k, 0.03, 0.52 * k, g);
      }
      SP(0.2 * k, lg, 0, base + 0.03, 0, g, 1, 0.55, 0.9);
    } else {
      for (const s of [-1, 1]) {
        limb([s * 0.075 * k, 0.05, 0], [s * 0.075 * k, 0.3 * k, 0], 0.036 * k, mat.skin, g);
        B(0.09 * k, 0.05, 0.18 * k, mat.black, s * 0.075 * k, 0.025, 0.04 * k, g);
      }
      addMesh(new THREE.CylinderGeometry(0.15 * k, 0.2 * k, 0.6 * k, 20), lg, 0, 0.57 * k, 0, g);
      SP(0.17 * k, lg, 0, 0.86 * k, 0, g, 1, 0.5, 0.9);
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

  // ---------- wheels ----------
  function wheel(x: number, z: number, r = 0.33) {
    const g = new THREE.Group();
    g.position.set(x, r, z);
    L.add(g);
    addMesh(new THREE.TorusGeometry(r, 0.032, 8, 20), mat.rubber, 0, 0, 0, g).rotation.y = Math.PI / 2;
    addMesh(new THREE.TorusGeometry(r - 0.035, 0.011, 6, 18), mat.chrome, 0, 0, 0, g).rotation.y = Math.PI / 2;
    addMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), mat.chrome, 0, 0, 0, g).rotation.z = Math.PI / 2;
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI * 2) / 10;
      const o = i % 2 ? 0.035 : -0.035;
      limb([o, 0, 0], [0, Math.sin(a) * (r - 0.04), Math.cos(a) * (r - 0.04)], 0.0035, mat.chrome, g);
    }
  }

  const FZ = 1.38,
    RZ = -0.55,
    RX = 0.58;
  wheel(0, FZ);
  wheel(-RX, RZ);
  wheel(RX, RZ);

  const fend = (x: number, z: number, r: number, w: number, m: THREE.Material) => {
    const f = addMesh(new THREE.CylinderGeometry(r, r, w, 28, 1, true, 0, Math.PI), m, x, 0.33, z);
    f.rotation.z = Math.PI / 2;
  };
  fend(0, FZ, 0.38, 0.07, mat.redp);
  fend(-RX, RZ, 0.38, 0.1, mat.yel);
  fend(RX, RZ, 0.38, 0.1, mat.yel);
  limb([-RX - 0.08, 0.33, RZ], [RX + 0.08, 0.33, RZ], 0.015, mat.steel);

  // ---------- frame ----------
  const HEAD = [0, 0.98, 1.05],
    CR = [0, 0.4, 0.65],
    FA = [0, 0.33, FZ];
  limb(HEAD, CR, 0.025, mat.blue2);
  limb(HEAD, [0, 0.8, 0.45], 0.022, mat.blue2);
  limb(CR, [0, 0.88, 0.45], 0.022, mat.blue2);
  for (const s of [-1, 1]) limb([s * 0.045, 0.33, FZ], [0, 1.0, 1.05], 0.013, mat.chrome);
  limb([0, 0.98, 1.05], [0, 1.15, 1.08], 0.018, mat.chrome);
  B(0.66, 0.025, 0.025, mat.chrome, 0, 1.15, 1.1);
  for (const s of [-1, 1]) {
    CY(0.018, 0.018, 0.11, mat.rubber, s * 0.3, 1.15, 1.1).rotation.z = Math.PI / 2;
    limb([s * 0.3, 1.15, 1.1], [s * 0.32, 1.17, 1.06], 0.008, mat.chrome);
    for (let i = 0; i < 5; i++)
      B(0.012, 0.16, 0.004, [mat.redp, mat.yel, mat.green, mat.pink, mat.blue2][i], s * (0.34 + i * 0.008), 1.07, 1.1);
  }
  SP(0.035, mat.chrome, 0.1, 1.18, 1.1, L, 1, 0.7, 1);
  for (const s of [-1, 1]) {
    limb([s * 0.3, 0.42, 0.65], [s * 0.3, 0.42, -1.05], 0.022, mat.dark);
  }
  limb([0, 0.4, 0.65], [0, 0.8, 0.45], 0.02, mat.dark);
  B(0.14, 0.045, 0.26, mat.black, 0, 0.9, 0.45);
  limb([0, 0.72, 0.45], [0, 0.88, 0.45], 0.012, mat.chrome);

  // crank, pedals, chain
  CY(0.09, 0.09, 0.012, mat.steel, 0.1, 0.4, 0.65, L, 24).rotation.z = Math.PI / 2;
  limb([0.14, 0.4, 0.65], [0.14, 0.51, 0.78], 0.012, mat.steel);
  limb([0.14, 0.4, 0.65], [0.14, 0.29, 0.52], 0.012, mat.steel);
  B(0.1, 0.025, 0.14, mat.black, 0.2, 0.51, 0.78);
  B(0.1, 0.025, 0.14, mat.black, 0.2, 0.29, 0.52);
  CY(0.03, 0.03, 0.012, mat.steel, 0.1, 0.33, RZ, L, 16).rotation.z = Math.PI / 2;
  limb([0.1, 0.49, 0.65], [0.1, 0.36, RZ], 0.004, mat.black);
  limb([0.1, 0.31, 0.65], [0.1, 0.3, RZ], 0.004, mat.black);

  // ---------- passenger part ----------
  B(1.0, 0.14, 0.6, mat.blue2, 0, 0.58, -0.3);
  B(0.94, 0.12, 0.52, mat.cush, 0, 0.7, -0.3);
  const sb = B(0.94, 0.42, 0.1, mat.cush, 0, 0.97, -0.62);
  sb.rotation.x = -0.12;
  B(0.7, 0.03, 0.3, mat.steel, 0, 0.36, 0.18);
  for (const s of [-1, 1]) {
    B(0.03, 0.4, 0.7, mat.green, s * 0.5, 0.62, -0.3);
    B(0.03, 0.04, 0.72, mat.yel, s * 0.5, 0.84, -0.3);
    B(0.03, 0.04, 0.72, mat.yel, s * 0.5, 0.4, -0.3);
  }
  B(1.06, 0.74, 0.03, mat.green, 0, 0.82, -0.7);
  for (const s of [-1, 1]) {
    B(0.05, 0.05, 0.03, mat.redp, s * 0.45, 0.46, -0.73);
  }

  // hood: striped fabric half-cylinder with ribs, fringe, flowers
  const _h0 = L.children.length;
  const HY = 0.9,
    HR = 0.56,
    HZ0 = -0.76,
    HZ1 = 0.1,
    HL = HZ1 - HZ0;
  {
    const hoodTex =
      Math.abs(variant) % 5 === 4
        ? getHoodTex()
        : textures.rickshawHoodVariants[Math.abs(variant) % textures.rickshawHoodVariants.length];
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(HR, HR, HL, 48, 1, true, -Math.PI / 2, Math.PI),
      new THREE.MeshStandardMaterial({ map: hoodTex, roughness: 0.82, side: THREE.DoubleSide })
    );
    m.rotation.x = -Math.PI / 2;
    m.scale.set(1, 1, 1.45);
    m.position.set(0, HY, (HZ0 + HZ1) / 2);
    m.castShadow = m.receiveShadow = true;
    L.add(m);
  }
  for (const z of [HZ0, -0.55, -0.3, -0.05, HZ1]) {
    const t = addMesh(new THREE.TorusGeometry(HR, 0.017, 8, 40, Math.PI), mat.dark, 0, HY, z);
    t.scale.y = 1.45;
  }
  for (let i = 0; i <= 16; i++) {
    const a = (Math.PI * i) / 16,
      x = HR * Math.cos(a),
      y = HY + HR * 1.45 * Math.sin(a),
      c = [mat.redp, mat.yel, mat.green, mat.pink, mat.blue2][i % 5];
    B(0.045, 0.14, 0.01, c, x, y - 0.08, HZ1 + 0.01);
    SP(0.02, [mat.yel, mat.pink, mat.redp][i % 3], x, y, HZ1 + 0.02);
  }
  for (const s of [-1, 1]) {
    limb([s * HR, 0.62, HZ0 + 0.05], [s * HR, HY, HZ0 + 0.05], 0.014, mat.chrome);
    limb([s * HR, 0.62, HZ1 - 0.02], [s * HR, HY, HZ1 - 0.02], 0.014, mat.chrome);
  }
  L.updateMatrixWorld(true);
  {
    const hg = new THREE.Group();
    hg.position.set(0, 0.9, -0.76);
    L.add(hg);
    const kids = L.children.slice(_h0, L.children.length - 1);
    kids.forEach((k) => hg.attach(k));
    hg.rotation.x = -0.14;
  }

  // ---------- driver (pedalling, lungi folded to the knee, gamcha) ----------
  {
    const u = 0.84,
      hy = 0.95,
      hz = 0.45,
      P = (dy: number, dz: number) => [0, hy + dy * u, hz + dz * u];
    const hip = [0, hy, hz],
      sh = P(0.45, 0.17);
    limb(hip, sh, 0.125 * u, mat.shirt, L, 0.11 * u);
    SP(0.19 * u, mat.shirt, 0, sh[1] - 0.01, sh[2], L, 1.1, 0.45, 0.7);
    const nk = P(0.52, 0.21),
      hd = P(0.66, 0.25);
    CY(0.04 * u, 0.05 * u, 0.1 * u, mat.skin, 0, nk[1], nk[2]);
    SP(0.115 * u, mat.skin, 0, hd[1], hd[2], L, 1, 1.1, 1);
    SP(0.118 * u, mat.hair, 0, hd[1] + 0.04 * u, hd[2] - 0.03 * u, L, 1, 0.9, 1.02);
    SP(0.014 * u, mat.skin, 0, hd[1] - 0.02 * u, hd[2] + 0.11 * u, L, 1, 1.4, 1.2);
    SP(0.04 * u, mat.hair, 0, hd[1] - 0.05 * u, hd[2] + 0.1 * u, L, 1, 0.18, 0.4);
    for (const s of [-1, 1]) SP(0.011 * u, mat.skin, s * 0.115 * u, hd[1], hd[2], L, 1, 2.2, 1.5);
    const dgamcha = addMesh(new THREE.TorusGeometry(0.085 * u, 0.022, 8, 20), mat.gamcha, 0, nk[1], nk[2]);
    dgamcha.rotation.x = Math.PI / 2 + 0.3;
    for (const s of [-1, 1]) {
      const S0 = [s * 0.19 * u, sh[1] - 0.02, sh[2]],
        H = [s * 0.3, 1.16, 1.1],
        E = lerp3(S0, H, 0.5);
      E[0] += s * 0.05;
      E[1] -= 0.06;
      limb(S0, E, 0.034 * u, mat.shirt, L, 0.03 * u);
      limb(E, H, 0.028 * u, mat.skin);
      SP(0.036, mat.skin, H[0], H[1], H[2]);
    }
    SP(0.18 * u, lungi, 0, hy - 0.01, hz + 0.02, L, 1, 0.6, 1.2);
    const legs: [number, number[], number[]][] = [
      [-1, [-0.11, 0.9, 0.8], [-0.12, 0.58, 0.74]],
      [1, [0.11, 0.72, 0.62], [0.12, 0.36, 0.52]],
    ];
    for (const [s, k, an] of legs) {
      const hp = [s * 0.09, hy, hz + 0.01];
      limb(hp, k, 0.092 * u, lungi, L, 0.08 * u);
      limb(k, an, 0.042, mat.skin, L, 0.033);
      B(0.09, 0.04, 0.2, mat.black, an[0], an[1] - 0.03, an[2] + 0.04);
    }
  }

  // passenger
  human({ x: 0, y: 0.49, z: -0.3, seat: true, k: 0.72, shirt: M(0x3a8a6a, { roughness: 0.85 }), lungi: lungi2 });

  // ---------- painted art ----------
  function flowerField(g: CanvasRenderingContext2D, w: number, h: number, base: string) {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#f7b32b';
    g.fillRect(0, 0, w, 10);
    g.fillRect(0, h - 10, w, 10);
    g.fillRect(0, 0, 10, h);
    g.fillRect(w - 10, 0, 10, h);
    const cols = ['#e0457b', '#f7b32b', '#fff', '#ff6a3d', '#7ad0ff'];
    for (let i = 0; i < 22; i++) {
      const x = rnd(30, w - 30),
        y = rnd(30, h - 30),
        r = rnd(10, 22),
        c = cols[i % 5];
      g.fillStyle = '#1d8a4a';
      g.beginPath();
      g.ellipse(x + r * 1.4, y + r * 0.4, r * 1.2, r * 0.5, 0.4, 0, 7);
      g.ellipse(x - r * 1.4, y + r * 0.4, r * 1.2, r * 0.5, -0.4, 0, 7);
      g.fill();
      g.fillStyle = c;
      for (let p = 0; p < 6; p++) {
        g.beginPath();
        g.arc(x + Math.cos(p * 1.05) * r * 0.8, y + Math.sin(p * 1.05) * r * 0.8, r * 0.55, 0, 7);
        g.fill();
      }
      g.fillStyle = '#f7b32b';
      g.beginPath();
      g.arc(x, y, r * 0.45, 0, 7);
      g.fill();
    }
    wear(g, w, h, 0.8);
  }

  for (const s of [-1, 1])
    decal(
      400,
      260,
      (g, w, h) => flowerField(g, w, h, '#17604a'),
      0.68,
      0.36,
      s * 0.52,
      0.62,
      -0.3,
      s > 0 ? Math.PI / 2 : -Math.PI / 2
    );

  decal(
    520,
    380,
    (g, w, h) => {
      g.fillStyle = '#c4162a';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#f7b32b';
      g.fillRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#1d4e89';
      g.fillRect(16, 16, w - 32, h - 32);
      const sk = g.createLinearGradient(0, 24, 0, 250);
      sk.addColorStop(0, '#58b7ff');
      sk.addColorStop(1, '#ffe3a0');
      g.fillStyle = sk;
      g.fillRect(24, 70, w - 48, 200);
      g.fillStyle = '#ff8a1f';
      g.beginPath();
      g.arc(390, 130, 38, 0, 7);
      g.fill();
      g.fillStyle = '#2fa24a';
      g.beginPath();
      g.moveTo(24, 270);
      g.quadraticCurveTo(140, 190, 260, 250);
      g.quadraticCurveTo(380, 200, 496, 270);
      g.fill();
      g.fillStyle = '#f4efe0';
      g.fillRect(150, 170, 110, 70);
      g.beginPath();
      g.arc(205, 170, 42, Math.PI, 0);
      g.fill();
      g.fillRect(138, 120, 14, 120);
      g.fillRect(258, 120, 14, 120);
      g.beginPath();
      g.arc(145, 118, 10, Math.PI, 0);
      g.arc(265, 118, 10, Math.PI, 0);
      g.fill();
      g.fillStyle = '#8a5a2a';
      g.fillRect(430, 170, 8, 70);
      g.fillStyle = '#1d8a4a';
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.ellipse(434 + Math.cos(i * 1.3) * 22, 168 + Math.sin(i * 1.3) * 12, 24, 6, i, 0, 7);
        g.fill();
      }
      g.fillStyle = '#2b7de0';
      g.beginPath();
      g.moveTo(24, 300);
      g.quadraticCurveTo(130, 280, 260, 300);
      g.quadraticCurveTo(390, 320, 496, 296);
      g.lineTo(496, 340);
      g.lineTo(24, 340);
      g.fill();
      g.fillStyle = '#fff';
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(60 + i * 110, 60);
        g.quadraticCurveTo(70 + i * 110, 48, 80 + i * 110, 60);
        g.stroke();
      }
      g.fillStyle = '#14783d';
      g.fillRect(100, 24, 320, 44);
      txt(g, 'আল্লাহ ভরসা', 260, 58, 38, '#fff');
      txt(g, 'মা-বাবার দোয়া', 260, 330, 34, '#f7b32b', '#000');
      const fl = ['#e0457b', '#f7b32b', '#fff', '#ff6a3d'];
      for (let i = 0; i < 10; i++) {
        const x = i < 5 ? 40 + i * 18 : 480 - (i - 5) * 18,
          y = i % 2 ? 345 : 300;
        g.fillStyle = fl[i % 4];
        g.beginPath();
        g.arc(x, y, 9, 0, 7);
        g.fill();
      }
      wear(g, w, h, 1);
    },
    1.0,
    0.72,
    0,
    0.82,
    -0.72,
    Math.PI
  );

  decal(
    300,
    90,
    (g, w, h) => {
      g.fillStyle = '#f4f2ea';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#c4162a';
      g.fillRect(0, 0, w, 10);
      txt(g, 'ঢাকা-৫৪৩২', w / 2, 70, 50, '#111');
      wear(g, w, h, 0.5);
    },
    0.3,
    0.09,
    0,
    0.5,
    -0.73,
    Math.PI
  );

  // tassels + pom-poms hanging under the painted back panel
  for (let i = 0; i < 12; i++) {
    const x = -0.5 + i * 0.0909,
      c = [mat.redp, mat.yel, mat.green, mat.pink, mat.blue2][i % 5];
    B(0.035, 0.15, 0.012, c, x, 0.4, -0.74);
    SP(0.022, c, x, 0.31, -0.74);
  }

  // brake levers + cables, chain guard, front lamp reflector
  for (const s of [-1, 1]) {
    B(0.01, 0.01, 0.1, mat.black, s * 0.26, 1.13, 1.03);
    limb([s * 0.26, 1.13, 1.0], [s * 0.03, 0.98, 1.04], 0.003, mat.black);
  }
  B(0.02, 0.09, 0.7, mat.blue2, 0.13, 0.42, 0.15);
  SP(0.03, mat.redp, 0, 0.7, 1.38, L, 1, 0.8, 1);

  // tail
  B(0.05, 0.1, 0.02, mat.tail, -0.4, 0.4, -0.74);
  B(0.05, 0.1, 0.02, mat.tail, 0.4, 0.4, -0.74);

  return root;
}
