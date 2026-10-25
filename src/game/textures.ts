import * as THREE from 'three';

export interface ProceduralTexturePack {
  asphalt: THREE.CanvasTexture;
  curb: THREE.CanvasTexture;
  sidewalk: THREE.CanvasTexture;
  rickshawArt: THREE.CanvasTexture;
  rickshawRearArt: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  corrugatedTin: THREE.CanvasTexture;
  buildingWindows: THREE.CanvasTexture[];
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
  kaderFace: THREE.Texture;
  lungis: THREE.CanvasTexture[];
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

export function createProceduralTextures(maxAnisotropy: number): ProceduralTexturePack {
  const allTextures: THREE.Texture[] = [];

  // 1. Worn Purana Dhaka Asphalt Road with lane stripes & patches (512x512)
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 512;
  roadCanvas.height = 512;
  const rCtx = roadCanvas.getContext('2d')!;
  rCtx.fillStyle = '#1e2229';
  rCtx.fillRect(0, 0, 512, 512);

  // Road surface aggregate texture
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const shade = 24 + Math.floor(Math.random() * 28);
    rCtx.fillStyle = `rgb(${shade},${shade + 2},${shade + 5})`;
    rCtx.fillRect(x, y, 2, 2);
  }

  // Worn tire rut tracks in left, center, right lanes
  rCtx.fillStyle = 'rgba(10, 12, 16, 0.35)';
  rCtx.fillRect(95, 0, 75, 512);
  rCtx.fillRect(215, 0, 80, 512);
  rCtx.fillRect(340, 0, 75, 512);

  // White border lines
  rCtx.fillStyle = '#cbd5e1';
  rCtx.fillRect(16, 0, 8, 512);
  rCtx.fillRect(488, 0, 8, 512);

  // Yellow center divider dashed lines
  rCtx.fillStyle = '#f59e0b';
  for (let y = 20; y < 512; y += 128) {
    rCtx.fillRect(250, y, 12, 74);
  }

  // Weathered road patch
  rCtx.fillStyle = '#14171d';
  rCtx.beginPath();
  rCtx.ellipse(140, 260, 42, 26, 0.2, 0, Math.PI * 2);
  rCtx.fill();

  const asphalt = finalizeColorTexture(roadCanvas, maxAnisotropy, 1, 8);
  allTextures.push(asphalt);

  // 2. Dhaka Yellow & Black Striped Curb
  const curbCanvas = document.createElement('canvas');
  curbCanvas.width = 256;
  curbCanvas.height = 256;
  const cCtx = curbCanvas.getContext('2d')!;
  for (let y = 0; y < 256; y += 64) {
    cCtx.fillStyle = (y / 64) % 2 === 0 ? '#eab308' : '#18181b';
    cCtx.fillRect(0, y, 256, 64);
  }
  cCtx.fillStyle = 'rgba(255,255,255,0.08)';
  cCtx.fillRect(0, 0, 36, 256);
  const curb = finalizeColorTexture(curbCanvas, maxAnisotropy, 1, 24);
  allTextures.push(curb);

  // 3. Concrete Sidewalk Pavers
  const swCanvas = document.createElement('canvas');
  swCanvas.width = 256;
  swCanvas.height = 256;
  const swCtx = swCanvas.getContext('2d')!;
  swCtx.fillStyle = '#475569';
  swCtx.fillRect(0, 0, 256, 256);
  swCtx.strokeStyle = '#334155';
  swCtx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) {
    swCtx.beginPath();
    swCtx.moveTo(i, 0);
    swCtx.lineTo(i, 256);
    swCtx.stroke();
    swCtx.beginPath();
    swCtx.moveTo(0, i);
    swCtx.lineTo(256, i);
    swCtx.stroke();
  }
  const sidewalk = finalizeColorTexture(swCanvas, maxAnisotropy, 2, 28);
  allTextures.push(sidewalk);

  // 4. Bangladeshi Rickshaw Folk Art Hood (512x512)
  const artCanvas = document.createElement('canvas');
  artCanvas.width = 512;
  artCanvas.height = 512;
  const aCtx = artCanvas.getContext('2d')!;
  const grad = aCtx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#e11d48');
  grad.addColorStop(0.5, '#f43f5e');
  grad.addColorStop(1, '#9f1239');
  aCtx.fillStyle = grad;
  aCtx.fillRect(0, 0, 512, 512);

  // Ornamental folk border
  aCtx.strokeStyle = '#facc15';
  aCtx.lineWidth = 18;
  aCtx.strokeRect(18, 18, 476, 476);
  aCtx.strokeStyle = '#06b6d4';
  aCtx.lineWidth = 8;
  aCtx.strokeRect(36, 36, 440, 440);

  // Stylized folk floral medallions
  const drawFlower = (cx: number, cy: number, r: number) => {
    for (let p = 0; p < 8; p++) {
      const ang = (p * Math.PI) / 4;
      aCtx.save();
      aCtx.translate(cx + Math.cos(ang) * r * 0.55, cy + Math.sin(ang) * r * 0.55);
      aCtx.rotate(ang);
      aCtx.fillStyle = p % 2 === 0 ? '#fde047' : '#2dd4bf';
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
  const rickshawArt = finalizeColorTexture(artCanvas, maxAnisotropy);
  allTextures.push(rickshawArt);

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

  // 8. Building Windows
  const facadePalettes = [
    { wall: '#c9b79c', trim: '#713f12', lit: '#fef08a', dark: '#1e293b' },
    { wall: '#94a3b8', trim: '#0f766e', lit: '#fef9c3', dark: '#0f172a' },
    { wall: '#fdba74', trim: '#9a3412', lit: '#fef08a', dark: '#1c1917' },
  ];
  const buildingWindows = facadePalettes.map((pal) => {
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 512;
    const bCtx = bCanvas.getContext('2d')!;
    bCtx.fillStyle = pal.wall;
    bCtx.fillRect(0, 0, 256, 512);

    for (let y = 0; y < 512; y += 128) {
      bCtx.fillStyle = pal.trim;
      bCtx.fillRect(0, y, 256, 10);

      for (let col = 0; col < 3; col++) {
        const wx = 22 + col * 78;
        const wy = y + 26;
        const isLit = (y + col * 37) % 3 === 0;
        bCtx.fillStyle = isLit ? pal.lit : pal.dark;
        bCtx.fillRect(wx, wy, 52, 72);
        bCtx.strokeStyle = pal.trim;
        bCtx.lineWidth = 3;
        bCtx.strokeRect(wx, wy, 52, 72);
      }
    }
    const tex = finalizeColorTexture(bCanvas, maxAnisotropy);
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

  return {
    asphalt,
    curb,
    sidewalk,
    rickshawArt,
    rickshawRearArt,
    contactShadow,
    corrugatedTin,
    buildingWindows,
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
    kaderFace,
    lungis,
    disposeAll: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}
