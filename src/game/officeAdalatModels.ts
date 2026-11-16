import * as THREE from 'three';
import { ProceduralTexturePack } from './textures';
import { createContactShadowMesh } from './models';

/**
 * Procedural Texture Generators & Caches for Court, Secretariat, Government & Corporate Office Buildings
 */
function makeOfficeSignTexture(
  bgStart: string,
  bgEnd: string,
  border: string,
  topLine: string,
  title: string,
  sub: string,
  crestColor?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, bgStart);
  grad.addColorStop(0.5, bgEnd);
  grad.addColorStop(1, bgStart);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 192);

  ctx.strokeStyle = border;
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 496, 176);

  if (crestColor) {
    ctx.fillStyle = crestColor;
    ctx.beginPath();
    ctx.arc(54, 96, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const cx = crestColor ? 276 : 256;
  ctx.textAlign = 'center';

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(topLine, cx, 48);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 34px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(title, cx, 104);

  ctx.fillStyle = '#bae6fd';
  ctx.font = 'bold 18px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(sub, cx, 148);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCourtPlaqueTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#064e3b';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 240);

  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, 476, 220);

  // Scales of Justice symbol
  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.fillRect(252, 32, 8, 54);
  ctx.fillRect(212, 42, 88, 5);
  ctx.beginPath();
  ctx.arc(220, 72, 16, 0, Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(292, 72, 16, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

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

function createSecretariatPlaqueTexture(variant: number): THREE.CanvasTexture {
  const ministries = [
    ['বাংলাদেশ সচিবালয়', 'গৃহায়ন, গণপূর্ত ও অর্থ মন্ত্রণালয় কমপ্লেক্স'],
    ['জনপ্রশাসন ও শিক্ষা ভবন', 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার • সেগুনবাগিচা'],
    ['পরিকল্পনা ও বাণিজ্য দপ্তর', 'প্রশাসনিক ভবন ব্লক-৪ • ঢাকা'],
  ];
  const [title, sub] = ministries[Math.abs(variant) % ministries.length];

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f291e';
  ctx.fillRect(0, 0, 512, 256);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 492, 236);

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
  ctx.font = 'bold 34px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(title, 256, 162);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 20px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(sub, 256, 206);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createModernOfficeFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 512, 512);

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

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - 2, y - 2, cellW + 4, cellH + 4);

      const isLit = (r + c * 3) % 4 === 0 || (r * 2 + c) % 5 === 1;
      ctx.fillStyle = isLit ? '#fef3c7' : '#1e3a5f';
      ctx.fillRect(x, y, cellW, cellH);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      const slats = 5;
      for (let s = 1; s < slats; s++) {
        ctx.fillRect(x, y + s * (cellH / slats), cellW, 2);
      }

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

function createBdFlagTexture(): THREE.CanvasTexture {
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
  return flagTex;
}

let cachedCourtPlaque: THREE.CanvasTexture | null = null;
let cachedSecretariatPlaques: THREE.CanvasTexture[] | null = null;
let cachedBankSigns: THREE.CanvasTexture[] | null = null;
let cachedOfficeFacade: THREE.CanvasTexture | null = null;
let cachedBarPlaque: THREE.CanvasTexture | null = null;
let cachedTaxPlaque: THREE.CanvasTexture | null = null;
let cachedItHubSigns: THREE.CanvasTexture[] | null = null;
let cachedNagarSigns: THREE.CanvasTexture[] | null = null;
let cachedGarmentSigns: THREE.CanvasTexture[] | null = null;
let cachedBdFlag: THREE.CanvasTexture | null = null;

function getCourtPlaque(): THREE.CanvasTexture {
  if (!cachedCourtPlaque) cachedCourtPlaque = createCourtPlaqueTexture();
  return cachedCourtPlaque;
}
function getSecretariatPlaque(variant = 0): THREE.CanvasTexture {
  if (!cachedSecretariatPlaques) {
    cachedSecretariatPlaques = [
      createSecretariatPlaqueTexture(0),
      createSecretariatPlaqueTexture(1),
      createSecretariatPlaqueTexture(2),
    ];
  }
  return cachedSecretariatPlaques[Math.abs(variant) % cachedSecretariatPlaques.length];
}
function getBankSign(variant = 0): THREE.CanvasTexture {
  if (!cachedBankSigns) {
    cachedBankSigns = [
      makeOfficeSignTexture('#1e3a8a', '#2563eb', '#60a5fa', 'প্রধান কার্যালয় • মতিঝিল', 'সোনালী ব্যাংক পিএলসি', 'SONALI BANK PLC • HEAD OFFICE DHAKA'),
      makeOfficeSignTexture('#064e3b', '#047857', '#facc15', 'কর্পোরেট ব্যাংকিং ও বৈদেশিক বিনিময়', 'ইসলামী বাণিজ্যিক ব্যাংক', 'ISLAMI & COMMERCIAL TOWER • DHAKA'),
      makeOfficeSignTexture('#0f172a', '#1e293b', '#38bdf8', 'পুঁজিবাজার ও কর্পোরেট ফাইন্যান্স', 'ঢাকা স্টক এক্সচেঞ্জ ভবন', 'DHAKA STOCK EXCHANGE & BROKERAGE HQ'),
    ];
  }
  return cachedBankSigns[Math.abs(variant) % cachedBankSigns.length];
}
function getOfficeFacade(): THREE.CanvasTexture {
  if (!cachedOfficeFacade) cachedOfficeFacade = createModernOfficeFacadeTexture();
  return cachedOfficeFacade;
}
function getBdFlag(): THREE.CanvasTexture {
  if (!cachedBdFlag) cachedBdFlag = createBdFlagTexture();
  return cachedBdFlag;
}
function getBarPlaque(): THREE.CanvasTexture {
  if (!cachedBarPlaque) {
    cachedBarPlaque = makeOfficeSignTexture(
      '#1e1b4b',
      '#312e81',
      '#facc15',
      'বাংলাদেশ বার কাউন্সিল অনুমোদিত',
      'ঢাকা আইনজীবী সমিতি ভবন',
      'DHAKA BAR ASSOCIATION & ADVOCATES ANNEX'
    );
  }
  return cachedBarPlaque;
}
function getTaxPlaque(): THREE.CanvasTexture {
  if (!cachedTaxPlaque) {
    cachedTaxPlaque = makeOfficeSignTexture(
      '#064e3b',
      '#065f46',
      '#34d399',
      'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার',
      'জাতীয় রাজস্ব বোর্ড ও কর অঞ্চল',
      'NATIONAL BOARD OF REVENUE & TAX ZONE',
      '#dc2626'
    );
  }
  return cachedTaxPlaque;
}
function getItHubSign(variant = 0): THREE.CanvasTexture {
  if (!cachedItHubSigns) {
    cachedItHubSigns = [
      makeOfficeSignTexture('#0f172a', '#0369a1', '#38bdf8', 'কারওয়ান বাজার • টেক ও সফটওয়্যার জোন', 'ঢাকা আইটি ও সফটওয়্যার পার্ক', 'DHAKA TECH HUB • SOFTWARE & CLOUD HQ'),
      makeOfficeSignTexture('#1e1b4b', '#4338ca', '#c084fc', '২৪ ঘণ্টা সম্প্রচার ও ডিজিটাল মিডিয়া', 'মেট্রোপলিস মিডিয়া ও কর্পোরেট সেন্টার', 'MEDIA HOUSE & CORPORATE OFFICE TOWER'),
      makeOfficeSignTexture('#042f2e', '#0f766e', '#2dd4bf', 'টেলিকম • ফিনটেক • স্টার্টআপ হাব', 'পদ্মা টেকনোলজি প্লাজা', 'PADMA FINTECH & TELECOM HEADQUARTERS'),
    ];
  }
  return cachedItHubSigns[Math.abs(variant) % cachedItHubSigns.length];
}
function getNagarSign(variant = 0): THREE.CanvasTexture {
  if (!cachedNagarSigns) {
    cachedNagarSigns = [
      makeOfficeSignTexture('#7f1d1d', '#991b1b', '#facc15', 'ঢাকা দক্ষিণ সিটি কর্পোরেশন', 'নগর ভবন ও নাগরিক সেবা দপ্তর', 'DHAKA SOUTH CITY CORPORATION • NAGAR BHABAN', '#006a4e'),
      makeOfficeSignTexture('#14532d', '#166534', '#fde047', 'ওয়াসা ও নগর উন্নয়ন কর্তৃপক্ষ', 'ঢাকা ওয়াসা ও রাজউক ভবন', 'DHAKA WASA & RAJUK SERVICE COMPLEX', '#dc2626'),
    ];
  }
  return cachedNagarSigns[Math.abs(variant) % cachedNagarSigns.length];
}
function getGarmentSign(variant = 0): THREE.CanvasTexture {
  if (!cachedGarmentSigns) {
    cachedGarmentSigns = [
      makeOfficeSignTexture('#1e293b', '#334155', '#f59e0b', '১০০% রপ্তানিমুখী তৈরি পোশাক ও বায়িং হাউজ', 'বেঙ্গল অ্যাপারেলস ও বায়িং হাউজ', 'BENGAL GARMENTS & BUYING HOUSE LTD.'),
      makeOfficeSignTexture('#0c4a6e', '#075985', '#fde047', 'টেক্সটাইল • নিটওয়্যার • আন্তর্জাতিক এক্সপোর্ট', 'পদ্মা নিট ফ্যাশন ও কর্পোরেট অফিস', 'PADMA KNIT FASHION & EXPORT OFFICE'),
    ];
  }
  return cachedGarmentSigns[Math.abs(variant) % cachedGarmentSigns.length];
}

/**
 * Helper: Adds glazed architectural windows + mullions + AC units to side walls (±X) and back (-Z)
 * so every office/institution reads crisply from all street angles.
 */
function addSideAndRearWindows(
  target: THREE.Group,
  width: number,
  depth: number,
  floorYs: number[],
  zOffsets: number[],
  xOffsetsBack: number[],
  winW: number,
  winH: number,
  frameMat: THREE.Material,
  glassMat: THREE.Material,
  acMat?: THREE.Material
): void {
  const halfW = width / 2;
  const halfD = depth / 2;

  [-1, 1].forEach((sideSign) => {
    const faceX = sideSign * (halfW + 0.04);
    const rotY = sideSign > 0 ? Math.PI / 2 : -Math.PI / 2;
    floorYs.forEach((wy, fi) => {
      zOffsets.forEach((wz, zi) => {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.22, winH + 0.22, 0.12), frameMat);
        frame.position.set(faceX, wy, wz);
        frame.rotation.y = rotY;
        target.add(frame);

        const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
        glass.position.set(faceX + sideSign * 0.07, wy, wz);
        glass.rotation.y = rotY;
        target.add(glass);

        if (acMat && (fi + zi) % 3 === 0) {
          const ac = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.34), acMat);
          ac.position.set(faceX + sideSign * 0.16, wy - winH * 0.45, wz + 0.35);
          ac.rotation.y = rotY;
          target.add(ac);
        }
      });
    });
  });

  floorYs.forEach((wy) => {
    xOffsetsBack.forEach((wx) => {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(winW, winH), glassMat);
      glass.position.set(wx, wy, -halfD - 0.05);
      glass.rotation.y = Math.PI;
      target.add(glass);
    });
  });
}

/**
 * 1. DHAKA DISTRICT & SESSIONS JUDGE COURT (ঢাকা জেলা ও দায়রা জজ আদালত)
 */
export function createJudgeCourtModel(textures: ProceduralTexturePack): THREE.Group {
  const court = new THREE.Group();
  court.add(createContactShadowMesh(textures.contactShadow, 32, 24));

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.65, metalness: 0.05 });
  const redBrickMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.8 });
  const marblePillarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.1 });
  const darkRoofMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const goldBrassMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.85 });
  const ironGateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.15,
    metalness: 0.72,
    transparent: true,
    opacity: 0.78,
  });

  const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 18), stoneMat);
  basePlinth.position.set(0, 0.6, 0);
  basePlinth.receiveShadow = true;
  court.add(basePlinth);

  for (let s = 0; s < 4; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(14 - s * 0.8, 0.25, 4.0 - s * 0.7),
      stoneMat
    );
    step.position.set(0, 0.125 + s * 0.25, 9.0 - s * 0.6);
    step.receiveShadow = true;
    court.add(step);
  }

  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(24, 9.5, 14), redBrickMat);
  mainHall.position.set(0, 5.95, -1.0);
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  court.add(mainHall);

  // Decorative white sandstone horizontal cornice bands on central hall
  [3.6, 7.2, 10.7].forEach((by) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(24.3, 0.28, 14.3), stoneMat);
    band.position.set(0, by, -1.0);
    court.add(band);
  });

  for (const wx of [-15, 15]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(7, 7.5, 12), redBrickMat);
    wing.position.set(wx, 4.95, -1.0);
    court.add(wing);

    const wingCornice = new THREE.Mesh(new THREE.BoxGeometry(7.35, 0.35, 12.35), stoneMat);
    wingCornice.position.set(wx, 8.7, -1.0);
    court.add(wingCornice);

    // Side & front arched windows on side wings
    for (let wy = 3.2; wy <= 6.5; wy += 2.8) {
      for (let wz = -4.5; wz <= 3.5; wz += 3.2) {
        const archWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), glassMat);
        archWindow.position.set(wx + (wx > 0 ? 3.54 : -3.54), wy, wz);
        archWindow.rotation.y = wx > 0 ? Math.PI / 2 : -Math.PI / 2;
        court.add(archWindow);
      }
      const frontWin = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.0), glassMat);
      frontWin.position.set(wx, wy, 5.04);
      court.add(frontWin);
    }
  }

  // Rear windows on main hall
  [-7.5, -2.5, 2.5, 7.5].forEach((rx) => {
    [3.5, 7.2].forEach((ry) => {
      const rw = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.1), glassMat);
      rw.position.set(rx, ry, -8.04);
      rw.rotation.y = Math.PI;
      court.add(rw);
    });
  });

  // Portico Colonnade (8 classical Doric pillars)
  const pillarGeo = new THREE.CylinderGeometry(0.42, 0.48, 7.2, 10);
  const pillarSpacing = 2.4;
  for (let i = -3.5; i <= 3.5; i += 1.0) {
    const px = i * pillarSpacing;
    const pillar = new THREE.Mesh(pillarGeo, marblePillarMat);
    pillar.position.set(px, 4.8, 6.4);
    court.add(pillar);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.35, 1.15), stoneMat);
    cap.position.set(px, 8.4, 6.4);
    court.add(cap);

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), stoneMat);
    base.position.set(px, 1.35, 6.4);
    court.add(base);
  }

  const architrave = new THREE.Mesh(new THREE.BoxGeometry(20, 0.9, 3.5), stoneMat);
  architrave.position.set(0, 8.95, 6.4);
  court.add(architrave);

  const pediment = new THREE.Mesh(new THREE.ConeGeometry(10.5, 3.6, 4), stoneMat);
  pediment.rotation.y = Math.PI / 4;
  pediment.scale.set(1.4, 1.0, 0.35);
  pediment.position.set(0, 11.2, 6.4);
  court.add(pediment);

  const scalesEmblem = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.08, 8, 24), goldBrassMat);
  scalesEmblem.position.set(0, 10.6, 7.3);
  court.add(scalesEmblem);

  const scalesBeam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.05), goldBrassMat);
  scalesBeam.position.set(0, 10.7, 7.32);
  court.add(scalesBeam);

  const courtPlaqueMat = new THREE.MeshStandardMaterial({ map: getCourtPlaque(), roughness: 0.3, metalness: 0.2 });
  const plaqueMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.2), courtPlaqueMat);
  plaqueMesh.position.set(0, 6.8, 5.85);
  court.add(plaqueMesh);

  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 5.2, 0.2),
    new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 })
  );
  doorFrame.position.set(0, 3.8, 5.9);
  court.add(doorFrame);

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

  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 8), goldBrassMat);
  flagPole.position.set(0, 16.5, -1.0);
  court.add(flagPole);

  const flagMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.0),
    new THREE.MeshStandardMaterial({ map: getBdFlag(), roughness: 0.5, side: THREE.DoubleSide })
  );
  flagMesh.position.set(0.85, 17.8, -1.0);
  court.add(flagMesh);

  for (const bx of [-11, 11]) {
    const wallBase = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 0.6), redBrickMat);
    wallBase.position.set(bx, 0.4, 9.5);
    court.add(wallBase);

    for (let ix = bx - 3.6; ix <= bx + 3.6; ix += 0.55) {
      const spear = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 5), ironGateMat);
      spear.position.set(ix, 1.4, 9.5);
      court.add(spear);
    }
  }

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
 * 2. BANGLADESH SECRETARIAT / MINISTRY COMPLEX (বাংলাদেশ সচিবালয় ও প্রশাসনিক ভবন)
 */
export function createSecretariatOfficeModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const office = new THREE.Group();
  office.add(createContactShadowMesh(textures.contactShadow, 28, 22));

  const wallColors = [0xe2e8f0, 0xede5d8, 0xdbe4ea];
  const concreteMat = new THREE.MeshStandardMaterial({
    color: wallColors[Math.abs(variant) % wallColors.length],
    roughness: 0.68,
    metalness: 0.08,
  });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.18, metalness: 0.72 });
  const louverMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
  const acWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.8 });

  const w = 22;
  const h = 14.5;
  const d = 12;

  const officeBlock = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), concreteMat);
  officeBlock.position.set(0, h / 2, 0);
  officeBlock.castShadow = true;
  officeBlock.receiveShadow = true;
  office.add(officeBlock);

  // Side vertical stair-core accent fins
  [-w / 2 + 0.8, w / 2 - 0.8].forEach((px) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.1, h + 0.4, d + 0.3), louverMat);
    fin.position.set(px, h / 2, 0);
    office.add(fin);
  });

  const facadeMat = new THREE.MeshStandardMaterial({ map: getOfficeFacade(), roughness: 0.45 });
  const frontFacade = new THREE.Mesh(new THREE.PlaneGeometry(19.2, 11.5), facadeMat);
  frontFacade.position.set(0, 7.6, d / 2 + 0.04);
  office.add(frontFacade);

  const rearFacade = new THREE.Mesh(new THREE.PlaneGeometry(19.2, 11.5), facadeMat);
  rearFacade.position.set(0, 7.6, -d / 2 - 0.04);
  rearFacade.rotation.y = Math.PI;
  office.add(rearFacade);

  // Side facades (±X) with glass bays + sunshade louvers + AC units
  addSideAndRearWindows(
    office,
    w,
    d,
    [3.8, 7.2, 10.6],
    [-3.4, 0, 3.4],
    [],
    2.1,
    1.75,
    louverMat,
    darkGlassMat,
    acWhiteMat
  );

  // Horizontal sunshade louvers on front AND side walls
  for (let ly = 3.5; ly <= 13.0; ly += 2.2) {
    const louver = new THREE.Mesh(new THREE.BoxGeometry(w + 0.45, 0.22, d + 0.72), louverMat);
    louver.position.set(0, ly, 0);
    office.add(louver);
  }

  for (let r = 0; r < 4; r++) {
    for (let c = -4; c <= 4; c += 2) {
      if ((r + c) % 2 === 0) {
        const acUnit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.55, 0.45), acWhiteMat);
        acUnit.position.set(c * 2.1, 4.0 + r * 2.2, d / 2 + 0.45);
        office.add(acUnit);
      }
    }
  }

  // Grand VIP Car Porch & Entrance Stairs
  const porchBase = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.35, 6.8), concreteMat);
  porchBase.position.set(0, 0.175, 8.8);
  office.add(porchBase);

  const porchRoof = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.6, 6.5), concreteMat);
  porchRoof.position.set(0, 3.8, 8.8);
  office.add(porchRoof);

  for (const px of [-4.8, 4.8]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.8, 8), concreteMat);
    p.position.set(px, 1.9, 11.5);
    office.add(p);

    // Flagpoles flanking VIP canopy
    const fPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 4.2, 6), goldMat);
    fPole.position.set(px * 1.25, 2.1, 11.8);
    office.add(fPole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.72),
      new THREE.MeshStandardMaterial({ map: getBdFlag(), roughness: 0.55, side: THREE.DoubleSide })
    );
    flag.position.set(px * 1.25 + 0.58, 3.7, 11.8);
    office.add(flag);
  }

  const secPlaqueMat = new THREE.MeshStandardMaterial({
    map: getSecretariatPlaque(variant),
    roughness: 0.3,
    metalness: 0.2,
  });
  const secPlaque = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 2.0), secPlaqueMat);
  secPlaque.position.set(0, 4.9, 11.85);
  office.add(secPlaque);

  const entranceGlass = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.3), darkGlassMat);
  entranceGlass.position.set(0, 1.75, 6.06);
  office.add(entranceGlass);

  // Rooftop Parapet, Penthouse, Solar Panels & Water Tanks
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.75, d + 0.4), louverMat);
  parapet.position.set(0, h + 0.375, 0);
  office.add(parapet);

  const penthouse = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.5, 5.0), concreteMat);
  penthouse.position.set(0, h + 1.25, 0);
  office.add(penthouse);

  for (const tx of [-1.8, 1.8]) {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 1.8, 10),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    tank.position.set(tx, h + 3.4, 0);
    office.add(tank);
  }

  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.7 });
  [5.8, 8.2].forEach((sx) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 3.4), solarMat);
    panel.position.set(sx, h + 0.9, -1.5);
    panel.rotation.x = 0.28;
    office.add(panel);
  });

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.08, 4.5, 6),
    new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 })
  );
  mast.position.set(-6.5, h + 2.25, 2);
  office.add(mast);

  const aviationBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 7, 7),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  aviationBeacon.position.set(-6.5, h + 4.55, 2);
  office.add(aviationBeacon);

  const barrierPost = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.45), concreteMat);
  barrierPost.position.set(6.2, 0.55, 12.0);
  office.add(barrierPost);

  const barrierArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 4.8, 7),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 })
  );
  barrierArm.rotation.z = Math.PI / 2;
  barrierArm.position.set(3.8, 0.9, 12.0);
  office.add(barrierArm);

  return office;
}

/**
 * 3. MOTIJHEEL COMMERCIAL CORPORATE BANK & EXCHANGE TOWER (বাণিজ্যিক ব্যাংক ও অফিস টাওয়ার)
 */
export function createCommercialBankTowerModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const tower = new THREE.Group();
  tower.add(createContactShadowMesh(textures.contactShadow, 24, 20));

  const frameColors = [0x0f172a, 0x1e293b, 0x172554];
  const glassColors = [0x0284c7, 0x0f766e, 0x1d4ed8];
  const v = Math.abs(variant);

  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: frameColors[v % frameColors.length],
    roughness: 0.48,
    metalness: 0.8,
  });
  const curtainGlassMat = new THREE.MeshStandardMaterial({
    color: glassColors[v % glassColors.length],
    roughness: 0.12,
    metalness: 0.85,
  });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.42, metalness: 0.6 });
  const crownGlowMat = new THREE.MeshBasicMaterial({
    color: v % 3 === 1 ? 0x34d399 : v % 3 === 2 ? 0x38bdf8 : 0xfacc15,
  });

  const w = 18;
  const h = 22 + (v % 2) * 3.0;
  const d = 14;

  const towerBody = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkSteelMat);
  towerBody.position.set(0, h / 2, 0);
  towerBody.castShadow = true;
  towerBody.receiveShadow = true;
  tower.add(towerBody);

  // Full 4-sided curtain wall glass skin + horizontal aluminum floor spandrel bands
  const glassWrap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, h - 4.2, d + 0.14), curtainGlassMat);
  glassWrap.position.set(0, 3.8 + (h - 4.2) / 2, 0);
  tower.add(glassWrap);

  for (let sy = 4.5; sy < h - 1.5; sy += 3.2) {
    const spandrel = new THREE.Mesh(new THREE.BoxGeometry(w + 0.34, 0.32, d + 0.34), silverMat);
    spandrel.position.set(0, sy, 0);
    tower.add(spandrel);
  }

  // Vertical mullions on Front/Back AND Sides!
  for (let mx = -7.5; mx <= 7.5; mx += 2.5) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.16, h - 1.5, d + 0.42), darkSteelMat);
    mullion.position.set(mx, h / 2 + 0.5, 0);
    tower.add(mullion);
  }
  for (let mz = -5.0; mz <= 5.0; mz += 2.5) {
    const sideMullion = new THREE.Mesh(new THREE.BoxGeometry(w + 0.42, h - 1.5, 0.16), darkSteelMat);
    sideMullion.position.set(0, h / 2 + 0.5, mz);
    tower.add(sideMullion);
  }

  // Glowing Architectural Crown Ribbon & Rooftop Parapet
  const crownBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.45, 0.38, d + 0.45), crownGlowMat);
  crownBand.position.set(0, h - 0.55, 0);
  tower.add(crownBand);

  const signMat = new THREE.MeshBasicMaterial({ map: getBankSign(v) });
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(16.2, 2.9), signMat);
  signMesh.position.set(0, h - 2.3, d / 2 + 0.25);
  tower.add(signMesh);

  // Ground Floor Double-Height Executive Atrium, Revolving Door & Security Bollards
  const lobbyFrame = new THREE.Mesh(new THREE.BoxGeometry(10.5, 4.2, 2.5), darkSteelMat);
  lobbyFrame.position.set(0, 2.1, d / 2 + 0.75);
  tower.add(lobbyFrame);

  const lobbyGlass = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 3.6), curtainGlassMat);
  lobbyGlass.position.set(0, 2.1, d / 2 + 2.02);
  tower.add(lobbyGlass);

  const revolvingDoor = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2.6, 12),
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    })
  );
  revolvingDoor.position.set(0, 1.3, d / 2 + 2.0);
  tower.add(revolvingDoor);

  [-4.8, -2.6, 2.6, 4.8].forEach((bx) => {
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.85, 6), silverMat);
    bollard.position.set(bx, 0.425, d / 2 + 2.55);
    tower.add(bollard);
  });

  // Rooftop Helipad, HVAC Chillers & Telecom Antenna
  const helipadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const helipad = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 11), helipadMat);
  helipad.position.set(0, h + 0.2, 0);
  tower.add(helipad);

  const yellowMarkMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
  [-1.8, 1.8].forEach((hx) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 4.0), yellowMarkMat);
    leg.position.set(hx, h + 0.45, 0);
    tower.add(leg);
  });
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 0.5), yellowMarkMat);
  hBar.position.set(0, h + 0.45, 0);
  tower.add(hBar);

  const hRing = new THREE.Mesh(new THREE.RingGeometry(3.8, 4.2, 20), yellowMarkMat);
  hRing.rotation.x = -Math.PI / 2;
  hRing.position.set(0, h + 0.45, 0);
  tower.add(hRing);

  const chiller = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.35, 2.2), silverMat);
  chiller.position.set(-5.8, h + 0.85, -3.5);
  tower.add(chiller);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 7.5, 6), darkSteelMat);
  antenna.position.set(6.2, h + 3.75, -3.5);
  tower.add(antenna);

  return tower;
}

/**
 * 4. DHAKA BAR ASSOCIATION & ADVOCATES CHAMBERS (ঢাকা আইনজীবী সমিতি ও অ্যাডভোকেট চেম্বার)
 */
export function createBarAssociationChamberModel(textures: ProceduralTexturePack): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 28, 16));

  const brickMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.85 });
  const plasterMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
  const darkFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, transparent: true, opacity: 0.72 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });

  const w = 24;
  const h = 11.4;
  const d = 10;

  const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), brickMat);
  mainBlock.position.set(0, h / 2, 0);
  mainBlock.castShadow = true;
  mainBlock.receiveShadow = true;
  building.add(mainBlock);

  [3.8, 7.5].forEach((vy) => {
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(23.2, 0.35, 2.2), plasterMat);
    balcony.position.set(0, vy, 5.8);
    building.add(balcony);

    const railing = new THREE.Mesh(new THREE.BoxGeometry(23.2, 0.85, 0.1), darkFrameMat);
    railing.position.set(0, vy + 0.5, 6.8);
    building.add(railing);
  });

  for (let px = -10.5; px <= 10.5; px += 3.5) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.45, h, 0.45), plasterMat);
    pillar.position.set(px, h / 2, 6.7);
    building.add(pillar);

    // Advocate nameplate plaques mounted on veranda pillars
    const nameplate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.08), goldMat);
    nameplate.position.set(px, 2.2, 6.96);
    building.add(nameplate);
  }

  for (let wx = -9; wx <= 9; wx += 3) {
    [2.2, 5.8, 9.2].forEach((wy) => {
      const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.85, 0.12), darkFrameMat);
      windowFrame.position.set(wx, wy, 5.05);
      building.add(windowFrame);

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, 0.32), plasterMat);
      lintel.position.set(wx, wy + 1.0, 5.15);
      building.add(lintel);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), glassMat);
      glass.position.set(wx, wy, 5.13);
      building.add(glass);
    });
  }

  addSideAndRearWindows(
    building,
    w,
    d,
    [2.3, 5.9, 9.3],
    [-2.8, 2.8],
    [-8, -4, 0, 4, 8],
    1.6,
    1.65,
    darkFrameMat,
    glassMat
  );

  const parapet = new THREE.Mesh(new THREE.BoxGeometry(24.4, 0.8, 10.4), plasterMat);
  parapet.position.set(0, h + 0.4, 0);
  building.add(parapet);

  const plaqueMat = new THREE.MeshBasicMaterial({ map: getBarPlaque() });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.0), plaqueMat);
  plaque.position.set(0, 9.4, 5.18);
  building.add(plaque);

  [-7, -3, 3, 7].forEach((dx) => {
    const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 0.9), woodMat);
    table.position.set(dx, 0.4, 7.8);
    building.add(table);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.4), woodMat);
    bench.position.set(dx, 0.25, 8.6);
    building.add(bench);

    const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), darkFrameMat);
    umbrellaPole.position.set(dx + 0.7, 1.1, 7.8);
    building.add(umbrellaPole);

    const umbrellaCone = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: dx % 2 === 0 ? 0xef4444 : 0x0284c7, roughness: 0.7 })
    );
    umbrellaCone.position.set(dx + 0.7, 2.3, 7.8);
    building.add(umbrellaCone);
  });

  return building;
}

/**
 * 5. BANGLADESH BANK ANNEX & NBR TAX COMPLEX (জাতীয় রাজস্ব বোর্ড ও কর অঞ্চল কমপ্লেক্স)
 */
export function createTaxAndBankAnnexModel(textures: ProceduralTexturePack): THREE.Group {
  const building = new THREE.Group();
  building.add(createContactShadowMesh(textures.contactShadow, 26, 18));

  const graniteMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.55 });
  const atmMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.35 });

  const w = 22;
  const h = 18.5;
  const d = 12;

  const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), graniteMat);
  tower.position.set(0, h / 2, 0);
  tower.castShadow = true;
  tower.receiveShadow = true;
  building.add(tower);

  // Full 4-sided recessed curtain glass + horizontal spandrel bands + fin mullions
  const glassWrap = new THREE.Mesh(new THREE.BoxGeometry(w - 2.4, h - 4.4, d + 0.16), glassMat);
  glassWrap.position.set(0, 10.2, 0);
  building.add(glassWrap);

  const sideGlassWrap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.16, h - 4.4, d - 3.2), glassMat);
  sideGlassWrap.position.set(0, 10.2, 0);
  building.add(sideGlassWrap);

  for (let sy = 5.0; sy <= 16.5; sy += 2.8) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.34, 0.28, d + 0.34), silverMat);
    band.position.set(0, sy, 0);
    building.add(band);
  }

  for (let mx = -8.5; mx <= 8.5; mx += 2.1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, h - 3.8, d + 0.42), silverMat);
    fin.position.set(mx, 10.2, 0);
    building.add(fin);
  }

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(10, 0.45, 3.5), silverMat);
  canopy.position.set(0, 3.6, 7.5);
  building.add(canopy);

  [-4.5, 4.5].forEach((cx) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.6, 7), silverMat);
    post.position.set(cx, 1.8, 9.0);
    building.add(post);
  });

  const revolving = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2.6, 10),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, transparent: true, opacity: 0.8 })
  );
  revolving.position.set(0, 1.3, 6.1);
  building.add(revolving);

  const plaqueMat = new THREE.MeshBasicMaterial({ map: getTaxPlaque() });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.8), plaqueMat);
  plaque.position.set(0, 5.4, 6.15);
  building.add(plaque);

  const atmBooth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 1.8), atmMat);
  atmBooth.position.set(7.5, 1.4, 6.8);
  building.add(atmBooth);

  const atmSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.6),
    new THREE.MeshBasicMaterial({ color: 0x4ade80 })
  );
  atmSign.position.set(7.5, 2.4, 7.72);
  building.add(atmSign);

  const antMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 6.5, 6), antMat);
  ant.position.set(-6, h + 3.25, -2);
  building.add(ant);

  const dish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 7, 0, Math.PI), antMat);
  dish.rotation.x = -Math.PI / 3;
  dish.position.set(5.5, h + 0.5, -2);
  building.add(dish);

  return building;
}

/**
 * 6. NEW OFFICE VARIANT: DHAKA IT HUB & CORPORATE MEDIA TOWER ("ঢাকা আইটি পার্ক ও কর্পোরেট অফিস টাওয়ার")
 * Modern setback glass skyscraper with illuminated vertical elevator spine, stepped podium terrace,
 * rooftop chillers, twin telecom dishes & 4-sided louver grid.
 */
export function createItTechHubTowerModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const tower = new THREE.Group();
  tower.add(createContactShadowMesh(textures.contactShadow, 20, 16));

  const v = Math.abs(variant);
  const framePalette = [0x0f172a, 0x1e293b, 0x064e3b];
  const glassPalette = [0x0ea5e9, 0x6366f1, 0x14b8a6];
  const accentPalette = [0x38bdf8, 0xc084fc, 0x2dd4bf];

  const steelMat = new THREE.MeshStandardMaterial({
    color: framePalette[v % framePalette.length],
    roughness: 0.38,
    metalness: 0.72,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: glassPalette[v % glassPalette.length],
    roughness: 0.12,
    metalness: 0.8,
  });
  const silverMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.55 });
  const glowAccentMat = new THREE.MeshBasicMaterial({ color: accentPalette[v % accentPalette.length] });

  // Ground-to-3rd floor wider granite podium
  const podium = new THREE.Mesh(new THREE.BoxGeometry(15.2, 5.2, 11.4), steelMat);
  podium.position.set(0, 2.6, 0);
  podium.castShadow = true;
  podium.receiveShadow = true;
  tower.add(podium);

  const podiumGlass = new THREE.Mesh(new THREE.BoxGeometry(14.4, 3.8, 11.58), glassMat);
  podiumGlass.position.set(0, 2.1, 0);
  tower.add(podiumGlass);

  // Mid setback curtain-wall tower (floors 4..10)
  const midH = 15.5 + (v % 2) * 3.0;
  const midCore = new THREE.Mesh(new THREE.BoxGeometry(12.2, midH, 9.6), glassMat);
  midCore.position.set(-0.6, 5.2 + midH / 2, -0.2);
  midCore.castShadow = true;
  tower.add(midCore);

  // Floor spandrel louver rings wrapping mid tower
  for (let fy = 6.5; fy <= 5.2 + midH; fy += 2.6) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.24, 10.0), silverMat);
    band.position.set(-0.6, fy, -0.2);
    tower.add(band);
  }

  // External Glass Panoramic Elevator Spine on right corner (+X)
  const liftSpine = new THREE.Mesh(new THREE.BoxGeometry(2.2, midH + 6.4, 3.4), steelMat);
  liftSpine.position.set(5.9, (midH + 6.4) / 2, 2.6);
  tower.add(liftSpine);

  const liftGlass = new THREE.Mesh(new THREE.BoxGeometry(2.3, midH + 4.8, 2.2), glowAccentMat);
  liftGlass.position.set(5.9, (midH + 6.4) / 2, 2.8);
  tower.add(liftGlass);

  // Top setback Executive Crown + Illuminated Crown Strip
  const topY = 5.2 + midH;
  const crown = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.6, 7.6), steelMat);
  crown.position.set(-0.6, topY + 1.8, -0.2);
  tower.add(crown);

  const crownGlow = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.34, 7.8), glowAccentMat);
  crownGlow.position.set(-0.6, topY + 3.45, -0.2);
  tower.add(crownGlow);

  // Bilingual Corporate Tech Signboard above podium canopy
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.35, 3.2), silverMat);
  canopy.position.set(0, 4.1, 6.8);
  tower.add(canopy);

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 2.4, 0.16),
    new THREE.MeshBasicMaterial({ map: getItHubSign(v) })
  );
  signMesh.position.set(-0.6, 6.7, 4.75);
  tower.add(signMesh);

  // Rooftop telecom mast & chiller boxes
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 5.2, 6), silverMat);
  mast.position.set(-2.5, topY + 6.2, -1.2);
  tower.add(mast);

  const chiller = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.1, 2.2), silverMat);
  chiller.position.set(1.8, topY + 4.15, -1.5);
  tower.add(chiller);

  return tower;
}

/**
 * 7. NEW OFFICE VARIANT: NAGAR BHABAN / GOVT DEPARTMENT COMPLEX ("নগর ভবন ও সরকারি দপ্তর")
 * Terracotta-brick & cream-concrete brutalist Dhaka civic office with vertical stairwell tower,
 * stepped horizontal concrete fins across all 4 walls, grand portico & rooftop tanks.
 */
export function createGovtMunicipalityOfficeModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const bldg = new THREE.Group();
  bldg.add(createContactShadowMesh(textures.contactShadow, 22, 16));

  const v = Math.abs(variant);
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.heritageBrick,
    color: v % 2 === 0 ? 0xc2593f : 0x993e24,
    roughness: 0.85,
  });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0xe7dfd1, roughness: 0.72 });
  const darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.22, metalness: 0.45 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 });

  const w = 18.0;
  const h = 15.2;
  const d = 10.6;

  // Main stepped terracotta civic wing
  const main = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), brickMat);
  main.position.set(0, h / 2, 0);
  main.castShadow = true;
  main.receiveShadow = true;
  bldg.add(main);

  // Iconic horizontal cream concrete sunshade bands & deep vertical piers on all 4 facades
  for (let fy = 3.6; fy <= h; fy += 3.6) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.55, 0.38, d + 0.55), concreteMat);
    slab.position.set(0, fy, 0);
    bldg.add(slab);
  }

  for (let px = -w / 2 + 1.2; px <= w / 2 - 1.2; px += 3.9) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.58, h, d + 0.65), concreteMat);
    pier.position.set(px, h / 2, 0);
    bldg.add(pier);
  }

  // Front & side recessed office window grids
  addSideAndRearWindows(
    bldg,
    w,
    d,
    [5.4, 9.0, 12.6],
    [-2.8, 2.8],
    [-6.0, -2.0, 2.0, 6.0],
    2.2,
    1.9,
    frameMat,
    darkGlassMat
  );

  [-5.8, -1.95, 1.95, 5.8].forEach((wx) => {
    [5.4, 9.0, 12.6].forEach((wy) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.0), darkGlassMat);
      win.position.set(wx, wy, d / 2 + 0.06);
      bldg.add(win);
    });
  });

  // Left concrete external stair tower with tall frosted vertical glazing
  const stairTower = new THREE.Mesh(new THREE.BoxGeometry(3.4, h + 2.2, 4.2), concreteMat);
  stairTower.position.set(-w / 2 - 1.4, (h + 2.2) / 2, 1.0);
  bldg.add(stairTower);

  const stairGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, h - 1.5), darkGlassMat);
  stairGlass.position.set(-w / 2 - 1.4, h / 2 + 0.5, 3.14);
  bldg.add(stairGlass);

  // Projecting Civic Entrance Porch & Official Signboard
  const porch = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.52, 4.2), concreteMat);
  porch.position.set(0, 3.75, d / 2 + 2.0);
  bldg.add(porch);

  [-3.8, 3.8].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 3.75, 0.55), concreteMat);
    col.position.set(cx, 1.875, d / 2 + 3.6);
    bldg.add(col);
  });

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, 2.25, 0.16),
    new THREE.MeshBasicMaterial({ map: getNagarSign(v) })
  );
  signMesh.position.set(0, 5.2, d / 2 + 0.38);
  bldg.add(signMesh);

  // Rooftop flagpole & blue Gazi water tanks
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 4.0, 6), frameMat);
  flagPole.position.set(0, h + 2.0, d / 2 - 0.8);
  bldg.add(flagPole);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 0.85),
    new THREE.MeshStandardMaterial({ map: getBdFlag(), roughness: 0.55, side: THREE.DoubleSide })
  );
  flag.position.set(0.7, h + 3.45, d / 2 - 0.8);
  bldg.add(flag);

  const tankMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.5 });
  [3.5, 5.6].forEach((tx) => {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 1.5, 10), tankMat);
    tank.position.set(tx, h + 0.95, -2.0);
    bldg.add(tank);
  });

  return bldg;
}

/**
 * 8. NEW OFFICE VARIANT: EXPORT GARMENT & BUYING HOUSE OFFICE ("এক্সপোর্ট গার্মেন্টস ও বায়িং হাউজ")
 * Wide industrial-commercial Dhaka office block with continuous ribbon glass bands on all 4 facades,
 * external steel fire-escape staircase, cargo loading roll-up door, & rooftop exhaust turbines.
 */
export function createGarmentExportOfficeFactoryModel(
  textures: ProceduralTexturePack,
  variant = 0
): THREE.Group {
  const bldg = new THREE.Group();
  bldg.add(createContactShadowMesh(textures.contactShadow, 20, 14));

  const v = Math.abs(variant);
  const wallMat = new THREE.MeshStandardMaterial({
    color: v % 2 === 0 ? 0xf1f5f9 : 0xe2e8f0,
    roughness: 0.72,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: v % 2 === 0 ? 0x0f766e : 0x1d4ed8,
    roughness: 0.52,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a5f,
    roughness: 0.16,
    metalness: 0.6,
  });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.48, metalness: 0.7 });
  const shutterMat = new THREE.MeshStandardMaterial({
    map: textures.corrugatedTin,
    color: 0x64748b,
    roughness: 0.5,
    metalness: 0.55,
  });

  const w = 16.4;
  const h = 16.2;
  const d = 10.2;

  const core = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  core.position.set(0, h / 2, 0);
  core.castShadow = true;
  core.receiveShadow = true;
  bldg.add(core);

  // Vertical colored corner brand stripes
  [-w / 2 + 0.5, w / 2 - 0.5].forEach((sx) => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, d + 0.16), accentMat);
    stripe.position.set(sx, h / 2, 0);
    bldg.add(stripe);
  });

  // Continuous wraparound ribbon window bands across all 4 walls (Floors 2..5)
  for (let fy = 4.6; fy <= 13.8; fy += 3.0) {
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 1.55, d + 0.12), glassMat);
    ribbon.position.set(0, fy, 0);
    bldg.add(ribbon);

    const sill = new THREE.Mesh(new THREE.BoxGeometry(w + 0.28, 0.2, d + 0.28), steelMat);
    sill.position.set(0, fy - 0.85, 0);
    bldg.add(sill);
  }

  // Ground-floor Corporate Reception Lobby + Freight Loading Shutter Bay
  const lobbyGlass = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.8), glassMat);
  lobbyGlass.position.set(-2.6, 1.45, d / 2 + 0.06);
  bldg.add(lobbyGlass);

  const lobbyCanopy = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.28, 2.0), accentMat);
  lobbyCanopy.position.set(-2.6, 3.05, d / 2 + 1.0);
  bldg.add(lobbyCanopy);

  const cargoBay = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.85, 0.25), shutterMat);
  cargoBay.position.set(4.2, 1.45, d / 2 + 0.05);
  bldg.add(cargoBay);

  // External Steel Fire-Escape Staircase Zig-Zag along right wall (+X)
  for (let fl = 0; fl < 4; fl++) {
    const sy = 1.6 + fl * 3.0;
    const landing = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.15, 3.6), steelMat);
    landing.position.set(w / 2 + 0.65, sy + 1.4, 0);
    bldg.add(landing);

    const flight = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.14, 3.4), steelMat);
    flight.position.set(w / 2 + 0.65, sy, 0);
    flight.rotation.x = fl % 2 === 0 ? 0.58 : -0.58;
    bldg.add(flight);
  }

  // Top fascia signboard
  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 2.1, 0.16),
    new THREE.MeshBasicMaterial({ map: getGarmentSign(v) })
  );
  signMesh.position.set(0, h - 0.9, d / 2 + 0.18);
  bldg.add(signMesh);

  // Rooftop exhaust vents & water tanks
  [-4.5, 0, 4.5].forEach((vx) => {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.95, 8), steelMat);
    vent.position.set(vx, h + 0.475, -1.2);
    bldg.add(vent);
  });

  return bldg;
}
