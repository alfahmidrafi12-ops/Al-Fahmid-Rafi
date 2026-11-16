import * as THREE from 'three';

export interface ProceduralTexturePack {
  asphalt: THREE.CanvasTexture;
  asphaltBump: THREE.CanvasTexture;
  curb: THREE.CanvasTexture;
  sidewalk: THREE.CanvasTexture;
  sidewalkBump: THREE.CanvasTexture;
  rickshawArt: THREE.CanvasTexture;
  rickshawHoodVariants: THREE.CanvasTexture[];
  rickshawRearArt: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  corrugatedTin: THREE.CanvasTexture;
  buildingWindows: THREE.CanvasTexture[];
  dhakaShopfrontGround: THREE.CanvasTexture[];
  shopSigns: THREE.CanvasTexture[];
  bangladeshiPosters: THREE.CanvasTexture[];
  heritageBrick: THREE.CanvasTexture;
  mosqueMosaic: THREE.CanvasTexture;
  metroLivery: THREE.CanvasTexture;
  trashTexture: THREE.CanvasTexture;
  buntingFlags: THREE.CanvasTexture;
  busBanner: THREE.CanvasTexture;
  cngWireMesh: THREE.CanvasTexture;
  cngPlate: THREE.CanvasTexture;
  cngFrontBanner: THREE.CanvasTexture;
  cngMeter: THREE.CanvasTexture;
  cngChevrons: THREE.CanvasTexture;
  cngMudflap: THREE.CanvasTexture;
  kaderFace: THREE.Texture;
  lungis: THREE.CanvasTexture[];
  zebraCrossing: THREE.CanvasTexture;
  trafficSignDmp: THREE.CanvasTexture;
  wallGraffitis: THREE.CanvasTexture[];
  streetAlpana: THREE.CanvasTexture;
  streetBanners: THREE.CanvasTexture[];
  newMarketArchSign: THREE.CanvasTexture;
  newMarketOverbridgeBanner: THREE.CanvasTexture;
  newMarketGarmentRack: THREE.CanvasTexture;
  marketStripedAwning: THREE.CanvasTexture;
  nilkhetBooksTex: THREE.CanvasTexture;
  billboards: THREE.CanvasTexture[];
  verticalBanners: THREE.CanvasTexture[];
  openShopSigns: THREE.CanvasTexture[];
  electionPosters: THREE.CanvasTexture[];
  electionPosterRope: THREE.CanvasTexture;
  npcScoldBubbles: THREE.CanvasTexture[];
  vehicleScoldBubbles: THREE.CanvasTexture[];
  uTurnRoadMark: THREE.CanvasTexture;
  uTurnSign: THREE.CanvasTexture;
  metroPillarBadge: THREE.CanvasTexture;
  chaiBreakKioskSign: THREE.CanvasTexture;
  jhalMuriKioskSign: THREE.CanvasTexture;
  disposeAll: () => void;
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function finalizeDataTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.anisotropy = maxAnisotropy;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTexturePack {
  const allTextures: THREE.Texture[] = [];

  // 1. Authentic Bangladesh Dhaka Asphalt Road (Bitumen patches, dusty shoulders, alligator cracks & Bangla stencil)
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 512;
  roadCanvas.height = 512;
  const rCtx = roadCanvas.getContext('2d')!;
  rCtx.fillStyle = '#252a32';
  rCtx.fillRect(0, 0, 512, 512);

  // Dusty Dhaka roadside shoulder grime along both curb gutters
  const leftDust = rCtx.createLinearGradient(0, 0, 38, 0);
  leftDust.addColorStop(0, 'rgba(116, 102, 82, 0.58)');
  leftDust.addColorStop(1, 'rgba(116, 102, 82, 0)');
  rCtx.fillStyle = leftDust;
  rCtx.fillRect(0, 0, 38, 512);

  const rightDust = rCtx.createLinearGradient(474, 0, 512, 0);
  rightDust.addColorStop(0, 'rgba(116, 102, 82, 0)');
  rightDust.addColorStop(1, 'rgba(116, 102, 82, 0.58)');
  rCtx.fillStyle = rightDust;
  rCtx.fillRect(474, 0, 38, 512);

  // Road surface mineral aggregate texture + paired linear bump canvas
  const roadBumpCanvas = document.createElement('canvas');
  roadBumpCanvas.width = 256;
  roadBumpCanvas.height = 256;
  const rbCtx = roadBumpCanvas.getContext('2d')!;
  rbCtx.fillStyle = '#808080';
  rbCtx.fillRect(0, 0, 256, 256);

  const shades = ['#1e232b', '#282e38', '#333a46', '#3d4554'];
  for (let i = 0; i < 2000; i++) {
    const rx = Math.random() * 512;
    const ry = Math.random() * 512;
    rCtx.fillStyle = shades[i & 3];
    rCtx.fillRect(rx, ry, 3, 3);
    rbCtx.fillStyle = i % 2 === 0 ? '#9c9c9c' : '#646464';
    rbCtx.fillRect(rx * 0.5, ry * 0.5, 2, 2);
  }

  // Worn tire rut tracks across all 4 distinct lanes (2 inbound + 2 outbound)
  rCtx.fillStyle = 'rgba(14, 17, 22, 0.40)';
  rCtx.fillRect(46, 0, 56, 512);
  rCtx.fillRect(156, 0, 58, 512);
  rCtx.fillRect(298, 0, 58, 512);
  rCtx.fillRect(410, 0, 56, 512);

  // Authentic cold-mix bitumen repair patches + hairline tarmac cracks
  rCtx.fillStyle = '#1b1f26';
  rCtx.beginPath();
  rCtx.ellipse(134, 245, 44, 28, 0.18, 0, Math.PI * 2);
  rCtx.fill();
  rCtx.beginPath();
  rCtx.ellipse(386, 98, 34, 22, -0.25, 0, Math.PI * 2);
  rCtx.fill();
  rbCtx.fillStyle = '#545454';
  rbCtx.beginPath();
  rbCtx.ellipse(67, 122, 22, 14, 0.18, 0, Math.PI * 2);
  rbCtx.fill();

  rCtx.strokeStyle = '#12151a';
  rCtx.lineWidth = 2;
  rCtx.beginPath();
  rCtx.moveTo(96, 365);
  rCtx.lineTo(132, 392);
  rCtx.lineTo(118, 434);
  rCtx.moveTo(355, 290);
  rCtx.lineTo(392, 326);
  rCtx.stroke();

  // Slightly weathered White curb edge lines
  rCtx.fillStyle = '#e2e8f0';
  rCtx.fillRect(18, 0, 7, 512);
  rCtx.fillRect(487, 0, 7, 512);

  // 4-Lane Dashed White Carriageway Lane Dividers (splits each 2-lane side cleanly!)
  for (let y = 16; y < 512; y += 128) {
    rCtx.fillStyle = '#f1f5f9';
    rCtx.fillRect(126, y, 8, 68);
    rCtx.fillRect(378, y, 8, 68);
  }

  // Solid Double Yellow Center Median Lines framing the center road divider
  rCtx.fillStyle = '#eab308';
  rCtx.fillRect(243, 0, 7, 512);
  rCtx.fillRect(262, 0, 7, 512);

  const asphalt = finalizeColorTexture(roadCanvas, maxAnisotropy, 1, 8);
  const asphaltBump = finalizeDataTexture(roadBumpCanvas, maxAnisotropy, 1, 8);
  allTextures.push(asphalt, asphaltBump);

  // 2. Dhaka Yellow & Black Striped Curb with bottom road grime
  const curbCanvas = document.createElement('canvas');
  curbCanvas.width = 256;
  curbCanvas.height = 256;
  const cCtx = curbCanvas.getContext('2d')!;
  for (let y = 0; y < 256; y += 64) {
    cCtx.fillStyle = (y / 64) % 2 === 0 ? '#eab308' : '#18181b';
    cCtx.fillRect(0, y, 256, 64);
    cCtx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    cCtx.fillRect(0, y + 60, 256, 4);
  }
  cCtx.fillStyle = 'rgba(255,255,255,0.12)';
  cCtx.fillRect(0, 0, 28, 256);
  cCtx.fillStyle = 'rgba(120, 95, 65, 0.32)';
  cCtx.fillRect(216, 0, 40, 256);
  const curb = finalizeColorTexture(curbCanvas, maxAnisotropy, 1, 24);
  allTextures.push(curb);

  // 3. Authentic Dhaka City Corporation (DSCC/DNCC) Red-Ochre & Concrete Interlocking Footpath Pavers + Drainage Grates
  const swCanvas = document.createElement('canvas');
  swCanvas.width = 256;
  swCanvas.height = 256;
  const swCtx = swCanvas.getContext('2d')!;
  const swBumpCanvas = document.createElement('canvas');
  swBumpCanvas.width = 256;
  swBumpCanvas.height = 256;
  const swbCtx = swBumpCanvas.getContext('2d')!;

  swCtx.fillStyle = '#525b66'; // Dark mortar grout
  swCtx.fillRect(0, 0, 256, 256);
  swbCtx.fillStyle = '#383838';
  swbCtx.fillRect(0, 0, 256, 256);

  // Interlocking Dhaka red terracotta & concrete brick tiles
  const rows = 8;
  const cols = 4;
  const tileW = 256 / cols;
  const tileH = 256 / rows;
  for (let r = 0; r < rows; r++) {
    const stagger = (r % 2) * (tileW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const tx = c * tileW + stagger;
      const ty = r * tileH;
      const isTerracotta = (r + c) % 3 === 0 || (r * 2 + c) % 5 === 0;
      const isWarmGrey = (r + c) % 2 === 0;
      swCtx.fillStyle = isTerracotta
        ? (r % 2 === 0 ? '#a84432' : '#943a2b')
        : isWarmGrey
          ? '#7c8591'
          : '#8d949e';
      swCtx.fillRect(tx + 2, ty + 2, tileW - 4, tileH - 4);

      swbCtx.fillStyle = '#c8c8c8';
      swbCtx.fillRect(tx + 2, ty + 2, tileW - 4, tileH - 4);
    }
  }

  // Tactile yellow pedestrian guidance strip along footpath edge
  swCtx.fillStyle = '#d99b18';
  swCtx.fillRect(10, 0, 18, 256);
  swCtx.fillStyle = '#b57b0e';
  for (let y = 4; y < 256; y += 16) {
    swCtx.fillRect(13, y, 12, 8);
  }

  // Iron WASA storm-drain grate inset into paver tile
  swCtx.fillStyle = '#1f2937';
  swCtx.fillRect(172, 92, 48, 52);
  swCtx.fillStyle = '#090d14';
  for (let gx = 178; gx <= 212; gx += 8) {
    swCtx.fillRect(gx, 98, 4, 40);
  }
  swbCtx.fillStyle = '#242424';
  swbCtx.fillRect(172, 92, 48, 52);

  // Subtle Dhaka dust & weathered footfall speckles
  for (let i = 0; i < 320; i++) {
    const shade = 80 + ((i * 19) % 45);
    swCtx.fillStyle = `rgba(${shade}, ${shade - 4}, ${shade - 10}, 0.25)`;
    swCtx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }

  const sidewalk = finalizeColorTexture(swCanvas, maxAnisotropy, 2, 28);
  const sidewalkBump = finalizeDataTexture(swBumpCanvas, maxAnisotropy, 2, 28);
  allTextures.push(sidewalk, sidewalkBump);

  // 4. Bangladeshi Rickshaw Folk Art Hoods (4 regional Dhaka folk palettes)
  const hoodPalettes = [
    { c1: '#be123c', c2: '#e11d48', c3: '#881337', trim: '#facc15', accent: '#06b6d4', petalA: '#fde047', petalB: '#2dd4bf' },
    { c1: '#047857', c2: '#10b981', c3: '#064e3b', trim: '#fbbf24', accent: '#f43f5e', petalA: '#fef08a', petalB: '#fb7185' },
    { c1: '#1d4ed8', c2: '#2563eb', c3: '#1e3a8a', trim: '#f59e0b', accent: '#34d399', petalA: '#fde047', petalB: '#f472b6' },
    { c1: '#9333ea', c2: '#c026d3', c3: '#6b21a8', trim: '#facc15', accent: '#38bdf8', petalA: '#fef08a', petalB: '#22d3ee' },
  ];
  const rickshawHoodVariants = hoodPalettes.map((hp) => {
    const artCanvas = document.createElement('canvas');
    artCanvas.width = 512;
    artCanvas.height = 512;
    const aCtx = artCanvas.getContext('2d')!;
    const grad = aCtx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, hp.c1);
    grad.addColorStop(0.5, hp.c2);
    grad.addColorStop(1, hp.c3);
    aCtx.fillStyle = grad;
    aCtx.fillRect(0, 0, 512, 512);

    aCtx.strokeStyle = hp.trim;
    aCtx.lineWidth = 18;
    aCtx.strokeRect(18, 18, 476, 476);
    aCtx.strokeStyle = hp.accent;
    aCtx.lineWidth = 8;
    aCtx.strokeRect(36, 36, 440, 440);

    const drawFlower = (cx: number, cy: number, r: number) => {
      for (let p = 0; p < 8; p++) {
        const ang = (p * Math.PI) / 4;
        aCtx.save();
        aCtx.translate(cx + Math.cos(ang) * r * 0.55, cy + Math.sin(ang) * r * 0.55);
        aCtx.rotate(ang);
        aCtx.fillStyle = p % 2 === 0 ? hp.petalA : hp.petalB;
        aCtx.beginPath();
        aCtx.ellipse(0, 0, r * 0.48, r * 0.24, 0, 0, Math.PI * 2);
        aCtx.fill();
        aCtx.restore();
      }
      aCtx.fillStyle = '#ffffff';
      aCtx.beginPath();
      aCtx.arc(cx, cy, r * 0.26, 0, Math.PI * 2);
      aCtx.fill();
    };
    drawFlower(256, 256, 95);
    drawFlower(115, 115, 48);
    drawFlower(397, 115, 48);
    drawFlower(115, 397, 48);
    drawFlower(397, 397, 48);
    const tex = finalizeColorTexture(artCanvas, maxAnisotropy);
    allTextures.push(tex);
    return tex;
  });
  const rickshawArt = rickshawHoodVariants[0];

  // 5. Rear Rickshaw Plate ("মায়ের দোয়া পরিবহন")
  const rearCanvas = document.createElement('canvas');
  rearCanvas.width = 512;
  rearCanvas.height = 256;
  const rrCtx = rearCanvas.getContext('2d')!;
  rrCtx.fillStyle = '#0f766e';
  rrCtx.fillRect(0, 0, 512, 256);
  rrCtx.strokeStyle = '#facc15';
  rrCtx.lineWidth = 14;
  rrCtx.strokeRect(12, 12, 488, 232);
  rrCtx.fillStyle = '#fef08a';
  rrCtx.font = 'bold 54px "Hind Siliguri", sans-serif';
  rrCtx.textAlign = 'center';
  rrCtx.textBaseline = 'middle';
  rrCtx.fillText('মায়ের দোয়া পরিবহন', 256, 108);
  rrCtx.fillStyle = '#ffffff';
  rrCtx.font = 'bold 30px "Hind Siliguri", sans-serif';
  rrCtx.fillText('পুরান ঢাকা এক্সপ্রেস', 256, 174);
  const rickshawRearArt = finalizeColorTexture(rearCanvas, maxAnisotropy);
  allTextures.push(rickshawRearArt);

  // 6. Radial Contact Shadow Texture
  const shCanvas = document.createElement('canvas');
  shCanvas.width = 128;
  shCanvas.height = 128;
  const shCtx = shCanvas.getContext('2d')!;
  const rad = shCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
  rad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
  rad.addColorStop(0.55, 'rgba(0, 0, 0, 0.35)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  shCtx.fillStyle = rad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadow = finalizeColorTexture(shCanvas, maxAnisotropy);
  allTextures.push(contactShadow);

  // 7. Corrugated Tin for Stalls & Roofs
  const tinCanvas = document.createElement('canvas');
  tinCanvas.width = 256;
  tinCanvas.height = 256;
  const tCtx = tinCanvas.getContext('2d')!;
  for (let x = 0; x < 256; x += 16) {
    const g = tCtx.createLinearGradient(x, 0, x + 16, 0);
    g.addColorStop(0, '#94a3b8');
    g.addColorStop(0.5, '#e2e8f0');
    g.addColorStop(1, '#64748b');
    tCtx.fillStyle = g;
    tCtx.fillRect(x, 0, 16, 256);
  }
  tCtx.fillStyle = 'rgba(180, 83, 9, 0.25)';
  tCtx.fillRect(24, 30, 75, 45);
  tCtx.fillRect(140, 160, 80, 50);
  const corrugatedTin = finalizeColorTexture(tinCanvas, maxAnisotropy, 2, 1);
  allTextures.push(corrugatedTin);

  // 8. Authentic Dhaka Building Facade Textures (7 regional finishes with window grilles & weathered plaster)
  const facadePalettes = [
    { wall: '#d6c6af', trim: '#7c2d12', lit: '#fef3c7', dark: '#27303f', grill: true },   // Warm sandstone plaster + brown trim
    { wall: '#cbd5e1', trim: '#0f766e', lit: '#e0f2fe', dark: '#1e293b', grill: true },   // Cool ash concrete + teal bands
    { wall: '#e2a37e', trim: '#9a3412', lit: '#fef08a', dark: '#292524', grill: true },   // Old Dhaka terracotta peach
    { wall: '#e7e5e4', trim: '#1e40af', lit: '#dbeafe', dark: '#172554', grill: false },  // Modern Dhanmondi ivory-blue
    { wall: '#d4b483', trim: '#57534e', lit: '#fef9c3', dark: '#1c1917', grill: true },   // Ochre commercial facade
    { wall: '#b8d0cb', trim: '#065f46', lit: '#dcfce7', dark: '#14332a', grill: false },  // Mint mosaic tile tower
    { wall: '#b97a63', trim: '#7f1d1d', lit: '#fed7aa', dark: '#2d1b18', grill: true },   // Weathered brick-plaster flat
  ];
  const buildingWindows = facadePalettes.map((pal) => {
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 512;
    const bCtx = bCanvas.getContext('2d')!;
    bCtx.fillStyle = pal.wall;
    bCtx.fillRect(0, 0, 256, 512);

    // Subtle rain-streak weathering at slab edges
    for (let y = 0; y < 512; y += 128) {
      bCtx.fillStyle = 'rgba(30, 41, 59, 0.14)';
      bCtx.fillRect(0, y + 10, 256, 10);
      bCtx.fillStyle = pal.trim;
      bCtx.fillRect(0, y, 256, 10);

      for (let col = 0; col < 3; col++) {
        const wx = 22 + col * 78;
        const wy = y + 26;
        const isLit = (y + col * 37) % 4 === 0;
        bCtx.fillStyle = isLit ? pal.lit : pal.dark;
        bCtx.fillRect(wx, wy, 52, 72);
        bCtx.strokeStyle = pal.trim;
        bCtx.lineWidth = 3;
        bCtx.strokeRect(wx, wy, 52, 72);

        // Dhaka-style iron security grill bars
        if (pal.grill) {
          bCtx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
          bCtx.lineWidth = 2;
          for (let gx = wx + 13; gx < wx + 50; gx += 13) {
            bCtx.beginPath();
            bCtx.moveTo(gx, wy);
            bCtx.lineTo(gx, wy + 72);
            bCtx.stroke();
          }
        }
      }
    }
    const tex = finalizeColorTexture(bCanvas, maxAnisotropy);
    allTextures.push(tex);
    return tex;
  });

  // 8B. Ground-Floor Dhaka Shuttered Shopfront Arcades (Rolling steel shutters + signage strip)
  const shopGroundDefs = [
    { top: '#14532d', title: 'বিসমিল্লাহ ফার্মেসি ও সার্জিক্যাল', shutter: '#64748b', accent: '#facc15' },
    { top: '#991b1b', title: 'মায়ের দোয়া টেইলার্স এন্ড ফ্যাশন', shutter: '#71717a', accent: '#fef08a' },
    { top: '#1e3a8a', title: 'ঢাকা হার্ডওয়্যার ও ইলেকট্রিক মার্ট', shutter: '#475569', accent: '#38bdf8' },
  ];
  const dhakaShopfrontGround = shopGroundDefs.map((sg) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 192);

    // Top signboard fascia
    ctx.fillStyle = sg.top;
    ctx.fillRect(8, 8, 496, 48);
    ctx.strokeStyle = sg.accent;
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 492, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sg.title, 256, 40);

    // 3 rolling steel corrugated shutters
    for (let s = 0; s < 3; s++) {
      const sx = 18 + s * 164;
      ctx.fillStyle = s === 1 ? '#1e293b' : sg.shutter; // Middle bay half open / lit shop interior
      ctx.fillRect(sx, 64, 148, 120);
      if (s === 1) {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(sx + 8, 102, 132, 78);
        ctx.fillStyle = sg.shutter;
        ctx.fillRect(sx, 64, 148, 38);
      }
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      const limitY = s === 1 ? 102 : 182;
      for (let ry = 72; ry < limitY; ry += 8) {
        ctx.beginPath();
        ctx.moveTo(sx, ry);
        ctx.lineTo(sx + 148, ry);
        ctx.stroke();
      }
    }
    const tex = finalizeColorTexture(c, maxAnisotropy);
    allTextures.push(tex);
    return tex;
  });

  // 9. Bengali Shop Signboards - Including Shobji / Vegetable Mart!
  const signsData = [
    { bg: '#15803d', border: '#fde047', title: 'তাজা সবজির আড়ৎ', sub: 'টাটকা বেগুন, আলু, লাউ ও টমেটো' },
    { bg: '#991b1b', border: '#facc15', title: 'হাজী কাচ্চি বিরিয়ানি', sub: 'পুরান ঢাকা অরিজিনাল স্বাদ' },
    { bg: '#047857', border: '#fef08a', title: 'বিসমিল্লাহ মালাই চা', sub: 'স্পেশাল টং চা ও বাকরখানি' },
    { bg: '#1d4ed8', border: '#67e8f9', title: 'ঢাকা শাহী ফুচকা ও চটপটি', sub: 'টক-ঝাল-মিষ্টি দই ফুচকা' },
    { bg: '#b45309', border: '#fde68a', title: 'দেশি ফল ও সবজি ভান্ডার', sub: 'পাইকারি ও খুচরা বিক্রয় কেন্দ্র' },
  ];
  const shopSigns = signsData.map((s) => {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 512;
    sCanvas.height = 128;
    const sCtx = sCanvas.getContext('2d')!;
    sCtx.fillStyle = s.bg;
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.strokeStyle = s.border;
    sCtx.lineWidth = 8;
    sCtx.strokeRect(6, 6, 500, 116);
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 42px "Hind Siliguri", sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(s.title, 256, 50);
    sCtx.fillStyle = s.border;
    sCtx.font = '600 24px "Hind Siliguri", sans-serif';
    sCtx.fillText(s.sub, 256, 95);
    const tex = finalizeColorTexture(sCanvas, maxAnisotropy);
    allTextures.push(tex);
    return tex;
  });

  // 10. Dhaka Bus Side Livery Banner
  const busCanvas = document.createElement('canvas');
  busCanvas.width = 512;
  busCanvas.height = 128;
  const busCtx = busCanvas.getContext('2d')!;
  busCtx.fillStyle = '#0284c7';
  busCtx.fillRect(0, 0, 512, 128);
  busCtx.fillStyle = '#e11d48';
  busCtx.fillRect(0, 85, 512, 43);
  busCtx.fillStyle = '#facc15';
  busCtx.fillRect(0, 75, 512, 10);
  busCtx.fillStyle = '#ffffff';
  busCtx.font = 'bold 36px "Hind Siliguri", sans-serif';
  busCtx.textAlign = 'center';
  busCtx.textBaseline = 'middle';
  busCtx.fillText('মিরপুর ➔ সদরঘাট সুপার এক্সপ্রেস', 256, 42);
  const busBanner = finalizeColorTexture(busCanvas, maxAnisotropy);
  allTextures.push(busBanner);

  // 11. Checkered Lungis for Crowd & Pedestrians
  const lungiPalettes = [
    ['#15803d', '#bbf7d0', '#14532d'],
    ['#1d4ed8', '#bfdbfe', '#1e3a8a'],
    ['#b91c1c', '#fecaca', '#7f1d1d'],
    ['#7c3aed', '#ede9fe', '#5b21b6'],
    ['#c2410c', '#ffedd5', '#7c2d12'],
  ];
  const lungis = lungiPalettes.map(([c1, c2, c3]) => {
    const lCanvas = document.createElement('canvas');
    lCanvas.width = 128;
    lCanvas.height = 128;
    const lCtx = lCanvas.getContext('2d')!;
    lCtx.fillStyle = c1;
    lCtx.fillRect(0, 0, 128, 128);
    lCtx.fillStyle = c3;
    for (let i = 0; i < 128; i += 32) {
      lCtx.fillRect(i, 0, 16, 128);
      lCtx.fillRect(0, i, 128, 16);
    }
    lCtx.strokeStyle = c2;
    lCtx.lineWidth = 2;
    for (let i = 8; i < 128; i += 32) {
      lCtx.beginPath();
      lCtx.moveTo(i, 0);
      lCtx.lineTo(i, 128);
      lCtx.stroke();
      lCtx.beginPath();
      lCtx.moveTo(0, i);
      lCtx.lineTo(128, i);
      lCtx.stroke();
    }
    const tex = finalizeColorTexture(lCanvas, maxAnisotropy, 2, 2);
    allTextures.push(tex);
    return tex;
  });

  // 12. REALISTIC BANGLADESHI WALL POSTERS (Cinema, Coaching, Shubheccha, Ayurvedic, Telecom, Qawwali)
  const posterDefs = [
    {
      // 1. Cinema: Tufan (শাকিব খান / ব্লকবাস্টার)
      render: (ctx: CanvasRenderingContext2D) => {
        const g = ctx.createLinearGradient(0, 0, 0, 384);
        g.addColorStop(0, '#7f1d1d');
        g.addColorStop(0.5, '#dc2626');
        g.addColorStop(1, '#991b1b');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 384);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 8;
        ctx.strokeRect(6, 6, 244, 372);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★ বাংলা সিনেমা ★', 128, 36);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 52px "Hind Siliguri", sans-serif';
        ctx.fillText('তুফান', 128, 105);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
        ctx.fillText('শাকিব খান', 128, 150);

        ctx.fillStyle = '#fed7aa';
        ctx.font = '500 16px "Hind Siliguri", sans-serif';
        ctx.fillText('চলতি সপ্তাহের মেগাধামাকা!', 128, 195);
        ctx.fillText('স্টার সিনেপ্লেক্স ও মধুমিতা', 128, 225);

        ctx.fillStyle = '#facc15';
        ctx.fillRect(20, 255, 216, 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
        ctx.fillText('আজই টিকিট কাটুন', 128, 290);
        ctx.fillStyle = '#fef08a';
        ctx.font = '14px "Hind Siliguri", sans-serif';
        ctx.fillText('মারপিট · অ্যাকশন · রোমাঞ্চ', 128, 325);
      },
    },
    {
      // 2. Coaching: ভর্তি চলছে! (উদ্ভাস-উন্মেষ / UCC)
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 256, 384);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 248, 376);

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ভর্তি চলছে!', 128, 48);

        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
        ctx.fillText('বুয়েট ও মেডিকেল', 128, 92);
        ctx.fillText('ভর্তি কোচিং', 128, 126);

        ctx.fillStyle = '#0f172a';
        ctx.font = '500 17px "Hind Siliguri", sans-serif';
        ctx.fillText('ঢাকা বিশ্ববিদ্যালয় স্পেশাল ব্যাচ', 128, 175);
        ctx.fillText('অভিজ্ঞ শিক্ষক দ্বারা পরিচালিত', 128, 210);

        ctx.fillStyle = '#15803d';
        ctx.fillRect(16, 245, 224, 38);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
        ctx.fillText('সীমিত আসন সংখ্যা', 128, 270);

        ctx.fillStyle = '#475569';
        ctx.font = '14px "Hind Siliguri", sans-serif';
        ctx.fillText('লালবাগ ও চকবাজার শাখা', 128, 315);
        ctx.fillText('মোবাইল: ০১৭১২-৩৪৫৬৭৮', 128, 345);
      },
    },
    {
      // 3. Election & Greetings: সকলের দোয়া প্রার্থী
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(0, 0, 256, 384);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 8;
        ctx.strokeRect(6, 6, 244, 372);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('পবিত্র ঈদ ও নববর্ষের শুভেচ্ছা', 128, 40);

        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(128, 115, 52, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
        ctx.fillText('দোয়া প্রার্থী', 128, 120);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
        ctx.fillText('হাজী মোঃ রফিক', 128, 205);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
        ctx.fillText('সাবেক কাউন্সিলর', 128, 240);
        ctx.fillText('পুরান ঢাকা বাসী ঐক্য পরিষদ', 128, 275);

        ctx.fillStyle = '#86efac';
        ctx.font = '15px "Hind Siliguri", sans-serif';
        ctx.fillText('সুখে দুঃখে পাশে থাকতে চাই', 128, 315);
        ctx.fillText('সকলের সমর্থন কাম্য', 128, 345);
      },
    },
    {
      // 4. Ayurvedic & Hakim: কলকাতার বিখ্যাত হাকিম
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(0, 0, 256, 384);
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 244, 372);

        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('কলকাতার বিখ্যাত হাকিম', 128, 42);

        ctx.fillStyle = '#1c1917';
        ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
        ctx.fillText('বাতের ব্যথা ও পুরাতন রোগের', 128, 88);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
        ctx.fillText('১০০% সফল চিকিৎসা', 128, 126);

        ctx.fillStyle = '#292524';
        ctx.font = '500 16px "Hind Siliguri", sans-serif';
        ctx.fillText('কোমর ব্যথা · হাঁটু ব্যথা', 128, 175);
        ctx.fillText('গ্যাস্ট্রিক ও চর্মরোগের দাওয়াই', 128, 210);

        ctx.fillStyle = '#047857';
        ctx.fillRect(16, 240, 224, 34);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
        ctx.fillText('সম্পূর্ণ পার্শ্বপ্রতিক্রিয়াহীন', 128, 263);

        ctx.fillStyle = '#7f1d1d';
        ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
        ctx.fillText('স্থান: চকবাজার মোড়, ঢাকা', 128, 310);
        ctx.font = '14px "Hind Siliguri", sans-serif';
        ctx.fillText('সাক্ষাৎ: সকাল ১০টা - রাত ৮টা', 128, 345);
      },
    },
    {
      // 5. Telecom: বাংলালিংক ৪জি আনলিমিটেড
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(0, 0, 256, 384);
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.arc(230, 40, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('বাংলালিংক ৪জি', 128, 55);

        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
        ctx.fillText('সুপার ধামাকা অফার!', 128, 102);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, 128, 216, 92);
        ctx.fillStyle = '#c2410c';
        ctx.font = 'bold 44px "Hind Siliguri", sans-serif';
        ctx.fillText('১০ জিবি', 128, 175);
        ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
        ctx.fillText('মাত্র ৯৯ টাকা', 128, 210);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
        ctx.fillText('মেয়াদ ৩০ দিন', 128, 262);
        ctx.font = '500 16px "Hind Siliguri", sans-serif';
        ctx.fillText('ডায়াল করুন *১২১*৯৯#', 128, 298);

        ctx.fillStyle = '#fef08a';
        ctx.font = '14px "Hind Siliguri", sans-serif';
        ctx.fillText('পুরান ঢাকায় দ্রুততম ইন্টারনেট', 128, 345);
      },
    },
    {
      // 6. Cultural: পুরান ঢাকা কাওয়ালি সন্ধ্যা
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, 256, 384);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 8, 240, 368);

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ঐতিহ্যবাহী', 128, 45);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 30px "Hind Siliguri", sans-serif';
        ctx.fillText('কাওয়ালি সন্ধ্যা', 128, 92);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
        ctx.fillText('ও সুফি সঙ্গীত উৎসব', 128, 130);

        ctx.fillStyle = '#fde68a';
        ctx.font = '16px "Hind Siliguri", sans-serif';
        ctx.fillText('দেশবরেণ্য শিল্পীদের পরিবেশনায়', 128, 185);

        ctx.fillStyle = '#312e81';
        ctx.fillRect(20, 218, 216, 55);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(20, 218, 216, 55);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 17px "Hind Siliguri", sans-serif';
        ctx.fillText('স্থান: তারা মসজিদ প্রাঙ্গণ', 128, 245);
        ctx.font = '14px "Hind Siliguri", sans-serif';
        ctx.fillText('রাত ৮টা · সবার জন্য উন্মুক্ত', 128, 265);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px "Hind Siliguri", sans-serif';
        ctx.fillText('আয়োজনে: পুরান ঢাকা যুব সমিতি', 128, 335);
      },
    },
    {
      // 7. Classic Dhaka To-Let: বাসা / দোকান ভাড়া দেওয়া হবে
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 384);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(0, 0, 256, 74);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TO-LET / ভাড়া হবে', 128, 50);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
        ctx.fillText('ব্যাচেলর / ফ্যামিলি বাসা', 128, 128);
        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
        ctx.fillText('২ বেড · ডাইনিং · গ্যাস আছে', 128, 174);
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
        ctx.fillText('আগামী মাস থেকে উঠা যাবে', 128, 224);

        ctx.fillStyle = '#fef08a';
        ctx.fillRect(14, 255, 228, 62);
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 4;
        ctx.strokeRect(14, 255, 228, 62);
        ctx.fillStyle = '#991b1b';
        ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
        ctx.fillText('যোগাযোগ: ০১৮১৯-XXXXXX', 128, 293);
      },
    },
    {
      // 8. Spoken English & IELTS Coaching Poster
      render: (ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#fef9c3';
        ctx.fillRect(0, 0, 256, 384);
        ctx.strokeStyle = '#1d4ed8';
        ctx.lineWidth = 8;
        ctx.strokeRect(6, 6, 244, 372);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(12, 16, 232, 62);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px "Hind Siliguri", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('IELTS ও স্পোকেন', 128, 56);

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 30px "Hind Siliguri", sans-serif';
        ctx.fillText('১০০% ইংরেজিতে কথা', 128, 130);
        ctx.fillText('বলার গ্যারান্টি!', 128, 170);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
        ctx.fillText('৩০% ছাড়ে নতুন ব্যাচ শুরু', 128, 225);
        ctx.fillStyle = '#047857';
        ctx.fillText('সায়েন্স ল্যাব · ফার্মগেট মোড়', 128, 275);
        ctx.fillStyle = '#1e293b';
        ctx.font = '15px "Hind Siliguri", sans-serif';
        ctx.fillText('ফ্রি সেমিনার প্রতি শুক্রবার', 128, 330);
      },
    },
  ];

  const bangladeshiPosters = posterDefs.map((def) => {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 256;
    pCanvas.height = 384;
    const pCtx = pCanvas.getContext('2d')!;
    def.render(pCtx);
    const tex = finalizeColorTexture(pCanvas, maxAnisotropy);
    allTextures.push(tex);
    return tex;
  });

  // 13. AUTHENTIC DHAKA CNG TEXTURES
  // A. CNG Diamond Wire-Mesh Grille ("সিএনজির লোহার খাঁচা")
  const meshCanvas = document.createElement('canvas');
  meshCanvas.width = 256;
  meshCanvas.height = 256;
  const mCtx = meshCanvas.getContext('2d')!;
  mCtx.fillStyle = '#064e3b';
  mCtx.fillRect(0, 0, 256, 256);
  mCtx.fillStyle = '#065f46';
  mCtx.fillRect(10, 10, 236, 236);

  mCtx.strokeStyle = '#cbd5e1';
  mCtx.lineWidth = 3;
  for (let i = 24; i < 256; i += 28) {
    mCtx.beginPath();
    mCtx.moveTo(i, 10);
    mCtx.lineTo(i, 246);
    mCtx.stroke();
    mCtx.beginPath();
    mCtx.moveTo(10, i);
    mCtx.lineTo(246, i);
    mCtx.stroke();
  }
  // Door latch plate
  mCtx.fillStyle = '#047857';
  mCtx.fillRect(205, 110, 35, 36);
  mCtx.fillStyle = '#facc15';
  mCtx.fillRect(218, 122, 12, 12);

  const cngWireMesh = finalizeColorTexture(meshCanvas, maxAnisotropy);
  allTextures.push(cngWireMesh);

  // B. Official Bangladeshi Green Digital Number Plate ("ঢাকা মেট্রো-থ ১১-৪২০২")
  const plateCanvas = document.createElement('canvas');
  plateCanvas.width = 256;
  plateCanvas.height = 128;
  const plCtx = plateCanvas.getContext('2d')!;
  plCtx.fillStyle = '#047857';
  plCtx.fillRect(0, 0, 256, 128);
  plCtx.strokeStyle = '#ffffff';
  plCtx.lineWidth = 6;
  plCtx.strokeRect(6, 6, 244, 116);

  // Seal circle
  plCtx.fillStyle = '#facc15';
  plCtx.beginPath();
  plCtx.arc(36, 64, 18, 0, Math.PI * 2);
  plCtx.fill();

  plCtx.fillStyle = '#ffffff';
  plCtx.font = 'bold 34px "Hind Siliguri", sans-serif';
  plCtx.textAlign = 'center';
  plCtx.fillText('ঢাকা মেট্রো-থ', 145, 52);
  plCtx.font = 'bold 42px "Hind Siliguri", sans-serif';
  plCtx.fillText('১১-৪২০২', 145, 102);
  const cngPlate = finalizeColorTexture(plateCanvas, maxAnisotropy);
  allTextures.push(cngPlate);

  // C. Front Windshield Visor Banner ("আল্লাহ সর্বশক্তিমান")
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 96;
  const bVisorCtx = bannerCanvas.getContext('2d')!;
  bVisorCtx.fillStyle = '#facc15';
  bVisorCtx.fillRect(0, 0, 512, 96);
  bVisorCtx.fillStyle = '#064e3b';
  bVisorCtx.fillRect(0, 80, 512, 16);

  bVisorCtx.fillStyle = '#065f46';
  bVisorCtx.font = 'bold 44px "Hind Siliguri", sans-serif';
  bVisorCtx.textAlign = 'center';
  bVisorCtx.textBaseline = 'middle';
  bVisorCtx.fillText('আল্লাহ সর্বশক্তিমান ★ গতিসীমা ৪০ কিঃমিঃ', 256, 44);
  const cngFrontBanner = finalizeColorTexture(bannerCanvas, maxAnisotropy);
  allTextures.push(cngFrontBanner);

  // D. Digital Fare Meter ("ডিজিটাল মিটার" with glowing red LED readout)
  const meterCanvas = document.createElement('canvas');
  meterCanvas.width = 128;
  meterCanvas.height = 64;
  const metCtx = meterCanvas.getContext('2d')!;
  metCtx.fillStyle = '#09090b';
  metCtx.fillRect(0, 0, 128, 64);
  metCtx.strokeStyle = '#27272a';
  metCtx.lineWidth = 4;
  metCtx.strokeRect(2, 2, 124, 60);

  metCtx.fillStyle = '#1c1917';
  metCtx.fillRect(10, 8, 108, 34);

  metCtx.fillStyle = '#ef4444';
  metCtx.font = 'bold 24px "Chakra Petch", monospace';
  metCtx.textAlign = 'right';
  metCtx.fillText('85.50', 108, 32);

  metCtx.fillStyle = '#a1a1aa';
  metCtx.font = 'bold 11px "Hind Siliguri", sans-serif';
  metCtx.textAlign = 'center';
  metCtx.fillText('ট্যাক্সি মিটার', 64, 54);
  const cngMeter = finalizeColorTexture(meterCanvas, maxAnisotropy);
  allTextures.push(cngMeter);

  // E. CNG Rear Bumper Yellow & Black Hazard Chevrons ("নিরাপদ দূরত্ব বজায় রাখুন")
  const chevronCanvas = document.createElement('canvas');
  chevronCanvas.width = 512;
  chevronCanvas.height = 64;
  const chvCtx = chevronCanvas.getContext('2d')!;
  chvCtx.fillStyle = '#facc15';
  chvCtx.fillRect(0, 0, 512, 64);
  chvCtx.fillStyle = '#18181b';
  // Alternating 45-degree angled safety stripes
  const stripeW = 32;
  for (let x = -64; x < 576; x += stripeW * 2) {
    chvCtx.beginPath();
    chvCtx.moveTo(x, 0);
    chvCtx.lineTo(x + stripeW, 0);
    chvCtx.lineTo(x + stripeW + 36, 64);
    chvCtx.lineTo(x + 36, 64);
    chvCtx.closePath();
    chvCtx.fill();
  }
  const cngChevrons = finalizeColorTexture(chevronCanvas, maxAnisotropy, 2, 1);
  allTextures.push(cngChevrons);

  // F. Bangladeshi Rubber Mudflap ("মায়ের দোয়া ★ সাবধানে চালান")
  const mudflapCanvas = document.createElement('canvas');
  mudflapCanvas.width = 128;
  mudflapCanvas.height = 128;
  const mfCtx = mudflapCanvas.getContext('2d')!;
  mfCtx.fillStyle = '#18181b';
  mfCtx.fillRect(0, 0, 128, 128);
  mfCtx.strokeStyle = '#3f3f46';
  mfCtx.lineWidth = 4;
  mfCtx.strokeRect(4, 4, 120, 120);

  // Red & White decorative header
  mfCtx.fillStyle = '#ef4444';
  mfCtx.fillRect(8, 8, 112, 32);
  mfCtx.fillStyle = '#ffffff';
  mfCtx.font = 'bold 18px "Hind Siliguri", sans-serif';
  mfCtx.textAlign = 'center';
  mfCtx.fillText('মায়ের দোয়া', 64, 30);

  // Bengali warning text
  mfCtx.fillStyle = '#facc15';
  mfCtx.font = 'bold 13px "Hind Siliguri", sans-serif';
  mfCtx.fillText('দূরত্ব বজায়', 64, 68);
  mfCtx.fillText('রাখুন', 64, 88);

  // Star symbol
  mfCtx.fillStyle = '#22c55e';
  mfCtx.font = '16px sans-serif';
  mfCtx.fillText('★ ★ ★', 64, 112);

  const cngMudflap = finalizeColorTexture(mudflapCanvas, maxAnisotropy);
  allTextures.push(cngMudflap);

  // 14. HERITAGE OLD PURANA DHAKA RED BRICK & WOODEN SHUTTER WALL (512x512)
  const brickCanvas = document.createElement('canvas');
  brickCanvas.width = 512;
  brickCanvas.height = 512;
  const brCtx = brickCanvas.getContext('2d')!;
  // Weathered terracotta brick base
  brCtx.fillStyle = '#7c2d12';
  brCtx.fillRect(0, 0, 512, 512);

  // Brick rows with mortar
  brCtx.fillStyle = '#9a3412';
  for (let y = 0; y < 512; y += 24) {
    const offset = (y / 24) % 2 === 0 ? 0 : 32;
    for (let x = -32; x < 544; x += 64) {
      brCtx.fillStyle = (x + y) % 3 === 0 ? '#b45309' : (x + y) % 5 === 0 ? '#6b21a8' : '#9a3412';
      brCtx.fillRect(x + offset + 2, y + 2, 60, 20);
    }
  }
  // Plaster peeling patches
  brCtx.fillStyle = 'rgba(214, 211, 209, 0.45)';
  brCtx.beginPath();
  brCtx.ellipse(140, 180, 80, 50, 0.3, 0, Math.PI * 2);
  brCtx.fill();
  brCtx.beginPath();
  brCtx.ellipse(360, 340, 95, 60, -0.2, 0, Math.PI * 2);
  brCtx.fill();

  // Vintage Purana Dhaka arched wooden shutters & wrought iron grills
  for (let col = 0; col < 2; col++) {
    const wx = 65 + col * 240;
    const wy = 120;
    // Arch frame
    brCtx.fillStyle = '#451a03';
    brCtx.beginPath();
    brCtx.arc(wx + 70, wy, 70, Math.PI, 0);
    brCtx.lineTo(wx + 140, wy + 210);
    brCtx.lineTo(wx, wy + 210);
    brCtx.closePath();
    brCtx.fill();

    // Dark green wooden louvered slats
    brCtx.fillStyle = '#064e3b';
    brCtx.fillRect(wx + 12, wy + 15, 116, 180);
    brCtx.strokeStyle = '#022c22';
    brCtx.lineWidth = 3;
    for (let ly = wy + 25; ly < wy + 190; ly += 12) {
      brCtx.beginPath();
      brCtx.moveTo(wx + 16, ly);
      brCtx.lineTo(wx + 124, ly);
      brCtx.stroke();
    }
    // Decorative wrought iron balcony railing
    brCtx.strokeStyle = '#18181b';
    brCtx.lineWidth = 4;
    brCtx.strokeRect(wx - 8, wy + 155, 156, 55);
    for (let rx = wx; rx < wx + 145; rx += 18) {
      brCtx.beginPath();
      brCtx.moveTo(rx, wy + 155);
      brCtx.lineTo(rx, wy + 210);
      brCtx.stroke();
    }
  }
  const heritageBrick = finalizeColorTexture(brickCanvas, maxAnisotropy, 1, 2);
  allTextures.push(heritageBrick);

  // 15. PURANA DHAKA TARA MASJID & MUGHAL MOSQUE MOSAIC (512x512)
  const msqCanvas = document.createElement('canvas');
  msqCanvas.width = 512;
  msqCanvas.height = 512;
  const mqCtx = msqCanvas.getContext('2d')!;
  // White marble base
  mqCtx.fillStyle = '#f8fafc';
  mqCtx.fillRect(0, 0, 512, 512);

  // Turquoise geometric arabesque borders
  mqCtx.strokeStyle = '#059669';
  mqCtx.lineWidth = 12;
  mqCtx.strokeRect(10, 10, 492, 492);
  mqCtx.strokeStyle = '#0284c7';
  mqCtx.lineWidth = 6;
  mqCtx.strokeRect(26, 26, 460, 460);

  // Blue floral mosaic stars (inspired by Tara Masjid / Star Mosque)
  const drawMosqueStar = (cx: number, cy: number, r: number, color: string) => {
    mqCtx.fillStyle = color;
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      mqCtx.save();
      mqCtx.translate(cx, cy);
      mqCtx.rotate(ang);
      mqCtx.beginPath();
      mqCtx.moveTo(0, -r);
      mqCtx.lineTo(r * 0.35, -r * 0.35);
      mqCtx.lineTo(r, 0);
      mqCtx.lineTo(r * 0.35, r * 0.35);
      mqCtx.lineTo(0, r);
      mqCtx.lineTo(-r * 0.35, r * 0.35);
      mqCtx.lineTo(-r, 0);
      mqCtx.lineTo(-r * 0.35, -r * 0.35);
      mqCtx.closePath();
      mqCtx.fill();
      mqCtx.restore();
    }
  };

  drawMosqueStar(256, 256, 110, '#0284c7');
  drawMosqueStar(256, 256, 65, '#059669');
  drawMosqueStar(110, 110, 48, '#0284c7');
  drawMosqueStar(402, 110, 48, '#0284c7');
  drawMosqueStar(110, 402, 48, '#0284c7');
  drawMosqueStar(402, 402, 48, '#0284c7');

  // Crescent Moon & Islamic arch crest
  mqCtx.fillStyle = '#facc15';
  mqCtx.beginPath();
  mqCtx.arc(256, 256, 28, 0, Math.PI * 2);
  mqCtx.fill();
  mqCtx.fillStyle = '#059669';
  mqCtx.beginPath();
  mqCtx.arc(264, 252, 24, 0, Math.PI * 2);
  mqCtx.fill();

  const mosqueMosaic = finalizeColorTexture(msqCanvas, maxAnisotropy);
  allTextures.push(mosqueMosaic);

  // 16. DHAKA METRO RAIL (MRT LINE 6) TRAIN LIVERY (512x128)
  const metroCanvas = document.createElement('canvas');
  metroCanvas.width = 512;
  metroCanvas.height = 128;
  const metTrCtx = metroCanvas.getContext('2d')!;
  // Sleek stainless silver train carriage body
  metTrCtx.fillStyle = '#e2e8f0';
  metTrCtx.fillRect(0, 0, 512, 128);

  // Bangladesh Green cheat line
  metTrCtx.fillStyle = '#047857';
  metTrCtx.fillRect(0, 38, 512, 28);

  // Red circle sun of Bangladesh flag
  metTrCtx.fillStyle = '#dc2626';
  metTrCtx.beginPath();
  metTrCtx.arc(256, 52, 24, 0, Math.PI * 2);
  metTrCtx.fill();

  // Dark tinted passenger windows
  metTrCtx.fillStyle = '#0f172a';
  for (let x = 20; x < 500; x += 68) {
    if (Math.abs(x - 240) < 40) continue; // skip door/center
    metTrCtx.fillRect(x, 14, 48, 22);
  }

  // Bengali Metro Logo text
  metTrCtx.fillStyle = '#ffffff';
  metTrCtx.font = 'bold 22px "Hind Siliguri", sans-serif';
  metTrCtx.textAlign = 'center';
  metTrCtx.fillText('ঢাকা মেট্রোরেল ★ MRT-6', 256, 105);

  const metroLivery = finalizeColorTexture(metroCanvas, maxAnisotropy);
  allTextures.push(metroLivery);

  // 17. DHAKA CITY CORPORATION DUMPSTER & ROADSIDE TRASH ("সিটি কর্পোরেশন ডাস্টবিন")
  const trashCanvas = document.createElement('canvas');
  trashCanvas.width = 256;
  trashCanvas.height = 256;
  const trCtx = trashCanvas.getContext('2d')!;
  // DSCC / DNCC green painted metal
  trCtx.fillStyle = '#15803d';
  trCtx.fillRect(0, 0, 256, 256);

  // Rust & dirt weathering
  trCtx.fillStyle = 'rgba(120, 53, 15, 0.4)';
  trCtx.fillRect(0, 190, 256, 66);
  trCtx.fillRect(18, 0, 42, 256);

  // Yellow DSCC stencil
  trCtx.fillStyle = '#facc15';
  trCtx.font = 'bold 24px "Hind Siliguri", sans-serif';
  trCtx.textAlign = 'center';
  trCtx.fillText('ঢাকা সিটি কর্পোরেশন', 128, 80);
  trCtx.font = 'bold 18px "Hind Siliguri", sans-serif';
  trCtx.fillText('নির্দিষ্ট স্থানে ময়লা ফেলুন', 128, 120);

  // Stencil trash can icon
  trCtx.strokeStyle = '#facc15';
  trCtx.lineWidth = 4;
  trCtx.strokeRect(96, 145, 64, 75);

  const trashTexture = finalizeColorTexture(trashCanvas, maxAnisotropy);
  allTextures.push(trashTexture);

  // 18. VIBRANT FESTIVE BUNTING PENNANT FLAGS ("রঙিন কাগজের ঝালর / মেলা পতাকা")
  const buntCanvas = document.createElement('canvas');
  buntCanvas.width = 512;
  buntCanvas.height = 128;
  const bntCtx = buntCanvas.getContext('2d')!;
  bntCtx.clearRect(0, 0, 512, 128);

  // Hanging guide string
  bntCtx.strokeStyle = '#cbd5e1';
  bntCtx.lineWidth = 3;
  bntCtx.beginPath();
  bntCtx.moveTo(0, 15);
  bntCtx.quadraticCurveTo(256, 35, 512, 15);
  bntCtx.stroke();

  // Multi-colored triangular pennants
  const flagColors = ['#ef4444', '#facc15', '#10b981', '#3b82f6', '#ec4899', '#f97316', '#8b5cf6'];
  for (let i = 0; i < 14; i++) {
    const fx = 18 + i * 36;
    const fy = 18 + Math.sin((i / 13) * Math.PI) * 16;
    bntCtx.fillStyle = flagColors[i % flagColors.length];
    bntCtx.beginPath();
    bntCtx.moveTo(fx, fy);
    bntCtx.lineTo(fx + 30, fy);
    bntCtx.lineTo(fx + 15, fy + 65);
    bntCtx.closePath();
    bntCtx.fill();
    bntCtx.strokeStyle = 'rgba(0,0,0,0.2)';
    bntCtx.lineWidth = 1;
    bntCtx.stroke();
  }
  const buntingFlags = finalizeColorTexture(buntCanvas, maxAnisotropy, 4, 1);
  allTextures.push(buntingFlags);

  // 19. OBAIDUL QUADER PHOTO FACE TEXTURE
  const texLoader = new THREE.TextureLoader();
  const kaderFace = texLoader.load(
    '/assets/aistudio/WhatsApp_Image_2026-10-25_at_1.33.47_PM_72f9cad8.jpeg'
  );
  kaderFace.colorSpace = THREE.SRGBColorSpace;
  allTextures.push(kaderFace);

  // 20. DHAKA ZEBRA CROSSING & STOP LINE ("জেব্রা ক্রসিং ও স্টপ লাইন")
  const zebraCanvas = document.createElement('canvas');
  zebraCanvas.width = 512;
  zebraCanvas.height = 256;
  const zCtx = zebraCanvas.getContext('2d')!;
  zCtx.fillStyle = '#181b22';
  zCtx.fillRect(0, 0, 512, 256);

  // Solid white stop bar
  zCtx.fillStyle = '#f8fafc';
  zCtx.fillRect(16, 12, 480, 24);

  // Bold alternating zebra pedestrian stripes
  for (let x = 24; x < 490; x += 54) {
    zCtx.fillStyle = '#f8fafc';
    zCtx.fillRect(x, 60, 36, 175);
    // Slight weathering wear
    zCtx.fillStyle = 'rgba(24, 27, 34, 0.15)';
    zCtx.fillRect(x + 4, 110, 28, 25);
  }
  const zebraCrossing = finalizeColorTexture(zebraCanvas, maxAnisotropy, 1, 1);
  allTextures.push(zebraCrossing);

  // 21. DMP TRAFFIC GANTRY SIGNBOARD ("ঢাকা মেট্রোপলিটন পুলিশ ট্রাফিক সিগন্যাল সাইনবোর্ড")
  const dmpCanvas = document.createElement('canvas');
  dmpCanvas.width = 512;
  dmpCanvas.height = 160;
  const dCtx = dmpCanvas.getContext('2d')!;
  dCtx.fillStyle = '#1e3a8a';
  dCtx.fillRect(0, 0, 512, 160);

  // Border and header
  dCtx.strokeStyle = '#ffffff';
  dCtx.lineWidth = 6;
  dCtx.strokeRect(6, 6, 500, 148);

  dCtx.fillStyle = '#facc15';
  dCtx.fillRect(12, 12, 488, 36);

  dCtx.fillStyle = '#1e293b';
  dCtx.font = 'bold 22px sans-serif';
  dCtx.textAlign = 'center';
  dCtx.fillText('ঢাকা মেট্রোপলিটন পুলিশ • ট্রাফিক বিভাগ', 256, 38);

  dCtx.fillStyle = '#ffffff';
  dCtx.font = '900 28px sans-serif';
  dCtx.fillText('DMP TRAFFIC INTERSECTION', 256, 84);

  dCtx.fillStyle = '#93c5fd';
  dCtx.font = 'bold 18px sans-serif';
  dCtx.fillText('লাল বাতি: থামুন • সিগন্যাল অমান্য আইনত দণ্ডনীয়', 256, 122);

  // Signal dots
  const dotY = 82;
  dCtx.fillStyle = '#ef4444';
  dCtx.beginPath();
  dCtx.arc(42, dotY, 14, 0, Math.PI * 2);
  dCtx.fill();
  dCtx.fillStyle = '#10b981';
  dCtx.beginPath();
  dCtx.arc(470, dotY, 14, 0, Math.PI * 2);
  dCtx.fill();

  const trafficSignDmp = finalizeColorTexture(dmpCanvas, maxAnisotropy, 1, 1);
  allTextures.push(trafficSignDmp);

  // 22. DHAKA STREET WALL GRAFFITI & CHARUKALA MURALS ("ঢাকা দেয়াল গ্রাফিতি ও দেয়াল লিখন")
  const wallGraffitis: THREE.CanvasTexture[] = [];
  const graffitiDefs: Array<{
    bg: string;
    brickTint: string;
    splashA: string;
    splashB: string;
    headline: string;
    subline: string;
    tag: string;
    headlineColor: string;
    subColor: string;
    motif: 'sun_tiger' | 'rickshaw_peacock' | 'tea_cup' | 'green_leaf' | 'road_alert' | 'cricket_pride';
  }> = [
    {
      bg: '#1e293b',
      brickTint: 'rgba(148, 163, 184, 0.14)',
      splashA: '#ef4444',
      splashB: '#facc15',
      headline: 'জেগে ওঠো ঢাকা',
      subline: 'তারুণ্যের শহর • স্বাপ্নিক বাংলাদেশ',
      tag: 'DHAKA 1205',
      headlineColor: '#facc15',
      subColor: '#f8fafc',
      motif: 'sun_tiger',
    },
    {
      bg: '#881337',
      brickTint: 'rgba(251, 113, 133, 0.16)',
      splashA: '#10b981',
      splashB: '#f59e0b',
      headline: 'ঢাকা শহর • প্রাণের শহর',
      subline: 'রিকশা শিল্প ও চারুকলার ঐতিহ্য',
      tag: 'SHAHBAGH',
      headlineColor: '#fef08a',
      subColor: '#a7f3d0',
      motif: 'rickshaw_peacock',
    },
    {
      bg: '#7c2d12',
      brickTint: 'rgba(253, 186, 116, 0.15)',
      splashA: '#06b6d4',
      splashB: '#f97316',
      headline: 'পুরান ঢাকা ১১০০',
      subline: 'এক কাপ চায়ে জমে প্রাণের আড্ডা',
      tag: 'CHAWKBAZAR',
      headlineColor: '#fde68a',
      subColor: '#cffafe',
      motif: 'tea_cup',
    },
    {
      bg: '#064e3b',
      brickTint: 'rgba(110, 231, 183, 0.13)',
      splashA: '#84cc16',
      splashB: '#facc15',
      headline: 'সবুজ ঢাকা • পরিচ্ছন্ন শহর',
      subline: 'গাছ লাগান, হর্ন কম বাজান',
      tag: 'GREEN DHAKA',
      headlineColor: '#fef9c3',
      subColor: '#bbf7d0',
      motif: 'green_leaf',
    },
    {
      bg: '#e2e8f0',
      brickTint: 'rgba(100, 116, 139, 0.16)',
      splashA: '#dc2626',
      splashB: '#0f172a',
      headline: 'ধীরে চলুন • জীবন মূল্যবান',
      subline: 'জেব্রা ক্রসিং ও ফুটপাত ব্যবহার করুন',
      tag: 'সতর্কতা',
      headlineColor: '#b91c1c',
      subColor: '#0f172a',
      motif: 'road_alert',
    },
    {
      bg: '#14532d',
      brickTint: 'rgba(255, 255, 255, 0.12)',
      splashA: '#dc2626',
      splashB: '#38bdf8',
      headline: 'বাংলার বাঘ • জয়ের নেশা',
      subline: 'হার মানি না কখনো • DHAKA VIBES',
      tag: 'TIGERS',
      headlineColor: '#ffffff',
      subColor: '#fca5a5',
      motif: 'cricket_pride',
    },
  ];

  graffitiDefs.forEach((def, idx) => {
    const gCanvas = document.createElement('canvas');
    gCanvas.width = 512;
    gCanvas.height = 256;
    const gCtx = gCanvas.getContext('2d')!;

    // Base weathered wall
    gCtx.fillStyle = def.bg;
    gCtx.fillRect(0, 0, 512, 256);

    // Subtle underlying brick courses
    gCtx.fillStyle = def.brickTint;
    for (let row = 0; row < 16; row++) {
      const y = row * 16;
      const offset = row % 2 === 0 ? 0 : 18;
      for (let x = -18; x < 512; x += 36) {
        gCtx.fillRect(x + offset, y + 1, 33, 13);
      }
    }

    // Dynamic aerosol spray clouds
    const drawSpray = (cx: number, cy: number, rx: number, ry: number, col: string) => {
      gCtx.save();
      gCtx.globalAlpha = 0.42;
      gCtx.fillStyle = col;
      gCtx.beginPath();
      gCtx.ellipse(cx, cy, rx, ry, (idx % 2 === 0 ? 1 : -1) * 0.25, 0, Math.PI * 2);
      gCtx.fill();
      gCtx.globalAlpha = 0.72;
      for (let d = 0; d < 28; d++) {
        const ang = (d * 2.399) % (Math.PI * 2);
        const dist = 0.4 + ((d * 17) % 100) / 100;
        const px = cx + Math.cos(ang) * rx * dist;
        const py = cy + Math.sin(ang) * ry * dist;
        gCtx.beginPath();
        gCtx.arc(px, py, 2 + (d % 4), 0, Math.PI * 2);
        gCtx.fill();
      }
      gCtx.restore();
    };

    drawSpray(125, 118, 92, 68, def.splashA);
    drawSpray(385, 136, 98, 64, def.splashB);

    // Motif artwork
    gCtx.save();
    if (def.motif === 'sun_tiger') {
      gCtx.fillStyle = '#dc2626';
      gCtx.beginPath();
      gCtx.arc(92, 132, 48, 0, Math.PI * 2);
      gCtx.fill();
      gCtx.strokeStyle = '#facc15';
      gCtx.lineWidth = 4;
      for (let r = 0; r < 9; r++) {
        const a = -Math.PI + (r / 8) * Math.PI;
        gCtx.beginPath();
        gCtx.moveTo(92 + Math.cos(a) * 52, 132 + Math.sin(a) * 52);
        gCtx.lineTo(92 + Math.cos(a) * 68, 132 + Math.sin(a) * 68);
        gCtx.stroke();
      }
    } else if (def.motif === 'rickshaw_peacock') {
      // Stylized Charukala lotus petals
      for (let p = -2; p <= 2; p++) {
        gCtx.fillStyle = p % 2 === 0 ? '#facc15' : '#10b981';
        gCtx.beginPath();
        gCtx.ellipse(92 + p * 14, 132 + Math.abs(p) * 5, 12, 34, p * 0.25, 0, Math.PI * 2);
        gCtx.fill();
      }
    } else if (def.motif === 'tea_cup') {
      // Steaming Dhaka clay tea cup stencil
      gCtx.fillStyle = '#fde68a';
      gCtx.fillRect(62, 118, 54, 46);
      gCtx.strokeStyle = '#fde68a';
      gCtx.lineWidth = 6;
      gCtx.beginPath();
      gCtx.arc(118, 140, 14, -Math.PI / 2, Math.PI / 2);
      gCtx.stroke();
      gCtx.strokeStyle = '#cffafe';
      gCtx.lineWidth = 3;
      [76, 90, 104].forEach((sx, si) => {
        gCtx.beginPath();
        gCtx.moveTo(sx, 110);
        gCtx.quadraticCurveTo(sx + (si % 2 === 0 ? 8 : -8), 90, sx, 74);
        gCtx.stroke();
      });
    } else if (def.motif === 'green_leaf') {
      gCtx.fillStyle = '#84cc16';
      gCtx.beginPath();
      gCtx.ellipse(88, 132, 38, 22, -0.5, 0, Math.PI * 2);
      gCtx.fill();
      gCtx.strokeStyle = '#064e3b';
      gCtx.lineWidth = 3;
      gCtx.beginPath();
      gCtx.moveTo(58, 152);
      gCtx.lineTo(116, 110);
      gCtx.stroke();
    } else if (def.motif === 'road_alert') {
      // Black/Red stencil triangle
      gCtx.fillStyle = '#dc2626';
      gCtx.beginPath();
      gCtx.moveTo(88, 76);
      gCtx.lineTo(128, 160);
      gCtx.lineTo(48, 160);
      gCtx.closePath();
      gCtx.fill();
      gCtx.fillStyle = '#ffffff';
      gCtx.font = '900 42px sans-serif';
      gCtx.textAlign = 'center';
      gCtx.fillText('!', 88, 148);
    } else {
      // Red Bangladesh flag disc + stripes
      gCtx.fillStyle = '#dc2626';
      gCtx.beginPath();
      gCtx.arc(88, 128, 42, 0, Math.PI * 2);
      gCtx.fill();
      gCtx.strokeStyle = '#facc15';
      gCtx.lineWidth = 4;
      gCtx.strokeRect(44, 80, 88, 96);
    }
    gCtx.restore();

    // Bold Graffiti Headline + Spray Outline
    gCtx.textAlign = 'center';
    gCtx.font = 'bold 34px "Hind Siliguri", sans-serif';
    gCtx.lineWidth = 6;
    gCtx.strokeStyle = 'rgba(15, 23, 42, 0.88)';
    gCtx.strokeText(def.headline, 315, 115);
    gCtx.fillStyle = def.headlineColor;
    gCtx.fillText(def.headline, 315, 115);

    // Paint drips down from headline
    gCtx.fillStyle = def.headlineColor;
    [195, 250, 320, 395, 442].forEach((dx, di) => {
      gCtx.fillRect(dx, 122, 3, 12 + (di % 3) * 11);
    });

    // Subline stencil banner
    gCtx.font = 'bold 19px "Hind Siliguri", sans-serif';
    gCtx.fillStyle = def.subColor;
    gCtx.fillText(def.subline, 315, 168);

    // Street Tag Badge
    gCtx.fillStyle = '#0f172a';
    gCtx.fillRect(382, 198, 114, 32);
    gCtx.strokeStyle = def.splashB;
    gCtx.lineWidth = 2;
    gCtx.strokeRect(382, 198, 114, 32);
    gCtx.fillStyle = '#facc15';
    gCtx.font = 'bold 14px sans-serif';
    gCtx.fillText(def.tag, 439, 219);

    // Moss/damp bottom weathering strip along street wall base
    const dampGrad = gCtx.createLinearGradient(0, 214, 0, 256);
    dampGrad.addColorStop(0, 'rgba(20, 30, 22, 0)');
    dampGrad.addColorStop(1, 'rgba(20, 30, 22, 0.55)');
    gCtx.fillStyle = dampGrad;
    gCtx.fillRect(0, 214, 512, 42);

    const gTex = finalizeColorTexture(gCanvas, maxAnisotropy, 1, 1);
    allTextures.push(gTex);
    wallGraffitis.push(gTex);
  });

  // 23. DHAKA CULTURAL INTERSECTION STREET ALPANA ("চারুকলা রাস্তার আলপনা")
  const alpanaCanvas = document.createElement('canvas');
  alpanaCanvas.width = 512;
  alpanaCanvas.height = 512;
  const aCtx = alpanaCanvas.getContext('2d')!;
  aCtx.clearRect(0, 0, 512, 512);
  aCtx.translate(256, 256);

  // Outer dashed folk ring
  aCtx.strokeStyle = 'rgba(248, 250, 252, 0.78)';
  aCtx.lineWidth = 8;
  aCtx.setLineDash([18, 14]);
  aCtx.beginPath();
  aCtx.arc(0, 0, 228, 0, Math.PI * 2);
  aCtx.stroke();
  aCtx.setLineDash([]);

  // Middle saffron ring + lotus petals
  aCtx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
  aCtx.lineWidth = 6;
  aCtx.beginPath();
  aCtx.arc(0, 0, 185, 0, Math.PI * 2);
  aCtx.stroke();

  const petalCount = 16;
  for (let i = 0; i < petalCount; i++) {
    aCtx.save();
    aCtx.rotate((i / petalCount) * Math.PI * 2);
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(248, 250, 252, 0.78)' : 'rgba(239, 68, 68, 0.78)';
    aCtx.beginPath();
    aCtx.ellipse(0, -140, 18, 38, 0, 0, Math.PI * 2);
    aCtx.fill();

    aCtx.fillStyle = 'rgba(250, 204, 21, 0.86)';
    aCtx.beginPath();
    aCtx.arc(0, -206, 6, 0, Math.PI * 2);
    aCtx.fill();
    aCtx.restore();
  }

  // Inner mandala star
  for (let i = 0; i < 12; i++) {
    aCtx.save();
    aCtx.rotate((i / 12) * Math.PI * 2);
    aCtx.fillStyle = i % 2 === 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(248, 250, 252, 0.82)';
    aCtx.beginPath();
    aCtx.moveTo(0, -92);
    aCtx.lineTo(14, -54);
    aCtx.lineTo(-14, -54);
    aCtx.closePath();
    aCtx.fill();
    aCtx.restore();
  }
  aCtx.fillStyle = 'rgba(250, 204, 21, 0.85)';
  aCtx.beginPath();
  aCtx.arc(0, 0, 36, 0, Math.PI * 2);
  aCtx.fill();
  aCtx.fillStyle = 'rgba(220, 38, 38, 0.85)';
  aCtx.beginPath();
  aCtx.arc(0, 0, 18, 0, Math.PI * 2);
  aCtx.fill();

  const streetAlpana = finalizeColorTexture(alpanaCanvas, maxAnisotropy, 1, 1);
  allTextures.push(streetAlpana);

  // 24. CROSS-STREET DHAKA EVENT & HERITAGE BANNERS ("ঢাকা উৎসব ও বইমেলা ব্যানার")
  const streetBanners: THREE.CanvasTexture[] = [];
  const bannerDefs = [
    {
      bg: '#b91c1c',
      accent: '#facc15',
      title: 'পুরান ঢাকা ঐতিহ্য ও খাদ্য উৎসব',
      sub: 'চকবাজার • নাজিরাবাজার • লালবাগ কেল্লা এলাকা',
    },
    {
      bg: '#065f46',
      accent: '#fde047',
      title: 'ঢাকা বইমেলা ও চারুকলা প্রদর্শনী',
      sub: 'টিএসসি • শাহবাগ • সোহরাওয়ার্দী উদ্যান',
    },
    {
      bg: '#1e3a8a',
      accent: '#fde047',
      title: 'মেডিকেল ও ইঞ্জিনিয়ারিং ভর্তি মেলা ২০২৬',
      sub: 'নিউ মার্কেট • নীলক্ষেত • এলিফ্যান্ট রোড শাখা',
    },
    {
      bg: '#7c2d12',
      accent: '#fef08a',
      title: 'সড়ক নিরাপত্তা ও মেট্রোরেল সচেতনতা সপ্তাহ',
      sub: 'জেব্রা ক্রসিং ও ফুটওভার ব্রিজ ব্যবহার করুন • ডিএমপি',
    },
    {
      bg: '#881337',
      accent: '#facc15',
      title: 'শারদীয় ও ঈদ মহা-বৈশাখী বস্ত্র মেলা',
      sub: 'গাউছিয়া • চন্দ্রিমা • নিউ মার্কেট ৫০% ডিসকাউন্ট!',
    },
    {
      bg: '#047857',
      accent: '#fef08a',
      title: 'শাবাশ বাংলাদেশ! মিরপুর স্টেডিয়াম ক্রিকেট ধামাকা',
      sub: 'টাইগার্স বনাম বিশ্ব একাদশ • লাইভ বড় পর্দায়',
    },
  ];
  bannerDefs.forEach((bDef) => {
    const bCan = document.createElement('canvas');
    bCan.width = 512;
    bCan.height = 128;
    const bCtx = bCan.getContext('2d')!;
    bCtx.fillStyle = bDef.bg;
    bCtx.fillRect(0, 0, 512, 128);
    bCtx.strokeStyle = bDef.accent;
    bCtx.lineWidth = 6;
    bCtx.strokeRect(5, 5, 502, 118);
    bCtx.fillStyle = bDef.accent;
    bCtx.font = 'bold 28px "Hind Siliguri", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText(bDef.title, 256, 56);
    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'bold 18px "Hind Siliguri", sans-serif';
    bCtx.fillText(bDef.sub, 256, 94);
    const bTex = finalizeColorTexture(bCan, maxAnisotropy, 1, 1);
    allTextures.push(bTex);
    streetBanners.push(bTex);
  });

  // 25. DHAKA NEW MARKET GATE ARCH SIGN ("ঢাকা নিউ মার্কেট ★ স্থাপিত ১৯৫৪")
  const nmArchCan = document.createElement('canvas');
  nmArchCan.width = 512;
  nmArchCan.height = 128;
  const nmCtx = nmArchCan.getContext('2d')!;
  nmCtx.fillStyle = '#fef3c7';
  nmCtx.fillRect(0, 0, 512, 128);
  nmCtx.fillStyle = '#991b1b';
  nmCtx.fillRect(8, 8, 496, 112);
  nmCtx.strokeStyle = '#fbbf24';
  nmCtx.lineWidth = 4;
  nmCtx.strokeRect(14, 14, 484, 100);
  nmCtx.fillStyle = '#fef08a';
  nmCtx.font = 'bold 34px "Hind Siliguri", sans-serif';
  nmCtx.textAlign = 'center';
  nmCtx.fillText('ঢাকা নিউ মার্কেট ★ ১৯৫৪', 256, 62);
  nmCtx.fillStyle = '#ffffff';
  nmCtx.font = 'bold 17px "Hind Siliguri", sans-serif';
  nmCtx.fillText('DHAKA NEW MARKET • শপিং কমপ্লেক্স • গেট নং ১', 256, 98);
  const newMarketArchSign = finalizeColorTexture(nmArchCan, maxAnisotropy, 1, 1);
  allTextures.push(newMarketArchSign);

  // 26. NEW MARKET — GAWSIA FOOT OVERBRIDGE BANNER
  const obCan = document.createElement('canvas');
  obCan.width = 512;
  obCan.height = 128;
  const obCtx = obCan.getContext('2d')!;
  obCtx.fillStyle = '#065f46';
  obCtx.fillRect(0, 0, 512, 128);
  obCtx.fillStyle = '#facc15';
  obCtx.fillRect(0, 0, 512, 14);
  obCtx.fillRect(0, 114, 512, 14);
  obCtx.fillStyle = '#ffffff';
  obCtx.font = 'bold 26px "Hind Siliguri", sans-serif';
  obCtx.textAlign = 'center';
  obCtx.fillText('নিউ মার্কেট ⇄ গাউছিয়া ⇄ চন্দ্রিমা', 256, 58);
  obCtx.fillStyle = '#fde68a';
  obCtx.font = 'bold 18px "Hind Siliguri", sans-serif';
  obCtx.fillText('ফুটওভার ব্রিজ ব্যবহার করুন • নীলক্ষেত — এলিফ্যান্ট রোড', 256, 94);
  const newMarketOverbridgeBanner = finalizeColorTexture(obCan, maxAnisotropy, 1, 1);
  allTextures.push(newMarketOverbridgeBanner);

  // 27. COLORFUL HANGING SAREES / PANJABIS / GARMENT DISPLAY RACK
  const garCan = document.createElement('canvas');
  garCan.width = 256;
  garCan.height = 256;
  const garCtx = garCan.getContext('2d')!;
  garCtx.fillStyle = '#1e293b';
  garCtx.fillRect(0, 0, 256, 256);
  const clothPalette = ['#e11d48', '#f59e0b', '#10b981', '#0284c7', '#a855f7', '#ec4899', '#eab308', '#14b8a6'];
  for (let i = 0; i < 8; i++) {
    garCtx.fillStyle = clothPalette[i];
    garCtx.fillRect(6 + i * 31, 22, 26, 200);
    // Decorative saree zari/embroidery stripes
    garCtx.fillStyle = '#fef08a';
    garCtx.fillRect(6 + i * 31, 175, 26, 12);
    garCtx.fillRect(6 + i * 31, 32, 26, 6);
  }
  // Top steel hanging rail
  garCtx.fillStyle = '#cbd5e1';
  garCtx.fillRect(0, 14, 256, 10);
  const newMarketGarmentRack = finalizeColorTexture(garCan, maxAnisotropy, 1, 1);
  allTextures.push(newMarketGarmentRack);

  // 28. NEW MARKET FOOTPATH STRIPED TARPAULIN AWNING ("দোকানের রঙিন ত্রিপল ছাউনি")
  const awnCan = document.createElement('canvas');
  awnCan.width = 256;
  awnCan.height = 128;
  const awnCtx = awnCan.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    awnCtx.fillStyle = i % 2 === 0 ? '#1d4ed8' : '#f8fafc';
    awnCtx.fillRect(i * 32, 0, 32, 128);
  }
  awnCtx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  awnCtx.fillRect(0, 108, 256, 20);
  const marketStripedAwning = finalizeColorTexture(awnCan, maxAnisotropy, 2, 1);
  allTextures.push(marketStripedAwning);

  // 29. NILKHET OLD BOOK MARKET STACK TEXTURE
  const bkCan = document.createElement('canvas');
  bkCan.width = 256;
  bkCan.height = 256;
  const bkCtx = bkCan.getContext('2d')!;
  bkCtx.fillStyle = '#78350f';
  bkCtx.fillRect(0, 0, 256, 256);
  const bookCols = ['#dc2626', '#2563eb', '#16a34a', '#f59e0b', '#f8fafc', '#9333ea', '#0891b2'];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      bkCtx.fillStyle = bookCols[(row * 3 + col) % bookCols.length];
      bkCtx.fillRect(8 + col * 24, 16 + row * 48, 20, 40);
      bkCtx.fillStyle = 'rgba(255,255,255,0.45)';
      bkCtx.fillRect(10 + col * 24, 24 + row * 48, 16, 6);
    }
  }
  const nilkhetBooksTex = finalizeColorTexture(bkCan, maxAnisotropy, 1, 1);
  allTextures.push(nilkhetBooksTex);

  // 30. LARGE DHAKA ROADSIDE & ROOFTOP BILLBOARDS (512x256)
  const billboardDefs = [
    {
      bgA: '#991b1b',
      bgB: '#dc2626',
      accent: '#facc15',
      badge: 'নং ১ পছন্দ',
      headline: 'বসুন্ধরা গোল্ডেন সিমেন্ট',
      sub: 'মজবুত ঢাকার ভিত্তি · শতভাগ খাঁটি ক্লিংকার',
      tag: 'সারা বাংলাদেশে ডিলার নিয়োগ চলছে',
    },
    {
      bgA: '#0369a1',
      bgB: '#0ea5e9',
      accent: '#fef08a',
      badge: 'গ্রামীণফোন ৫জি',
      headline: 'চলো বহুদূর — ১০০ জিবি ৯৯৳',
      sub: 'দেশের সবচেয়ে দ্রুতগতির নেটওয়ার্ক এখন ঢাকায়',
      tag: 'মাইজিপি অ্যাপে আজই অ্যাক্টিভেট করুন',
    },
    {
      bgA: '#14532d',
      bgB: '#16a34a',
      accent: '#fde047',
      badge: '১০০% আসল স্বাদ',
      headline: 'ইস্পাহানি মির্জাপুর ও প্রাণ জুস',
      sub: 'প্রতি চুমুকে সিলেটের বাগানের সতেজ আমেজ',
      tag: 'সকল খোলা মুদি দোকানে পাওয়া যাচ্ছে',
    },
    {
      bgA: '#1e1b4b',
      bgB: '#3730a3',
      accent: '#38bdf8',
      badge: 'ভর্তি চলছে',
      headline: 'উদ্ভাস ও উন্মেষ কোচিং',
      sub: 'বুয়েট · ঢাকা মেডিকেল · ঢাবি ক-ইউনিট ২০২৬',
      tag: 'ফার্মগেট · সায়েন্স ল্যাব · মিরপুর শাখা',
    },
    {
      bgA: '#0f172a',
      bgB: '#1e293b',
      accent: '#f59e0b',
      badge: 'দেশীয় গর্ব',
      headline: 'ওয়ালটন স্মার্ট টিভি ও ফ্রিজ',
      sub: 'ঈদ ধামাকা অফার · জিতে নিন লাখ টাকার ক্যাশ ভাউচার!',
      tag: 'ওয়ালটন প্লাজা — এলিফ্যান্ট রোড ও নিউ মার্কেট',
    },
    {
      bgA: '#be185d',
      bgB: '#db2777',
      accent: '#fde047',
      badge: 'বিকাশ আছে!',
      headline: 'পেমেন্ট করলেই ২০% ক্যাশব্যাক',
      sub: 'শপিং · খাবার · রিকশা ভাড়া সবকিছু এখন মুহূর্তে',
      tag: 'ডায়াল *২৪৭# অথবা বিকাশ অ্যাপ',
    },
  ];
  const billboards = billboardDefs.map((b) => {
    const can = document.createElement('canvas');
    can.width = 512;
    can.height = 256;
    const ctx = can.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 512, 256);
    grad.addColorStop(0, b.bgA);
    grad.addColorStop(1, b.bgB);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Decorative diagonal accent stripe
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(320, 0);
    ctx.lineTo(512, 0);
    ctx.lineTo(512, 256);
    ctx.lineTo(220, 256);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = b.accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 496, 240);

    // Corner badge
    ctx.fillStyle = b.accent;
    ctx.fillRect(22, 22, 168, 38);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.badge, 106, 48);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Hind Siliguri", sans-serif';
    ctx.fillText(b.headline, 256, 118);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 21px "Hind Siliguri", sans-serif';
    ctx.fillText(b.sub, 256, 168);

    ctx.fillStyle = 'rgba(15,23,42,0.72)';
    ctx.fillRect(28, 194, 456, 36);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 17px "Hind Siliguri", sans-serif';
    ctx.fillText(b.tag, 256, 218);

    const tex = finalizeColorTexture(can, maxAnisotropy, 1, 1);
    allTextures.push(tex);
    return tex;
  });

  // 31. LAMP-POST & METRO PILLAR VERTICAL FESTOONS (192x384)
  const vBannerDefs = [
    { bg: '#dc2626', accent: '#facc15', t1: 'ভর্তি চলছে', t2: 'সায়েন্স ল্যাব', t3: 'ফ্রি ক্লাস' },
    { bg: '#047857', accent: '#fef08a', t1: 'সবুজ ঢাকা', t2: 'গাছ লাগান', t3: 'পরিবেশ বাঁচান' },
    { bg: '#1d4ed8', accent: '#ffffff', t1: 'ফাইবার নেট', t2: '৫০০ টাকায়', t3: 'আনলিমিটেড' },
    { bg: '#9a3412', accent: '#fde047', t1: 'ঈদ সেল', t2: 'নিউ মার্কেট', t3: '৫০% ছাড়' },
  ];
  const verticalBanners = vBannerDefs.map((vb) => {
    const can = document.createElement('canvas');
    can.width = 192;
    can.height = 384;
    const ctx = can.getContext('2d')!;
    ctx.fillStyle = vb.bg;
    ctx.fillRect(0, 0, 192, 384);
    ctx.strokeStyle = vb.accent;
    ctx.lineWidth = 8;
    ctx.strokeRect(8, 8, 176, 368);
    ctx.fillStyle = vb.accent;
    ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(vb.t1, 96, 108);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
    ctx.fillText(vb.t2, 96, 196);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 22px "Hind Siliguri", sans-serif';
    ctx.fillText(vb.t3, 96, 282);
    const tex = finalizeColorTexture(can, maxAnisotropy, 1, 1);
    allTextures.push(tex);
    return tex;
  });

  // 32. OPEN SHOP ILLUMINATED SIGNBOARDS (512x128)
  const openShopDefs = [
    { bg: '#065f46', bar: '#22c55e', title: 'লাজ ফার্মা ও মেডিসিন কর্নার', sub: 'খোলা • ২৪ ঘণ্টা ওষুধ ও ফার্স্ট এইড' },
    { bg: '#7c2d12', bar: '#f59e0b', title: 'মায়ের দোয়া মুদি ও কনফেকশনারি', sub: 'খোলা • চাল ডাল বিস্কুট কোল্ড ড্রিঙ্কস' },
    { bg: '#0f172a', bar: '#ec4899', title: 'ডিজিটাল মোবাইল ও বিকাশ পয়েন্ট', sub: 'খোলা • রিচার্জ • বিকাশ • নগদ ক্যাশ আউট' },
    { bg: '#881337', bar: '#facc15', title: 'হাজী হোটেল ও স্পেশাল চা-পরোটা', sub: 'খোলা • গরম পরোটা · মালাই চা · সিঙ্গারা' },
  ];
  const openShopSigns = openShopDefs.map((os) => {
    const can = document.createElement('canvas');
    can.width = 512;
    can.height = 128;
    const ctx = can.getContext('2d')!;
    ctx.fillStyle = os.bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = os.bar;
    ctx.fillRect(0, 0, 512, 16);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(14, 24, 92, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('খোলা দোকান', 60, 47);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Hind Siliguri", sans-serif';
    ctx.fillText(os.title, 305, 56);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 19px "Hind Siliguri", sans-serif';
    ctx.fillText(os.sub, 256, 102);

    const tex = finalizeColorTexture(can, maxAnisotropy, 1, 1);
    allTextures.push(tex);
    return tex;
  });

  // 33. DHAKA ELECTION POSTERS ("নির্বাচনী পোস্টার ও মার্কা") (256x384)
  const drawCandidateSilhouette = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    coatColor: string,
    hasGlasses: boolean,
    hasTupi: boolean
  ) => {
    // Shoulders & Panjabi / Mujib Coat
    ctx.fillStyle = coatColor;
    ctx.beginPath();
    ctx.moveTo(cx - 56, cy + 72);
    ctx.quadraticCurveTo(cx - 50, cy + 16, cx, cy + 12);
    ctx.quadraticCurveTo(cx + 50, cy + 16, cx + 56, cy + 72);
    ctx.closePath();
    ctx.fill();
    // White inner collar
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy + 12);
    ctx.lineTo(cx, cy + 44);
    ctx.lineTo(cx + 14, cy + 12);
    ctx.closePath();
    ctx.fill();
    // Head
    ctx.fillStyle = '#d4d4d8';
    ctx.beginPath();
    ctx.arc(cx, cy - 14, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Hair or Tupi
    if (hasTupi) {
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.arc(cx, cy - 22, 24, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(cx, cy - 20, 24, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    if (hasGlasses) {
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(cx - 16, cy - 20, 12, 8);
      ctx.strokeRect(cx + 4, cy - 20, 12, 8);
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 16);
      ctx.lineTo(cx + 4, cy - 16);
      ctx.stroke();
    }
  };

  const electionPosterDefs = [
    {
      bg: '#f8fafc',
      border: '#09090b',
      headerBg: '#09090b',
      headerFg: '#ffffff',
      topTag: 'ওয়ার্ড নং ১৮ · সিটি নির্বাচন',
      slogan: 'আসন্ন নির্বাচনে সৎ ও যোগ্য প্রার্থী',
      name: 'হাজী মতিউর রহমান',
      symbolName: 'রিকশা মার্কা',
      cta: 'রিকশা মার্কায় আপনার মূল্যবান ভোট দিন',
      accentBg: '#18181b',
      accentFg: '#facc15',
      hasGlasses: true,
      hasTupi: true,
      drawSymbol: (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sx - 18, sy + 14, 13, 0, Math.PI * 2);
        ctx.arc(sx + 20, sy + 14, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.moveTo(sx - 20, sy + 12);
        ctx.lineTo(sx - 6, sy - 16);
        ctx.lineTo(sx + 16, sy - 16);
        ctx.lineTo(sx + 18, sy + 6);
        ctx.closePath();
        ctx.fill();
      },
    },
    {
      bg: '#f1f5f9',
      border: '#111827',
      headerBg: '#111827',
      headerFg: '#fef08a',
      topTag: 'নগর উন্নয়ন জোট মনোনীত',
      slogan: 'এলাকার উন্নয়ন ও শান্তির লক্ষ্যে',
      name: 'অ্যাডভোকেট কামাল উদ্দিন',
      symbolName: 'ফুটবল মার্কা',
      cta: 'ফুটবল মার্কায় ভোট দিয়ে সেবা করার সুযোগ দিন',
      accentBg: '#0f172a',
      accentFg: '#ffffff',
      hasGlasses: false,
      hasTupi: false,
      drawSymbol: (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sx, sy + 2, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(sx, sy + 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(sx, sy - 7);
        ctx.lineTo(sx, sy - 24);
        ctx.moveTo(sx - 8, sy + 6);
        ctx.lineTo(sx - 22, sy + 14);
        ctx.moveTo(sx + 8, sy + 6);
        ctx.lineTo(sx + 22, sy + 14);
        ctx.stroke();
      },
    },
    {
      bg: '#064e3b',
      border: '#ef4444',
      headerBg: '#dc2626',
      headerFg: '#ffffff',
      topTag: 'বাংলাদেশ নির্বাচন কমিশন · প্রচারণা',
      slogan: 'আমার ভোট আমি দেবো, দেখে শুনে বুঝে দেবো',
      name: 'সচেতন নাগরিক সমাজ',
      symbolName: 'ব্যালট বক্স',
      cta: 'সকাল ৮টা – বিকাল ৪টা · ভোট কেন্দ্রে আসুন',
      accentBg: '#facc15',
      accentFg: '#0f172a',
      hasGlasses: true,
      hasTupi: false,
      drawSymbol: (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(sx - 24, sy - 8, 48, 34);
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(sx - 24, sy - 8, 48, 34);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sx - 12, sy - 4, 24, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(sx - 8, sy - 26, 16, 22);
      },
    },
    {
      bg: '#fffbeb',
      border: '#09090b',
      headerBg: '#b91c1c',
      headerFg: '#fef08a',
      topTag: 'তারুণ্যের প্রথম ভোট · ঢাকা-৭',
      slogan: 'দুর্নীতিমুক্ত স্মার্ট ও পরিচ্ছন্ন নগর গড়তে',
      name: 'ইঞ্জি. তানভীর আহমেদ',
      symbolName: 'ছাতা মার্কা',
      cta: 'ছাতা মার্কায় সিল মেরে জয়যুক্ত করুন',
      accentBg: '#18181b',
      accentFg: '#fef08a',
      hasGlasses: true,
      hasTupi: false,
      drawSymbol: (ctx: CanvasRenderingContext2D, sx: number, sy: number) => {
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(sx, sy + 2, 28, Math.PI, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(sx, sy - 26);
        ctx.lineTo(sx, sy + 24);
        ctx.arc(sx - 6, sy + 24, 6, 0, Math.PI);
        ctx.stroke();
      },
    },
  ];

  const electionPosters = electionPosterDefs.map((ep, idx) => {
    const can = document.createElement('canvas');
    can.width = 256;
    can.height = 384;
    const ctx = can.getContext('2d')!;
    ctx.fillStyle = ep.bg;
    ctx.fillRect(0, 0, 256, 384);

    // Classic thick halftone poster border
    ctx.strokeStyle = ep.border;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 372);

    // Header band
    ctx.fillStyle = ep.headerBg;
    ctx.fillRect(14, 14, 228, 36);
    ctx.fillStyle = ep.headerFg;
    ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ep.topTag, 128, 38);

    // Slogan
    ctx.fillStyle = idx === 2 ? '#fef08a' : '#1e293b';
    ctx.font = 'bold 14px "Hind Siliguri", sans-serif';
    ctx.fillText(ep.slogan, 128, 69);

    // Left: Candidate portrait frame, Right: Election Symbol box
    ctx.fillStyle = idx === 2 ? '#ecfdf5' : '#e2e8f0';
    ctx.fillRect(18, 82, 114, 134);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3;
    ctx.strokeRect(18, 82, 114, 134);
    drawCandidateSilhouette(
      ctx,
      75,
      144,
      idx % 2 === 0 ? '#18181b' : '#334155',
      ep.hasGlasses,
      ep.hasTupi
    );

    // Right: Election Symbol Frame
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(138, 82, 100, 134);
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3;
    ctx.strokeRect(138, 82, 100, 134);
    ep.drawSymbol(ctx, 188, 132);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
    ctx.fillText(ep.symbolName, 188, 202);

    // Candidate Name
    ctx.fillStyle = idx === 2 ? '#ffffff' : '#09090b';
    ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
    ctx.fillText(ep.name, 128, 252);

    // Big Vote CTA Bar
    ctx.fillStyle = ep.accentBg;
    ctx.fillRect(16, 272, 224, 54);
    ctx.fillStyle = ep.accentFg;
    ctx.font = 'bold 15px "Hind Siliguri", sans-serif';
    ctx.fillText(ep.cta, 128, 305);

    ctx.fillStyle = idx === 2 ? '#fde68a' : '#475569';
    ctx.font = 'bold 13px "Hind Siliguri", sans-serif';
    ctx.fillText('প্রচারে: এলাকাবাসী ও তরুণ সমাজ', 128, 355);

    const tex = finalizeColorTexture(can, maxAnisotropy, 1, 1);
    allTextures.push(tex);
    return tex;
  });

  // 34. OVERHEAD HANGING ELECTION POSTER STRING ("রশিতে ঝোলানো নির্বাচনী পোস্টার") (512x160 transparent)
  const eRopeCanvas = document.createElement('canvas');
  eRopeCanvas.width = 512;
  eRopeCanvas.height = 160;
  const eRopeCtx = eRopeCanvas.getContext('2d')!;
  eRopeCtx.clearRect(0, 0, 512, 160);
  // Black hanging twine across top
  eRopeCtx.strokeStyle = '#0f172a';
  eRopeCtx.lineWidth = 4;
  eRopeCtx.beginPath();
  eRopeCtx.moveTo(0, 12);
  eRopeCtx.quadraticCurveTo(256, 24, 512, 12);
  eRopeCtx.stroke();

  const posterCount = 7;
  for (let i = 0; i < posterCount; i++) {
    const px = 14 + i * 70;
    const py = 14 + Math.round(Math.sin((i / (posterCount - 1)) * Math.PI) * 7);
    if (i % 3 === 1) {
      // Triangular red/green election pennant
      eRopeCtx.fillStyle = i % 2 === 0 ? '#dc2626' : '#16a34a';
      eRopeCtx.beginPath();
      eRopeCtx.moveTo(px + 6, py);
      eRopeCtx.lineTo(px + 54, py);
      eRopeCtx.lineTo(px + 30, py + 76);
      eRopeCtx.closePath();
      eRopeCtx.fill();
      eRopeCtx.fillStyle = '#fef08a';
      eRopeCtx.font = 'bold 14px "Hind Siliguri", sans-serif';
      eRopeCtx.textAlign = 'center';
      eRopeCtx.fillText('ভোট', px + 30, py + 32);
    } else {
      // Hanging B&W Laminated Election Poster Card
      eRopeCtx.fillStyle = '#f8fafc';
      eRopeCtx.fillRect(px, py, 58, 96);
      eRopeCtx.strokeStyle = '#09090b';
      eRopeCtx.lineWidth = 3;
      eRopeCtx.strokeRect(px, py, 58, 96);
      eRopeCtx.fillStyle = i % 2 === 0 ? '#09090b' : '#b91c1c';
      eRopeCtx.fillRect(px + 4, py + 4, 50, 16);
      // Mini candidate face + symbol circles
      eRopeCtx.fillStyle = '#cbd5e1';
      eRopeCtx.beginPath();
      eRopeCtx.arc(px + 29, py + 40, 12, 0, Math.PI * 2);
      eRopeCtx.fill();
      eRopeCtx.fillStyle = '#18181b';
      eRopeCtx.fillRect(px + 11, py + 54, 36, 22);
      eRopeCtx.fillStyle = '#facc15';
      eRopeCtx.font = 'bold 11px "Hind Siliguri", sans-serif';
      eRopeCtx.textAlign = 'center';
      eRopeCtx.fillText('ভোট দিন', px + 29, py + 90);
    }
  }
  const electionPosterRope = finalizeColorTexture(eRopeCanvas, maxAnisotropy, 1, 1);
  allTextures.push(electionPosterRope);

  // 35. COMIC BANGLA SCOLD / GALAGALI SPEECH BUBBLES (NPCs & Drivers) (512x176 transparent)
  const buildScoldBubbleTex = (line: string, accentColor: string, tagText: string): THREE.CanvasTexture => {
    const can = document.createElement('canvas');
    can.width = 512;
    can.height = 176;
    const ctx = can.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 176);

    const bx = 18;
    const by = 14;
    const bw = 476;
    const bh = 114;
    const rad = 28;

    // Soft drop shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
    ctx.beginPath();
    ctx.roundRect(bx + 4, by + 6, bw, bh, rad);
    ctx.fill();

    // Comic bubble body + downward pointer triangle
    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.moveTo(bx + rad, by);
    ctx.lineTo(bx + bw - rad, by);
    ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + rad);
    ctx.lineTo(bx + bw, by + bh - rad);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - rad, by + bh);
    ctx.lineTo(282, by + bh);
    ctx.lineTo(256, by + bh + 34);
    ctx.lineTo(230, by + bh);
    ctx.lineTo(bx + rad, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - rad);
    ctx.lineTo(bx, by + rad);
    ctx.quadraticCurveTo(bx, by, bx + rad, by);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top accent pill tag inside bubble
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(bx + 18, by + 12, 152, 26, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tagText, bx + 94, by + 25);

    // Main bold Bengali scold / galagali line
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 34px "Hind Siliguri", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(line, 256, by + 76, bw - 34);

    const tex = finalizeColorTexture(can, maxAnisotropy, 1, 1);
    allTextures.push(tex);
    return tex;
  };

  const npcScoldLines: Array<[string, string, string]> = [
    ['আবে অন্ধ নাকি ব্যাটা?!', '#dc2626', 'পথচারী ক্ষিপ্ত'],
    ['চোখ কি মাথায় তুলছস?!', '#b91c1c', 'সাবধান!'],
    ['মামা মেরে দিলি রে!', '#ea580c', 'আহত পথচারী'],
    ['রাস্তা তোর বাপের নাকি?!', '#dc2626', 'মেজাজ খারাপ'],
    ['বেয়াদব কোথাকার!', '#991b1b', 'গালি দিচ্ছে'],
    ['দেখে চালা হারামজাদা!', '#dc2626', 'বড় বিপদ!'],
    ['ফুটপাত দিয়েও চালাবি নাকি?!', '#c2410c', 'পথচারী রাগান্বিত'],
    ['পা ভেঙে দিলি রে শালা!', '#b91c1c', 'চিৎকার!'],
    ['কই থিকা আইছে আবাল!', '#9f1239', 'ক্ষিপ্ত জনতা'],
    ['চশমা পরে গাড়ি চালা!', '#d97706', 'সাবধান!'],
  ];

  const vehicleScoldLines: Array<[string, string, string]> = [
    ['ওই শালা ব্রেক ধর!', '#dc2626', 'ড্রাইভার ক্ষিপ্ত'],
    ['ওই খালি সাইড দে!', '#ea580c', 'জ্যাম অ্যালার্ট'],
    ['গাড়ি কিনেছিস না চুরি?!', '#b91c1c', 'ধাক্কা!'],
    ['লাইসেন্স কে দিছে তোরে?!', '#991b1b', 'ড্রাইভারের গালি'],
    ['পেছন থেকে মারলি ক্যান?!', '#dc2626', 'সংঘর্ষ!'],
    ['রাস্তা আটকায় ক্যান গাধা!', '#d97706', 'হর্ন বাজাচ্ছে'],
    ['বেল বাজায়া মাথা খাইলো!', '#c2410c', 'বেল শকওয়েভ'],
    ['ধাক্কা মারিস ক্যান ওস্তাদ?!', '#b91c1c', 'মেজাজ গরম'],
  ];

  const npcScoldBubbles = npcScoldLines.map(([line, accent, tag]) =>
    buildScoldBubbleTex(line, accent, tag)
  );
  const vehicleScoldBubbles = vehicleScoldLines.map(([line, accent, tag]) =>
    buildScoldBubbleTex(line, accent, tag)
  );

  // 36. U-TURN BAY ROAD MARKING DECAL (256x256 transparent)
  const uMarkCanvas = document.createElement('canvas');
  uMarkCanvas.width = 256;
  uMarkCanvas.height = 256;
  const umCtx = uMarkCanvas.getContext('2d')!;
  umCtx.clearRect(0, 0, 256, 256);

  // Yellow dashed U-turn turning zone border
  umCtx.strokeStyle = '#facc15';
  umCtx.lineWidth = 8;
  umCtx.setLineDash([18, 12]);
  umCtx.strokeRect(14, 14, 228, 228);
  umCtx.setLineDash([]);

  // Crisp White Painted Curved U-Turn Arrow
  umCtx.strokeStyle = '#f8fafc';
  umCtx.lineWidth = 22;
  umCtx.lineCap = 'round';
  umCtx.beginPath();
  umCtx.moveTo(74, 206);
  umCtx.lineTo(74, 98);
  umCtx.arc(128, 98, 54, Math.PI, 0, false);
  umCtx.lineTo(182, 186);
  umCtx.stroke();

  umCtx.fillStyle = '#f8fafc';
  umCtx.beginPath();
  umCtx.moveTo(182, 220);
  umCtx.lineTo(148, 174);
  umCtx.lineTo(216, 174);
  umCtx.closePath();
  umCtx.fill();

  const uTurnRoadMark = finalizeColorTexture(uMarkCanvas, maxAnisotropy, 1, 1);
  allTextures.push(uTurnRoadMark);

  // 37. DMP BLUE "ইউ-টার্ন / U-TURN" SIGNBOARD TEXTURE (256x256)
  const uSignCanvas = document.createElement('canvas');
  uSignCanvas.width = 256;
  uSignCanvas.height = 256;
  const usCtx = uSignCanvas.getContext('2d')!;
  usCtx.fillStyle = '#1d4ed8';
  usCtx.fillRect(0, 0, 256, 256);
  usCtx.strokeStyle = '#ffffff';
  usCtx.lineWidth = 10;
  usCtx.strokeRect(10, 10, 236, 236);

  usCtx.strokeStyle = '#ffffff';
  usCtx.lineWidth = 20;
  usCtx.lineCap = 'round';
  usCtx.beginPath();
  usCtx.moveTo(78, 165);
  usCtx.lineTo(78, 86);
  usCtx.arc(128, 86, 50, Math.PI, 0, false);
  usCtx.lineTo(178, 145);
  usCtx.stroke();

  usCtx.fillStyle = '#ffffff';
  usCtx.beginPath();
  usCtx.moveTo(178, 172);
  usCtx.lineTo(152, 134);
  usCtx.lineTo(204, 134);
  usCtx.closePath();
  usCtx.fill();

  usCtx.fillStyle = '#fef08a';
  usCtx.font = 'bold 30px "Hind Siliguri", sans-serif';
  usCtx.textAlign = 'center';
  usCtx.fillText('ইউ-টার্ন • U-TURN', 128, 224);

  const uTurnSign = finalizeColorTexture(uSignCanvas, maxAnisotropy, 1, 1);
  allTextures.push(uTurnSign);

  // 38. DHAKA METRO RAIL MRT-6 PILLAR BADGE WRAP (512x256)
  const mpCanvas = document.createElement('canvas');
  mpCanvas.width = 512;
  mpCanvas.height = 256;
  const mpCtx = mpCanvas.getContext('2d')!;
  mpCtx.fillStyle = '#064e3b';
  mpCtx.fillRect(0, 0, 512, 256);
  mpCtx.fillStyle = '#dc2626';
  mpCtx.fillRect(0, 0, 512, 34);
  mpCtx.fillRect(0, 222, 512, 34);
  mpCtx.strokeStyle = '#facc15';
  mpCtx.lineWidth = 6;
  mpCtx.strokeRect(12, 42, 488, 172);

  mpCtx.fillStyle = '#ffffff';
  mpCtx.font = 'bold 38px "Hind Siliguri", sans-serif';
  mpCtx.textAlign = 'center';
  mpCtx.fillText('ঢাকা মেট্রো-রেল · MRT-6', 256, 110);
  mpCtx.fillStyle = '#fef08a';
  mpCtx.font = 'bold 26px "Hind Siliguri", sans-serif';
  mpCtx.fillText('পিলার নং M-104 · ধীরগতিতে চলুন', 256, 168);

  const metroPillarBadge = finalizeColorTexture(mpCanvas, maxAnisotropy, 1, 1);
  allTextures.push(metroPillarBadge);

  // 39. INTERACTIVE STREET VENDOR POWER-UP KIOSK SIGNS (Chai-Break & Jhal-Muri)
  const buildKioskSign = (
    bgTop: string,
    bgBot: string,
    border: string,
    badgeBg: string,
    badgeText: string,
    title: string,
    sub: string
  ) => {
    const kCanvas = document.createElement('canvas');
    kCanvas.width = 512;
    kCanvas.height = 192;
    const kCtx = kCanvas.getContext('2d')!;
    const grad = kCtx.createLinearGradient(0, 0, 0, 192);
    grad.addColorStop(0, bgTop);
    grad.addColorStop(1, bgBot);
    kCtx.fillStyle = grad;
    kCtx.fillRect(0, 0, 512, 192);

    kCtx.strokeStyle = border;
    kCtx.lineWidth = 8;
    kCtx.strokeRect(8, 8, 496, 176);

    kCtx.fillStyle = badgeBg;
    kCtx.fillRect(24, 18, 464, 40);
    kCtx.fillStyle = '#09090b';
    kCtx.font = 'bold 23px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    kCtx.textAlign = 'center';
    kCtx.fillText(badgeText, 256, 46);

    kCtx.fillStyle = '#ffffff';
    kCtx.font = 'bold 42px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    kCtx.fillText(title, 256, 108);

    kCtx.fillStyle = '#fef08a';
    kCtx.font = 'bold 24px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    kCtx.fillText(sub, 256, 154);

    const tex = finalizeColorTexture(kCanvas, maxAnisotropy, 1, 1);
    allTextures.push(tex);
    return tex;
  };

  const chaiBreakKioskSign = buildKioskSign(
    '#064e3b',
    '#022c22',
    '#34d399',
    '#34d399',
    '⚡ পাওয়ার-আপ স্টেশন · ইনভিন্সিবল শিল্ড',
    '☕ স্পেশাল চা-ব্রেক',
    'পাশ দিয়ে গেলেই ৬ সেকেন্ড অজেয় শিল্ড!'
  );

  const jhalMuriKioskSign = buildKioskSign(
    '#9a3412',
    '#450a0a',
    '#fb923c',
    '#facc15',
    '🔥 পাওয়ার-আপ স্টেশন · সুপার স্পিড বুস্ট',
    '🌶️ মামার ঝালমুড়ি',
    'পাশ দিয়ে গেলেই ৪.৫ সেকেন্ড রকেট গতি!'
  );

  return {
    asphalt,
    asphaltBump,
    curb,
    sidewalk,
    sidewalkBump,
    rickshawArt,
    rickshawHoodVariants,
    rickshawRearArt,
    contactShadow,
    corrugatedTin,
    buildingWindows,
    dhakaShopfrontGround,
    shopSigns,
    bangladeshiPosters,
    heritageBrick,
    mosqueMosaic,
    metroLivery,
    trashTexture,
    buntingFlags,
    busBanner,
    cngWireMesh,
    cngPlate,
    cngFrontBanner,
    cngMeter,
    cngChevrons,
    cngMudflap,
    kaderFace,
    lungis,
    zebraCrossing,
    trafficSignDmp,
    wallGraffitis,
    streetAlpana,
    streetBanners,
    newMarketArchSign,
    newMarketOverbridgeBanner,
    newMarketGarmentRack,
    marketStripedAwning,
    nilkhetBooksTex,
    billboards,
    verticalBanners,
    openShopSigns,
    electionPosters,
    electionPosterRope,
    npcScoldBubbles,
    vehicleScoldBubbles,
    uTurnRoadMark,
    uTurnSign,
    metroPillarBadge,
    chaiBreakKioskSign,
    jhalMuriKioskSign,
    disposeAll: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}
