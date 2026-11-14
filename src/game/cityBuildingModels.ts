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
  const floors = 2 + (Math.abs(variant) % 2); // 2 or 3 stories
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
