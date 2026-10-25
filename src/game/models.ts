import * as THREE from 'three';
import { DriverProfile } from '../types/game';
import { ProceduralTexturePack } from './textures';

export interface RickshawRig {
  root: THREE.Group;
  chassisTilt: THREE.Group;
  steeringColumn: THREE.Group;
  frontWheel: THREE.Group;
  rearWheelL: THREE.Group;
  rearWheelR: THREE.Group;
  pedalCrank: THREE.Group;
  bellMesh: THREE.Mesh;
  headlightSpot: THREE.SpotLight;
  headlightBulb: THREE.Mesh;
  turboFlameL: THREE.Mesh;
  turboFlameR: THREE.Mesh;
  driverSlot: THREE.Group;
}

export interface DriverRig {
  root: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  headGroup: THREE.Group;
}

export interface MobRig {
  root: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armR: THREE.Group;
  armL: THREE.Mesh;
  phase: number;
  speedFactor: number;
}

export interface PedestrianRig {
  root: THREE.Group;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  walkingSpeed: number;
  direction: number;
  phase: number;
}

function createSpokedWheel(radius: number, tireTube: number): THREE.Group {
  const wheel = new THREE.Group();

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.88,
    metalness: 0.08,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.22,
    metalness: 0.88,
  });

  const tire = new THREE.Mesh(new THREE.TorusGeometry(radius, tireTube, 12, 28), tireMat);
  tire.rotation.y = Math.PI / 2;
  tire.castShadow = true;
  wheel.add(tire);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(radius - tireTube * 0.75, tireTube * 0.42, 8, 24),
    rimMat
  );
  rim.rotation.y = Math.PI / 2;
  wheel.add(rim);

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12), rimMat);
  hub.rotation.z = Math.PI / 2;
  wheel.add(hub);

  // Crossed steel spokes
  const spokeGeo = new THREE.CylinderGeometry(0.008, 0.008, radius * 1.92, 6);
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(spokeGeo, rimMat);
    spoke.rotation.x = (i * Math.PI) / 6;
    wheel.add(spoke);
  }

  return wheel;
}

export function createContactShadowMesh(
  tex: THREE.CanvasTexture,
  width: number,
  depth: number
): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.65,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.025;
  return mesh;
}

/**
 * Builds an authentic Bangladeshi cycle rickshaw with 16+ parts facing -Z.
 */
export function createRickshawModel(textures: ProceduralTexturePack): RickshawRig {
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 2.3, 3.3));

  const chassisTilt = new THREE.Group();
  root.add(chassisTilt);

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.18,
    metalness: 0.92,
  });
  const framePaintMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.35,
    metalness: 0.45,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.28,
    metalness: 0.78,
  });
  const seatCushionMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.65,
    metalness: 0.05,
  });
  const hoodFolkMat = new THREE.MeshStandardMaterial({
    map: textures.rickshawArt,
    roughness: 0.52,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const rearPlateMat = new THREE.MeshStandardMaterial({
    map: textures.rickshawRearArt,
    roughness: 0.4,
    metalness: 0.25,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.1,
  });

  // 1. Rear Axle & Wheels (z = +0.82)
  const wheelRadius = 0.44;
  const rearAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.72, 12), chromeMat);
  rearAxle.rotation.z = Math.PI / 2;
  rearAxle.position.set(0, wheelRadius, 0.82);
  root.add(rearAxle);

  const rearWheelL = createSpokedWheel(wheelRadius, 0.055);
  rearWheelL.position.set(-0.88, wheelRadius, 0.82);
  root.add(rearWheelL);

  const rearWheelR = createSpokedWheel(wheelRadius, 0.055);
  rearWheelR.position.set(0.88, wheelRadius, 0.82);
  root.add(rearWheelR);

  // Rear wheel fenders
  const fenderGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.16, 18, 1, true, -Math.PI * 0.48, Math.PI * 0.96);
  [-0.88, 0.88].forEach((xPos) => {
    const fender = new THREE.Mesh(fenderGeo, goldTrimMat);
    fender.rotation.z = Math.PI / 2;
    fender.position.set(xPos, wheelRadius + 0.02, 0.82);
    chassisTilt.add(fender);
  });

  // 2. Wooden Footboard & Passenger Cushion
  const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.1, 1.35), framePaintMat);
  footboard.position.set(0, 0.52, 0.48);
  footboard.castShadow = true;
  footboard.receiveShadow = true;
  chassisTilt.add(footboard);

  [-0.72, 0.72].forEach((xPos) => {
    const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 1.12), hoodFolkMat);
    sidePanel.position.set(xPos, 0.78, 0.68);
    sidePanel.castShadow = true;
    chassisTilt.add(sidePanel);
  });

  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.22, 0.68), seatCushionMat);
  seatBase.position.set(0, 0.72, 0.82);
  seatBase.castShadow = true;
  chassisTilt.add(seatBase);

  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.54, 0.14), seatCushionMat);
  seatBack.position.set(0, 1.06, 1.12);
  seatBack.rotation.x = 0.12;
  seatBack.castShadow = true;
  chassisTilt.add(seatBack);

  const rearBoard = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.46, 0.04), rearPlateMat);
  rearBoard.position.set(0, 0.78, 1.21);
  chassisTilt.add(rearBoard);

  // 3. Arched Rickshaw Hood
  const hoodArch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.76, 0.76, 1.46, 20, 1, false, 0, Math.PI),
    hoodFolkMat
  );
  hoodArch.rotation.z = Math.PI / 2;
  hoodArch.position.set(0, 1.46, 0.76);
  hoodArch.castShadow = true;
  chassisTilt.add(hoodArch);

  const frontRib = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.025, 8, 24, Math.PI),
    goldTrimMat
  );
  frontRib.position.set(0, 1.46, 0.15);
  chassisTilt.add(frontRib);

  // Hanging decorative tassels
  [-0.52, 0, 0.52].forEach((xPos) => {
    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.16, 8), goldTrimMat);
    tassel.position.set(xPos, 1.98 - Math.abs(xPos) * 0.35, 0.15);
    tassel.rotation.x = Math.PI;
    chassisTilt.add(tassel);
  });

  // 4. Frame Spine & Saddle
  const spineTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 1.85, 10), framePaintMat);
  spineTube.rotation.x = Math.PI / 2 - 0.18;
  spineTube.position.set(0, 0.64, -0.35);
  spineTube.castShadow = true;
  chassisTilt.add(spineTube);

  const seatPost = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.48, 10), chromeMat);
  seatPost.position.set(0, 0.88, -0.36);
  seatPost.rotation.x = -0.15;
  chassisTilt.add(seatPost);

  const driverSaddle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.32), tireMat);
  driverSaddle.position.set(0, 1.11, -0.33);
  chassisTilt.add(driverSaddle);

  // Pedal Crank
  const pedalCrank = new THREE.Group();
  pedalCrank.position.set(0, 0.48, -0.58);
  const chainring = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 16), goldTrimMat);
  chainring.rotation.z = Math.PI / 2;
  pedalCrank.add(chainring);
  [-0.16, 0.16].forEach((xPos, idx) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.03), chromeMat);
    arm.position.set(xPos, idx === 0 ? 0.1 : -0.1, 0);
    pedalCrank.add(arm);
  });
  chassisTilt.add(pedalCrank);

  // 5. Steerable Front Fork & Headlamp
  const steeringColumn = new THREE.Group();
  steeringColumn.position.set(0, 0, -1.22);
  chassisTilt.add(steeringColumn);

  const headTube = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.86, 10), chromeMat);
  headTube.position.set(0, 0.96, 0.06);
  headTube.rotation.x = 0.2;
  steeringColumn.add(headTube);

  [-0.09, 0.09].forEach((xPos) => {
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.56, 8), framePaintMat);
    blade.position.set(xPos, 0.62, 0.02);
    steeringColumn.add(blade);
  });

  const frontFender = new THREE.Mesh(fenderGeo, goldTrimMat);
  frontFender.rotation.z = Math.PI / 2;
  frontFender.position.set(0, wheelRadius + 0.02, 0);
  steeringColumn.add(frontFender);

  const frontWheel = createSpokedWheel(wheelRadius, 0.055);
  frontWheel.position.set(0, wheelRadius, 0);
  steeringColumn.add(frontWheel);

  // Handlebars
  const handleCrossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.78, 10), chromeMat);
  handleCrossbar.rotation.z = Math.PI / 2;
  handleCrossbar.position.set(0, 1.34, 0.14);
  steeringColumn.add(handleCrossbar);

  [-0.38, 0.38].forEach((xPos) => {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 10), seatCushionMat);
    grip.rotation.x = Math.PI / 2;
    grip.position.set(xPos, 1.34, 0.22);
    steeringColumn.add(grip);
  });

  // Brass Bell
  const bellMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.65),
    goldTrimMat
  );
  bellMesh.position.set(0.24, 1.38, 0.14);
  steeringColumn.add(bellMesh);

  // Headlamp + Forward SpotLight
  const lampHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.14, 14), chromeMat);
  lampHousing.rotation.x = Math.PI / 2;
  lampHousing.position.set(0, 1.15, -0.04);
  steeringColumn.add(lampHousing);

  const headlightBulb = new THREE.Mesh(
    new THREE.CircleGeometry(0.075, 14),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  headlightBulb.rotation.y = Math.PI;
  headlightBulb.position.set(0, 1.15, -0.115);
  steeringColumn.add(headlightBulb);

  const headlightSpot = new THREE.SpotLight(0xfef3c7, 3.2, 34, Math.PI / 4.5, 0.5, 1.3);
  headlightSpot.position.set(0, 1.15, -0.12);
  headlightSpot.target.position.set(0, 0.2, -14);
  steeringColumn.add(headlightSpot);
  steeringColumn.add(headlightSpot.target);

  // Nitro Flames
  const flameGeo = new THREE.ConeGeometry(0.12, 0.65, 10);
  flameGeo.rotateX(Math.PI / 2);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.9,
  });
  const turboFlameL = new THREE.Mesh(flameGeo, flameMat);
  turboFlameL.position.set(-0.46, 0.52, 1.45);
  turboFlameL.visible = false;
  chassisTilt.add(turboFlameL);

  const turboFlameR = new THREE.Mesh(flameGeo, flameMat);
  turboFlameR.position.set(0.46, 0.52, 1.45);
  turboFlameR.visible = false;
  chassisTilt.add(turboFlameR);

  const driverSlot = new THREE.Group();
  chassisTilt.add(driverSlot);

  return {
    root,
    chassisTilt,
    steeringColumn,
    frontWheel,
    rearWheelL,
    rearWheelR,
    pedalCrank,
    bellMesh,
    headlightSpot,
    headlightBulb,
    turboFlameL,
    turboFlameR,
    driverSlot,
  };
}

/**
 * Creates Driver Character (Obaidul Quader or Ishraque)
 */
export function createDriverModel(
  profile: DriverProfile,
  textures: ProceduralTexturePack
): DriverRig {
  const root = new THREE.Group();
  root.position.set(0, 1.12, -0.34);

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd99b78,
    roughness: 0.68,
    metalness: 0.02,
  });
  const panjabiMat = new THREE.MeshStandardMaterial({
    color: profile.panjabiColor,
    roughness: 0.55,
    metalness: 0.05,
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: profile.vestColor,
    roughness: 0.62,
    metalness: 0.08,
  });
  const pajamaMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.65,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.8,
    metalness: 0.05,
  });

  const torso = new THREE.Group();
  torso.rotation.x = -0.22;
  root.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 0.28), panjabiMat);
  chest.position.set(0, 0.32, 0);
  chest.castShadow = true;
  torso.add(chest);

  if (profile.hasSunglasses) {
    const coat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.56, 0.3), vestMat);
    coat.position.set(0, 0.31, 0.005);
    torso.add(coat);
  } else {
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.29), vestMat);
    placket.position.set(0, 0.44, -0.01);
    torso.add(placket);
  }

  // Arms gripping handlebars
  [-0.27, 0.27].forEach((xPos) => {
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.058, 0.52, 10), panjabiMat);
    sleeve.position.set(xPos, 0.45, -0.26);
    sleeve.rotation.x = Math.PI / 2 - 0.22;
    sleeve.rotation.z = xPos > 0 ? 0.12 : -0.12;
    sleeve.castShadow = true;
    torso.add(sleeve);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), skinMat);
    hand.position.set(xPos * 1.18, 0.38, -0.52);
    torso.add(hand);
  });

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.76, -0.02);
  headGroup.rotation.x = 0.22;
  torso.add(headGroup);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.175, 16, 16), skinMat);
  skull.castShadow = true;
  headGroup.add(skull);

  if (profile.id === 'kader' && textures.kaderFace) {
    // Exact realistic photo face of Obaidul Quader mapped onto the 3D model
    const faceMat = new THREE.MeshStandardMaterial({
      map: textures.kaderFace,
      roughness: 0.5,
      metalness: 0.05,
    });
    const facePlate = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.35), faceMat);
    facePlate.position.set(0, 0.015, -0.172);
    facePlate.rotation.y = Math.PI;
    headGroup.add(facePlate);

    // Hair cap styled to his black trimmed hairstyle
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.182, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    hairCap.rotation.x = -0.22;
    hairCap.position.y = 0.04;
    headGroup.add(hairCap);

    // His iconic black-rimmed spectacles
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.15, metalness: 0.85 });
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.075, 0.035), frameMat);
    glasses.position.set(0, 0.045, -0.185);
    headGroup.add(glasses);
  } else {
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.182, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    hairCap.rotation.x = -0.22;
    hairCap.position.y = 0.02;
    headGroup.add(hairCap);

    if (profile.hasSunglasses) {
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        roughness: 0.12,
        metalness: 0.85,
      });
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.075, 0.06), glassMat);
      visor.position.set(0, 0.02, -0.155);
      headGroup.add(visor);
    }
  }

  if (profile.hasBeard) {
    const beard = new THREE.Mesh(
      new THREE.SphereGeometry(0.168, 14, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.45),
      hairMat
    );
    beard.position.set(0, -0.025, -0.025);
    headGroup.add(beard);
  }

  const buildLeg = (xPos: number) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(xPos, 0.02, -0.04);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.068, 0.54, 10), pajamaMat);
    thigh.position.set(0, -0.26, -0.12);
    thigh.rotation.x = 0.42;
    thigh.castShadow = true;
    legGroup.add(thigh);

    const sandal = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.2), vestMat);
    sandal.position.set(0, -0.5, -0.26);
    legGroup.add(sandal);
    return legGroup;
  };

  const legL = buildLeg(-0.15);
  const legR = buildLeg(0.15);
  root.add(legL);
  root.add(legR);

  return { root, legL, legR, headGroup };
}

/**
 * SHOBJIR DOKAN (Authentic Purana Dhaka Fresh Vegetable Shop)
 * Tiered crates piled with eggplants, gourds, carrots, tomatoes & potatoes!
 */
export function createShobjiStallModel(textures: ProceduralTexturePack): THREE.Group {
  const stall = new THREE.Group();
  stall.add(createContactShadowMesh(textures.contactShadow, 3.2, 2.5));

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.85,
    metalness: 0.05,
  });
  const bambooMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.72,
    metalness: 0.05,
  });
  const tinMat = new THREE.MeshStandardMaterial({
    map: textures.corrugatedTin,
    roughness: 0.45,
    metalness: 0.65,
  });

  // Vegetable materials
  const eggplantMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.35 });
  const carrotMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.45 });
  const tomatoMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3 });
  const gourdMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
  const potatoMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.7 });

  // Main multi-tier wooden display counter
  const baseTable = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.75, 1.5), woodMat);
  baseTable.position.set(0, 0.38, 0);
  baseTable.castShadow = true;
  baseTable.receiveShadow = true;
  stall.add(baseTable);

  const upperTier = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.65), woodMat);
  upperTier.position.set(0, 0.88, -0.35);
  stall.add(upperTier);

  // Bamboo poles
  [[-1.2, -0.65], [1.2, -0.65], [-1.2, 0.65], [1.2, 0.65]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 2.2, 8), bambooMat);
    post.position.set(px, 1.1, pz);
    post.castShadow = true;
    stall.add(post);
  });

  // Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.7, 4), tinMat);
  roof.position.set(0, 2.45, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  stall.add(roof);

  // Dangling tungsten bulb over vegetables
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.45, 6),
    new THREE.MeshBasicMaterial({ color: 0x09090b })
  );
  cord.position.set(0, 2.05, 0);
  stall.add(cord);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  bulb.position.set(0, 1.82, 0);
  stall.add(bulb);

  // Signboard: "তাজা সবজির আড়ৎ"
  const signTex = textures.shopSigns[0];
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.5, 0.06),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 })
  );
  signMesh.position.set(0, 1.95, 0.7);
  stall.add(signMesh);

  // Piles of fresh Bangladeshi vegetables!
  // 1. Eggplants (বেগুন)
  for (let i = -3; i <= 3; i++) {
    const egg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.32, 8), eggplantMat);
    egg.rotation.z = 0.4 * i;
    egg.position.set(-0.75 + i * 0.08, 0.88, 0.3);
    stall.add(egg);
  }

  // 2. Carrots (গাজর)
  for (let i = -3; i <= 3; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 8), carrotMat);
    c.rotation.x = Math.PI / 2;
    c.position.set(-0.15 + i * 0.07, 0.88, 0.3);
    stall.add(c);
  }

  // 3. Red Tomatoes (টমেটো)
  for (let i = 0; i < 9; i++) {
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), tomatoMat);
    t.position.set(0.45 + (i % 3) * 0.16, 0.88, 0.2 + Math.floor(i / 3) * 0.16);
    stall.add(t);
  }

  // 4. Gourds (লাউ) on upper tier
  for (let i = -1; i <= 1; i++) {
    const g = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.38, 4, 8), gourdMat);
    g.rotation.z = Math.PI / 2;
    g.position.set(i * 0.55, 1.15, -0.35);
    stall.add(g);
  }

  return stall;
}

/**
 * Standard roadside Tea / Fruit / Fuchka / Pan stall
 */
export function createStallModel(
  variant: number,
  textures: ProceduralTexturePack
): THREE.Group {
  const stall = new THREE.Group();
  stall.add(createContactShadowMesh(textures.contactShadow, 2.8, 2.2));

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.72 });
  const tinMat = new THREE.MeshStandardMaterial({
    map: textures.corrugatedTin,
    roughness: 0.45,
    metalness: 0.65,
  });

  const tarpColors = [0xdc2626, 0x2563eb, 0x059669, 0xd97706];
  const tarpMat = new THREE.MeshStandardMaterial({
    color: tarpColors[variant % tarpColors.length],
    roughness: 0.6,
  });

  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.85, 1.35), woodMat);
  counter.position.set(0, 0.45, 0);
  counter.castShadow = true;
  counter.receiveShadow = true;
  stall.add(counter);

  [[-1.05, -0.58], [1.05, -0.58], [-1.05, 0.58], [1.05, 0.58]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 2.15, 8), bambooMat);
    post.position.set(px, 1.08, pz);
    post.castShadow = true;
    stall.add(post);
  });

  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.78, 0.68, 4), variant % 2 === 0 ? tinMat : tarpMat);
  roof.position.set(0, 2.38, 0);
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  stall.add(roof);

  const signTex = textures.shopSigns[(variant + 1) % textures.shopSigns.length];
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.46, 0.06),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.45 })
  );
  signMesh.position.set(0, 1.88, 0.62);
  stall.add(signMesh);

  // Wares
  if (variant % 2 === 0) {
    // Tea Kettle & Jars
    const kettle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.38, 12),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.88 })
    );
    kettle.position.set(-0.55, 1.06, 0.1);
    stall.add(kettle);
  } else {
    // Fuchka / Biryani Handi
    const handi = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.65 })
    );
    handi.position.set(0, 1.12, 0);
    stall.add(handi);
  }

  return stall;
}

/**
 * DHAKA TRAFFIC: Realistic Authentic Green Dhaka CNG Auto-Rickshaw (Bajaj RE 4-Stroke)
 * Features: Metallic Emerald paint, Wire-Mesh Safety Grille Cages ("সিএনজির খাঁচা"),
 * Dhaka Metro License Plate ("ঢাকা মেট্রো-থ ১১-৪২০২"), Windshield Banner ("আল্লাহ সর্বশক্তিমান"),
 * Digital Fare Meter ("ডিজিটাল মিটার"), side mirrors, wiper, and passenger cabin.
 */
export function createCngModel(textures: ProceduralTexturePack): THREE.Group {
  const cng = new THREE.Group();
  cng.add(createContactShadowMesh(textures.contactShadow, 2.2, 3.2));

  // Materials
  const cngGreenMat = new THREE.MeshStandardMaterial({
    color: 0x047857,
    roughness: 0.32,
    metalness: 0.42,
  });
  const cngDarkGreenMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b,
    roughness: 0.45,
    metalness: 0.25,
  });
  const yellowStripeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.35,
    metalness: 0.15,
  });
  const blackVinylMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.78,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.18,
    metalness: 0.88,
  });
  const amberLightMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });
  const redTailMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.65,
    roughness: 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.1,
    metalness: 0.85,
    transparent: true,
    opacity: 0.48,
  });
  const wireMeshMat = new THREE.MeshStandardMaterial({
    map: textures.cngWireMesh,
    roughness: 0.42,
    metalness: 0.55,
  });

  // 1. Lower Body / Cabin Tub (wide rear, tapered front)
  const lowerTub = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.68, 2.35), cngGreenMat);
  lowerTub.position.set(0, 0.58, 0.15);
  lowerTub.castShadow = true;
  lowerTub.receiveShadow = true;
  cng.add(lowerTub);

  // Yellow pinstripe along side skirts
  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.36), yellowStripeMat);
  stripeL.position.set(-0.795, 0.46, 0.15);
  cng.add(stripeL);
  const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 2.36), yellowStripeMat);
  stripeR.position.set(0.795, 0.46, 0.15);
  cng.add(stripeR);

  // 2. Front Tapered Nose & Cowl (signature Bajaj RE front)
  const noseHood = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.74, 0.95, 12), cngGreenMat);
  noseHood.rotation.x = Math.PI / 2;
  noseHood.position.set(0, 0.54, -1.22);
  noseHood.castShadow = true;
  cng.add(noseHood);

  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.43, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), cngGreenMat);
  noseTip.rotation.x = -Math.PI / 2;
  noseTip.position.set(0, 0.54, -1.68);
  cng.add(noseTip);

  // Front chrome crash bumper bar
  const crashBar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 8), chromeMat);
  crashBar.rotation.z = Math.PI / 2;
  crashBar.position.set(0, 0.32, -1.62);
  cng.add(crashBar);

  // 3. Cabin Upper Roof Arch (textured dark green / black canvas top)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.58, 2.15), cngDarkGreenMat);
  roof.position.set(0, 1.34, 0.15);
  roof.castShadow = true;
  cng.add(roof);

  const roofCap = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 2.15, 12, 1, false, 0, Math.PI), cngDarkGreenMat);
  roofCap.rotation.x = Math.PI / 2;
  roofCap.rotation.z = -Math.PI / 2;
  roofCap.position.set(0, 1.62, 0.15);
  cng.add(roofCap);

  // 4. THE SIGNATURE WIRE-MESH SAFETY GRILLES ("সিএনজির খাঁচা")
  // Both sides have authentic wire mesh screens to protect passengers
  [-0.785, 0.785].forEach((sideX) => {
    const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.58, 1.45), wireMeshMat);
    grilleMesh.position.set(sideX, 1.15, 0.32);
    cng.add(grilleMesh);

    // Green frame border bars
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.48), cngGreenMat);
    frameTop.position.set(sideX, 1.45, 0.32);
    cng.add(frameTop);
    const frameBottom = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 1.48), cngGreenMat);
    frameBottom.position.set(sideX, 0.86, 0.32);
    cng.add(frameBottom);
  });

  // Rear Window with wire-mesh & round green CNG logo
  const rearMesh = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.44, 0.02), wireMeshMat);
  rearMesh.position.set(0, 1.25, 1.22);
  cng.add(rearMesh);

  // 5. Front Windshield Glass & Bengali Banner ("আল্লাহ সর্বশক্তিমান")
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.62, 0.03), glassMat);
  windshield.position.set(0, 1.18, -0.68);
  windshield.rotation.x = 0.18;
  cng.add(windshield);

  const visorBanner = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.16, 0.04),
    new THREE.MeshStandardMaterial({ map: textures.cngFrontBanner, roughness: 0.35 })
  );
  visorBanner.position.set(0, 1.42, -0.64);
  visorBanner.rotation.x = 0.18;
  cng.add(visorBanner);

  // Windshield Wiper
  const wiperArm = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.38, 0.02), blackVinylMat);
  wiperArm.rotation.z = -0.42;
  wiperArm.position.set(0.08, 1.16, -0.71);
  cng.add(wiperArm);

  // 6. Cockpit & Fare Meter ("ডিজিটাল মিটার" with 85.50 red readout)
  const meterMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.14, 0.06),
    new THREE.MeshStandardMaterial({
      map: textures.cngMeter,
      emissive: 0xffffff,
      emissiveMap: textures.cngMeter,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    })
  );
  meterMesh.position.set(-0.35, 0.98, -0.62);
  meterMesh.rotation.x = 0.22;
  cng.add(meterMesh);

  // Handlebars
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.62, 8), chromeMat);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 0.88, -0.58);
  cng.add(handlebar);

  // Side Rearview Mirrors
  [-0.72, 0.72].forEach((mx) => {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.28, 6), chromeMat);
    stalk.position.set(mx, 1.14, -0.72);
    stalk.rotation.z = mx > 0 ? 0.38 : -0.38;
    cng.add(stalk);

    const mirrorHead = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.025, 10), chromeMat);
    mirrorHead.rotation.x = Math.PI / 2;
    mirrorHead.position.set(mx * 1.14, 1.25, -0.74);
    cng.add(mirrorHead);
  });

  // Driver vinyl seat & passenger bench
  const driverSeat = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.42), blackVinylMat);
  driverSeat.position.set(0, 0.64, -0.22);
  cng.add(driverSeat);

  const passengerBench = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.2, 0.55), blackVinylMat);
  passengerBench.position.set(0, 0.62, 0.72);
  cng.add(passengerBench);

  // 7. Headlight & Turn Signals
  const headlampBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 14), chromeMat);
  headlampBezel.rotation.x = Math.PI / 2;
  headlampBezel.position.set(0, 0.64, -1.82);
  cng.add(headlampBezel);

  const headlampGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.14, 12),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  headlampGlow.rotation.y = Math.PI;
  headlampGlow.position.set(0, 0.64, -1.86);
  cng.add(headlampGlow);

  // Front Amber Indicators
  [-0.45, 0.45].forEach((ix) => {
    const turnLight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), amberLightMat);
    turnLight.position.set(ix, 0.58, -1.65);
    cng.add(turnLight);
  });

  // 8. Rear Bangladesh Number Plate ("ঢাকা মেট্রো-থ ১১-৪২০২") & Taillights
  const numberPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.28, 0.03),
    new THREE.MeshStandardMaterial({ map: textures.cngPlate, roughness: 0.4 })
  );
  numberPlate.position.set(0, 0.52, 1.34);
  cng.add(numberPlate);

  // Rear Taillights
  [-0.62, 0.62].forEach((tx) => {
    const tailLamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.04), redTailMat);
    tailLamp.position.set(tx, 0.64, 1.33);
    cng.add(tailLamp);

    const blinker = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.04), amberLightMat);
    blinker.position.set(tx + (tx > 0 ? -0.12 : 0.12), 0.64, 1.33);
    cng.add(blinker);
  });

  // Rear Black Rubber Bumper
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.12, 0.12), blackVinylMat);
  rearBumper.position.set(0, 0.35, 1.35);
  cng.add(rearBumper);

  // 9. Wheels & Suspension (1 Front, 2 Rear)
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.88 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.75 });

  const buildWheel = (wx: number, wy: number, wz: number, isFront = false) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wx, wy, wz);

    const tireGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.18, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.19, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);

    if (isFront) {
      // Front fork suspension
      const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.48, 8), chromeMat);
      fork.position.set(-0.13, 0.22, 0);
      wheelGroup.add(fork);
    }
    return wheelGroup;
  };

  cng.add(buildWheel(0, 0.3, -1.24, true));
  cng.add(buildWheel(-0.76, 0.3, 0.78, false));
  cng.add(buildWheel(0.76, 0.3, 0.78, false));

  return cng;
}

/**
 * DHAKA TRAFFIC: Colorful Weathered Dhaka Local Bus ("Murir Tin")
 */
export function createDhakaBusModel(textures: ProceduralTexturePack): THREE.Group {
  const bus = new THREE.Group();
  bus.add(createContactShadowMesh(textures.contactShadow, 2.8, 6.8));

  const busBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 });
  const busRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.45 });
  const busWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.7 });
  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.15,
    metalness: 0.75,
    transparent: true,
    opacity: 0.6,
  });

  // Main chassis box
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.85, 6.4), busBlueMat);
  body.position.set(0, 1.45, 0);
  body.castShadow = true;
  bus.add(body);

  // Lower red stripe
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.55, 6.42), busRedMat);
  stripe.position.set(0, 0.8, 0);
  bus.add(stripe);

  // Front grill & bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.35, 0.3), bumperMat);
  bumper.position.set(0, 0.55, -3.25);
  bus.add(bumper);

  // Side Livery banner
  [-1.2, 1.2].forEach((xPos) => {
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 0.65),
      new THREE.MeshStandardMaterial({ map: textures.busBanner, roughness: 0.4 })
    );
    banner.rotation.y = xPos < 0 ? -Math.PI / 2 : Math.PI / 2;
    banner.position.set(xPos, 1.6, 0.2);
    bus.add(banner);
  });

  // Front windshield
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.75), windowGlassMat);
  windshield.rotation.y = Math.PI;
  windshield.position.set(0, 1.8, -3.22);
  bus.add(windshield);

  // Rooftop luggage carrier
  const rack = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 0.25, 4.8),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.8 })
  );
  rack.position.set(0, 2.5, 0.3);
  bus.add(rack);

  // Glowing Front Headlights
  [-0.85, 0.85].forEach((xPos) => {
    const lamp = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 12),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    lamp.rotation.y = Math.PI;
    lamp.position.set(xPos, 0.78, -3.22);
    bus.add(lamp);
  });

  // Wheels (4 large bus wheels)
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const wheelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.28, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  [
    [-1.08, 0.48, -2.1],
    [1.08, 0.48, -2.1],
    [-1.08, 0.48, 1.9],
    [1.08, 0.48, 1.9],
  ].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(wx, wy, wz);
    bus.add(w);
  });

  return bus;
}

/**
 * ONEK MANUS: Pedestrian walking on sidewalks or browsing markets
 */
export function createPedestrianModel(seed: number, textures: ProceduralTexturePack): PedestrianRig {
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.85, 0.85));

  const lungiTex = textures.lungis[seed % textures.lungis.length];
  const shirtColors = [0xf8fafc, 0xfef08a, 0x38bdf8, 0xfb7185, 0xa7f3d0, 0xf97316];
  const skinColors = [0xc68642, 0xd99b78, 0x8d5524];

  const lungiMat = new THREE.MeshStandardMaterial({ map: lungiTex, roughness: 0.75 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColors[seed % shirtColors.length], roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skinColors[seed % skinColors.length], roughness: 0.7 });

  const lungi = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.68, 10), lungiMat);
  lungi.position.set(0, 0.54, 0);
  lungi.castShadow = true;
  root.add(lungi);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.24), shirtMat);
  torso.position.set(0, 1.08, 0);
  torso.castShadow = true;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), skinMat);
  head.position.set(0, 1.48, 0);
  head.castShadow = true;
  root.add(head);

  const legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.42, 8);
  const legL = new THREE.Mesh(legGeo, skinMat);
  legL.position.set(-0.1, 0.21, 0);
  root.add(legL);

  const legR = new THREE.Mesh(legGeo, skinMat);
  legR.position.set(0.1, 0.21, 0);
  root.add(legR);

  const armGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.45, 8);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.25, 1.06, 0);
  root.add(armL);

  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(0.25, 1.06, 0);
  root.add(armR);

  return {
    root,
    legL,
    legR,
    armL,
    armR,
    walkingSpeed: 1.2 + (seed % 4) * 0.25,
    direction: seed % 2 === 0 ? 1 : -1,
    phase: (seed * 1.7) % (Math.PI * 2),
  };
}

/**
 * ONEK MANUS: Angry Crowd Chasers waving bamboo lathis
 */
export function createMobModel(seed: number, textures: ProceduralTexturePack): MobRig {
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.95, 0.95));

  const lungiTex = textures.lungis[seed % textures.lungis.length];
  const shirtColors = [0xf8fafc, 0xfef08a, 0x38bdf8, 0xfb7185, 0xa7f3d0];

  const lungiMat = new THREE.MeshStandardMaterial({ map: lungiTex, roughness: 0.75 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColors[seed % shirtColors.length], roughness: 0.65 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.7 });
  const stickMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
  const headbandMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6 });

  const lungi = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.29, 0.72, 12), lungiMat);
  lungi.position.set(0, 0.56, 0);
  lungi.castShadow = true;
  root.add(lungi);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.54, 0.26), shirtMat);
  torso.position.set(0, 1.14, 0);
  torso.castShadow = true;
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), skinMat);
  head.position.set(0, 1.56, 0);
  head.castShadow = true;
  root.add(head);

  const gamcha = new THREE.Mesh(new THREE.CylinderGeometry(0.166, 0.166, 0.06, 12), headbandMat);
  gamcha.position.set(0, 1.61, 0);
  root.add(gamcha);

  const legGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.45, 8);
  const legL = new THREE.Mesh(legGeo, skinMat);
  legL.position.set(-0.11, 0.23, 0);
  root.add(legL);

  const legR = new THREE.Mesh(legGeo, skinMat);
  legR.position.set(0.11, 0.23, 0);
  root.add(legR);

  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.48, 8), skinMat);
  armL.position.set(-0.28, 1.14, 0);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.28, 1.32, 0);
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.48, 8), skinMat);
  rightForearm.position.set(0, 0.18, 0.08);
  rightForearm.rotation.x = -0.5;
  armR.add(rightForearm);

  const lathi = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.03, 1.15, 8), stickMat);
  lathi.position.set(0, 0.56, 0.22);
  lathi.rotation.x = -0.35;
  lathi.castShadow = true;
  armR.add(lathi);
  root.add(armR);

  return {
    root,
    legL,
    legR,
    armR,
    armL,
    phase: (seed * 1.37) % (Math.PI * 2),
    speedFactor: 0.92 + (seed % 5) * 0.05,
  };
}

/**
 * Pickups: Biryani or Chai
 */
export function createPickupModel(kind: 'biryani' | 'chai'): THREE.Group {
  const group = new THREE.Group();

  const ringMat = new THREE.MeshBasicMaterial({
    color: kind === 'biryani' ? 0x10b981 : 0xf59e0b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
  });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.72, 24), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  if (kind === 'biryani') {
    const pot = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.75,
      })
    );
    pot.scale.set(1, 0.78, 1);
    pot.position.y = 0.58;
    group.add(pot);

    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.3, 0.1, 14),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.85 })
    );
    lid.position.y = 0.88;
    group.add(lid);
  } else {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.2, 0.56, 16),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.55,
        roughness: 0.2,
        metalness: 0.5,
      })
    );
    cup.position.y = 0.62;
    group.add(cup);

    const foam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.08, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7 })
    );
    foam.position.y = 0.91;
    group.add(foam);
  }

  return group;
}

/**
 * Roadside Block with warm sodium streetlamp
 */
export function createRoadsideBlock(
  side: -1 | 1,
  index: number,
  textures: ProceduralTexturePack
): { group: THREE.Group; lampBulb: THREE.Mesh } {
  const group = new THREE.Group();

  const height = 9.5 + (index % 3) * 3.2;
  const width = 6.2;
  const depth = 11.5;

  const facadeTex = textures.buildingWindows[index % textures.buildingWindows.length];
  const wallMat = new THREE.MeshStandardMaterial({
    map: facadeTex,
    roughness: 0.82,
    metalness: 0.05,
  });
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.88,
    metalness: 0.08,
  });

  const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
  building.position.set(side * 15.2, height / 2, 0);
  building.castShadow = true;
  building.receiveShadow = true;
  group.add(building);

  const parapet = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.6, depth + 0.3), concreteMat);
  parapet.position.set(side * 15.2, height + 0.3, 0);
  group.add(parapet);

  const waterTank = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.75, 1.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
  );
  waterTank.position.set(side * 14.5, height + 1.2, (index % 2 === 0 ? 1 : -1) * 2.5);
  group.add(waterTank);

  const signTex = textures.shopSigns[index % textures.shopSigns.length];
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 1.25, 5.4),
    new THREE.MeshStandardMaterial({
      map: signTex,
      emissive: 0xffffff,
      emissiveMap: signTex,
      emissiveIntensity: 0.28,
      roughness: 0.4,
    })
  );
  signBoard.position.set(side * 11.95, 3.3, 0);
  group.add(signBoard);

  // 1. Street-Facing Wall Bangladeshi Posters (Tufan cinema, UCC/Udvash coaching, election shubheccha, herbal, 4g)
  const posterWallX = side * 12.06;
  const numPosters = textures.bangladeshiPosters.length;

  const posterPlacements = [
    { z: -3.8, texIdx: (index * 2) % numPosters, yOff: 1.65, rotX: -0.015 },
    { z: -1.7, texIdx: (index * 2 + 1) % numPosters, yOff: 1.85, rotX: 0.02 },
    { z: 1.5, texIdx: (index * 2 + 2) % numPosters, yOff: 1.7, rotX: -0.01 },
    { z: 3.6, texIdx: (index * 2 + 3) % numPosters, yOff: 1.9, rotX: 0.025 },
  ];

  posterPlacements.forEach((p) => {
    const posterTex = textures.bangladeshiPosters[p.texIdx];
    const posterMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 1.65, 1.25),
      new THREE.MeshStandardMaterial({
        map: posterTex,
        roughness: 0.65,
        metalness: 0.05,
      })
    );
    posterMesh.position.set(posterWallX, p.yOff, p.z);
    posterMesh.rotation.x = p.rotX;
    posterMesh.castShadow = true;
    group.add(posterMesh);
  });

  // 2. Roadside Compound Boundary Wall with Torn & Pasted Posters
  const boundaryWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 1.8, 3.4),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
  );
  boundaryWall.position.set(side * 11.45, 0.9, -4.0);
  boundaryWall.castShadow = true;
  boundaryWall.receiveShadow = true;
  group.add(boundaryWall);

  // Plaster coaching and hakim posters on boundary wall
  const boundPosterTex = textures.bangladeshiPosters[(index + 1) % numPosters];
  const boundPoster = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 1.25, 0.95),
    new THREE.MeshStandardMaterial({ map: boundPosterTex, roughness: 0.7 })
  );
  boundPoster.position.set(side * 11.32, 1.05, -4.0);
  group.add(boundPoster);

  // 3. Rooftop Cinema / Commercial Billboard on alternate buildings
  if (index % 2 === 0) {
    const bBoardGeo = new THREE.BoxGeometry(0.12, 2.5, 4.8);
    const bBoardTex = textures.bangladeshiPosters[(index * 3) % numPosters];
    const bBoardMat = new THREE.MeshStandardMaterial({
      map: bBoardTex,
      roughness: 0.35,
      metalness: 0.1,
    });
    const billboard = new THREE.Mesh(bBoardGeo, bBoardMat);
    billboard.position.set(side * 14.2, height + 1.8, 0);
    billboard.castShadow = true;
    group.add(billboard);

    // Steel truss legs
    [-1.8, 1.8].forEach((lx) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      leg.position.set(side * 14.2, height + 0.8, lx);
      group.add(leg);
    });
  }

  const poleX = side * 9.8;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 7.2, 8), concreteMat);
  pole.position.set(poleX, 3.6, 5.5);
  group.add(pole);

  const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), concreteMat);
  lampArm.rotation.z = side * (Math.PI / 3);
  lampArm.position.set(poleX - side * 0.75, 6.7, 5.5);
  group.add(lampArm);

  const lampBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfde68a })
  );
  lampBulb.position.set(poleX - side * 1.45, 6.55, 5.5);
  group.add(lampBulb);

  return { group, lampBulb };
}

/**
 * PURANA DHAKA HISTORIC MOSQUE (Inspired by Tara Masjid & Mughal Lalbagh Fort Mosque)
 * Features: Triple white & emerald domes with gold finials and crescent moons,
 * twin minarets with prayer balconies, and Islamic arabesque star mosaic arcades.
 */
export function createMosqueModel(textures: ProceduralTexturePack): THREE.Group {
  const mosque = new THREE.Group();

  const whiteMarbleMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.35,
    metalness: 0.1,
  });
  const emeraldDomeMat = new THREE.MeshStandardMaterial({
    color: 0x047857,
    roughness: 0.28,
    metalness: 0.35,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.85,
  });
  const mosaicMat = new THREE.MeshStandardMaterial({
    map: textures.mosqueMosaic,
    roughness: 0.4,
    metalness: 0.1,
  });
  const greenGlowMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

  // Main Prayer Hall Base
  const baseHall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 7.5, 11.2), whiteMarbleMat);
  baseHall.position.set(0, 3.75, 0);
  baseHall.castShadow = true;
  baseHall.receiveShadow = true;
  mosque.add(baseHall);

  // Front Facade Mosaic Wall
  const facadeWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 6.8, 10.4), mosaicMat);
  facadeWall.position.set(-3.25, 3.8, 0);
  mosque.add(facadeWall);

  // Triple Domes (Central large dome + 2 flanking domes)
  const mainDomeGroup = new THREE.Group();
  mainDomeGroup.position.set(0, 7.5, 0);

  const domeDrum = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.2, 0.9, 16), whiteMarbleMat);
  domeDrum.position.y = 0.45;
  mainDomeGroup.add(domeDrum);

  const domeSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.15, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
    emeraldDomeMat
  );
  domeSphere.position.y = 0.85;
  domeSphere.castShadow = true;
  mainDomeGroup.add(domeSphere);

  // Golden Crescent Finial on Main Dome
  const finial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 1.4, 8), goldMat);
  finial.position.y = 2.8;
  mainDomeGroup.add(finial);

  const crescent = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 8, 16, Math.PI * 1.5), goldMat);
  crescent.rotation.y = Math.PI / 2;
  crescent.position.y = 3.6;
  mainDomeGroup.add(crescent);
  mosque.add(mainDomeGroup);

  // Flanking Side Domes
  [-3.8, 3.8].forEach((zPos) => {
    const sideDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.35, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
      emeraldDomeMat
    );
    sideDome.position.set(0, 8.1, zPos);
    sideDome.castShadow = true;
    mosque.add(sideDome);

    const sideFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.9, 8), goldMat);
    sideFinial.position.set(0, 9.5, zPos);
    mosque.add(sideFinial);
  });

  // Twin Majestic Minarets ("মিনার")
  [-5.2, 5.2].forEach((zPos) => {
    const minaret = new THREE.Group();
    minaret.position.set(-2.8, 0, zPos);

    // Tower shaft
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 13.5, 12), whiteMarbleMat);
    tower.position.y = 6.75;
    tower.castShadow = true;
    minaret.add(tower);

    // Prayer Balcony gallery
    const balcony = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.9, 0.45, 12), goldMat);
    balcony.position.y = 13.5;
    minaret.add(balcony);

    // Upper turret
    const upperTurret = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.2, 10), whiteMarbleMat);
    upperTurret.position.y = 14.8;
    minaret.add(upperTurret);

    // Minaret green dome cap & crescent
    const minCap = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.4, 10), emeraldDomeMat);
    minCap.position.y = 16.5;
    minaret.add(minCap);

    const minCrescent = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), goldMat);
    minCrescent.position.y = 17.3;
    minaret.add(minCrescent);

    // Night green lantern glow
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), greenGlowMat);
    lantern.position.y = 13.8;
    minaret.add(lantern);

    mosque.add(minaret);
  });

  return mosque;
}

/**
 * OLD PURANA DHAKA HERITAGE BUILDING (Colonial & Mughal Brick Architecture)
 * Features: Terracotta red brick walls, vintage arched wooden shutters,
 * decorative roof balustrades, tangled power meters, and authentic weathering.
 */
export function createHeritageBuildingModel(
  side: -1 | 1,
  index: number,
  textures: ProceduralTexturePack
): THREE.Group {
  const heritage = new THREE.Group();

  const height = 10.5 + (index % 2) * 2.8;
  const width = 6.4;
  const depth = 11.2;

  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    roughness: 0.88,
    metalness: 0.05,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.75,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.4,
    metalness: 0.85,
  });

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), brickMat);
  mainBody.position.set(side * 15.2, height / 2, 0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  heritage.add(mainBody);

  // Ornate roof balustrade cornice
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.7, depth + 0.4), trimMat);
  cornice.position.set(side * 15.2, height + 0.35, 0);
  heritage.add(cornice);

  // Rooftop decorative urns
  [-4.8, 0, 4.8].forEach((zOff) => {
    const urn = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), trimMat);
    urn.position.set(side * (15.2 - width / 2), height + 0.85, zOff);
    heritage.add(urn);
  });

  // Projecting vintage wooden verandas & balconies on street face
  const balcony = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 3.6), ironMat);
  balcony.position.set(side * (15.2 - width / 2 - 0.35), 4.6, 0);
  heritage.add(balcony);

  return heritage;
}

/**
 * DHAKA METRO RAIL (MRT LINE 6) & OVERHEAD FLYOVER VIADUCT
 * Features: High overhead concrete guideway spanning across the road with
 * concrete pillars, safety parapets, track bed, and passing Dhaka Metro Rail Train!
 */
export function createMetroViaductSegment(
  textures: ProceduralTexturePack,
  hasTrain: boolean
): THREE.Group {
  const viaduct = new THREE.Group();

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.85,
    metalness: 0.08,
  });
  const darkTrackMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.9,
  });
  const greenStripeMat = new THREE.MeshStandardMaterial({
    color: 0x047857,
    roughness: 0.4,
  });

  const deckY = 9.4; // High overhead clearance for double-decker buses and rickshaws
  const spanZ = 30.0;

  // Overhead twin concrete box girders spanning across the street
  const boxDeck = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1.4, spanZ), concreteMat);
  boxDeck.position.set(0, deckY, 0);
  boxDeck.castShadow = true;
  viaduct.add(boxDeck);

  // Side crash barrier parapets
  [-4.3, 4.3].forEach((px) => {
    const barrier = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, spanZ), concreteMat);
    barrier.position.set(px, deckY + 1.15, 0);
    viaduct.add(barrier);

    const greenAccent = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, spanZ), greenStripeMat);
    greenAccent.position.set(px, deckY + 1.5, 0);
    viaduct.add(greenAccent);
  });

  // Track bed rails
  [-2.2, 2.2].forEach((tx) => {
    const rails = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, spanZ), darkTrackMat);
    rails.position.set(tx, deckY + 0.75, 0);
    viaduct.add(rails);
  });

  // T-shaped Heavy Concrete Metro Pier Pillars outside road curb (at X = -9.8 or 9.8)
  [-9.6, 9.6].forEach((px) => {
    const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.82, deckY, 12), concreteMat);
    pier.position.set(px, deckY / 2, 0);
    pier.castShadow = true;
    viaduct.add(pier);

    // Crosshead pier cap arm
    const pierCap = new THREE.Mesh(new THREE.BoxGeometry(px > 0 ? -5.5 : 5.5, 1.1, 2.2), concreteMat);
    pierCap.position.set(px * 0.72, deckY - 0.55, 0);
    viaduct.add(pierCap);
  });

  // Dhaka Metro Rail Train running overhead
  if (hasTrain) {
    const trainMat = new THREE.MeshStandardMaterial({
      map: textures.metroLivery,
      roughness: 0.35,
      metalness: 0.45,
    });
    const trainBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 24.0), trainMat);
    trainBody.position.set(2.2, deckY + 2.0, 0);
    trainBody.castShadow = true;
    viaduct.add(trainBody);

    // Glowing front train headlights
    const trainHeadlight = new THREE.Mesh(
      new THREE.CircleGeometry(0.24, 10),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    trainHeadlight.position.set(2.2, deckY + 1.8, -12.05);
    trainHeadlight.rotation.y = Math.PI;
    viaduct.add(trainHeadlight);
  }

  return viaduct;
}

/**
 * DHAKA CITY CORPORATION DUMPSTER & ROADSIDE TRASH ("সিটি কর্পোরেশন ডাস্টবিন ও ময়লার স্তূপ")
 * Features: DSCC Green container dumpster with yellow stencil logo, overflowing garbage cartons,
 * discarded plastic bags, squashed fruit crates, and road litter.
 */
export function createTrashPileModel(textures: ProceduralTexturePack): THREE.Group {
  const trash = new THREE.Group();

  const dumpsterMat = new THREE.MeshStandardMaterial({
    map: textures.trashTexture,
    roughness: 0.55,
    metalness: 0.3,
  });
  const cardboardMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 });
  const plasticColors = [0xef4444, 0x3b82f6, 0x10b981, 0xfacc15, 0x64748b];

  // 1. Heavy Metal Dumpster Container
  const dumpster = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.15, 2.2), dumpsterMat);
  dumpster.position.set(0, 0.58, 0);
  dumpster.castShadow = true;
  dumpster.receiveShadow = true;
  trash.add(dumpster);

  // Wheels on dumpster
  [-0.75, 0.75].forEach((wx) => {
    [-0.9, 0.9].forEach((wz) => {
      const caster = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8),
        new THREE.MeshStandardMaterial({ color: 0x18181b })
      );
      caster.position.set(wx, 0.1, wz);
      trash.add(caster);
    });
  });

  // 2. Overflowing trash cartons & bags
  for (let i = 0; i < 6; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.38), cardboardMat);
    box.position.set((Math.random() - 0.5) * 1.1, 1.25 + i * 0.08, (Math.random() - 0.5) * 1.4);
    box.rotation.set(Math.random() * 0.4, Math.random() * 2, Math.random() * 0.4);
    trash.add(box);
  }

  // 3. Ground trash heap on sidewalk
  for (let i = 0; i < 7; i++) {
    const bagMat = new THREE.MeshStandardMaterial({
      color: plasticColors[i % plasticColors.length],
      roughness: 0.6,
    });
    const bag = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 1), bagMat);
    bag.position.set((Math.random() - 0.5) * 1.6, 0.18, (Math.random() - 0.5) * 1.8 + 1.2);
    bag.scale.set(1.2, 0.7, 1.1);
    bag.castShadow = true;
    trash.add(bag);
  }

  return trash;
}

/**
 * ADDITIONAL TRAFFIC CYCLE RICKSHAW ("রাস্তায় চলাচলকারী ঐতিহ্যবাহী রিকশা")
 * Features: Handcrafted hood folk art, spinning spoke wheels, driver in lungi,
 * brass bell, and authentic Purana Dhaka rear plaque.
 */
export function createTrafficRickshawModel(
  textures: ProceduralTexturePack,
  variant: number
): THREE.Group {
  const rick = new THREE.Group();
  rick.add(createContactShadowMesh(textures.contactShadow, 1.6, 2.5));

  const metalMat = new THREE.MeshStandardMaterial({
    color: [0xdc2626, 0x2563eb, 0x059669, 0xd97706][variant % 4],
    roughness: 0.35,
    metalness: 0.6,
  });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2, metalness: 0.88 });
  const hoodMat = new THREE.MeshStandardMaterial({ map: textures.rickshawArt, roughness: 0.45 });
  const rearPlateMat = new THREE.MeshStandardMaterial({ map: textures.rickshawRearArt, roughness: 0.4 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });

  // Chassis frame
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 1.95), metalMat);
  chassis.position.set(0, 0.45, 0);
  chassis.castShadow = true;
  rick.add(chassis);

  // Decorative Folk Art Hood
  const hood = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 0.95, 12, 1, false, 0, Math.PI),
    hoodMat
  );
  hood.rotation.x = Math.PI / 2;
  hood.rotation.z = -Math.PI / 2;
  hood.position.set(0, 1.35, 0.42);
  hood.castShadow = true;
  rick.add(hood);

  // Rear tin folk plate
  const rearPlate = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.35, 0.02), rearPlateMat);
  rearPlate.position.set(0, 0.55, 0.98);
  rick.add(rearPlate);

  // Front wheel fork
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.65, 8), chromeMat);
  fork.position.set(0, 0.45, -0.92);
  fork.rotation.x = -0.25;
  rick.add(fork);

  // 3 Spoke Wheels
  const buildWheel = (wx: number, wy: number, wz: number) => {
    const wg = new THREE.Group();
    wg.position.set(wx, wy, wz);
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 8, 16), tireMat);
    tire.castShadow = true;
    wg.add(tire);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), chromeMat);
    hub.rotation.z = Math.PI / 2;
    wg.add(hub);
    return wg;
  };

  rick.add(buildWheel(0, 0.32, -1.02));
  rick.add(buildWheel(-0.52, 0.32, 0.52));
  rick.add(buildWheel(0.52, 0.32, 0.52));

  // AI Driver pedaling in lungi
  const lungiTex = textures.lungis[variant % textures.lungis.length];
  const driverLungi = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.24, 0.52, 10),
    new THREE.MeshStandardMaterial({ map: lungiTex, roughness: 0.75 })
  );
  driverLungi.position.set(0, 0.65, -0.32);
  rick.add(driverLungi);

  const driverTorso = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.46, 0.22),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 })
  );
  driverTorso.position.set(0, 1.08, -0.32);
  rick.add(driverTorso);

  const driverHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xc68642, roughness: 0.7 })
  );
  driverHead.position.set(0, 1.42, -0.32);
  rick.add(driverHead);

  return rick;
}

/**
 * FESTIVE COLORFUL BUNTING GARLAND ("রঙিন কাগজের ঝালর / মেলা পতাকা")
 * Features: High-vibrancy triangular festive flags strung diagonally across the street.
 */
export function createFestiveBuntingGarland(
  spanWidth: number,
  textures: ProceduralTexturePack
): THREE.Group {
  const garland = new THREE.Group();

  const flagMat = new THREE.MeshStandardMaterial({
    map: textures.buntingFlags,
    roughness: 0.45,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.2,
  });

  const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(spanWidth, 1.25), flagMat);
  bannerMesh.position.set(0, 6.8, 0);
  bannerMesh.rotation.x = 0.12;
  garland.add(bannerMesh);

  return garland;
}
