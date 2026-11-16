import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import {
  createBorkaWomanModel,
  createContactShadowMesh,
  NpcArchetype,
  PedestrianRig,
} from './models';

const SKIN_TONES = [0xc68642, 0xd99b78, 0x9c6234, 0x8d5524];

interface SharedNpcPrimitives {
  headGeo: THREE.SphereGeometry;
  eyeGeo: THREE.SphereGeometry;
  legCylGeo: THREE.CylinderGeometry;
  shoeGeo: THREE.BoxGeometry;
  armCylGeo: THREE.CylinderGeometry;
  phoneGeo: THREE.BoxGeometry;
  eyeMat: THREE.MeshBasicMaterial;
  hairMat: THREE.MeshStandardMaterial;
  beardMat: THREE.MeshStandardMaterial;
  shoeBlackMat: THREE.MeshStandardMaterial;
  shoeWhiteMat: THREE.MeshStandardMaterial;
  sandalMat: THREE.MeshStandardMaterial;
  phoneBodyMat: THREE.MeshStandardMaterial;
  phoneScreenMat: THREE.MeshBasicMaterial;
  gamchaMat: THREE.MeshStandardMaterial;
  juteMat: THREE.MeshStandardMaterial;
  caneMat: THREE.MeshStandardMaterial;
}

let cachedNpcPrimitives: SharedNpcPrimitives | null = null;

function getNpcPrimitives(): SharedNpcPrimitives {
  if (cachedNpcPrimitives) return cachedNpcPrimitives;

  const legCylGeo = new THREE.CylinderGeometry(0.064, 0.052, 0.56, 8);
  legCylGeo.translate(0, -0.28, 0);

  const armCylGeo = new THREE.CylinderGeometry(0.052, 0.044, 0.48, 8);
  armCylGeo.translate(0, -0.24, 0);

  cachedNpcPrimitives = {
    headGeo: new THREE.SphereGeometry(0.148, 10, 10),
    eyeGeo: new THREE.SphereGeometry(0.015, 6, 6),
    legCylGeo,
    shoeGeo: new THREE.BoxGeometry(0.095, 0.07, 0.19),
    armCylGeo,
    phoneGeo: new THREE.BoxGeometry(0.075, 0.014, 0.135),
    eyeMat: new THREE.MeshBasicMaterial({ color: 0x09090b }),
    hairMat: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 }),
    beardMat: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 }),
    shoeBlackMat: new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.45, metalness: 0.2 }),
    shoeWhiteMat: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.55 }),
    sandalMat: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.82 }),
    phoneBodyMat: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.7 }),
    phoneScreenMat: new THREE.MeshBasicMaterial({ color: 0x7dd3fc }),
    gamchaMat: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.78 }),
    juteMat: new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.92 }),
    caneMat: new THREE.MeshStandardMaterial({ color: 0x5c2d16, roughness: 0.7 }),
  };
  return cachedNpcPrimitives;
}

function buildPivotArm(
  xPos: number,
  yPos: number,
  sleeveMat: THREE.Material,
  skinMat: THREE.Material,
  prim: SharedNpcPrimitives,
  shortSleeve = false
): THREE.Group {
  const armPivot = new THREE.Group();
  armPivot.position.set(xPos, yPos, 0);

  if (shortSleeve) {
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.056, 0.2, 8).translate(0, -0.1, 0),
      sleeveMat
    );
    armPivot.add(sleeve);
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.04, 0.3, 8).translate(0, -0.32, 0),
      skinMat
    );
    armPivot.add(forearm);
  } else {
    const sleeve = new THREE.Mesh(prim.armCylGeo, sleeveMat);
    armPivot.add(sleeve);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.044, 6, 6), skinMat);
    hand.position.set(0, -0.49, 0);
    armPivot.add(hand);
  }
  return armPivot;
}

function buildPivotLeg(
  xPos: number,
  yPos: number,
  legMat: THREE.Material,
  shoeMat: THREE.Material,
  prim: SharedNpcPrimitives
): THREE.Group {
  const legPivot = new THREE.Group();
  legPivot.position.set(xPos, yPos, 0);
  const legMesh = new THREE.Mesh(prim.legCylGeo, legMat);
  legPivot.add(legMesh);

  const shoe = new THREE.Mesh(prim.shoeGeo, shoeMat);
  shoe.position.set(0, -0.56, -0.035);
  legPivot.add(shoe);
  return legPivot;
}

function addEyes(headGroup: THREE.Group, prim: SharedNpcPrimitives): void {
  [-0.048, 0.048].forEach((ex) => {
    const eye = new THREE.Mesh(prim.eyeGeo, prim.eyeMat);
    eye.position.set(ex, 0.018, -0.136);
    headGroup.add(eye);
  });
}

function createPhoneAttachment(prim: SharedNpcPrimitives): THREE.Group {
  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(0, -0.49, -0.075);
  phoneGroup.rotation.x = 0.28;
  const body = new THREE.Mesh(prim.phoneGeo, prim.phoneBodyMat);
  phoneGroup.add(body);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.11), prim.phoneScreenMat);
  screen.rotation.x = -Math.PI / 2;
  screen.position.y = 0.0085;
  phoneGroup.add(screen);
  return phoneGroup;
}

/**
 * 1. GRAMIN / GAIA ("গাঁইয়া / গ্রামীণ পথচারী")
 * Checkered lungi, fatua half-shirt, red-checkered gamcha on shoulder/forehead, bamboo mathal hat & jute sack.
 */
function createGraminNpc(seed: number, textures: ProceduralTexturePack): PedestrianRig {
  const prim = getNpcPrimitives();
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.88, 0.88));

  const skinMat = new THREE.MeshStandardMaterial({
    color: SKIN_TONES[Math.abs(seed) % SKIN_TONES.length],
    roughness: 0.72,
  });
  const fatuaColors = [0xf8fafc, 0xfef08a, 0xd1fae5, 0xfed7aa, 0xcbd5e1];
  const shirtMat = new THREE.MeshStandardMaterial({
    color: fatuaColors[Math.abs(seed) % fatuaColors.length],
    roughness: 0.74,
  });
  const lungiMat = new THREE.MeshStandardMaterial({
    map: textures.lungis[Math.abs(seed) % textures.lungis.length],
    roughness: 0.8,
  });

  // Lungi cylinder
  const lungi = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.255, 0.72, 10), lungiMat);
  lungi.position.set(0, 0.54, 0);
  root.add(lungi);

  // Relaxed rural fatua torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.52, 0.25), shirtMat);
  torso.position.set(0, 1.1, 0);
  root.add(torso);

  // Iconic Red/Orange Checkered Gamcha draped over shoulder OR tied on forehead
  const gamchaAccent = seed % 2 === 0 ? prim.gamchaMat : new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.78 });
  const gamchaSash = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 0.28), gamchaAccent);
  gamchaSash.position.set(-0.14, 1.11, 0);
  gamchaSash.rotation.z = 0.08;
  root.add(gamchaSash);

  // Head group
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  const skull = new THREE.Mesh(prim.headGeo, skinMat);
  head.add(skull);
  addEyes(head, prim);

  if (seed % 3 === 0) {
    // Bamboo Mathal Wide Hat ("মাথাল")
    const mathalMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.88 });
    const mathal = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.16, 12), mathalMat);
    mathal.position.set(0, 0.14, 0);
    head.add(mathal);
  } else {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.153, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
      prim.hairMat
    );
    head.add(hair);
    // Gamcha tied tightly around forehead!
    const headband = new THREE.Mesh(new THREE.CylinderGeometry(0.158, 0.158, 0.07, 10), gamchaAccent);
    headband.position.set(0, 0.05, 0);
    head.add(headband);
  }
  root.add(head);

  const legL = buildPivotLeg(-0.1, 0.58, skinMat, prim.sandalMat, prim);
  const legR = buildPivotLeg(0.1, 0.58, skinMat, prim.sandalMat, prim);
  root.add(legL);
  root.add(legR);

  const armL = buildPivotArm(-0.26, 1.28, shirtMat, skinMat, prim, true);
  const armR = buildPivotArm(0.26, 1.28, shirtMat, skinMat, prim, true);
  // Carrying burlap jute market sack in left hand
  if (seed % 2 === 0) {
    const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.36, 8), prim.juteMat);
    sack.position.set(-0.04, -0.58, -0.02);
    armL.add(sack);
  }
  root.add(armL);
  root.add(armR);

  return {
    root,
    legL,
    legR,
    armL,
    armR,
    head,
    archetype: 'gramin',
    hasGamcha: true,
    walkingSpeed: 1.1 + (seed % 4) * 0.18,
    direction: seed % 2 === 0 ? 1 : -1,
    phase: (seed * 1.43) % (Math.PI * 2),
  };
}

/**
 * 2. SMART / OFFICE & VARSITY ("স্মার্ট / অফিস-ভার্সিটি পথচারী")
 * Tailored pants, dress shirt, tie/blazer, ID lanyard, sunglasses, laptop backpack, smartphone.
 */
function createSmartNpc(seed: number, textures: ProceduralTexturePack): PedestrianRig {
  const prim = getNpcPrimitives();
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.85, 0.85));

  const skinMat = new THREE.MeshStandardMaterial({
    color: SKIN_TONES[Math.abs(seed + 1) % SKIN_TONES.length],
    roughness: 0.68,
  });
  const shirtPal = [0xffffff, 0xe0f2fe, 0xfef3c7, 0xfce7f3, 0xe2e8f0];
  const pantPal = [0x0f172a, 0x1e293b, 0x334155, 0x27272a];
  const blazerPal = [0x1e293b, 0x0f172a, 0x312e81, 0x3f3f46];

  const hasBlazer = seed % 2 === 0;
  const shirtMat = new THREE.MeshStandardMaterial({
    color: shirtPal[Math.abs(seed) % shirtPal.length],
    roughness: 0.55,
  });
  const pantMat = new THREE.MeshStandardMaterial({
    color: pantPal[Math.abs(seed) % pantPal.length],
    roughness: 0.68,
  });
  const upperMat = hasBlazer
    ? new THREE.MeshStandardMaterial({ color: blazerPal[seed % blazerPal.length], roughness: 0.6 })
    : shirtMat;

  // Tailored upper trousers / hip block
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.22), pantMat);
  hips.position.set(0, 0.72, 0);
  root.add(hips);

  // Shirt / Blazer torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.53, 0.24), upperMat);
  torso.position.set(0, 1.09, 0);
  root.add(torso);

  // Crisp inner white shirt V + Necktie OR Office Lanyard facing -Z
  const tieColors = [0xb91c1c, 0x1d4ed8, 0x047857, 0x7c3aed];
  const tieMat = new THREE.MeshStandardMaterial({ color: tieColors[seed % tieColors.length], roughness: 0.45 });
  if (hasBlazer) {
    const innerShirt = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.44, 0.03), shirtMat);
    innerShirt.position.set(0, 1.12, -0.115);
    root.add(innerShirt);
  }
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.34, 0.03), tieMat);
  tie.position.set(0, 1.12, -0.125);
  root.add(tie);

  // Laptop Backpack (+Z)
  const packMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.62 });
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.14), packMat);
  backpack.position.set(0, 1.11, 0.18);
  root.add(backpack);

  // Head + Styled Hair + Sunglasses
  const head = new THREE.Group();
  head.position.set(0, 1.51, 0);
  const skull = new THREE.Mesh(prim.headGeo, skinMat);
  head.add(skull);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.156, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.56),
    prim.hairMat
  );
  hair.position.set(0, 0.015, 0.015);
  head.add(hair);

  // Sunglasses visor facing -Z
  const shades = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.052, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.15, metalness: 0.85 })
  );
  shades.position.set(0, 0.022, -0.135);
  head.add(shades);
  root.add(head);

  const legL = buildPivotLeg(-0.1, 0.64, pantMat, prim.shoeBlackMat, prim);
  const legR = buildPivotLeg(0.1, 0.64, pantMat, prim.shoeBlackMat, prim);
  root.add(legL);
  root.add(legR);

  const armL = buildPivotArm(-0.26, 1.29, upperMat, skinMat, prim, !hasBlazer);
  const armR = buildPivotArm(0.26, 1.29, upperMat, skinMat, prim, !hasBlazer);
  const phoneMesh = createPhoneAttachment(prim);
  armR.add(phoneMesh);
  root.add(armL);
  root.add(armR);

  return {
    root,
    legL,
    legR,
    armL,
    armR,
    head,
    phoneMesh,
    archetype: 'smart',
    walkingSpeed: 1.35 + (seed % 3) * 0.2,
    direction: seed % 2 === 0 ? 1 : -1,
    phase: (seed * 2.11) % (Math.PI * 2),
  };
}

/**
 * 3. CITY STYLE / DHAKA YOUTH ("সিটি স্টাইল / ঢাকার ইয়ুথ")
 * Streetwear hoodie/bomber jacket, slim jeans, white sneakers, backward cap/headphones, smartphone.
 */
function createCityStyleNpc(seed: number, textures: ProceduralTexturePack): PedestrianRig {
  const prim = getNpcPrimitives();
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.85, 0.85));

  const skinMat = new THREE.MeshStandardMaterial({
    color: SKIN_TONES[Math.abs(seed + 2) % SKIN_TONES.length],
    roughness: 0.68,
  });
  const hoodieColors = [0xdc2626, 0x2563eb, 0x7c3aed, 0x0f172a, 0x16a34a, 0xea580c];
  const jeanColors = [0x1e3a8a, 0x18181b, 0x334155];

  const jacketColor = hoodieColors[Math.abs(seed) % hoodieColors.length];
  const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.62 });
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: seed % 2 === 0 ? 0xf8fafc : jacketColor,
    roughness: 0.65,
  });
  const jeanMat = new THREE.MeshStandardMaterial({
    color: jeanColors[Math.abs(seed) % jeanColors.length],
    roughness: 0.72,
  });

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.22), jeanMat);
  hips.position.set(0, 0.72, 0);
  root.add(hips);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.54, 0.26), jacketMat);
  torso.position.set(0, 1.09, 0);
  root.add(torso);

  // Trendy Hoodie collar + Crossbody Sling Strap
  const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.055, 6, 12), jacketMat);
  hoodCollar.rotation.x = Math.PI / 2;
  hoodCollar.position.set(0, 1.35, 0.02);
  root.add(hoodCollar);

  const slingStrap = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.62, 0.28),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
  );
  slingStrap.position.set(0, 1.09, 0);
  slingStrap.rotation.z = 0.58;
  root.add(slingStrap);

  // Head + Backward Cap or Over-ear Headphones
  const head = new THREE.Group();
  head.position.set(0, 1.51, 0);
  const skull = new THREE.Mesh(prim.headGeo, skinMat);
  head.add(skull);
  addEyes(head, prim);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.154, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
    prim.hairMat
  );
  head.add(hair);

  if (seed % 2 === 0) {
    // Backward Baseball Cap (brim pointing +Z)
    const capMat = new THREE.MeshStandardMaterial({
      color: seed % 4 === 0 ? 0xdc2626 : 0x0f172a,
      roughness: 0.6,
    });
    const capCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.48),
      capMat
    );
    capCrown.position.y = 0.02;
    head.add(capCrown);
    const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.024, 0.14), capMat);
    capBrim.position.set(0, 0.04, 0.16);
    head.add(capBrim);
  } else {
    // Sleek Over-Ear Wireless Headphones
    const hpMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.35, metalness: 0.5 });
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.02, 6, 12, Math.PI), hpMat);
    band.position.y = 0.02;
    head.add(band);
    [-0.165, 0.165].forEach((hx) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 8), hpMat);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(hx, 0, 0);
      head.add(cup);
    });
  }
  root.add(head);

  const legL = buildPivotLeg(-0.1, 0.64, jeanMat, prim.shoeWhiteMat, prim);
  const legR = buildPivotLeg(0.1, 0.64, jeanMat, prim.shoeWhiteMat, prim);
  root.add(legL);
  root.add(legR);

  const armL = buildPivotArm(-0.27, 1.29, sleeveMat, skinMat, prim, false);
  const armR = buildPivotArm(0.27, 1.29, sleeveMat, skinMat, prim, false);
  const phoneMesh = createPhoneAttachment(prim);
  armR.add(phoneMesh);
  root.add(armL);
  root.add(armR);

  return {
    root,
    legL,
    legR,
    armL,
    armR,
    head,
    phoneMesh,
    archetype: 'city_style',
    walkingSpeed: 1.48 + (seed % 4) * 0.16,
    direction: seed % 2 === 0 ? 1 : -1,
    phase: (seed * 1.67) % (Math.PI * 2),
  };
}

/**
 * 4. MURUBBI / ELDER ("মুরুব্বি / প্রবীণ নাগরিক")
 * Flowing Panjabi + White Pajama, White Dhaka Tupi cap, silver beard, wooden walking cane.
 */
function createMurubbiNpc(seed: number, textures: ProceduralTexturePack): PedestrianRig {
  const prim = getNpcPrimitives();
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.85, 0.85));

  const skinMat = new THREE.MeshStandardMaterial({
    color: SKIN_TONES[Math.abs(seed) % SKIN_TONES.length],
    roughness: 0.72,
  });
  const panjabiPal = [0xf8fafc, 0xfef3c7, 0xd1fae5, 0xe2e8f0, 0xdbeafe];
  const panjabiMat = new THREE.MeshStandardMaterial({
    color: panjabiPal[Math.abs(seed) % panjabiPal.length],
    roughness: 0.74,
  });
  const pajamaMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.78 });
  const tupiMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.68 });

  // Flowing Panjabi knee-length coat
  const panjabiSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.56, 10), panjabiMat);
  panjabiSkirt.position.set(0, 0.66, 0);
  root.add(panjabiSkirt);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.24), panjabiMat);
  torso.position.set(0, 1.12, 0);
  root.add(torso);

  // Subtle embroidered Panjabi chest placket
  const placket = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.26, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.55 })
  );
  placket.position.set(0, 1.2, -0.125);
  root.add(placket);

  // Head + White Tupi + Silver Beard
  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  const skull = new THREE.Mesh(prim.headGeo, skinMat);
  head.add(skull);
  addEyes(head, prim);

  const tupi = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.15, 0.11, 12), tupiMat);
  tupi.position.set(0, 0.11, 0);
  head.add(tupi);

  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.16, 8), prim.beardMat);
  beard.rotation.x = Math.PI;
  beard.position.set(0, -0.11, -0.09);
  head.add(beard);
  root.add(head);

  const legL = buildPivotLeg(-0.095, 0.58, pajamaMat, prim.sandalMat, prim);
  const legR = buildPivotLeg(0.095, 0.58, pajamaMat, prim.sandalMat, prim);
  root.add(legL);
  root.add(legR);

  const armL = buildPivotArm(-0.25, 1.29, panjabiMat, skinMat, prim, false);
  const armR = buildPivotArm(0.25, 1.29, panjabiMat, skinMat, prim, false);

  // Wooden walking cane in right hand
  const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.9, 6), prim.caneMat);
  cane.position.set(0.03, -0.68, -0.08);
  cane.rotation.x = 0.08;
  armR.add(cane);

  root.add(armL);
  root.add(armR);

  return {
    root,
    legL,
    legR,
    armL,
    armR,
    head,
    archetype: 'murubbi',
    walkingSpeed: 0.94 + (seed % 3) * 0.14,
    direction: seed % 2 === 0 ? 1 : -1,
    phase: (seed * 1.25) % (Math.PI * 2),
  };
}

/**
 * 5. FERIWALA / STREET HAWKER ("ফেরিওয়ালা / হকার")
 * Utility vest + gamcha + either head-balanced fruit tokri basket or roadside cha kettle!
 */
function createFeriwalaNpc(seed: number, textures: ProceduralTexturePack): PedestrianRig {
  const prim = getNpcPrimitives();
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.88, 0.88));

  const skinMat = new THREE.MeshStandardMaterial({
    color: SKIN_TONES[Math.abs(seed + 1) % SKIN_TONES.length],
    roughness: 0.72,
  });
  const vestColors = [0x0f766e, 0xb45309, 0x991b1b, 0x1e40af];
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.75 });
  const vestMat = new THREE.MeshStandardMaterial({
    color: vestColors[Math.abs(seed) % vestColors.length],
    roughness: 0.7,
  });
  const lungiMat = new THREE.MeshStandardMaterial({
    map: textures.lungis[Math.abs(seed + 2) % textures.lungis.length],
    roughness: 0.8,
  });

  const lungi = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.25, 0.7, 10), lungiMat);
  lungi.position.set(0, 0.54, 0);
  root.add(lungi);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.52, 0.25), vestMat);
  torso.position.set(0, 1.1, 0);
  root.add(torso);

  // Gamcha collar ring around neck
  const neckGamcha = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.04, 6, 10), prim.gamchaMat);
  neckGamcha.rotation.x = Math.PI / 2;
  neckGamcha.position.set(0, 1.36, 0);
  root.add(neckGamcha);

  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  const skull = new THREE.Mesh(prim.headGeo, skinMat);
  head.add(skull);
  addEyes(head, prim);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.152, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
    prim.hairMat
  );
  head.add(hair);

  const carriesHeadBasket = seed % 2 === 0;
  if (carriesHeadBasket) {
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.88 });
    const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.2, 0.2, 10), basketMat);
    basket.position.set(0, 0.24, 0);
    head.add(basket);

    const fruitColors = [0x16a34a, 0xfacc15, 0xea580c];
    for (let f = 0; f < 5; f++) {
      const fruit = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 6, 6),
        new THREE.MeshStandardMaterial({ color: fruitColors[f % fruitColors.length], roughness: 0.55 })
      );
      const ang = (f / 5) * Math.PI * 2;
      fruit.position.set(Math.cos(ang) * 0.14, 0.34, Math.sin(ang) * 0.14);
      head.add(fruit);
    }
  }
  root.add(head);

  const legL = buildPivotLeg(-0.1, 0.58, skinMat, prim.sandalMat, prim);
  const legR = buildPivotLeg(0.1, 0.58, skinMat, prim.sandalMat, prim);
  root.add(legL);
  root.add(legR);

  const armL = buildPivotArm(-0.26, 1.28, shirtMat, skinMat, prim, true);
  const armR = buildPivotArm(0.26, 1.28, shirtMat, skinMat, prim, true);

  if (!carriesHeadBasket) {
    // Carrying gleaming aluminium roadside Cha Kettle!
    const kettleMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.82 });
    const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.24, 10), kettleMat);
    kettle.position.set(0.04, -0.58, -0.02);
    armR.add(kettle);
  } else {
    armL.rotation.z = -0.35;
    armL.rotation.x = -2.35; // Hand raised steadying the head basket!
  }

  root.add(armL);
  root.add(armR);

  return {
    root,
    legL,
    legR,
    armL,
    armR,
    head,
    archetype: 'feriwala',
    hasGamcha: true,
    hasHeadBasket: carriesHeadBasket,
    walkingSpeed: 1.15 + (seed % 3) * 0.2,
    direction: seed % 2 === 0 ? 1 : -1,
    phase: (seed * 1.83) % (Math.PI * 2),
  };
}

/**
 * Factory creating any of the 6 distinct Dhaka NPC archetypes:
 * gramin (গাঁইয়া/গ্রামীণ), smart (অফিস/ভার্সিটি), city_style (সিটি ইয়ুথ), murubbi (মুরুব্বি), feriwala (হকার), borka (বোরকা পরা মহিলা).
 */
export function createDiverseDhakaNpcModel(
  seed: number,
  textures: ProceduralTexturePack,
  forcedArchetype?: NpcArchetype
): PedestrianRig {
  const weightedOrder: NpcArchetype[] = [
    'borka',
    'gramin',
    'city_style',
    'smart',
    'gramin',
    'borka',
    'smart',
    'murubbi',
    'city_style',
    'feriwala',
  ];
  const arch = forcedArchetype ?? weightedOrder[Math.abs(seed) % weightedOrder.length];

  let rig: PedestrianRig;
  switch (arch) {
    case 'borka':
      rig = createBorkaWomanModel(seed, textures);
      break;
    case 'gramin':
      rig = createGraminNpc(seed, textures);
      break;
    case 'smart':
      rig = createSmartNpc(seed, textures);
      break;
    case 'city_style':
      rig = createCityStyleNpc(seed, textures);
      break;
    case 'murubbi':
      rig = createMurubbiNpc(seed, textures);
      break;
    case 'feriwala':
      rig = createFeriwalaNpc(seed, textures);
      break;
  }

  if (arch !== 'borka') {
    rig.root.scale.setScalar(0.78);
  }
  return rig;
}
