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

const lerp3 = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

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

function grime(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  o: { bd?: number; ru?: number; st?: number; dents?: number } = {}
) {
  const bd = o.bd ?? 0.5,
    ru = o.ru ?? 30,
    st = o.st ?? 0.5,
    nd = o.dents ?? 6,
    k = w / 900;
  for (let i = 0; i < (w * h) / 500; i++) {
    g.fillStyle =
      Math.random() < 0.5
        ? `rgba(255,250,230,${rnd(0.01, 0.045)})`
        : `rgba(30,22,12,${rnd(0.015, 0.055)})`;
    g.fillRect(rnd(0, w), rnd(0, h), rnd(2, 22) * k, rnd(2, 22) * k);
  }
  for (let i = 0; i < (w / 14) * st; i++) {
    const x = rnd(0, w),
      y0 = rnd(0, h * 0.7),
      len = rnd(h * 0.1, h * 0.5),
      gr = g.createLinearGradient(0, y0, 0, y0 + len);
    gr.addColorStop(0, 'rgba(70,50,30,0)');
    gr.addColorStop(1, `rgba(70,50,30,${rnd(0.1, 0.28)})`);
    g.fillStyle = gr;
    g.fillRect(x, y0, rnd(1, 5) * k, len);
  }
  const bg = g.createLinearGradient(0, h * 0.5, 0, h);
  bg.addColorStop(0, 'rgba(60,45,30,0)');
  bg.addColorStop(1, `rgba(60,45,30,${bd})`);
  g.fillStyle = bg;
  g.fillRect(0, h * 0.5, w, h * 0.5);
  for (let i = 0; i < ru; i++) {
    const x = rnd(0, w),
      y = h * rnd(0.6, 1),
      r = rnd(8, 30) * k,
      gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, 'rgba(120,52,22,.75)');
    gr.addColorStop(0.6, 'rgba(150,80,35,.4)');
    gr.addColorStop(1, 'rgba(150,80,35,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(x, y, r * rnd(1, 2.2), r * rnd(0.5, 1), 0, 0, 7);
    g.fill();
  }
  for (let i = 0; i < w / 25; i++) {
    const x = rnd(0, w),
      y = rnd(0, h),
      l = rnd(10, 60) * k,
      a = rnd(-0.4, 0.4);
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,240,.35)' : 'rgba(40,30,20,.35)';
    g.lineWidth = rnd(0.6, 1.6) * k;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  for (let i = 0; i < nd; i++) {
    const x = rnd(w * 0.05, w * 0.95),
      y = rnd(h * 0.2, h * 0.9),
      r = rnd(18, 50) * k;
    let q = g.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r);
    q.addColorStop(0, 'rgba(0,0,0,.28)');
    q.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = q;
    g.beginPath();
    g.ellipse(x, y, r * 1.3, r, 0, 0, 7);
    g.fill();
    q = g.createRadialGradient(x + r * 0.5, y + r * 0.5, 0, x + r * 0.5, y + r * 0.5, r * 0.8);
    q.addColorStop(0, 'rgba(255,255,235,.22)');
    q.addColorStop(1, 'rgba(255,255,235,0)');
    g.fillStyle = q;
    g.beginPath();
    g.ellipse(x + r * 0.5, y + r * 0.5, r, r * 0.7, 0, 0, 7);
    g.fill();
  }
}

let cachedRoofTex: THREE.CanvasTexture | null = null;
function getRoofTex(): THREE.CanvasTexture {
  if (cachedRoofTex) return cachedRoofTex;
  const c = cv(512, 1024),
    g = c.getContext('2d')!;
  g.fillStyle = '#d6d4ca';
  g.fillRect(0, 0, 512, 1024);
  grime(g, 512, 1024, { bd: 0.12, ru: 14, st: 1.6, dents: 3 });
  for (let i = 0; i < 24; i++) {
    const x = rnd(0, 512),
      y = rnd(0, 1024),
      r = rnd(20, 70),
      q = g.createRadialGradient(x, y, 0, x, y, r);
    q.addColorStop(0, 'rgba(90,75,55,.22)');
    q.addColorStop(1, 'rgba(90,75,55,0)');
    g.fillStyle = q;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedRoofTex = tex;
  return tex;
}

let cachedLivery: { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } | null = null;
function getLiveryTex() {
  if (cachedLivery) return cachedLivery;
  const W = 3600,
    H = 400,
    c = cv(W, H),
    g = c.getContext('2d')!;
  g.save();
  g.scale(2, 2);
  g.fillStyle = '#f0c020';
  g.fillRect(0, 0, 1800, 200);
  g.fillStyle = '#2f9a3a';
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(520, 200);
  g.lineTo(0, 200);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,.85)';
  for (const [x0, w] of [
    [40, 26],
    [110, 18],
    [170, 12],
  ]) {
    g.beginPath();
    g.moveTo(x0, 0);
    g.lineTo(x0 + w, 0);
    g.lineTo(x0 + w + 330, 200);
    g.lineTo(x0 + 330, 200);
    g.fill();
  }
  g.fillStyle = '#c4282a';
  g.beginPath();
  g.moveTo(330, 200);
  g.lineTo(1800, 95);
  g.lineTo(1800, 150);
  g.lineTo(520, 200);
  g.fill();
  g.fillStyle = '#2f9a3a';
  g.beginPath();
  g.moveTo(900, 200);
  g.lineTo(1800, 150);
  g.lineTo(1800, 200);
  g.fill();
  g.restore();

  for (let i = 1; i < 8; i++) {
    const x = i * 450;
    g.fillStyle = 'rgba(30,20,10,.5)';
    g.fillRect(x, 0, 3, H);
    g.fillStyle = 'rgba(255,255,240,.25)';
    g.fillRect(x + 3, 0, 2, H);
  }
  g.fillStyle = 'rgba(40,30,20,.5)';
  for (let x = 10; x < W; x += 34) {
    g.beginPath();
    g.arc(x, 18, 3, 0, 7);
    g.arc(x, H - 18, 3, 0, 7);
    g.fill();
  }
  grime(g, W, H, { bd: 0.55, ru: 70, st: 1, dents: 14 });
  for (let i = 0; i < 70; i++) {
    const x = rnd(0, W),
      y = H - rnd(4, 70),
      r = rnd(4, 14);
    g.fillStyle = '#5a3320';
    g.strokeStyle = 'rgba(205,205,195,.55)';
    g.lineWidth = 1.5;
    g.beginPath();
    for (let j = 0; j < 6; j++) {
      const a = j * 1.05,
        rr = r * rnd(0.6, 1.3);
      g.lineTo(x + Math.cos(a) * rr * 1.6, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
    g.stroke();
  }

  const bc = cv(W, H),
    b = bc.getContext('2d')!;
  b.fillStyle = '#808080';
  b.fillRect(0, 0, W, H);
  for (let i = 1; i < 8; i++) {
    b.fillStyle = '#303030';
    b.fillRect(i * 450, 0, 4, H);
    b.fillStyle = '#b0b0b0';
    b.fillRect(i * 450 + 4, 0, 3, H);
  }
  b.fillStyle = '#d0d0d0';
  for (let x = 10; x < W; x += 34) {
    b.beginPath();
    b.arc(x, 18, 3.5, 0, 7);
    b.arc(x, H - 18, 3.5, 0, 7);
    b.fill();
  }
  for (let i = 0; i < 16; i++) {
    const x = rnd(100, W - 100),
      y = rnd(60, 340),
      r = rnd(30, 80),
      q = b.createRadialGradient(x, y, 0, x, y, r);
    q.addColorStop(0, 'rgba(0,0,0,.45)');
    q.addColorStop(1, 'rgba(0,0,0,0)');
    b.fillStyle = q;
    b.beginPath();
    b.ellipse(x, y, r * 1.4, r, 0, 0, 7);
    b.fill();
  }
  for (let i = 0; i < 2500; i++) {
    b.fillStyle = Math.random() < 0.5 ? 'rgba(235,235,235,.5)' : 'rgba(40,40,40,.5)';
    b.fillRect(rnd(0, W), H - rnd(0, 120), rnd(1, 5), rnd(1, 4));
  }
  const mapTex = new THREE.CanvasTexture(c);
  mapTex.colorSpace = THREE.SRGBColorSpace;
  cachedLivery = { map: mapTex, bump: new THREE.CanvasTexture(bc) };
  return cachedLivery;
}

/**
 * Same to same implementation of BD Local Bus 3D Model provided by user
 */
const cachedBusDecalMats = new Map<string, THREE.MeshStandardMaterial>();

export function createDhakaBusModel(textures: ProceduralTexturePack): THREE.Group {
  const L = new THREE.Group();
  L.add(createContactShadowMesh(textures.contactShadow, 2.9, 9.4));

  // Forward in user model is +Z (ZF = 4.2). Rotate PI so front points towards -Z for traffic.
  const root = new THREE.Group();
  root.add(L);
  L.rotation.y = Math.PI;

  const M = (c: number, o: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial(
      Object.assign({ color: c, roughness: 0.6, metalness: 0.08 }, o)
    );

  const mat = {
    blue: M(0x1d4d96, { roughness: 0.44, metalness: 0.2 }),
    cream: M(0xe6dec8, { roughness: 0.56 }),
    yellow: M(0xe0b224, { roughness: 0.52, metalness: 0.12 }),
    red: M(0xb82628, { roughness: 0.5 }),
    black: M(0x16181c, { roughness: 0.85 }),
    rubber: M(0x101114, { roughness: 0.94 }),
    chrome: M(0xdbe1e8, { roughness: 0.18, metalness: 0.9 }),
    steel: M(0x828992, { roughness: 0.46, metalness: 0.78 }),
    glass: M(0xbfe0ee, { roughness: 0.08, transparent: true, opacity: 0.32 }),
    seat: M(0x6e1f1f, { roughness: 0.9 }),
    skin: M(0x9a6a4a, { roughness: 0.7 }),
    hair: M(0x0a0908),
    lamp: M(0xfff6cf, { emissive: 0xffe9a0, emissiveIntensity: 0.85 }),
    amber: M(0xe88b12, { emissive: 0x994a00 }),
    tail: M(0xb00d0d, { emissive: 0x600000, emissiveIntensity: 0.65 }),
    shirt: M(0x4a78a6, { roughness: 0.85 }),
    shirt2: M(0xe4e2d8, { roughness: 0.85 }),
    gamcha: M(0xb82828, { roughness: 0.9 }),
    green: M(0x288435, { roughness: 0.52 }),
    dark: M(0x121318, { roughness: 0.82 }),
    white: M(0xeaeae5, { roughness: 0.52 }),
    roofc: M(0xffffff, { roughness: 0.68, map: getRoofTex() }),
    gl2: M(0x26343c, { roughness: 0.08, transparent: true, opacity: 0.36 }),
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
    let decalMat = cachedBusDecalMats.get(key);
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
      cachedBusDecalMats.set(key, decalMat);
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), decalMat);
    m.rotation.order = 'YXZ';
    m.rotation.set(0, ry, rz);
    m.position.set(x, y, z);
    L.add(m);
    return m;
  }

  // lungi textures
  const lc = cv(128, 128),
    lg = lc.getContext('2d')!;
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
  const lungi = M(0xffffff, { map: lt, roughness: 0.92 });

  const lc2 = cv(128, 128),
    lg2 = lc2.getContext('2d')!;
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
  const lungi2 = M(0xffffff, { map: lt2, roughness: 0.92 });

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

  const ZB = -4.8,
    ZF = 4.2,
    HWB = 1.2,
    FLOOR = 1.05,
    FAX = 2.9,
    RAX = -2.5;

  // ---------- chassis, wheels (front single, rear dual) ----------
  B(1.9, 0.3, 8.6, mat.dark, 0, 0.6, -0.3);
  B(2.1, 0.06, 0.08, mat.steel, 0, 0.5, FAX);
  B(2.1, 0.06, 0.08, mat.steel, 0, 0.5, RAX);

  function wheel(x: number, z: number) {
    const g = new THREE.Group();
    g.position.set(x, 0.5, z);
    L.add(g);
    const w = 0.27,
      rz = (o: THREE.Mesh) => {
        o.rotation.z = Math.PI / 2;
        return o;
      };
    rz(addMesh(new THREE.CylinderGeometry(0.5, 0.5, w, 14), mat.rubber, 0, 0, 0, g));
    rz(addMesh(new THREE.CylinderGeometry(0.3, 0.3, w + 0.02, 12), mat.steel, 0, 0, 0, g));
    rz(addMesh(new THREE.CylinderGeometry(0.1, 0.1, w + 0.05, 8), mat.chrome, 0, 0, 0, g));
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      rz(addMesh(new THREE.CylinderGeometry(0.02, 0.02, w + 0.06, 6), mat.chrome, 0, Math.sin(a) * 0.2, Math.cos(a) * 0.2, g));
    }
  }

  for (const s of [-1, 1]) {
    wheel(s * 1.02, FAX);
    wheel(s * 1.02, RAX);
    wheel(s * 0.68, RAX);
  }

  // ---------- side panels with wheel arches and livery ----------
  const LIV = getLiveryTex();
  const livMat = new THREE.MeshStandardMaterial({
    map: LIV.map,
    bumpMap: LIV.bump,
    bumpScale: 2.2,
    roughness: 0.6,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const arch = (cz: number) => {
    const o: [number, number][] = [];
    for (let i = 0; i <= 14; i++) {
      const z = cz - 0.6 + (1.2 * i) / 14;
      o.push([z, 0.5 + Math.sqrt(Math.max(0, 0.64 * 0.64 - (z - cz) * (z - cz)))]);
    }
    return o;
  };

  function sidePanel(sx: number) {
    const sh = new THREE.Shape(),
      pts: [number, number][] = [[ZB, 0.65]];
    for (const cz of [RAX, FAX]) pts.push([cz - 0.7, 0.65], ...arch(cz), [cz + 0.7, 0.65]);
    pts.push([ZF - 0.05, 0.65], [ZF - 0.05, 1.65], [ZB, 1.65]);
    pts.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])));
    const g = new THREE.ShapeGeometry(sh);
    const uv = g.attributes.uv,
      pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (pos.getX(i) - ZB) / (ZF - 0.05 - ZB), (pos.getY(i) - 0.65) / 1.0);
    g.rotateY(-Math.PI / 2);
    g.translate(-HWB, 0, 0);
    const m = new THREE.Mesh(g, livMat);
    m.castShadow = true;
    m.receiveShadow = false;
    if (sx > 0) m.scale.x = -1;
    L.add(m);

    for (const cz of [RAX, FAX]) {
      const f = addMesh(new THREE.TorusGeometry(0.64, 0.04, 8, 28, Math.PI), mat.dark, sx * (HWB + 0.01), 0.5, cz);
      f.rotation.y = Math.PI / 2;
    }
    // window band
    B(0.02, 0.96, 8.7, mat.gl2, sx * (HWB - 0.01), 2.15, -0.3);
    B(0.06, 0.06, 8.9, mat.black, sx * HWB, 1.66, -0.3);
    B(0.06, 0.06, 8.9, mat.black, sx * HWB, 2.64, -0.3);
    for (let i = 0; i < 10; i++) B(0.07, 0.98, 0.07, mat.black, sx * HWB, 2.15, -4.6 + i * 0.9);
    for (let i = 0; i < 9; i++) B(0.02, 0.03, 0.8, mat.steel, sx * (HWB + 0.02), 2.15, -4.15 + i * 0.9);
    B(0.07, 0.2, 8.9, mat.green, sx * HWB, 2.77, -0.3);
  }

  sidePanel(1);
  sidePanel(-1);

  // front door (left side = +x), steps, grab poles
  B(0.04, 1.4, 0.85, mat.gl2, HWB, 2.0, 3.65);
  B(0.06, 0.05, 0.9, mat.black, HWB, 1.32, 3.65);
  B(0.5, 0.12, 0.4, mat.steel, 1.0, 0.42, 3.7);
  B(0.5, 0.12, 0.4, mat.steel, 1.0, 0.74, 3.55);
  B(0.04, 1.6, 0.04, mat.chrome, 0.95, 1.8, 3.35);
  B(0.04, 1.6, 0.04, mat.chrome, 0.95, 1.8, 3.95);

  // roof, rear, front
  B(2.4, 0.1, 9.05, mat.roofc, 0, 2.95, -0.3);
  B(2.46, 0.05, 9.1, mat.green, 0, 2.88, -0.3);
  for (const z of [-3.8, -2.6, -1.4, -0.2, 1.0]) {
    SP(0.3, mat.white, 0, 3.03, z, L, 1, 0.4, 1);
  }
  B(2.4, 1.0, 0.06, mat.yellow, 0, 1.15, ZB);
  B(2.2, 0.9, 0.03, mat.gl2, 0, 2.15, ZB);
  B(2.4, 0.35, 0.06, mat.green, 0, 2.8, ZB);
  B(2.4, 0.1, 0.06, mat.dark, 0, 1.7, ZB);
  B(2.4, 1.0, 0.08, mat.yellow, 0, 1.15, ZF - 0.03);
  B(2.42, 0.2, 0.1, mat.red, 0, 1.42, ZF - 0.01);
  B(2.4, 0.22, 0.1, mat.green, 0, 0.78, ZF - 0.02);
  const ws = B(2.2, 1.1, 0.03, mat.glass, 0, 2.2, 4.13);
  ws.rotation.x = -0.1;
  B(2.4, 0.2, 0.2, mat.yellow, 0, 2.85, 4.08);
  for (const s of [-1, 1]) {
    const p = B(0.08, 1.15, 0.08, mat.black, s * 1.17, 2.2, 4.1);
    p.rotation.x = -0.1;
  }
  B(0.06, 1.1, 0.04, mat.black, 0, 2.2, 4.14).rotation.x = -0.1;

  // wipers, mirrors
  for (const s of [-1, 1]) {
    limb([s * 0.3, 1.72, 4.18], [s * 0.9, 2.1, 4.18], 0.012, mat.black);
    B(0.04, 0.04, 0.5, mat.black, s * 1.4, 2.3, 4.0);
    B(0.05, 0.5, 0.22, mat.black, s * 1.65, 2.2, 3.95);
    B(0.03, 0.7, 0.03, mat.black, s * 1.3, 2.0, 3.98);
  }

  // headlights, grille, bumper
  for (const s of [-1, 1]) {
    SP(0.15, mat.lamp, s * 0.85, 1.05, ZF + 0.02, L, 1, 1, 0.4);
    addMesh(new THREE.TorusGeometry(0.16, 0.025, 10, 24), mat.chrome, s * 0.85, 1.05, ZF + 0.04);
    B(0.18, 0.07, 0.04, mat.amber, s * 1.05, 0.78, ZF + 0.06);
  }
  B(1.0, 0.36, 0.04, mat.dark, -0.05, 1.0, ZF + 0.06);
  for (let i = 0; i < 7; i++) B(0.96, 0.02, 0.05, mat.chrome, -0.05, 0.86 + i * 0.05, ZF + 0.09);
  B(2.5, 0.2, 0.24, mat.dark, 0, 0.55, ZF + 0.12);
  B(2.5, 0.05, 0.25, mat.chrome, 0, 0.66, ZF + 0.12);

  // interior: floor, dash, seats, steering
  B(2.3, 0.06, 8.9, mat.dark, 0, FLOOR, -0.3);
  B(2.3, 0.5, 0.4, mat.dark, 0, 1.4, 3.98);
  B(2.3, 0.08, 0.45, mat.black, 0, 1.66, 3.98);
  const stw = new THREE.Group();
  stw.position.set(-0.55, 1.9, 3.65);
  stw.rotation.x = 1.0;
  L.add(stw);
  addMesh(new THREE.TorusGeometry(0.26, 0.025, 12, 32), mat.black, 0, 0, 0, stw);
  B(0.5, 0.03, 0.03, mat.black, 0, 0, 0, stw);
  B(0.03, 0.26, 0.03, mat.black, 0, -0.13, 0, stw);
  limb([-0.55, 1.78, 3.78], [-0.55, 1.45, 3.98], 0.04, mat.black);
  B(0.5, 0.1, 0.5, mat.seat, -0.55, 1.45, 3.15);
  B(0.5, 0.5, 0.1, mat.seat, -0.55, 1.75, 2.9);
  B(0.5, 0.3, 0.5, mat.black, -0.55, 1.25, 3.15);
  for (let i = 0; i < 8; i++) {
    const z = 2.0 - i * 0.85 - (i > 4 ? 0.45 : 0);
    if (z < -4.3) break;
    for (const x of [-0.62, 0.62]) {
      B(0.95, 0.1, 0.52, mat.seat, x, 1.45, z);
      B(0.95, 0.5, 0.08, mat.seat, x, 1.75, z - 0.27);
      B(0.9, 0.3, 0.5, mat.black, x, 1.25, z);
    }
  }
  B(0.06, 1.6, 0.06, mat.chrome, 0, 1.85, 1.2);
  B(0.04, 0.04, 6.5, mat.chrome, 0, 2.6, -1.6);

  // decals
  const dxs = (s: number) => (s > 0 ? Math.PI / 2 : -Math.PI / 2);
  for (const s of [-1, 1])
    decal(
      700,
      110,
      (g, w) => {
        txt(g, 'ঢাকা লোকাল বাস', w / 2, 82, 76, '#1a1a1a');
        wear(g, w, 110, 0.4);
      },
      2.6,
      0.3,
      s * (HWB + 0.02),
      1.5,
      -1.3,
      dxs(s)
    );

  const decFront = decal(
    600,
    150,
    (g, w, h) => {
      g.fillStyle = '#1d8a5a';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = '#e8ffe8';
      g.lineWidth = 5;
      g.strokeRect(5, 5, w - 10, h - 10);
      txt(g, 'গুলিস্তান ⇄ মিরপুর', w / 2, 98, 66, '#fff');
      wear(g, w, h, 0.4);
    },
    1.5,
    0.34,
    0,
    2.5,
    4.17,
    0
  );
  decFront.rotation.x = -0.1;

  const pl = (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.fillStyle = '#e8f5ea';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d8a5a';
    g.fillRect(0, 0, w, 14);
    txt(g, 'ঢাকা মেট্রো-ব ১১-২৩৪৫', w / 2, 90, 50, '#111');
    wear(g, w, h, 0.5);
  };
  decal(420, 120, pl, 0.5, 0.14, 0.5, 0.55, ZF + 0.26, 0);
  decal(420, 120, pl, 0.5, 0.14, 0, 0.84, ZB - 0.05, Math.PI);

  for (const s of [-1, 1]) {
    B(0.16, 0.5, 0.08, mat.dark, s * 1.06, 1.3, ZB - 0.05);
    B(0.12, 0.28, 0.06, mat.tail, s * 1.06, 1.4, ZB - 0.1);
    B(0.12, 0.1, 0.06, mat.amber, s * 1.06, 1.2, ZB - 0.1);
    B(0.12, 0.08, 0.06, mat.white, s * 1.06, 1.1, ZB - 0.1);
  }
  B(2.5, 0.18, 0.16, mat.dark, 0, 0.58, ZB - 0.1);
  B(2.5, 0.04, 0.17, mat.chrome, 0, 0.67, ZB - 0.1);
  CY(0.05, 0.05, 0.55, mat.dark, -0.75, 0.5, ZB - 0.3).rotation.x = Math.PI / 2;
  CY(0.065, 0.065, 0.05, mat.steel, -0.75, 0.5, ZB - 0.57).rotation.x = Math.PI / 2;
  for (const s of [-1, 1]) B(0.03, 0.4, 0.5, mat.rubber, s * 1.18, 0.7, RAX - 0.62);

  decal(
    900,
    862,
    (g, w, h) => {
      g.fillStyle = '#f0c020';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#2f9a3a';
      g.fillRect(0, 0, w, 112);
      g.fillStyle = '#f0c020';
      g.fillRect(0, 100, w, 12);
      g.fillStyle = '#e9f3e9';
      g.fillRect(270, 18, 360, 66);
      g.fillStyle = '#14783d';
      g.fillRect(270, 18, 360, 8);
      txt(g, 'গুলিস্তান - মিরপুর', 450, 70, 40, '#111');
      g.fillStyle = '#16181a';
      g.fillRect(0, 112, w, 338);
      g.fillStyle = '#3a76c8';
      g.fillRect(0, 450, w, 22);
      g.fillStyle = '#c4282a';
      g.fillRect(0, 472, w, 8);
      for (const x of [60, 690]) {
        g.fillStyle = '#111';
        g.fillRect(x, 492, 150, 40);
        g.strokeStyle = '#444';
        g.lineWidth = 2;
        for (let i = 1; i < 5; i++) {
          g.beginPath();
          g.moveTo(x, 492 + i * 8);
          g.lineTo(x + 150, 492 + i * 8);
          g.stroke();
        }
      }
      g.fillStyle = '#f4f2ea';
      g.fillRect(40, 560, 250, 150);
      g.strokeStyle = '#c4282a';
      g.lineWidth = 4;
      g.strokeRect(46, 566, 238, 138);
      txt(g, 'জরুরী যোগাযোগ', 165, 610, 30, '#c4282a');
      txt(g, '০১৭১১-২৩৪৫৬৭', 165, 655, 34, '#c4282a');
      txt(g, 'নিরাপদ চলাচল', 165, 695, 26, '#222');
      txt(g, 'রাজধানী', 610, 670, 140, '#c4282a', '#1c3a8a');
      g.fillStyle = '#f0c020';
      g.fillRect(0, 731, w, 39);
      g.fillStyle = '#2f9a3a';
      g.fillRect(0, 770, w, 45);
      g.fillStyle = '#c4282a';
      g.fillRect(0, 815, w, 47);
      grime(g, w, h, { bd: 0.55, ru: 40, st: 1, dents: 6 });
      const sg = g.createRadialGradient(660, 830, 0, 660, 830, 130);
      sg.addColorStop(0, 'rgba(0,0,0,.55)');
      sg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = sg;
      g.fillRect(500, 700, 300, 162);
      g.clearRect(60, 135, 370, 290);
      g.clearRect(470, 135, 370, 290);
    },
    2.4,
    2.3,
    0,
    1.8,
    ZB - 0.035,
    Math.PI
  );

  decal(
    1200,
    500,
    (g, w, h) => {
      grime(g, w, h, { bd: 0.6, ru: 34, st: 0.8, dents: 4 });
    },
    2.4,
    1.0,
    0,
    1.15,
    ZF + 0.016,
    0
  );

  // people
  human({
    x: -0.55,
    y: FLOOR + 0.2,
    z: 3.15,
    seat: true,
    k: 0.8,
    shirt: mat.shirt,
    lungi: lungi,
    gamcha: true,
    hands: [
      [-0.2, 0.65, 0.45],
      [0.2, 0.65, 0.45],
    ],
  });

  const cols = [0xb06a2a, 0x3a8a6a, 0x8a3a3a, 0x6a6a7a, 0x4b6fa8, 0x9a8a3a];
  [
    [-0.62, 1.9],
    [0.62, 1.05],
    [-0.62, 0.2],
    [0.62, -0.65],
    [-0.62, -1.5],
    [0.62, -2.35],
    [-0.62, -3.2],
  ].forEach((p, i) =>
    human({
      x: p[0] + (p[0] > 0 ? 0.15 : -0.15),
      y: FLOOR + 0.2,
      z: p[1] - 0.05,
      seat: true,
      k: 0.78,
      shirt: M(cols[i % 6], { roughness: 0.85 }),
      lungi: i % 2 ? lungi : lungi2,
    })
  );

  // conductor standing near the door
  human({
    x: 0.7,
    y: FLOOR,
    z: 2.6,
    ry: -Math.PI / 2,
    k: 0.85,
    shirt: mat.shirt2,
    lungi: lungi2,
    gamcha: true,
    hands: [
      [-0.2, 1.4, 0.2],
      [0.2, 1.5, 0.2],
    ],
  });

  return root;
}
