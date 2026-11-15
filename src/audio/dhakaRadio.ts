export type DhakaRadioStationId = '88.8' | '98.4' | '101.6' | 'OFF';

export interface DhakaRadioTrackInfo {
  titleBn: string;
  subtitleBn: string;
  bpm: number;
  chords: number[][];
  melody: { step: number; midi: number; dur: number; vel: number }[];
  bass: { step: number; midi: number; dur: number }[];
  drumPattern: 'tintal' | 'kaherva' | 'baul' | 'fusion';
  leadVoice: 'flute' | 'harmonium' | 'dotara' | 'brass';
}

export interface DhakaTalkSegment {
  segmentTitleBn: string;
  callerTagBn: string;
  spokenLineBn: string;
  tickerLineBn: string;
  voicePitch: number;
  voiceRate: number;
  hasPhoneRing?: boolean;
}

export interface DhakaRadioSnapshot {
  stationId: DhakaRadioStationId;
  frequencyLabel: string;
  stationNameBn: string;
  modeTagBn: string;
  nowPlayingTitleBn: string;
  nowPlayingSubBn: string;
  liveChatterBn: string;
  volume: number;
  muted: boolean;
  isPlaying: boolean;
  signalStrength: number;
}

const NOTE_FREQ_A4 = 440;
function midiToFreq(midi: number): number {
  return NOTE_FREQ_A4 * Math.pow(2, (midi - 69) / 12);
}

/**
 * 4 Authentic Bengali Classic / Folk-Fusion Musical Suites (MIDI sequenced in 16-step bars)
 */
const CLASSIC_BENGALI_TRACKS: DhakaRadioTrackInfo[] = [
  {
    titleBn: 'পদ্মা নদীর মাঝি — ভাটিয়ালি',
    subtitleBn: 'বাঁশি ও একতারা · ক্লাসিক লোকসুর',
    bpm: 84,
    leadVoice: 'flute',
    drumPattern: 'tintal',
    // Calm D Major / Mixolydian Bhatiyali drone & chords
    chords: [
      [50, 57, 62],
      [50, 57, 62],
      [55, 62, 67],
      [57, 64, 69],
    ],
    bass: [
      { step: 0, midi: 38, dur: 0.75 },
      { step: 6, midi: 45, dur: 0.45 },
      { step: 8, midi: 38, dur: 0.65 },
      { step: 14, midi: 43, dur: 0.45 },
    ],
    melody: [
      { step: 0, midi: 74, dur: 0.55, vel: 0.85 },
      { step: 2, midi: 76, dur: 0.4, vel: 0.78 },
      { step: 4, midi: 78, dur: 0.7, vel: 0.92 },
      { step: 8, midi: 76, dur: 0.45, vel: 0.8 },
      { step: 10, midi: 74, dur: 0.5, vel: 0.82 },
      { step: 12, midi: 71, dur: 0.65, vel: 0.76 },
      { step: 16, midi: 69, dur: 0.75, vel: 0.88 },
      { step: 20, midi: 71, dur: 0.4, vel: 0.82 },
      { step: 22, midi: 74, dur: 0.65, vel: 0.9 },
      { step: 26, midi: 72, dur: 0.45, vel: 0.84 },
      { step: 28, midi: 71, dur: 0.45, vel: 0.8 },
      { step: 30, midi: 69, dur: 0.7, vel: 0.75 },
    ],
  },
  {
    titleBn: '৭০ দশকের রূপালি পর্দা (আধুনিক)',
    subtitleBn: 'হারমোনিয়াম ও বাঁশি · সোনালি ছায়াছবি',
    bpm: 96,
    leadVoice: 'harmonium',
    drumPattern: 'kaherva',
    // Raga Yaman / Kalyan romantic progression (C - G - F - Em - G)
    chords: [
      [48, 55, 60, 64],
      [55, 59, 62, 67],
      [53, 57, 60, 65],
      [55, 59, 62, 67],
    ],
    bass: [
      { step: 0, midi: 36, dur: 0.4 },
      { step: 4, midi: 43, dur: 0.35 },
      { step: 8, midi: 41, dur: 0.4 },
      { step: 12, midi: 43, dur: 0.35 },
    ],
    melody: [
      { step: 0, midi: 72, dur: 0.45, vel: 0.88 },
      { step: 2, midi: 74, dur: 0.35, vel: 0.82 },
      { step: 4, midi: 76, dur: 0.55, vel: 0.92 },
      { step: 7, midi: 78, dur: 0.35, vel: 0.85 }, // Tivra Ma (Kalyan touch)
      { step: 9, midi: 79, dur: 0.65, vel: 0.94 },
      { step: 13, midi: 76, dur: 0.4, vel: 0.8 },
      { step: 16, midi: 77, dur: 0.45, vel: 0.86 },
      { step: 18, midi: 76, dur: 0.35, vel: 0.82 },
      { step: 20, midi: 74, dur: 0.5, vel: 0.88 },
      { step: 24, midi: 72, dur: 0.45, vel: 0.85 },
      { step: 27, midi: 71, dur: 0.4, vel: 0.82 },
      { step: 29, midi: 72, dur: 0.65, vel: 0.9 },
    ],
  },
  {
    titleBn: 'লালন ফকিরের বাউল আখড়া',
    subtitleBn: 'দোতারা, খমক ও তবলা · মাটির সুর',
    bpm: 108,
    leadVoice: 'dotara',
    drumPattern: 'baul',
    chords: [
      [50, 57, 62],
      [53, 57, 60],
      [55, 62, 67],
      [50, 57, 62],
    ],
    bass: [
      { step: 0, midi: 38, dur: 0.3 },
      { step: 3, midi: 38, dur: 0.2 },
      { step: 6, midi: 45, dur: 0.3 },
      { step: 8, midi: 38, dur: 0.3 },
      { step: 11, midi: 41, dur: 0.25 },
      { step: 14, midi: 43, dur: 0.3 },
    ],
    melody: [
      { step: 0, midi: 69, dur: 0.24, vel: 0.9 },
      { step: 2, midi: 74, dur: 0.24, vel: 0.88 },
      { step: 4, midi: 74, dur: 0.22, vel: 0.84 },
      { step: 6, midi: 76, dur: 0.28, vel: 0.92 },
      { step: 8, midi: 77, dur: 0.32, vel: 0.9 },
      { step: 11, midi: 76, dur: 0.22, vel: 0.84 },
      { step: 13, midi: 74, dur: 0.26, vel: 0.86 },
      { step: 16, midi: 72, dur: 0.28, vel: 0.88 },
      { step: 18, midi: 74, dur: 0.24, vel: 0.86 },
      { step: 20, midi: 71, dur: 0.3, vel: 0.85 },
      { step: 23, midi: 69, dur: 0.28, vel: 0.82 },
      { step: 26, midi: 67, dur: 0.25, vel: 0.8 },
      { step: 28, midi: 69, dur: 0.45, vel: 0.9 },
    ],
  },
  {
    titleBn: 'মেঘলা ঢাকার পুরোনো বিকেল',
    subtitleBn: 'অ্যাকুস্টিক ও এসরাজ · নস্টালজিক মেলোডি',
    bpm: 88,
    leadVoice: 'flute',
    drumPattern: 'kaherva',
    chords: [
      [45, 52, 57, 60],
      [41, 48, 53, 57],
      [43, 50, 55, 59],
      [45, 52, 57, 60],
    ],
    bass: [
      { step: 0, midi: 45, dur: 0.55 },
      { step: 4, midi: 40, dur: 0.4 },
      { step: 8, midi: 41, dur: 0.55 },
      { step: 12, midi: 43, dur: 0.45 },
    ],
    melody: [
      { step: 0, midi: 76, dur: 0.55, vel: 0.86 },
      { step: 3, midi: 74, dur: 0.4, vel: 0.8 },
      { step: 5, midi: 72, dur: 0.6, vel: 0.88 },
      { step: 9, midi: 71, dur: 0.45, vel: 0.8 },
      { step: 12, midi: 69, dur: 0.65, vel: 0.86 },
      { step: 16, midi: 72, dur: 0.45, vel: 0.84 },
      { step: 19, midi: 74, dur: 0.5, vel: 0.88 },
      { step: 22, midi: 76, dur: 0.65, vel: 0.92 },
      { step: 27, midi: 74, dur: 0.4, vel: 0.82 },
      { step: 29, midi: 72, dur: 0.6, vel: 0.86 },
    ],
  },
];

const RICKSHAW_FUSION_TRACKS: DhakaRadioTrackInfo[] = [
  {
    titleBn: 'নিউ মার্কেট স্ট্রিট গ্রুভ',
    subtitleBn: 'ঢোল, দোতারা ও ফাংক বেস · ১০১.৬ এক্সক্লুসিভ',
    bpm: 118,
    leadVoice: 'brass',
    drumPattern: 'fusion',
    chords: [
      [48, 55, 58, 63],
      [53, 58, 60, 65],
      [55, 60, 62, 67],
      [48, 55, 58, 63],
    ],
    bass: [
      { step: 0, midi: 36, dur: 0.22 },
      { step: 2, midi: 36, dur: 0.18 },
      { step: 5, midi: 39, dur: 0.22 },
      { step: 8, midi: 41, dur: 0.25 },
      { step: 11, midi: 43, dur: 0.22 },
      { step: 14, midi: 46, dur: 0.2 },
    ],
    melody: [
      { step: 0, midi: 72, dur: 0.2, vel: 0.9 },
      { step: 2, midi: 75, dur: 0.2, vel: 0.85 },
      { step: 4, midi: 77, dur: 0.24, vel: 0.92 },
      { step: 7, midi: 75, dur: 0.18, vel: 0.82 },
      { step: 9, midi: 79, dur: 0.28, vel: 0.95 },
      { step: 12, midi: 77, dur: 0.2, vel: 0.86 },
      { step: 14, midi: 75, dur: 0.24, vel: 0.88 },
      { step: 16, midi: 72, dur: 0.22, vel: 0.9 },
      { step: 18, midi: 70, dur: 0.2, vel: 0.82 },
      { step: 20, midi: 72, dur: 0.3, vel: 0.92 },
      { step: 24, midi: 75, dur: 0.24, vel: 0.88 },
      { step: 28, midi: 79, dur: 0.36, vel: 0.95 },
    ],
  },
  {
    titleBn: 'মিরপুর রোড ক্রুজিং বিট',
    subtitleBn: 'বাংলা রক-ফোক রিদম · ননস্টপ ড্রাইভ',
    bpm: 114,
    leadVoice: 'dotara',
    drumPattern: 'fusion',
    chords: [
      [50, 57, 62],
      [48, 55, 60],
      [46, 53, 58],
      [48, 55, 60],
    ],
    bass: [
      { step: 0, midi: 38, dur: 0.25 },
      { step: 4, midi: 38, dur: 0.2 },
      { step: 6, midi: 41, dur: 0.2 },
      { step: 8, midi: 43, dur: 0.25 },
      { step: 12, midi: 45, dur: 0.25 },
    ],
    melody: [
      { step: 0, midi: 74, dur: 0.22, vel: 0.92 },
      { step: 3, midi: 77, dur: 0.2, vel: 0.86 },
      { step: 5, midi: 79, dur: 0.25, vel: 0.94 },
      { step: 8, midi: 81, dur: 0.26, vel: 0.95 },
      { step: 11, midi: 79, dur: 0.2, vel: 0.85 },
      { step: 14, midi: 77, dur: 0.22, vel: 0.88 },
      { step: 16, midi: 74, dur: 0.25, vel: 0.9 },
      { step: 20, midi: 72, dur: 0.22, vel: 0.84 },
      { step: 22, midi: 74, dur: 0.28, vel: 0.9 },
      { step: 26, midi: 77, dur: 0.22, vel: 0.88 },
      { step: 28, midi: 74, dur: 0.42, vel: 0.92 },
    ],
  },
];

// Cozy low-key lofi / studio underscore played gently beneath Dhaka FM 98.4 talk radio chatter
const TALK_STUDIO_BED: DhakaRadioTrackInfo = {
  titleBn: 'ঢাকা এফএম স্টুডিও লাইভ',
  subtitleBn: 'আরজে আড্ডা ও ট্রাফিক আপডেট',
  bpm: 78,
  leadVoice: 'harmonium',
  drumPattern: 'kaherva',
  chords: [
    [48, 55, 59, 64],
    [45, 52, 57, 60],
    [41, 48, 53, 57],
    [43, 50, 55, 59],
  ],
  bass: [
    { step: 0, midi: 36, dur: 0.6 },
    { step: 8, midi: 41, dur: 0.6 },
  ],
  melody: [
    { step: 4, midi: 76, dur: 0.35, vel: 0.36 },
    { step: 12, midi: 72, dur: 0.35, vel: 0.32 },
    { step: 20, midi: 74, dur: 0.4, vel: 0.34 },
  ],
};

const DHAKA_TALK_SEGMENTS: DhakaTalkSegment[] = [
  {
    segmentTitleBn: 'ঢাকা লাইভ আড্ডা · আরজে রাহাত',
    callerTagBn: 'স্টুডিও সরাসরি',
    spokenLineBn:
      'আসসালামু আলাইকুম ঢাকা! শুনছেন ৯৮.৪ ঢাকা এফএম। রাস্তায় এখন দারুণ রোদ-বাতাস, রিকশা নিয়ে সাবধানে চলুন আর আমাদের সাথেই থাকুন!',
    tickerLineBn: 'RJ রাহাত: "রিকশা নিয়ে সাবধানে চলুন, শুনছেন ৯৮.৪ ঢাকা এফএম লাইভ!"',
    voicePitch: 1.0,
    voiceRate: 1.05,
  },
  {
    segmentTitleBn: 'লাইভ ট্রাফিক বুলেটিন',
    callerTagBn: 'নিউ মার্কেট — সায়েন্স ল্যাব',
    spokenLineBn:
      'তাজা ট্রাফিক খবর: নিউ মার্কেট গেট নং এক থেকে নীলক্ষেত মোড় পর্যন্ত রিকশা ও বাসের বেশ চাপ আছে। ফুটপাত ঘেঁষে বেল বাজিয়ে এগোন!',
    tickerLineBn: 'ট্রাফিক ডেস্ক: নিউ মার্কেট – নীলক্ষেত – বাটা সিগন্যাল রোডে চাপ, বেল বাজিয়ে এগোন।',
    voicePitch: 1.08,
    voiceRate: 1.12,
  },
  {
    segmentTitleBn: 'কলার লাইন: মিরপুর থেকে তানভীর',
    callerTagBn: 'ফোন ইন · +880-17XX',
    spokenLineBn:
      'হ্যালো রাহাত ভাই, আমি মিরপুর দশ থেকে তানভীর বলছি! মেট্রোর নিচ দিয়ে আসার সময় যে কী সুন্দর বাতাস, খালি বাসগুলো একটু বেশিই হর্ন দেয় ভাই!',
    tickerLineBn: 'কলার তানভীর (মিরপুর-১০): "মেট্রো লাইনের নিচে দারুণ বাতাস, তবে বাসের হর্ন থেকে সাবধান!"',
    voicePitch: 0.9,
    voiceRate: 1.02,
    hasPhoneRing: true,
  },
  {
    segmentTitleBn: 'পুরান ঢাকা খাবারের আড্ডা',
    callerTagBn: 'বিতর্ক: কাচ্চি বনাম মালাই চা',
    spokenLineBn:
      'আরজে তাসনিম বলছি! আজকের প্রশ্ন: রাস্তায় ড্রাইভিংয়ের ফাঁকে এক কাপ গরম মালাই চা সেরা, নাকি চকবাজারের কাচ্চি বিরিয়ানি? আমাদের জানান!',
    tickerLineBn: 'RJ তাসনিম: "চায়ের টংয়ের গরম মালাই চা নাকি পুরান ঢাকার কাচ্চি — আপনার পছন্দ কী?"',
    voicePitch: 1.18,
    voiceRate: 1.06,
  },
  {
    segmentTitleBn: 'কলার লাইন: ধানমন্ডি থেকে শামীম',
    callerTagBn: 'ফোন ইন · গাউছিয়া মোড়',
    spokenLineBn:
      'ভাই গাউছিয়া মার্কেটের সামনে আজকে প্রচুর মানুষ! আর রিকশাচালক ভাইয়েরা তো দেখলাম দারুণ দক্ষতায় সিএনজির ফাঁক দিয়ে বেরিয়ে যাচ্ছেন!',
    tickerLineBn: 'কলার শামীম (গাউছিয়া): "মার্কেটের সামনে প্রচুর ভিড়, রিকশা ড্রিফট করে বেরোচ্ছে সবাই!"',
    voicePitch: 0.94,
    voiceRate: 1.08,
    hasPhoneRing: true,
  },
  {
    segmentTitleBn: 'নব্বই দশকের ঢাকার স্মৃতি',
    callerTagBn: 'রাস্তার গল্প ও সুর',
    spokenLineBn:
      'মনে পড়ে সেই পুরোনো দিনের কথা? বিকেল বেলা চায়ের দোকানে রেডিও বাজত আর রাস্তায় ক্রিং ক্রিং বেল বাজিয়ে রিকশা ছুটে যেত!',
    tickerLineBn: 'RJ রাহাত: "চায়ের দোকানের রেডিও আর ক্রিং ক্রিং বেল — আসল ঢাকার প্রাণ!"',
    voicePitch: 1.02,
    voiceRate: 1.0,
  },
];

export class DhakaRadioEngine {
  private ctx: AudioContext | null = null;
  private radioMasterGain: GainNode | null = null;
  private bedFilter: BiquadFilterNode | null = null;
  private noiseFloorGain: GainNode | null = null;
  private noiseFloorSource: AudioBufferSourceNode | null = null;

  private stationId: DhakaRadioStationId = '88.8';
  private volume = 0.45;
  private muted = false;
  private drivingActive = false;
  private userPaused = false;
  private duckMultiplier = 1.0;
  private duckTimeoutId: number | null = null;

  private seqTimerId: number | null = null;
  private talkTimerId: number | null = null;
  private trackRotateTimerId: number | null = null;

  private classicTrackIndex = 0;
  private fusionTrackIndex = 0;
  private talkSegmentIndex = 0;
  private seqStep = 0;
  private activeChatterLine = '';

  private listeners = new Set<(snap: DhakaRadioSnapshot) => void>();

  public attachContext(ctx: AudioContext): void {
    if (this.ctx === ctx && this.radioMasterGain) return;
    this.ctx = ctx;

    // Warm FM Broadcast Signal Chain -> Filter -> Compressor -> MasterGain -> Destination
    this.bedFilter = ctx.createBiquadFilter();
    this.bedFilter.type = 'lowpass';
    this.bedFilter.frequency.setValueAtTime(5200, ctx.currentTime);
    this.bedFilter.Q.setValueAtTime(0.65, ctx.currentTime);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.setValueAtTime(-18, ctx.currentTime);
    comp.ratio.setValueAtTime(3.2, ctx.currentTime);
    comp.attack.setValueAtTime(0.01, ctx.currentTime);
    comp.release.setValueAtTime(0.22, ctx.currentTime);

    this.radioMasterGain = ctx.createGain();
    this.radioMasterGain.gain.setValueAtTime(this.computeEffectiveGain(), ctx.currentTime);

    this.bedFilter.connect(comp);
    comp.connect(this.radioMasterGain);
    this.radioMasterGain.connect(ctx.destination);

    // Subtle analog FM tape warmth floor (barely audible, adds vintage Dhaka radio aura)
    try {
      const bufSize = ctx.sampleRate * 2;
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        d[i] = (Math.random() * 2 - 1) * 0.018;
      }
      this.noiseFloorSource = ctx.createBufferSource();
      this.noiseFloorSource.buffer = noiseBuf;
      this.noiseFloorSource.loop = true;

      const hf = ctx.createBiquadFilter();
      hf.type = 'bandpass';
      hf.frequency.setValueAtTime(1900, ctx.currentTime);
      hf.Q.setValueAtTime(0.7, ctx.currentTime);

      this.noiseFloorGain = ctx.createGain();
      this.noiseFloorGain.gain.setValueAtTime(0.12, ctx.currentTime);

      this.noiseFloorSource.connect(hf);
      hf.connect(this.noiseFloorGain);
      this.noiseFloorGain.connect(this.bedFilter);
      this.noiseFloorSource.start(0);
    } catch {}
  }

  private computeEffectiveGain(): number {
    if (this.muted || this.stationId === 'OFF' || !this.drivingActive || this.userPaused) {
      return 0;
    }
    const stationScale = this.stationId === '98.4' ? 0.55 : 0.9;
    return this.volume * stationScale * this.duckMultiplier;
  }

  private syncGain(rampSec = 0.14): void {
    if (!this.ctx || !this.radioMasterGain) return;
    const now = this.ctx.currentTime;
    const target = Math.max(0.0001, this.computeEffectiveGain());
    try {
      this.radioMasterGain.gain.cancelScheduledValues(now);
      this.radioMasterGain.gain.setTargetAtTime(target, now, rampSec);
    } catch {}
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.syncGain(0.06);
    this.emitSnapshot();
  }

  public setDrivingActive(active: boolean): void {
    this.drivingActive = active;
    if (!active) {
      this.stopLoops();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else if (this.stationId !== 'OFF' && !this.userPaused) {
      this.startStationPlayback(false);
    }
    this.syncGain(0.2);
    this.emitSnapshot();
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    this.syncGain(0.08);
    this.emitSnapshot();
  }

  public cycleStation(): DhakaRadioStationId {
    const order: DhakaRadioStationId[] = ['88.8', '98.4', '101.6', 'OFF'];
    const next = order[(order.indexOf(this.stationId) + 1) % order.length];
    this.setStation(next);
    return next;
  }

  public setStation(id: DhakaRadioStationId): void {
    this.stationId = id;
    this.userPaused = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.playTuningSweep();

    if (id === 'OFF') {
      this.stopLoops();
      this.activeChatterLine = 'রেডিও বন্ধ করা হয়েছে';
    } else if (this.drivingActive) {
      this.startStationPlayback(true);
    }
    this.syncGain(0.12);
    this.emitSnapshot();
  }

  public togglePlayPause(): void {
    if (this.stationId === 'OFF') {
      this.setStation('88.8');
      return;
    }
    this.userPaused = !this.userPaused;
    if (this.userPaused) {
      this.stopLoops();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else if (this.drivingActive) {
      this.startStationPlayback(false);
    }
    this.syncGain(0.1);
    this.emitSnapshot();
  }

  public nextTrackOrSegment(): void {
    if (this.stationId === 'OFF') {
      this.setStation('88.8');
      return;
    }
    this.playTuningClick();
    if (this.stationId === '88.8') {
      this.classicTrackIndex = (this.classicTrackIndex + 1) % CLASSIC_BENGALI_TRACKS.length;
      this.seqStep = 0;
      if (this.drivingActive && !this.userPaused) {
        this.startStationPlayback(false);
      }
    } else if (this.stationId === '101.6') {
      this.fusionTrackIndex = (this.fusionTrackIndex + 1) % RICKSHAW_FUSION_TRACKS.length;
      this.seqStep = 0;
      if (this.drivingActive && !this.userPaused) {
        this.startStationPlayback(false);
      }
    } else if (this.stationId === '98.4') {
      this.triggerNextTalkSegment();
    }
    this.emitSnapshot();
  }

  /** Briefly lowers radio volume so driver voice clips ("দিপজল", "রাগ করলা?") stay crystal clear */
  public duck(durationMs = 2400): void {
    this.duckMultiplier = 0.28;
    this.syncGain(0.08);
    if (this.duckTimeoutId !== null) {
      window.clearTimeout(this.duckTimeoutId);
    }
    this.duckTimeoutId = window.setTimeout(() => {
      this.duckMultiplier = 1.0;
      this.syncGain(0.35);
      this.duckTimeoutId = null;
    }, durationMs);
  }

  public subscribe(fn: (snap: DhakaRadioSnapshot) => void): () => void {
    this.listeners.add(fn);
    fn(this.getSnapshot());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emitSnapshot(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  public getSnapshot(): DhakaRadioSnapshot {
    const playing =
      this.drivingActive && !this.userPaused && !this.muted && this.stationId !== 'OFF';

    if (this.stationId === '88.8') {
      const track = CLASSIC_BENGALI_TRACKS[this.classicTrackIndex];
      return {
        stationId: '88.8',
        frequencyLabel: '88.8 FM',
        stationNameBn: 'ঢাকা ক্লাসিক',
        modeTagBn: 'বাংলা ক্লাসিক',
        nowPlayingTitleBn: track.titleBn,
        nowPlayingSubBn: track.subtitleBn,
        liveChatterBn: `এখন বাজছে: ${track.titleBn} · ${track.subtitleBn}`,
        volume: this.volume,
        muted: this.muted,
        isPlaying: playing,
        signalStrength: 4,
      };
    }
    if (this.stationId === '98.4') {
      const seg = DHAKA_TALK_SEGMENTS[this.talkSegmentIndex];
      return {
        stationId: '98.4',
        frequencyLabel: '98.4 FM',
        stationNameBn: 'ঢাকা এফএম টক',
        modeTagBn: 'লাইভ আড্ডা',
        nowPlayingTitleBn: seg.segmentTitleBn,
        nowPlayingSubBn: seg.callerTagBn,
        liveChatterBn: this.activeChatterLine || seg.tickerLineBn,
        volume: this.volume,
        muted: this.muted,
        isPlaying: playing,
        signalStrength: 4,
      };
    }
    if (this.stationId === '101.6') {
      const track = RICKSHAW_FUSION_TRACKS[this.fusionTrackIndex];
      return {
        stationId: '101.6',
        frequencyLabel: '101.6 FM',
        stationNameBn: 'রিকশা-বিট ফিউশন',
        modeTagBn: 'ফোক ফিউশন',
        nowPlayingTitleBn: track.titleBn,
        nowPlayingSubBn: track.subtitleBn,
        liveChatterBn: `ননস্টপ: ${track.titleBn} · ${track.subtitleBn}`,
        volume: this.volume,
        muted: this.muted,
        isPlaying: playing,
        signalStrength: 4,
      };
    }
    return {
      stationId: 'OFF',
      frequencyLabel: 'OFF',
      stationNameBn: 'রেডিও বন্ধ',
      modeTagBn: 'বন্ধ',
      nowPlayingTitleBn: 'স্টেশন চালু করুন [R]',
      nowPlayingSubBn: '৮৮.৮ ক্লাসিক · ৯৮.৪ টক · ১০১.৬ ফিউশন',
      liveChatterBn: 'ঢাকা এফএম রেডিও বন্ধ আছে — [R] চাপুন',
      volume: this.volume,
      muted: this.muted,
      isPlaying: false,
      signalStrength: 0,
    };
  }

  private stopLoops(): void {
    if (this.seqTimerId !== null) {
      window.clearInterval(this.seqTimerId);
      this.seqTimerId = null;
    }
    if (this.talkTimerId !== null) {
      window.clearInterval(this.talkTimerId);
      this.talkTimerId = null;
    }
    if (this.trackRotateTimerId !== null) {
      window.clearInterval(this.trackRotateTimerId);
      this.trackRotateTimerId = null;
    }
  }

  private getCurrentTrack(): DhakaRadioTrackInfo {
    if (this.stationId === '88.8') {
      return CLASSIC_BENGALI_TRACKS[this.classicTrackIndex];
    }
    if (this.stationId === '101.6') {
      return RICKSHAW_FUSION_TRACKS[this.fusionTrackIndex];
    }
    return TALK_STUDIO_BED;
  }

  private startStationPlayback(withJingle: boolean): void {
    this.stopLoops();
    if (!this.ctx || !this.bedFilter || this.stationId === 'OFF') return;

    this.seqStep = 0;
    const track = this.getCurrentTrack();
    const stepMs = Math.round((60 / track.bpm / 4) * 1000); // 16th-note grid

    if (withJingle) {
      this.playStationJingle(this.stationId);
    }

    this.seqTimerId = window.setInterval(() => {
      if (!this.drivingActive || this.userPaused || this.muted || this.stationId === 'OFF') return;
      const activeTrack = this.getCurrentTrack();
      this.playSequencerStep(activeTrack, this.seqStep);
      this.seqStep = (this.seqStep + 1) % 32;
    }, stepMs);

    if (this.stationId === '98.4') {
      window.setTimeout(() => {
        if (this.stationId === '98.4' && this.drivingActive && !this.userPaused && !this.muted) {
          this.triggerNextTalkSegment();
        }
      }, 950);

      this.talkTimerId = window.setInterval(() => {
        if (this.stationId === '98.4' && this.drivingActive && !this.userPaused && !this.muted) {
          this.triggerNextTalkSegment();
        }
      }, 15500);
    } else {
      // Rotate tracks naturally every 36 seconds on music stations
      this.trackRotateTimerId = window.setInterval(() => {
        if (this.drivingActive && !this.userPaused && !this.muted) {
          this.nextTrackOrSegment();
        }
      }, 36000);
    }
  }

  private triggerNextTalkSegment(): void {
    this.talkSegmentIndex = (this.talkSegmentIndex + 1) % DHAKA_TALK_SEGMENTS.length;
    const seg = DHAKA_TALK_SEGMENTS[this.talkSegmentIndex];
    this.activeChatterLine = seg.tickerLineBn;

    if (seg.hasPhoneRing) {
      this.playPhoneCue();
    } else {
      this.playBroadcastChime();
    }

    // Attempt authentic SpeechSynthesis Bengali RJ voice + fallback cadence cues
    if (!this.muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(seg.spokenLineBn);
        utter.pitch = seg.voicePitch;
        utter.rate = seg.voiceRate;
        utter.volume = Math.min(1, this.volume * 1.15);
        const voices = window.speechSynthesis.getVoices();
        const bnVoice = voices.find(
          (v) => v.lang.startsWith('bn') || v.lang.toLowerCase().includes('bengali') || v.lang.includes('BD')
        );
        if (bnVoice) {
          utter.voice = bnVoice;
        }
        window.speechSynthesis.speak(utter);
      } catch {}
    }

    this.emitSnapshot();
  }

  private playTuningClick(): void {
    if (!this.ctx || !this.bedFilter || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1150, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  public playTuningSweep(): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.24);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      d[i] = (Math.random() * 2 - 1) * 0.28 * env;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(900, now);
    bpf.frequency.exponentialRampToValueAtTime(3400, now + 0.22);
    bpf.Q.setValueAtTime(3.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  private playStationJingle(id: DhakaRadioStationId): void {
    if (!this.ctx || !this.bedFilter || this.muted) return;
    const now = this.ctx.currentTime;
    const notes =
      id === '88.8'
        ? [523.25, 659.25, 783.99, 1046.5]
        : id === '98.4'
          ? [587.33, 739.99, 880, 1174.66]
          : [440, 523.25, 659.25, 880];

    notes.forEach((f, i) => {
      if (!this.ctx || !this.bedFilter) return;
      const t = now + 0.08 + i * 0.1;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(g);
      g.connect(this.bedFilter);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  private playPhoneCue(): void {
    if (!this.ctx || !this.bedFilter || this.muted) return;
    const now = this.ctx.currentTime;
    [0, 0.22].forEach((off) => {
      if (!this.ctx || !this.bedFilter) return;
      const t = now + off;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1020, t);
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(g);
      g.connect(this.bedFilter);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  private playBroadcastChime(): void {
    if (!this.ctx || !this.bedFilter || this.muted) return;
    const now = this.ctx.currentTime;
    [659.25, 987.77].forEach((f, idx) => {
      if (!this.ctx || !this.bedFilter) return;
      const t = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(g);
      g.connect(this.bedFilter);
      osc.start(t);
      osc.stop(t + 0.27);
    });
  }

  private playSequencerStep(track: DhakaRadioTrackInfo, step: number): void {
    if (!this.ctx || !this.bedFilter) return;
    const now = this.ctx.currentTime;
    const barIdx = Math.floor(step / 8) % track.chords.length;

    // 1. Warm Harmonium / Pad Chord on chord changes (every 8 steps)
    if (step % 8 === 0) {
      const chord = track.chords[barIdx];
      chord.forEach((midi) => {
        if (!this.ctx || !this.bedFilter) return;
        const osc = this.ctx.createOscillator();
        const lpf = this.ctx.createBiquadFilter();
        const g = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(midiToFreq(midi), now);

        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(950, now);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.042, now + 0.08);
        g.gain.exponentialRampToValueAtTime(0.002, now + 1.1);

        osc.connect(lpf);
        lpf.connect(g);
        g.connect(this.bedFilter);
        osc.start(now);
        osc.stop(now + 1.15);
      });
    }

    // 2. Bass / Ektara Groove
    const localStep = step % 16;
    for (const b of track.bass) {
      if (b.step === localStep) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = track.drumPattern === 'baul' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(midiToFreq(b.midi), now);
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.11, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.001, now + b.dur);
        osc.connect(g);
        g.connect(this.bedFilter);
        osc.start(now);
        osc.stop(now + b.dur + 0.03);
      }
    }

    // 3. Lead Bengali Melody Voice (Flute / Harmonium / Dotara / Brass)
    for (const m of track.melody) {
      if (m.step === step) {
        this.playLeadNote(track.leadVoice, midiToFreq(m.midi), m.dur, m.vel, now);
      }
    }

    // 4. Authentic Tabla / Dhol Percussion Groove
    this.playPercussionStep(track.drumPattern, step, now);
  }

  private playLeadNote(
    voice: DhakaRadioTrackInfo['leadVoice'],
    freq: number,
    dur: number,
    vel: number,
    now: number
  ): void {
    if (!this.ctx || !this.bedFilter) return;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    if (voice === 'flute') {
      // Soft bamboo bansuri with gentle breath vibrato
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.985, now);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.04);

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(5.4, now);
      lfoGain.gain.setValueAtTime(freq * 0.011, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + dur + 0.05);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.14 * vel, now + 0.045);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    } else if (voice === 'harmonium') {
      // Warm reed harmonium dual-detuned sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1250, now);
      filter.Q.setValueAtTime(1.4, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.11 * vel, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    } else if (voice === 'dotara') {
      // Plucked stringed Bengali dotara
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 1.01, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.03);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1650, now);
      filter.Q.setValueAtTime(1.8, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.16 * vel, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.9);
    } else {
      // Upbeat fusion organ/brass
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + dur);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.11 * vel, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    }

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.bedFilter);
    osc.start(now);
    osc.stop(now + dur + 0.04);
  }

  private playPercussionStep(
    pattern: DhakaRadioTrackInfo['drumPattern'],
    step: number,
    now: number
  ): void {
    if (!this.ctx || !this.bedFilter) return;
    const s = step % 8;

    // Tabla Bayan ("Ghe/Dha" warm low pitch bend)
    const isBayan =
      pattern === 'tintal'
        ? s === 0 || s === 4
        : pattern === 'baul'
          ? s === 0 || s === 3 || s === 6
          : s === 0 || s === 6;
    if (isBayan) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(108, now);
      osc.frequency.exponentialRampToValueAtTime(52, now + 0.14);
      g.gain.setValueAtTime(pattern === 'fusion' ? 0.16 : 0.11, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(g);
      g.connect(this.bedFilter);
      osc.start(now);
      osc.stop(now + 0.17);
    }

    // Tabla Dayan ("Na / Tin" crisp melodic rim snap)
    const isDayan =
      pattern === 'fusion'
        ? s === 2 || s === 4 || s === 7
        : s === 2 || s === 5 || s === 6;
    if (isDayan) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(s === 6 ? 330 : 280, now);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(g);
      g.connect(this.bedFilter);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }
}

export const dhakaRadio = new DhakaRadioEngine();
