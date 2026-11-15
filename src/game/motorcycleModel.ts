import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import { createContactShadowMesh } from './models';

let cachedMotoPlate: THREE.CanvasTexture | null = null;
let cachedDeliveryLogo: THREE.CanvasTexture | null = null;

function getMotoTextures(): {
  plate: THREE.CanvasTexture;
  delivery: THREE.CanvasTexture;
} {
  if (!cachedMotoPlate) {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 128;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d')!;
    pCtx.fillStyle = '#f8fafc';
    pCtx.fillRect(0, 0, 128, 64);
    pCtx.strokeStyle = '#0f172a';
    pCtx.lineWidth = 4;
    pCtx.strokeRect(3, 3, 122, 58);
    pCtx.fillStyle = '#0f172a';
    pCtx.font = 'bold 17px "Hind Siliguri", sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillText('ঢাকা মেট্রো-ল', 64, 26);
    pCtx.font = 'bold 20px sans-serif';
    pCtx.fillText('১৪-৮২৯১', 64, 52);
    cachedMotoPlate = new THREE.CanvasTexture(pCanvas);
    cachedMotoPlate.colorSpace = THREE.SRGBColorSpace;
  }

  if (!cachedDeliveryLogo) {
    const dCanvas = document.createElement('canvas');
    dCanvas.width = 128;
    dCanvas.height = 96;
    const dCtx = dCanvas.getContext('2d')!;
    dCtx.fillStyle = '#db2777';
    dCtx.fillRect(0, 0, 128, 96);
    dCtx.fillStyle = '#fdf2f8';
    dCtx.fillRect(0, 10, 128, 12);
    dCtx.fillStyle = '#ffffff';
    dCtx.font = 'bold 18px sans-serif';
    dCtx.textAlign = 'center';
    dCtx.fillText('FOOD', 64, 52);
    dCtx.font = 'bold 16px "Hind Siliguri", sans-serif';
    dCtx.fillText('ডেলিভারি', 64, 78);
    cachedDeliveryLogo = new THREE.CanvasTexture(dCanvas);
    cachedDeliveryLogo.colorSpace = THREE.SRGBColorSpace;
  }

  return { plate: cachedMotoPlate, delivery: cachedDeliveryLogo };
}

/**
 * Authentic Bangladeshi Dhaka City Motorcycle + Helmeted Rider
 * Covers commuter bikes, Pathao Moto riders, Foodpanda delivery riders, and naked sports bikes.
 * Engine convention: forward motion along local -Z, wheel contact at y = 0.
 */
export function createDhakaMotorcycleModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const bike = new THREE.Group();
  const { plate, delivery } = getMotoTextures();

  bike.add(createContactShadowMesh(textures.contactShadow, 1.15, 2.45));

  const v = ((variant % 4) + 4) % 4;
  // 0: Red Commuter + Pathao Green Helmet, 1: Blue Bike + Delivery Box, 2: Black/Gold Sport, 3: Pearl Teal Commuter
  const tankColors = [0xdc2626, 0x1d4ed8, 0x18181b, 0x0f766e];
  const helmetColors = [0x16a34a, 0xdb2777, 0xfacc15, 0xf8fafc];
  const jacketColors = [0x1e293b, 0xbe185d, 0x09090b, 0x334155];

  const paintMat = new THREE.MeshStandardMaterial({
    color: tankColors[v],
    roughness: 0.24,
    metalness: 0.48,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.58,
    metalness: 0.45,
  });
  const alloyMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.22,
    metalness: 0.85,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.86,
    metalness: 0.06,
  });
  const seatMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.78,
    metalness: 0.05,
  });
  const helmetMat = new THREE.MeshStandardMaterial({
    color: helmetColors[v],
    roughness: 0.2,
    metalness: 0.35,
  });
  const jacketMat = new THREE.MeshStandardMaterial({
    color: jacketColors[v],
    roughness: 0.72,
    metalness: 0.08,
  });
  const trouserMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.82,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    roughness: 0.08,
    metalness: 0.9,
  });
  const headGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef9c3 });
  const tailGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // 1. Twin Road Wheels (radius = 0.31, seated flush at y = 0.31 -> contact y = 0)
  const tireGeo = new THREE.TorusGeometry(0.26, 0.055, 8, 16);
  const rimGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.07, 10);
  const discGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.085, 10);

  [-0.68, 0.68].forEach((wz) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(0, 0.315, wz);

    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.y = Math.PI / 2;
    tire.castShadow = true;
    wGroup.add(tire);

    const rim = new THREE.Mesh(rimGeo, alloyMat);
    rim.rotation.z = Math.PI / 2;
    wGroup.add(rim);

    const disc = new THREE.Mesh(discGeo, frameMat);
    disc.rotation.z = Math.PI / 2;
    wGroup.add(disc);

    bike.add(wGroup);
  });

  // 2. Engine Crankcase, Chassis Cradle & Swingarm
  const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.4), alloyMat);
  engineBlock.position.set(0, 0.42, 0.02);
  engineBlock.castShadow = true;
  bike.add(engineBlock);

  const swingarm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.68), frameMat);
  swingarm.position.set(0, 0.35, 0.38);
  bike.add(swingarm);

  // Chrome Silencer Exhaust Pipe along right flank (+X)
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.068, 0.88, 10), alloyMat);
  exhaust.rotation.x = Math.PI / 2 - 0.12;
  exhaust.position.set(0.18, 0.36, 0.42);
  bike.add(exhaust);

  // 3. Sculpted Fuel Tank + Radiator Shrouds + Pillion Seat
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.56), paintMat);
  tank.position.set(0, 0.8, -0.18);
  tank.rotation.x = -0.14;
  tank.castShadow = true;
  bike.add(tank);

  const tankCap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 10), alloyMat);
  tankCap.position.set(0, 0.93, -0.2);
  bike.add(tankCap);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.12, 0.68), seatMat);
  seat.position.set(0, 0.76, 0.35);
  seat.rotation.x = 0.08;
  seat.castShadow = true;
  bike.add(seat);

  // Rear Mudguard + Tail Section + BD Moto Plate ("ঢাকা মেট্রো-ল")
  const rearTail = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.46), paintMat);
  rearTail.position.set(0, 0.82, 0.68);
  rearTail.rotation.x = 0.24;
  bike.add(rearTail);

  const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.05), tailGlowMat);
  tailLight.position.set(0, 0.86, 0.9);
  bike.add(tailLight);

  const fenderRear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.03), frameMat);
  fenderRear.position.set(0, 0.68, 0.86);
  fenderRear.rotation.x = -0.35;
  bike.add(fenderRear);

  const plateMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.22, 0.11),
    new THREE.MeshBasicMaterial({ map: plate })
  );
  plateMesh.position.set(0, 0.66, 0.91);
  plateMesh.rotation.x = -0.35;
  bike.add(plateMesh);

  // 4. Raked Front Forks, Mudguard, Handlebar, Mirrors & Bright Headlight (-Z)
  [-0.1, 0.1].forEach((fx) => {
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.72, 8), alloyMat);
    fork.position.set(fx, 0.64, -0.54);
    fork.rotation.x = -0.34;
    bike.add(fork);
  });

  const frontFender = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.34), paintMat);
  frontFender.position.set(0, 0.64, -0.68);
  frontFender.rotation.x = -0.2;
  bike.add(frontFender);

  const cowl = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.24, 0.22), paintMat);
  cowl.position.set(0, 0.94, -0.52);
  cowl.rotation.x = -0.25;
  bike.add(cowl);

  const headlight = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.05, 12), headGlowMat);
  headlight.rotation.x = Math.PI / 2;
  headlight.position.set(0, 0.94, -0.63);
  bike.add(headlight);

  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.68, 8), frameMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.05, -0.38);
  bike.add(handlebar);

  [-0.31, 0.31].forEach((mx) => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.03), frameMat);
    mirror.position.set(mx, 1.18, -0.4);
    bike.add(mirror);
  });

  // 5. Seated Dhaka Rider with Helmet & Visor (+ Delivery Insulated Backpack on variant 1 & Pathao vibe)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.48, 0.24), jacketMat);
  torso.position.set(0, 1.12, 0.14);
  torso.rotation.x = 0.36;
  torso.castShadow = true;
  bike.add(torso);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), helmetMat);
  helmet.position.set(0, 1.46, 0.01);
  helmet.castShadow = true;
  bike.add(helmet);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.14), visorMat);
  visor.position.set(0, 1.45, -0.09);
  bike.add(visor);

  // Rider Arms reaching forward to handlebars + Legs gripping fuel tank
  [-0.21, 0.21].forEach((side) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.46, 6), jacketMat);
    arm.position.set(side * 1.15, 1.1, -0.14);
    arm.rotation.x = 1.12;
    arm.rotation.z = side > 0 ? 0.18 : -0.18;
    bike.add(arm);

    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.52, 6), trouserMat);
    leg.position.set(side * 0.92, 0.64, 0.02);
    leg.rotation.x = 0.25;
    bike.add(leg);
  });

  if (v === 1) {
    // Foodpanda / Rider Delivery Insulated Bag on rear pillion rack
    const boxMat = new THREE.MeshStandardMaterial({ map: delivery, roughness: 0.48 });
    const delivBox = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), boxMat);
    delivBox.position.set(0, 1.06, 0.52);
    delivBox.castShadow = true;
    bike.add(delivBox);
  } else if (v === 0 || v === 3) {
    // Commuter backpack
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.36, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.78 })
    );
    pack.position.set(0, 1.16, 0.31);
    pack.rotation.x = 0.34;
    bike.add(pack);
  }

  return bike;
}
