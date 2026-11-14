import * as THREE from 'three';
import { DriverProfile, SignalColor } from '../types/game';
import { ProceduralTexturePack } from './textures';
import { createCngModel } from './cngModel';
import { createDhakaBusModel } from './busModel';
import { createDhakaTruckModel } from './truckModel';
import { createLegunaModel } from './legunaModel';
import { createTrafficRickshawModel } from './trafficRickshawModel';
import {
  populateSidewalksForCell,
  SidewalkStallCategory,
  createChaiTongStallModel,
  createFlowerShopModel,
  createUniqueStreetVendorModel,
} from './sidewalkVendorGenerator';
export {
  createCngModel,
  createDhakaBusModel,
  createDhakaTruckModel,
  createLegunaModel,
  createTrafficRickshawModel,
  populateSidewalksForCell,
  createChaiTongStallModel,
  createFlowerShopModel,
  createUniqueStreetVendorModel,
};
import {
  createJudgeCourtModel,
  createSecretariatOfficeModel,
  createCommercialBankTowerModel,
  createBarAssociationChamberModel,
  createTaxAndBankAnnexModel,
} from './officeAdalatModels';
export {
  createJudgeCourtModel,
  createSecretariatOfficeModel,
  createCommercialBankTowerModel,
  createBarAssociationChamberModel,
  createTaxAndBankAnnexModel,
};
import {
  createResidentialApartmentModel,
  createOldDhakaHeritageShophouseModel,
  createMixedUseMidriseModel,
  createUnderConstructionBuildingModel,
  createDhakaSchoolCollegeModel,
  createShoppingMarketPlazaModel,
  createStreetRestaurantHotelModel,
  createCityClinicHospitalModel,
} from './cityBuildingModels';
export {
  createResidentialApartmentModel,
  createOldDhakaHeritageShophouseModel,
  createMixedUseMidriseModel,
  createUnderConstructionBuildingModel,
  createDhakaSchoolCollegeModel,
  createShoppingMarketPlazaModel,
  createStreetRestaurantHotelModel,
  createCityClinicHospitalModel,
};

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

  // Rear wheel fenders - perfectly aligned concentric with wheels
  const fenderGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.12, 20, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
  [-0.88, 0.88].forEach((xPos) => {
    const fender = new THREE.Mesh(fenderGeo, goldTrimMat);
    fender.rotation.z = Math.PI / 2;
    fender.position.set(xPos, wheelRadius + 0.015, 0.82);
    chassisTilt.add(fender);

    // Chrome fender stays
    const stayF = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), chromeMat);
    stayF.position.set(xPos, wheelRadius + 0.12, 0.58);
    stayF.rotation.x = 0.6;
    chassisTilt.add(stayF);

    const stayR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), chromeMat);
    stayR.position.set(xPos, wheelRadius + 0.12, 1.06);
    stayR.rotation.x = -0.6;
    chassisTilt.add(stayR);
  });

  // 2. Wooden Footboard & Passenger Cushion
  const footboard = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.08, 1.25), framePaintMat);
  footboard.position.set(0, 0.52, 0.52);
  footboard.castShadow = true;
  footboard.receiveShadow = true;
  chassisTilt.add(footboard);

  // Side armrests & folk art panels
  [-0.69, 0.69].forEach((xPos) => {
    const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.38, 0.62), hoodFolkMat);
    sidePanel.position.set(xPos, 0.78, 0.76);
    sidePanel.castShadow = true;
    chassisTilt.add(sidePanel);

    // Gold brass handrail bar
    const handrail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.64, 8), goldTrimMat);
    handrail.rotation.x = Math.PI / 2;
    handrail.position.set(xPos, 0.98, 0.76);
    chassisTilt.add(handrail);
  });

  // Passenger seat base & cushioned backrest
  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.2, 0.62), seatCushionMat);
  seatBase.position.set(0, 0.68, 0.76);
  seatBase.castShadow = true;
  chassisTilt.add(seatBase);

  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.52, 0.12), seatCushionMat);
  seatBack.position.set(0, 1.04, 1.05);
  seatBack.rotation.x = 0.12;
  seatBack.castShadow = true;
  chassisTilt.add(seatBack);

  // Signature Rear Rickshaw Art Tin Plate ("মায়ের দোয়া", etc.) mounted flush
  const rearBoard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.44, 0.03), rearPlateMat);
  rearBoard.position.set(0, 0.78, 1.13);
  chassisTilt.add(rearBoard);

  // 3. Arched Rickshaw Hood (folding canvas canopy)
  const hoodArch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.72, 1.38, 24, 1, false, 0, Math.PI),
    hoodFolkMat
  );
  hoodArch.rotation.z = Math.PI / 2;
  hoodArch.position.set(0, 1.4, 0.62);
  hoodArch.castShadow = true;
  chassisTilt.add(hoodArch);

  // Front Rib hoop framing the front opening of the hood
  const frontRib = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.024, 8, 28, Math.PI),
    goldTrimMat
  );
  frontRib.position.set(0, 1.4, 0.05);
  chassisTilt.add(frontRib);

  // Rear Rib hoop framing the back of the hood
  const rearRib = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.02, 8, 28, Math.PI),
    goldTrimMat
  );
  rearRib.position.set(0, 1.4, 1.18);
  chassisTilt.add(rearRib);

  // Chrome Folding Scissor Stays (লৌহের ভাঁজ করা হাতল) on both sides of hood
  [-0.71, 0.71].forEach((sx) => {
    const scissor1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.45, 0.025), chromeMat);
    scissor1.position.set(sx, 1.15, 0.52);
    scissor1.rotation.x = 0.55;
    chassisTilt.add(scissor1);

    const scissor2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.45, 0.025), chromeMat);
    scissor2.position.set(sx, 1.15, 0.72);
    scissor2.rotation.x = -0.55;
    chassisTilt.add(scissor2);
  });

  // Hanging decorative tassels along front canopy rib
  [-0.48, -0.24, 0, 0.24, 0.48].forEach((xPos) => {
    const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 8), goldTrimMat);
    const yArc = Math.sqrt(Math.max(0, 0.72 * 0.72 - xPos * xPos));
    tassel.position.set(xPos, 1.4 + yArc - 0.14, 0.05);
    tassel.rotation.x = Math.PI;
    chassisTilt.add(tassel);
  });

  // 4. Frame Spine, Rear Truss Stays & Driver Saddle
  const spineTube = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 1.75, 10), framePaintMat);
  spineTube.rotation.x = Math.PI / 2 - 0.2;
  spineTube.position.set(0, 0.65, -0.32);
  spineTube.castShadow = true;
  chassisTilt.add(spineTube);

  // Top Tube linking head tube to seat post
  const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.92, 8), framePaintMat);
  topTube.rotation.x = Math.PI / 2 - 0.12;
  topTube.position.set(0, 1.05, -0.76);
  chassisTilt.add(topTube);

  // Rear Chainstays connecting rear axle to bottom bracket
  [-0.32, 0.32].forEach((cx) => {
    const stay = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.42, 8), framePaintMat);
    stay.position.set(cx, 0.46, 0.12);
    stay.rotation.x = Math.PI / 2;
    stay.rotation.y = cx > 0 ? 0.22 : -0.22;
    chassisTilt.add(stay);
  });

  const seatPost = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.45, 10), chromeMat);
  seatPost.position.set(0, 0.86, -0.34);
  seatPost.rotation.x = -0.15;
  chassisTilt.add(seatPost);

  const driverSaddle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.32), tireMat);
  driverSaddle.position.set(0, 1.09, -0.32);
  chassisTilt.add(driverSaddle);

  // Pedal Crank & Chainring
  const pedalCrank = new THREE.Group();
  pedalCrank.position.set(0, 0.46, -0.55);
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
  headTube.position.set(0, 0.95, 0.02);
  headTube.rotation.x = 0.12;
  steeringColumn.add(headTube);

  [-0.09, 0.09].forEach((xPos) => {
    const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.54, 8), framePaintMat);
    blade.position.set(xPos, 0.62, 0.01);
    steeringColumn.add(blade);
  });

  const frontFender = new THREE.Mesh(fenderGeo, goldTrimMat);
  frontFender.rotation.z = Math.PI / 2;
  frontFender.position.set(0, wheelRadius + 0.015, 0);
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

  // Colorful fluttering handlebar streamers (রঙিন ফিতা ও ঝালর)
  const ribbonColors = [0xef4444, 0x10b981, 0xfacc15, 0x3b82f6];
  [-0.39, 0.39].forEach((xPos) => {
    for (let r = 0; r < 4; r++) {
      const ribbon = new THREE.Mesh(
        new THREE.BoxGeometry(0.015, 0.2, 0.008),
        new THREE.MeshStandardMaterial({ color: ribbonColors[r], roughness: 0.4 })
      );
      ribbon.position.set(xPos + (xPos > 0 ? 0.018 * r : -0.018 * r), 1.24, 0.22 + r * 0.02);
      ribbon.rotation.z = xPos > 0 ? -0.18 * r : 0.18 * r;
      ribbon.rotation.x = 0.22;
      steeringColumn.add(ribbon);
    }
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

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 16), skinMat);
  skull.castShadow = true;
  headGroup.add(skull);

  if (profile.id === 'kader' && textures.kaderFace) {
    // Exact realistic photo face of Obaidul Quader
    // Photo already includes his signature spectacles - no obscuring black bar!
    const faceMat = new THREE.MeshStandardMaterial({
      map: textures.kaderFace,
      roughness: 0.28,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    const facePlate = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.36), faceMat);
    facePlate.position.set(0, 0.02, -0.176);
    facePlate.rotation.y = Math.PI;
    facePlate.scale.x = -1; // Correct orientation so the portrait is not mirrored
    headGroup.add(facePlate);

    // Hair cap styled to his trimmed hairstyle at the back and top, leaving face completely clear
    const hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.176, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.44),
      hairMat
    );
    hairCap.rotation.x = -0.28;
    hairCap.position.set(0, 0.05, 0.02);
    headGroup.add(hairCap);
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
 * BANGLADESHI WOMAN IN BORKA / ABAYA & HIJAB-NIQAB ("বোরকা পরা মহিলা")
 * Composite procedural model with flared abaya gown, embroidered hem trim,
 * draped khimar hijab shawl, face veil (niqab), sleeved arms, tote handbag, and sandals.
 * Oriented with forward facing -Z to match PedestrianRig stride conventions.
 */
export function createBorkaWomanModel(seed: number, textures: ProceduralTexturePack): PedestrianRig {
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.85, 0.85));

  const palettes = [
    { borka: 0x111827, hijab: 0x7f1d1d, trim: 0xd97706, bag: 0x78350f }, // Classic Black + Maroon Hijab
    { borka: 0x1e293b, hijab: 0x0f766e, trim: 0xcbd5e1, bag: 0x18181b }, // Deep Navy + Teal Hijab
    { borka: 0x3b0764, hijab: 0xbe185d, trim: 0xfde047, bag: 0x451a03 }, // Aubergine + Rose Hijab
    { borka: 0x0f172a, hijab: 0x065f46, trim: 0x94a3b8, bag: 0x7c2d12 }, // Jet Black + Emerald Hijab
    { borka: 0x27272a, hijab: 0x9a3412, trim: 0xfacc15, bag: 0x0f172a }, // Charcoal + Terracotta Hijab
  ];
  const pal = palettes[Math.abs(seed) % palettes.length];
  const skinColors = [0xc68642, 0xd99b78, 0x9c6234];

  const borkaMat = new THREE.MeshStandardMaterial({ color: pal.borka, roughness: 0.84, metalness: 0.04 });
  const hijabMat = new THREE.MeshStandardMaterial({ color: pal.hijab, roughness: 0.76, metalness: 0.05 });
  const trimMat = new THREE.MeshStandardMaterial({ color: pal.trim, roughness: 0.45, metalness: 0.35 });
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinColors[Math.abs(seed) % skinColors.length],
    roughness: 0.7,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const bagMat = new THREE.MeshStandardMaterial({ color: pal.bag, roughness: 0.48, metalness: 0.15 });
  const buckleMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.22, metalness: 0.88 });
  const sandalMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 });

  // 1. Flowing Flared Abaya Skirt & Embroidered Hem
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.33, 0.92, 12), borkaMat);
  skirt.position.set(0, 0.58, 0);
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  root.add(skirt);

  const hemTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.338, 0.055, 12), trimMat);
  hemTrim.position.set(0, 0.145, 0);
  root.add(hemTrim);

  // 2. Upper Abaya Bodice & Draped Khimar Shawl
  const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.205, 0.4, 10), borkaMat);
  bodice.position.set(0, 1.15, 0);
  bodice.castShadow = true;
  root.add(bodice);

  const khimarCape = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.255, 0.34, 10), hijabMat);
  khimarCape.position.set(0, 1.24, 0.01);
  root.add(khimarCape);

  // 3. Head with Hijab Wrap + Forehead Brow Band + Niqab Face Veil (facing -Z)
  const headBase = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 10), skinMat);
  headBase.position.set(0, 1.49, 0);
  root.add(headBase);

  // Hijab crown & back drape covering hair/neck completely
  const hijabWrap = new THREE.Mesh(
    new THREE.SphereGeometry(0.162, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.72),
    hijabMat
  );
  hijabWrap.position.set(0, 1.5, 0.015);
  hijabWrap.rotation.x = 0.24;
  hijabWrap.castShadow = true;
  root.add(hijabWrap);

  const hijabBackDrape = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.1), hijabMat);
  hijabBackDrape.position.set(0, 1.42, 0.12);
  root.add(hijabBackDrape);

  // Niqab lower face veil (covers nose/mouth/chin on -Z front while leaving eyes visible)
  const useNiqab = seed % 4 !== 3; // Mix of niqab & open-face hijab styles authentic to Dhaka
  if (useNiqab) {
    const niqab = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.158, 0.135, 10), borkaMat);
    niqab.position.set(0, 1.43, -0.01);
    root.add(niqab);
  }

  // Subtle expressive eyes facing -Z
  [-0.048, 0.048].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), eyeMat);
    eye.position.set(ex, 1.505, -0.14);
    root.add(eye);
  });

  // 4. Feet / Sandals stepping beneath gown hem (animated by PedestrianRig)
  const buildFoot = (xOff: number) => {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.17), sandalMat);
    foot.position.set(xOff, 0.08, -0.02);
    return foot;
  };
  const legL = buildFoot(-0.09);
  const legR = buildFoot(0.09);
  root.add(legL);
  root.add(legR);

  // 5. Sleeved Borka Arms + Hands + Shoulder Handbag
  const sleeveGeo = new THREE.CylinderGeometry(0.056, 0.072, 0.42, 8);
  const armL = new THREE.Mesh(sleeveGeo, borkaMat);
  armL.position.set(-0.23, 1.08, 0);
  root.add(armL);

  const armR = new THREE.Mesh(sleeveGeo, borkaMat);
  armR.position.set(0.23, 1.08, 0);
  root.add(armR);

  // Purse / Market Tote hanging at right side
  const purse = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.22), bagMat);
  purse.position.set(0.26, 0.84, -0.03);
  root.add(purse);

  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.05), buckleMat);
  clasp.position.set(0.305, 0.88, -0.03);
  root.add(clasp);

  return {
    root,
    legL,
    legR,
    armL,
    armR,
    walkingSpeed: 1.08 + (seed % 4) * 0.2,
    direction: seed % 2 === 0 ? 1 : -1,
    phase: (seed * 1.93) % (Math.PI * 2),
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
    group.add(posterMesh);
  });

  // 2. Roadside Compound Boundary Wall with Torn & Pasted Posters
  const boundaryWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 1.8, 3.4),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 })
  );
  boundaryWall.position.set(side * 11.45, 0.9, -4.0);
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

/**
 * AUTHENTIC BANGLADESHI ROADSIDE TREES ("রাস্তার ধারের গাছ")
 * Varieties:
 * 0: Krishnachura Tree (কৃষ্ণচূড়া) - Fiery red/orange blossoms, broad canopy, terracotta circular brick planter with fallen petals
 * 1: Coconut Palm (নারকেল গাছ) - Slender segmented curved trunk, arching palm fronds, hanging coconuts
 * 2: Shady Banyan Tree (বটগাছ / কড়ই গাছ) - Spreading layered lush emerald canopy, aerial roots & whitewashed brick sitting platform
 * 3: Slender Debdaru (দেবদারু) - Tall conical evergreen silhouette with raised planter curb
 */
export function createTreeModel(variant: number, textures?: ProceduralTexturePack): THREE.Group {
  const tree = new THREE.Group();
  if (textures?.contactShadow) {
    tree.add(createContactShadowMesh(textures.contactShadow, 4.0, 4.0));
  }

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x4a321e, roughness: 0.9, metalness: 0.05 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.95 });
  const planterMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });

  const v = Math.abs(variant) % 4;

  if (v === 0) {
    // 0: Krishnachura (Royal Poinciana - কৃষ্ণচূড়া)
    const planterRing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.65, 1.75, 0.45, 16),
      planterMat
    );
    planterRing.position.y = 0.225;
    planterRing.receiveShadow = true;
    tree.add(planterRing);

    const soilMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 0.46, 14),
      soilMat
    );
    soilMesh.position.y = 0.23;
    tree.add(soilMesh);

    // Fallen red blossoms around base
    const petalMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const r = 0.7 + (p % 3) * 0.25;
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.12, 6), petalMat);
      petal.rotation.x = -Math.PI / 2;
      petal.position.set(Math.cos(angle) * r, 0.465, Math.sin(angle) * r);
      tree.add(petal);
    }

    // Gnarled organic trunk
    const trunkLower = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 3.2, 8), barkMat);
    trunkLower.position.set(0, 1.8, 0);
    trunkLower.castShadow = true;
    tree.add(trunkLower);

    // Sprawling angled main branches
    const branch1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 2.8, 7), barkMat);
    branch1.position.set(0.65, 3.9, 0.3);
    branch1.rotation.z = -0.45;
    branch1.rotation.x = 0.2;
    branch1.castShadow = true;
    tree.add(branch1);

    const branch2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 2.7, 7), barkMat);
    branch2.position.set(-0.65, 3.8, -0.2);
    branch2.rotation.z = 0.48;
    branch2.rotation.x = -0.25;
    branch2.castShadow = true;
    tree.add(branch2);

    // Umbrella foliage canopy
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    const flowerRedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    const flowerOrangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });

    // Green umbrella clusters
    [
      [0, 5.2, 0, 2.5, 1.2],
      [-1.3, 4.8, 0.5, 2.0, 1.0],
      [1.4, 4.9, -0.4, 2.1, 1.0],
      [0.2, 5.5, 1.2, 1.8, 0.9],
      [-0.3, 5.4, -1.2, 1.9, 0.9],
    ].forEach(([cx, cy, cz, rx, ry]) => {
      const cluster = new THREE.Mesh(new THREE.SphereGeometry(rx, 8, 6), greenMat);
      cluster.scale.set(1.0, ry / rx, 1.0);
      cluster.position.set(cx, cy, cz);
      tree.add(cluster);
    });

    // Vibrant Red & Orange Krishnachura Blossom Clusters
    [
      [0, 5.8, 0.2, 1.35, flowerRedMat],
      [-1.1, 5.4, 0.7, 1.15, flowerOrangeMat],
      [1.2, 5.5, -0.2, 1.2, flowerRedMat],
      [0.5, 5.9, -0.9, 1.05, flowerOrangeMat],
      [-0.8, 5.6, -1.0, 0.95, flowerRedMat],
      [1.0, 5.3, 1.0, 1.05, flowerRedMat],
    ].forEach(([fx, fy, fz, fr, fmat]) => {
      const flowers = new THREE.Mesh(new THREE.DodecahedronGeometry(fr as number, 0), fmat as THREE.Material);
      flowers.position.set(fx as number, fy as number, fz as number);
      tree.add(flowers);
    });

  } else if (v === 1) {
    // 1: Coconut Palm (নারকেল গাছ)
    const baseCurb = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.35, 10), planterMat);
    baseCurb.position.y = 0.175;
    tree.add(baseCurb);

    const palmSoil = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.36, 10), soilMat);
    palmSoil.position.y = 0.18;
    tree.add(palmSoil);

    // Slender curved trunk in 5 segmented tiers leaning toward street
    const palmBarkMat = new THREE.MeshStandardMaterial({ color: 0x714b2d, roughness: 0.85 });
    const trunkGroup = new THREE.Group();
    let currY = 0.35;
    let currX = 0;
    const numTiers = 5;
    for (let t = 0; t < numTiers; t++) {
      const radiusTop = 0.22 - t * 0.02;
      const radiusBottom = 0.26 - t * 0.02;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, 1.4, 7), palmBarkMat);
      seg.position.set(currX, currY + 0.7, 0);
      seg.rotation.z = -0.06;
      trunkGroup.add(seg);
      currY += 1.3;
      currX += 0.22;
    }
    tree.add(trunkGroup);

    // Crown of hanging coconuts
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.5 });
    for (let n = 0; n < 4; n++) {
      const angle = (n / 4) * Math.PI * 2;
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 5), nutMat);
      nut.scale.set(1.0, 1.3, 1.0);
      nut.position.set(currX + Math.cos(angle) * 0.25, currY - 0.2, Math.sin(angle) * 0.25);
      tree.add(nut);
    }

    // Radiating arched palm fronds
    const frondMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });
    const numFronds = 7;
    for (let f = 0; f < numFronds; f++) {
      const angle = (f / numFronds) * Math.PI * 2;
      const frond = new THREE.Group();
      frond.position.set(currX, currY, 0);
      frond.rotation.y = angle;

      const leafGeo = new THREE.ConeGeometry(0.45, 2.8, 4);
      const leafMesh = new THREE.Mesh(leafGeo, frondMat);
      leafMesh.position.set(0, 0.4, 1.2);
      leafMesh.rotation.x = Math.PI / 2.8;
      leafMesh.scale.set(1.0, 1.0, 0.2);
      frond.add(leafMesh);

      tree.add(frond);
    }

  } else if (v === 2) {
    // 2: Shady Banyan Tree (বটগাছ / কড়ই গাছ) with sitting platform ("বসার বাঁধানো বেদি")
    const benchMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.65 });
    const benchTrimMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });

    const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.3, 0.65, 10), benchMat);
    platform.position.y = 0.325;
    platform.receiveShadow = true;
    tree.add(platform);

    const platformRim = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.35, 0.12, 10), benchTrimMat);
    platformRim.position.y = 0.6;
    tree.add(platformRim);

    const banyanSoil = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.66, 10), soilMat);
    banyanSoil.position.y = 0.33;
    tree.add(banyanSoil);

    const mainTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 3.6, 8), barkMat);
    mainTrunk.position.set(0, 2.1, 0);
    mainTrunk.castShadow = true;
    tree.add(mainTrunk);

    [-0.55, 0.55].forEach((rx) => {
      const rootPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.8, 6), barkMat);
      rootPillar.position.set(rx, 1.7, rx > 0 ? 0.45 : -0.45);
      rootPillar.rotation.z = rx > 0 ? 0.12 : -0.12;
      tree.add(rootPillar);
    });

    const deepGreenMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
    const emeraldMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    const limeMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.7 });

    [
      [0, 5.0, 0, 3.2, 1.6, deepGreenMat],
      [-1.4, 4.7, 0.8, 2.2, 1.2, emeraldMat],
      [1.4, 4.8, -0.7, 2.3, 1.3, deepGreenMat],
      [0.6, 5.6, 1.2, 2.0, 1.1, emeraldMat],
      [-0.8, 5.7, -1.1, 2.1, 1.1, limeMat],
      [0, 6.2, 0, 2.4, 1.4, limeMat],
    ].forEach(([cx, cy, cz, rx, ry, mat]) => {
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(rx as number, 7, 6), mat as THREE.Material);
      foliage.scale.set(1.0, (ry as number) / (rx as number), 1.0);
      foliage.position.set(cx as number, cy as number, cz as number);
      tree.add(foliage);
    });

  } else {
    // 3: Slender Debdaru (দেবদারু গাছ)
    const debPlanter = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 1.6), planterMat);
    debPlanter.position.y = 0.225;
    tree.add(debPlanter);

    const debSoil = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.46, 1.4), soilMat);
    debSoil.position.y = 0.23;
    tree.add(debSoil);

    const debTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 4.5, 7), barkMat);
    debTrunk.position.y = 2.4;
    debTrunk.castShadow = true;
    tree.add(debTrunk);

    const debFoliageMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 });
    const cones = [
      { y: 3.2, r: 1.5, h: 2.2 },
      { y: 4.6, r: 1.25, h: 2.2 },
      { y: 5.9, r: 0.95, h: 2.0 },
      { y: 7.0, r: 0.6, h: 1.8 },
    ];
    cones.forEach(({ y, r, h }) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), debFoliageMat);
      cone.position.y = y;
      tree.add(cone);
    });
  }

  return tree;
}

/**
 * MAJOR DHAKA TRAFFIC LIGHT & INTERSECTION ("চৌরাস্তা ট্রাফিক সিগন্যাল ও পুলিশ বক্স")
 * Features:
 * - Overhead cantilever gantry with DMP Traffic Signboard and dual 3-aspect signal heads
 * - Real-time illuminated RED/YELLOW/GREEN lamps with PointLight glow
 * - Ground Zebra crossing pedestrian stripes and solid white stop lines
 * - Perpendicular cross-street asphalt with curved curbs and street name posts
 * - Traffic police pedestal with umbrella and animated police officer signaling traffic
 */
export interface TrafficLightRig {
  root: THREE.Group;
  redMeshes: THREE.Mesh[];
  yellowMeshes: THREE.Mesh[];
  greenMeshes: THREE.Mesh[];
  pointLight?: THREE.PointLight;
  policeArmGroup: THREE.Group;
  setSignal: (state: SignalColor) => void;
}

export function createTrafficIntersectionModel(
  textures: ProceduralTexturePack,
  crossingNameBn = 'গুলিস্তান মোড়'
): { group: THREE.Group; lightRig: TrafficLightRig; crossRoadMesh: THREE.Group } {
  const group = new THREE.Group();

  // 1. Materials
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.8,
  });
  const yellowStripeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.5,
  });
  const housingMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.8,
  });
  const asphaltCrossMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.88,
  });
  const zebraMat = new THREE.MeshStandardMaterial({
    map: textures.zebraCrossing,
    roughness: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const dmpSignMat = new THREE.MeshStandardMaterial({
    map: textures.trafficSignDmp,
    roughness: 0.35,
    metalness: 0.2,
  });

  // Signal lamp materials (active vs inactive)
  const redActiveMat = new THREE.MeshStandardMaterial({
    color: 0xff1e1e,
    emissive: 0xef4444,
    emissiveIntensity: 3.0,
    roughness: 0.1,
  });
  const redDimMat = new THREE.MeshStandardMaterial({
    color: 0x3b0707,
    roughness: 0.7,
  });

  const yellowActiveMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });
  const yellowDimMat = new THREE.MeshStandardMaterial({
    color: 0x361a03,
    roughness: 0.7,
  });

  const greenActiveMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 3.0,
    roughness: 0.1,
  });
  const greenDimMat = new THREE.MeshStandardMaterial({
    color: 0x042f1a,
    roughness: 0.7,
  });

  // 2. OPEN WORLD CROSS-AVENUE ("ডানে ও বামে দীর্ঘ উন্মুক্ত রাস্তা ও অফিস-আদালত পাড়া")
  const crossRoadMesh = new THREE.Group();

  // Wide East-West Cross-Avenue Asphalt Wings (Flanking Central Main Avenue without overlap)
  [-69.5, 69.5].forEach((wingX) => {
    const crossWing = new THREE.Mesh(new THREE.PlaneGeometry(121, 14), asphaltCrossMat);
    crossWing.rotation.x = -Math.PI / 2;
    crossWing.position.set(wingX, 0.005, 0);
    crossWing.receiveShadow = true;
    crossRoadMesh.add(crossWing);
  });

  // Center dashed yellow lane dividers along X
  const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  for (let lx = -125; lx <= 125; lx += 8) {
    if (Math.abs(lx) < 9.5) continue; // Leave central intersection box clear
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.28), yellowLineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(lx, 0.022, 0);
    crossRoadMesh.add(dash);
  }

  // White edge lines on North & South borders of the cross-street
  const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  [-6.4, 6.4].forEach((lz) => {
    [-70, 70].forEach((lx) => {
      const edgeLine = new THREE.Mesh(new THREE.PlaneGeometry(120, 0.22), whiteLineMat);
      edgeLine.rotation.x = -Math.PI / 2;
      edgeLine.position.set(lx, 0.022, lz);
      crossRoadMesh.add(edgeLine);
    });
  });

  // Cross-Street Sidewalks & Curbs on North (z = -7.5) and South (z = +7.5)
  const swCrossMat = new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: 0.85 });
  [-7.5, 7.5].forEach((cz) => {
    // West sidewalks & curbs
    const curbW = new THREE.Mesh(new THREE.BoxGeometry(118, 0.32, 0.45), yellowStripeMat);
    curbW.position.set(-69, 0.16, cz > 0 ? cz - 0.4 : cz + 0.4);
    crossRoadMesh.add(curbW);

    const swW = new THREE.Mesh(new THREE.BoxGeometry(118, 0.26, 3.2), swCrossMat);
    swW.position.set(-69, 0.13, cz > 0 ? cz + 1.4 : cz - 1.4);
    swW.receiveShadow = true;
    crossRoadMesh.add(swW);

    // East sidewalks & curbs
    const curbE = new THREE.Mesh(new THREE.BoxGeometry(118, 0.32, 0.45), yellowStripeMat);
    curbE.position.set(69, 0.16, cz > 0 ? cz - 0.4 : cz + 0.4);
    crossRoadMesh.add(curbE);

    const swE = new THREE.Mesh(new THREE.BoxGeometry(118, 0.26, 3.2), swCrossMat);
    swE.position.set(69, 0.13, cz > 0 ? cz + 1.4 : cz - 1.4);
    swE.receiveShadow = true;
    crossRoadMesh.add(swE);
  });

  // Streetlamps along Left & Right Cross-Avenues
  const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.8 });
  const lampBulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0d8, emissive: 0xffe0a0, emissiveIntensity: 1.8 });
  [-35, -65, -95, 35, 65, 95].forEach((lx) => {
    [-8.6, 8.6].forEach((lz) => {
      const lPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.8, 8), lampPoleMat);
      lPole.position.set(lx, 2.9, lz);
      crossRoadMesh.add(lPole);

      const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, lz > 0 ? -1.4 : 1.4), lampPoleMat);
      lArm.position.set(lx, 5.7, lz > 0 ? lz - 0.7 : lz + 0.7);
      crossRoadMesh.add(lArm);

      const lBulb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), lampBulbMat);
      lBulb.position.set(lx, 5.5, lz > 0 ? lz - 1.3 : lz + 1.3);
      crossRoadMesh.add(lBulb);
    });
  });

  // Connecting North-South Parallel Streets at x = -115 and x = +115 (Open-World Grid)
  [-115, 115].forEach((px) => {
    const gridConn = new THREE.Mesh(new THREE.PlaneGeometry(14, 60), asphaltCrossMat);
    gridConn.rotation.x = -Math.PI / 2;
    gridConn.position.set(px, 0.008, 0);
    gridConn.receiveShadow = true;
    crossRoadMesh.add(gridConn);
  });

  // ==========================================
  // DIVERSE CITY BUILDINGS & RESIDENCES ALONG CROSS-AVENUE
  // ==========================================
  // NORTH FLANK (z = -17.5, Facing South):
  // 1. হাজী নান্না বিরিয়ানি ও কাচ্চি ঘর (West Near Intersection)
  const westBiryani = createStreetRestaurantHotelModel(textures);
  westBiryani.position.set(-22, 0, -16.5);
  westBiryani.rotation.y = 0;
  crossRoadMesh.add(westBiryani);

  // 2. ঢাকা জেলা জজ আদালত ও সুপ্রিম কোর্ট কমপ্লেক্স
  const judgeCourt = createJudgeCourtModel(textures);
  judgeCourt.position.set(-48, 0, -17.5);
  judgeCourt.rotation.y = 0;
  crossRoadMesh.add(judgeCourt);

  // 3. আবাসিক অ্যাপার্টমেন্ট ভবন ১ (West Mid Flank)
  const aptW1 = createResidentialApartmentModel(0, textures);
  aptW1.position.set(-72, 0, -17.0);
  aptW1.rotation.y = 0;
  crossRoadMesh.add(aptW1);

  // 4. সহকারী জজ ও চিফ জুডিশিয়াল ম্যাজিস্ট্রেট আদালত
  const magistrateCourt = createJudgeCourtModel(textures);
  magistrateCourt.position.set(-96, 0, -17.5);
  magistrateCourt.scale.set(0.85, 0.85, 0.85);
  crossRoadMesh.add(magistrateCourt);

  // 5. সিটি স্পেশালাইজড হাসপাতাল ও ডায়াগনস্টিক কমপ্লেক্স (West Outer Flank)
  const clinicW = createCityClinicHospitalModel(textures);
  clinicW.position.set(-118, 0, -17.0);
  clinicW.rotation.y = 0;
  crossRoadMesh.add(clinicW);

  // 6. ঢাকা গ্র্যান্ড শপিং প্লাজা ও মার্কেট (East Near Intersection)
  const marketE1 = createShoppingMarketPlazaModel(textures);
  marketE1.position.set(22, 0, -17.0);
  marketE1.rotation.y = 0;
  crossRoadMesh.add(marketE1);

  // 7. বাংলাদেশ সচিবালয় সরকারি মন্ত্রণালয় কমপ্লেক্স
  const secretariat = createSecretariatOfficeModel(textures);
  secretariat.position.set(48, 0, -17.5);
  secretariat.rotation.y = 0;
  crossRoadMesh.add(secretariat);

  // 8. আবাসিক অ্যাপার্টমেন্ট ভবন ২ (East Mid Flank)
  const aptE1 = createResidentialApartmentModel(1, textures);
  aptE1.position.set(72, 0, -17.0);
  aptE1.rotation.y = 0;
  crossRoadMesh.add(aptE1);

  // 9. সোনালী ব্যাংক কর্পোরেট হেডকোয়ার্টার্স ও বাণিজ্যিক টাওয়ার
  const bankTower = createCommercialBankTowerModel(textures);
  bankTower.position.set(96, 0, -17.5);
  bankTower.rotation.y = 0;
  crossRoadMesh.add(bankTower);

  // 10. আবাসিক অ্যাপার্টমেন্ট ভবন ৩ (East Outer Flank)
  const aptE2 = createResidentialApartmentModel(2, textures);
  aptE2.position.set(118, 0, -17.0);
  aptE2.rotation.y = 0;
  crossRoadMesh.add(aptE2);

  // ==========================================
  // SOUTH FLANK (z = +17.5, Facing North):
  // 11. ঢাকা গ্র্যান্ড শপিং প্লাজা (West South Flank)
  const marketW2 = createShoppingMarketPlazaModel(textures);
  marketW2.position.set(-22, 0, 17.0);
  marketW2.rotation.y = Math.PI;
  crossRoadMesh.add(marketW2);

  // 12. ঢাকা আইনজীবী সমিতি ও বার ভবন
  const barAssociation = createBarAssociationChamberModel(textures);
  barAssociation.position.set(-48, 0, 17.5);
  barAssociation.rotation.y = Math.PI;
  crossRoadMesh.add(barAssociation);

  // 13. আবাসিক অ্যাপার্টমেন্ট ভবন ৪
  const aptW2 = createResidentialApartmentModel(3, textures);
  aptW2.position.set(-72, 0, 17.0);
  aptW2.rotation.y = Math.PI;
  crossRoadMesh.add(aptW2);

  // 14. আইনজীবী চেম্বার ও লিগ্যাল অ্যানেক্স
  const barAnnex = createBarAssociationChamberModel(textures);
  barAnnex.position.set(-96, 0, 17.5);
  barAnnex.rotation.y = Math.PI;
  barAnnex.scale.set(0.9, 0.9, 0.9);
  crossRoadMesh.add(barAnnex);

  // 15. আবাসিক অ্যাপার্টমেন্ট ভবন ৫
  const aptW3 = createResidentialApartmentModel(4, textures);
  aptW3.position.set(-118, 0, 17.0);
  aptW3.rotation.y = Math.PI;
  crossRoadMesh.add(aptW3);

  // 16. ঐতিহ্যবাহী বিরিয়ানি রেস্টুরেন্ট ও মিষ্টির দোকান (East South Flank)
  const restE2 = createStreetRestaurantHotelModel(textures);
  restE2.position.set(22, 0, 16.5);
  restE2.rotation.y = Math.PI;
  crossRoadMesh.add(restE2);

  // 17. জাতীয় রাজস্ব বোর্ড (NBR) ও বাংলাদেশ ব্যাংক অ্যানেক্স
  const taxAnnex = createTaxAndBankAnnexModel(textures);
  taxAnnex.position.set(48, 0, 17.5);
  taxAnnex.rotation.y = Math.PI;
  crossRoadMesh.add(taxAnnex);

  // 18. সিটি হাসপাতাল ও ডায়াগনস্টিক কমপ্লেক্স
  const hospitalE = createCityClinicHospitalModel(textures);
  hospitalE.position.set(72, 0, 17.0);
  hospitalE.rotation.y = Math.PI;
  crossRoadMesh.add(hospitalE);

  // 19. বাণিজ্যিক ব্যাংক ভবন ২
  const bankAnnex2 = createCommercialBankTowerModel(textures);
  bankAnnex2.position.set(96, 0, 17.5);
  bankAnnex2.rotation.y = Math.PI;
  crossRoadMesh.add(bankAnnex2);

  // 20. আবাসিক অ্যাপার্টমেন্ট ভবন ৬
  const aptE3 = createResidentialApartmentModel(0, textures);
  aptE3.position.set(118, 0, 17.0);
  aptE3.rotation.y = Math.PI;
  crossRoadMesh.add(aptE3);

  // Roadside Trees flanking sidewalks
  [-30, -60, -90, -110, 30, 60, 90, 110].forEach((tx, idx) => {
    const treeN = createTreeModel(idx % 4, textures);
    treeN.position.set(tx, 0, -10.2);
    crossRoadMesh.add(treeN);

    const treeS = createTreeModel((idx + 2) % 4, textures);
    treeS.position.set(tx, 0, 10.2);
    crossRoadMesh.add(treeS);
  });

  // Authentic Parked Vehicles along sidewalks:
  [-24, -72, 24, 72].forEach((cx, idx) => {
    const parkedCng = createCngModel(textures);
    parkedCng.position.set(cx, 0, idx % 2 === 0 ? -7.8 : 7.8);
    parkedCng.rotation.y = idx % 2 === 0 ? Math.PI / 6 : -Math.PI / 6;
    crossRoadMesh.add(parkedCng);
  });

  [-40, -84, 40, 84].forEach((rx, idx) => {
    const parkedRick = createTrafficRickshawModel(textures);
    parkedRick.position.set(rx, 0, idx % 2 === 0 ? 8.0 : -8.0);
    parkedRick.rotation.y = Math.PI / 2;
    crossRoadMesh.add(parkedRick);
  });

  // Notary Public & Lawyers wooden desks on Court sidewalk
  const woodDeskMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  [-32, -64, -80].forEach((dx) => {
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.75, 0.8), woodDeskMat);
    desk.position.set(dx, 0.5, 7.8);
    crossRoadMesh.add(desk);

    const typewriter = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.4), metalMat);
    typewriter.position.set(dx, 0.95, 7.8);
    crossRoadMesh.add(typewriter);
  });

  // Signboards for Court and Secretariat
  const courtSignMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.4 });
  const courtSignPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8), metalMat);
  courtSignPost.position.set(-18, 1.9, -7.5);
  crossRoadMesh.add(courtSignPost);

  const courtSignBoard = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.9, 0.08), courtSignMat);
  courtSignBoard.position.set(-18, 3.4, -7.5);
  crossRoadMesh.add(courtSignBoard);

  const secSignPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8), metalMat);
  secSignPost.position.set(18, 1.9, -7.5);
  crossRoadMesh.add(secSignPost);

  const secSignBoard = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.9, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 })
  );
  secSignBoard.position.set(18, 3.4, -7.5);
  crossRoadMesh.add(secSignBoard);

  // Tea Stalls on East & West sidewalks
  [-8.6, 8.6].forEach((sz) => {
    const teaStallE = createStallModel(1, textures);
    teaStallE.position.set(34, 0, sz);
    crossRoadMesh.add(teaStallE);

    const teaStallW = createStallModel(0, textures);
    teaStallW.position.set(-34, 0, sz);
    crossRoadMesh.add(teaStallW);
  });

  // Corner street name boards ("রাস্তার মোড় নেমপ্লেট")
  [[-9.4, -7.4], [9.4, -7.4], [-9.4, 7.4], [9.4, 7.4]].forEach(([px, pz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), metalMat);
    post.position.set(px, 1.6, pz);
    crossRoadMesh.add(post);

    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.5, 0.06),
      new THREE.MeshStandardMaterial({ color: px < 0 ? 0x064e3b : 0x0369a1, roughness: 0.4 })
    );
    signBoard.position.set(px, 3.0, pz);
    signBoard.rotation.y = px < 0 ? Math.PI / 2 : -Math.PI / 2;
    crossRoadMesh.add(signBoard);
  });
  group.add(crossRoadMesh);

  // 3. Ground Zebra Crossings with White Stop Lines (Placed on main road before & after crossing)
  [-6.2, 6.2].forEach((zz) => {
    const zebra = new THREE.Mesh(new THREE.PlaneGeometry(16.4, 4.6), zebraMat);
    zebra.rotation.x = -Math.PI / 2;
    zebra.position.set(0, 0.025, zz);
    zebra.receiveShadow = true;
    group.add(zebra);
  });

  // 4. Overhead Cantilever Traffic Signal Gantry Structure
  const gantryGroup = new THREE.Group();
  gantryGroup.position.set(0, 0, 7.2); // Positioned facing the player's approach

  // Heavy steel upright column on right sidewalk curb
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 7.4, 12), metalMat);
  pole.position.set(8.8, 3.7, 0);
  pole.castShadow = true;
  gantryGroup.add(pole);

  // Base decorative flange with reflective stripes
  const poleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.52, 0.8, 12), yellowStripeMat);
  poleBase.position.set(8.8, 0.4, 0);
  gantryGroup.add(poleBase);

  // Horizontal cantilever truss spanning across road
  const trussMain = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.32, 0.32), metalMat);
  trussMain.position.set(0, 6.7, 0);
  gantryGroup.add(trussMain);

  const trussUpper = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.22, 0.22), metalMat);
  trussUpper.position.set(0, 7.3, 0);
  gantryGroup.add(trussUpper);

  // Diagonal support bracket
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8), metalMat);
  bracket.position.set(7.5, 5.7, 0);
  bracket.rotation.z = Math.PI / 4.2;
  gantryGroup.add(bracket);

  // Overhead DMP Police Signboard in center
  const dmpSign = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.45, 0.08), dmpSignMat);
  dmpSign.position.set(0, 5.9, 0);
  dmpSign.castShadow = true;
  gantryGroup.add(dmpSign);

  // 5. Dual 3-Aspect Traffic Signal Heads (Left lane & Right lane)
  const redMeshes: THREE.Mesh[] = [];
  const yellowMeshes: THREE.Mesh[] = [];
  const greenMeshes: THREE.Mesh[] = [];

  const buildSignalHead = (xPos: number, yPos: number, zPos: number) => {
    const head = new THREE.Group();
    head.position.set(xPos, yPos, zPos);

    // Outer dark housing
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.95, 0.42), housingMat);
    box.castShadow = true;
    head.add(box);

    // Yellow side border backplate
    const backplate = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.15, 0.04), yellowStripeMat);
    backplate.position.z = -0.16;
    head.add(backplate);

    // Top: Red Lamp
    const redLens = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), redActiveMat);
    redLens.position.set(0, 0.62, 0.18);
    redLens.rotation.x = Math.PI / 2;
    head.add(redLens);
    redMeshes.push(redLens);

    // Middle: Yellow Lamp
    const yellowLens = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), yellowDimMat);
    yellowLens.position.set(0, 0, 0.18);
    yellowLens.rotation.x = Math.PI / 2;
    head.add(yellowLens);
    yellowMeshes.push(yellowLens);

    // Bottom: Green Lamp
    const greenLens = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), greenDimMat);
    greenLens.position.set(0, -0.62, 0.18);
    greenLens.rotation.x = Math.PI / 2;
    head.add(greenLens);
    greenMeshes.push(greenLens);

    // Protective hoods / sun visors over each lens
    [0.62, 0, -0.62].forEach((ly) => {
      const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.22, 10, 1, true, 0, Math.PI),
        housingMat
      );
      visor.position.set(0, ly + 0.1, 0.26);
      visor.rotation.x = -Math.PI / 2;
      visor.rotation.z = Math.PI;
      head.add(visor);
    });

    return head;
  };

  // Overhead signals at left and right lanes
  gantryGroup.add(buildSignalHead(-3.8, 5.6, 0.22));
  gantryGroup.add(buildSignalHead(3.8, 5.6, 0.22));

  // Curbside secondary signal post on left sidewalk
  const curbSignalHead = buildSignalHead(-8.6, 3.4, 0.1);
  const curbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.8, 8), metalMat);
  curbPole.position.set(-8.6, 1.9, 0.1);
  gantryGroup.add(curbPole);
  gantryGroup.add(curbSignalHead);

  group.add(gantryGroup);

  // 6. Traffic Police Raised Island & Sergeant ("পুলিশ বক্স ও ট্রাফিক পুলিশ")
  const policeIsland = new THREE.Group();
  policeIsland.position.set(-9.2, 0, 4.6);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.7, 0.45, 12), yellowStripeMat);
  pedestal.position.y = 0.225;
  pedestal.receiveShadow = true;
  policeIsland.add(pedestal);

  const pedestalTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.46, 12),
    new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 })
  );
  pedestalTop.position.y = 0.23;
  policeIsland.add(pedestalTop);

  const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6), metalMat);
  umbrellaPole.position.set(0, 1.75, 0);
  policeIsland.add(umbrellaPole);

  const umbrellaCanopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.9, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, side: THREE.DoubleSide })
  );
  umbrellaCanopy.position.set(0, 3.45, 0);
  policeIsland.add(umbrellaCanopy);

  const officerGroup = new THREE.Group();
  officerGroup.position.set(0, 0.46, 0.25);

  const uniformShirtMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });
  const uniformPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x935c34, roughness: 0.8 });
  const policeCapMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });

  [-0.14, 0.14].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.075, 0.95, 6), uniformPantsMat);
    leg.position.set(lx, 0.48, 0);
    officerGroup.add(leg);
  });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.65, 0.26), uniformShirtMat);
  torso.position.set(0, 1.25, 0);
  officerGroup.add(torso);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.28), housingMat);
  belt.position.set(0, 0.96, 0);
  officerGroup.add(belt);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), skinMat);
  head.position.set(0, 1.68, 0);
  officerGroup.add(head);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.15, 0.08, 8), policeCapMat);
  cap.position.set(0, 1.76, 0);
  officerGroup.add(cap);

  const visorCap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.1), housingMat);
  visorCap.position.set(0, 1.74, 0.14);
  officerGroup.add(visorCap);

  const policeArmGroup = new THREE.Group();
  policeArmGroup.position.set(0.26, 1.48, 0);

  const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.6, 6), uniformShirtMat);
  armMesh.position.set(0.18, -0.22, 0);
  armMesh.rotation.z = -Math.PI / 4;
  policeArmGroup.add(armMesh);

  const glove = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.18, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
  );
  glove.position.set(0.38, -0.4, 0);
  policeArmGroup.add(glove);

  officerGroup.add(policeArmGroup);
  policeIsland.add(officerGroup);
  group.add(policeIsland);

  const lightRig: TrafficLightRig = {
    root: group,
    redMeshes,
    yellowMeshes,
    greenMeshes,
    policeArmGroup,
    setSignal: (state: 'RED' | 'YELLOW' | 'GREEN') => {
      if (state === 'RED') {
        redMeshes.forEach((m) => (m.material = redActiveMat));
        yellowMeshes.forEach((m) => (m.material = yellowDimMat));
        greenMeshes.forEach((m) => (m.material = greenDimMat));
        policeArmGroup.rotation.z = -1.15;
      } else if (state === 'YELLOW') {
        redMeshes.forEach((m) => (m.material = redDimMat));
        yellowMeshes.forEach((m) => (m.material = yellowActiveMat));
        greenMeshes.forEach((m) => (m.material = greenDimMat));
        policeArmGroup.rotation.z = -0.55;
      } else {
        redMeshes.forEach((m) => (m.material = redDimMat));
        yellowMeshes.forEach((m) => (m.material = yellowDimMat));
        greenMeshes.forEach((m) => (m.material = greenActiveMat));
        policeArmGroup.rotation.z = 0.25;
      }
    },
  };

  lightRig.setSignal('RED');
  return { group, lightRig, crossRoadMesh };
}

/**
 * ============================================================================
 * AUTHENTIC DHAKA STREET AMBIENCE BUILDERS (Modular & Geometry/Material Cached)
 * ============================================================================
 */
let cachedDirSignTex: THREE.CanvasTexture[] | null = null;
let cachedBusShelterTex: THREE.CanvasTexture[] | null = null;

function getDhakaDirSignTex(variant: number): THREE.CanvasTexture {
  if (!cachedDirSignTex) {
    const configs = [
      { route: 'N1', top: '↑ মতিঝিল', left: '← গুলিস্তান', right: 'পল্টন →' },
      { route: 'D-04', top: '↑ ফার্মগেট', left: '← শাহবাগ', right: 'কারওয়ান বাজার →' },
      { route: 'PD-2', top: '↑ চকবাজার', left: '← সদরঘাট', right: 'লালবাগ →' },
    ];
    cachedDirSignTex = configs.map((c) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#065f46';
      ctx.fillRect(0, 0, 512, 256);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(10, 10, 492, 236);

      // Yellow route badge
      ctx.fillStyle = '#facc15';
      ctx.fillRect(28, 24, 92, 46);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.route, 74, 56);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.fillText(c.top, 280, 62);

      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(28, 102);
      ctx.lineTo(484, 102);
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 28px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(c.left, 28, 158);
      ctx.textAlign = 'right';
      ctx.fillText(c.right, 484, 212);

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }
  return cachedDirSignTex[Math.abs(variant) % cachedDirSignTex.length];
}

function getBusShelterHeaderTex(variant: number): THREE.CanvasTexture {
  if (!cachedBusShelterTex) {
    const labels = [
      { title: 'যাত্রী ছাউনি • BRTC বাস স্টপেজ', sub: 'মতিঝিল — গুলিস্তান — উত্তরা' },
      { title: 'DNCC যাত্রী ছাউনি • বাস স্টপ', sub: 'সদরঘাট — শাহবাগ — মিরপুর' },
    ];
    cachedBusShelterTex = labels.map((l) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, 512, 16);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, 114, 512, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(l.title, 256, 58);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 20px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.fillText(l.sub, 256, 98);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }
  return cachedBusShelterTex[Math.abs(variant) % cachedBusShelterTex.length];
}

let sharedCableMat: THREE.MeshBasicMaterial | null = null;
let sharedConcretePoleMat: THREE.MeshStandardMaterial | null = null;
let sharedCrossArmMat: THREE.MeshStandardMaterial | null = null;
let sharedTransformerMat: THREE.MeshStandardMaterial | null = null;
let sharedSagTubeGeos: THREE.TubeGeometry[] | null = null;

function getSharedPoleAssets() {
  if (!sharedCableMat) {
    sharedCableMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    sharedConcretePoleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 });
    sharedCrossArmMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.6 });
    sharedTransformerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.65, metalness: 0.35 });

    // Pre-build sagging catenary wire bundles spanning 18m between roadside electric poles
    const sags = [0.65, 1.05, 1.45, 0.85];
    const xOffsets = [-0.42, -0.1, 0.25, 0.52];
    const yOffsets = [7.15, 6.85, 6.55, 6.3];
    sharedSagTubeGeos = sags.map((sag, idx) => {
      const xOff = xOffsets[idx];
      const yTop = yOffsets[idx];
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(xOff, yTop, -9.0),
        new THREE.Vector3(xOff + (idx % 2 === 0 ? 0.08 : -0.06), yTop - sag * 0.72, -4.5),
        new THREE.Vector3(xOff, yTop - sag, 0),
        new THREE.Vector3(xOff + (idx % 2 === 0 ? -0.05 : 0.07), yTop - sag * 0.72, 4.5),
        new THREE.Vector3(xOff, yTop, 9.0),
      ]);
      return new THREE.TubeGeometry(curve, 8, idx < 2 ? 0.026 : 0.02, 4, false);
    });
  }
  return {
    cableMat: sharedCableMat!,
    poleMat: sharedConcretePoleMat!,
    armMat: sharedCrossArmMat!,
    transMat: sharedTransformerMat!,
    wireGeos: sharedSagTubeGeos!,
  };
}

/**
 * DESCO / DPDC Electric Pole + Transformer Box + Coiled Tangled Overhead Cables ("তারের জঞ্জাল")
 */
export function createUtilityPoleAndWiresCorridor(hasTransformer: boolean): THREE.Group {
  const { cableMat, poleMat, armMat, transMat, wireGeos } = getSharedPoleAssets();
  const rig = new THREE.Group();

  // Concrete upright pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, 7.6, 6), poleMat);
  pole.position.set(0, 3.8, 0);
  rig.add(pole);

  // Upper steel cross-arms
  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.09, 0.1), armMat);
  arm1.position.set(0, 7.15, 0);
  rig.add(arm1);

  const arm2 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.09), armMat);
  arm2.position.set(0, 6.45, 0);
  rig.add(arm2);

  // Classic coiled fiber-optic cable ring hanging on pole ("ঢাকার তারের জঞ্জাল")
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 5, 10), cableMat);
  coil.position.set(0.18, 5.45, 0.08);
  coil.rotation.y = Math.PI / 3;
  rig.add(coil);

  if (hasTransformer) {
    const transBox = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.45), transMat);
    transBox.position.set(0.32, 4.75, 0);
    rig.add(transBox);
  }

  // Sagging overhead cable bundle along the corridor (centered around this pole, +/-9m)
  wireGeos.forEach((wg) => {
    const wireMesh = new THREE.Mesh(wg, cableMat);
    rig.add(wireMesh);
  });

  return rig;
}

/**
 * Dhaka City Corporation Passenger Bus Shelter ("যাত্রী ছাউনি")
 */
export function createDhakaBusShelterModel(variant: number): THREE.Group {
  const shelter = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.45, metalness: 0.4 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.5, metalness: 0.25 });
  const redTrimMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, metalness: 0.6 });
  const boardMat = new THREE.MeshStandardMaterial({
    map: getBusShelterHeaderTex(variant),
    roughness: 0.35,
  });

  // Back wall frame pillars
  [-1.85, 0, 1.85].forEach((pz) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 2.75, 6), frameMat);
    post.position.set(-0.52, 1.5, pz);
    shelter.add(post);
  });

  // Sloped tin awning roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.1, 4.3), roofMat);
  roof.position.set(0.05, 2.86, 0);
  roof.rotation.z = -0.1;
  shelter.add(roof);

  // Red accent fascia + Bengali route signboard
  const fascia = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 4.15), boardMat);
  fascia.position.set(0.75, 2.68, 0);
  fascia.rotation.y = Math.PI / 2;
  shelter.add(fascia);

  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.35, 3.7), redTrimMat);
  backPanel.position.set(-0.54, 1.55, 0);
  shelter.add(backPanel);

  // Waiting bench
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 3.2), benchMat);
  seat.position.set(-0.18, 0.72, 0);
  shelter.add(seat);

  [-1.2, 1.2].forEach((lz) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.46, 0.08), frameMat);
    leg.position.set(-0.18, 0.49, lz);
    shelter.add(leg);
  });

  return shelter;
}

/**
 * Weathered Terracotta Brick Boundary Wall Plastered with Bengali Street Posters
 */
export function createPosterBrickWallModel(
  textures: ProceduralTexturePack,
  seed: number
): THREE.Group {
  const wallGroup = new THREE.Group();
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    roughness: 0.9,
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });

  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.35, 4.2), brickMat);
  wall.position.set(0, 1.18, 0);
  wallGroup.add(wall);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.14, 4.3), capMat);
  cap.position.set(0, 2.42, 0);
  wallGroup.add(cap);

  // Overlapping colorful Bengali posters on both faces
  const posterCount = textures.bangladeshiPosters.length;
  [-1.15, 0.05, 1.2].forEach((pz, idx) => {
    const tex = textures.bangladeshiPosters[(Math.abs(seed) + idx) % posterCount];
    const pMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.65 });
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.18), pMat);
    poster.position.set(-0.2, 1.25 + ((idx % 2) * 0.16 - 0.08), pz);
    poster.rotation.y = -Math.PI / 2;
    poster.rotation.z = (idx % 2 === 0 ? 1 : -1) * 0.05;
    wallGroup.add(poster);
  });

  return wallGroup;
}

/**
 * DNCC Yellow-Black Pedestrian Footpath Guardrail ("পথচারী রেলিং")
 */
export function createFootpathRailingModel(length = 5.4): THREE.Group {
  const rail = new THREE.Group();
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.55, metalness: 0.4 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });

  const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, length), yellowMat);
  topBar.position.set(0, 1.05, 0);
  rail.add(topBar);

  const midBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, length), blackMat);
  midBar.position.set(0, 0.65, 0);
  rail.add(midBar);

  const postCount = 4;
  for (let i = 0; i < postCount; i++) {
    const zOff = -length / 2 + 0.15 + (i / (postCount - 1)) * (length - 0.3);
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.92, 6),
      i % 2 === 0 ? yellowMat : blackMat
    );
    post.position.set(0, 0.68, zOff);
    rail.add(post);
  }

  return rail;
}

/**
 * Dhaka Intersection Directional Highway Signboard ("গুলিস্তান / মতিঝিল সাইনবোর্ড")
 */
export function createDhakaDirectionSignModel(variant: number): THREE.Group {
  const sign = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });
  const boardMat = new THREE.MeshStandardMaterial({
    map: getDhakaDirSignTex(variant),
    roughness: 0.35,
  });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 4.1, 6), metalMat);
  post.position.set(0, 2.05, 0);
  sign.add(post);

  const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.08), boardMat);
  board.position.set(0, 3.65, 0);
  sign.add(board);

  return sign;
}

/**
 * Dhaka Street Vendor Pushcart ("ডাব / ঝালমুড়ি ভ্যানগাড়ি")
 */
export function createStreetVendorCartModel(seed: number): THREE.Group {
  const cart = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({
    color: seed % 2 === 0 ? 0x0369a1 : 0x15803d,
    roughness: 0.75,
  });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const coconutMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.7 });
  const umbrellaMat = new THREE.MeshStandardMaterial({
    color: seed % 2 === 0 ? 0xe11d48 : 0xf59e0b,
    roughness: 0.5,
    side: THREE.DoubleSide,
  });

  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.16, 1.75), woodMat);
  bed.position.set(0, 0.72, 0);
  cart.add(bed);

  [-0.48, 0.48].forEach((wx) => {
    [-0.6, 0.6].forEach((wz) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 8), wheelMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.45, wz);
      cart.add(w);
    });
  });

  // Pile of fresh green coconuts (ডাব) or jars
  for (let i = 0; i < 6; i++) {
    const item = new THREE.Mesh(new THREE.SphereGeometry(0.15, 7, 6), coconutMat);
    item.position.set(((i % 2) - 0.5) * 0.34, 0.92 + Math.floor(i / 4) * 0.18, -0.45 + Math.floor(i / 2) * 0.4);
    cart.add(item);
  }

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.85, 6), wheelMat);
  pole.position.set(0, 1.6, 0);
  cart.add(pole);

  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.42, 8), umbrellaMat);
  umbrella.position.set(0, 2.52, 0);
  cart.add(umbrella);

  return cart;
}

/**
 * INFINITE 2D CITY SUPER-CELL (96m x 96m)
 * Seamless 4-way Dhaka street grid tile with zero Z-fighting, zero dead ends,
 * dense 9-buildings-per-quadrant architecture, Metro viaduct, electric poles & tangled wires,
 * passenger bus shelters, postered brick walls, footpath railings, stalls, and lush trees.
 */
export interface CityCellStallData {
  mesh: THREE.Group;
  active: boolean;
  isVeggie: boolean;
  category?: SidewalkStallCategory;
  localX: number;
  localZ: number;
}

export interface CityGridCellResult {
  group: THREE.Group;
  metroGroup: THREE.Group;
  lightRig: TrafficLightRig;
  stalls: CityCellStallData[];
  lampBulbs: THREE.Mesh[];
  asphaltMats: THREE.MeshStandardMaterial[];
}

export function createCityGridCell(
  cellIndex: number,
  textures: ProceduralTexturePack
): CityGridCellResult {
  const group = new THREE.Group();
  const stalls: CityCellStallData[] = [];
  const lampBulbs: THREE.Mesh[] = [];

  // 1. Non-overlapping 5-piece Asphalt Road Cross (Width = 16m, Span = 96m)
  const asphaltMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    roughness: 0.84,
    metalness: 0.06,
  });
  const centerAsphaltMat = new THREE.MeshStandardMaterial({
    color: 0x242a33,
    roughness: 0.86,
    metalness: 0.06,
  });
  const asphaltMats = [asphaltMat, centerAsphaltMat];

  const centerBox = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), centerAsphaltMat);
  centerBox.rotation.x = -Math.PI / 2;
  centerBox.position.set(0, 0.008, 0);
  centerBox.receiveShadow = true;
  group.add(centerBox);

  const armGeo = new THREE.PlaneGeometry(16, 40);
  [-28, 28].forEach((az) => {
    const nsArm = new THREE.Mesh(armGeo, asphaltMat);
    nsArm.rotation.x = -Math.PI / 2;
    nsArm.position.set(0, 0.008, az);
    nsArm.receiveShadow = true;
    group.add(nsArm);
  });
  [-28, 28].forEach((ax) => {
    const ewArm = new THREE.Mesh(armGeo, asphaltMat);
    ewArm.rotation.x = -Math.PI / 2;
    ewArm.rotation.z = Math.PI / 2;
    ewArm.position.set(ax, 0.008, 0);
    ewArm.receiveShadow = true;
    group.add(ewArm);
  });

  // 1b. Crisp Road Lane Markings (Yellow Center Dashes, White Edge & Stop Lines)
  const yellowDashMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  const dashNSGeo = new THREE.PlaneGeometry(0.24, 4.4);
  const edgeNSGeo = new THREE.PlaneGeometry(0.18, 36.2);
  const stopNSGeo = new THREE.PlaneGeometry(15.2, 0.42);

  [-44, -36, -28, -20, 20, 28, 36, 44].forEach((pos) => {
    const dashNS = new THREE.Mesh(dashNSGeo, yellowDashMat);
    dashNS.rotation.x = -Math.PI / 2;
    dashNS.position.set(0, 0.018, pos);
    group.add(dashNS);

    const dashEW = new THREE.Mesh(dashNSGeo, yellowDashMat);
    dashEW.rotation.x = -Math.PI / 2;
    dashEW.rotation.z = Math.PI / 2;
    dashEW.position.set(pos, 0.018, 0);
    group.add(dashEW);
  });

  [-11.8, 11.8].forEach((stopPos) => {
    const stopNS = new THREE.Mesh(stopNSGeo, whiteLineMat);
    stopNS.rotation.x = -Math.PI / 2;
    stopNS.position.set(0, 0.019, stopPos);
    group.add(stopNS);

    const stopEW = new THREE.Mesh(stopNSGeo, whiteLineMat);
    stopEW.rotation.x = -Math.PI / 2;
    stopEW.rotation.z = Math.PI / 2;
    stopEW.position.set(stopPos, 0.019, 0);
    group.add(stopEW);
  });

  ([-1, 1] as const).forEach((s) => {
    ([-1, 1] as const).forEach((armSign) => {
      const edgeNS = new THREE.Mesh(edgeNSGeo, whiteLineMat);
      edgeNS.rotation.x = -Math.PI / 2;
      edgeNS.position.set(s * 7.6, 0.018, armSign * 29.9);
      group.add(edgeNS);

      const edgeEW = new THREE.Mesh(edgeNSGeo, whiteLineMat);
      edgeEW.rotation.x = -Math.PI / 2;
      edgeEW.rotation.z = Math.PI / 2;
      edgeEW.position.set(armSign * 29.9, 0.018, s * 7.6);
      group.add(edgeEW);
    });
  });

  // 2. Four Quadrant Sidewalks, Curbs, Dense Urban Building Blocks & Dhaka Street Ambience
  const curbMat = new THREE.MeshStandardMaterial({ map: textures.curb, roughness: 0.78 });
  const swMat = new THREE.MeshStandardMaterial({ map: textures.sidewalk, roughness: 0.84 });
  const blockPadMat = new THREE.MeshStandardMaterial({ color: 0x3b424d, roughness: 0.9 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.7 });

  const nsCurbGeo = new THREE.BoxGeometry(0.55, 0.32, 40.0);
  const ewCurbGeo = new THREE.BoxGeometry(39.45, 0.32, 0.55);
  const nsSwGeo = new THREE.BoxGeometry(3.2, 0.26, 39.45);
  const ewSwGeo = new THREE.BoxGeometry(36.25, 0.26, 3.2);
  const blockPadGeo = new THREE.PlaneGeometry(36.25, 36.25);

  ([-1, 1] as const).forEach((sx) => {
    ([-1, 1] as const).forEach((sz) => {
      // Flush non-overlapping curbs
      const curbNS = new THREE.Mesh(nsCurbGeo, curbMat);
      curbNS.position.set(sx * 8.275, 0.16, sz * 28.0);
      curbNS.receiveShadow = true;
      group.add(curbNS);

      const curbEW = new THREE.Mesh(ewCurbGeo, curbMat);
      curbEW.position.set(sx * 28.275, 0.16, sz * 8.275);
      curbEW.receiveShadow = true;
      group.add(curbEW);

      // Flush non-overlapping sidewalks
      const swNS = new THREE.Mesh(nsSwGeo, swMat);
      swNS.position.set(sx * 10.15, 0.13, sz * 28.275);
      swNS.receiveShadow = true;
      group.add(swNS);

      const swEW = new THREE.Mesh(ewSwGeo, swMat);
      swEW.position.set(sx * 29.875, 0.13, sz * 10.15);
      swEW.receiveShadow = true;
      group.add(swEW);

      // Paved Urban City Block Pad
      const pad = new THREE.Mesh(blockPadGeo, blockPadMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(sx * 29.875, 0.015, sz * 29.875);
      pad.receiveShadow = true;
      group.add(pad);

      // Streetlamps on sidewalks (2 per arm)
      const addLamp = (lx: number, lz: number, armDirX: number, armDirZ: number) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 6.8, 6), poleMat);
        pole.position.set(lx, 3.4, lz);
        group.add(pole);

        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xfde68a })
        );
        bulb.position.set(lx + armDirX * 1.1, 6.5, lz + armDirZ * 1.1);
        group.add(bulb);
        lampBulbs.push(bulb);
      };
      addLamp(sx * 9.0, sz * 26, -sx, 0);
      addLamp(sx * 26, sz * 9.0, 0, -sz);

      // Overhead DESCO/DPDC Electric Utility Poles & Tangled Black Cable Bundles along outer sidewalk
      const poleNS = createUtilityPoleAndWiresCorridor((cellIndex + (sx > 0 ? 1 : 0)) % 2 === 0);
      poleNS.position.set(sx * 11.4, 0, sz * 29.0);
      if (sx < 0) poleNS.rotation.y = Math.PI;
      group.add(poleNS);

      const poleEW = createUtilityPoleAndWiresCorridor(sz > 0 && sx < 0);
      poleEW.position.set(sx * 29.0, 0, sz * 11.4);
      poleEW.rotation.y = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
      group.add(poleEW);

      // Footpath Yellow-Black Pedestrian Guardrails flanking crossing approaches
      const railNS = createFootpathRailingModel(5.2);
      railNS.position.set(sx * 8.75, 0, sz * 15.2);
      group.add(railNS);

      const railEW = createFootpathRailingModel(5.2);
      railEW.rotation.y = Math.PI / 2;
      railEW.position.set(sx * 15.2, 0, sz * 8.75);
      group.add(railEW);

      // Lush Dhaka Avenue Trees (3 per quadrant: Corner + N-S alley pocket + E-W alley pocket)
      const qTreeSeed = cellIndex + (sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0);
      const cornerTree = createTreeModel(qTreeSeed % 4, textures);
      cornerTree.position.set(sx * 12.9, 0, sz * 12.9);
      cornerTree.scale.setScalar(0.86);
      group.add(cornerTree);

      const nsAlleyTree = createTreeModel((qTreeSeed + 1) % 4, textures);
      nsAlleyTree.position.set(sx * 12.9, 0, sz * 36.0);
      nsAlleyTree.scale.setScalar(0.82);
      group.add(nsAlleyTree);

      const ewAlleyTree = createTreeModel((qTreeSeed + 3) % 4, textures);
      ewAlleyTree.position.set(sx * 36.0, 0, sz * 12.9);
      ewAlleyTree.scale.setScalar(0.82);
      group.add(ewAlleyTree);

      // Authentic Poster-Plastered Brick Compound Walls sealing narrow streetfront gaps
      const wallNS = createPosterBrickWallModel(textures, cellIndex + sx * 3 + sz * 5);
      wallNS.position.set(sx * 12.35, 0, sz * 23.8);
      if (sx < 0) wallNS.rotation.y = Math.PI;
      group.add(wallNS);

      const wallEW = createPosterBrickWallModel(textures, cellIndex + sx * 7 + sz * 2);
      wallEW.position.set(sx * 23.8, 0, sz * 12.35);
      wallEW.rotation.y = sz > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(wallEW);

      // =========================================================================
      // HIGH-DENSITY DHAKA BUILDING FABRIC (9 Buildings per Quadrant = 324 World Buildings!)
      // =========================================================================
      const qSeed = (sx > 0 ? 7 : 2) + (sz > 0 ? 11 : 3);
      const qHash = Math.abs(cellIndex * 29 + qSeed * 13);
      const spawnBuilding = (
        bType: number,
        vSeed: number,
        bx: number,
        bz: number,
        rotY: number,
        isBackRow = false,
        heightStretch = 1.0
      ) => {
        let bMesh: THREE.Group;
        const t = Math.abs(bType) % 20;
        const v = Math.abs(vSeed);
        let baseScale = 0.78;

        if (t === 0 || t === 6 || t === 12 || t === 17) {
          bMesh = createResidentialApartmentModel(v, textures);
          baseScale = 0.76;
        } else if (t === 1 || t === 7 || t === 13) {
          bMesh = createOldDhakaHeritageShophouseModel(v, textures);
          baseScale = 0.85;
        } else if (t === 2 || t === 8 || t === 14) {
          bMesh = createMixedUseMidriseModel(v, textures);
          baseScale = 0.74;
        } else if (t === 3 || t === 15) {
          bMesh = createUnderConstructionBuildingModel(v, textures);
          baseScale = 0.8;
        } else if (t === 4 || t === 16) {
          bMesh = createShoppingMarketPlazaModel(textures, v);
          baseScale = 0.6;
        } else if (t === 5) {
          bMesh = createStreetRestaurantHotelModel(textures);
          baseScale = 0.82;
        } else if (t === 9) {
          bMesh = createDhakaSchoolCollegeModel(v, textures);
          baseScale = 0.64;
        } else if (t === 10) {
          bMesh = createCityClinicHospitalModel(textures);
          baseScale = 0.66;
        } else if (t === 11) {
          bMesh = createCommercialBankTowerModel(textures);
          baseScale = 0.54;
        } else if (t === 18) {
          if (v % 2 === 0) {
            bMesh = createTaxAndBankAnnexModel(textures);
            baseScale = 0.48;
          } else {
            bMesh = createSecretariatOfficeModel(textures);
            baseScale = 0.44;
          }
        } else {
          // Civic landmarks dispersed sparsely
          if (v % 3 === 0) {
            const wrapper = new THREE.Group();
            const m = createMosqueModel(textures);
            m.rotation.y = Math.PI / 2;
            wrapper.add(m);
            bMesh = wrapper;
            baseScale = 0.84;
          } else if (v % 3 === 1) {
            bMesh = createBarAssociationChamberModel(textures);
            baseScale = 0.44;
          } else {
            bMesh = createJudgeCourtModel(textures);
            baseScale = 0.35;
          }
        }

        bMesh.scale.set(baseScale, baseScale * heightStretch, baseScale);
        if (isBackRow) {
          // Disable shadow casting on inner-block skyline towers to preserve crisp performance
          bMesh.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              (obj as THREE.Mesh).castShadow = false;
            }
          });
        }
        bMesh.position.set(bx, 0, bz);
        bMesh.rotation.y = rotY;
        group.add(bMesh);
      };

      const rotNS = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
      const rotEW = sz > 0 ? Math.PI : 0;
      const rotCorner = Math.atan2(-sx, -sz);

      // Compact corner commercial/hotel/shophouse palette (indices 1,2,4,5,7,8,13,14)
      const cornerTypes = [1, 5, 2, 7, 4, 8, 13, 14];
      const cornerType = cornerTypes[(qHash + sx + sz) % cornerTypes.length];

      // Spot 1: Corner Anchor diagonally facing crossing intersection
      spawnBuilding(cornerType, cellIndex * 5 + qSeed, sx * 18.0, sz * 18.0, rotCorner, false, 0.96);

      // Spot 2 & 3: Continuous N-S Streetfront Row
      spawnBuilding(qHash + 2, cellIndex * 7 + qSeed + 1, sx * 17.2, sz * 29.8, rotNS, false, 1.0);
      spawnBuilding(qHash + 6, cellIndex * 11 + qSeed + 2, sx * 17.2, sz * 42.2, rotNS, false, 1.04);

      // Spot 4 & 5: Continuous E-W Streetfront Row
      spawnBuilding(qHash + 9, cellIndex * 13 + qSeed + 3, sx * 29.8, sz * 17.2, rotEW, false, 1.0);
      spawnBuilding(qHash + 13, cellIndex * 17 + qSeed + 4, sx * 42.2, sz * 17.2, rotEW, false, 1.04);

      // Spot 6..9: Multi-tiered Inner-Block Dhaka Concrete Skyline (Apartments, Towers, Under-Construction)
      const skyTypes = [0, 2, 3, 6, 11, 12, 15, 17];
      const st6 = skyTypes[(qHash + 1) % skyTypes.length];
      const st7 = skyTypes[(qHash + 3) % skyTypes.length];
      const st8 = skyTypes[(qHash + 5) % skyTypes.length];
      const st9 = skyTypes[(qHash + 7) % skyTypes.length];

      spawnBuilding(st6, cellIndex * 19 + qSeed + 5, sx * 29.8, sz * 29.8, qHash % 2 === 0 ? rotNS : rotEW, true, 1.15);
      spawnBuilding(st7, cellIndex * 23 + qSeed + 6, sx * 29.8, sz * 42.2, rotEW, true, 1.24);
      spawnBuilding(st8, cellIndex * 29 + qSeed + 7, sx * 42.2, sz * 29.8, rotNS, true, 1.18);
      spawnBuilding(st9, cellIndex * 31 + qSeed + 8, sx * 42.2, sz * 42.2, qHash % 2 === 0 ? rotEW : rotNS, true, 1.32);
    });
  });

  // 2b. Authentic Street Clutter: Passenger Bus Shelters ("যাত্রী ছাউনি"), Corner Highway Signs & Procedural Sidewalk Vendors/Chai/Flower Shops
  const busShelterNS = createDhakaBusShelterModel(cellIndex);
  busShelterNS.position.set(10.35, 0, -21.0);
  busShelterNS.rotation.y = Math.PI; // Facing -X road
  group.add(busShelterNS);

  // Waiting borka-clad passenger standing by the bus shelter
  const shelterWaiter = createBorkaWomanModel(cellIndex + 2, textures);
  shelterWaiter.root.position.set(9.7, 0.26, -19.6);
  shelterWaiter.root.rotation.y = Math.PI / 2; // Facing -X road
  group.add(shelterWaiter.root);

  const busShelterEW = createDhakaBusShelterModel(cellIndex + 1);
  busShelterEW.position.set(-21.0, 0, 10.35);
  busShelterEW.rotation.y = Math.PI / 2; // Facing -Z road
  group.add(busShelterEW);

  if (cellIndex % 2 === 1) {
    const shelterWaiterEW = createBorkaWomanModel(cellIndex + 4, textures);
    shelterWaiterEW.root.position.set(-19.5, 0.26, 9.7);
    shelterWaiterEW.root.rotation.y = 0; // Facing -Z road
    group.add(shelterWaiterEW.root);
  }

  // Corner Green Directional Highway Signs
  const dirSignA = createDhakaDirectionSignModel(cellIndex);
  dirSignA.position.set(10.1, 0, 12.2);
  group.add(dirSignA);

  const dirSignB = createDhakaDirectionSignModel(cellIndex + 1);
  dirSignB.position.set(-12.2, 0, -10.1);
  dirSignB.rotation.y = Math.PI / 2;
  group.add(dirSignB);

  // Procedural Sidewalk Population Script: unique street vendors, chai stalls, flower shops & veggie stands
  const proceduralStalls = populateSidewalksForCell(group, cellIndex, textures, {
    createShobjiStall: () => createShobjiStallModel(textures),
  });
  stalls.push(...proceduralStalls);

  // Waiting parked rickshaw/CNG tucked near sidewalk curb pocket on alternating cells
  if (cellIndex % 2 === 0) {
    const parkedRick = createTrafficRickshawModel(textures, cellIndex);
    parkedRick.position.set(-7.1, 0, 31.0);
    group.add(parkedRick);
  } else {
    const parkedCng = createCngModel(textures);
    parkedCng.position.set(31.0, 0, 7.1);
    parkedCng.rotation.y = -Math.PI / 2;
    group.add(parkedCng);
  }

  // 3. Central 4-Way Traffic Signal Gantry, Police Island (on sidewalk!) & 4-Way Zebra Crossings
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
  const housingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
  const zebraMat = new THREE.MeshStandardMaterial({
    map: textures.zebraCrossing,
    roughness: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const dmpSignMat = new THREE.MeshStandardMaterial({
    map: textures.trafficSignDmp,
    roughness: 0.35,
    metalness: 0.2,
  });

  [-9.5, 9.5].forEach((zz) => {
    const zNS = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 3.6), zebraMat);
    zNS.rotation.x = -Math.PI / 2;
    zNS.position.set(0, 0.02, zz);
    group.add(zNS);

    const zEW = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 3.6), zebraMat);
    zEW.rotation.x = -Math.PI / 2;
    zEW.rotation.z = Math.PI / 2;
    zEW.position.set(zz, 0.02, 0);
    group.add(zEW);
  });

  const redActiveMat = new THREE.MeshBasicMaterial({ color: 0xff2b2b });
  const redDimMat = new THREE.MeshStandardMaterial({ color: 0x3b0707, roughness: 0.7 });
  const yellowActiveMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const yellowDimMat = new THREE.MeshStandardMaterial({ color: 0x361a03, roughness: 0.7 });
  const greenActiveMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const greenDimMat = new THREE.MeshStandardMaterial({ color: 0x042f1a, roughness: 0.7 });

  const redMeshes: THREE.Mesh[] = [];
  const yellowMeshes: THREE.Mesh[] = [];
  const greenMeshes: THREE.Mesh[] = [];

  const buildSignalHead = (xPos: number, yPos: number, zPos: number, rotY = 0) => {
    const head = new THREE.Group();
    head.position.set(xPos, yPos, zPos);
    head.rotation.y = rotY;

    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.9, 0.4), housingMat);
    head.add(box);

    const redLens = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), redActiveMat);
    redLens.position.set(0, 0.6, 0.18);
    head.add(redLens);
    redMeshes.push(redLens);

    const yellowLens = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), yellowDimMat);
    yellowLens.position.set(0, 0, 0.18);
    head.add(yellowLens);
    yellowMeshes.push(yellowLens);

    const greenLens = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), greenDimMat);
    greenLens.position.set(0, -0.6, 0.18);
    head.add(greenLens);
    greenMeshes.push(greenLens);

    return head;
  };

  const gantryGroup = new THREE.Group();
  gantryGroup.position.set(0, 0, 8.6);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 7.2, 8), metalMat);
  pole.position.set(8.6, 3.6, 0);
  gantryGroup.add(pole);
  const trussMain = new THREE.Mesh(new THREE.BoxGeometry(17.6, 0.3, 0.3), metalMat);
  trussMain.position.set(0, 6.7, 0);
  gantryGroup.add(trussMain);
  const dmpSign = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.4, 0.08), dmpSignMat);
  dmpSign.position.set(0, 5.9, 0);
  gantryGroup.add(dmpSign);
  // Dual-sided signal heads so readable approaching from both -Z and +Z
  gantryGroup.add(buildSignalHead(-3.6, 5.6, 0.22, 0));
  gantryGroup.add(buildSignalHead(3.6, 5.6, 0.22, 0));
  gantryGroup.add(buildSignalHead(-3.6, 5.6, -0.22, Math.PI));
  gantryGroup.add(buildSignalHead(3.6, 5.6, -0.22, Math.PI));
  group.add(gantryGroup);

  // Police Island cleanly seated ON the corner sidewalk (-10.1, 0, 10.1) — clear of road lanes
  const policeIsland = new THREE.Group();
  policeIsland.position.set(-10.1, 0, 10.1);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.42, 10), yellowMat);
  pedestal.position.y = 0.21;
  policeIsland.add(pedestal);
  const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.4, 6), metalMat);
  umbrellaPole.position.set(0, 1.7, 0);
  policeIsland.add(umbrellaPole);
  const umbrellaCanopy = new THREE.Mesh(
    new THREE.ConeGeometry(1.5, 0.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, side: THREE.DoubleSide })
  );
  umbrellaCanopy.position.set(0, 3.35, 0);
  policeIsland.add(umbrellaCanopy);

  const policeArmGroup = new THREE.Group();
  policeArmGroup.position.set(0.24, 1.75, 0.2);
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.6, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 })
  );
  torso.position.set(0, 1.55, 0.2);
  policeIsland.add(torso);
  const armMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 })
  );
  armMesh.position.set(0.16, -0.2, 0);
  armMesh.rotation.z = -Math.PI / 4;
  policeArmGroup.add(armMesh);
  policeIsland.add(policeArmGroup);
  group.add(policeIsland);

  // 4. Overhead Dhaka Metro Rail Viaduct (Isolated inside metroGroup so DhakaGameEngine shows it ONLY on central avenue gridX === 0)
  const metroGroup = new THREE.Group();
  const deckY = 9.6;
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x717d8c, roughness: 0.85 });
  const metroBox = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.3, 96.0), concreteMat);
  metroBox.position.set(0, deckY, 0);
  metroGroup.add(metroBox);

  const greenAccentMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.45 });
  [-4.0, 4.0].forEach((bx) => {
    const accent = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 96.0), greenAccentMat);
    accent.position.set(bx, deckY + 0.85, 0);
    metroGroup.add(accent);
  });

  [-44, -24, 24, 44].forEach((pz) => {
    [-8.95, 8.95].forEach((px) => {
      const pier = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, deckY, 8), concreteMat);
      pier.position.set(px, deckY / 2, pz);
      metroGroup.add(pier);
    });
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.9, 1.6), concreteMat);
    crossBeam.position.set(0, deckY - 0.5, pz);
    metroGroup.add(crossBeam);
  });

  if (cellIndex % 2 === 0) {
    const trainMat = new THREE.MeshStandardMaterial({
      map: textures.metroLivery,
      roughness: 0.35,
      metalness: 0.4,
    });
    const trainBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.3, 28.0), trainMat);
    trainBody.position.set(2.0, deckY + 1.85, 16);
    metroGroup.add(trainBody);
  }
  group.add(metroGroup);

  // Festive Bunting Garland overhead along N-S and E-W
  const buntingNS = createFestiveBuntingGarland(18, textures);
  buntingNS.position.set(0, 0, -28);
  group.add(buntingNS);

  const buntingEW = createFestiveBuntingGarland(18, textures);
  buntingEW.rotation.y = Math.PI / 2;
  buntingEW.position.set(28, 0, 0);
  group.add(buntingEW);

  // DSCC Dumpster cleanly seated on sidewalk (-10.4, 0, -17.5)
  const trash = createTrashPileModel(textures);
  trash.position.set(-10.4, 0, -17.5);
  trash.rotation.y = Math.PI / 2;
  group.add(trash);

  const lightRig: TrafficLightRig = {
    root: group,
    redMeshes,
    yellowMeshes,
    greenMeshes,
    policeArmGroup,
    setSignal: (state: 'RED' | 'YELLOW' | 'GREEN') => {
      if (state === 'RED') {
        redMeshes.forEach((m) => (m.material = redActiveMat));
        yellowMeshes.forEach((m) => (m.material = yellowDimMat));
        greenMeshes.forEach((m) => (m.material = greenDimMat));
        policeArmGroup.rotation.z = -1.15;
      } else if (state === 'YELLOW') {
        redMeshes.forEach((m) => (m.material = redDimMat));
        yellowMeshes.forEach((m) => (m.material = yellowActiveMat));
        greenMeshes.forEach((m) => (m.material = greenDimMat));
        policeArmGroup.rotation.z = -0.55;
      } else {
        redMeshes.forEach((m) => (m.material = redDimMat));
        yellowMeshes.forEach((m) => (m.material = yellowDimMat));
        greenMeshes.forEach((m) => (m.material = greenActiveMat));
        policeArmGroup.rotation.z = 0.25;
      }
    },
  };

  lightRig.setSignal('RED');
  return { group, metroGroup, lightRig, stalls, lampBulbs, asphaltMats };
}
