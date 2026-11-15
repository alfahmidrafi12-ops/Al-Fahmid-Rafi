import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import { createContactShadowMesh } from './models';

let cachedCarPlate: THREE.CanvasTexture | null = null;
let cachedTaxiSign: THREE.CanvasTexture | null = null;

function getCarTextures(): {
  plate: THREE.CanvasTexture;
  taxiSign: THREE.CanvasTexture;
} {
  if (!cachedCarPlate) {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 256;
    pCanvas.height = 76;
    const pCtx = pCanvas.getContext('2d')!;
    pCtx.fillStyle = '#f8fafc';
    pCtx.fillRect(0, 0, 256, 76);
    pCtx.strokeStyle = '#0f172a';
    pCtx.lineWidth = 5;
    pCtx.strokeRect(4, 4, 248, 68);
    pCtx.fillStyle = '#0f172a';
    pCtx.font = 'bold 23px "Hind Siliguri", sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText('ঢাকা মেট্রো-গ', 128, 32);
    pCtx.font = 'bold 26px sans-serif';
    pCtx.fillText('৩৫-৭১৪৮', 128, 62);
    cachedCarPlate = new THREE.CanvasTexture(pCanvas);
    cachedCarPlate.colorSpace = THREE.SRGBColorSpace;
  }

  if (!cachedTaxiSign) {
    const tCanvas = document.createElement('canvas');
    tCanvas.width = 160;
    tCanvas.height = 56;
    const tCtx = tCanvas.getContext('2d')!;
    tCtx.fillStyle = '#facc15';
    tCtx.fillRect(0, 0, 160, 56);
    tCtx.fillStyle = '#0f172a';
    tCtx.fillRect(0, 44, 160, 12);
    tCtx.font = '900 22px sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('DHAKA CAB', 80, 32);
    cachedTaxiSign = new THREE.CanvasTexture(tCanvas);
    cachedTaxiSign.colorSpace = THREE.SRGBColorSpace;
  }

  return { plate: cachedCarPlate, taxiSign: cachedTaxiSign };
}

/**
 * Authentic Bangladeshi Dhaka Private Car / Sedan & Yellow Taxi Cab
 * Models Toyota Allion / Corolla Axio / Premio silhouettes seen across Dhaka avenues.
 * Engine convention: forward motion along local -Z, wheel contact at y = 0.
 */
export function createDhakaCarModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const car = new THREE.Group();
  const { plate, taxiSign } = getCarTextures();

  car.add(createContactShadowMesh(textures.contactShadow, 2.55, 5.15));

  const v = ((variant % 5) + 5) % 5;
  // 0: Pearl White Allion, 1: Silver Metallic Axio, 2: Black VIP Premio, 3: Yellow Dhaka Cab, 4: Crimson Sedan
  const bodyColors = [0xf1f5f9, 0xcbd5e1, 0x18181b, 0xfacc15, 0x991b1b];
  const paintColor = bodyColors[v];
  const isTaxi = v === 3;

  const paintMat = new THREE.MeshPhysicalMaterial({
    color: paintColor,
    roughness: 0.24,
    metalness: 0.36,
    clearcoat: 0.65,
    clearcoatRoughness: 0.18,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
    metalness: 0.78,
  });
  const bumperMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.65,
    metalness: 0.15,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.16,
    metalness: 0.9,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.88,
    metalness: 0.05,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.22,
    metalness: 0.85,
  });
  const headGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  const tailGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const blinkerMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

  // 1. Lower Body Hull & Tapered Front Hood (-Z is Front)
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.56, 4.34), paintMat);
  lowerBody.position.set(0, 0.56, 0);
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  car.add(lowerBody);

  // Subtle hood slope on front nose (-Z)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.14, 1.38), paintMat);
  hood.position.set(0, 0.84, -1.36);
  hood.rotation.x = 0.07;
  hood.castShadow = true;
  car.add(hood);

  // Side Doors Body Line Molding
  [-0.97, 0.97].forEach((sx) => {
    const molding = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 2.7), chromeMat);
    molding.position.set(sx, 0.55, 0.05);
    car.add(molding);
  });

  // 2. Sculpted Greenhouse Cabin (Extruded side sedan profile oriented cleanly along Z)
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-1.12, 0.0);
  cabinShape.lineTo(-0.52, 0.52);
  cabinShape.lineTo(0.72, 0.52);
  cabinShape.lineTo(1.24, 0.0);
  cabinShape.closePath();

  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 1.56,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  cabinGeo.center();
  const cabinRoof = new THREE.Mesh(cabinGeo, paintMat);
  cabinRoof.rotation.y = -Math.PI / 2;
  cabinRoof.position.set(0, 1.09, 0.22);
  cabinRoof.castShadow = true;
  car.add(cabinRoof);

  // Tinted Front Windshield, Rear Window & Side Windows
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.04, 0.76), glassMat);
  frontGlass.position.set(0, 1.1, -0.66);
  frontGlass.rotation.x = -0.72;
  car.add(frontGlass);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.04, 0.72), glassMat);
  rearGlass.position.set(0, 1.1, 1.14);
  rearGlass.rotation.x = 0.74;
  car.add(rearGlass);

  [-0.84, 0.84].forEach((gx) => {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 1.48), glassMat);
    sideWin.position.set(gx, 1.11, 0.22);
    car.add(sideWin);

    // Side wing mirrors
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.12), paintMat);
    mirror.position.set(gx * 1.18, 0.94, -0.64);
    car.add(mirror);
  });

  // 3. Front Grille, Lower Air Dam, Dual Headlights & Dhaka White Registration Plate
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.22, 0.06), bumperMat);
  grille.position.set(0, 0.62, -2.18);
  car.add(grille);

  const chromeBar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.08), chromeMat);
  chromeBar.position.set(0, 0.65, -2.19);
  car.add(chromeBar);

  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.2, 0.14), bumperMat);
  frontBumper.position.set(0, 0.32, -2.18);
  car.add(frontBumper);

  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.94, 0.22, 0.14), bumperMat);
  rearBumper.position.set(0, 0.33, 2.18);
  car.add(rearBumper);

  [-0.72, 0.72].forEach((lx) => {
    // Front Headlights + Corner Turn Signals (-Z)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.06), headGlowMat);
    head.position.set(lx, 0.66, -2.18);
    car.add(head);

    const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, 0.06), blinkerMat);
    indicator.position.set(lx + Math.sign(lx) * 0.18, 0.66, -2.16);
    car.add(indicator);

    // Wraparound Rear Brake Taillights (+Z)
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.16, 0.06), tailGlowMat);
    tail.position.set(lx, 0.72, 2.18);
    car.add(tail);
  });

  // Dhaka Metro-Ga White Private Car Number Plates (Front & Rear)
  const plateMat = new THREE.MeshBasicMaterial({ map: plate });
  const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.14), plateMat);
  frontPlate.position.set(0, 0.35, -2.26);
  frontPlate.rotation.y = Math.PI;
  car.add(frontPlate);

  const rearPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.14), plateMat);
  rearPlate.position.set(0, 0.48, 2.26);
  car.add(rearPlate);

  // 4. Optional Taxi Roof Topper vs Shark-Fin Roof Antenna
  if (isTaxi) {
    const cabLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.22, 0.24),
      new THREE.MeshBasicMaterial({ map: taxiSign })
    );
    cabLight.position.set(0, 1.54, -0.05);
    car.add(cabLight);
  } else {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 0.18), paintMat);
    fin.position.set(0, 1.47, 0.72);
    car.add(fin);
  }

  // 5. Four Wheels with Alloy Rims seated cleanly at y = 0.33 (tire radius 0.33 -> ground y = 0)
  const wheelGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.22, 16);
  const hubGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.24, 10);

  [-0.91, 0.91].forEach((wx) => {
    [-1.34, 1.34].forEach((wz) => {
      const tire = new THREE.Mesh(wheelGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(wx, 0.33, wz);
      tire.castShadow = true;
      car.add(tire);

      const hub = new THREE.Mesh(hubGeo, rimMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(wx, 0.33, wz);
      car.add(hub);
    });
  });

  return car;
}
