import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import { createContactShadowMesh } from './models';
import { CNG_SCULPTED_PARTS } from './cngSculptedData';

interface CngDecalPack {
  livery: THREE.CanvasTexture;
  meter: THREE.CanvasTexture;
  plate: THREE.CanvasTexture;
  visor: THREE.CanvasTexture;
}

let cachedDecals: CngDecalPack | null = null;
let cachedSculptedGeos: THREE.BufferGeometry[] | null = null;

function createCngDecalsTexture(): CngDecalPack {
  // 1. Side livery decal
  const lCanvas = document.createElement('canvas');
  lCanvas.width = 512;
  lCanvas.height = 128;
  const lCtx = lCanvas.getContext('2d')!;
  lCtx.fillStyle = '#084c35';
  lCtx.fillRect(0, 0, 512, 128);
  lCtx.fillStyle = '#eab308';
  lCtx.fillRect(0, 54, 512, 16);
  lCtx.fillStyle = '#f8fafc';
  lCtx.font = 'bold 25px "Hind Siliguri", sans-serif';
  lCtx.textAlign = 'center';
  lCtx.fillText('★ গতিসীমা ৪০ কিঃমিঃ ★ সিএনজি অটোরিকশা ★', 256, 42);
  lCtx.fillStyle = '#fef08a';
  lCtx.font = 'bold 20px "Hind Siliguri", sans-serif';
  lCtx.fillText('ভাড়ায় চালিত • মিটারে চলুন • জরুরি সেবা ৯৯৯', 256, 102);

  const livery = new THREE.CanvasTexture(lCanvas);
  livery.colorSpace = THREE.SRGBColorSpace;

  // 2. Digital fare meter display
  const mCanvas = document.createElement('canvas');
  mCanvas.width = 128;
  mCanvas.height = 64;
  const mCtx = mCanvas.getContext('2d')!;
  mCtx.fillStyle = '#09090b';
  mCtx.fillRect(0, 0, 128, 64);
  mCtx.strokeStyle = '#334155';
  mCtx.lineWidth = 4;
  mCtx.strokeRect(2, 2, 124, 60);
  mCtx.fillStyle = '#22c55e';
  mCtx.font = 'bold 10px monospace';
  mCtx.fillText('DIGITAL METER', 12, 18);
  mCtx.fillStyle = '#ef4444';
  mCtx.font = 'bold 24px monospace';
  mCtx.fillText('৳ 85.40', 14, 48);
  const meter = new THREE.CanvasTexture(mCanvas);
  meter.colorSpace = THREE.SRGBColorSpace;

  // 3. Green Dhaka Metro registration plate
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 256;
  pCanvas.height = 84;
  const pCtx = pCanvas.getContext('2d')!;
  pCtx.fillStyle = '#14532d';
  pCtx.fillRect(0, 0, 256, 84);
  pCtx.strokeStyle = '#f8fafc';
  pCtx.lineWidth = 4;
  pCtx.strokeRect(5, 5, 246, 74);
  pCtx.fillStyle = '#f8fafc';
  pCtx.font = 'bold 24px "Hind Siliguri", sans-serif';
  pCtx.textAlign = 'center';
  pCtx.fillText('ঢাকা মেট্রো-থ', 128, 35);
  pCtx.font = 'bold 28px sans-serif';
  pCtx.fillText('১১-৪২০২', 128, 69);
  const plate = new THREE.CanvasTexture(pCanvas);
  plate.colorSpace = THREE.SRGBColorSpace;

  // 4. Front windshield visor strip ("আল্লাহ সর্বশক্তিমান")
  const vCanvas = document.createElement('canvas');
  vCanvas.width = 256;
  vCanvas.height = 48;
  const vCtx = vCanvas.getContext('2d')!;
  vCtx.fillStyle = '#064e3b';
  vCtx.fillRect(0, 0, 256, 48);
  vCtx.fillStyle = '#facc15';
  vCtx.fillRect(0, 42, 256, 6);
  vCtx.fillStyle = '#fef9c3';
  vCtx.font = 'bold 21px "Hind Siliguri", sans-serif';
  vCtx.textAlign = 'center';
  vCtx.fillText('★ আল্লাহ সর্বশক্তিমান ★', 128, 30);
  const visor = new THREE.CanvasTexture(vCanvas);
  visor.colorSpace = THREE.SRGBColorSpace;

  return { livery, meter, plate, visor };
}

function getSculptedGeometries(): THREE.BufferGeometry[] {
  if (cachedSculptedGeos) return cachedSculptedGeos;
  cachedSculptedGeos = CNG_SCULPTED_PARTS.map((part) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(part.v), 3));
    geo.setIndex(part.f);
    if (part.c && part.c.length > 0) {
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(part.c), 3));
    }
    geo.computeVertexNormals();
    return geo;
  });
  return cachedSculptedGeos;
}

/**
 * High-fidelity Bangladeshi 4-Stroke Bajaj RE CNG Auto-Rickshaw
 * Built from sculpted lower tub/cowl/dual-headlamp mesh + full upper cabin, cage, canopy, driver & meter.
 * Engine convention: forward motion along local -Z, wheel contact at y = 0.
 */
export function createCngModel(textures: ProceduralTexturePack): THREE.Group {
  if (!cachedDecals) {
    cachedDecals = createCngDecalsTexture();
  }
  const decals = cachedDecals;
  const sculptedGeos = getSculptedGeometries();

  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 2.15, 3.45));

  // Inner assembly uses native sculpted orientation (+Z = front) then rotates PI on Y so front aligns to -Z
  const body = new THREE.Group();
  body.rotation.y = Math.PI;
  body.scale.setScalar(1.14);
  root.add(body);

  // Calibrated PBR Materials
  const cngPaintVertexMat = new THREE.MeshStandardMaterial({
    color: 0x6ba88b, // Modulates baked linear green curvature vertex colors into rich Dhaka CNG green
    vertexColors: true,
    roughness: 0.34,
    metalness: 0.24,
  });
  const cngPaintSolidMat = new THREE.MeshStandardMaterial({
    color: 0x0b6b45,
    roughness: 0.34,
    metalness: 0.24,
  });
  const cngDarkGreenMat = new THREE.MeshStandardMaterial({
    color: 0x06482f,
    roughness: 0.44,
    metalness: 0.2,
  });
  const trimBlackMat = new THREE.MeshStandardMaterial({
    color: 0x16191e,
    roughness: 0.72,
    metalness: 0.08,
  });
  const vinylCanopyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c20,
    roughness: 0.84,
    metalness: 0.04,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xeaf0f6,
    roughness: 0.16,
    metalness: 0.88,
  });
  const ironCageMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.46,
    metalness: 0.72,
  });
  const headlampGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfffbe0,
    emissive: 0xfef08a,
    emissiveIntensity: 0.95,
    roughness: 0.12,
  });
  const amberMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.7,
    roughness: 0.25,
  });
  const redTailMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.72,
    roughness: 0.28,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.1,
    metalness: 0.65,
    transparent: true,
    opacity: 0.44,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.9 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xb0bac6, roughness: 0.28, metalness: 0.78 });

  // 1. Add all 20 sculpted chassis / tub / cowl / dual headlight / indicator meshes
  CNG_SCULPTED_PARTS.forEach((part, idx) => {
    let mat: THREE.Material = cngPaintSolidMat;
    if (part.m === 'paint') {
      mat = part.c && part.c.length > 0 ? cngPaintVertexMat : cngPaintSolidMat;
    } else if (part.m === 'black') {
      mat = trimBlackMat;
    } else if (part.m === 'chrome') {
      mat = chromeMat;
    } else if (part.m === 'lamp') {
      mat = headlampGlowMat;
    } else if (part.m === 'amber') {
      mat = amberMat;
    }

    const mesh = new THREE.Mesh(sculptedGeos[idx], mat);
    if (part.n === 'tub' || part.n === 'cowl') {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    body.add(mesh);
  });

  // 2. Front Mudguard / Fender (+Z forward) over front wheel
  const frontFender = new THREE.Mesh(
    new THREE.CylinderGeometry(0.285, 0.29, 0.18, 12, 1, false, -Math.PI * 0.42, Math.PI * 0.85),
    cngDarkGreenMat
  );
  frontFender.rotation.z = Math.PI / 2;
  frontFender.position.set(0, 0.26, 0.96);
  frontFender.castShadow = true;
  body.add(frontFender);

  // Front chrome shock fork
  [-0.08, 0.08].forEach((fx) => {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 8), chromeMat);
    fork.position.set(fx, 0.42, 0.96);
    fork.rotation.x = -0.18;
    body.add(fork);
  });

  // 3. Windshield Frame, Glass, Visor & Wiper (+Z side, rising from cowl top y=1.18, z=0.66)
  const windshieldGroup = new THREE.Group();
  windshieldGroup.position.set(0, 1.4, 0.62);
  windshieldGroup.rotation.x = -0.24; // Tilted slightly backward toward cabin
  body.add(windshieldGroup);

  const wsGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.56), glassMat);
  windshieldGroup.add(wsGlass);

  // Chrome A-pillars + top/bottom surround
  [-0.49, 0.49].forEach((px) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.6, 8), trimBlackMat);
    pillar.position.set(px, 0, 0);
    windshieldGroup.add(pillar);
  });
  const wsTopBar = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.04, 0.04), trimBlackMat);
  wsTopBar.position.set(0, 0.29, 0);
  windshieldGroup.add(wsTopBar);

  // Front Bengali Visor Banner
  const visorPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.12, 0.025),
    new THREE.MeshStandardMaterial({ map: decals.visor, roughness: 0.4 })
  );
  visorPlate.position.set(0, 0.24, 0.015);
  windshieldGroup.add(visorPlate);

  // Windshield wiper
  const wiperArm = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.34, 0.015), chromeMat);
  wiperArm.position.set(0.06, -0.05, 0.015);
  wiperArm.rotation.z = 0.45;
  windshieldGroup.add(wiperArm);

  // Side mirrors on windshield A-pillars
  [-0.53, 0.53].forEach((mx) => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), chromeMat);
    stem.rotation.z = mx < 0 ? 0.8 : -0.8;
    stem.position.set(mx, 1.35, 0.68);
    body.add(stem);

    const mirHousing = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.024), trimBlackMat);
    mirHousing.position.set(mx * 1.12, 1.4, 0.71);
    body.add(mirHousing);
  });

  // 4. Arched Black Canvas Canopy Roof + Structural B/C Pillars
  // Spans z = -1.45 (rear tub back) to z = 0.56 (windshield top), centered at y = 1.66
  const roofCurve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.61, 0.61, 2.02, 16, 1, false, 0, Math.PI),
    vinylCanopyMat
  );
  roofCurve.rotation.x = Math.PI / 2;
  roofCurve.rotation.z = -Math.PI / 2;
  roofCurve.scale.set(0.55, 1.0, 1.0); // Nice arched crown height ~0.33m above 1.56 eaves
  roofCurve.position.set(0, 1.56, -0.44);
  roofCurve.castShadow = true;
  body.add(roofCurve);

  // Canopy lower eave trim bar on left/right sides
  [-0.59, 0.59].forEach((sideX) => {
    const eave = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 2.04), trimBlackMat);
    eave.position.set(sideX, 1.55, -0.44);
    body.add(eave);

    // B-pillar (between driver & passenger) and C-pillar (rear corner)
    [0.02, -0.58, -1.42].forEach((pz) => {
      const pHeight = pz === 0.02 ? 1.14 : pz === -0.58 ? 1.12 : 0.68;
      const pY = pz === -1.42 ? 1.24 : 1.0;
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, pHeight, 6), trimBlackMat);
      pillar.position.set(sideX, pY, pz);
      body.add(pillar);
    });
  });

  // 5. Rear Canvas Backrest Panel + Rear Window + Green Plate + Mudflaps (-Z is rear)
  const rearUpperPanel = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.64, 0.04), vinylCanopyMat);
  rearUpperPanel.position.set(0, 1.24, -1.44);
  body.add(rearUpperPanel);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.34, 0.05), glassMat);
  rearGlass.position.set(0, 1.3, -1.445);
  body.add(rearGlass);

  for (let rx = -0.32; rx <= 0.32; rx += 0.16) {
    const rBar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 6), ironCageMat);
    rBar.position.set(rx, 1.3, -1.47);
    body.add(rBar);
  }

  // Rear Green License Plate ("ঢাকা মেট্রো-থ ১১-৪২০২")
  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.15, 0.02),
    new THREE.MeshStandardMaterial({ map: decals.plate, roughness: 0.32 })
  );
  rearPlate.rotation.y = Math.PI;
  rearPlate.position.set(0, 0.64, -1.48);
  body.add(rearPlate);

  // Rear Taillights
  [-0.45, 0.45].forEach((tx) => {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.04), trimBlackMat);
    housing.position.set(tx, 0.72, -1.475);
    body.add(housing);

    const redStop = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.025), redTailMat);
    redStop.position.set(tx - Math.sign(tx) * 0.032, 0.72, -1.49);
    body.add(redStop);

    const ambSig = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, 0.025), amberMat);
    ambSig.position.set(tx + Math.sign(tx) * 0.038, 0.72, -1.49);
    body.add(ambSig);
  });

  // Heavy Rear Tubular Bumper
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.09, 0.08), ironCageMat);
  rearBumper.position.set(0, 0.4, -1.49);
  body.add(rearBumper);

  // Rear Mudflaps ("মায়ের দোয়া")
  [-0.48, 0.48].forEach((fx) => {
    const flap = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.24, 0.02),
      new THREE.MeshStandardMaterial({ map: textures.cngMudflap, roughness: 0.9 })
    );
    flap.rotation.y = Math.PI;
    flap.rotation.x = 0.16;
    flap.position.set(fx, 0.21, -1.36);
    body.add(flap);
  });

  // Exhaust muffler & tailpipe
  const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.36, 8), ironCageMat);
  muffler.rotation.x = Math.PI / 2;
  muffler.position.set(-0.34, 0.26, -1.16);
  body.add(muffler);
  const tailpipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.18, 8), chromeMat);
  tailpipe.rotation.x = Math.PI / 2;
  tailpipe.position.set(-0.34, 0.26, -1.38);
  body.add(tailpipe);

  // 6. Passenger Iron Safety Cage ("লোহার খাঁচা"), Half Doors & Side Livery Decals
  [-0.585, 0.585].forEach((sx) => {
    // Horizontal safety cage rails (rear passenger bay z = -0.58..0.02 & rear side z = -1.42..-0.58)
    [0.98, 1.24, 1.46].forEach((ry) => {
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.38, 6), ironCageMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(sx, ry, -0.71);
      body.add(rail);
    });
    for (let bz = -1.32; bz <= -0.14; bz += 0.23) {
      const vBar = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.62, 6), ironCageMat);
      vBar.position.set(sx, 1.24, bz);
      body.add(vBar);
    }

    // Green passenger half-door with chrome latch
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.44, 0.56), cngDarkGreenMat);
    door.position.set(sx, 0.74, -0.28);
    body.add(door);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), chromeMat);
    handle.position.set(sx * 1.04, 0.82, -0.45);
    body.add(handle);

    // Side livery banner along tub flank
    const sideBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(0.92, 0.22),
      new THREE.MeshStandardMaterial({ map: decals.livery, roughness: 0.42 })
    );
    sideBanner.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    sideBanner.position.set(sx * 1.045, 0.66, -0.96);
    body.add(sideBanner);
  });

  // 7. Interior Cockpit, Digital Meter, Seats & Driver Figure
  // Handlebar & grips inside cowl (+Z is forward)
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.54, 8), chromeMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 1.04, 0.58);
  body.add(handleBar);

  [-0.27, 0.27].forEach((gx) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.11, 8), trimBlackMat);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(gx, 1.04, 0.58);
    body.add(grip);
  });

  // Digital meter facing driver
  const meterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.1, 0.06),
    new THREE.MeshStandardMaterial({ map: decals.meter, roughness: 0.3 })
  );
  meterMesh.position.set(-0.28, 1.08, 0.64);
  meterMesh.rotation.y = Math.PI - 0.2;
  body.add(meterMesh);

  // Driver seat & rear passenger bench
  const drvSeat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.38), trimBlackMat);
  drvSeat.position.set(0, 0.7, 0.22);
  body.add(drvSeat);

  const passBench = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.18, 0.44), trimBlackMat);
  passBench.position.set(0, 0.72, -1.04);
  body.add(passBench);

  const passBack = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.42, 0.1), trimBlackMat);
  passBack.position.set(0, 0.98, -1.32);
  body.add(passBack);

  // Driver Figure in shirt, lungi & red gamcha
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x8d5b4c, roughness: 0.68 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.62 });
  const lungiMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.75 });
  const gamchaMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.64 });

  const driverGroup = new THREE.Group();
  driverGroup.position.set(0, 0.78, 0.22);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.24), shirtMat);
  torso.position.set(0, 0.22, 0);
  torso.rotation.x = 0.15;
  driverGroup.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 10), skinMat);
  head.position.set(0, 0.52, 0.05);
  driverGroup.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.22), trimBlackMat);
  hair.position.set(0, 0.61, 0.04);
  driverGroup.add(hair);

  const gamcha = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.11, 0.16), gamchaMat);
  gamcha.position.set(0.03, 0.41, 0.02);
  driverGroup.add(gamcha);

  [-0.16, 0.16].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.34, 8), shirtMat);
    arm.position.set(ax, 0.26, 0.18);
    arm.rotation.x = Math.PI / 3.4;
    driverGroup.add(arm);
  });

  const lungi = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.38), lungiMat);
  lungi.position.set(0, -0.06, 0.1);
  driverGroup.add(lungi);
  body.add(driverGroup);

  // 8. 3 Grounded Wheels (Radius = 0.255 -> center at y = 0.255 so bottom rests flush on y = 0)
  const buildWheel = (wx: number, wz: number) => {
    const wg = new THREE.Group();
    wg.position.set(wx, 0.255, wz);

    const tireGeo = new THREE.CylinderGeometry(0.255, 0.255, 0.15, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wg.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.16, 12);
    rimGeo.rotateZ(Math.PI / 2);
    wg.add(new THREE.Mesh(rimGeo, rimMat));

    const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.175, 8), chromeMat);
    hubCap.rotation.z = Math.PI / 2;
    wg.add(hubCap);

    return wg;
  };

  body.add(buildWheel(0, 0.96)); // Single front wheel
  body.add(buildWheel(-0.56, -0.96)); // Rear left
  body.add(buildWheel(0.56, -0.96)); // Rear right

  return root;
}
