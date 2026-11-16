import * as THREE from 'three';
import { DriverProfile, SignalColor } from '../types/game';
import { ProceduralTexturePack } from './textures';
import { BatchMaterialCache, mergeStaticGroupByMaterial } from './meshBatcher';
import { createCngModel } from './cngModel';
import { createDhakaBusModel } from './busModel';
import { createDhakaTruckModel } from './truckModel';
import { createLegunaModel } from './legunaModel';
import { createTrafficRickshawModel } from './trafficRickshawModel';
import { createDhakaMotorcycleModel } from './motorcycleModel';
import { createDhakaCarModel } from './carModel';
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
  createDhakaMotorcycleModel,
  createDhakaCarModel,
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
  createNewMarketArcadeModel,
  createBuetCampusAcademicModel,
  createDhakaHighriseGlassBankModel,
  createDhakaTinShedBazaarRowModel,
  createDhakaBusCounterPumpModel,
  createDhakaOpenShopModel,
  createSeatedShopkeeperModel,
  OpenShopKind,
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
  createNewMarketArcadeModel,
  createBuetCampusAcademicModel,
  createDhakaHighriseGlassBankModel,
  createDhakaTinShedBazaarRowModel,
  createDhakaBusCounterPumpModel,
  createDhakaOpenShopModel,
};
export type { OpenShopKind };

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
  invincibleAura: THREE.Mesh;
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

export type NpcArchetype =
  | 'gramin'
  | 'smart'
  | 'city_style'
  | 'murubbi'
  | 'feriwala'
  | 'borka';

export interface PedestrianRig {
  root: THREE.Group;
  legL: THREE.Object3D;
  legR: THREE.Object3D;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  walkingSpeed: number;
  direction: number;
  phase: number;
  archetype?: NpcArchetype;
  head?: THREE.Object3D;
  phoneMesh?: THREE.Object3D;
  hasGamcha?: boolean;
  hasHeadBasket?: boolean;
}

export interface CrowBirdRig {
  root: THREE.Group;
  wingL: THREE.Mesh;
  wingR: THREE.Mesh;
  centerX: number;
  centerZ: number;
  orbitRadius: number;
  orbitSpeed: number;
  baseY: number;
  phase: number;
}

export interface KiteRig {
  root: THREE.Group;
  tail: THREE.Mesh;
  centerX: number;
  centerZ: number;
  baseY: number;
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

  // Chai-Break Invincibility Protective Shield Dome (lightweight translucent shell)
  const auraGeo = new THREE.SphereGeometry(1.75, 16, 12);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.24,
    wireframe: false,
    depthWrite: false,
  });
  const invincibleAura = new THREE.Mesh(auraGeo, auraMat);
  invincibleAura.position.set(0, 1.05, -0.05);
  invincibleAura.scale.set(0.95, 0.88, 1.28);
  invincibleAura.visible = false;
  chassisTilt.add(invincibleAura);

  const driverSlot = new THREE.Group();
  chassisTilt.add(driverSlot);

  // Realistic Dhaka rickshaw proportions relative to sidewalks, shops & multi-story buildings
  root.scale.set(0.56, 0.64, 0.64);

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
    invincibleAura,
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
  root.add(lungi);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.24), shirtMat);
  torso.position.set(0, 1.08, 0);
  root.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), skinMat);
  head.position.set(0, 1.48, 0);
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

  root.scale.setScalar(0.78);

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
  skirt.receiveShadow = true;
  root.add(skirt);

  const hemTrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.338, 0.055, 12), trimMat);
  hemTrim.position.set(0, 0.145, 0);
  root.add(hemTrim);

  // 2. Upper Abaya Bodice & Draped Khimar Shawl
  const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.205, 0.4, 10), borkaMat);
  bodice.position.set(0, 1.15, 0);
  root.add(bodice);

  const khimarCape = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.255, 0.34, 10), hijabMat);
  khimarCape.position.set(0, 1.24, 0.01);
  root.add(khimarCape);

  // 3. Head Group with Hijab Wrap + Niqab Face Veil + Eyes (pivots cleanly together!)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.49, 0);

  const headBase = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 10), skinMat);
  headGroup.add(headBase);

  const hijabWrap = new THREE.Mesh(
    new THREE.SphereGeometry(0.162, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.72),
    hijabMat
  );
  hijabWrap.position.set(0, 0.01, 0.015);
  hijabWrap.rotation.x = 0.24;
  headGroup.add(hijabWrap);

  const hijabBackDrape = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.1), hijabMat);
  hijabBackDrape.position.set(0, -0.07, 0.12);
  headGroup.add(hijabBackDrape);

  const useNiqab = seed % 4 !== 3;
  if (useNiqab) {
    const niqab = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.158, 0.135, 10), borkaMat);
    niqab.position.set(0, -0.06, -0.01);
    headGroup.add(niqab);
  }

  [-0.048, 0.048].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), eyeMat);
    eye.position.set(ex, 0.015, -0.14);
    headGroup.add(eye);
  });
  root.add(headGroup);

  // 4. Ankle-pivoted Feet / Sandals stepping beneath gown hem
  const buildFootPivot = (xOff: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(xOff, 0.24, 0);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.17), sandalMat);
    foot.position.set(0, -0.17, -0.02);
    pivot.add(foot);
    return pivot;
  };
  const legL = buildFootPivot(-0.09);
  const legR = buildFootPivot(0.09);
  root.add(legL);
  root.add(legR);

  // 5. Shoulder-pivoted Sleeved Borka Arms + Hands + Shoulder Handbag
  const sleeveGeo = new THREE.CylinderGeometry(0.056, 0.072, 0.42, 8);
  sleeveGeo.translate(0, -0.21, 0);

  const armL = new THREE.Group();
  armL.position.set(-0.23, 1.27, 0);
  const sleeveL = new THREE.Mesh(sleeveGeo, borkaMat);
  armL.add(sleeveL);
  const handL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), skinMat);
  handL.position.set(0, -0.43, 0);
  armL.add(handL);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.23, 1.27, 0);
  const sleeveR = new THREE.Mesh(sleeveGeo, borkaMat);
  armR.add(sleeveR);
  const handR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), skinMat);
  handR.position.set(0, -0.43, 0);
  armR.add(handR);

  // Purse / Market Tote hanging cleanly from right arm
  const purse = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.22), bagMat);
  purse.position.set(0.03, -0.42, -0.03);
  armR.add(purse);

  const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.05), buckleMat);
  clasp.position.set(0.075, -0.38, -0.03);
  armR.add(clasp);
  root.add(armR);

  root.scale.setScalar(0.78);

  return {
    root,
    legL,
    legR,
    armL,
    armR,
    head: headGroup,
    archetype: 'borka',
    walkingSpeed: 1.08 + (seed % 4) * 0.2,
    direction: seed % 2 === 0 ? 1 : -1,
    phase: (seed * 1.93) % (Math.PI * 2),
  };
}

/**
 * ANGRY SHOPKEEPER CHASER ("ক্ষিপ্ত দোকানদার"):
 * Spawns in randomized Dhaka shopkeeper attire (panjabi, shirt, t-shirt, waistcoat,
 * lungi/trouser, optional gamcha/tupi/cap) waving a bamboo stick.
 */
export function createMobModel(seed: number, textures: ProceduralTexturePack): MobRig {
  const root = new THREE.Group();
  root.add(createContactShadowMesh(textures.contactShadow, 0.85, 0.85));

  const h1 = Math.abs((seed * 2654435761) >>> 0);
  const h2 = Math.abs(((seed + 17) * 2246822519) >>> 0);
  const h3 = Math.abs(((seed + 53) * 3266489917) >>> 0);

  const outfitStyle = h1 % 4; // 0: Panjabi, 1: Casual Shirt, 2: T-Shirt/Polo, 3: Vest over Fatua
  const wearsLungi = (h2 % 5) !== 0; // 80% traditional lungi, 20% trouser/pajama
  const headStyle = h3 % 4; // 0: Gamcha headband, 1: White Tupi, 2: Shoulder gamcha + hair, 3: Cap + hair

  const skinPalette = [0xc68642, 0xd99b78, 0xb5743c, 0x8d5524];
  const topPalette = [
    0xf8fafc,
    0xfef08a,
    0x38bdf8,
    0xfb7185,
    0xa7f3d0,
    0x15803d,
    0xd97706,
    0x1d4ed8,
    0xe2e8f0,
    0xb91c1c,
  ];
  const pantPalette = [0x1e293b, 0x334155, 0x27272a, 0xf8fafc, 0x451a03];
  const gamchaColors = [0xdc2626, 0xea580c, 0x059669, 0x991b1b];

  const lungiTex = textures.lungis[h2 % textures.lungis.length];
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinPalette[h1 % skinPalette.length],
    roughness: 0.7,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: topPalette[h2 % topPalette.length],
    roughness: 0.68,
  });
  const lowerMat = wearsLungi
    ? new THREE.MeshStandardMaterial({ map: lungiTex, roughness: 0.78 })
    : new THREE.MeshStandardMaterial({ color: pantPalette[h3 % pantPalette.length], roughness: 0.76 });
  const stickMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
  const gamchaMat = new THREE.MeshStandardMaterial({
    color: gamchaColors[h1 % gamchaColors.length],
    roughness: 0.75,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
  const sandalMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.82 });

  if (wearsLungi) {
    const lungi = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.28, 0.7, 10), lowerMat);
    lungi.position.set(0, 0.56, 0);
    root.add(lungi);
  } else {
    const hips = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.24), lowerMat);
    hips.position.set(0, 0.73, 0);
    root.add(hips);
  }

  // Panjabi knee skirt for Panjabi style
  if (outfitStyle === 0) {
    const panjabiSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.44, 10), topMat);
    panjabiSkirt.position.set(0, 0.72, 0);
    root.add(panjabiSkirt);
  }

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.54, 0.26), topMat);
  torso.position.set(0, 1.14, 0);
  root.add(torso);

  // Vest / Waistcoat over Fatua OR shirt pocket/placket detail
  if (outfitStyle === 3) {
    const vestMat = new THREE.MeshStandardMaterial({
      color: h3 % 2 === 0 ? 0x111827 : 0x78350f,
      roughness: 0.65,
    });
    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.28), vestMat);
    vest.position.set(0, 1.14, 0);
    root.add(vest);
  } else if (outfitStyle === 0 || outfitStyle === 1) {
    const placket = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.26, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
    );
    placket.position.set(0, 1.22, 0.135);
    root.add(placket);
  }

  if (headStyle === 2 || outfitStyle === 1) {
    const shoulderGamcha = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.29), gamchaMat);
    shoulderGamcha.position.set(-0.15, 1.15, 0);
    shoulderGamcha.rotation.z = 0.07;
    root.add(shoulderGamcha);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 10, 10), skinMat);
  head.position.set(0, 1.56, 0);
  root.add(head);

  if (headStyle === 1) {
    const tupi = new THREE.Mesh(
      new THREE.CylinderGeometry(0.135, 0.15, 0.1, 10),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.72 })
    );
    tupi.position.set(0, 1.67, 0);
    root.add(tupi);
  } else {
    const hair = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    hair.position.set(0, 1.57, 0);
    root.add(hair);

    if (headStyle === 0) {
      const gamchaBand = new THREE.Mesh(new THREE.CylinderGeometry(0.164, 0.164, 0.06, 10), gamchaMat);
      gamchaBand.position.set(0, 1.61, 0);
      root.add(gamchaBand);
    } else if (headStyle === 3) {
      const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 });
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.024, 0.14), capMat);
      brim.position.set(0, 1.61, 0.16);
      root.add(brim);
    }
  }

  // Optional shopkeeper beard
  if ((h1 % 3) === 0) {
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.13, 8), hairMat);
    beard.rotation.x = Math.PI;
    beard.position.set(0, 1.43, 0.095);
    root.add(beard);
  }

  const legGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.45, 8);
  const legMat = wearsLungi ? skinMat : lowerMat;
  const legL = new THREE.Mesh(legGeo, legMat);
  legL.position.set(-0.11, 0.23, 0);
  root.add(legL);

  const legR = new THREE.Mesh(legGeo, legMat);
  legR.position.set(0.11, 0.23, 0);
  root.add(legR);

  const shoeGeo = new THREE.BoxGeometry(0.09, 0.06, 0.17);
  const shoeL = new THREE.Mesh(shoeGeo, sandalMat);
  shoeL.position.set(0, -0.21, 0.025);
  legL.add(shoeL);
  const shoeR = new THREE.Mesh(shoeGeo, sandalMat);
  shoeR.position.set(0, -0.21, 0.025);
  legR.add(shoeR);

  const sleeveLMat = outfitStyle === 0 ? topMat : skinMat;
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.46, 8), sleeveLMat);
  armL.position.set(-0.27, 1.14, 0);
  root.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.27, 1.32, 0);
  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.048, 0.46, 8),
    outfitStyle === 0 ? topMat : skinMat
  );
  rightForearm.position.set(0, 0.18, 0.08);
  rightForearm.rotation.x = -0.5;
  armR.add(rightForearm);

  const lathi = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 1.12, 8), stickMat);
  lathi.position.set(0, 0.54, 0.22);
  lathi.rotation.x = -0.35;
  armR.add(lathi);
  root.add(armR);

  root.scale.setScalar(0.78);

  return {
    root,
    legL,
    legR,
    armR,
    armL,
    phase: (seed * 1.37) % (Math.PI * 2),
    speedFactor: 0.92 + (h2 % 5) * 0.05,
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

  // Overlapping colorful Bengali & Election posters on brick walls
  const combinedPosters = [...textures.bangladeshiPosters, ...textures.electionPosters];
  const posterCount = combinedPosters.length;
  [-1.15, 0.05, 1.2].forEach((pz, idx) => {
    const tex =
      idx === 1
        ? textures.electionPosters[Math.abs(seed) % textures.electionPosters.length]
        : combinedPosters[(Math.abs(seed) + idx * 2) % posterCount];
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
 * OVERHEAD HANGING ELECTION POSTER STRING ("রশিতে ঝোলানো নির্বাচনী পোস্টার ও ব্যানার")
 */
export function createElectionPosterStringModel(
  spanWidth: number,
  textures: ProceduralTexturePack,
  yHeight = 5.15
): THREE.Group {
  const rig = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.88 });
  const half = spanWidth * 0.5;

  // Slender bamboo side tie poles seated on curbs
  [-half, half].forEach((px) => {
    const bamboo = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, yHeight + 0.35, 6), poleMat);
    bamboo.position.set(px, (yHeight + 0.35) * 0.5, 0);
    rig.add(bamboo);
  });

  // Gently sagging ribbon displaying laminated B&W & color election posters + vote pennants
  const segs = 10;
  const ribbonGeo = new THREE.PlaneGeometry(spanWidth, 1.45, segs, 1);
  const posAttr = ribbonGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const t = (vx + half) / spanWidth;
    const sag = Math.sin(t * Math.PI) * 0.52;
    posAttr.setY(i, posAttr.getY(i) - sag);
  }
  ribbonGeo.computeVertexNormals();

  const ribbonMat = new THREE.MeshStandardMaterial({
    map: textures.electionPosterRope,
    transparent: true,
    alphaTest: 0.35,
    side: THREE.DoubleSide,
    roughness: 0.55,
  });
  const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon.position.set(0, yHeight - 0.4, 0);
  rig.add(ribbon);

  return rig;
}

/**
 * DHAKA ROADSIDE BAMBOO ELECTION CAMPAIGN BOOTH & LOUDSPEAKER ARCH ("নির্বাচনী ক্যাম্প ও প্রচারণা মাইক")
 */
export function createElectionCampaignCampModel(
  textures: ProceduralTexturePack,
  seed: number
): THREE.Group {
  const camp = new THREE.Group();
  const bambooMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: seed % 2 === 0 ? 0x16a34a : 0xdc2626,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const clothTableMat = new THREE.MeshStandardMaterial({
    color: seed % 2 === 0 ? 0xdc2626 : 0x15803d,
    roughness: 0.68,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.7 });

  // Four corner bamboo posts
  [
    [-0.9, -0.55],
    [0.9, -0.55],
    [-0.9, 0.55],
    [0.9, 0.55],
  ].forEach(([bx, bz]) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.55, 6), bambooMat);
    post.position.set(bx, 1.275, bz);
    camp.add(post);
  });

  // Sloped election cloth canopy
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 1.45), canopyMat);
  roof.position.set(0, 2.55, 0);
  roof.rotation.x = 0.08;
  camp.add(roof);

  // Voter Slip Desk + Tablecloth
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.72, 0.65), clothTableMat);
  table.position.set(0, 0.36, 0);
  table.castShadow = true;
  camp.add(table);

  // Two Big Candidate Election Poster Boards mounted on the camp
  const pTex1 = textures.electionPosters[Math.abs(seed) % textures.electionPosters.length];
  const pTex2 = textures.electionPosters[Math.abs(seed + 1) % textures.electionPosters.length];
  const board1 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 1.18),
    new THREE.MeshBasicMaterial({ map: pTex1, side: THREE.DoubleSide })
  );
  board1.position.set(-0.46, 1.62, 0.58);
  camp.add(board1);

  const board2 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 1.18),
    new THREE.MeshBasicMaterial({ map: pTex2, side: THREE.DoubleSide })
  );
  board2.position.set(0.46, 1.62, 0.58);
  camp.add(board2);

  // Iconic Horn Megaphone Loudspeaker ("প্রচারণা মাইক") clamped on front post!
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.32, 10, 1, true), metalMat);
  horn.rotation.x = Math.PI / 2;
  horn.position.set(0.92, 2.42, 0.72);
  camp.add(horn);

  return camp;
}

/**
 * DSCC / DNCC GREEN FOOTPATH CURB DUSTBIN ("সিটি কর্পোরেশন ডাস্টবিন")
 */
export function createDsccCurbBinModel(): THREE.Group {
  const bin = new THREE.Group();
  const standMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.48 });
  const lidMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });

  [-0.26, 0.26].forEach((px) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.85, 6), standMat);
    leg.position.set(px, 0.425, 0);
    bin.add(leg);
  });

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.54, 10), greenMat);
  drum.position.set(0, 0.56, 0);
  drum.castShadow = true;
  bin.add(drum);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 5, 10), lidMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0.83, 0);
  bin.add(rim);

  return bin;
}

/**
 * CROSS-STREET TANGLED OVERHEAD CABLE SPAN ("রাস্তার আড়াআড়ি তারের জঞ্জাল")
 */
export function createCrossStreetCableSpanModel(spanWidth = 22.8): THREE.Group {
  const span = new THREE.Group();
  const cableMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  const heights = [6.65, 6.82, 7.04, 7.18];
  const half = spanWidth * 0.5;

  heights.forEach((hy, idx) => {
    const zOff = (idx - 1.5) * 0.16;
    const pts = [
      new THREE.Vector3(-half, hy, zOff),
      new THREE.Vector3(-half * 0.5, hy - 0.34 - idx * 0.04, zOff + 0.08),
      new THREE.Vector3(0, hy - 0.5 - idx * 0.05, zOff - 0.05),
      new THREE.Vector3(half * 0.5, hy - 0.32 - idx * 0.04, zOff + 0.06),
      new THREE.Vector3(half, hy, zOff),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.024, 4, false), cableMat);
    span.add(tube);
  });

  return span;
}

/**
 * ANIMATED CIRCLING DHAKA CROWS ("ঢাকার আকাশে কাকের ঝাঁক")
 */
export function createDhakaCrowFlock(count = 10): CrowBirdRig[] {
  const crowMat = new THREE.MeshBasicMaterial({ color: 0x09090b, side: THREE.DoubleSide });
  const bodyGeo = new THREE.ConeGeometry(0.08, 0.36, 5);
  bodyGeo.rotateX(Math.PI / 2);
  const wingGeoL = new THREE.PlaneGeometry(0.32, 0.14);
  wingGeoL.translate(-0.16, 0, 0);
  const wingGeoR = new THREE.PlaneGeometry(0.32, 0.14);
  wingGeoR.translate(0.16, 0, 0);

  const crows: CrowBirdRig[] = [];
  for (let i = 0; i < count; i++) {
    const root = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, crowMat);
    root.add(body);

    const wingL = new THREE.Mesh(wingGeoL, crowMat);
    wingL.rotation.x = Math.PI / 2;
    root.add(wingL);

    const wingR = new THREE.Mesh(wingGeoR, crowMat);
    wingR.rotation.x = Math.PI / 2;
    root.add(wingR);

    crows.push({
      root,
      wingL,
      wingR,
      centerX: ((i % 3) - 1) * 28,
      centerZ: ((Math.floor(i / 3) % 3) - 1) * 28,
      orbitRadius: 9 + (i % 5) * 4.5,
      orbitSpeed: (i % 2 === 0 ? 1 : -1) * (0.28 + (i % 4) * 0.07),
      baseY: 12.5 + (i % 5) * 1.4,
      phase: (i * 1.37) % (Math.PI * 2),
    });
  }
  return crows;
}

/**
 * COLORFUL BANGLADESHI SKY KITES ("ঢাকার আকাশে রঙিন ঘুড়ি")
 */
export function createDhakaKiteFlock(count = 6): KiteRig[] {
  const kiteColors = [0xef4444, 0xfacc15, 0x10b981, 0xec4899, 0x3b82f6, 0xf97316];
  const diamondGeo = new THREE.PlaneGeometry(0.68, 0.68);
  diamondGeo.rotateZ(Math.PI / 4);
  const tailGeo = new THREE.PlaneGeometry(0.1, 0.95);
  tailGeo.translate(0, -0.5, 0);

  const kites: KiteRig[] = [];
  for (let i = 0; i < count; i++) {
    const root = new THREE.Group();
    const bodyMat = new THREE.MeshBasicMaterial({
      color: kiteColors[i % kiteColors.length],
      side: THREE.DoubleSide,
    });
    const tailMat = new THREE.MeshBasicMaterial({
      color: kiteColors[(i + 2) % kiteColors.length],
      side: THREE.DoubleSide,
    });
    const body = new THREE.Mesh(diamondGeo, bodyMat);
    body.rotation.x = 0.35;
    root.add(body);

    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, -0.4, 0.08);
    root.add(tail);

    kites.push({
      root,
      tail,
      centerX: (i % 2 === 0 ? 1 : -1) * (18 + (i % 3) * 14),
      centerZ: (i % 3 === 0 ? 1 : -1) * (16 + (i % 2) * 18),
      baseY: 20 + (i % 3) * 4.5,
      phase: i * 1.25,
    });
  }
  return kites;
}

/**
 * DHAKA 4-LANE AVENUE CENTER MEDIAN DIVIDER & FLOWER PLANTER ("সড়ক বিভাজক ও ফুলের বাগান")
 */
export function createDhakaMedianDividerModel(
  textures: ProceduralTexturePack,
  length = 9.8
): THREE.Group {
  const divider = new THREE.Group();
  const curbMat = new THREE.MeshStandardMaterial({ map: textures.curb, roughness: 0.78 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.95 });
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.78 });
  const bougainvilleaMat = new THREE.MeshStandardMaterial({ color: 0xec4899, roughness: 0.62 });
  const marigoldMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
  const railGreenMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.5, metalness: 0.35 });
  const bollardMat = new THREE.MeshStandardMaterial({ map: textures.cngChevrons, roughness: 0.5 });

  // Painted yellow-black concrete New-Jersey divider curb (height 0.34m, width 0.64m)
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.34, length), curbMat);
  base.position.set(0, 0.17, 0);
  base.receiveShadow = true;
  divider.add(base);

  const soil = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, Math.max(2.0, length - 0.8)), soilMat);
  soil.position.set(0, 0.35, 0);
  divider.add(soil);

  // Authentic Dhaka Green Steel Anti-Glare Road Divider Railing along center
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, length - 0.6), railGreenMat);
  topRail.position.set(0, 0.86, 0);
  divider.add(topRail);

  const postCount = Math.max(3, Math.round(length / 2.2));
  for (let i = 0; i < postCount; i++) {
    const pz = -length / 2 + 0.45 + (i / (postCount - 1)) * (length - 0.9);
    const rPost = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.52, 0.06), railGreenMat);
    rPost.position.set(0, 0.6, pz);
    divider.add(rPost);
  }

  // Bougainvillea & marigold planters tucked symmetrically along the divider
  const shrubCount = Math.max(3, Math.floor(length / 2.2));
  for (let i = 0; i < shrubCount; i++) {
    const bz = -length / 2 + 1.15 + (i / Math.max(1, shrubCount - 1)) * (length - 2.3);
    const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32, 0), bushMat);
    shrub.position.set(0, 0.52, bz);
    divider.add(shrub);

    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 6, 6),
      i % 2 === 0 ? bougainvilleaMat : marigoldMat
    );
    bloom.position.set(i % 2 === 0 ? 0.14 : -0.14, 0.72, bz);
    divider.add(bloom);
  }

  // Reflective DMP arrow/chevron bullnose bollards at divider ends
  const endOff = length / 2 - 0.28;
  [-endOff, endOff].forEach((ez) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.92, 8), bollardMat);
    post.position.set(0, 0.66, ez);
    divider.add(post);
  });

  return divider;
}

/**
 * DHAKA U-TURN BAY ROAD MARKINGS & DMP BLUE SIGNPOST ("ইউ-টার্ন মোড়")
 * Placed inside the 9m gap between concrete divider segments (at +/-28.3m).
 */
export function createUTurnBayMarkerModel(textures: ProceduralTexturePack): THREE.Group {
  const bay = new THREE.Group();

  const uDecalMat = new THREE.MeshStandardMaterial({
    map: textures.uTurnRoadMark,
    transparent: true,
    opacity: 0.94,
    roughness: 0.7,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });

  // Twin curved U-turn arrow decals for both opposing approaches into the bay
  [-2.15, 2.15].forEach((ux, idx) => {
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 4.4), uDecalMat);
    decal.rotation.x = -Math.PI / 2;
    if (idx === 1) decal.rotation.z = Math.PI;
    decal.position.set(ux, 0.022, 0);
    bay.add(decal);
  });

  // DMP Blue Reflective "ইউ-টার্ন / U-TURN" Signboards on both median noses (+/-4.45m)
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.72 });
  const signMat = new THREE.MeshBasicMaterial({ map: textures.uTurnSign });
  [-4.45, 4.45].forEach((sz, idx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.75, 6), poleMat);
    post.position.set(0, 1.38, sz);
    bay.add(post);

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.08), signMat);
    plate.position.set(0, 2.45, sz);
    if (idx === 1) plate.rotation.y = Math.PI;
    bay.add(plate);
  });

  return bay;
}

/**
 * ROADSIDE CNG / LEGUNA STAND SIGNPOST ("সিএনজি ও লেগুনা স্ট্যান্ড")
 */
export function createCngLegunaStandBoardModel(): THREE.Group {
  const stand = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.5, metalness: 0.4 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 244, 116);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('সিএনজি ও লেগুনা স্ট্যান্ড', 128, 54);
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
  ctx.fillText('নির্ধারিত স্টপেজ • ঢাকা', 128, 94);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 3.0, 6), poleMat);
  pole.position.set(0, 1.5, 0);
  stand.add(pole);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.25, 8), yellowMat);
  base.position.set(0, 0.125, 0);
  stand.add(base);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.72, 0.08),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  board.position.set(0, 2.75, 0);
  stand.add(board);

  return stand;
}

/**
 * DHAKA WASA ROADWORK CONES & CAUTION BARRIER ("কাজ চলিতেছে — ওয়াসা")
 */
export function createWasaRoadWorkBarricadeModel(textures: ProceduralTexturePack): THREE.Group {
  const work = new THREE.Group();
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const barrierMat = new THREE.MeshStandardMaterial({ map: textures.cngChevrons, roughness: 0.55 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 });

  // Caution barricade board
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.08), barrierMat);
  board.position.set(0, 0.78, 0);
  work.add(board);
  [-0.62, 0.62].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.96, 6), legMat);
    leg.position.set(lx, 0.48, 0);
    work.add(leg);
  });

  // Pair of orange Dhaka traffic cones
  [-0.95, 0.95].forEach((cx) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.62, 8), coneMat);
    cone.position.set(cx, 0.31, 0.16);
    work.add(cone);

    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.12, 8), stripeMat);
    ring.position.set(cx, 0.32, 0.16);
    work.add(ring);
  });

  return work;
}

/**
 * ICONIC DHAKA TONG CHA-BISCUIT STALL ("রাস্তার ধারের টং চা ও বিস্কুটের দোকান")
 * Open-front wooden stall with seated Cha-Mama shopkeeper visibly tending stove & jars!
 */
export function createDhakaTongChaStallModel(textures: ProceduralTexturePack): THREE.Group {
  const tong = new THREE.Group();
  const tinMat = new THREE.MeshStandardMaterial({ map: textures.corrugatedTin, roughness: 0.72, metalness: 0.25 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.78 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.82 });
  const jarMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.25, transparent: true, opacity: 0.88 });
  const bananaMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.55 });
  const kettleMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.82 });
  const benchMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.65 });

  // Open-front wooden kiosk frame (back wall + side panels + roof, facing +X open to street!)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.95, 2.2), woodMat);
  backWall.position.set(-0.92, 0.975, 0);
  backWall.castShadow = true;
  tong.add(backWall);

  [-1.02, 1.02].forEach((sz) => {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.95, 0.14), woodMat);
    sideWall.position.set(-0.22, 0.975, sz);
    tong.add(sideWall);
  });

  // Seated Tea-Stall Owner ("টংয়ের চা-মামা") inside facing road (+X)
  const tongMama = createSeatedShopkeeperModel('tea_mama', 1, textures, true);
  tongMama.position.set(-0.34, 0, -0.08);
  tongMama.rotation.y = Math.PI / 2;
  tong.add(tongMama);

  // Open serving counter facing road (+X)
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.88, 2.15), counterMat);
  counter.position.set(0.65, 0.44, 0);
  tong.add(counter);

  // Sloped corrugated tin awning roof + warm tungsten bulb inside
  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.08, 2.55), tinMat);
  awning.position.set(0.22, 2.08, 0);
  awning.rotation.z = -0.14;
  awning.castShadow = true;
  tong.add(awning);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 7, 7),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  bulb.position.set(0.25, 1.82, 0);
  tong.add(bulb);

  // Clear plastic biscuit jars & glowing aluminium tea kettle on counter!
  [-0.55, -0.15, 0.25].forEach((jz, idx) => {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.26, 8),
      idx === 1 ? new THREE.MeshStandardMaterial({ color: 0xfb923c, roughness: 0.4 }) : jarMat
    );
    jar.position.set(0.66, 1.02, jz);
    tong.add(jar);
  });

  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.25, 10), kettleMat);
  kettle.position.set(0.66, 1.02, 0.72);
  tong.add(kettle);

  // Hanging bunch of bright yellow Dhaka Sabri Bananas ("কলার ছড়ি")
  const bananaBunch = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.09, 0.42, 7), bananaMat);
  bananaBunch.position.set(0.95, 1.65, -0.75);
  tong.add(bananaBunch);

  // Roadside wooden tea-drinker bench in front
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 1.55), benchMat);
  bench.position.set(1.22, 0.21, 0);
  tong.add(bench);

  return tong;
}

/**
 * INTERACTIVE POWER-UP KIOSK #1: "স্পেশাল চা-ব্রেক" (Chai-Break — Grants Temporary Invincibility Shield)
 * Vibrant emerald & gold Dhaka roadside tea kiosk facing +Z road edge with samovar, biscuit jars, & dual-sided sign.
 */
export function createChaiBreakKioskModel(textures: ProceduralTexturePack): THREE.Group {
  const kiosk = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.72 });
  const counterMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.78 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.32, metalness: 0.65 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.22, metalness: 0.85 });
  const awningMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.58 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x6ee7b7 });
  const cupMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 });

  // Lower booth frame & wooden counter facing +Z road
  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.05, 0.16), baseMat);
  backPanel.position.set(0, 1.025, -0.82);
  kiosk.add(backPanel);

  [-1.08, 1.08].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 2.15, 7), goldMat);
    post.position.set(px, 1.075, 0.65);
    kiosk.add(post);
  });

  const counter = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.9, 0.72), counterMat);
  counter.position.set(0, 0.45, 0.38);
  kiosk.add(counter);

  // Brass tea samovar, kettle & stacked steaming tea cups
  const kettle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.21, 0.34, 10), steelMat);
  kettle.position.set(-0.62, 1.07, 0.38);
  kiosk.add(kettle);

  const ember = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 8), glowMat);
  ember.position.set(-0.62, 0.91, 0.38);
  kiosk.add(ember);

  for (let c = 0; c < 4; c++) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.11, 8), cupMat);
    cup.position.set(0.18 + c * 0.16, 0.96, 0.44);
    kiosk.add(cup);
  }

  // Seated Tea-Mama vendor inside facing +Z road
  const mama = createSeatedShopkeeperModel('tea_mama', 2, textures, true);
  mama.position.set(0.05, 0, -0.34);
  kiosk.add(mama);

  // Sloped bright emerald awning + gold fascia bar
  const awning = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.95), awningMat);
  awning.position.set(0, 2.15, -0.02);
  awning.rotation.x = 0.14;
  kiosk.add(awning);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.14, 0.12), goldMat);
  trim.position.set(0, 2.02, 0.92);
  kiosk.add(trim);

  // Prominent dual-sided rooftop signboard ("স্পেশাল চা-ব্রেক")
  const signMat = new THREE.MeshBasicMaterial({ map: textures.chaiBreakKioskSign });
  const signBox = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.88, 0.1), [
    baseMat,
    baseMat,
    baseMat,
    baseMat,
    signMat,
    signMat,
  ]);
  signBox.position.set(0, 2.66, 0.35);
  kiosk.add(signBox);

  return kiosk;
}

/**
 * INTERACTIVE POWER-UP KIOSK #2: "মামার ঝালমুড়ি" (Jhal-Muri — Grants Short Speed Boost)
 * Fiery crimson-orange Dhaka Jhal-Muri push-cart kiosk facing +Z road edge with glass muri box, spice jars & umbrella.
 */
export function createJhalMuriKioskModel(textures: ProceduralTexturePack): THREE.Group {
  const kiosk = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.72 });
  const cartTrimMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.38, metalness: 0.45 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
  const glassBoxMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    roughness: 0.2,
    transparent: true,
    opacity: 0.78,
  });
  const muriFillMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.85 });
  const canopyRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.56 });
  const chiliMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.48 });

  // Push-cart flatbed + wooden display box + 2 side cart wheels
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.65, 1.05), bodyMat);
  cartBody.position.set(0, 0.62, 0.12);
  kiosk.add(cartBody);

  [-1.12, 1.12].forEach((wx) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12), wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.32, 0.12);
    kiosk.add(wheel);
  });

  // Iconic illuminated Glass Muri Showcase Box filled with crispy puffed rice
  const muriHeap = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.42, 0.58), muriFillMat);
  muriHeap.position.set(-0.36, 1.16, 0.15);
  kiosk.add(muriHeap);

  const glassCase = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.54, 0.68), glassBoxMat);
  glassCase.position.set(-0.36, 1.22, 0.15);
  kiosk.add(glassCase);

  // Mixing bowl ("বাটি"), mustard oil bottle & chili/chanachur jars
  const mixingBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.14, 0.16, 10), cartTrimMat);
  mixingBowl.position.set(0.55, 1.03, 0.25);
  kiosk.add(mixingBowl);

  const chiliJar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.28, 8), chiliMat);
  chiliJar.position.set(0.84, 1.09, -0.02);
  kiosk.add(chiliJar);

  // Seated Jhal-Muri Mama vendor behind cart
  const mama = createSeatedShopkeeperModel('tea_mama', 5, textures, true);
  mama.position.set(0.15, 0, -0.58);
  kiosk.add(mama);

  // Striped Umbrella Pole & Canopy
  const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.05, 6), wheelMat);
  uPole.position.set(0, 1.68, -0.18);
  kiosk.add(uPole);

  const uCanopy = new THREE.Mesh(new THREE.ConeGeometry(1.42, 0.52, 8), canopyRedMat);
  uCanopy.position.set(0, 2.55, -0.18);
  kiosk.add(uCanopy);

  // Prominent dual-sided signboard ("মামার ঝালমুড়ি")
  const signMat = new THREE.MeshBasicMaterial({ map: textures.jhalMuriKioskSign });
  const signBox = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.84, 0.1), [
    bodyMat,
    bodyMat,
    bodyMat,
    bodyMat,
    signMat,
    signMat,
  ]);
  signBox.position.set(0, 2.95, 0.24);
  kiosk.add(signBox);

  return kiosk;
}

/**
 * ROADSIDE PARKED WATER-JAR & FRUIT RICKSHAW VAN CART ("পানির জার / ফলের ভ্যানগাড়ি")
 */
export function createDhakaCurbVanCartModel(isWaterVan: boolean): THREE.Group {
  const van = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.75 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.55 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88 });

  // Flatbed cargo platform
  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.12, 1.9), woodMat);
  bed.position.set(0, 0.54, 0);
  bed.castShadow = true;
  van.add(bed);

  // Side spoked wheels
  [-0.64, 0.64].forEach((wx) => {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 7, 16), tireMat);
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(wx, 0.38, 0.2);
    van.add(wheel);
  });

  // Van handlebar front fork
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.05), frameMat);
  handle.position.set(0, 1.05, -0.95);
  van.add(handle);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.58, 6), frameMat);
  stem.position.set(0, 0.78, -0.95);
  van.add(stem);

  if (isWaterVan) {
    // Classic Dhaka Blue 20L WASA / Jar Water Dispensers stacked on flatbed!
    const jarBlueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.1 });
    [-0.28, 0.28].forEach((jx) => {
      [-0.35, 0.25, 0.7].forEach((jz) => {
        const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.44, 10), jarBlueMat);
        jar.position.set(jx, 0.82, jz);
        van.add(jar);
      });
    });
  } else {
    // Green & Striped Watermelons / Vegetables stacked on cart!
    const melonMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65 });
    const mangoMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.58 });
    [-0.26, 0.26].forEach((mx, xi) => {
      [-0.35, 0.15, 0.6].forEach((mz, zi) => {
        const item = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          (xi + zi) % 2 === 0 ? melonMat : mangoMat
        );
        item.position.set(mx, 0.74, mz);
        van.add(item);
      });
    });
  }

  return van;
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
 * Authentic Dhaka Spray-Painted Brick Boundary Graffiti Wall ("ঢাকা দেয়াল গ্রাফিতি")
 */
export function createDhakaGraffitiWallModel(
  textures: ProceduralTexturePack,
  seed: number
): THREE.Group {
  const wallGroup = new THREE.Group();
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    roughness: 0.9,
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
  const tinTrimMat = new THREE.MeshStandardMaterial({
    map: textures.corrugatedTin,
    roughness: 0.72,
    metalness: 0.3,
  });

  // Main compound masonry wall
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.38, 2.52, 4.6), brickMat);
  wall.position.set(0, 1.26, 0);
  wallGroup.add(wall);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 4.7), capMat);
  cap.position.set(0, 2.58, 0);
  wallGroup.add(cap);

  // Corrugated tin top overhang strip common on Dhaka compound walls
  const tinEdge = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 1.8), tinTrimMat);
  tinEdge.position.set(0, 2.75, ((Math.abs(seed) % 3) - 1) * 1.1);
  tinEdge.rotation.z = 0.14;
  wallGroup.add(tinEdge);

  // Large vivid Dhaka graffiti mural canvas facing road (-X local face)
  const gCount = textures.wallGraffitis.length;
  const gTexA = textures.wallGraffitis[Math.abs(seed) % gCount];
  const gMatA = new THREE.MeshStandardMaterial({ map: gTexA, roughness: 0.72 });
  const muralFront = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), gMatA);
  muralFront.position.set(-0.205, 1.32, 0);
  muralFront.rotation.y = -Math.PI / 2;
  wallGroup.add(muralFront);

  // Opposite side graffiti mural (+X local face) so both alleys/avenues see art
  const gTexB = textures.wallGraffitis[(Math.abs(seed) + 3) % gCount];
  const gMatB = new THREE.MeshStandardMaterial({ map: gTexB, roughness: 0.72 });
  const muralBack = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), gMatB);
  muralBack.position.set(0.205, 1.32, 0);
  muralBack.rotation.y = Math.PI / 2;
  wallGroup.add(muralBack);

  // Small street detail at base: painted brick pair or stray spray can
  const canMat = new THREE.MeshStandardMaterial({
    color: Math.abs(seed) % 2 === 0 ? 0xef4444 : 0x3b82f6,
    roughness: 0.35,
    metalness: 0.65,
  });
  const sprayCan = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.24, 6), canMat);
  sprayCan.position.set(-0.34, 0.12, 1.4);
  wallGroup.add(sprayCan);

  return wallGroup;
}

/**
 * High Cross-Street Dhaka Festival & Book Fair Cloth Banner ("রাস্তার ওপরের উৎসব ব্যানার")
 */
export function createDhakaOverheadBannerModel(
  textures: ProceduralTexturePack,
  variant: number
): THREE.Group {
  const rig = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65, metalness: 0.5 });
  const ropeMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const tex = textures.streetBanners[Math.abs(variant) % textures.streetBanners.length];
  const bannerMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });

  // Left & Right sidewalk support posts (clear of 16m wide road, seated at x = +/-8.9)
  [-8.9, 8.9].forEach((px) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 7.2, 6), poleMat);
    post.position.set(px, 3.6, 0);
    rig.add(post);
  });

  // Overhead guy wire spanning sidewalk to sidewalk at y = 6.75m (well above buses & trucks)
  const wire = new THREE.Mesh(new THREE.BoxGeometry(17.8, 0.035, 0.035), ropeMat);
  wire.position.set(0, 6.72, 0);
  rig.add(wire);

  // Bright Dhaka Bengali cloth banner suspended cleanly above traffic
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 1.35), bannerMat);
  cloth.position.set(0, 6.02, 0);
  rig.add(cloth);

  return rig;
}

/**
 * Roadside Cycle & Rickshaw Tire Puncture Repair Nook ("মামা টায়ার ও সাইকেল মেরামত")
 */
export function createTirePunctureShopNookModel(): THREE.Group {
  const nook = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45, metalness: 0.4 });

  // Wooden repair stool
  const stool = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 0.48), woodMat);
  stool.position.set(0, 0.21, 0);
  nook.add(stool);

  // Stacked black spare rickshaw/cycle tires leaning & piled
  for (let i = 0; i < 3; i++) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.065, 6, 12), tireMat);
    tire.position.set(0.45 + i * 0.06, 0.34, -0.18 + i * 0.14);
    tire.rotation.y = 0.25;
    nook.add(tire);
  }

  // Tall red manual air pump
  const pumpBody = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.045, 0.72, 6), pumpMat);
  pumpBody.position.set(-0.36, 0.36, 0.18);
  nook.add(pumpBody);
  const pumpHandle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), tireMat);
  pumpHandle.position.set(-0.36, 0.74, 0.18);
  nook.add(pumpHandle);

  return nook;
}

/**
 * Dhaka WASA Green Junction Box + Corner Yellow-Black Safety Bollards
 */
export function createWasaHydrantAndBollardModel(): THREE.Group {
  const prop = new THREE.Group();
  const wasaGreen = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55, metalness: 0.3 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65 });

  // WASA box
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.92, 0.38), wasaGreen);
  box.position.set(0, 0.46, 0);
  prop.add(box);

  // Twin yellow-black corner curb bollards
  [-0.55, 0.55].forEach((bz) => {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.52, 8), blackMat);
    base.position.set(0, 0.26, bz);
    prop.add(base);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.09, 0.28, 8), yellowMat);
    tip.position.set(0, 0.66, bz);
    prop.add(tip);
  });

  return prop;
}

/**
 * Iconic 1954 Dhaka New Market Terracotta & Cream Entry Arch Gate ("ঢাকা নিউ মার্কেট তোরণ")
 */
export function createNewMarketArchGateModel(textures: ProceduralTexturePack): THREE.Group {
  const gate = new THREE.Group();
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf5ebd6, roughness: 0.78 });
  const terracottaMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    color: 0xb94a38,
    roughness: 0.85,
  });
  const signMat = new THREE.MeshBasicMaterial({ map: textures.newMarketArchSign });

  // Twin side gatehouse pillars
  [-1.75, 1.75].forEach((pz) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 4.1, 0.72), terracottaMat);
    pillar.position.set(0, 2.05, pz);
    gate.add(pillar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.28, 0.88), creamMat);
    cap.position.set(0, 4.18, pz);
    gate.add(cap);
  });

  // Overhead curved-style header lintel & sign fascia
  const beam = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.05, 4.35), creamMat);
  beam.position.set(0, 3.85, 0);
  gate.add(beam);

  const crown = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.25, 4.55), terracottaMat);
  crown.position.set(0, 4.46, 0);
  gate.add(crown);

  // Double-sided iconic "ঢাকা নিউ মার্কেট ★ ১৯৫৪" plaque
  const plaqueFront = new THREE.Mesh(new THREE.PlaneGeometry(3.55, 0.88), signMat);
  plaqueFront.position.set(-0.31, 3.85, 0);
  plaqueFront.rotation.y = -Math.PI / 2;
  gate.add(plaqueFront);

  const plaqueBack = new THREE.Mesh(new THREE.PlaneGeometry(3.55, 0.88), signMat);
  plaqueBack.position.set(0.31, 3.85, 0);
  plaqueBack.rotation.y = Math.PI / 2;
  gate.add(plaqueBack);

  return gate;
}

/**
 * Dhaka New Market — Gawsia Pedestrian Foot Overbridge ("নিউ মার্কেট ⇄ গাউছিয়া ফুটওভার ব্রিজ")
 * Spans E-W avenue cleanly at clear height y = 5.55m (buses/trucks drive freely underneath).
 */
export function createNewMarketFootOverbridgeModel(textures: ProceduralTexturePack): THREE.Group {
  const ob = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.48, metalness: 0.55 });
  const yellowRailMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({
    map: textures.corrugatedTin,
    color: 0x0284c7,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });
  const bannerMat = new THREE.MeshBasicMaterial({ map: textures.newMarketOverbridgeBanner });

  // Main overhead walkway deck spanning z = -10.4..+10.4 (20.8m)
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.26, 20.8), deckMat);
  deck.position.set(0, 5.65, 0);
  ob.add(deck);

  // Yellow safety truss guardrails along both bridge faces
  [-1.08, 1.08].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 20.8), yellowRailMat);
    rail.position.set(rx, 6.28, 0);
    ob.add(rail);
  });

  // Corrugated blue shelter roof over bridge
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.12, 21.0), roofMat);
  roof.position.set(0, 7.9, 0);
  ob.add(roof);

  // Sidewalk support columns & stairs (seated cleanly on E-W sidewalks at z = +/-10.15)
  [-10.15, 10.15].forEach((sz) => {
    [-0.95, 0.95].forEach((px) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 5.65, 6), steelMat);
      col.position.set(px, 2.825, sz);
      ob.add(col);
    });
    // Sloped stair ramp descending along sidewalk towards +X (from x = 0 to +4.8)
    const stair = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.24, 1.65), steelMat);
    stair.position.set(2.8, 2.95, sz);
    stair.rotation.z = -0.78;
    ob.add(stair);
  });

  // Double-sided overhead "নিউ মার্কেট ⇄ গাউছিয়া ⇄ চন্দ্রিমা" signage facing approaching E-W drivers
  [-1.22, 1.22].forEach((bx) => {
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 1.15), bannerMat);
    banner.position.set(bx, 6.32, 0);
    banner.rotation.y = bx < 0 ? -Math.PI / 2 : Math.PI / 2;
    ob.add(banner);
  });

  return ob;
}

/**
 * New Market Footpath Hanging Saree / Garment Bazaar Stall ("নিউ মার্কেট শাড়ি-কাপড় হ্যাঙ্গার স্টল")
 */
export function createNewMarketGarmentHangStallModel(textures: ProceduralTexturePack): THREE.Group {
  const stall = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.65 });
  const awningMat = new THREE.MeshStandardMaterial({
    map: textures.marketStripedAwning,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const garmentMat = new THREE.MeshStandardMaterial({
    map: textures.newMarketGarmentRack,
    roughness: 0.65,
    side: THREE.DoubleSide,
  });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });

  // Wooden display table
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.68, 2.2), tableMat);
  table.position.set(0, 0.34, 0);
  stall.add(table);

  // Two steel posts + overhead hanging rail with colorful sarees/panjabis
  [-1.0, 1.0].forEach((pz) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 2.45, 6), metalMat);
    post.position.set(0, 1.225, pz);
    stall.add(post);
  });

  const rackDisplay = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 1.55), garmentMat);
  rackDisplay.position.set(0.05, 1.55, 0);
  rackDisplay.rotation.y = Math.PI / 2;
  stall.add(rackDisplay);

  // Striped bazaar tarpaulin roof
  const awning = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 2.55), awningMat);
  awning.position.set(0.15, 2.45, 0);
  awning.rotation.z = -0.18;
  stall.add(awning);

  return stall;
}

/**
 * Nilkhet Old Book Market Footpath Table ("নীলক্ষেত পুরাতন বই বাজার স্টল")
 */
export function createNilkhetBookTableModel(textures: ProceduralTexturePack): THREE.Group {
  const stall = new THREE.Group();
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.85 });
  const booksMat = new THREE.MeshStandardMaterial({ map: textures.nilkhetBooksTex, roughness: 0.7 });
  const umbrellaMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.55,
    side: THREE.DoubleSide,
  });

  const table = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.66, 2.2), tableMat);
  table.position.set(0, 0.33, 0);
  stall.add(table);

  // Stacked colorful book blocks on table
  [-0.55, 0.55].forEach((bz, bi) => {
    const stack = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.45 + bi * 0.14, 0.85), booksMat);
    stack.position.set(0, 0.88 + bi * 0.07, bz);
    stall.add(stack);
  });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), tableMat);
  pole.position.set(-0.2, 1.55, 0);
  stall.add(pole);

  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.18, 0.42, 8), umbrellaMat);
  canopy.position.set(-0.2, 2.52, 0);
  stall.add(canopy);

  return stall;
}

/**
 * DHAKA MEGA T-UNIPOLE BILLBOARD ("ঢাকার মেগা বিলবোর্ড ও হোর্ডিং")
 * Galvanized steel monopole + catwalk + floodlight hoods + double-sided backlit ad board
 */
export function createDhakaUnipoleBillboardModel(
  textures: ProceduralTexturePack,
  variant: number
): THREE.Group {
  const rig = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.48,
    metalness: 0.72,
  });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88 });
  const hoodMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.6 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const texA = textures.billboards[Math.abs(variant) % textures.billboards.length];
  const texB = textures.billboards[(Math.abs(variant) + 2) % textures.billboards.length];

  // Concrete pedestal + tall monopole column
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.55, 1.15), baseMat);
  plinth.position.set(0, 0.275, 0);
  rig.add(plinth);

  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 7.6, 8), steelMat);
  column.position.set(0, 3.9, 0);
  rig.add(column);

  // Steel backing cabinet (6.2m x 3.1m)
  const frame = new THREE.Mesh(new THREE.BoxGeometry(6.3, 3.2, 0.36), steelMat);
  frame.position.set(0, 8.6, 0);
  rig.add(frame);

  const faceFront = new THREE.Mesh(
    new THREE.PlaneGeometry(6.0, 2.95),
    new THREE.MeshBasicMaterial({ map: texA })
  );
  faceFront.position.set(0, 8.6, 0.2);
  rig.add(faceFront);

  const faceBack = new THREE.Mesh(
    new THREE.PlaneGeometry(6.0, 2.95),
    new THREE.MeshBasicMaterial({ map: texB })
  );
  faceBack.position.set(0, 8.6, -0.2);
  faceBack.rotation.y = Math.PI;
  rig.add(faceBack);

  // Lower maintenance catwalk & top 3 floodlight brackets
  const catwalk = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.1, 0.9), steelMat);
  catwalk.position.set(0, 6.95, 0.35);
  rig.add(catwalk);

  [-2.0, 0, 2.0].forEach((lx) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.95), steelMat);
    arm.position.set(lx, 10.22, 0.52);
    rig.add(arm);

    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), hoodMat);
    lamp.position.set(lx, 10.18, 0.95);
    rig.add(lamp);

    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.1), bulbMat);
    glow.position.set(lx, 10.1, 0.95);
    glow.rotation.x = Math.PI / 2;
    rig.add(glow);
  });

  return rig;
}

/**
 * LAMP-POST HANGING VERTICAL BANNER / FESTOON ("ল্যাম্পপোস্ট ব্যানার ও ফেস্টুন")
 */
export function createLampPostBannerModel(
  textures: ProceduralTexturePack,
  variant: number
): THREE.Group {
  const fest = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.7 });
  const tex = textures.verticalBanners[Math.abs(variant) % textures.verticalBanners.length];
  const bannerMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.52,
    side: THREE.DoubleSide,
  });

  [-0.72, 0.72].forEach((by) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 0.05), metalMat);
    bar.position.set(0.38, by, 0);
    fest.add(bar);
  });

  const canvas = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 1.38), bannerMat);
  canvas.position.set(0.4, 0, 0);
  fest.add(canvas);

  return fest;
}

/**
 * DHAKA TRAFFIC POLICE BOX ("ডিএমপি ট্রাফিক পুলিশ বক্স")
 * Blue-white DMP octagonal/square corner booth with sloped tin roof, frosted glass windows & AC condenser.
 */
export function createTrafficPoliceBoxModel(textures: ProceduralTexturePack): THREE.Group {
  const box = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.88 });
  const wallWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
  const dmpBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.16,
    metalness: 0.55,
  });
  const tinRoofMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.42,
    metalness: 0.35,
  });
  const signMat = new THREE.MeshStandardMaterial({
    map: textures.trafficSignDmp,
    roughness: 0.4,
  });

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.25, 2.35), baseMat);
  plinth.position.set(0, 0.125, 0);
  box.add(plinth);

  const lowerWall = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.05, 2.05), dmpBlueMat);
  lowerWall.position.set(0, 0.77, 0);
  lowerWall.castShadow = true;
  box.add(lowerWall);

  const upperCabin = new THREE.Mesh(new THREE.BoxGeometry(2.02, 1.15, 2.02), wallWhiteMat);
  upperCabin.position.set(0, 1.87, 0);
  box.add(upperCabin);

  const windowBand = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.72, 1.72), glassMat);
  windowBand.position.set(0, 1.9, 0);
  box.add(windowBand);

  const windowBand2 = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.72, 2.08), glassMat);
  windowBand2.position.set(0, 1.9, 0);
  box.add(windowBand2);

  const roofCap = new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.72, 4), tinRoofMat);
  roofCap.rotation.y = Math.PI / 4;
  roofCap.position.set(0, 2.8, 0);
  box.add(roofCap);

  const dmpHeader = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.48, 0.08), signMat);
  dmpHeader.position.set(0, 2.68, 1.08);
  box.add(dmpHeader);

  return box;
}

/**
 * DHAKA ROADSIDE bKASH / NAGAD / FLEXILOAD UMBRELLA KIOSK ("বিকাশ ও মোবাইল রিচার্জ ছাতা স্ট্যান্ড")
 */
export function createBkashUmbrellaStandModel(variant = 0): THREE.Group {
  const stand = new THREE.Group();
  const isBkash = variant % 2 === 0;
  const brandColor = isBkash ? 0xe2136e : 0xea580c; // Iconic bKash magenta or Nagad orange
  const brandMat = new THREE.MeshStandardMaterial({
    color: brandColor,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });

  const table = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.78, 0.56), whiteMat);
  table.position.set(0, 0.39, 0);
  table.castShadow = true;
  stand.add(table);

  const apron = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.48, 0.58), brandMat);
  apron.position.set(0, 0.36, 0);
  stand.add(apron);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.35, 6), metalMat);
  pole.position.set(0, 1.18, 0);
  stand.add(pole);

  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.44, 8), brandMat);
  umbrella.position.set(0, 2.42, 0);
  stand.add(umbrella);

  const stool = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.2, 0.44, 8),
    new THREE.MeshStandardMaterial({ color: isBkash ? 0x1d4ed8 : 0x16a34a, roughness: 0.65 })
  );
  stool.position.set(0, 0.22, -0.52);
  stand.add(stool);

  return stand;
}

/**
 * DHAKA CURB PLANTER & REFLECTIVE TRAFFIC CONES ("রোডসাইড ফুলের টব ও ট্রাফিক কোন")
 */
export function createCurbPlanterAndConesModel(): THREE.Group {
  const group = new THREE.Group();
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.78 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.65 });
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.48 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });

  const pot = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 1.45), concreteMat);
  pot.position.set(0, 0.21, 0);
  group.add(pot);

  [-0.38, 0.38].forEach((pz, idx) => {
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.32, 7, 6), leafMat);
    bush.position.set(0, 0.56, pz);
    group.add(bush);

    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), flowerMat);
    bloom.position.set(idx === 0 ? 0.14 : -0.14, 0.76, pz);
    group.add(bloom);
  });

  // Reflective orange-white traffic cone alongside planter
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.58, 8), coneMat);
  cone.position.set(0, 0.29, 1.05);
  group.add(cone);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.14, 8), stripeMat);
  collar.position.set(0, 0.34, 1.05);
  group.add(collar);

  return group;
}

/**
 * DHAKA SKYLINE TELECOM LATTICE TOWER & WATER TANK CLUSTER
 * Placed cleanly on inner skyline blocks for unmistakable Dhaka terrace silhouettes.
 */
export function createDhakaSkylineTelecomTowerModel(): THREE.Group {
  const tower = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.5,
    metalness: 0.65,
  });
  const whiteSteelMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.48,
    metalness: 0.55,
  });
  const drumMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35 });
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // Two-tier red/white telecom mast + rooftop Gazi water tanks
  const lowerMast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.9, 6.5, 4), whiteSteelMat);
  lowerMast.position.set(0, 3.25, 0);
  tower.add(lowerMast);

  const upperMast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.44, 6.5, 4), steelMat);
  upperMast.position.set(0, 9.75, 0);
  tower.add(upperMast);

  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), beaconMat);
  beacon.position.set(0, 13.15, 0);
  tower.add(beacon);

  [0, Math.PI * 0.66, Math.PI * 1.33].forEach((ang) => {
    const sector = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.4, 0.18), dishMat);
    sector.position.set(Math.sin(ang) * 0.6, 11.4, Math.cos(ang) * 0.6);
    sector.rotation.y = ang;
    tower.add(sector);
  });

  // Flanking black "Gazi Tank" rooftop water drums
  [-1.3, 1.3].forEach((tx, idx) => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.72, 1.55, 10), drumMat);
    tank.position.set(tx, 0.78, idx === 0 ? 1.1 : -1.1);
    tower.add(tank);
  });

  return tower;
}

/**
 * ANIMATED DHAKA METRO RAIL (MRT LINE-6) 4-COACH TRAIN
 * Glides smoothly along the overhead concrete viaduct (y = 10.25+ deck clearance, centered on track).
 */
export function createDhakaMetroTrainModel(textures: ProceduralTexturePack): THREE.Group {
  const train = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    map: textures.metroLivery,
    roughness: 0.32,
    metalness: 0.45,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.4,
    metalness: 0.45,
  });
  const redTrimMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 });
  const greenTrimMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.35 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.12,
    metalness: 0.8,
  });
  const headGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const tailGlowMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

  // 4 Articulated Metro Coaches along local Z (spanning -23m to +23m)
  const coachCenters = [-16.2, -5.4, 5.4, 16.2];
  coachCenters.forEach((cz, idx) => {
    const coach = new THREE.Mesh(new THREE.BoxGeometry(2.65, 2.35, 10.2), bodyMat);
    coach.position.set(0, 1.18, cz);
    coach.castShadow = true;
    train.add(coach);

    const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.28, 6.4), roofMat);
    hvac.position.set(0, 2.48, cz);
    train.add(hvac);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.69, 0.18, 10.22),
      idx % 2 === 0 ? greenTrimMat : redTrimMat
    );
    stripe.position.set(0, 0.36, cz);
    train.add(stripe);

    const coupler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.85, 0.65), glassMat);
    if (idx < 3) {
      coupler.position.set(0, 1.15, cz + 5.4);
      train.add(coupler);
    }
  });

  // Sloped Aerodynamic Nose Cab at -Z Front & +Z Rear + Glowing Twin Headlights
  const noseFront = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.85, 1.25), roofMat);
  noseFront.position.set(0, 1.05, -21.65);
  noseFront.rotation.x = 0.25;
  train.add(noseFront);

  const frontCabGlass = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.95, 0.25), glassMat);
  frontCabGlass.position.set(0, 1.52, -21.9);
  frontCabGlass.rotation.x = 0.25;
  train.add(frontCabGlass);

  [-0.78, 0.78].forEach((hx) => {
    const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 10), headGlowMat);
    hl.rotation.x = Math.PI / 2;
    hl.position.set(hx, 0.68, -22.26);
    train.add(hl);

    const tl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 10), tailGlowMat);
    tl.rotation.x = Math.PI / 2;
    tl.position.set(hx, 0.72, 21.34);
    train.add(tl);
  });

  return train;
}

export type SharedCellTemplateMap = Map<
  number,
  {
    staticBatch: THREE.Group;
    metroBatch: THREE.Group;
  }
>;

/**
 * INFINITE 2D CITY SUPER-CELL (96m x 96m)
 * Seamless 4-way Dhaka New Market street grid tile with zero Z-fighting, zero dead ends,
 * dense 9-buildings-per-quadrant architecture, Metro viaduct, New Market arches & overbridges,
 * electric poles & tangled wires, passenger bus shelters, poster & graffiti brick walls, stalls & lush trees.
 * Static geometry is merged by canonical material and cached across 4 curated templates for ultra-fast loading.
 */
export interface CityCellStallData {
  mesh: THREE.Group;
  active: boolean;
  isVeggie: boolean;
  category?: SidewalkStallCategory;
  localX: number;
  localZ: number;
}

export interface CityCellOpenShopData {
  kind: OpenShopKind;
  localX: number;
  localZ: number;
  cooldown: number;
}

export type VendorKioskKind = 'chai_break' | 'jhal_muri';

export interface CityCellVendorKioskData {
  kind: VendorKioskKind;
  localX: number;
  localZ: number;
  cooldown: number;
  beaconGroup: THREE.Group;
  floatingGem: THREE.Mesh;
}

export function posMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Signals appear far apart (~every 384m / 4 blocks along each avenue) */
export function isSignalIntersection(gridX: number, gridZ: number): boolean {
  return posMod(gridX + gridZ, 4) === 0;
}

/** U-turn bays appear sparsely (~every 384m / 4 blocks along N-S and E-W roads, on the +28.3m arm) */
export function hasNsUTurnBay(gridX: number, gridZ: number): boolean {
  return posMod(gridZ, 4) === 2 && posMod(gridX, 1) === 0;
}

export function hasEwUTurnBay(gridX: number, gridZ: number): boolean {
  return posMod(gridX, 4) === 2 && posMod(gridZ, 1) === 0;
}

export interface CityGridCellResult {
  group: THREE.Group;
  metroGroup: THREE.Group;
  signalGroup: THREE.Group;
  nsMedianSolid: THREE.Group;
  nsMedianUTurn: THREE.Group;
  ewMedianSolid: THREE.Group;
  ewMedianUTurn: THREE.Group;
  lightRig: TrafficLightRig;
  stalls: CityCellStallData[];
  openShops: CityCellOpenShopData[];
  vendorKiosks: CityCellVendorKioskData[];
  lampBulbs: THREE.Mesh[];
  asphaltMats: THREE.MeshStandardMaterial[];
}

interface SharedCellInfraAssets {
  asphaltMat: THREE.MeshStandardMaterial;
  centerAsphaltMat: THREE.MeshStandardMaterial;
  centerGeo: THREE.PlaneGeometry;
  armGeo: THREE.PlaneGeometry;
  bulbGeo: THREE.SphereGeometry;
  bulbMat: THREE.MeshBasicMaterial;
  metalMat: THREE.MeshStandardMaterial;
  yellowMat: THREE.MeshStandardMaterial;
  housingMat: THREE.MeshStandardMaterial;
  dmpSignMat: THREE.MeshStandardMaterial;
  umbrellaMat: THREE.MeshStandardMaterial;
  policeClothMat: THREE.MeshStandardMaterial;
  redActiveMat: THREE.MeshBasicMaterial;
  redDimMat: THREE.MeshStandardMaterial;
  yellowActiveMat: THREE.MeshBasicMaterial;
  yellowDimMat: THREE.MeshStandardMaterial;
  greenActiveMat: THREE.MeshBasicMaterial;
  greenDimMat: THREE.MeshStandardMaterial;
  sigBoxGeo: THREE.BoxGeometry;
  sigLensGeo: THREE.SphereGeometry;
  poleGeo: THREE.CylinderGeometry;
  trussGeo: THREE.BoxGeometry;
  dmpSignGeo: THREE.BoxGeometry;
  pedestalGeo: THREE.CylinderGeometry;
  umbrellaPoleGeo: THREE.CylinderGeometry;
  umbrellaCanopyGeo: THREE.ConeGeometry;
  torsoGeo: THREE.BoxGeometry;
  armGeoShort: THREE.CylinderGeometry;
  buildingProtos: Map<string, THREE.Group>;
  zebraStopBatch: THREE.Group;
  nsMedianSolidBatch: THREE.Group;
  nsMedianUTurnBatch: THREE.Group;
  ewMedianSolidBatch: THREE.Group;
  ewMedianUTurnBatch: THREE.Group;
}

const cellInfraCache = new WeakMap<BatchMaterialCache, SharedCellInfraAssets>();

function buildMedianVariantBatch(
  textures: ProceduralTexturePack,
  axis: 'NS' | 'EW',
  withUTurnBay: boolean,
  batchCache?: BatchMaterialCache
): THREE.Group {
  const root = new THREE.Group();
  const yellowLineMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
  const solidLineGeo = new THREE.PlaneGeometry(0.16, 33.4);
  const innerLineGeo = new THREE.PlaneGeometry(0.16, 10.2);
  const outerLineGeo = new THREE.PlaneGeometry(0.16, 14.0);

  const placeArm = (sign: -1 | 1, hasGap: boolean) => {
    if (!hasGap) {
      const solidMed = createDhakaMedianDividerModel(textures, 33.2);
      if (axis === 'NS') {
        solidMed.position.set(0, 0, sign * 30.2);
      } else {
        solidMed.rotation.y = Math.PI / 2;
        solidMed.position.set(sign * 30.2, 0, 0);
      }
      root.add(solidMed);

      [-0.44, 0.44].forEach((off) => {
        const line = new THREE.Mesh(solidLineGeo, yellowLineMat);
        line.rotation.x = -Math.PI / 2;
        if (axis === 'NS') {
          line.position.set(off, 0.019, sign * 30.2);
        } else {
          line.rotation.z = Math.PI / 2;
          line.position.set(sign * 30.2, 0.019, off);
        }
        root.add(line);
      });
    } else {
      const innerMed = createDhakaMedianDividerModel(textures, 9.8);
      const outerMed = createDhakaMedianDividerModel(textures, 13.7);
      const uMarker = createUTurnBayMarkerModel(textures);
      if (axis === 'NS') {
        innerMed.position.set(0, 0, sign * 18.9);
        outerMed.position.set(0, 0, sign * 39.65);
        uMarker.position.set(0, 0, sign * 28.3);
      } else {
        innerMed.rotation.y = Math.PI / 2;
        innerMed.position.set(sign * 18.9, 0, 0);
        outerMed.rotation.y = Math.PI / 2;
        outerMed.position.set(sign * 39.65, 0, 0);
        uMarker.rotation.y = Math.PI / 2;
        uMarker.position.set(sign * 28.3, 0, 0);
      }
      root.add(innerMed);
      root.add(outerMed);
      root.add(uMarker);

      [-0.44, 0.44].forEach((off) => {
        const lineIn = new THREE.Mesh(innerLineGeo, yellowLineMat);
        lineIn.rotation.x = -Math.PI / 2;
        const lineOut = new THREE.Mesh(outerLineGeo, yellowLineMat);
        lineOut.rotation.x = -Math.PI / 2;
        if (axis === 'NS') {
          lineIn.position.set(off, 0.019, sign * 18.9);
          lineOut.position.set(off, 0.019, sign * 39.65);
        } else {
          lineIn.rotation.z = Math.PI / 2;
          lineIn.position.set(sign * 18.9, 0.019, off);
          lineOut.rotation.z = Math.PI / 2;
          lineOut.position.set(sign * 39.65, 0.019, off);
        }
        root.add(lineIn);
        root.add(lineOut);
      });
    }
  };

  // -arm (-30.2) is ALWAYS solid unbroken median; +arm (+28.3/+30.2) toggles between U-turn bay and solid
  placeArm(-1, false);
  placeArm(1, withUTurnBay);

  return batchCache ? mergeStaticGroupByMaterial(root, batchCache, false) : root;
}

function createInfraAssets(
  textures: ProceduralTexturePack,
  batchCache?: BatchMaterialCache
): SharedCellInfraAssets {
  const zebraStopRoot = new THREE.Group();
  const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
  const stopNSGeo = new THREE.PlaneGeometry(15.2, 0.42);
  [-11.8, 11.8].forEach((stopPos) => {
    const stopNS = new THREE.Mesh(stopNSGeo, whiteLineMat);
    stopNS.rotation.x = -Math.PI / 2;
    stopNS.position.set(0, 0.019, stopPos);
    zebraStopRoot.add(stopNS);

    const stopEW = new THREE.Mesh(stopNSGeo, whiteLineMat);
    stopEW.rotation.x = -Math.PI / 2;
    stopEW.rotation.z = Math.PI / 2;
    stopEW.position.set(stopPos, 0.019, 0);
    zebraStopRoot.add(stopEW);
  });

  const zebraMat = new THREE.MeshStandardMaterial({
    map: textures.zebraCrossing,
    roughness: 0.75,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  [-9.5, 9.5].forEach((zz) => {
    const zNS = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 3.6), zebraMat);
    zNS.rotation.x = -Math.PI / 2;
    zNS.position.set(0, 0.02, zz);
    zebraStopRoot.add(zNS);

    const zEW = new THREE.Mesh(new THREE.PlaneGeometry(15.2, 3.6), zebraMat);
    zEW.rotation.x = -Math.PI / 2;
    zEW.rotation.z = Math.PI / 2;
    zEW.position.set(zz, 0.02, 0);
    zebraStopRoot.add(zEW);
  });

  const zebraStopBatch = batchCache
    ? mergeStaticGroupByMaterial(zebraStopRoot, batchCache, false)
    : zebraStopRoot;

  return {
    asphaltMat: new THREE.MeshStandardMaterial({
      map: textures.asphalt,
      bumpMap: textures.asphaltBump,
      bumpScale: 0.035,
      roughness: 0.86,
      metalness: 0.04,
      envMapIntensity: 0.14,
    }),
    centerAsphaltMat: new THREE.MeshStandardMaterial({
      color: 0x262d37,
      roughness: 0.88,
      metalness: 0.04,
      envMapIntensity: 0.14,
    }),
    centerGeo: new THREE.PlaneGeometry(16, 16),
    armGeo: new THREE.PlaneGeometry(16, 40),
    bulbGeo: new THREE.SphereGeometry(0.22, 6, 6),
    bulbMat: new THREE.MeshBasicMaterial({ color: 0xfde68a }),
    metalMat: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.8 }),
    yellowMat: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 }),
    housingMat: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 }),
    dmpSignMat: new THREE.MeshStandardMaterial({
      map: textures.trafficSignDmp,
      roughness: 0.35,
      metalness: 0.2,
    }),
    umbrellaMat: new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.5,
      side: THREE.DoubleSide,
    }),
    policeClothMat: new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 }),
    redActiveMat: new THREE.MeshBasicMaterial({ color: 0xff2b2b }),
    redDimMat: new THREE.MeshStandardMaterial({ color: 0x3b0707, roughness: 0.7 }),
    yellowActiveMat: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
    yellowDimMat: new THREE.MeshStandardMaterial({ color: 0x361a03, roughness: 0.7 }),
    greenActiveMat: new THREE.MeshBasicMaterial({ color: 0x22c55e }),
    greenDimMat: new THREE.MeshStandardMaterial({ color: 0x042f1a, roughness: 0.7 }),
    sigBoxGeo: new THREE.BoxGeometry(0.7, 1.9, 0.4),
    sigLensGeo: new THREE.SphereGeometry(0.2, 8, 8),
    poleGeo: new THREE.CylinderGeometry(0.22, 0.3, 7.2, 8),
    trussGeo: new THREE.BoxGeometry(17.6, 0.3, 0.3),
    dmpSignGeo: new THREE.BoxGeometry(4.6, 1.4, 0.08),
    pedestalGeo: new THREE.CylinderGeometry(1.1, 1.2, 0.42, 10),
    umbrellaPoleGeo: new THREE.CylinderGeometry(0.04, 0.04, 3.4, 6),
    umbrellaCanopyGeo: new THREE.ConeGeometry(1.5, 0.6, 8),
    torsoGeo: new THREE.BoxGeometry(0.42, 0.6, 0.24),
    armGeoShort: new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6),
    buildingProtos: new Map<string, THREE.Group>(),
    zebraStopBatch,
    nsMedianSolidBatch: buildMedianVariantBatch(textures, 'NS', false, batchCache),
    nsMedianUTurnBatch: buildMedianVariantBatch(textures, 'NS', true, batchCache),
    ewMedianSolidBatch: buildMedianVariantBatch(textures, 'EW', false, batchCache),
    ewMedianUTurnBatch: buildMedianVariantBatch(textures, 'EW', true, batchCache),
  };
}

export function createCityGridCell(
  cellIndex: number,
  textures: ProceduralTexturePack,
  batchCache?: BatchMaterialCache,
  sharedTemplates?: SharedCellTemplateMap
): CityGridCellResult {
  const group = new THREE.Group();
  const templateKey = ((cellIndex % 4) + 4) % 4;
  const existingTemplate = sharedTemplates?.get(templateKey);
  const staticBatchRoot = new THREE.Group();
  staticBatchRoot.name = `cell_${cellIndex}_static`;
  const stalls: CityCellStallData[] = [];
  const lampBulbs: THREE.Mesh[] = [];

  let infra: SharedCellInfraAssets | undefined;
  if (batchCache) {
    infra = cellInfraCache.get(batchCache);
    if (!infra) {
      infra = createInfraAssets(textures, batchCache);
      cellInfraCache.set(batchCache, infra);
    }
  } else {
    infra = createInfraAssets(textures);
  }

  // 1. Non-overlapping 5-piece Asphalt Road Cross (Width = 16m, Span = 96m) using shared assets
  const asphaltMat = infra.asphaltMat;
  const centerAsphaltMat = infra.centerAsphaltMat;
  const asphaltMats = [asphaltMat, centerAsphaltMat];

  const centerBox = new THREE.Mesh(infra.centerGeo, centerAsphaltMat);
  centerBox.rotation.x = -Math.PI / 2;
  centerBox.position.set(0, 0.008, 0);
  centerBox.receiveShadow = true;
  group.add(centerBox);

  [-28, 28].forEach((az) => {
    const nsArm = new THREE.Mesh(infra!.armGeo, asphaltMat);
    nsArm.rotation.x = -Math.PI / 2;
    nsArm.position.set(0, 0.008, az);
    nsArm.receiveShadow = true;
    group.add(nsArm);
  });
  [-28, 28].forEach((ax) => {
    const ewArm = new THREE.Mesh(infra!.armGeo, asphaltMat);
    ewArm.rotation.x = -Math.PI / 2;
    ewArm.rotation.z = Math.PI / 2;
    ewArm.position.set(ax, 0.008, 0);
    ewArm.receiveShadow = true;
    group.add(ewArm);
  });

  // Note: Always extract the 8 interactive streetlamp bulbs directly into `group` (`lampBulbs`)
  ([-1, 1] as const).forEach((sx) => {
    ([-1, 1] as const).forEach((sz) => {
      const addLampBulb = (lx: number, lz: number, armDirX: number, armDirZ: number) => {
        const bulb = new THREE.Mesh(infra!.bulbGeo, infra!.bulbMat);
        bulb.position.set(lx + armDirX * 1.1, 6.5, lz + armDirZ * 1.1);
        group.add(bulb);
        lampBulbs.push(bulb);
      };
      addLampBulb(sx * 9.0, sz * 26, -sx, 0);
      addLampBulb(sx * 26, sz * 9.0, 0, -sz);
    });
  });

  if (!existingTemplate) {
    // 1b. Crisp 4-Lane Divided Road Markings (White 2-Lane Dashes & Curb Edge Lines; Medians & Stop/Zebra are toggleable!)
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const laneDashGeo = new THREE.PlaneGeometry(0.18, 4.4);
    const edgeNSGeo = new THREE.PlaneGeometry(0.18, 36.2);

    // 2+2 Carriageway Dashed White Lane Splitters at +/-3.85m
    [-44, -36, -28, -20, 20, 28, 36, 44].forEach((pos) => {
      [-3.85, 3.85].forEach((laneX) => {
        const dashNS = new THREE.Mesh(laneDashGeo, whiteLineMat);
        dashNS.rotation.x = -Math.PI / 2;
        dashNS.position.set(laneX, 0.019, pos);
        staticBatchRoot.add(dashNS);

        const dashEW = new THREE.Mesh(laneDashGeo, whiteLineMat);
        dashEW.rotation.x = -Math.PI / 2;
        dashEW.rotation.z = Math.PI / 2;
        dashEW.position.set(pos, 0.019, laneX);
        staticBatchRoot.add(dashEW);
      });
    });

    ([-1, 1] as const).forEach((s) => {
      ([-1, 1] as const).forEach((armSign) => {
        const edgeNS = new THREE.Mesh(edgeNSGeo, whiteLineMat);
        edgeNS.rotation.x = -Math.PI / 2;
        edgeNS.position.set(s * 7.6, 0.018, armSign * 29.9);
        staticBatchRoot.add(edgeNS);

        const edgeEW = new THREE.Mesh(edgeNSGeo, whiteLineMat);
        edgeEW.rotation.x = -Math.PI / 2;
        edgeEW.rotation.z = Math.PI / 2;
        edgeEW.position.set(armSign * 29.9, 0.018, s * 7.6);
        staticBatchRoot.add(edgeEW);
      });
    });

    // Cultural Intersection Street Alpana ("চারুকলা রাস্তার আলপনা") on alternating crossings
    if (cellIndex % 2 === 0) {
      const alpanaMat = new THREE.MeshStandardMaterial({
        map: textures.streetAlpana,
        transparent: true,
        opacity: 0.9,
        roughness: 0.85,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      });
      const alpanaMesh = new THREE.Mesh(new THREE.PlaneGeometry(10.5, 10.5), alpanaMat);
      alpanaMesh.rotation.x = -Math.PI / 2;
      alpanaMesh.position.set(0, 0.016, 0);
      staticBatchRoot.add(alpanaMesh);
    }

    // 1c. Dhaka Raised Speed Breakers ("গতিরোধক / স্পিড ব্রেকার") & Gutter Storm Drains
    const speedBumpMat = new THREE.MeshStandardMaterial({
      map: textures.cngChevrons,
      roughness: 0.65,
    });
    const speedBumpGeo = new THREE.CylinderGeometry(0.18, 0.24, 15.0, 8);
    [-16.8, 16.8].forEach((sbPos) => {
      const sbNS = new THREE.Mesh(speedBumpGeo, speedBumpMat);
      sbNS.rotation.z = Math.PI / 2;
      sbNS.scale.set(1.0, 1.0, 0.55);
      sbNS.position.set(0, 0.035, sbPos);
      staticBatchRoot.add(sbNS);

      const sbEW = new THREE.Mesh(speedBumpGeo, speedBumpMat);
      sbEW.rotation.x = Math.PI / 2;
      sbEW.scale.set(1.0, 1.0, 0.55);
      sbEW.position.set(sbPos, 0.035, 0);
      staticBatchRoot.add(sbEW);
    });

    const drainMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.72,
    });
    const drainGeo = new THREE.BoxGeometry(0.58, 0.04, 1.25);
    [-24, 24].forEach((dPos) => {
      [-7.45, 7.45].forEach((sidePos) => {
        const drainNS = new THREE.Mesh(drainGeo, drainMat);
        drainNS.position.set(sidePos, 0.02, dPos);
        staticBatchRoot.add(drainNS);

        const drainEW = new THREE.Mesh(drainGeo, drainMat);
        drainEW.rotation.y = Math.PI / 2;
        drainEW.position.set(dPos, 0.02, sidePos);
        staticBatchRoot.add(drainEW);
      });
    });

    // 2. Four Quadrant Sidewalks, Curbs, Dense New Market Urban Building Blocks & Dhaka Street Ambience
    const curbMat = new THREE.MeshStandardMaterial({ map: textures.curb, roughness: 0.78 });
    const swMat = new THREE.MeshStandardMaterial({
      map: textures.sidewalk,
      bumpMap: textures.sidewalkBump,
      bumpScale: 0.028,
      roughness: 0.84,
    });
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
        staticBatchRoot.add(curbNS);

        const curbEW = new THREE.Mesh(ewCurbGeo, curbMat);
        curbEW.position.set(sx * 28.275, 0.16, sz * 8.275);
        curbEW.receiveShadow = true;
        staticBatchRoot.add(curbEW);

        // Flush non-overlapping sidewalks
        const swNS = new THREE.Mesh(nsSwGeo, swMat);
        swNS.position.set(sx * 10.15, 0.13, sz * 28.275);
        swNS.receiveShadow = true;
        staticBatchRoot.add(swNS);

        const swEW = new THREE.Mesh(ewSwGeo, swMat);
        swEW.position.set(sx * 29.875, 0.13, sz * 10.15);
        swEW.receiveShadow = true;
        staticBatchRoot.add(swEW);

        // Paved Urban City Block Pad
        const pad = new THREE.Mesh(blockPadGeo, blockPadMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(sx * 29.875, 0.015, sz * 29.875);
        pad.receiveShadow = true;
        staticBatchRoot.add(pad);

        // Streetlamp poles + Vertical Dhaka Festoon Banners (batched static, matching dynamic bulbs above)
        const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 6.8, 6), poleMat);
        pole1.position.set(sx * 9.0, 3.4, sz * 26);
        staticBatchRoot.add(pole1);

        const bannerPole1 = createLampPostBannerModel(textures, cellIndex + (sx > 0 ? 1 : 2));
        bannerPole1.position.set(sx * 9.0, 4.15, sz * 26);
        bannerPole1.rotation.y = sx < 0 ? 0 : Math.PI;
        staticBatchRoot.add(bannerPole1);

        const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 6.8, 6), poleMat);
        pole2.position.set(sx * 26, 3.4, sz * 9.0);
        staticBatchRoot.add(pole2);

        const bannerPole2 = createLampPostBannerModel(textures, cellIndex + (sz > 0 ? 3 : 0));
        bannerPole2.position.set(sx * 26, 4.15, sz * 9.0);
        bannerPole2.rotation.y = sz < 0 ? -Math.PI / 2 : Math.PI / 2;
        staticBatchRoot.add(bannerPole2);

        // Overhead DESCO/DPDC Electric Utility Poles & Tangled Black Cable Bundles
        const poleNS = createUtilityPoleAndWiresCorridor((cellIndex + (sx > 0 ? 1 : 0)) % 2 === 0);
        poleNS.position.set(sx * 11.4, 0, sz * 29.0);
        if (sx < 0) poleNS.rotation.y = Math.PI;
        staticBatchRoot.add(poleNS);

        const poleEW = createUtilityPoleAndWiresCorridor(sz > 0 && sx < 0);
        poleEW.position.set(sx * 29.0, 0, sz * 11.4);
        poleEW.rotation.y = sz > 0 ? Math.PI / 2 : -Math.PI / 2;
        staticBatchRoot.add(poleEW);

        // Footpath Yellow-Black Pedestrian Guardrails flanking crossing approaches
        const railNS = createFootpathRailingModel(5.2);
        railNS.position.set(sx * 8.75, 0, sz * 15.2);
        staticBatchRoot.add(railNS);

        const railEW = createFootpathRailingModel(5.2);
        railEW.rotation.y = Math.PI / 2;
        railEW.position.set(sx * 15.2, 0, sz * 8.75);
        staticBatchRoot.add(railEW);

        // Lush Dhaka Avenue Trees
        const qTreeSeed = cellIndex + (sx > 0 ? 1 : 0) + (sz > 0 ? 2 : 0);
        const cornerTree = createTreeModel(qTreeSeed % 4, textures);
        cornerTree.position.set(sx * 12.9, 0, sz * 12.9);
        cornerTree.scale.setScalar(0.86);
        staticBatchRoot.add(cornerTree);

        const nsAlleyTree = createTreeModel((qTreeSeed + 1) % 4, textures);
        nsAlleyTree.position.set(sx * 12.9, 0, sz * 36.0);
        nsAlleyTree.scale.setScalar(0.82);
        staticBatchRoot.add(nsAlleyTree);

        const ewAlleyTree = createTreeModel((qTreeSeed + 3) % 4, textures);
        ewAlleyTree.position.set(sx * 36.0, 0, sz * 12.9);
        ewAlleyTree.scale.setScalar(0.82);
        staticBatchRoot.add(ewAlleyTree);

        // Iconic 1954 Dhaka New Market Terracotta-Cream Arch Gates at plaza entrances
        if (sx * sz > 0) {
          const archGate = createNewMarketArchGateModel(textures);
          archGate.position.set(sx * 12.85, 0, sz * 17.6);
          if (sx < 0) archGate.rotation.y = Math.PI;
          staticBatchRoot.add(archGate);
        }

        // Mix of Dhaka Wall Graffiti Murals & Poster-Plastered Brick Compound Walls along streetfront gaps
        const wallSeedA = cellIndex * 3 + sx * 3 + sz * 5;
        const wallNS =
          (cellIndex + (sx > 0 ? 1 : 0) + (sz > 0 ? 0 : 1)) % 2 === 0
            ? createDhakaGraffitiWallModel(textures, wallSeedA)
            : createPosterBrickWallModel(textures, wallSeedA);
        wallNS.position.set(sx * 12.35, 0, sz * 23.8);
        if (sx < 0) wallNS.rotation.y = Math.PI;
        staticBatchRoot.add(wallNS);

        const wallSeedB = cellIndex * 5 + sx * 7 + sz * 2;
        const wallEW =
          (cellIndex + (sx > 0 ? 0 : 1) + (sz > 0 ? 1 : 0)) % 2 === 0
            ? createDhakaGraffitiWallModel(textures, wallSeedB)
            : createPosterBrickWallModel(textures, wallSeedB);
        wallEW.position.set(sx * 23.8, 0, sz * 12.35);
        wallEW.rotation.y = sz > 0 ? -Math.PI / 2 : Math.PI / 2;
        staticBatchRoot.add(wallEW);

        // Dedicated Second Graffiti Wall further down each avenue gap (clear of alley trees at 36.0)
        const alleyGraffitiNS = createDhakaGraffitiWallModel(textures, wallSeedA + 2);
        alleyGraffitiNS.position.set(sx * 12.4, 0, sz * 42.0);
        if (sx < 0) alleyGraffitiNS.rotation.y = Math.PI;
        staticBatchRoot.add(alleyGraffitiNS);

        const alleyGraffitiEW = createDhakaGraffitiWallModel(textures, wallSeedB + 4);
        alleyGraffitiEW.position.set(sx * 42.0, 0, sz * 12.4);
        alleyGraffitiEW.rotation.y = sz > 0 ? -Math.PI / 2 : Math.PI / 2;
        staticBatchRoot.add(alleyGraffitiEW);

        if ((sx > 0 && sz > 0) || (sx < 0 && sz < 0)) {
          const wasa = createWasaHydrantAndBollardModel();
          wasa.position.set(sx * 9.05, 0.25, sz * 12.2);
          staticBatchRoot.add(wasa);
        }

        if (sx > 0 && sz < 0) {
          const punctureNook = createTirePunctureShopNookModel();
          punctureNook.position.set(10.85, 0.26, -34.0);
          punctureNook.rotation.y = -Math.PI / 2;
          staticBatchRoot.add(punctureNook);
        }

        // =========================================================================
        // DHAKA NEW MARKET / GAWSIA / NILKHET URBAN FABRIC (324 World Buildings!)
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
          const t = Math.abs(bType) % 24;
          const v = Math.abs(vSeed);
          const vSlot = v % 3;
          let baseScale = 0.78;
          if (t === 1 || t === 7 || t === 13 || t === 14) baseScale = 0.68;
          else if (t === 4 || t === 8 || t === 16) baseScale = 0.62;
          else if (t === 20 || t === 21) baseScale = 0.68;
          else if (t === 22) baseScale = 0.74;
          else if (t === 23) baseScale = 0.74;
          else if (t === 19) baseScale = 0.72;
          else if (t === 2 || t === 12) baseScale = 0.85;
          else if (t === 0 || t === 6 || t === 17) baseScale = 0.76;
          else if (t === 3 || t === 15) baseScale = 0.8;
          else if (t === 5) baseScale = 0.82;
          else if (t === 9) baseScale = 0.64;
          else if (t === 10) baseScale = 0.66;
          else if (t === 11) baseScale = 0.54;
          else if (t === 18) baseScale = 0.74;
          else baseScale = vSlot === 0 ? 0.84 : vSlot === 1 ? 0.44 : 0.48;

          const bKey = `${t}_${vSlot}`;
          let proto = infra!.buildingProtos.get(bKey);
          if (!proto) {
            if (t === 1 || t === 7 || t === 13 || t === 14) {
              proto = createNewMarketArcadeModel(textures, vSlot);
            } else if (t === 4 || t === 8 || t === 16) {
              proto = createShoppingMarketPlazaModel(textures, vSlot);
            } else if (t === 20 || t === 21) {
              proto = createBuetCampusAcademicModel(textures, vSlot);
            } else if (t === 22) {
              proto = createDhakaHighriseGlassBankModel(textures, vSlot);
            } else if (t === 23) {
              proto = createDhakaTinShedBazaarRowModel(textures, vSlot);
            } else if (t === 19) {
              proto = createDhakaBusCounterPumpModel(textures, vSlot);
            } else if (t === 2 || t === 12) {
              proto = createOldDhakaHeritageShophouseModel(vSlot, textures);
            } else if (t === 0 || t === 6 || t === 17) {
              proto = createResidentialApartmentModel(vSlot, textures);
            } else if (t === 3 || t === 15) {
              proto = createUnderConstructionBuildingModel(vSlot, textures);
            } else if (t === 5) {
              proto = createStreetRestaurantHotelModel(textures);
            } else if (t === 9) {
              proto = createDhakaSchoolCollegeModel(vSlot, textures);
            } else if (t === 10) {
              proto = createCityClinicHospitalModel(textures);
            } else if (t === 11) {
              proto = createCommercialBankTowerModel(textures);
            } else if (t === 18) {
              proto = createMixedUseMidriseModel(vSlot, textures);
            } else {
              if (vSlot === 0) {
                const wrapper = new THREE.Group();
                const m = createMosqueModel(textures);
                m.rotation.y = Math.PI / 2;
                wrapper.add(m);
                proto = wrapper;
              } else if (vSlot === 1) {
                proto = createBarAssociationChamberModel(textures);
              } else {
                proto = createTaxAndBankAnnexModel(textures);
              }
            }
            if (batchCache) {
              proto = mergeStaticGroupByMaterial(proto, batchCache, false);
            }
            infra!.buildingProtos.set(bKey, proto);
          }

          bMesh = proto.clone();
          const archHeightBoost = isBackRow ? 1.56 : 1.38;
          const footprintScale = Math.min(baseScale * 1.06, 0.92);
          bMesh.scale.set(
            footprintScale,
            footprintScale * heightStretch * archHeightBoost,
            footprintScale
          );
          if (isBackRow) {
            bMesh.traverse((obj) => {
              if ((obj as THREE.Mesh).isMesh) {
                (obj as THREE.Mesh).castShadow = false;
              }
            });
          }
          bMesh.position.set(bx, 0, bz);
          bMesh.rotation.y = rotY;
          staticBatchRoot.add(bMesh);
        };

        const rotNS = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        const rotEW = sz > 0 ? Math.PI : 0;
        const rotCorner = Math.atan2(-sx, -sz);

        // Streetfront corners & rows showcase diverse Dhaka New Market, Nilkhet, DU/BUET, Hawkers Tin-Shed, Bus Counters & Banks
        const cornerTypes = [1, 4, 20, 23, 5, 19, 8, 2, 13, 22];
        const cornerType = cornerTypes[(qHash + sx + sz) % cornerTypes.length];

        // Spot 1: Corner Anchor diagonally facing crossing intersection
        spawnBuilding(cornerType, cellIndex * 5 + qSeed, sx * 18.0, sz * 18.0, rotCorner, false, 0.98);

        // Spot 2 & 3: Continuous N-S Streetfront Dhaka Market & Heritage Row
        const nsRowA = [1, 20, 4, 23][(qHash + 1) % 4];
        const nsRowB = [23, 19, 7, 12][(qHash + 2) % 4];
        spawnBuilding(nsRowA, cellIndex * 7 + qSeed + 1, sx * 17.2, sz * 29.8, rotNS, false, 1.0);
        spawnBuilding(nsRowB, cellIndex * 11 + qSeed + 2, sx * 17.2, sz * 42.2, rotNS, false, 1.04);

        // Spot 4 & 5: Continuous E-W Streetfront New Market / Nilkhet / Science Lab Row
        const ewRowA = [13, 22, 8, 21][(qHash + 3) % 4];
        const ewRowB = [5, 14, 19, 2][(qHash + 4) % 4];
        spawnBuilding(ewRowA, cellIndex * 13 + qSeed + 3, sx * 29.8, sz * 17.2, rotEW, false, 1.0);
        spawnBuilding(ewRowB, cellIndex * 17 + qSeed + 4, sx * 42.2, sz * 17.2, rotEW, false, 1.04);

        // Spot 6..9: Multi-tiered Inner-Block Skyline (High-Rise Banks, Apartments, Under-Construction, Towers)
        const skyTypes = [0, 22, 6, 11, 15, 16, 18, 20];
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

    // 2b. Authentic New Market Street Clutter: Bus Shelters, Foot Overbridge, Saree Hangers, Nilkhet Books & Signs
    const busShelterNS = createDhakaBusShelterModel(cellIndex);
    busShelterNS.position.set(10.35, 0, -21.0);
    busShelterNS.rotation.y = Math.PI;
    staticBatchRoot.add(busShelterNS);

    const shelterWaiter = createBorkaWomanModel(cellIndex + 2, textures);
    shelterWaiter.root.position.set(9.7, 0.26, -19.6);
    shelterWaiter.root.rotation.y = Math.PI / 2;
    staticBatchRoot.add(shelterWaiter.root);

    const busShelterEW = createDhakaBusShelterModel(cellIndex + 1);
    busShelterEW.position.set(-21.0, 0, 10.35);
    busShelterEW.rotation.y = Math.PI / 2;
    staticBatchRoot.add(busShelterEW);

    if (cellIndex % 2 === 1) {
      const shelterWaiterEW = createBorkaWomanModel(cellIndex + 4, textures);
      shelterWaiterEW.root.position.set(-19.5, 0.26, 9.7);
      shelterWaiterEW.root.rotation.y = 0;
      staticBatchRoot.add(shelterWaiterEW.root);
    }

    // Iconic New Market — Gawsia Pedestrian Foot Overbridge across E-W avenue (clear of N-S Metro!)
    const overbridge = createNewMarketFootOverbridgeModel(textures);
    overbridge.position.set(34.5, 0, 0);
    staticBatchRoot.add(overbridge);

    // Colorful New Market Hanging Garment Stalls & Nilkhet Book Tables on clear sidewalk spots
    const garmentStallA = createNewMarketGarmentHangStallModel(textures);
    garmentStallA.position.set(-10.45, 0.26, -24.5);
    staticBatchRoot.add(garmentStallA);

    const garmentStallB = createNewMarketGarmentHangStallModel(textures);
    garmentStallB.position.set(10.45, 0.26, 24.5);
    garmentStallB.rotation.y = Math.PI;
    staticBatchRoot.add(garmentStallB);

    const nilkhetBooksA = createNilkhetBookTableModel(textures);
    nilkhetBooksA.position.set(24.5, 0.26, 10.45);
    nilkhetBooksA.rotation.y = -Math.PI / 2;
    staticBatchRoot.add(nilkhetBooksA);

    const nilkhetBooksB = createNilkhetBookTableModel(textures);
    nilkhetBooksB.position.set(-24.5, 0.26, -10.45);
    nilkhetBooksB.rotation.y = Math.PI / 2;
    staticBatchRoot.add(nilkhetBooksB);

    // Corner Green Directional Highway Signs
    const dirSignA = createDhakaDirectionSignModel(cellIndex);
    dirSignA.position.set(10.1, 0, 12.2);
    staticBatchRoot.add(dirSignA);

    const dirSignB = createDhakaDirectionSignModel(cellIndex + 1);
    dirSignB.position.set(-12.2, 0, -10.1);
    dirSignB.rotation.y = Math.PI / 2;
    staticBatchRoot.add(dirSignB);

    // Waiting parked Dhaka cars, motorcycles, rickshaws & CNGs tucked neatly in curb pockets
    if (cellIndex % 4 === 0) {
      const parkedCar = createDhakaCarModel(textures, cellIndex);
      parkedCar.position.set(-6.9, 0, 31.0);
      staticBatchRoot.add(parkedCar);

      const parkedMoto = createDhakaMotorcycleModel(textures, cellIndex + 1);
      parkedMoto.position.set(7.25, 0, -29.0);
      parkedMoto.rotation.y = Math.PI;
      staticBatchRoot.add(parkedMoto);
    } else if (cellIndex % 4 === 1) {
      const parkedCng = createCngModel(textures);
      parkedCng.position.set(31.0, 0, 7.05);
      parkedCng.rotation.y = -Math.PI / 2;
      staticBatchRoot.add(parkedCng);

      const parkedMoto = createDhakaMotorcycleModel(textures, cellIndex);
      parkedMoto.position.set(-29.0, 0, -7.25);
      parkedMoto.rotation.y = Math.PI / 2;
      staticBatchRoot.add(parkedMoto);
    } else if (cellIndex % 4 === 2) {
      const parkedRick = createTrafficRickshawModel(textures, cellIndex);
      parkedRick.position.set(-7.1, 0, 31.0);
      staticBatchRoot.add(parkedRick);

      const parkedCar = createDhakaCarModel(textures, cellIndex + 3);
      parkedCar.position.set(31.5, 0, -6.95);
      parkedCar.rotation.y = Math.PI / 2;
      staticBatchRoot.add(parkedCar);
    } else {
      const parkedMoto = createDhakaMotorcycleModel(textures, cellIndex + 2);
      parkedMoto.position.set(-7.25, 0, -31.0);
      staticBatchRoot.add(parkedMoto);
    }

    // 2c. Authentic Dhaka Corner Props: DMP Traffic Police Box, bKash Umbrella Kiosks, Curb Planters & Telecom Skyline
    const policeBox = createTrafficPoliceBoxModel(textures);
    policeBox.position.set(10.6, 0.26, -12.6);
    policeBox.rotation.y = -Math.PI / 4;
    staticBatchRoot.add(policeBox);

    const bkashA = createBkashUmbrellaStandModel(cellIndex);
    bkashA.position.set(-10.45, 0.26, 20.6);
    bkashA.rotation.y = Math.PI / 2;
    staticBatchRoot.add(bkashA);

    const bkashB = createBkashUmbrellaStandModel(cellIndex + 1);
    bkashB.position.set(20.6, 0.26, 10.45);
    staticBatchRoot.add(bkashB);

    [-1, 1].forEach((sSign) => {
      const planterNS = createCurbPlanterAndConesModel();
      planterNS.position.set(sSign * 8.75, 0.26, -sSign * 19.2);
      staticBatchRoot.add(planterNS);

      const planterEW = createCurbPlanterAndConesModel();
      planterEW.rotation.y = Math.PI / 2;
      planterEW.position.set(sSign * 19.2, 0.26, sSign * 8.75);
      staticBatchRoot.add(planterEW);
    });

    // Rooftop Dhaka Telecom Lattice Tower & Twin Black Water Tanks on inner skyline block corner
    const telecomCorner = createDhakaSkylineTelecomTowerModel();
    telecomCorner.position.set(cellIndex % 2 === 0 ? 35.8 : -35.8, 17.5, cellIndex % 2 === 0 ? -35.8 : 35.8);
    staticBatchRoot.add(telecomCorner);
  }

  // Procedural Sidewalk Population Script:
  // Populate smashable stalls every cell (batched internally for zero draw-call bloat),
  // while static footpath vendors are built only on template creation cells (0..3)!
  const proceduralStalls = populateSidewalksForCell(
    existingTemplate ? group : staticBatchRoot,
    cellIndex,
    textures,
    {
      createShobjiStall: () => createShobjiStallModel(textures),
      batchCache,
      skipStaticFootpathStalls: Boolean(existingTemplate),
    }
  );
  for (const stall of proceduralStalls) {
    group.add(stall.mesh);
  }
  stalls.push(...proceduralStalls);

  // 3. Central 4-Way Traffic Signal Gantry & Police Island (reusing shared geometries & materials across all cells)
  const {
    metalMat,
    yellowMat,
    housingMat,
    dmpSignMat,
    umbrellaMat,
    policeClothMat,
    redActiveMat,
    redDimMat,
    yellowActiveMat,
    yellowDimMat,
    greenActiveMat,
    greenDimMat,
  } = infra;

  const redMeshes: THREE.Mesh[] = [];
  const yellowMeshes: THREE.Mesh[] = [];
  const greenMeshes: THREE.Mesh[] = [];

  const buildSignalHead = (xPos: number, yPos: number, zPos: number, rotY = 0) => {
    const head = new THREE.Group();
    head.position.set(xPos, yPos, zPos);
    head.rotation.y = rotY;

    const box = new THREE.Mesh(infra!.sigBoxGeo, housingMat);
    head.add(box);

    const redLens = new THREE.Mesh(infra!.sigLensGeo, redActiveMat);
    redLens.position.set(0, 0.6, 0.18);
    head.add(redLens);
    redMeshes.push(redLens);

    const yellowLens = new THREE.Mesh(infra!.sigLensGeo, yellowDimMat);
    yellowLens.position.set(0, 0, 0.18);
    head.add(yellowLens);
    yellowMeshes.push(yellowLens);

    const greenLens = new THREE.Mesh(infra!.sigLensGeo, greenDimMat);
    greenLens.position.set(0, -0.6, 0.18);
    head.add(greenLens);
    greenMeshes.push(greenLens);

    return head;
  };

  // 3. Central 4-Way Traffic Signal Gantry, Police Island, Stop Lines & Zebra Crossings (grouped in `signalGroup` so distant signals toggle cleanly!)
  const signalGroup = new THREE.Group();
  signalGroup.add(infra.zebraStopBatch.clone());

  const gantryGroup = new THREE.Group();
  gantryGroup.position.set(0, 0, 8.6);
  const pole = new THREE.Mesh(infra.poleGeo, metalMat);
  pole.position.set(8.6, 3.6, 0);
  gantryGroup.add(pole);
  const trussMain = new THREE.Mesh(infra.trussGeo, metalMat);
  trussMain.position.set(0, 6.7, 0);
  gantryGroup.add(trussMain);
  const dmpSign = new THREE.Mesh(infra.dmpSignGeo, dmpSignMat);
  dmpSign.position.set(0, 5.9, 0);
  gantryGroup.add(dmpSign);
  // Dual-sided signal heads so readable approaching from both -Z and +Z
  gantryGroup.add(buildSignalHead(-3.6, 5.6, 0.22, 0));
  gantryGroup.add(buildSignalHead(3.6, 5.6, 0.22, 0));
  gantryGroup.add(buildSignalHead(-3.6, 5.6, -0.22, Math.PI));
  gantryGroup.add(buildSignalHead(3.6, 5.6, -0.22, Math.PI));
  signalGroup.add(gantryGroup);

  // Police Island cleanly seated ON the corner sidewalk (-10.1, 0, 10.1) — clear of road lanes
  const policeIsland = new THREE.Group();
  policeIsland.position.set(-10.1, 0, 10.1);
  const pedestal = new THREE.Mesh(infra.pedestalGeo, yellowMat);
  pedestal.position.y = 0.21;
  policeIsland.add(pedestal);
  const umbrellaPole = new THREE.Mesh(infra.umbrellaPoleGeo, metalMat);
  umbrellaPole.position.set(0, 1.7, 0);
  policeIsland.add(umbrellaPole);
  const umbrellaCanopy = new THREE.Mesh(infra.umbrellaCanopyGeo, umbrellaMat);
  umbrellaCanopy.position.set(0, 3.35, 0);
  policeIsland.add(umbrellaCanopy);

  const policeArmGroup = new THREE.Group();
  policeArmGroup.position.set(0.24, 1.75, 0.2);
  const torso = new THREE.Mesh(infra.torsoGeo, policeClothMat);
  torso.position.set(0, 1.55, 0.2);
  policeIsland.add(torso);
  const armMesh = new THREE.Mesh(infra.armGeoShort, policeClothMat);
  armMesh.position.set(0.16, -0.2, 0);
  armMesh.rotation.z = -Math.PI / 4;
  policeArmGroup.add(armMesh);
  policeIsland.add(policeArmGroup);
  signalGroup.add(policeIsland);
  group.add(signalGroup);

  // 3b. Dynamic Toggleable Road Center Dividers & Sparse U-Turn Bays (cloned from shared pre-batched infrastructure)
  const nsMedianSolid = infra.nsMedianSolidBatch.clone();
  const nsMedianUTurn = infra.nsMedianUTurnBatch.clone();
  const ewMedianSolid = infra.ewMedianSolidBatch.clone();
  const ewMedianUTurn = infra.ewMedianUTurnBatch.clone();
  nsMedianUTurn.visible = false;
  ewMedianUTurn.visible = false;
  group.add(nsMedianSolid, nsMedianUTurn, ewMedianSolid, ewMedianUTurn);

  // 4. Overhead Real Dhaka Metro Rail (MRT-6) Single Central T-Pier Portal Columns, Dual Box-Girder Viaduct & OHE Catenary
  let metroGroup: THREE.Group;
  if (existingTemplate) {
    metroGroup = existingTemplate.metroBatch.clone();
    group.add(metroGroup);
    group.add(existingTemplate.staticBatch.clone());
  } else {
    const rawMetroGroup = new THREE.Group();
    const deckY = 9.85;
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x7b8694, roughness: 0.84 });
    const darkConcreteMat = new THREE.MeshStandardMaterial({ color: 0x56606d, roughness: 0.88 });
    const greenAccentMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.45 });
    const redAccentMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });
    const trackBedMat = new THREE.MeshStandardMaterial({ color: 0x28313d, roughness: 0.88 });
    const oheSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.72 });
    const catenaryWireMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const chevronMat = new THREE.MeshStandardMaterial({ map: textures.cngChevrons, roughness: 0.55 });
    const badgeMat = new THREE.MeshBasicMaterial({ map: textures.metroPillarBadge });

    // Segmental Pre-Cast Box-Girder Upper Viaduct Deck + Tapered Underside Spine (y = 9.15 .. 10.35m)
    const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.65, 96.0), concreteMat);
    upperDeck.position.set(0, deckY + 0.15, 0);
    upperDeck.castShadow = true;
    rawMetroGroup.add(upperDeck);

    const lowerSpine = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.9, 96.0), darkConcreteMat);
    lowerSpine.position.set(0, deckY - 0.55, 0);
    lowerSpine.castShadow = true;
    rawMetroGroup.add(lowerSpine);

    // Bangladesh Flag Green & Red Architectural Acoustic Parapets + Dual Track Rail Beds
    [-4.25, 4.25].forEach((bx) => {
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.92, 96.0), concreteMat);
      parapet.position.set(bx, deckY + 0.82, 0);
      rawMetroGroup.add(parapet);

      const greenBand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 96.0), greenAccentMat);
      greenBand.position.set(bx, deckY + 1.05, 0);
      rawMetroGroup.add(greenBand);

      const redBand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 96.0), redAccentMat);
      redBand.position.set(bx, deckY + 0.78, 0);
      rawMetroGroup.add(redBand);
    });

    [-2.0, 2.0].forEach((tx) => {
      const trackSlab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 96.0), trackBedMat);
      trackSlab.position.set(tx, deckY + 0.5, 0);
      rawMetroGroup.add(trackSlab);
    });

    // Overhead OHE Electrification Portal Gantries & Twin Catenary Contact Wires
    [-40, -16, 16, 40].forEach((gz) => {
      [-4.1, 4.1].forEach((mx) => {
        const oheMast = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.2, 0.16), oheSteelMat);
        oheMast.position.set(mx, deckY + 2.2, gz);
        rawMetroGroup.add(oheMast);
      });
      const oheBeam = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.16, 0.16), oheSteelMat);
      oheBeam.position.set(0, deckY + 3.7, gz);
      rawMetroGroup.add(oheBeam);
    });

    [-2.0, 2.0].forEach((wx) => {
      const wire = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 96.0), catenaryWireMat);
      wire.position.set(wx, deckY + 3.52, 0);
      rawMetroGroup.add(wire);
    });

    // REAL MRT-6 SINGLE CENTRAL CONCRETE T-PIERS on Road Center Divider (cleanly avoiding U-Turn bays at +/-28.3!)
    [-40.5, -19.0, 19.0, 40.5].forEach((pz, pIdx) => {
      // 1. Reinforced Concrete Jersey Crash Plinth with Hazard Chevrons & MRT-6 Pier Plate
      const plinthBase = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.95, 2.35), darkConcreteMat);
      plinthBase.position.set(0, 0.475, pz);
      plinthBase.castShadow = true;
      plinthBase.receiveShadow = true;
      rawMetroGroup.add(plinthBase);

      const chevronCollar = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.34, 2.42), chevronMat);
      chevronCollar.position.set(0, 0.24, pz);
      rawMetroGroup.add(chevronCollar);

      // "ঢাকা মেট্রো-রেল · MRT-6" identification plate facing drivers on left & right lanes
      [-0.73, 0.73].forEach((bx, sideI) => {
        const badgePlate = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 0.76), badgeMat);
        badgePlate.position.set(bx, 0.62, pz);
        badgePlate.rotation.y = sideI === 0 ? -Math.PI / 2 : Math.PI / 2;
        rawMetroGroup.add(badgePlate);
      });

      // 2. Massive Fluted Octagonal/Chamfered Central Pier Trunk (y = 0.95 .. 7.95m)
      const pierTrunk = new THREE.Mesh(new THREE.BoxGeometry(1.12, 7.05, 1.52), concreteMat);
      pierTrunk.position.set(0, 4.475, pz);
      pierTrunk.castShadow = true;
      pierTrunk.receiveShadow = true;
      rawMetroGroup.add(pierTrunk);

      const chamferCollar = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.45, 1.64), darkConcreteMat);
      chamferCollar.position.set(0, 1.05, pz);
      rawMetroGroup.add(chamferCollar);

      // Iconic Dhaka Metro Pillar Election & Street Posters wrapped around lower pier trunk!
      const posterTex =
        pIdx % 2 === 0
          ? textures.electionPosters[(cellIndex + pIdx) % textures.electionPosters.length]
          : textures.bangladeshiPosters[(cellIndex + pIdx) % textures.bangladeshiPosters.length];
      const pWrap = new THREE.Mesh(
        new THREE.BoxGeometry(1.16, 1.85, 1.56),
        new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.72 })
      );
      pWrap.position.set(0, 2.25, pz);
      rawMetroGroup.add(pWrap);

      // 3. Sculptural Flared V-Shaped Hammerhead T-Pier Cap (spanning full 8.4m viaduct width!)
      const capCore = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.15, 2.05), concreteMat);
      capCore.position.set(0, deckY - 1.32, pz);
      capCore.castShadow = true;
      rawMetroGroup.add(capCore);

      [-2.35, 2.35].forEach((wx) => {
        const flareWing = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.72, 1.82), darkConcreteMat);
        flareWing.position.set(wx, deckY - 1.75, pz);
        flareWing.rotation.z = wx > 0 ? 0.24 : -0.24;
        rawMetroGroup.add(flareWing);
      });
    });

    metroGroup = mergeStaticGroupByMaterial(rawMetroGroup, batchCache, false);
    group.add(metroGroup);

    // Festive Bunting Garland overhead along N-S and E-W
    const buntingNS = createFestiveBuntingGarland(18, textures);
    buntingNS.position.set(0, 0, -28);
    staticBatchRoot.add(buntingNS);

    const buntingEW = createFestiveBuntingGarland(18, textures);
    buntingEW.rotation.y = Math.PI / 2;
    buntingEW.position.set(28, 0, 0);
    staticBatchRoot.add(buntingEW);

    // Overhead Cross-Street Hanging Election Poster Strings ("রশিতে ঝোলানো নির্বাচনী পোস্টার")
    const eStringNS1 = createElectionPosterStringModel(19.2, textures, 5.15);
    eStringNS1.position.set(0, 0, -18.5);
    staticBatchRoot.add(eStringNS1);

    const eStringNS2 = createElectionPosterStringModel(19.2, textures, 5.25);
    eStringNS2.position.set(0, 0, 36.5);
    staticBatchRoot.add(eStringNS2);

    const eStringEW1 = createElectionPosterStringModel(19.2, textures, 5.15);
    eStringEW1.rotation.y = Math.PI / 2;
    eStringEW1.position.set(-29.0, 0, 0);
    staticBatchRoot.add(eStringEW1);

    const eStringEW2 = createElectionPosterStringModel(19.2, textures, 5.25);
    eStringEW2.rotation.y = Math.PI / 2;
    eStringEW2.position.set(22.0, 0, 0);
    staticBatchRoot.add(eStringEW2);

    // Overhead Tangled Cross-Street Dhaka Cable Spans ("তারের জঞ্জাল আড়াআড়ি")
    [-29.0, 29.0].forEach((cz) => {
      const spanNS = createCrossStreetCableSpanModel(22.8);
      spanNS.position.set(0, 0, cz);
      staticBatchRoot.add(spanNS);
    });
    [-29.0, 29.0].forEach((cx) => {
      const spanEW = createCrossStreetCableSpanModel(22.8);
      spanEW.rotation.y = Math.PI / 2;
      spanEW.position.set(cx, 0, 0);
      staticBatchRoot.add(spanEW);
    });

    // Overhead Cross-Street Dhaka Festival, Admission & Book Fair Banners
    const overheadBannerNS = createDhakaOverheadBannerModel(textures, cellIndex);
    overheadBannerNS.position.set(0, 0, 21.5);
    staticBatchRoot.add(overheadBannerNS);

    const overheadBannerNS2 = createDhakaOverheadBannerModel(textures, cellIndex + 2);
    overheadBannerNS2.position.set(0, 0, -39.5);
    staticBatchRoot.add(overheadBannerNS2);

    const overheadBannerEW = createDhakaOverheadBannerModel(textures, cellIndex + 4);
    overheadBannerEW.rotation.y = Math.PI / 2;
    overheadBannerEW.position.set(-21.5, 0, 0);
    staticBatchRoot.add(overheadBannerEW);

    // Towering Dhaka Mega T-Unipole Billboards flanking intersections!
    const billboardA = createDhakaUnipoleBillboardModel(textures, cellIndex);
    billboardA.position.set(13.2, 0, -13.2);
    billboardA.rotation.y = -Math.PI / 4;
    staticBatchRoot.add(billboardA);

    const billboardB = createDhakaUnipoleBillboardModel(textures, cellIndex + 3);
    billboardB.position.set(-13.2, 0, 13.2);
    billboardB.rotation.y = (Math.PI * 3) / 4;
    staticBatchRoot.add(billboardB);

    // Roadside Framed Election & Street Poster Boards near footpath corners
    [-1, 1].forEach((sSign, bi) => {
      const postTex =
        textures.electionPosters[(cellIndex + bi) % textures.electionPosters.length];
      const boardFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 2.1, 1.55),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.5 })
      );
      boardFrame.position.set(sSign * 11.9, 1.55, -sSign * 14.8);
      staticBatchRoot.add(boardFrame);

      const posterFace = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.92),
        new THREE.MeshBasicMaterial({ map: postTex })
      );
      posterFace.position.set(sSign * 11.9 - sSign * 0.08, 1.55, -sSign * 14.8);
      posterFace.rotation.y = sSign > 0 ? -Math.PI / 2 : Math.PI / 2;
      staticBatchRoot.add(posterFace);
    });

    // Roadside Bamboo Election Campaign Booths with Megaphones ("নির্বাচনী ক্যাম্প ও মাইক")
    const campNS = createElectionCampaignCampModel(textures, cellIndex);
    campNS.position.set(-11.15, 0.26, 30.8);
    campNS.rotation.y = Math.PI / 2;
    staticBatchRoot.add(campNS);

    const campEW = createElectionCampaignCampModel(textures, cellIndex + 1);
    campEW.position.set(30.8, 0.26, -11.15);
    campEW.rotation.y = 0;
    staticBatchRoot.add(campEW);

    // (Center concrete median dividers & sparse U-Turn bays are attached via shared toggleable batches above)

    // Dhaka City Roadside Atmosphere: CNG/Leguna Stand Poles & WASA Roadwork Barricades
    const cngStand = createCngLegunaStandBoardModel();
    cngStand.position.set(-9.15, 0.26, -15.6);
    staticBatchRoot.add(cngStand);

    if (cellIndex % 2 === 0) {
      const wasaWork = createWasaRoadWorkBarricadeModel(textures);
      wasaWork.position.set(8.65, 0.26, 26.5);
      wasaWork.rotation.y = -Math.PI / 2;
      staticBatchRoot.add(wasaWork);
    }

    // Iconic Dhaka Tong Cha-Biscuit Stalls ("টং দোকান" with seated Cha-Mama) tucked on sidewalk corners
    const tongNS = createDhakaTongChaStallModel(textures);
    tongNS.position.set(-10.85, 0.26, -38.5);
    staticBatchRoot.add(tongNS);

    const tongEW = createDhakaTongChaStallModel(textures);
    tongEW.rotation.y = -Math.PI / 2;
    tongEW.position.set(38.5, 0.26, 10.85);
    staticBatchRoot.add(tongEW);

    // Parked Water-Jar & Fruit Rickshaw-Van Carts near curb edges ("পানির জার ও ফলের ভ্যানগাড়ি")
    const vanNS = createDhakaCurbVanCartModel(cellIndex % 2 === 0);
    vanNS.position.set(10.55, 0.26, -39.5);
    staticBatchRoot.add(vanNS);

    const vanEW = createDhakaCurbVanCartModel(cellIndex % 2 !== 0);
    vanEW.rotation.y = Math.PI / 2;
    vanEW.position.set(-39.5, 0.26, 10.55);
    staticBatchRoot.add(vanEW);

    // DSCC Green Footpath Curbside Dustbins ("সিটি কর্পোরেশন ডাস্টবিন")
    const binLocations: Array<[number, number, number]> = [
      [9.1, 19.5, Math.PI / 2],
      [-9.1, -30.5, -Math.PI / 2],
      [-20.2, -9.1, 0],
    ];
    binLocations.forEach(([bx, bz, brot]) => {
      const bin = createDsccCurbBinModel();
      bin.position.set(bx, 0.26, bz);
      bin.rotation.y = brot;
      staticBatchRoot.add(bin);
    });

    // DSCC Dumpster cleanly seated on sidewalk (-10.4, 0, -17.5)
    const trash = createTrashPileModel(textures);
    trash.position.set(-10.4, 0, -17.5);
    trash.rotation.y = Math.PI / 2;
    staticBatchRoot.add(trash);

    // Walk-in Open-Shutter Dhaka Roadside Shops ("খোলা দোকান": Pharmacy, Mudi, bKash/Mobile, Cha-Hotel)
    const openShopSpots: Array<{ x: number; z: number; rotY: number }> = [
      { x: -13.9, z: 34.5, rotY: Math.PI / 2 },
      { x: 13.9, z: -34.5, rotY: -Math.PI / 2 },
      { x: 34.5, z: -13.9, rotY: 0 },
      { x: -34.5, z: 13.9, rotY: Math.PI },
    ];
    openShopSpots.forEach((sp, sIdx) => {
      const built = createDhakaOpenShopModel(textures, cellIndex + sIdx);
      built.mesh.position.set(sp.x, 0, sp.z);
      built.mesh.rotation.y = sp.rotY;
      staticBatchRoot.add(built.mesh);
    });

    // Interactive Street Vendor Power-Up Kiosks ("স্পেশাল চা-ব্রেক" & "মামার ঝালমুড়ি") facing curb edge
    const interactiveKioskSpots: Array<{
      kind: VendorKioskKind;
      x: number;
      z: number;
      rotY: number;
    }> = [
      { kind: 'chai_break', x: 9.85, z: 30.8, rotY: -Math.PI / 2 },
      { kind: 'jhal_muri', x: -9.85, z: -33.8, rotY: Math.PI / 2 },
      { kind: 'chai_break', x: -30.8, z: 9.85, rotY: Math.PI },
      { kind: 'jhal_muri', x: -32.2, z: -9.85, rotY: 0 },
    ];
    interactiveKioskSpots.forEach((ks) => {
      const kMesh =
        ks.kind === 'chai_break'
          ? createChaiBreakKioskModel(textures)
          : createJhalMuriKioskModel(textures);
      kMesh.position.set(ks.x, 0.26, ks.z);
      kMesh.rotation.y = ks.rotY;
      staticBatchRoot.add(kMesh);
    });

    const batchedStatic = mergeStaticGroupByMaterial(staticBatchRoot, batchCache, false);
    group.add(batchedStatic);

    if (sharedTemplates) {
      sharedTemplates.set(templateKey, {
        staticBatch: batchedStatic,
        metroBatch: metroGroup,
      });
    }
  }

  // Register Open Shop interaction zones deterministically for every cell (including template clones)
  const openShopKinds: OpenShopKind[] = ['pharmacy', 'mudi', 'recharge', 'hotel'];
  const openShopCoords: Array<[number, number]> = [
    [-13.9, 34.5],
    [13.9, -34.5],
    [34.5, -13.9],
    [-34.5, 13.9],
  ];
  const openShops: CityCellOpenShopData[] = openShopCoords.map(([lx, lz], sIdx) => ({
    kind: openShopKinds[((templateKey + sIdx) % openShopKinds.length + openShopKinds.length) % openShopKinds.length],
    localX: lx,
    localZ: lz,
    cooldown: 0,
  }));

  // Register Interactive Street Vendor Power-Up Kiosks & lightweight glowing road-shoulder beacons
  const kioskRingGeo = new THREE.RingGeometry(0.95, 1.35, 18);
  const kioskGemGeo = new THREE.OctahedronGeometry(0.32, 0);
  const chaiBeaconMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide,
  });
  const muriBeaconMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });

  const kioskSpecs: Array<{ kind: VendorKioskKind; x: number; z: number; roadX: number; roadZ: number }> = [
    { kind: 'chai_break', x: 9.85, z: 30.8, roadX: 6.95, roadZ: 30.8 },
    { kind: 'jhal_muri', x: -9.85, z: -33.8, roadX: -6.95, roadZ: -33.8 },
    { kind: 'chai_break', x: -30.8, z: 9.85, roadX: -30.8, roadZ: 6.95 },
    { kind: 'jhal_muri', x: -32.2, z: -9.85, roadX: -32.2, roadZ: -6.95 },
  ];

  const vendorKiosks: CityCellVendorKioskData[] = kioskSpecs.map((ks) => {
    const bMat = ks.kind === 'chai_break' ? chaiBeaconMat : muriBeaconMat;
    const beaconGroup = new THREE.Group();

    const roadRing = new THREE.Mesh(kioskRingGeo, bMat);
    roadRing.rotation.x = -Math.PI / 2;
    roadRing.position.set(ks.roadX, 0.045, ks.roadZ);
    beaconGroup.add(roadRing);

    const floatingGem = new THREE.Mesh(kioskGemGeo, bMat);
    floatingGem.position.set(ks.x, 3.82, ks.z);
    beaconGroup.add(floatingGem);

    group.add(beaconGroup);
    return {
      kind: ks.kind,
      localX: ks.x,
      localZ: ks.z,
      cooldown: 0,
      beaconGroup,
      floatingGem,
    };
  });

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
  return {
    group,
    metroGroup,
    signalGroup,
    nsMedianSolid,
    nsMedianUTurn,
    ewMedianSolid,
    ewMedianUTurn,
    lightRig,
    stalls,
    openShops,
    vendorKiosks,
    lampBulbs,
    asphaltMats,
  };
}
