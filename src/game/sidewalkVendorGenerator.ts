import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';

export type SidewalkStallCategory = 'veggie' | 'chai' | 'flower' | 'vendor';

export interface ProceduralSidewalkStallEntry {
  mesh: THREE.Group;
  active: boolean;
  isVeggie: boolean;
  category: SidewalkStallCategory;
  localX: number;
  localZ: number;
}

export interface ProceduralSidewalkCallbacks {
  createShobjiStall: () => THREE.Group;
}

/**
 * Deterministic seeded PRNG (Mulberry32) so each 96m x 96m city super-cell
 * generates a unique, reproducible Dhaka sidewalk vendor layout.
 */
function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cachedChaiSigns: THREE.CanvasTexture[] | null = null;
let cachedFlowerSigns: THREE.CanvasTexture[] | null = null;
let cachedVendorSigns: THREE.CanvasTexture[] | null = null;

function buildBengaliSignTexture(
  bg: string,
  border: string,
  accentBar: string,
  title: string,
  sub: string,
  anisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = accentBar;
  ctx.fillRect(0, 0, 512, 18);
  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.strokeRect(6, 6, 500, 148);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 74);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 21px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(sub, 256, 122);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function getChaiSignTex(variant: number, anisotropy: number): THREE.CanvasTexture {
  if (!cachedChaiSigns) {
    cachedChaiSigns = [
      buildBengaliSignTexture('#7c2d12', '#facc15', '#dc2626', 'মায়ের দোয়া চা স্টল', 'গরম চা • বানরুটি • বিস্কুট', anisotropy),
      buildBengaliSignTexture('#064e3b', '#fef08a', '#f59e0b', 'মামা টং ও কলা ঘর', 'দুধ চা • রং চা • পান-সুপারি', anisotropy),
      buildBengaliSignTexture('#1e3a8a', '#fbbf24', '#ef4444', 'পুরান ঢাকা মালাই চা', 'স্পেশাল আদা চা ও কেক', anisotropy),
    ];
  }
  return cachedChaiSigns[Math.abs(variant) % cachedChaiSigns.length];
}

function getFlowerSignTex(variant: number, anisotropy: number): THREE.CanvasTexture {
  if (!cachedFlowerSigns) {
    cachedFlowerSigns = [
      buildBengaliSignTexture('#881337', '#fde047', '#16a34a', 'শাহবাগ পুষ্প বিতান', 'তাজা গোলাপ • গাঁদা • রজনীগন্ধা', anisotropy),
      buildBengaliSignTexture('#14532d', '#facc15', '#e11d48', 'শাপলা ফুল ও মালা ঘর', 'বিয়ে ও অনুষ্ঠানের ফুলের সাজ', anisotropy),
      buildBengaliSignTexture('#701a75', '#fef08a', '#f97316', 'বসন্ত ফুলের দোকান', 'বুঁকে • মালা • বেলী ফুল', anisotropy),
    ];
  }
  return cachedFlowerSigns[Math.abs(variant) % cachedFlowerSigns.length];
}

function getVendorSignTex(variant: number, anisotropy: number): THREE.CanvasTexture {
  if (!cachedVendorSigns) {
    cachedVendorSigns = [
      buildBengaliSignTexture('#9a3412', '#fde047', '#dc2626', 'মামা চটপটি ও ফুচকা', 'ঝালমুড়ি • তেঁতুল টক • ঘুগনি', anisotropy),
      buildBengaliSignTexture('#065f46', '#fef08a', '#eab308', 'টাটকা ডাব ও আম ভ্যান', 'মিষ্টি ডাব • পাকা পেঁপে • কলা', anisotropy),
      buildBengaliSignTexture('#1e293b', '#38bdf8', '#f59e0b', 'নীলক্ষেত বই ও পান স্টল', 'পত্রিকা • ম্যাগাজিন • পান-জর্দা', anisotropy),
    ];
  }
  return cachedVendorSigns[Math.abs(variant) % cachedVendorSigns.length];
}

// Shared lightweight geometries & materials to keep draw/memory footprint lean
let sharedGeos: {
  bambooPost: THREE.CylinderGeometry;
  jarBody: THREE.CylinderGeometry;
  jarLid: THREE.CylinderGeometry;
  flowerHead: THREE.DodecahedronGeometry;
  stem: THREE.CylinderGeometry;
  balloon: THREE.SphereGeometry;
  wheel: THREE.CylinderGeometry;
  coconut: THREE.SphereGeometry;
  fuchkaBall: THREE.SphereGeometry;
} | null = null;

function getSharedGeos() {
  if (!sharedGeos) {
    sharedGeos = {
      bambooPost: new THREE.CylinderGeometry(0.036, 0.044, 2.05, 6),
      jarBody: new THREE.CylinderGeometry(0.085, 0.085, 0.22, 8),
      jarLid: new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8),
      flowerHead: new THREE.DodecahedronGeometry(0.11, 0),
      stem: new THREE.CylinderGeometry(0.015, 0.015, 0.36, 5),
      balloon: new THREE.SphereGeometry(0.18, 9, 8),
      wheel: new THREE.CylinderGeometry(0.22, 0.22, 0.06, 8),
      coconut: new THREE.SphereGeometry(0.14, 7, 6),
      fuchkaBall: new THREE.SphereGeometry(0.055, 6, 5),
    };
  }
  return sharedGeos;
}

/**
 * 1. DHAKA CHAI TONG STALL ("টং চা, কেতলি, কলার কাঁদি ও বিস্কুটের বয়াম")
 * Composite 10-part roadside tea stall with counter, bamboo frame, tin/tarp awning,
 * customer bench, steaming kettle, charcoal stove, biscuit jars, banana bunch, and Bengali sign.
 */
export function createChaiTongStallModel(
  variant: number,
  textures: ProceduralTexturePack,
  rng: () => number
): THREE.Group {
  const geos = getSharedGeos();
  const stall = new THREE.Group();

  const woodPalette = [0x78350f, 0x6b3e1b, 0x5c3317];
  const tarpPalette = [0x1d4ed8, 0xdc2626, 0x047857, 0xd97706];
  const woodMat = new THREE.MeshStandardMaterial({
    color: woodPalette[variant % woodPalette.length],
    roughness: 0.86,
    metalness: 0.04,
  });
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xc28a3a, roughness: 0.78 });
  const awningMat =
    variant % 2 === 0
      ? new THREE.MeshStandardMaterial({ map: textures.corrugatedTin, roughness: 0.42, metalness: 0.68 })
      : new THREE.MeshStandardMaterial({
          color: tarpPalette[(variant + Math.floor(rng() * 3)) % tarpPalette.length],
          roughness: 0.72,
          side: THREE.DoubleSide,
        });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.88 });
  const stoveMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.85, metalness: 0.4 });
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
  const glassJarMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.15,
    transparent: true,
    opacity: 0.65,
  });
  const jarCapMat = new THREE.MeshStandardMaterial({
    color: variant % 2 === 0 ? 0xdc2626 : 0xfacc15,
    roughness: 0.4,
  });
  const bananaMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.52 });

  // Main wooden counter
  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.86, 1.15), woodMat);
  counter.position.set(0, 0.43, 0);
  counter.castShadow = true;
  counter.receiveShadow = true;
  stall.add(counter);

  // Wooden front customer bench
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 0.36), woodMat);
  benchTop.position.set(0, 0.44, 0.86);
  stall.add(benchTop);
  [-0.72, 0.72].forEach((bx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.3), woodMat);
    leg.position.set(bx, 0.21, 0.86);
    stall.add(leg);
  });

  // 4 Bamboo support poles
  [[-1.0, -0.5], [1.0, -0.5], [-1.0, 0.5], [1.0, 0.5]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(geos.bambooPost, bambooMat);
    post.position.set(px, 1.03, pz);
    stall.add(post);
  });

  // Sloped corrugated tin / tarp lean-to canopy
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.08, 1.65), awningMat);
  roof.position.set(0, 2.08, 0.08);
  roof.rotation.x = 0.16;
  roof.castShadow = true;
  stall.add(roof);

  // Charcoal tea stove ("চুলা") & gleaming aluminum kettle ("কেতলি")
  const stove = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.22, 8), stoveMat);
  stove.position.set(-0.62, 0.97, 0.05);
  stall.add(stove);

  const ember = new THREE.Mesh(new THREE.CircleGeometry(0.14, 8), emberMat);
  ember.rotation.x = -Math.PI / 2;
  ember.position.set(-0.62, 1.085, 0.05);
  stall.add(ember);

  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.3, 10), steelMat);
  kettle.position.set(-0.62, 1.24, 0.05);
  stall.add(kettle);

  const kettleSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.18, 6), steelMat);
  kettleSpout.position.set(-0.46, 1.28, 0.05);
  kettleSpout.rotation.z = -0.75;
  stall.add(kettleSpout);

  // Row of 4 glass biscuit & toast jars ("বিস্কুটের বয়াম")
  for (let j = 0; j < 4; j++) {
    const jx = -0.15 + j * 0.24;
    const jar = new THREE.Mesh(geos.jarBody, glassJarMat);
    jar.position.set(jx, 0.97, 0.28);
    stall.add(jar);
    const lid = new THREE.Mesh(geos.jarLid, jarCapMat);
    lid.position.set(jx, 1.09, 0.28);
    stall.add(lid);
  }

  // Hanging yellow banana bunch ("কলার কাঁদি")
  const bananaCluster = new THREE.Group();
  bananaCluster.position.set(0.84, 1.62, 0.45);
  for (let b = 0; b < 5; b++) {
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.12, 3, 6), bananaMat);
    finger.position.set((b - 2) * 0.045, -0.08 - (b % 2) * 0.03, 0.02);
    finger.rotation.z = (b - 2) * 0.12;
    finger.rotation.x = 0.22;
    bananaCluster.add(finger);
  }
  stall.add(bananaCluster);

  // Glowing hanging tungsten bulb & Bengali tea signboard
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 7), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
  bulb.position.set(0, 1.78, 0.35);
  stall.add(bulb);

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.95, 0.44, 0.05),
    new THREE.MeshStandardMaterial({
      map: getChaiSignTex(variant, textures.asphalt.anisotropy),
      roughness: 0.45,
    })
  );
  signMesh.position.set(0, 1.94, 0.62);
  stall.add(signMesh);

  return stall;
}

/**
 * 2. DHAKA FLOWER SHOP ("শাহবাগ ফুলের দোকান ও গাঁদা মালা ঘর")
 * Stepped wooden flower display rack, striped canopy, woven buckets filled with
 * marigold, red rose, tuberose & pink dahlia clusters, plus draped marigold garlands.
 */
export function createFlowerShopModel(
  variant: number,
  textures: ProceduralTexturePack,
  rng: () => number
): THREE.Group {
  const geos = getSharedGeos();
  const shop = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.78 });
  const rackMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: variant % 2 === 0 ? 0xe11d48 : 0x16a34a,
    roughness: 0.62,
    side: THREE.DoubleSide,
  });
  const bucketMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.55 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72 });

  const marigoldMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.55 });
  const yellowMarigoldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.52 });
  const roseMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.48 });
  const tuberoseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
  const lotusMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.5 });
  const floralMats = [marigoldMat, yellowMarigoldMat, roseMat, tuberoseMat, lotusMat];

  // Stepped 2-tier floral display stand
  const lowerDeck = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.5, 1.05), rackMat);
  lowerDeck.position.set(0, 0.25, 0.12);
  lowerDeck.castShadow = true;
  lowerDeck.receiveShadow = true;
  shop.add(lowerDeck);

  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.88, 0.52), rackMat);
  upperDeck.position.set(0, 0.44, -0.35);
  upperDeck.castShadow = true;
  shop.add(upperDeck);

  // Corner green painted posts + bright canopy
  [[-1.12, -0.56], [1.12, -0.56], [-1.12, 0.56], [1.12, 0.56]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(geos.bambooPost, frameMat);
    post.position.set(px, 1.03, pz);
    shop.add(post);
  });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.68), canopyMat);
  roof.position.set(0, 2.1, 0.06);
  roof.rotation.x = 0.18;
  roof.castShadow = true;
  shop.add(roof);

  // Hanging marigold & jasmine garlands draped along the front eave ("গাঁদা ফুলের মালা")
  for (let g = -4; g <= 4; g++) {
    const strandLen = g % 2 === 0 ? 0.55 : 0.42;
    const gx = g * 0.23;
    const garland = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.035, strandLen, 6),
      g % 2 === 0 ? marigoldMat : yellowMarigoldMat
    );
    garland.position.set(gx, 1.88 - strandLen * 0.42, 0.65);
    shop.add(garland);

    const tip = new THREE.Mesh(geos.flowerHead, g % 3 === 0 ? roseMat : tuberoseMat);
    tip.scale.setScalar(0.55);
    tip.position.set(gx, 1.88 - strandLen * 0.85, 0.65);
    shop.add(tip);
  }

  // Buckets of vibrant cut flowers across both tiers
  for (let i = 0; i < 6; i++) {
    const isUpper = i >= 3;
    const bx = ((i % 3) - 1) * 0.72 + (rng() - 0.5) * 0.08;
    const by = isUpper ? 0.88 : 0.5;
    const bz = isUpper ? -0.32 : 0.25;

    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.13, 0.34, 8), bucketMat);
    bucket.position.set(bx, by + 0.17, bz);
    shop.add(bucket);

    // Leafy greenery base
    const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2, 0), foliageMat);
    leaves.scale.set(1.1, 0.65, 1.1);
    leaves.position.set(bx, by + 0.38, bz);
    shop.add(leaves);

    // 4 blossoms per bucket
    const chosenFloralMat = floralMats[(variant + i) % floralMats.length];
    for (let f = 0; f < 4; f++) {
      const ang = (f / 4) * Math.PI * 2 + rng() * 0.5;
      const fx = bx + Math.cos(ang) * 0.1;
      const fz = bz + Math.sin(ang) * 0.1;
      const fy = by + 0.48 + (f % 2) * 0.08;
      const bloom = new THREE.Mesh(geos.flowerHead, chosenFloralMat);
      bloom.scale.setScalar(0.85 + rng() * 0.3);
      bloom.position.set(fx, fy, fz);
      shop.add(bloom);
    }
  }

  // Bengali Flower Shop Signboard
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.44, 0.05),
    new THREE.MeshStandardMaterial({
      map: getFlowerSignTex(variant, textures.asphalt.anisotropy),
      roughness: 0.45,
    })
  );
  signMesh.position.set(0, 1.98, 0.62);
  shop.add(signMesh);

  return shop;
}

export type StreetVendorArchetype =
  | 'fuchka_jhalmuri'
  | 'coconut_fruit'
  | 'books_pan'
  | 'balloon_toys';

/**
 * 3. UNIQUE DHAKA STREET VENDORS (4 Distinct Archetypes)
 * - fuchka_jhalmuri: Glass cart stacked with golden fuchka shells, tamarind pot & umbrella
 * - coconut_fruit: 4-wheel fruit pushcart piled with green coconuts, mangoes & pineapple
 * - books_pan: Nilkhet-style angled sidewalk book & betel-leaf (pan) stand
 * - balloon_toys: Folding hawker stool with tall bamboo cluster of colorful balloons
 */
export function createUniqueStreetVendorModel(
  archetype: StreetVendorArchetype,
  variant: number,
  textures: ProceduralTexturePack,
  rng: () => number
): THREE.Group {
  const geos = getSharedGeos();
  const group = new THREE.Group();

  const cartWoodMat = new THREE.MeshStandardMaterial({
    color: archetype === 'coconut_fruit' ? 0x0369a1 : archetype === 'fuchka_jhalmuri' ? 0xb91c1c : 0x78350f,
    roughness: 0.78,
  });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const umbrellaColors = [0xe11d48, 0xf59e0b, 0x059669, 0x2563eb];
  const umbrellaMat = new THREE.MeshStandardMaterial({
    color: umbrellaColors[(variant + Math.floor(rng() * 4)) % umbrellaColors.length],
    roughness: 0.55,
    side: THREE.DoubleSide,
  });

  if (archetype === 'books_pan') {
    // Nilkhet / Footpath Book & Pan Stand
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.52, 0.95), cartWoodMat);
    rack.position.set(0, 0.26, 0);
    rack.castShadow = true;
    group.add(rack);

    const slantedShelf = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.1, 0.85), cartWoodMat);
    slantedShelf.position.set(0, 0.58, -0.05);
    slantedShelf.rotation.x = 0.24;
    group.add(slantedShelf);

    const bookColors = [0xef4444, 0x3b82f6, 0xfacc15, 0x10b981, 0xf8fafc, 0xa855f7];
    for (let b = 0; b < 8; b++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.1 + (b % 3) * 0.04, 0.26),
        new THREE.MeshStandardMaterial({
          color: bookColors[(b + variant) % bookColors.length],
          roughness: 0.6,
        })
      );
      book.position.set(-0.72 + (b % 4) * 0.34, 0.68 + Math.floor(b / 4) * 0.12, 0.12 - Math.floor(b / 4) * 0.3);
      book.rotation.x = 0.24;
      group.add(book);
    }

    // Classic brass Pan-Supari box on right edge
    const panBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.18, 0.38),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.72 })
    );
    panBox.position.set(0.68, 0.64, 0.22);
    group.add(panBox);

    const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 2.0, 6), wheelMat);
    umbrellaPole.position.set(-0.78, 1.0, -0.35);
    group.add(umbrellaPole);

    const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.42, 8), umbrellaMat);
    umbrella.position.set(-0.78, 2.02, -0.35);
    group.add(umbrella);

    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.34, 0.05),
      new THREE.MeshStandardMaterial({
        map: getVendorSignTex(2, textures.asphalt.anisotropy),
        roughness: 0.48,
      })
    );
    signMesh.position.set(0.15, 0.96, -0.44);
    group.add(signMesh);

    return group;
  }

  if (archetype === 'balloon_toys') {
    // Hawker Stool + Basket + Vibrant Floating Balloon Bouquet Pole
    const stool = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.65), cartWoodMat);
    stool.position.set(0, 0.225, 0);
    group.add(stool);

    const basket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.24, 0.36, 9),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 })
    );
    basket.position.set(0.08, 0.62, 0.05);
    group.add(basket);

    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 2.45, 6), wheelMat);
    stick.position.set(-0.22, 1.25, -0.1);
    group.add(stick);

    const balloonPalette = [0xef4444, 0x3b82f6, 0xfacc15, 0xec4899, 0x22c55e, 0xa855f7, 0xf97316];
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const rad = 0.22 + (i % 2) * 0.14;
      const bMat = new THREE.MeshStandardMaterial({
        color: balloonPalette[(i + variant) % balloonPalette.length],
        roughness: 0.2,
        metalness: 0.08,
      });
      const bal = new THREE.Mesh(geos.balloon, bMat);
      bal.scale.set(0.95, 1.15, 0.95);
      bal.position.set(
        -0.22 + Math.cos(ang) * rad,
        2.35 + (i % 3) * 0.22,
        -0.1 + Math.sin(ang) * rad
      );
      group.add(bal);
    }

    return group;
  }

  // Pushcart Base for 'fuchka_jhalmuri' and 'coconut_fruit'
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.22, 1.05), cartWoodMat);
  bed.position.set(0, 0.68, 0);
  bed.castShadow = true;
  bed.receiveShadow = true;
  group.add(bed);

  [-0.64, 0.64].forEach((wx) => {
    [-0.48, 0.48].forEach((wz) => {
      const w = new THREE.Mesh(geos.wheel, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.22, wz);
      group.add(w);
    });
  });

  // Push handles
  [-0.36, 0.36].forEach((hz) => {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6), wheelMat);
    handle.rotation.z = Math.PI / 2.4;
    handle.position.set(-1.05, 0.78, hz);
    group.add(handle);
  });

  if (archetype === 'fuchka_jhalmuri') {
    // Glass Fuchka Showcase Box + Crispy Puffed Fuchkas + Tamarind Pot
    const glassBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.05, 0.54, 0.76),
      new THREE.MeshStandardMaterial({
        color: 0xe0f2fe,
        roughness: 0.14,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      })
    );
    glassBox.position.set(0.15, 1.06, 0);
    group.add(glassBox);

    const fuchkaMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.58 });
    for (let i = 0; i < 14; i++) {
      const ball = new THREE.Mesh(geos.fuchkaBall, fuchkaMat);
      ball.position.set(
        -0.18 + (i % 5) * 0.15,
        0.86 + Math.floor(i / 5) * 0.085,
        -0.18 + ((i * 3) % 4) * 0.12
      );
      group.add(ball);
    }

    // Terracotta Tamarind Pot ("তেঁতুলের হাঁড়ি")
    const pot = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 8, 7),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.78 })
    );
    pot.position.set(-0.58, 0.96, 0.12);
    group.add(pot);

    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.34, 0.05),
      new THREE.MeshStandardMaterial({
        map: getVendorSignTex(0, textures.asphalt.anisotropy),
        roughness: 0.45,
      })
    );
    signMesh.position.set(0.12, 0.96, 0.52);
    group.add(signMesh);
  } else {
    // Green Coconuts & Mangoes Heap ("ডাব ও মৌসুমি ফল")
    const coconutMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.68 });
    const mangoMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
    for (let i = 0; i < 8; i++) {
      const coco = new THREE.Mesh(geos.coconut, i % 4 === 3 ? mangoMat : coconutMat);
      coco.scale.set(1.0, 1.15, 1.0);
      coco.position.set(
        -0.45 + (i % 4) * 0.3,
        0.9 + Math.floor(i / 4) * 0.18,
        -0.18 + (Math.floor(i / 4) * 0.25)
      );
      group.add(coco);
    }

    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.34, 0.05),
      new THREE.MeshStandardMaterial({
        map: getVendorSignTex(1, textures.asphalt.anisotropy),
        roughness: 0.45,
      })
    );
    signMesh.position.set(0.05, 0.96, 0.52);
    group.add(signMesh);
  }

  // Striped Hawker Umbrella
  const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.85, 6), wheelMat);
  uPole.position.set(-0.25, 1.62, -0.2);
  group.add(uPole);

  const uCanopy = new THREE.Mesh(new THREE.ConeGeometry(1.12, 0.44, 8), umbrellaMat);
  uCanopy.position.set(-0.25, 2.56, -0.2);
  group.add(uCanopy);

  return group;
}

/**
 * Main Procedural Sidewalk Population Script
 * Populates BOTH:
 * 1) Curb-side smashable stalls (`±7.0`) with varied Chai Tongs, Flower Shops, Shobji Stalls & Street Vendors
 * 2) Elevated inner footpath (`±10.15`, y = 0.26) with bustling non-overlapping street vendors, chai stalls & flower shops
 */
export function populateSidewalksForCell(
  cellGroup: THREE.Group,
  cellIndex: number,
  textures: ProceduralTexturePack,
  callbacks: ProceduralSidewalkCallbacks
): ProceduralSidewalkStallEntry[] {
  const rng = createSeededRng(cellIndex * 7919 + 4099);
  const smashableStalls: ProceduralSidewalkStallEntry[] = [];

  // Track static prop exclusion spots on sidewalks so nothing clips bus shelters, dumpsters, or poles
  const blockedZones: Array<{ x: number; z: number; r: number }> = [
    { x: 10.35, z: -21.0, r: 4.0 }, // Bus shelter NS
    { x: -21.0, z: 10.35, r: 4.0 }, // Bus shelter EW
    { x: -10.4, z: -17.5, r: 3.4 }, // DSCC Dumpster
    { x: 10.1, z: 12.2, r: 2.5 }, // Dir sign A
    { x: -12.2, z: -10.1, r: 2.5 }, // Dir sign B
  ];
  ([-1, 1] as const).forEach((sx) => {
    ([-1, 1] as const).forEach((sz) => {
      blockedZones.push({ x: sx * 11.4, z: sz * 29.0, r: 2.0 }); // Utility pole NS
      blockedZones.push({ x: sx * 29.0, z: sz * 11.4, r: 2.0 }); // Utility pole EW
      blockedZones.push({ x: sx * 9.0, z: sz * 26.0, r: 1.6 }); // Streetlamp NS
      blockedZones.push({ x: sx * 26.0, z: sz * 9.0, r: 1.6 }); // Streetlamp EW
    });
  });

  const isSpotClear = (px: number, pz: number, minRadius = 2.8): boolean => {
    for (const bz of blockedZones) {
      const dx = px - bz.x;
      const dz = pz - bz.z;
      if (dx * dx + dz * dz < (bz.r + minRadius) * (bz.r + minRadius)) {
        return false;
      }
    }
    return true;
  };

  const vendorArchetypes: StreetVendorArchetype[] = [
    'fuchka_jhalmuri',
    'coconut_fruit',
    'books_pan',
    'balloon_toys',
  ];

  const spawnProceduralModel = (
    category: SidewalkStallCategory,
    variantSeed: number
  ): THREE.Group => {
    if (category === 'veggie') {
      return callbacks.createShobjiStall();
    }
    if (category === 'chai') {
      return createChaiTongStallModel(variantSeed, textures, rng);
    }
    if (category === 'flower') {
      return createFlowerShopModel(variantSeed, textures, rng);
    }
    const arch = vendorArchetypes[variantSeed % vendorArchetypes.length];
    return createUniqueStreetVendorModel(arch, variantSeed, textures, rng);
  };

  // A. Smashable Curb-Shoulder Stalls (16 per cell, 4 quadrants x 4 spots at ±7.0)
  // Diverse weighted mix of Shobji, Chai Tongs, Flower Shops & Street Vendors
  const curbCategories: SidewalkStallCategory[] = ['veggie', 'chai', 'flower', 'vendor'];
  ([-1, 1] as const).forEach((sx) => {
    ([-1, 1] as const).forEach((sz) => {
      const qHash = Math.abs(cellIndex * 29 + (sx > 0 ? 7 : 2) + (sz > 0 ? 11 : 3) * 13);
      const spots: Array<{ x: number; z: number; rot: number }> = [
        { x: sx * 7.0, z: sz * (21.5 + rng() * 2.2), rot: sx < 0 ? Math.PI / 2 : -Math.PI / 2 },
        { x: sx * 7.0, z: sz * (37.0 + rng() * 2.5), rot: sx < 0 ? Math.PI / 2 : -Math.PI / 2 },
        { x: sx * (23.0 + rng() * 2.5), z: sz * 7.0, rot: sz < 0 ? 0 : Math.PI },
        { x: sx * (37.5 + rng() * 2.5), z: sz * 7.0, rot: sz < 0 ? 0 : Math.PI },
      ];

      spots.forEach((sp, idx) => {
        const cat = curbCategories[(qHash + idx + Math.floor(rng() * 4)) % curbCategories.length];
        const variantSeed = qHash + idx * 3 + Math.floor(rng() * 12);
        const mesh = spawnProceduralModel(cat, variantSeed);
        const jitterScale = 0.92 + rng() * 0.14;
        mesh.scale.setScalar(jitterScale);
        mesh.position.set(sp.x, 0, sp.z);
        mesh.rotation.y = sp.rot;
        cellGroup.add(mesh);

        smashableStalls.push({
          mesh,
          active: true,
          isVeggie: cat === 'veggie',
          category: cat,
          localX: sp.x,
          localZ: sp.z,
        });
      });
    });
  });

  // B. Elevated Footpath Sidewalk Population (y = 0.26 flush on sidewalk slab [8.55..11.75])
  // Populates N-S & E-W footpaths with Chai Stalls, Flower Shops, and Unique Street Vendors
  const sidewalkCategories: SidewalkStallCategory[] = ['chai', 'flower', 'vendor', 'chai', 'vendor', 'flower'];
  const candidateAnchors: Array<{ x: number; z: number; rot: number }> = [];

  ([-1, 1] as const).forEach((sx) => {
    ([-1, 1] as const).forEach((sz) => {
      // N-S Sidewalk candidate pockets (clear of pedestrian railings 12.5..18 and crosswalks)
      candidateAnchors.push(
        { x: sx * 10.35, z: sz * (20.2 + rng() * 3.0), rot: sx < 0 ? Math.PI / 2 : -Math.PI / 2 },
        { x: sx * 10.3, z: sz * (32.5 + rng() * 3.5), rot: sx < 0 ? Math.PI / 2 : -Math.PI / 2 },
        { x: sx * 10.35, z: sz * (41.5 + rng() * 3.0), rot: sx < 0 ? Math.PI / 2 : -Math.PI / 2 }
      );
      // E-W Sidewalk candidate pockets
      candidateAnchors.push(
        { x: sx * (20.2 + rng() * 3.0), z: sz * 10.35, rot: sz < 0 ? 0 : Math.PI },
        { x: sx * (32.5 + rng() * 3.5), z: sz * 10.3, rot: sz < 0 ? 0 : Math.PI },
        { x: sx * (41.5 + rng() * 3.0), z: sz * 10.35, rot: sz < 0 ? 0 : Math.PI }
      );
    });
  });

  // Shuffle deterministically & place up to 12 distinct footpath stalls per cell
  for (let i = candidateAnchors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = candidateAnchors[i];
    candidateAnchors[i] = candidateAnchors[j];
    candidateAnchors[j] = tmp;
  }

  let placedCount = 0;
  for (let i = 0; i < candidateAnchors.length && placedCount < 12; i++) {
    const cand = candidateAnchors[i];
    if (!isSpotClear(cand.x, cand.z, 2.7)) continue;

    const cat = sidewalkCategories[(cellIndex + placedCount + Math.floor(rng() * 3)) % sidewalkCategories.length];
    const variantSeed = cellIndex * 17 + i * 5 + Math.floor(rng() * 10);
    const mesh = spawnProceduralModel(cat, variantSeed);
    const scale = 0.84 + rng() * 0.1; // Compact sidewalk footprint fitting cleanly inside 3.2m footpath
    mesh.scale.setScalar(scale);
    mesh.position.set(cand.x, 0.26, cand.z);
    mesh.rotation.y = cand.rot;
    cellGroup.add(mesh);

    blockedZones.push({ x: cand.x, z: cand.z, r: 3.4 });
    placedCount++;
  }

  return smashableStalls;
}
