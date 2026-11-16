import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import { createContactShadowMesh } from './models';

/**
 * Cached Bengali Building Signboard Textures
 */
let cachedMarketSign: THREE.CanvasTexture | null = null;
let cachedBiryaniSign: THREE.CanvasTexture | null = null;
let cachedHospitalSign: THREE.CanvasTexture | null = null;
let cachedCoachingSign: THREE.CanvasTexture | null = null;
let cachedCollegeSign: THREE.CanvasTexture | null = null;
let cachedRooftopAdSign: THREE.CanvasTexture | null = null;
let cachedNewMarketArcadeSigns: THREE.CanvasTexture[] | null = null;
let cachedBuetSign: THREE.CanvasTexture | null = null;
let cachedGlassBankSign: THREE.CanvasTexture | null = null;
let cachedTinMarketSign: THREE.CanvasTexture | null = null;
let cachedBusCounterSign: THREE.CanvasTexture | null = null;

function makeSignTex(
  bg: string,
  border: string,
  title: string,
  sub: string,
  eng: string,
  withMedicalCross = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = border;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 148);

  let cx = 256;
  if (withMedicalCross) {
    cx = 285;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(62, 80, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(54, 58, 16, 44);
    ctx.fillRect(40, 72, 44, 16);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, cx, 56);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 20px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(sub, cx, 102);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(eng, cx, 136);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export type ShopkeeperStyle = 'pharmacy' | 'mudi' | 'recharge' | 'hotel' | 'tea_mama' | 'vendor';

/**
 * AUTHENTIC SEATED BANGLADESHI SHOPKEEPER ("দোকানদার / গদিতে বসা ব্যবসায়ী")
 * Wooden stool, patterned lungi or trousers, bent seated legs, shirt/panjabi,
 * optional shoulder gamcha, head with hair/tupi/glasses, and forward resting arms.
 */
export function createSeatedShopkeeperModel(
  style: ShopkeeperStyle,
  seed: number,
  textures: ProceduralTexturePack,
  includeCashBox = true
): THREE.Group {
  const s = Math.abs(seed);
  const keeper = new THREE.Group();

  const skinTones = [0xc68642, 0xb5743c, 0xd49b63, 0x8d5524];
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinTones[s % skinTones.length],
    roughness: 0.72,
  });

  const shirtColor =
    style === 'pharmacy'
      ? 0xf8fafc
      : style === 'recharge'
        ? 0xec4899
        : style === 'hotel'
          ? 0xf59e0b
          : style === 'tea_mama'
            ? (s % 2 === 0 ? 0xe2e8f0 : 0x38bdf8)
            : [0x15803d, 0x1d4ed8, 0xb91c1c, 0xfef3c7][s % 4];

  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.65 });
  const lungiTex = textures.lungis[s % textures.lungis.length];
  const lowerMat =
    style === 'pharmacy' || style === 'recharge'
      ? new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.78 })
      : new THREE.MeshStandardMaterial({ map: lungiTex, roughness: 0.85 });

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.88 });
  const sandalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });

  // Stool / Plastic Chair ("দোকানের মোড়া / চেয়ার")
  const seatTop = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), woodMat);
  seatTop.position.set(0, 0.46, 0);
  keeper.add(seatTop);
  [-0.16, 0.16].forEach((lx) => {
    [-0.16, 0.16].forEach((lz) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.44, 6), woodMat);
      leg.position.set(lx, 0.22, lz);
      keeper.add(leg);
    });
  });

  // Seated lap + bent shins & sandals facing +Z
  const lap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.34), lowerMat);
  lap.position.set(0, 0.56, 0.12);
  keeper.add(lap);

  [-0.12, 0.12].forEach((lx) => {
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.42, 6), lowerMat);
    shin.position.set(lx, 0.32, 0.26);
    keeper.add(shin);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.05, 0.16), sandalMat);
    foot.position.set(lx, 0.06, 0.31);
    keeper.add(foot);
  });

  // Upright seated torso leaning slightly forward toward counter
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.26), shirtMat);
  torso.position.set(0, 0.9, 0.02);
  torso.rotation.x = 0.08;
  keeper.add(torso);

  // Classic Dhaka Gamcha towel draped over shoulder for tea_mama / mudi / vendor
  if (style === 'tea_mama' || style === 'mudi' || (style === 'vendor' && s % 2 === 0)) {
    const gamchaMat = new THREE.MeshStandardMaterial({
      color: s % 2 === 0 ? 0xdc2626 : 0xea580c,
      roughness: 0.85,
    });
    const gamcha = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.48, 0.3), gamchaMat);
    gamcha.position.set(0.17, 0.98, 0.03);
    keeper.add(gamcha);
  }

  // Arms reaching forward onto shop desk/counter (+Z)
  [-0.25, 0.25].forEach((ax) => {
    const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.28, 6), shirtMat);
    upperArm.position.set(ax, 1.0, 0.08);
    upperArm.rotation.x = -0.55;
    keeper.add(upperArm);

    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.26, 6), skinMat);
    forearm.position.set(ax * 0.88, 0.88, 0.26);
    forearm.rotation.x = Math.PI / 2 - 0.18;
    keeper.add(forearm);
  });

  // Head + Hair + Optional White Prayer Tupi or Glasses
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skinMat);
  head.position.set(0, 1.33, 0.04);
  keeper.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.154, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hairMat
  );
  hair.position.set(0, 1.34, 0.03);
  keeper.add(hair);

  if (s % 3 === 0 || style === 'hotel') {
    const tupiMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.72 });
    const tupi = new THREE.Mesh(
      new THREE.CylinderGeometry(0.135, 0.148, 0.09, 10),
      tupiMat
    );
    tupi.position.set(0, 1.44, 0.03);
    keeper.add(tupi);
  }

  if (style === 'pharmacy' || style === 'recharge') {
    const glassRimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.04), glassRimMat);
    glasses.position.set(0, 1.34, 0.18);
    keeper.add(glasses);
  }

  // Classic wooden/steel Cash Drawer ("গদি / টাকার বাক্স") beside shopkeeper
  if (includeCashBox) {
    const cashMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.65 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.65 });
    const cashBox = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.28), cashMat);
    cashBox.position.set(0.34, 0.72, 0.32);
    keeper.add(cashBox);

    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.03), brassMat);
    lock.position.set(0.34, 0.72, 0.47);
    keeper.add(lock);
  }

  keeper.scale.setScalar(0.82);
  return keeper;
}

/**
 * 1. DHAKA RESIDENTIAL APARTMENT ("আবাসিক ফ্ল্যাট ও ব্যালকনি ভবন")
 * Ground-floor shutters + upper flats with iron-grilled balconies, sunshade chajjas, AC units, laundry & chilekotha rooftop.
 */
export function createResidentialApartmentModel(
  variant: number,
  textures: ProceduralTexturePack
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 17, 13));

  const palettes = [
    { wall: 0xd9cbb8, accent: 0x7c2d12, trim: 0xf1ece4 }, // Warm sandstone cream + terracotta trim
    { wall: 0xc2d1cb, accent: 0x0f5132, trim: 0xeef3f0 }, // Pale mint sage + Dhaka green
    { wall: 0xd4a383, accent: 0x6b2d1a, trim: 0xf5ebe0 }, // Soft dusty terracotta
    { wall: 0xcbd5e1, accent: 0x1e3a5f, trim: 0xf1f5f9 }, // Ash concrete + deep slate blue
    { wall: 0xded3a8, accent: 0x713f12, trim: 0xfaf5e8 }, // Vintage mustard cream
    { wall: 0xdcc7c2, accent: 0x881337, trim: 0xf5edeb }, // Weathered rose plaster
  ];
  const pal = palettes[Math.abs(variant) % palettes.length];
  const floors = 4 + (Math.abs(variant) % 3); // 4, 5, or 6 floors
  const floorH = 2.95;
  const height = floors * floorH + 0.5;
  const width = 12.6 + (Math.abs(variant * 3) % 3) * 0.9;
  const depth = 9.4 + (Math.abs(variant * 5) % 2) * 0.8;

  const wallMat = new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.88 });
  const accentMat = new THREE.MeshStandardMaterial({ color: pal.accent, roughness: 0.78 });
  const trimMat = new THREE.MeshStandardMaterial({ color: pal.trim, roughness: 0.74 });
  const grillMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.18,
    metalness: 0.5,
  });
  const acMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45 });

  // Main core
  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  body.position.set(0, height / 2, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  building.add(body);

  // Side vertical pilaster accent bands
  [-width / 2 + 0.55, width / 2 - 0.55].forEach((px) => {
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.95, height, depth + 0.16), accentMat);
    pilaster.position.set(px, height / 2, 0);
    building.add(pilaster);
  });

  // Ground Floor: Shuttered local Dhaka shop bays + collapsible gate apartment entry
  const shopTex = textures.dhakaShopfrontGround[Math.abs(variant) % textures.dhakaShopfrontGround.length];
  const groundShop = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 2.6, 2.7),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.72 })
  );
  groundShop.position.set(0, 1.45, depth / 2 + 0.08);
  building.add(groundShop);

  // Striped footpath canopy awning over ground shop
  const awningColor = [0x0f766e, 0x991b1b, 0x1e40af, 0xb45309][Math.abs(variant) % 4];
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(width - 2.4, 0.14, 1.5),
    new THREE.MeshStandardMaterial({ color: awningColor, roughness: 0.8 })
  );
  awning.position.set(0, 2.95, depth / 2 + 0.75);
  awning.rotation.x = 0.22;
  building.add(awning);

  // Upper residential floors with recessed balconies, chajjas (sunshades), AC units & iron grilles
  for (let f = 1; f < floors; f++) {
    const fy = f * floorH + 0.4;

    // Horizontal concrete slab drip molding
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.28, 0.2, depth + 0.28), trimMat);
    cornice.position.set(0, fy, 0);
    building.add(cornice);

    [-width * 0.25, width * 0.25].forEach((bx, bIdx) => {
      // Balcony slab & concrete half wall
      const slab = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.22, 1.45), trimMat);
      slab.position.set(bx, fy + 0.05, depth / 2 + 0.7);
      building.add(slab);

      const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.65, 0.14), accentMat);
      lowerWall.position.set(bx, fy + 0.42, depth / 2 + 1.35);
      building.add(lowerWall);

      // Dhaka style vertical iron safety grill cage enclosing veranda
      const grillFrame = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.55, 0.06), grillMat);
      grillFrame.position.set(bx, fy + 1.45, depth / 2 + 1.35);
      // Make it wireframe-feel via slender top/mid/side bars rather than solid slab
      grillFrame.visible = false;
      for (let gx = -1.6; gx <= 1.6; gx += 0.64) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.55, 5), grillMat);
        bar.position.set(bx + gx, fy + 1.45, depth / 2 + 1.36);
        building.add(bar);
      }
      const topRail = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.06, 0.08), grillMat);
      topRail.position.set(bx, fy + 2.2, depth / 2 + 1.36);
      building.add(topRail);

      // Window/door behind balcony + slanted concrete sunshade chajja
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.85), glassMat);
      win.position.set(bx, fy + 1.15, depth / 2 + 0.06);
      building.add(win);

      const chajja = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.65), trimMat);
      chajja.position.set(bx, fy + 2.18, depth / 2 + 0.34);
      chajja.rotation.x = 0.1;
      building.add(chajja);

      // Split AC Outdoor Unit on alternate balconies
      if ((f + bIdx + variant) % 2 === 0) {
        const acUnit = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.5, 0.38), acMat);
        acUnit.position.set(bx + (bx > 0 ? 1.8 : -1.8), fy + 0.75, depth / 2 + 0.24);
        building.add(acUnit);
      }

      // Hanging laundry clothes on select balconies
      if ((f + bIdx + variant) % 3 === 1) {
        const clothColors = [0xdc2626, 0xfacc15, 0x2563eb, 0xf8fafc];
        for (let c = 0; c < 3; c++) {
          const cloth = new THREE.Mesh(
            new THREE.BoxGeometry(0.42, 0.55, 0.04),
            new THREE.MeshStandardMaterial({ color: clothColors[(f + c + variant) % 4], roughness: 0.9 })
          );
          cloth.position.set(bx - 0.7 + c * 0.7, fy + 1.65, depth / 2 + 1.3);
          building.add(cloth);
        }
      }
    });
  }

  // Rooftop Parapet, Chilekotha (stairhead room), and Gazi Black/Blue Water Tanks
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(width + 0.36, 0.95, depth + 0.36), trimMat);
  parapet.position.set(0, height + 0.45, 0);
  building.add(parapet);

  const chilekotha = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.3, 3.4), accentMat);
  chilekotha.position.set(width * 0.18, height + 1.15, -depth * 0.15);
  chilekotha.castShadow = true;
  building.add(chilekotha);

  const gaziColor = variant % 2 === 0 ? 0x111827 : 0x0369a1;
  const waterTank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 1.85, 14),
    new THREE.MeshStandardMaterial({ color: gaziColor, roughness: 0.65 })
  );
  waterTank.position.set(-width * 0.24, height + 1.5, -depth * 0.12);
  building.add(waterTank);

  return building;
}

/**
 * 2. OLD DHAKA HERITAGE BRICK SHOPHOUSE ("পুরান ঢাকা লাল ইটের ঐতিহ্যবাহী ভবন")
 * Red weathered brick, arched green wooden louvred windows, wrought-iron balconies & ground bazaar stall.
 */
export function createOldDhakaHeritageShophouseModel(
  variant: number,
  textures: ProceduralTexturePack
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 14, 11));

  const brickTone = [0x8c341c, 0x7c2d12, 0x993e24][Math.abs(variant) % 3];
  const width = 10.2 + (Math.abs(variant) % 3) * 1.1;
  const depth = 8.4;
  const floors = 3 + (Math.abs(variant) % 2); // 3 or 4 stories
  const height = floors * 3.4 + 0.8;

  const brickWallMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    color: 0xf4ded4,
    roughness: 0.9,
  });
  const solidBrickMat = new THREE.MeshStandardMaterial({ color: brickTone, roughness: 0.88 });
  const limestoneMat = new THREE.MeshStandardMaterial({ color: 0xe7dcc8, roughness: 0.8 });
  const tinRoofMat = new THREE.MeshStandardMaterial({
    map: textures.corrugatedTin,
    color: 0x94a3b8,
    roughness: 0.65,
    metalness: 0.3,
  });

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), brickWallMat);
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  building.add(main);

  // Decorative colonial brick cornice at roof line
  const roofCornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.55, depth + 0.5), limestoneMat);
  roofCornice.position.set(0, height + 0.25, 0);
  building.add(roofCornice);

  // Old parapet pilasters / merlons
  for (let px = -width / 2 + 0.5; px <= width / 2 - 0.5; px += 2.2) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.45), solidBrickMat);
    post.position.set(px, height + 0.9, depth / 2 + 0.05);
    building.add(post);
  }

  // Ground-floor Old Dhaka shopfront + slanted corrugated tin verandah canopy
  const shopTex = textures.dhakaShopfrontGround[(Math.abs(variant) + 1) % textures.dhakaShopfrontGround.length];
  const groundShop = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.0, 2.8),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.78 })
  );
  groundShop.position.set(0, 1.45, depth / 2 + 0.06);
  building.add(groundShop);

  const tinCanopy = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.1, 2.1), tinRoofMat);
  tinCanopy.position.set(0, 3.05, depth / 2 + 1.0);
  tinCanopy.rotation.x = 0.24;
  tinCanopy.castShadow = true;
  building.add(tinCanopy);

  // Bamboo awning support posts at footpath edge
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
  [-width / 2 + 0.4, width / 2 - 0.4].forEach((bx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.8, 6), bambooMat);
    post.position.set(bx, 1.4, depth / 2 + 1.85);
    building.add(post);
  });

  // Upper floor continuous cantilevered old iron-railed verandah
  if (floors >= 2) {
    const verSlab = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.2, 1.3), limestoneMat);
    verSlab.position.set(0, 3.9, depth / 2 + 0.65);
    building.add(verSlab);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.6 });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(width + 0.2, 0.12, 0.1), railMat);
    rail.position.set(0, 4.75, depth / 2 + 1.25);
    building.add(rail);
  }

  // Seated Old Dhaka Shopkeeper + Sidewalk Counter under the tin overhang!
  const counterTable = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.84, 0.68),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.82 })
  );
  counterTable.position.set(-1.3, 0.42, depth / 2 + 1.12);
  building.add(counterTable);

  const heritageKeeper = createSeatedShopkeeperModel('mudi', variant + 3, textures, true);
  heritageKeeper.position.set(-1.3, 0, depth / 2 + 0.56);
  building.add(heritageKeeper);

  return building;
}

/**
 * 3. DHAKA MIXED-USE COMMERCIAL & COACHING TOWER ("বহুতল বিপণী বিতান ও কোচিং সেন্টার")
 */
export function createMixedUseMidriseModel(
  variant: number,
  textures: ProceduralTexturePack
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 17, 13));

  if (!cachedCoachingSign) {
    cachedCoachingSign = makeSignTex(
      '#1e3a8a',
      '#facc15',
      'স্বপ্নচূড়া একাডেমিক ও কোচিং',
      'ঢাকা বিশ্ববিদ্যালয় · বুয়েট · মেডিকেল স্পেশাল ব্যাচ',
      'GOLDEN TOWER • BANK • CLINIC • COMMERCIAL',
      false
    );
  }
  if (!cachedRooftopAdSign) {
    cachedRooftopAdSign = makeSignTex(
      '#b91c1c',
      '#fde047',
      'দেশবন্ধু সুপার সিমেন্ট',
      'মজবুত নির্মাণে বাংলাদেশের বিশ্বস্ত নাম',
      'TRUSTED STRENGTH ACROSS BANGLADESH',
      false
    );
  }

  const facadeTex = textures.buildingWindows[Math.abs(variant) % textures.buildingWindows.length];
  const width = 13.5 + (Math.abs(variant) % 2) * 1.4;
  const depth = 9.8;
  const height = 16.5 + (Math.abs(variant) % 3) * 3.0;

  const facadeMat = new THREE.MeshStandardMaterial({ map: facadeTex, roughness: 0.72 });
  const sideMat = new THREE.MeshStandardMaterial({ color: 0xc2bcb2, roughness: 0.85 });
  const accentColors = [0x0f766e, 0x991b1b, 0x1e40af, 0x9a3412];
  const bandMat = new THREE.MeshStandardMaterial({
    color: accentColors[Math.abs(variant) % accentColors.length],
    roughness: 0.65,
  });

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), [
    sideMat,
    sideMat,
    sideMat,
    sideMat,
    facadeMat,
    facadeMat,
  ]);
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  building.add(main);

  // Ground floor bank/pharmacy storefront
  const shopTex = textures.dhakaShopfrontGround[(Math.abs(variant) + 2) % textures.dhakaShopfrontGround.length];
  const shopFront = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.8, 3.0),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.65 })
  );
  shopFront.position.set(0, 1.55, depth / 2 + 0.08);
  building.add(shopFront);

  // Second-floor coaching / commercial signboard strip
  const midSign = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.2, 2.2),
    new THREE.MeshStandardMaterial({ map: cachedCoachingSign, roughness: 0.5 })
  );
  midSign.position.set(0, 4.4, depth / 2 + 0.09);
  building.add(midSign);

  // Colored structural edge frames
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.8, depth + 0.4), bandMat);
  topTrim.position.set(0, height + 0.4, 0);
  building.add(topTrim);

  // Rooftop steel billboard structure (classic Dhaka rooftop hoarding)
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.45 });
  [-3.8, 3.8].forEach((px) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 3.8, 6), steelMat);
    leg.position.set(px, height + 2.3, depth / 2 - 0.6);
    building.add(leg);
  });
  const adBoard = new THREE.Mesh(
    new THREE.BoxGeometry(9.2, 2.8, 0.18),
    new THREE.MeshStandardMaterial({ map: cachedRooftopAdSign, roughness: 0.48 })
  );
  adBoard.position.set(0, height + 3.0, depth / 2 - 0.55);
  building.add(adBoard);

  return building;
}

/**
 * 4. DHAKA UNDER-CONSTRUCTION RCC BUILDING ("নির্মাণাধীন বহুতল ভবন ও বাঁশের মাচা")
 * Exposed concrete slabs, half-laid red brick infill, bamboo scaffolding, green safety mesh & jutting roof rebar rods.
 */
export function createUnderConstructionBuildingModel(
  variant: number,
  textures: ProceduralTexturePack
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 16, 12));

  const width = 12.2;
  const depth = 9.0;
  const floors = 4 + (Math.abs(variant) % 2);
  const floorH = 3.0;

  const rccMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.92 }); // Raw poured concrete
  const rawBrickMat = new THREE.MeshStandardMaterial({ color: 0x9a3c23, roughness: 0.9 });
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
  const safetyNetMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.85,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  const rebarMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.7, metalness: 0.6 });

  // Ground floor shops already operating inside finished ground floor!
  const groundCore = new THREE.Mesh(new THREE.BoxGeometry(width, 3.1, depth), rccMat);
  groundCore.position.set(0, 1.55, 0);
  groundCore.castShadow = true;
  groundCore.receiveShadow = true;
  building.add(groundCore);

  const shopTex = textures.dhakaShopfrontGround[Math.abs(variant) % textures.dhakaShopfrontGround.length];
  const groundShop = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.0, 2.6),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.75 })
  );
  groundShop.position.set(0, 1.4, depth / 2 + 0.08);
  building.add(groundShop);

  // Upper open RCC floors + partial red-brick infill walls
  for (let f = 1; f < floors; f++) {
    const slabY = f * floorH;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.26, depth + 0.3), rccMat);
    slab.position.set(0, slabY, 0);
    slab.castShadow = true;
    slab.receiveShadow = true;
    building.add(slab);

    // 4x2 grid of concrete columns
    [-width / 2 + 0.4, -1.8, 1.8, width / 2 - 0.4].forEach((cx) => {
      [-depth / 2 + 0.4, depth / 2 - 0.4].forEach((cz) => {
        const col = new THREE.Mesh(new THREE.BoxGeometry(0.45, floorH, 0.45), rccMat);
        col.position.set(cx, slabY + floorH / 2, cz);
        col.castShadow = true;
        building.add(col);
      });
    });

    // Partial raw brick infill walls on lower unfinished floors
    if (f < floors - 1) {
      const infill = new THREE.Mesh(new THREE.BoxGeometry(width - 1.2, floorH - 0.3, depth - 1.2), rawBrickMat);
      infill.position.set(0, slabY + floorH / 2, -0.2);
      infill.castShadow = true;
      building.add(infill);
    }
  }

  // Top roof slab + jutting rusty rebar starter rods
  const topY = floors * floorH;
  const topSlab = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.28, depth + 0.3), rccMat);
  topSlab.position.set(0, topY, 0);
  topSlab.castShadow = true;
  building.add(topSlab);

  [-width / 2 + 0.4, -1.8, 1.8, width / 2 - 0.4].forEach((cx) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 5), rebarMat);
    rod.position.set(cx, topY + 0.75, depth / 2 - 0.4);
    building.add(rod);
  });

  // Bamboo scaffolding poles along front street facade
  const scafH = topY + 1.2;
  for (let bx = -width / 2 + 0.3; bx <= width / 2 - 0.3; bx += 2.2) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, scafH, 6), bambooMat);
    pole.position.set(bx, scafH / 2, depth / 2 + 0.85);
    building.add(pole);
  }
  for (let ry = 3.6; ry <= topY; ry += 2.8) {
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, width + 0.6, 5), bambooMat);
    cross.rotation.z = Math.PI / 2;
    cross.position.set(0, ry, depth / 2 + 0.88);
    building.add(cross);
  }

  // Draped green safety construction net on front bays
  const net = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.6, topY - 3.4), safetyNetMat);
  net.position.set(0, (topY + 3.4) / 2, depth / 2 + 0.82);
  building.add(net);

  return building;
}

/**
 * 5. DHAKA MODEL SCHOOL / COLLEGE CAMPUS ("ঢাকা মডেল কলেজ ও বিদ্যালয়")
 */
export function createDhakaSchoolCollegeModel(
  variant: number,
  textures: ProceduralTexturePack
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 20, 14));

  if (!cachedCollegeSign) {
    cachedCollegeSign = makeSignTex(
      '#14532d',
      '#facc15',
      'ঢাকা মডেল কলেজ ও উচ্চ বিদ্যালয়',
      'স্থাপিত: ১৯৭৮ ইং • আদর্শ ও সুশিক্ষার অঙ্গীকার',
      'DHAKA MODEL COLLEGE & HIGH SCHOOL',
      false
    );
  }

  const creamMat = new THREE.MeshStandardMaterial({ color: 0xe7dfd1, roughness: 0.82 });
  const brickTrimMat = new THREE.MeshStandardMaterial({
    color: variant % 2 === 0 ? 0x8f331c : 0x166534,
    roughness: 0.78,
  });
  const classWinMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.25 });

  const width = 16.5;
  const depth = 9.6;
  const height = 10.6; // 3-story educational block

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), creamMat);
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  building.add(main);

  // Extended corridor verandah colonnade along front
  for (let f = 0; f < 3; f++) {
    const slabY = f * 3.4 + 0.1;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.24, 1.9), brickTrimMat);
    slab.position.set(0, slabY, depth / 2 + 0.9);
    building.add(slab);

    if (f > 0) {
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.85, 0.18), creamMat);
      parapet.position.set(0, slabY + 0.5, depth / 2 + 1.78);
      building.add(parapet);
    }

    // Pillars
    for (let px = -width / 2 + 0.8; px <= width / 2 - 0.8; px += 3.6) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.4, 0.45), brickTrimMat);
      pillar.position.set(px, f * 3.4 + 1.7, depth / 2 + 1.7);
      building.add(pillar);
    }

    // Classroom windows along recessed corridor wall
    for (let wx = -width / 2 + 2.4; wx <= width / 2 - 2.2; wx += 3.6) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.6), classWinMat);
      win.position.set(wx, f * 3.4 + 1.9, depth / 2 + 0.06);
      building.add(win);
    }
  }

  // Roof overhang & school signboard
  const roofCap = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.5, depth + 2.2), brickTrimMat);
  roofCap.position.set(0, height + 0.25, 0.9);
  building.add(roofCap);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9.6, 2.3),
    new THREE.MeshBasicMaterial({ map: cachedCollegeSign })
  );
  signMesh.position.set(0, height - 1.2, depth / 2 + 1.92);
  building.add(signMesh);

  return building;
}

/**
 * 6. DHAKA SHOPPING PLAZA & MARKET ("ঢাকা গ্র্যান্ড শপিং কমপ্লেক্স ও বস্ত্র বিতান")
 */
export function createShoppingMarketPlazaModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 21, 15));

  if (!cachedMarketSign) {
    cachedMarketSign = makeSignTex(
      '#b91c1c',
      '#facc15',
      'ঢাকা গ্র্যান্ড শপিং কমপ্লেক্স',
      'বস্ত্র বিতান • জুয়েলার্স • মোবাইল ও ইলেকট্রনিক্স',
      'DHAKA GRAND SHOPPING PLAZA',
      false
    );
  }

  const facadeColor = [0x334155, 0x3f3f46, 0x1e3a5f][Math.abs(variant) % 3];
  const facadeMat = new THREE.MeshStandardMaterial({ color: facadeColor, roughness: 0.68, metalness: 0.2 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.52 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0e7490,
    roughness: 0.16,
    metalness: 0.55,
  });

  const height = 14.5 + (Math.abs(variant) % 2) * 3.0;
  const width = 16.8;
  const depth = 11.4;

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), facadeMat);
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  building.add(main);

  // Ground-floor retail storefronts
  const shopTex = textures.dhakaShopfrontGround[(Math.abs(variant) + 1) % textures.dhakaShopfrontGround.length];
  const shopBay = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.4, 3.0),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.65 })
  );
  shopBay.position.set(0, 1.55, depth / 2 + 0.08);
  building.add(shopBay);

  const glassAtrium = new THREE.Mesh(new THREE.PlaneGeometry(13.2, height - 6.0), glassMat);
  glassAtrium.position.set(0, 3.5 + (height - 6.0) / 2, depth / 2 + 0.06);
  building.add(glassAtrium);

  [4.0, 7.2, 10.4, 13.4].forEach((ly) => {
    if (ly >= height) return;
    const louver = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.25, 0.42), trimMat);
    louver.position.set(0, ly, depth / 2 + 0.2);
    building.add(louver);
  });

  const awning = new THREE.Mesh(new THREE.BoxGeometry(10, 0.35, 2.8), trimMat);
  awning.position.set(0, 3.3, depth / 2 + 1.4);
  building.add(awning);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 2.5),
    new THREE.MeshBasicMaterial({ map: cachedMarketSign })
  );
  signMesh.position.set(0, height - 1.5, depth / 2 + 0.12);
  building.add(signMesh);

  return building;
}

/**
 * 7. DHAKA TRADITIONAL BIRYANI RESTAURANT & HOTEL ("হাজী নান্না বিরিয়ানি ও কাচ্চি ঘর")
 */
export function createStreetRestaurantHotelModel(textures: ProceduralTexturePack): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 15, 12));

  if (!cachedBiryaniSign) {
    cachedBiryaniSign = makeSignTex(
      '#881337',
      '#fbbf24',
      'হাজী নান্না বিরিয়ানি ও কাচ্চি ঘর',
      'খাঁটি গাওয়া ঘিয়ের শাহী মোরগ পোলাও ও বোরহানী',
      'OLD DHAKA TRADITIONAL KACHCHI & BIRYANI',
      false
    );
  }

  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    color: 0xf1d5c8,
    roughness: 0.88,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xe7dcc8, roughness: 0.72 });

  const height = 10.6;
  const width = 12.0;
  const depth = 8.6;

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), brickMat);
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  building.add(main);

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 0.16, 2.3),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.75 })
  );
  awning.rotation.x = 0.2;
  awning.position.set(0, 3.15, depth / 2 + 1.1);
  building.add(awning);

  // Giant steaming brass Biryani Handi (হাঁড়ি) outside restaurant
  const degMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.4, metalness: 0.62 });
  const deg = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.82, 0.88, 14), degMat);
  deg.position.set(-3.2, 0.44, depth / 2 + 1.35);
  deg.castShadow = true;
  building.add(deg);

  const redWrap = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.82 })
  );
  redWrap.position.set(-3.2, 0.88, depth / 2 + 1.35);
  building.add(redWrap);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(8.2, 2.2),
    new THREE.MeshBasicMaterial({ map: cachedBiryaniSign })
  );
  signMesh.position.set(0, 4.4, depth / 2 + 0.08);
  building.add(signMesh);

  [-3.2, 0, 3.2].forEach((wx) => {
    [6.8, 9.2].forEach((wy) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.35, 0.1), trimMat);
      win.position.set(wx, wy, depth / 2 + 0.06);
      building.add(win);
    });
  });

  // Cashier desk & Seated Biryani Hotel Master ("বিরিয়ানি ঘরের দোকানদার") beside handi
  const cashDesk = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.88, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.75 })
  );
  cashDesk.position.set(1.9, 0.44, depth / 2 + 1.22);
  building.add(cashDesk);

  const hotelKeeper = createSeatedShopkeeperModel('hotel', 2, textures, true);
  hotelKeeper.position.set(1.9, 0, depth / 2 + 0.68);
  building.add(hotelKeeper);

  return building;
}

/**
 * 8. DHAKA CITY SPECIALIZED HOSPITAL & DIAGNOSTIC CENTER ("সিটি হাসপাতাল")
 */
export function createCityClinicHospitalModel(textures: ProceduralTexturePack): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 19, 14));

  if (!cachedHospitalSign) {
    cachedHospitalSign = makeSignTex(
      '#0369a1',
      '#7dd3fc',
      'সিটি স্পেশালাইজড হাসপাতাল',
      '২৪ ঘণ্টা জরুরি বিভাগ ও ডায়াগনস্টিক সেন্টার',
      'DHAKA CITY HOSPITAL & EMERGENCY 24/7',
      true
    );
  }

  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.62 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.58 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.65 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.16, metalness: 0.45 });

  const height = 15.6;
  const width = 15.2;
  const depth = 9.8;

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), whiteMat);
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  building.add(main);

  const accent = new THREE.Mesh(new THREE.BoxGeometry(2.1, height, 0.28), blueMat);
  accent.position.set(-5.2, height / 2, depth / 2 + 0.1);
  building.add(accent);

  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(8.6, 2.3),
    new THREE.MeshBasicMaterial({ map: cachedHospitalSign })
  );
  signMesh.position.set(1.4, 13.6, depth / 2 + 0.08);
  building.add(signMesh);

  for (let floor = 1; floor <= 4; floor++) {
    const wy = floor * 2.75 + 1.1;
    [-1.8, 1.8, 5.1].forEach((wx) => {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.55), glassMat);
      glass.position.set(wx, wy, depth / 2 + 0.06);
      building.add(glass);
    });
  }

  const portico = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 2.6), redMat);
  portico.position.set(0, 3.3, depth / 2 + 1.3);
  building.add(portico);

  return building;
}

/**
 * 9. DHAKA NEW MARKET HERITAGE SHOPPING ARCADE ("ঢাকা নিউ মার্কেট ★ স্থাপিত ১৯৫৪ • গাউছিয়া — চন্দ্রিমা স্টাইল")
 * Iconic 1954 cream-stucco & terracotta-brick colonnade arcade with arched ground corridor,
 * striped bazaar tarpaulin awnings, colorful hanging saree/garment racks, scalloped roof parapet, and market signboards.
 */
export function createNewMarketArcadeModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 22, 16));

  if (!cachedNewMarketArcadeSigns) {
    cachedNewMarketArcadeSigns = [
      makeSignTex(
        '#991b1b',
        '#fde047',
        'ঢাকা নিউ মার্কেট • স্থাপিত ১৯৫৪',
        'শাড়ি • থ্রি-পিস • চুড়ি • ক্রোকারিজ ও গহনা',
        'DHAKA NEW MARKET HERITAGE ARCADE'
      ),
      makeSignTex(
        '#065f46',
        '#facc15',
        'গাউছিয়া ও চন্দ্রিমা বস্ত্র বিতান',
        'জামদানি • মসলিন • ঈদ কালেকশন • পাইকারি ও খুচরা',
        'GAWSHIA & CHANDRIMA CLOTHING MARKET'
      ),
      makeSignTex(
        '#1e3a8a',
        '#fbbf24',
        'নীলক্ষেত বই বাজার ও স্টেশনারি',
        'স্কুল • কলেজ • বিশ্ববিদ্যালয় ও দুর্লভ বইয়ের সম্ভার',
        'NILKHET BOOK MARKET • DHAKA'
      ),
      makeSignTex(
        '#7c2d12',
        '#fef08a',
        'এলিফ্যান্ট রোড জুতা ও ব্যাগ মেলা',
        'চামড়ার জুতা • স্যান্ডেল • ট্রাভেল ব্যাগ ও লেদার',
        'ELEPHANT ROAD & NEW MARKET FOOTWEAR'
      ),
    ];
  }

  const creamStuccoMat = new THREE.MeshStandardMaterial({
    color: Math.abs(variant) % 2 === 0 ? 0xf5ebd6 : 0xf2e3c6,
    roughness: 0.78,
  });
  const terracottaMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    color: 0xb94a38,
    roughness: 0.84,
  });
  const verandaShadowMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.92 });
  const awningMat = new THREE.MeshStandardMaterial({
    map: textures.marketStripedAwning,
    roughness: 0.62,
  });
  const garmentMat = new THREE.MeshStandardMaterial({
    map: textures.newMarketGarmentRack,
    roughness: 0.68,
  });

  const width = 17.0;
  const depth = 11.4;
  const height = 8.8 + (Math.abs(variant) % 2) * 2.4;

  // Main warm cream colonial-modernist market body
  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), creamStuccoMat);
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  building.add(main);

  // Terracotta brick plinth & colonnade arch piers along the market corridor front (+Z)
  const frontZ = depth / 2;
  const darkRecess = new THREE.Mesh(new THREE.BoxGeometry(width - 1.2, 3.25, 0.25), verandaShadowMat);
  darkRecess.position.set(0, 1.65, frontZ + 0.02);
  building.add(darkRecess);

  const shopTex = textures.dhakaShopfrontGround[Math.abs(variant) % textures.dhakaShopfrontGround.length];
  const shopRow = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.6, 2.9),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.62 })
  );
  shopRow.position.set(0, 1.55, frontZ + 0.16);
  building.add(shopRow);

  // Terracotta arched pillars along front veranda
  const pillarXs = [-7.6, -3.8, 0, 3.8, 7.6];
  pillarXs.forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 3.65, 1.45), terracottaMat);
    pillar.position.set(px, 1.825, frontZ + 0.72);
    building.add(pillar);
  });

  // Scalloped concrete sunshade veranda cornice beam above colonnade
  const arcadeBeam = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.55, 1.85), creamStuccoMat);
  arcadeBeam.position.set(0, 3.72, frontZ + 0.85);
  building.add(arcadeBeam);

  // Sloped blue-white striped bazaar awning extending over the front footpath corridor
  const stripedAwning = new THREE.Mesh(new THREE.BoxGeometry(width - 0.8, 0.12, 2.25), awningMat);
  stripedAwning.rotation.x = 0.24;
  stripedAwning.position.set(0, 3.25, frontZ + 2.05);
  building.add(stripedAwning);

  // Hanging colorful saree / kurti / panjabi garment display panels tucked between pillars
  [-5.7, -1.9, 1.9, 5.7].forEach((gx, gi) => {
    if ((gi + variant) % 2 === 0) {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.65, 0.12), garmentMat);
      rack.position.set(gx, 1.55, frontZ + 1.25);
      building.add(rack);
    } else {
      // Open New Market shop counter with seated cloth/book merchant inside colonnade bay!
      const bayTable = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.84, 0.62),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.78 })
      );
      bayTable.position.set(gx, 0.42, frontZ + 1.05);
      building.add(bayTable);

      const bayKeeper = createSeatedShopkeeperModel(gi === 1 ? 'mudi' : 'vendor', variant + gi, textures, true);
      bayKeeper.position.set(gx, 0, frontZ + 0.56);
      building.add(bayKeeper);
    }
  });

  // Upper floor New Market cream concrete louvers & warm shuttered market offices/boutiques
  const winTex = textures.buildingWindows[(Math.abs(variant) + 1) % textures.buildingWindows.length];
  const upperBand = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.2, height - 4.8),
    new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.65 })
  );
  upperBand.position.set(0, 4.1 + (height - 4.8) / 2, frontZ + 0.08);
  building.add(upperBand);

  // Terracotta top parapet crown & iconic mid-century market signboard
  const roofTrim = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.55, depth + 0.5), terracottaMat);
  roofTrim.position.set(0, height + 0.275, 0);
  building.add(roofTrim);

  const signTex = cachedNewMarketArcadeSigns[Math.abs(variant) % cachedNewMarketArcadeSigns.length];
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 2.15, 0.16),
    new THREE.MeshBasicMaterial({ map: signTex })
  );
  signMesh.position.set(0, height - 0.85, frontZ + 0.22);
  building.add(signMesh);

  return building;
}

/**
 * 10. DHAKA UNIVERSITY / BUET COLONIAL RED-BRICK HALL ("ঢাকা বিশ্ববিদ্যালয় / কার্জন হল ঐতিহ্য ভবন")
 * Deep terracotta brick, white sandstone arched verandahs, stepped heritage cornice & cupola turret.
 */
export function createBuetCampusAcademicModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 21, 15));

  if (!cachedBuetSign) {
    cachedBuetSign = makeSignTex(
      '#7f1d1d',
      '#fef08a',
      'ঢাকা বিশ্ববিদ্যালয় ও বুয়েট অ্যানেক্স',
      'কলা ভবন • কেন্দ্রীয় গ্রন্থাগার • ঐতিহ্যবাহী ক্যাম্পাস',
      'DHAKA UNIVERSITY & BUET HERITAGE HALL'
    );
  }

  const redBrickMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    color: 0xa63a2b,
    roughness: 0.86,
  });
  const whiteStoneMat = new THREE.MeshStandardMaterial({ color: 0xf1ece1, roughness: 0.72 });
  const darkWoodMat = new THREE.MeshStandardMaterial({ color: 0x3b1f0e, roughness: 0.65 });
  const copperDomeMat = new THREE.MeshStandardMaterial({
    color: 0x115e59,
    roughness: 0.42,
    metalness: 0.45,
  });

  const width = 16.4;
  const depth = 10.4;
  const height = 10.8;

  const main = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), redBrickMat);
  main.position.set(0, height / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  building.add(main);

  // White sandstone horizontal dado bands & projecting porch
  [0.6, 3.8, 7.2, height].forEach((by) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(width + 0.35, 0.32, depth + 0.35), whiteStoneMat);
    band.position.set(0, by, 0);
    building.add(band);
  });

  const frontZ = depth / 2;
  // Front arched colonnade pillars
  [-6.8, -3.4, 0, 3.4, 6.8].forEach((px) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.65, height - 0.5, 1.15), whiteStoneMat);
    col.position.set(px, (height - 0.5) / 2, frontZ + 0.52);
    building.add(col);
  });

  // Grand arched windows along front facade
  [-5.1, -1.7, 1.7, 5.1].forEach((wx) => {
    [2.1, 5.5, 8.8].forEach((wy) => {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(1.75, 2.05, 0.14), darkWoodMat);
      shutter.position.set(wx, wy, frontZ + 0.08);
      building.add(shutter);
    });
  });

  // Central octagonal Curzon-style roof pavilion & cupola dome
  const pavilion = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 4.6), redBrickMat);
  pavilion.position.set(0, height + 1.2, 0);
  building.add(pavilion);

  const cupola = new THREE.Mesh(
    new THREE.SphereGeometry(1.9, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    variant % 2 === 0 ? copperDomeMat : whiteStoneMat
  );
  cupola.position.set(0, height + 2.35, 0);
  building.add(cupola);

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(10.2, 2.1, 0.16),
    new THREE.MeshBasicMaterial({ map: cachedBuetSign })
  );
  signMesh.position.set(0, 4.15, frontZ + 1.15);
  building.add(signMesh);

  return building;
}

/**
 * 11. DHAKA HIGH-RISE CORPORATE BANK & TOWER ("মিরপুর রোড বহুতল বাণিজ্যিক ও ব্যাংক টাওয়ার")
 * 7-8 story curtain-wall glass facade, composite terracotta/silver ACP cladding, ground ATM booth & rooftop antenna.
 */
export function createDhakaHighriseGlassBankModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 18, 14));

  if (!cachedGlassBankSign) {
    cachedGlassBankSign = makeSignTex(
      '#0f172a',
      '#38bdf8',
      'ঢাকা কমার্শিয়াল ব্যাংক ও এটিএম বুথ',
      'সায়েন্স ল্যাব — মিরপুর রোড কর্পোরেট টাওয়ার',
      '24/7 FAST TRACK ATM • CORPORATE PLAZA'
    );
  }

  const acpColors = [0x1e293b, 0x334155, 0x0f3b5c];
  const glassColors = [0x0284c7, 0x0f766e, 0x1d4ed8];
  const acpMat = new THREE.MeshStandardMaterial({
    color: acpColors[Math.abs(variant) % acpColors.length],
    roughness: 0.42,
    metalness: 0.48,
  });
  const glassCurtainMat = new THREE.MeshStandardMaterial({
    color: glassColors[Math.abs(variant) % glassColors.length],
    roughness: 0.12,
    metalness: 0.72,
  });
  const finMat = new THREE.MeshStandardMaterial({
    color: variant % 2 === 0 ? 0xeab308 : 0xe2e8f0,
    roughness: 0.35,
    metalness: 0.65,
  });

  const width = 13.8;
  const depth = 10.2;
  const height = 21.5 + (Math.abs(variant) % 2) * 3.5;

  const core = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), acpMat);
  core.position.set(0, height / 2, 0);
  core.castShadow = true;
  core.receiveShadow = true;
  building.add(core);

  // Reflective curtain wall glass sheet front & sides
  const glassFront = new THREE.Mesh(new THREE.BoxGeometry(width - 1.4, height - 4.5, depth + 0.18), glassCurtainMat);
  glassFront.position.set(0, 3.8 + (height - 4.5) / 2, 0);
  building.add(glassFront);

  // Vertical architectural mullions
  for (let fx = -width / 2 + 1.6; fx <= width / 2 - 1.6; fx += 2.6) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.24, height - 3.5, depth + 0.42), finMat);
    fin.position.set(fx, 3.4 + (height - 3.5) / 2, 0);
    building.add(fin);
  }

  // Ground-floor ATM / Bank Portico + signboard
  const shopTex = textures.dhakaShopfrontGround[(Math.abs(variant) + 2) % textures.dhakaShopfrontGround.length];
  const groundShop = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.2, 3.1),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.5 })
  );
  groundShop.position.set(0, 1.55, depth / 2 + 0.12);
  building.add(groundShop);

  const atmCanopy = new THREE.Mesh(new THREE.BoxGeometry(width - 2.0, 0.36, 2.2), finMat);
  atmCanopy.position.set(0, 3.35, depth / 2 + 1.0);
  building.add(atmCanopy);

  const bankSign = new THREE.Mesh(
    new THREE.BoxGeometry(10.6, 2.15, 0.18),
    new THREE.MeshBasicMaterial({ map: cachedGlassBankSign })
  );
  bankSign.position.set(0, 4.65, depth / 2 + 0.25);
  building.add(bankSign);

  // Rooftop telecom mast & water tank
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.18, 4.6, 6), finMat);
  mast.position.set(width * 0.22, height + 2.3, 0);
  building.add(mast);

  return building;
}

/**
 * 12. DHAKA TIN-SHED & BAZAAR MARKET ROW ("হকার্স মার্কেট ও টিনশেড বাজার সারি")
 * Classic low-rise weathered brick + pitched corrugated tin roofs, bustling signboard row & hanging awning poles.
 */
export function createDhakaTinShedBazaarRowModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 17, 11));

  if (!cachedTinMarketSign) {
    cachedTinMarketSign = makeSignTex(
      '#14532d',
      '#fde047',
      'হকার্স মার্কেট ও টিনশেড পট্টি',
      'জিন্স • টি-শার্ট • ঘড়ি • চশমা ও গিফট শপ',
      'DHAKA HAWKERS BAZAAR ROW'
    );
  }

  const plasterMat = new THREE.MeshStandardMaterial({
    color: variant % 2 === 0 ? 0xd6c7b2 : 0xc5b8a5,
    roughness: 0.9,
  });
  const tinMat = new THREE.MeshStandardMaterial({
    map: textures.corrugatedTin,
    color: variant % 2 === 0 ? 0x94a3b8 : 0x7c8a99,
    roughness: 0.58,
    metalness: 0.36,
  });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });

  const width = 15.6;
  const depth = 8.4;
  const wallH = 4.95;

  const base = new THREE.Mesh(new THREE.BoxGeometry(width, wallH, depth), plasterMat);
  base.position.set(0, wallH / 2, 0);
  base.castShadow = true;
  base.receiveShadow = true;
  building.add(base);

  // Pitched corrugated tin roof + front awning eave
  const roofPitch = new THREE.Mesh(new THREE.BoxGeometry(width + 0.8, 0.14, depth + 2.6), tinMat);
  roofPitch.position.set(0, wallH + 0.55, 0.55);
  roofPitch.rotation.x = 0.2;
  roofPitch.castShadow = true;
  building.add(roofPitch);

  // Bamboo / steel front support posts
  [-6.8, -2.2, 2.2, 6.8].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.6, 6), poleMat);
    post.position.set(px, 1.8, depth / 2 + 1.55);
    building.add(post);
  });

  // Ground shop shutters & colorful garment hanging panel
  const shopTex = textures.dhakaShopfrontGround[Math.abs(variant) % textures.dhakaShopfrontGround.length];
  const shopMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.8, 3.05),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.72 })
  );
  shopMesh.position.set(0, 1.58, depth / 2 + 0.06);
  building.add(shopMesh);

  const rack = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 1.75, 0.14),
    new THREE.MeshStandardMaterial({ map: textures.newMarketGarmentRack, roughness: 0.65 })
  );
  rack.position.set(variant % 2 === 0 ? -4.2 : 4.2, 1.45, depth / 2 + 1.0);
  building.add(rack);

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 1.75, 0.14),
    new THREE.MeshBasicMaterial({ map: cachedTinMarketSign })
  );
  signMesh.position.set(0, wallH - 0.45, depth / 2 + 1.48);
  building.add(signMesh);

  // Seated Hawkers Bazaar Shopkeepers & counters under the tin-shed awning!
  [-1.2, 4.4].forEach((kx, kIdx) => {
    const shopDesk = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.82, 0.64),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    shopDesk.position.set(kx, 0.41, depth / 2 + 1.05);
    building.add(shopDesk);

    const tinKeeper = createSeatedShopkeeperModel(kIdx === 0 ? 'vendor' : 'mudi', variant + kIdx, textures, true);
    tinKeeper.position.set(kx, 0, depth / 2 + 0.55);
    building.add(tinKeeper);
  });

  return building;
}

/**
 * 13. DHAKA BUS TICKET COUNTER & CNG REFUELING CANOPY ("নিউ মার্কেট — সায়েন্স ল্যাব বাস কাউন্টার ও স্টেশন")
 */
export function createDhakaBusCounterPumpModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 18, 12));

  if (!cachedBusCounterSign) {
    cachedBusCounterSign = makeSignTex(
      '#991b1b',
      '#facc15',
      'নিউ মার্কেট বাস কাউন্টার ও ফিলিং স্টেশন',
      'এসি / নন-এসি টিকেট • সিএনজি ও পেট্রোল পাম্প',
      'DHAKA COACH TERMINAL & FUEL STATION'
    );
  }

  const canopyMat = new THREE.MeshStandardMaterial({
    color: variant % 2 === 0 ? 0xdc2626 : 0x059669,
    roughness: 0.42,
    metalness: 0.28,
  });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.48 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.78 });
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.45 });

  const width = 15.2;
  const depth = 9.2;

  // Rear ticket office booth block
  const office = new THREE.Mesh(new THREE.BoxGeometry(width, 4.2, 3.6), concreteMat);
  office.position.set(0, 2.1, -depth / 2 + 1.8);
  office.castShadow = true;
  office.receiveShadow = true;
  building.add(office);

  const shopTex = textures.dhakaShopfrontGround[(Math.abs(variant) + 1) % textures.dhakaShopfrontGround.length];
  const counterFront = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 1.0, 2.8),
    new THREE.MeshStandardMaterial({ map: shopTex, roughness: 0.65 })
  );
  counterFront.position.set(0, 1.5, -depth / 2 + 3.65);
  building.add(counterFront);

  // Towering fueling / bus-bay canopy over paved bay
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.95, 6.2), canopyMat);
  canopy.position.set(0, 4.85, 1.6);
  canopy.castShadow = true;
  building.add(canopy);

  const canopyStripe = new THREE.Mesh(new THREE.BoxGeometry(width + 0.68, 0.22, 6.28), trimMat);
  canopyStripe.position.set(0, 4.42, 1.6);
  building.add(canopyStripe);

  // Canopy pillars + dispenser islands
  [-5.2, 0, 5.2].forEach((px) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.4, 0.45), concreteMat);
    col.position.set(px, 2.2, 1.6);
    building.add(col);
  });
  [-2.6, 2.6].forEach((dx) => {
    const dispenser = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.65, 0.65), pumpMat);
    dispenser.position.set(dx, 0.825, 1.6);
    building.add(dispenser);
  });

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(11.4, 1.8, 0.18),
    new THREE.MeshBasicMaterial({ map: cachedBusCounterSign })
  );
  signMesh.position.set(0, 4.85, 4.78);
  building.add(signMesh);

  return building;
}

export type OpenShopKind = 'pharmacy' | 'mudi' | 'recharge' | 'hotel';

/**
 * 14. WALK-IN OPEN-SHUTTER DHAKA ROADSIDE SHOP ("খোলা দোকান")
 * Rolled-up corrugated metal shutter drum, open walk-in illuminated room interior,
 * stocked merchandise shelves, open glass/wood counter, hanging snack packets,
 * shopkeeper inside, and glowing "খোলা দোকান" signboard.
 */
export function createDhakaOpenShopModel(
  textures: ProceduralTexturePack,
  variant = 0
): { mesh: THREE.Group; kind: OpenShopKind } {
  const kinds: OpenShopKind[] = ['pharmacy', 'mudi', 'recharge', 'hotel'];
  const idx = ((variant % kinds.length) + kinds.length) % kinds.length;
  const kind = kinds[idx];

  const shop = new THREE.Group();
  shop.add(createContactShadowMesh(textures.contactShadow, 8.6, 7.2));

  const wallColor =
    kind === 'pharmacy'
      ? 0xe2e8f0
      : kind === 'mudi'
        ? 0xfef3c7
        : kind === 'recharge'
          ? 0xdbeafe
          : 0xfde68a;
  const accentColor =
    kind === 'pharmacy'
      ? 0x059669
      : kind === 'mudi'
        ? 0xd97706
        : kind === 'recharge'
          ? 0xdb2777
          : 0xb91c1c;

  const outerWallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.8 });
  const innerWallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.72 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.65 });
  const shutterMat = new THREE.MeshStandardMaterial({
    map: textures.corrugatedTin,
    color: 0x64748b,
    roughness: 0.45,
    metalness: 0.6,
  });
  const counterMat = new THREE.MeshStandardMaterial({
    color: kind === 'pharmacy' ? 0x0f766e : kind === 'recharge' ? 0x1e293b : 0x78350f,
    roughness: 0.55,
  });
  const glassTopMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    roughness: 0.15,
    metalness: 0.35,
  });
  const tubeLightMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });

  const w = 6.4;
  const d = 4.6;
  const h = 4.05;

  // Hollow Open-Front Room Shell (Back wall + Left/Right side walls + Ceiling + Tiled Floor)
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), floorMat);
  floor.position.set(0, 0.07, 0);
  floor.receiveShadow = true;
  shop.add(floor);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.28), innerWallMat);
  backWall.position.set(0, h / 2, -d / 2 + 0.14);
  shop.add(backWall);

  [-w / 2 + 0.16, w / 2 - 0.16].forEach((sx) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.32, h, d), outerWallMat);
    sideWall.position.set(sx, h / 2, 0);
    sideWall.castShadow = true;
    shop.add(sideWall);
  });

  // Roof slab + taller upper 2nd floor residential/commercial block over the open ground shop
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.34, d + 0.6), outerWallMat);
  roof.position.set(0, h + 0.12, 0.15);
  shop.add(roof);

  const upperBlock = new THREE.Mesh(
    new THREE.BoxGeometry(w, 3.65, d - 0.3),
    new THREE.MeshStandardMaterial({
      map: textures.heritageBrick,
      color: 0xe6d4c0,
      roughness: 0.85,
    })
  );
  upperBlock.position.set(0, h + 2.08, -0.15);
  shop.add(upperBlock);

  const parapetCap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.25, 0.28, d), outerWallMat);
  parapetCap.position.set(0, h + 4.02, -0.15);
  shop.add(parapetCap);

  // Rolled-up Corrugated Steel Shutter Drum above the completely open doorway
  const shutterDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, w - 0.6, 10), shutterMat);
  shutterDrum.rotation.z = Math.PI / 2;
  shutterDrum.position.set(0, h - 0.22, d / 2 - 0.05);
  shop.add(shutterDrum);

  // Bright indoor fluorescent tube light illuminating the open shop interior
  const tube = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.14), tubeLightMat);
  tube.position.set(0, h - 0.22, -0.2);
  shop.add(tube);

  // Back Merchandise Shelves packed with colorful goods
  const shelfMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.65 });
  const itemColors =
    kind === 'pharmacy'
      ? [0xef4444, 0x22c55e, 0x3b82f6, 0xffffff]
      : kind === 'mudi'
        ? [0xf97316, 0xfacc15, 0xdc2626, 0x16a34a]
        : kind === 'recharge'
          ? [0x0ea5e9, 0xec4899, 0xfacc15, 0x1e293b]
          : [0xd97706, 0xf59e0b, 0xef4444, 0xfef3c7];

  for (let row = 0; row < 3; row++) {
    const sy = 0.75 + row * 0.72;
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(w - 1.0, 0.08, 0.52), shelfMat);
    shelf.position.set(0, sy, -d / 2 + 0.56);
    shop.add(shelf);

    for (let col = 0; col < 6; col++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.34, 0.26),
        new THREE.MeshStandardMaterial({
          color: itemColors[(row + col) % itemColors.length],
          roughness: 0.45,
        })
      );
      box.position.set(-2.0 + col * 0.8, sy + 0.21, -d / 2 + 0.55);
      shop.add(box);
    }
  }

  // Open Front Serving Counter + Display Glass Case
  const counter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.96, 0.72), counterMat);
  counter.position.set(0, 0.52, 0.78);
  counter.castShadow = true;
  shop.add(counter);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(4.46, 0.06, 0.78), glassTopMat);
  counterTop.position.set(0, 1.03, 0.78);
  shop.add(counterTop);

  // Detailed Seated Shopkeeper ("দোকানের গদিতে বসা দোকানদার") inside behind glass counter!
  const shopkeeper = createSeatedShopkeeperModel(kind, variant, textures, true);
  shopkeeper.position.set(-0.25, 0.14, 0.08);
  shop.add(shopkeeper);

  // Hanging colorful snack/chips sachets ("দোকানে ঝোলানো চিপস ও শ্যাম্পুর প্যাকেট") in open doorway
  if (kind === 'mudi' || kind === 'recharge') {
    for (let p = 0; p < 5; p++) {
      const sachet = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.34, 0.04),
        new THREE.MeshStandardMaterial({ color: itemColors[p % itemColors.length], roughness: 0.4 })
      );
      sachet.position.set(-2.35 + (p < 2 ? p * 0.28 : 4.1 + (p - 2) * 0.28), 2.32 - (p % 2) * 0.36, d / 2 - 0.15);
      shop.add(sachet);
    }
  }

  // Warm dangling Dhaka market tungsten bulb + Bangladesh red-green festive awning strip
  const dropBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  dropBulb.position.set(0, 2.75, d / 2 + 0.52);
  shop.add(dropBulb);

  const fairyColors = [0x22c55e, 0xef4444, 0xfacc15, 0x3b82f6];
  for (let fb = 0; fb < 8; fb++) {
    const fBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 5, 5),
      new THREE.MeshBasicMaterial({ color: fairyColors[(fb + idx) % fairyColors.length] })
    );
    fBulb.position.set(-2.6 + fb * 0.74, 2.9, d / 2 + 1.48);
    shop.add(fBulb);
  }

  // Slanted Front Awning + Illuminated "খোলা দোকান" Signboard
  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.4, 0.12, 1.6),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.55 })
  );
  awning.position.set(0, 3.35, d / 2 + 0.75);
  awning.rotation.x = 0.22;
  shop.add(awning);

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(w - 0.2, 1.08, 0.14),
    new THREE.MeshBasicMaterial({ map: textures.openShopSigns[idx] })
  );
  signMesh.position.set(0, 4.22, d / 2 + 0.16);
  shop.add(signMesh);

  // Subtle green sidewalk welcome floor strip indicating open walk-in entrance
  const matStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.75),
    new THREE.MeshBasicMaterial({ color: 0x22c55e })
  );
  matStrip.rotation.x = -Math.PI / 2;
  matStrip.position.set(0, 0.15, d / 2 + 0.45);
  shop.add(matStrip);

  return { mesh: shop, kind };
}

