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

/**
 * Procedural Bengali Truck Art Texture Generator
 * Hand-painted calligraphy: "মা বাবার দোয়া", "আল্লাহ ভরসা", "দূরপাল্লা মালবাহী এক্সপ্রেস"
 */
function createTruckArtTexture(theme: number): THREE.CanvasTexture {
  const canvas = cv(512, 256);
  const ctx = canvas.getContext('2d')!;

  const bgCols = ['#047857', '#b45309', '#1d4ed8', '#991b1b', '#0f766e'];
  const bg = bgCols[theme % bgCols.length];

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  // Decorative floral geometric borders
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 220);

  // Corner floral rosettes
  [[32, 32], [480, 32], [32, 224], [480, 224]].forEach(([cx, cy]) => {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  const titles = [
    'মা বাবার দোয়া',
    'আল্লাহ ভরসা',
    'মায়ের আঁচল এক্সপ্রেস',
    'বিসমিল্লাহির রাহমানির রাহিম',
    'স্বপ্নের দেশ বাংলাদেশ',
  ];
  const subtitles = [
    '★ দূরপাল্লা হেভি মালবাহী পরিবহন ★',
    '★ ১০০ হাত দূরে থাকুন • ওভারটেকিং নিষেধ ★',
    '★ ঢাকা-চট্টগ্রাম-সিলেট হাইওয়ে এক্সপ্রেস ★',
    '★ সততাই মূলধন • সাবধানে চালান ★',
    '★ হর্ন দিন • সাইড নিন • নিরাপদ থাকুন ★',
  ];

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 32px ${BN}`;
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 6;
  ctx.fillText(titles[theme % titles.length], 256, 95);

  ctx.fillStyle = '#fef08a';
  ctx.font = `bold 20px ${BN}`;
  ctx.shadowBlur = 4;
  ctx.fillText(subtitles[theme % subtitles.length], 256, 160);

  // Bottom hazard chevron stripes
  const numStripes = 16;
  const stripeW = 512 / numStripes;
  for (let i = 0; i < numStripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#facc15' : '#09090b';
    ctx.beginPath();
    ctx.moveTo(i * stripeW, 218);
    ctx.lineTo((i + 1) * stripeW, 218);
    ctx.lineTo((i + 0.5) * stripeW, 246);
    ctx.lineTo((i - 0.5) * stripeW, 246);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let cachedTruckTextures: THREE.CanvasTexture[] = [];
function getTruckTexture(idx: number): THREE.CanvasTexture {
  if (!cachedTruckTextures[idx % 5]) {
    cachedTruckTextures[idx % 5] = createTruckArtTexture(idx);
  }
  return cachedTruckTextures[idx % 5];
}

/**
 * Creates an authentic decorated Bangladeshi Bedford / Tata Heavy Cargo Truck
 */
export function createDhakaTruckModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const root = new THREE.Group();
  const truck = new THREE.Group();
  truck.rotation.y = Math.PI; // Model nose is built at +Z; rotate PI so forward points toward -Z like all traffic
  root.add(truck);
  truck.add(createContactShadowMesh(textures.contactShadow, 8.4, 3.2));

  // Materials
  const cabColors = [0x0c6b45, 0x1e40af, 0x991b1b, 0xb45309, 0x0f766e];
  const cabColor = cabColors[variant % cabColors.length];

  const cabMat = new THREE.MeshStandardMaterial({
    color: cabColor,
    roughness: 0.44,
    metalness: 0.22,
  });
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.75,
    metalness: 0.6,
  });
  const woodPlankMat = new THREE.MeshStandardMaterial({
    color: 0x7c4610,
    roughness: 0.86,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.88,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.92,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd99b18, // Warm satin ochre Bangladeshi steel wheel rims
    roughness: 0.48,
    metalness: 0.35,
  });
  const tarpMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a6e, // Weathered navy tarpaulin covering goods
    roughness: 0.88,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd,
    roughness: 0.1,
    transparent: true,
    opacity: 0.6,
  });

  // 1. Heavy Chassis Rail Frame
  const chassisBeamL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 7.6), chassisMat);
  chassisBeamL.position.set(-0.65, 0.75, 0);
  truck.add(chassisBeamL);

  const chassisBeamR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 7.6), chassisMat);
  chassisBeamR.position.set(0.65, 0.75, 0);
  truck.add(chassisBeamR);

  // 2. Heavy 6-Wheel Configuration (Dual wheels on rear axle)
  const createWheel = (x: number, y: number, z: number, isDual = false) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, isDual ? 0.48 : 0.26, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    wheelGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.32, 0.32, (isDual ? 0.48 : 0.26) + 0.02, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);

    // Hub center nut
    const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, (isDual ? 0.48 : 0.26) + 0.06, 8);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    wheelGroup.add(hub);

    truck.add(wheelGroup);
  };

  // Front single wheels
  createWheel(-1.12, 0.52, 2.45, false);
  createWheel(1.12, 0.52, 2.45, false);

  // Rear dual wheels (Axle 1)
  createWheel(-1.1, 0.52, -1.5, true);
  createWheel(1.1, 0.52, -1.5, true);

  // Rear dual wheels (Axle 2)
  createWheel(-1.1, 0.52, -2.6, true);
  createWheel(1.1, 0.52, -2.6, true);

  // 3. Driver Cabin (Classic Dhaka Tata/Bedford with curved nose & rounded hood)
  const cabNose = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.25, 1.5), cabMat);
  cabNose.position.set(0, 1.45, 2.75);
  cabNose.castShadow = true;
  truck.add(cabNose);

  // Front Chrome Radiator Grille
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.85, 0.1), chromeMat);
  grille.position.set(0, 1.35, 3.52);
  truck.add(grille);

  // Round Chrome Headlamps
  [-0.75, 0.75].forEach((hx) => {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 12), chromeMat);
    lamp.rotation.x = Math.PI / 2;
    lamp.position.set(hx, 1.35, 3.52);
    truck.add(lamp);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xfff6cf, emissive: 0xffe9a0, emissiveIntensity: 1.5 })
    );
    bulb.position.set(hx, 1.35, 3.56);
    truck.add(bulb);
  });

  // Heavy Front Steel Bull-bar (বাম্পার) with Warning Hazard Stripes
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.35, 0.22), chromeMat);
  bumper.position.set(0, 0.72, 3.6);
  truck.add(bumper);

  // Hanging bumper chain (সৌখিন ঝুলন্ত শিকল)
  const chain = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.08, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
  );
  chain.position.set(0, 0.45, 3.65);
  truck.add(chain);

  // Main Cab Body
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.6, 1.4), cabMat);
  cabBody.position.set(0, 1.9, 1.45);
  cabBody.castShadow = true;
  truck.add(cabBody);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.75), glassMat);
  windshield.position.set(0, 2.15, 2.16);
  truck.add(windshield);

  // Side cab windows
  [-1.16, 1.16].forEach((sx) => {
    const sideWin = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.65), glassMat);
    sideWin.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    sideWin.position.set(sx, 2.15, 1.45);
    truck.add(sideWin);

    // Large elephant-ear side mirrors (হাতি কান লুকিং গ্লাস)
    const mirrorPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), chromeMat);
    mirrorPole.position.set(sx > 0 ? 1.35 : -1.35, 2.05, 1.9);
    truck.add(mirrorPole);

    const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.18), chromeMat);
    mirrorHead.position.set(sx > 0 ? 1.42 : -1.42, 2.15, 1.9);
    truck.add(mirrorHead);
  });

  // 4. Elaborate Wooden Decorated Crown & Visor (ট্রাকের তাজ / মুকুট)
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const crown = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.45, 1.55), crownMat);
  crown.position.set(0, 2.85, 1.45);
  crown.castShadow = true;
  truck.add(crown);

  // Front visor awning projecting over windshield
  const visor = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.18, 0.6), cabMat);
  visor.rotation.x = 0.25;
  visor.position.set(0, 2.7, 2.2);
  truck.add(visor);

  // Dual roof air horns (বিশাল ভেঁপু হর্ন)
  [-0.45, 0.45].forEach((hx) => {
    const horn = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.04, 0.65, 8), chromeMat);
    horn.rotation.x = Math.PI / 2;
    horn.position.set(hx, 3.12, 1.8);
    truck.add(horn);
  });

  // 5. Wooden Cargo Deck & Truck Art Side Panels (ট্রাকের ডালা)
  const deckLength = 4.8;
  const deckWidth = 2.4;
  const deckHeight = 1.6;

  // Deck floor
  const deckFloor = new THREE.Mesh(new THREE.BoxGeometry(deckWidth, 0.25, deckLength), woodPlankMat);
  deckFloor.position.set(0, 1.05, -1.5);
  deckFloor.receiveShadow = true;
  truck.add(deckFloor);

  // Truck Art Banner Panels on Left & Right Deck Walls
  const artMat = new THREE.MeshStandardMaterial({
    map: getTruckTexture(variant),
    roughness: 0.6,
  });

  const artLeft = new THREE.Mesh(new THREE.PlaneGeometry(deckLength - 0.2, deckHeight - 0.2), artMat);
  artLeft.rotation.y = -Math.PI / 2;
  artLeft.position.set(-deckWidth / 2 - 0.02, 1.85, -1.5);
  truck.add(artLeft);

  const artRight = new THREE.Mesh(new THREE.PlaneGeometry(deckLength - 0.2, deckHeight - 0.2), artMat);
  artRight.rotation.y = Math.PI / 2;
  artRight.position.set(deckWidth / 2 + 0.02, 1.85, -1.5);
  truck.add(artRight);

  // Rear Tailgate Art (পেছনের ডালা)
  const artBack = new THREE.Mesh(new THREE.PlaneGeometry(deckWidth - 0.2, deckHeight - 0.2), artMat);
  artBack.rotation.y = Math.PI;
  artBack.position.set(0, 1.85, -1.5 - deckLength / 2 - 0.02);
  truck.add(artBack);

  // Heavy Vertical Wooden Stake Ribs
  for (let zRib = -1.5 - deckLength / 2; zRib <= -1.5 + deckLength / 2; zRib += 1.2) {
    [-deckWidth / 2, deckWidth / 2].forEach((xRib) => {
      const stake = new THREE.Mesh(new THREE.BoxGeometry(0.12, deckHeight + 0.3, 0.14), woodPlankMat);
      stake.position.set(xRib, 1.9, zRib);
      truck.add(stake);
    });
  }

  // 6. Tarpaulin Goods Load (ত্রিপল দিয়ে মোড়ানো মাল)
  const tarpLoad = new THREE.Mesh(
    new THREE.BoxGeometry(deckWidth - 0.3, 1.2, deckLength - 0.4),
    tarpMat
  );
  tarpLoad.position.set(0, 2.3, -1.5);
  tarpLoad.castShadow = true;
  truck.add(tarpLoad);

  // Tied ropes across tarpaulin
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
  for (let rz = -3.2; rz <= 0.4; rz += 0.9) {
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, deckWidth + 0.1, 6), ropeMat);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, 2.92, rz);
    truck.add(rope);
  }

  // Side diesel fuel tank and battery box
  const fuelTank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 1.4, 12),
    chassisMat
  );
  fuelTank.rotation.z = Math.PI / 2;
  fuelTank.position.set(0.95, 0.68, 0.3);
  truck.add(fuelTank);

  // Side vertical exhaust stack
  const exhaust = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8),
    chromeMat
  );
  exhaust.position.set(1.15, 2.1, 0.7);
  truck.add(exhaust);

  // Rear tail lamps & mudflaps
  [-0.85, 0.85].forEach((rx) => {
    const tailLamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xdc2626, emissiveIntensity: 1.8 })
    );
    tailLamp.position.set(rx, 0.75, -1.5 - deckLength / 2 - 0.1);
    truck.add(tailLamp);

    // Mudflap (কালো রাবার মাডফ্ল্যাপ)
    const mudflap = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.45, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.95 })
    );
    mudflap.position.set(rx > 0 ? 1.05 : -1.05, 0.45, -3.3);
    truck.add(mudflap);
  });

  return root;
}
