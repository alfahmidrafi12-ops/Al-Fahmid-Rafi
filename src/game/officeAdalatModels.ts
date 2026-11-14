import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import { createContactShadowMesh } from './models';

/**
 * Procedural Texture Generator for Court, Secretariat & Commercial Office Buildings
 */
function createCourtPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Polished green marble background with gold border
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 476, 220);

  // Bangladesh National Scales of Justice (দাঁড়িপাল্লা) symbol
  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;

  // Central pole
  ctx.fillRect(252, 32, 8, 54);
  // Cross beam
  ctx.fillRect(212, 42, 88, 5);
  // Left scale pan
  ctx.beginPath();
  ctx.arc(220, 72, 16, 0, Math.PI);
  ctx.fill();
  ctx.stroke();
  // Right scale pan
  ctx.beginPath();
  ctx.arc(292, 72, 16, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

  // Bengali Court Inscription
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', 256, 128);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 32px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('ঢাকা জেলা ও দায়রা জজ আদালত', 256, 172);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 20px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('DHAKA DISTRICT & SESSIONS JUDGE COURT', 256, 212);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSecretariatPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Deep national green with gold emblem
  ctx.fillStyle = '#0f291e';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 236);

  // Government Emblem Star & Water Lily circles
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(256, 52, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#facc15';
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★ ★ ★', 256, 58);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', 256, 114);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('বাংলাদেশ সচিবালয়', 256, 162);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 20px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('গৃহায়ন, গণপূর্ত ও অর্থ মন্ত্রণালয় কমপ্লেক্স', 256, 206);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCommercialBankSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Corporate royal blue gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#1e3a8a');
  grad.addColorStop(0.5, '#2563eb');
  grad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 160);

  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 4;
  ctx.strokeRect(6, 6, 500, 148);

  // Bank name in vibrant gold & white
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 36px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('সোনালী ব্যাংক পিএলসি', 256, 62);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('প্রধান কার্যালয় ও বাণিজ্যিক টাওয়ার • মতিঝিল', 256, 106);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('SONALI BANK PLC • HEAD OFFICE DHAKA', 256, 136);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createModernOfficeFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Light grey concrete building grid
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 512, 512);

  // Rows of office windows with tint, blinds, and lights
  const rows = 6;
  const cols = 6;
  const padX = 14;
  const padY = 16;
  const cellW = (512 - padX * (cols + 1)) / cols;
  const cellH = (512 - padY * (rows + 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = padX + c * (cellW + padX);
      const y = padY + r * (cellH + padY);

      // Window frame
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - 2, y - 2, cellW + 4, cellH + 4);

      // Tinted glass (some lit with warm fluorescent office tube lights)
      const isLit = (r + c * 3) % 4 === 0 || (r * 2 + c) % 5 === 1;
      if (isLit) {
        ctx.fillStyle = '#fef3c7'; // Warm office light
      } else {
        ctx.fillStyle = '#1e3a5f'; // Deep sky reflection
      }
      ctx.fillRect(x, y, cellW, cellH);

      // Venetian blind slats
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      const slats = 5;
      for (let s = 1; s < slats; s++) {
        ctx.fillRect(x, y + s * (cellH / slats), cellW, 2);
      }

      // Air Conditioner outdoor compressor unit below random windows
      if ((r + c * 2) % 3 === 0) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(x + 8, y + cellH - 12, cellW - 16, 10);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + cellW - 18, y + cellH - 10, 6, 6);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

let cachedCourtPlaque: THREE.CanvasTexture | null = null;
let cachedSecretariatPlaque: THREE.CanvasTexture | null = null;
let cachedBankSign: THREE.CanvasTexture | null = null;
let cachedOfficeFacade: THREE.CanvasTexture | null = null;

function getCourtPlaque(): THREE.CanvasTexture {
  if (!cachedCourtPlaque) cachedCourtPlaque = createCourtPlaqueTexture();
  return cachedCourtPlaque;
}

function getSecretariatPlaque(): THREE.CanvasTexture {
  if (!cachedSecretariatPlaque) cachedSecretariatPlaque = createSecretariatPlaqueTexture();
  return cachedSecretariatPlaque;
}

function getBankSign(): THREE.CanvasTexture {
  if (!cachedBankSign) cachedBankSign = createCommercialBankSignTexture();
  return cachedBankSign;
}

function getOfficeFacade(): THREE.CanvasTexture {
  if (!cachedOfficeFacade) cachedOfficeFacade = createModernOfficeFacadeTexture();
  return cachedOfficeFacade;
}

/**
 * 1. DHAKA DISTRICT & SESSIONS JUDGE COURT / SUPREME COURT (ঢাকা জেলা জজ আদালত ও সুপ্রিম কোর্ট)
 * Neoclassical judicial palace architecture with 8 majestic columns, scales of justice pediment,
 * bronze gates, marble stairways, and Bangladesh national flag.
 */
export function createJudgeCourtModel(textures: ProceduralTexturePack): THREE.Group {
  const court = new THREE.Group();
  court.add(createContactShadowMesh(textures.contactShadow, 32, 24));

  // Materials
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.65,
    metalness: 0.05,
  });
  const redBrickMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b,
    roughness: 0.8,
  });
  const marblePillarMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.35,
    metalness: 0.1,
  });
  const darkRoofMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
  });
  const goldBrassMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.25,
    metalness: 0.85,
  });
  const ironGateMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.8,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.15,
    metalness: 0.8,
    transparent: true,
    opacity: 0.75,
  });

  // Base Foundation Podium & Grand Steps
  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 18), stoneMat);
  basePlinth.position.set(0, 0.6, 0);
  basePlinth.receiveShadow = true;
  court.add(basePlinth);

  // Marble Staircase leading up
  for (let s = 0; s < 4; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(14 - s * 0.8, 0.25, 4.0 - s * 0.7),
      stoneMat
    );
    step.position.set(0, 0.125 + s * 0.25, 9.0 - s * 0.6);
    step.receiveShadow = true;
    court.add(step);
  }

  // Main Central Hall Building
  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(24, 9.5, 14), redBrickMat);
  mainHall.position.set(0, 5.95, -1.0);
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  court.add(mainHall);

  // Left & Right Court Wings
  for (const wx of [-15, 15]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(7, 7.5, 12), redBrickMat);
    wing.position.set(wx, 4.95, -1.0);
    court.add(wing);

    // Arched windows on side wings
    for (let wy = 3.2; wy <= 6.5; wy += 2.8) {
      for (let wz = -4.5; wz <= 3.5; wz += 3.2) {
        const archWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), glassMat);
        archWindow.position.set(wx + (wx > 0 ? 3.52 : -3.52), wy, wz);
        archWindow.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
        court.add(archWindow);
      }
    }
  }

  // Portico Colonnade (8 grand Greek-classical Doric pillars)
  const pillarGeo = new THREE.CylinderGeometry(0.42, 0.48, 7.2, 10);
  const pillarSpacing = 2.4;
  for (let i = -3.5; i <= 3.5; i += 1.0) {
    const px = i * pillarSpacing;
    const pillar = new THREE.Mesh(pillarGeo, marblePillarMat);
    pillar.position.set(px, 4.8, 6.4);
    court.add(pillar);

    // Pillar Capital & Base
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.15), stoneMat);
    cap.position.set(px, 8.4, 6.4);
    court.add(cap);

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), stoneMat);
    base.position.set(px, 1.35, 6.4);
    court.add(base);
  }

  // Classical Entablature Architrave Beam
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(20, 0.9, 3.5), stoneMat);
  architrave.position.set(0, 8.95, 6.4);
  court.add(architrave);

  const ph = 3.6;
  const pediment = new THREE.Mesh(new THREE.ConeGeometry(10.5, ph, 4), stoneMat);
  pediment.rotation.y = Math.PI / 4;
  pediment.scale.set(1.4, 1.0, 0.35);
  pediment.position.set(0, 11.2, 6.4);
  court.add(pediment);

  // Golden Scales of Justice emblem inside pediment center
  const scalesEmblem = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.08, 8, 24),
    goldBrassMat
  );
  scalesEmblem.position.set(0, 10.6, 7.3);
  court.add(scalesEmblem);

  const scalesBeam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.05), goldBrassMat);
  scalesBeam.position.set(0, 10.7, 7.32);
  court.add(scalesBeam);

  // Prominent Court Plaque ("ঢাকা জেলা ও দায়রা জজ আদালত")
  const courtPlaqueMat = new THREE.MeshStandardMaterial({
    map: getCourtPlaque(),
    roughness: 0.3,
    metalness: 0.2,
  });
  const plaqueMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.2), courtPlaqueMat);
  plaqueMesh.position.set(0, 6.8, 5.85);
  court.add(plaqueMesh);

  // Grand Entrance Arched Mahogany Doors
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 5.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 })
  );
  doorFrame.position.set(0, 3.8, 5.9);
  court.add(doorFrame);

  // High Court Dome / Spire & Bangladesh National Flag
  const centralDome = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.35, metalness: 0.4 })
  );
  centralDome.position.set(0, 10.6, -1.0);
  centralDome.castShadow = true;
  court.add(centralDome);

  const domeFinial = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 2.4, 8), goldBrassMat);
  domeFinial.position.set(0, 14.8, -1.0);
  court.add(domeFinial);

  // Bangladesh Flag atop the Court
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 8), goldBrassMat);
  flagPole.position.set(0, 16.5, -1.0);
  court.add(flagPole);

  // Green Flag with Red Circle
  const flagCanvas = document.createElement('canvas');
  flagCanvas.width = 128;
  flagCanvas.height = 80;
  const fCtx = flagCanvas.getContext('2d')!;
  fCtx.fillStyle = '#006a4e';
  fCtx.fillRect(0, 0, 128, 80);
  fCtx.fillStyle = '#f42a41';
  fCtx.beginPath();
  fCtx.arc(56, 40, 24, 0, Math.PI * 2);
  fCtx.fill();
  const flagTex = new THREE.CanvasTexture(flagCanvas);
  flagTex.colorSpace = THREE.SRGBColorSpace;

  const flagMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.0),
    new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.5, side: THREE.DoubleSide })
  );
  flagMesh.position.set(0.85, 17.8, -1.0);
  court.add(flagMesh);

  // Front Boundary Security Wall with Iron Railings
  for (const bx of [-11, 11]) {
    const wallBase = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 0.6), redBrickMat);
    wallBase.position.set(bx, 0.4, 9.5);
    court.add(wallBase);

    // Vertical black iron security spears
    for (let ix = bx - 3.6; ix <= bx + 3.6; ix += 0.4) {
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), ironGateMat);
      spear.position.set(ix, 1.4, 9.5);
      court.add(spear);
    }
  }

  // Court Police Security Booth (কোর্ট পুলিশ বক্স)
  const guardBox = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.5, 2.0), stoneMat);
  guardBox.position.set(-8.5, 1.25, 11.5);
  court.add(guardBox);
  const guardRoof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.8, 4), darkRoofMat);
  guardRoof.position.set(-8.5, 2.85, 11.5);
  guardRoof.rotation.y = Math.PI / 4;
  court.add(guardRoof);

  return court;
}

/**
 * 2. BANGLADESH SECRETARIAT / MINISTRY COMPLEX (বাংলাদেশ সচিবালয়)
 * Multi-story bureaucratic ministry office block with concrete louvers,
 * AC outdoor compressors, VIP entrance portico, and Bangladesh national secretariat plaque.
 */
export function createSecretariatOfficeModel(textures: ProceduralTexturePack): THREE.Group {
  const office = new THREE.Group();
  office.add(createContactShadowMesh(textures.contactShadow, 28, 22));

  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.65,
    metalness: 0.1,
  });
  const darkGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.2,
    metalness: 0.75,
  });
  const louverMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.5,
  });
  const acWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.4,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.3,
    metalness: 0.8,
  });

  // Main 7-Story Administrative Office Block
  const officeBlock = new THREE.Mesh(new THREE.BoxGeometry(22, 14, 12), concreteMat);
  officeBlock.position.set(0, 7.0, 0);
  officeBlock.castShadow = true;
  officeBlock.receiveShadow = true;
  office.add(officeBlock);

  // Facade panels with office windows
  const facadeMat = new THREE.MeshStandardMaterial({
    map: getOfficeFacade(),
    roughness: 0.45,
  });
  const frontFacade = new THREE.Mesh(new THREE.PlaneGeometry(21.5, 11.5), facadeMat);
  frontFacade.position.set(0, 7.5, 6.02);
  office.add(frontFacade);

  // Concrete Sunshade Louvers / Brise-soleil (iconic Dhaka architecture against tropical monsoon & heat)
  for (let ly = 3.5; ly <= 13.0; ly += 2.0) {
    const louver = new THREE.Mesh(new THREE.BoxGeometry(21.8, 0.22, 0.8), louverMat);
    louver.position.set(0, ly, 6.3);
    office.add(louver);
  }

  // 3D Air Conditioner Outdoor Compressors (split AC units mounted under windows)
  for (let r = 0; r < 4; r++) {
    for (let c = -4; c <= 4; c += 2) {
      if ((r + c) % 2 === 0) {
        const acUnit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.45), acWhiteMat);
        acUnit.position.set(c * 2.2, 3.8 + r * 2.0, 6.5);
        office.add(acUnit);
      }
    }
  }

  // Grand VIP Car Porch / Cantilevered Entrance Canopy
  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(11, 0.6, 6.5), concreteMat);
  porchRoof.position.set(0, 3.8, 8.8);
  office.add(porchRoof);

  // Porch Support Pillars
  for (const px of [-4.8, 4.8]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.8, 8), concreteMat);
    p.position.set(px, 1.9, 11.5);
    office.add(p);
  }

  // Official Gold & Green Signboard ("বাংলাদেশ সচিবালয়")
  const secPlaqueMat = new THREE.MeshStandardMaterial({
    map: getSecretariatPlaque(),
    roughness: 0.3,
    metalness: 0.2,
  });
  const secPlaque = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.8), secPlaqueMat);
  secPlaque.position.set(0, 4.6, 11.85);
  office.add(secPlaque);

  // Automatic Sliding Entrance Glass Doors
  const entranceGlass = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 3.2), darkGlassMat);
  entranceGlass.position.set(0, 1.6, 6.05);
  office.add(entranceGlass);

  // Rooftop Machinery: Elevator Penthouse, Water Tanks, Microwave Dishes, Solar Panels
  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(6, 2.5, 5), concreteMat);
  penthouse.position.set(0, 15.2, 0);
  office.add(penthouse);

  // Water Tanks (সিনটেক্স পানির ট্যাংক)
  for (const tx of [-1.8, 1.8]) {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 1.8, 12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    tank.position.set(tx, 17.3, 0);
    office.add(tank);
  }

  // Communications Mast with blinking red aviation light
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 4.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 })
  );
  mast.position.set(-6, 16.2, 2);
  office.add(mast);

  const aviationBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 2.5 })
  );
  aviationBeacon.position.set(-6, 18.5, 2);
  office.add(aviationBeacon);

  // Security Boom Barrier (সচিবালয় নিরাপত্তা ব্যারিয়ার)
  const barrierPost = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.45), concreteMat);
  barrierPost.position.set(6.2, 0.55, 12.0);
  office.add(barrierPost);

  const barrierArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 4.8, 8),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
  );
  barrierArm.rotation.z = Math.PI / 2;
  barrierArm.position.set(3.8, 0.9, 12.0);
  office.add(barrierArm);

  return office;
}

/**
 * 3. MOTIJHEEL COMMERCIAL CORPORATE BANK TOWER (বাণিজ্যিক ব্যাংক ভবন)
 * High-rise corporate office tower (Sonali / Janata Bank style) with full-height
 * reflective glass curtain walls, ground reception atrium, illuminated corporate signage,
 * and rooftop helipad markings.
 */
export function createCommercialBankTowerModel(textures: ProceduralTexturePack): THREE.Group {
  const tower = new THREE.Group();
  tower.add(createContactShadowMesh(textures.contactShadow, 24, 20));

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.85,
  });
  const curtainGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.1,
    metalness: 0.92,
  });
  const goldLetterMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.85,
    emissive: 0xca8a04,
    emissiveIntensity: 0.3,
  });
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.7,
  });

  // Main 12-Story High-Rise Corporate Tower
  const towerBody = new THREE.Mesh(new THREE.BoxGeometry(18, 22, 14), darkSteelMat);
  towerBody.position.set(0, 11, 0);
  towerBody.castShadow = true;
  towerBody.receiveShadow = true;
  tower.add(towerBody);

  // Front & Back Reflective Blue Curtain Wall Glass
  [-7.02, 7.02].forEach((gz) => {
    const glassFacade = new THREE.Mesh(new THREE.PlaneGeometry(17.4, 20.8), curtainGlassMat);
    glassFacade.position.set(0, 11, gz);
    if (gz < 0) glassFacade.rotation.y = Math.PI;
    tower.add(glassFacade);

    // Vertical structural mullion columns across glass facade
    for (let mx = -7.5; mx <= 7.5; mx += 2.5) {
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.12, 21.0, 0.15), darkSteelMat);
      mullion.position.set(mx, 11, gz + (gz > 0 ? 0.08 : -0.08));
      tower.add(mullion);
    }
  });

  // Corporate Signboard Band across tower crown ("সোনালী ব্যাংক পিএলসি")
  const signMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(16.5, 2.8),
    new THREE.MeshStandardMaterial({
      map: getBankSign(),
      roughness: 0.3,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.4,
    })
  );
  signMesh.position.set(0, 19.8, 7.15);
  tower.add(signMesh);

  // Ground Floor Double-Height Executive Atrium & Revolving Door
  const lobbyFrame = new THREE.Mesh(new THREE.BoxGeometry(10, 4.2, 2.5), darkSteelMat);
  lobbyFrame.position.set(0, 2.1, 7.6);
  tower.add(lobbyFrame);

  const lobbyGlass = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 3.6), curtainGlassMat);
  lobbyGlass.position.set(0, 2.1, 8.86);
  tower.add(lobbyGlass);

  // Revolving door cylinder
  const revolvingDoor = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2.6, 16),
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    })
  );
  revolvingDoor.position.set(0, 1.3, 8.85);
  tower.add(revolvingDoor);

  // Rooftop Helipad & Communication Array
  const helipadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const helipad = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 11), helipadMat);
  helipad.position.set(0, 22.2, 0);
  tower.add(helipad);

  // Helipad Yellow "H" Landing Marking
  const yellowMarkMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 4.0), yellowMarkMat);
  hLeft.position.set(-1.8, 22.45, 0);
  tower.add(hLeft);

  const hRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 4.0), yellowMarkMat);
  hRight.position.set(1.8, 22.45, 0);
  tower.add(hRight);

  const hBar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 0.5), yellowMarkMat);
  hBar.position.set(0, 22.45, 0);
  tower.add(hBar);

  // Helipad Circle Ring
  const hRing = new THREE.Mesh(new THREE.RingGeometry(3.8, 4.2, 24), yellowMarkMat);
  hRing.rotation.x = -Math.PI / 2;
  hRing.position.set(0, 22.45, 0);
  tower.add(hRing);

  // Rooftop High-Gain Telecom Antenna Mast
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 7.5, 8), darkSteelMat);
  antenna.position.set(6.2, 25.8, -3.5);
  tower.add(antenna);

  return tower;
}

/**
 * Procedural Signboard for Dhaka Bar Association & Lawyers Chamber
 */
function createBarPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1b4b'; // Deep navy
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 236);

  // Advocate neckband symbol
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(240, 28, 14, 38);
  ctx.fillRect(258, 28, 14, 38);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('বাংলাদেশ বার কাউন্সিল অনুমোদিত', 256, 105);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 30px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('ঢাকা আইনজীবী সমিতি ভবন', 256, 155);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 18px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('DHAKA BAR ASSOCIATION & ADVOCATES ANNEX', 256, 198);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Procedural Signboard for NBR Tax Complex & Bangladesh Bank Annex
 */
function createTaxPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#064e3b'; // Forest green
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 236);

  // Red circle govt crest
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(256, 48, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', 256, 102);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 30px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('জাতীয় রাজস্ব বোর্ড ও কর অঞ্চল কমপ্লেক্স', 256, 152);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 18px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('NATIONAL BOARD OF REVENUE & TAX ZONE', 256, 195);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let cachedBarPlaque: THREE.CanvasTexture | null = null;
let cachedTaxPlaque: THREE.CanvasTexture | null = null;

function getBarPlaque(): THREE.CanvasTexture {
  if (!cachedBarPlaque) cachedBarPlaque = createBarPlaqueTexture();
  return cachedBarPlaque;
}

function getTaxPlaque(): THREE.CanvasTexture {
  if (!cachedTaxPlaque) cachedTaxPlaque = createTaxPlaqueTexture();
  return cachedTaxPlaque;
}

/**
 * 4. DHAKA BAR ASSOCIATION & ADVOCATES CHAMBERS (ঢাকা আইনজীবী সমিতি ও অ্যাডভোকেট চেম্বার)
 * Multi-story brick & plaster chamber building with veranda corridors, lawyer nameplates,
 * stamp vendor stalls, and notary public desks on the South side of Court District.
 */
export function createBarAssociationChamberModel(textures: ProceduralTexturePack): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 28, 16));

  const brickMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85 });
  const plasterMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
  const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, transparent: true, opacity: 0.7 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });

  // Main 3-story building block
  const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(24, 11, 10), brickMat);
  mainBlock.position.set(0, 5.5, 0);
  mainBlock.castShadow = true;
  mainBlock.receiveShadow = true;
  building.add(mainBlock);

  // Front veranda balconies on floor 1 & 2
  [3.8, 7.5].forEach((vy) => {
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(23.2, 0.35, 2.2), plasterMat);
    balcony.position.set(0, vy, 5.8);
    building.add(balcony);

    // Railing
    const railing = new THREE.Mesh(new THREE.BoxGeometry(23.2, 0.85, 0.1), darkFrameMat);
    railing.position.set(0, vy + 0.5, 6.8);
    building.add(railing);
  });

  // Pillars supporting veranda
  for (let px = -10.5; px <= 10.5; px += 3.5) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, 11, 0.45), plasterMat);
    pillar.position.set(px, 5.5, 6.7);
    building.add(pillar);
  }

  // Windows & Advocate Chamber doors on the facade
  for (let wx = -9; wx <= 9; wx += 3) {
    [2.2, 5.8, 9.2].forEach((wy) => {
      const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.1), darkFrameMat);
      windowFrame.position.set(wx, wy, 5.05);
      building.add(windowFrame);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), glassMat);
      glass.position.set(wx, wy, 5.12);
      building.add(glass);
    });
  }

  // Roof parapet
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(24.4, 0.8, 10.4), plasterMat);
  parapet.position.set(0, 11.4, 0);
  building.add(parapet);

  // Large Grand Plaque on facade
  const plaqueMat = new THREE.MeshBasicMaterial({ map: getBarPlaque() });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.2), plaqueMat);
  plaque.position.set(0, 9.2, 5.15);
  building.add(plaque);

  // Ground-floor outdoor stamp vendor & deed writer tables
  [-7, -3, 3, 7].forEach((dx) => {
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 0.9), woodMat);
    table.position.set(dx, 0.4, 7.8);
    building.add(table);

    // Bench
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.4), woodMat);
    bench.position.set(dx, 0.25, 8.6);
    building.add(bench);

    // Colorful umbrella canopy over table (shade from sun)
    const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), darkFrameMat);
    umbrellaPole.position.set(dx + 0.7, 1.1, 7.8);
    building.add(umbrellaPole);

    const umbrellaCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 0.5, 10),
      new THREE.MeshStandardMaterial({
        color: (dx % 2 === 0 ? 0xef4444 : 0x0284c7),
        roughness: 0.7,
      })
    );
    umbrellaCone.position.set(dx + 0.7, 2.3, 7.8);
    building.add(umbrellaCone);
  });

  return building;
}

/**
 * 5. BANGLADESH BANK ANNEX & NATIONAL BOARD OF REVENUE TAX COMPLEX
 * Modern commercial financial building on the South side of Office District.
 */
export function createTaxAndBankAnnexModel(textures: ProceduralTexturePack): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 26, 18));

  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.4 });
  const atmMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.3 });

  // 6-story modern glass & granite tower
  const tower = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 12), graniteMat);
  tower.position.set(0, 9.0, 0);
  tower.castShadow = true;
  tower.receiveShadow = true;
  building.add(tower);

  // Large glass curtain wall panel on front facade
  const glassFront = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), glassMat);
  glassFront.position.set(0, 10.0, 6.05);
  building.add(glassFront);

  // Vertical aluminum fin mullions
  for (let mx = -8.5; mx <= 8.5; mx += 2.1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 14.2, 0.35), silverMat);
    fin.position.set(mx, 10.0, 6.2);
    building.add(fin);
  }

  // Entrance portico canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 0.45, 3.5), silverMat);
  canopy.position.set(0, 3.6, 7.5);
  building.add(canopy);

  // Canopy support posts
  [-4.5, 4.5].forEach((cx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 8), silverMat);
    post.position.set(cx, 1.8, 9.0);
    building.add(post);
  });

  // Revolving entrance glass
  const revolving = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2.6, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, transparent: true, opacity: 0.8 })
  );
  revolving.position.set(0, 1.3, 6.1);
  building.add(revolving);

  // Large NBR Tax Signboard above portico
  const plaqueMat = new THREE.MeshBasicMaterial({ map: getTaxPlaque() });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.8), plaqueMat);
  plaque.position.set(0, 5.4, 6.08);
  building.add(plaque);

  // 24-Hour ATM Booth on the side of portico
  const atmBooth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 1.8), atmMat);
  atmBooth.position.set(7.5, 1.4, 6.8);
  building.add(atmBooth);

  // ATM glowing sign
  const atmSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x4ade80, emissive: 0x22c55e, emissiveIntensity: 2.2 })
  );
  atmSign.position.set(7.5, 2.4, 7.72);
  building.add(atmSign);

  // Rooftop telecom antenna and satellite dish
  const antMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 6.5, 8), antMat);
  ant.position.set(-6, 21.25, -2);
  building.add(ant);

  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 8, 0, Math.PI), antMat);
  dish.rotation.x = -Math.PI / 3;
  dish.position.set(5.5, 19.0, -2);
  building.add(dish);

  return building;
}

