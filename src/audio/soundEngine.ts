import {
  AUDIO_START_VOICE_B64,
  AUDIO_CRASH_VOICE_B64,
  AUDIO_CAUGHT_VOICE_B64,
} from './audioData';
import {
  AUDIO_DRIVING_MILON_B64,
  AUDIO_CRASH_RAG_B64,
  AUDIO_DANGER_DEW_B64,
  AUDIO_CAUGHT_VUL_B64,
  AUDIO_SELECT_GX_B64,
  AUDIO_DIPJOL_B64,
  AUDIO_HISAB_BUJHONA_B64,
} from './newAudioData';

function base64ToArrayBuffer(dataUri: string): ArrayBuffer {
  const base64 = dataUri.split(',')[1] || dataUri;
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

class SoundEngine {
  public ctx: AudioContext | null = null;
  private muted = false;
  private buffers: Record<string, AudioBuffer | null> = {
    startVoice: null,
    crashVoice: null,
    caughtVoice: null,
    drivingMilon: null,
    dangerDew: null,
    selectGx: null,
    dipjol: null,
    hisabBujhona: null,
  };
  private audioElements: Record<string, HTMLAudioElement | null> = {
    startVoice: null,
    crashVoice: null,
    caughtVoice: null,
    drivingMilon: null,
    dangerDew: null,
    selectGx: null,
    dipjol: null,
    hisabBujhona: null,
  };
  private lastCrashVoiceTime = 0;
  private lastDrivingVoiceTime = 0;
  private lastDangerDewTime = 0;
  private lastDipjolTime = 0;
  private hasPlayedSelectVoice = false;
  private isUnlocked = false;
  private rainGainNode: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.preloadAllAudio();
      this.attachGlobalUnlocker();
    }
  }

  public init(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.decodePendingBuffers();
  }

  private attachGlobalUnlocker(): void {
    const unlock = () => {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.isUnlocked = true;
          this.decodePendingBuffers();
        }).catch(() => {});
      } else if (this.ctx && this.ctx.state === 'running') {
        this.isUnlocked = true;
        this.decodePendingBuffers();
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
  }

  private preloadAllAudio(): void {
    const soundDataMap: Record<string, string> = {
      startVoice: AUDIO_START_VOICE_B64,
      crashVoice: AUDIO_CRASH_RAG_B64,
      caughtVoice: AUDIO_CAUGHT_VUL_B64,
      drivingMilon: AUDIO_DRIVING_MILON_B64,
      dangerDew: AUDIO_DANGER_DEW_B64,
      selectGx: AUDIO_SELECT_GX_B64,
      dipjol: AUDIO_DIPJOL_B64,
      hisabBujhona: AUDIO_HISAB_BUJHONA_B64,
    };

    // 1. Instant HTML5 Audio instances from inlined Base64 (zero network fetch!)
    Object.entries(soundDataMap).forEach(([key, b64]) => {
      try {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = b64;
        audio.load();
        this.audioElements[key] = audio;
      } catch {}
    });

    // 2. Schedule Web Audio decode in memory
    this.decodePendingBuffers();
  }

  private decodePendingBuffers(): void {
    if (!this.ctx) return;
    const soundDataMap: Record<string, string> = {
      startVoice: AUDIO_START_VOICE_B64,
      crashVoice: AUDIO_CRASH_RAG_B64,
      caughtVoice: AUDIO_CAUGHT_VUL_B64,
      drivingMilon: AUDIO_DRIVING_MILON_B64,
      dangerDew: AUDIO_DANGER_DEW_B64,
      selectGx: AUDIO_SELECT_GX_B64,
      dipjol: AUDIO_DIPJOL_B64,
      hisabBujhona: AUDIO_HISAB_BUJHONA_B64,
    };

    Object.entries(soundDataMap).forEach(([key, b64]) => {
      if (this.buffers[key] || !this.ctx) return;
      try {
        const arrayBuf = base64ToArrayBuffer(b64);
        this.ctx.decodeAudioData(
          arrayBuf,
          (decoded) => {
            this.buffers[key] = decoded;
          },
          () => {
            // Fallback to HTML5 audio element
          }
        );
      } catch {}
    });
  }

  private activeSources: Record<string, AudioBufferSourceNode | null> = {
    startVoice: null,
    crashVoice: null,
    caughtVoice: null,
    drivingMilon: null,
    dangerDew: null,
    selectGx: null,
    dipjol: null,
    hisabBujhona: null,
  };

  private playBufferOrElement(key: string, volume = 1.0): void {
    if (this.muted) return;
    this.init();

    // 1. Play with Web Audio if decoded buffer is available
    let playedWithWebAudio = false;
    if (this.ctx && this.buffers[key]) {
      try {
        if (this.activeSources[key]) {
          try {
            this.activeSources[key]?.stop();
          } catch {}
          this.activeSources[key] = null;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[key];
        const gainNode = this.ctx.createGain();
        const boost = 1.35;
        gainNode.gain.setValueAtTime(Math.min(2.0, volume * boost), this.ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start(0);
        this.activeSources[key] = source;
        source.onended = () => {
          if (this.activeSources[key] === source) {
            this.activeSources[key] = null;
          }
        };
        playedWithWebAudio = true;
      } catch {
        playedWithWebAudio = false;
      }
    }

    // 2. Play with HTMLAudioElement (ensures sound plays in all scenarios)
    const el = this.audioElements[key];
    if (el) {
      try {
        el.volume = volume;
        el.currentTime = 0;
        const playPromise = el.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } catch {}
    }
  }


  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      Object.keys(this.activeSources).forEach((k) => {
        if (this.activeSources[k]) {
          try {
            this.activeSources[k]?.stop();
          } catch {}
          this.activeSources[k] = null;
        }
      });
      Object.values(this.audioElements).forEach((el) => {
        if (el) {
          el.pause();
          el.currentTime = 0;
        }
      });
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (this.ambientGainNode && this.ctx) {
        this.ambientGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      if (this.rainGainNode && this.ctx) {
        this.rainGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } else {
      if (this.ambientGainNode && this.ctx) {
        this.ambientGainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);
      }
      if (this.rainGainNode && this.ctx) {
        this.rainGainNode.gain.setValueAtTime(0.24, this.ctx.currentTime);
      }
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Plays "গরীবেরা ভালো আছো?" at game start */
  public playGameStartVoice(): void {
    this.playBufferOrElement('startVoice', 1.0);
  }

  /** Plays "এই তোমরা কেমন আছো - হেলিকপ্টার মিলন" while cruising/driving on the road */
  public playDrivingMilonVoice(): void {
    const now = Date.now();
    if (now - this.lastDrivingVoiceTime < 16000) return;
    this.lastDrivingVoiceTime = now;
    this.playBufferOrElement('drivingMilon', 0.95);
  }

  /** Plays "রাগ করলা?" on collisions with vehicles, stalls, or road barriers */
  public playCrashVoice(): void {
    const now = Date.now();
    if (now - this.lastCrashVoiceTime < 1200) return;
    this.lastCrashVoiceTime = now;
    this.playBufferOrElement('crashVoice', 1.0);
  }

  public playCrashRagVoice(): void {
    this.playCrashVoice();
  }

  /** Plays "মাউন্টেন ডিউ ভাইয়ের গলা মারি" before being caught by the mob */
  public playDangerDewVoice(): void {
    const now = Date.now();
    if (now - this.lastDangerDewTime < 9000) return;
    this.lastDangerDewTime = now;
    this.playBufferOrElement('dangerDew', 1.0);
  }

  /** Plays "আমার ভুল হয়েছে ক্ষমা করে দেন" when caught by crowd / Game Over */
  public playCaughtVoice(): void {
    this.playBufferOrElement('caughtVoice', 1.0);
  }

  public playCaughtVulVoice(): void {
    this.playCaughtVoice();
  }

  /** Plays "হিসাব বোঝ না?" during player selection - plays once ("ek bari cholbe") */
  public playSelectGxVoice(force = false): void {
    if (this.hasPlayedSelectVoice && !force) return;
    this.hasPlayedSelectVoice = true;
    this.playBufferOrElement('hisabBujhona', 1.0);
  }

  public playHisabBujhonaVoice(force = false): void {
    this.playSelectGxVoice(force);
  }

  /** Reset selection voice flag when returning to character menu */
  public resetSelectVoiceFlag(): void {
    this.hasPlayedSelectVoice = false;
  }

  /** Synthesized continuous Dhaka monsoon rain audio */
  public startRainSound(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    if (this.rainSource) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.42;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.24, this.ctx.currentTime + 1.2);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start();

      this.rainSource = whiteNoise;
      this.rainGainNode = gain;
    } catch {}
  }

  public stopRainSound(): void {
    if (this.rainGainNode && this.ctx) {
      try {
        this.rainGainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        setTimeout(() => {
          try {
            this.rainSource?.stop();
          } catch {}
          this.rainSource = null;
          this.rainGainNode = null;
        }, 900);
      } catch {
        this.rainSource = null;
        this.rainGainNode = null;
      }
    }
  }

  /** Deep rumble of Dhaka monsoon thunder */
  public playThunder(): void {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 1.6);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.85);
    } catch {}
  }

  /** Plays "দিপজল" when hitting pedestrians/mobs and after vehicle start */
  public playDipjolVoice(): void {
    const now = Date.now();
    if (now - this.lastDipjolTime < 1300) return;
    this.lastDipjolTime = now;
    this.playBufferOrElement('dipjol', 1.0);
  }

  /** Stop caught audio on restart or return to menu */
  public stopCaughtVoice(): void {
    if (this.activeSources['caughtVoice']) {
      try {
        this.activeSources['caughtVoice']?.stop();
      } catch {}
      this.activeSources['caughtVoice'] = null;
    }
    const el = this.audioElements['caughtVoice'];
    if (el) {
      try {
        el.pause();
        el.currentTime = 0;
      } catch {}
    }
  }

  /** Authentic twin-ring metallic Bangladeshi rickshaw bell ("Kring-Kring!") */
  public playBell(): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const ringStrike = (offset: number, baseFreq: number) => {
      if (!this.ctx) return;
      const t = now + offset;
      const freqs = [baseFreq, baseFreq * 2.01, baseFreq * 3.02, baseFreq * 4.2];
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 0.97, t + 0.38);

        const amp = idx === 0 ? 0.32 : 0.14 / idx;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(amp, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.42);
      });
    };

    ringStrike(0, 1720);
    ringStrike(0.12, 1860);
  }

  /** Dhaka Bus / Traffic Hydraulic Horn ("Pään-Pään!") */
  public playTrafficHorn(isBus = false): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const baseFreq = isBus ? 230 : 380;
    const duration = isBus ? 0.32 : 0.18;

    [baseFreq, baseFreq * 1.25].forEach((f) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 0.98, now + duration);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isBus ? 900 : 1600, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    });
  }

  /** Vegetable Stall smash squish & wood crack! */
  public playVeggieSmash(): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 1.4);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(180, now + 0.28);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    [240, 180, 120].forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const t = now + i * 0.04;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.4, t + 0.15);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  /** Stall wood/tin crash + cash chime */
  public playSmash(combo: number): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.26);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 1.8);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.38, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);

    const pitchBoost = Math.min(combo - 1, 8) * 50;
    const notes = [659.25 + pitchBoost, 880 + pitchBoost, 1318.51 + pitchBoost];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + 0.03 + i * 0.055;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  /** Wanted whistle / siren */
  public playWantedUp(level: number): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    const base = 480 + level * 60;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 1.5, now + 0.16);
    osc.frequency.linearRampToValueAtTime(base * 1.1, now + 0.3);
    osc.frequency.linearRampToValueAtTime(base * 1.7, now + 0.48);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.54);
  }

  /** Authentic Dhaka Traffic Police Pea-Whistle ("ট্রাফিক পুলিশের বাঁশি - টিঁইইট টিঁইইট!") */
  public playTrafficWhistle(): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    // Two quick bursts of traffic whistle
    [0, 0.22].forEach((offset) => {
      if (!this.ctx) return;
      const t = now + offset;
      const duration = 0.16;

      // Dual tones of metal pea whistle
      [2480, 2820].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const tremolo = this.ctx.createOscillator();
        const tremoloGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        // 28 Hz rapid flutter of pea in whistle
        tremolo.frequency.setValueAtTime(28, t);
        tremoloGain.gain.setValueAtTime(140, t);
        tremolo.connect(tremoloGain);
        tremoloGain.connect(osc.frequency);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
        gain.gain.setValueAtTime(0.24, t + duration - 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        tremolo.start(t);
        osc.start(t);
        tremolo.stop(t + duration);
        osc.stop(t + duration);
      });
    });
  }

  /** Traffic signal compliance reward chime ("সিগন্যাল মেনে চলায় রিওয়ার্ড চিম") */
  public playTrafficComplianceChime(): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.48);
    });
  }

  /** Pickup SFX */
  public playPickup(kind: 'heal' | 'turbo'): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const freqs =
      kind === 'heal' ? [523.25, 659.25, 783.99, 1046.5] : [349.23, 440, 698.46, 880, 1396.91];
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.045;
      osc.type = kind === 'heal' ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  /** Collision impact thud */
  public playHit(): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.22);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Game over descending chords */
  public playGameOver(): void {
    this.init();
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 293.66, 220];
    notes.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.14;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  /* -------------------------------------------------------------
   * DHAKA CITY AMBIENCE & BACKGROUND TRAFFIC RADIO (এফএম ৯৮.৪)
   * ------------------------------------------------------------- */
  private radioStation: 'FM_98_4' | 'FOLK' | 'OFF' = 'FM_98_4';
  private radioTimerId: number | null = null;
  private folkTimerId: number | null = null;
  private ambientNoiseSource: AudioBufferSourceNode | null = null;
  private ambientGainNode: GainNode | null = null;
  private ambientHumOsc: OscillatorNode | null = null;
  private lastBulletinIndex = 0;

  private static TRAFFIC_BULLETINS: string[] = [
    'শ্রোতা বন্ধুরা! ৯৮.৪ ঢাকা এফএম ট্রাফিক বুলেটিন: সদরঘাট টু পল্টন মোড়ে তীব্র যানজট! রিকশা চালকদের মগবাজার ফ্লাইওভার ব্যবহারের অনুরোধ করা হচ্ছে।',
    'লাইভ ঢাকা ট্রাফিক: মহাখালী ও ফার্মগেট সিগন্যালে সিএনজি ও রিকশার হুটোপুটি! ডানে বামে সাবধানে মোড় নিন।',
    'জরুরি ট্রাফিক সতর্কতা: গুলিস্তান-মতিঝিল রুটে দূরপাল্লার বাস আটকে আছে! গতি নিয়ন্ত্রণে রাখুন।',
    'কাওরান বাজার সবজির আড়তের সামনে মালামাল ওঠানামার কারণে ধীরগতি! সাবধানে ওভারটেক করুন।',
    'বিজয় সরণি ও মিরপুর রোডে যানবাহনের দীর্ঘ সারি! ক্রিং ক্রিং বেল বাজিয়ে সতর্কভাবে চালান।'
  ];

  /** Starts the authentic Dhaka street ambience (generator hum + low distant traffic rumble) */
  public startAmbience(): void {
    this.init();
    if (!this.ctx || this.muted || this.ambientGainNode) return;

    try {
      // 1. Ambient low-frequency city traffic drone (pink/brown noise filtered)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.06;
      }

      this.ambientNoiseSource = this.ctx.createBufferSource();
      this.ambientNoiseSource.buffer = noiseBuffer;
      this.ambientNoiseSource.loop = true;

      // Filter: warm city rumble under 220Hz
      const rumbleFilter = this.ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

      // Low street generator hum (50Hz typical of Dhaka street generators)
      this.ambientHumOsc = this.ctx.createOscillator();
      this.ambientHumOsc.type = 'sine';
      this.ambientHumOsc.frequency.setValueAtTime(50, this.ctx.currentTime);

      const humGain = this.ctx.createGain();
      humGain.gain.setValueAtTime(0.045, this.ctx.currentTime);
      this.ambientHumOsc.connect(humGain);

      this.ambientGainNode = this.ctx.createGain();
      this.ambientGainNode.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.ambientNoiseSource.connect(rumbleFilter);
      rumbleFilter.connect(this.ambientGainNode);
      humGain.connect(this.ambientGainNode);

      this.ambientGainNode.connect(this.ctx.destination);

      this.ambientNoiseSource.start(0);
      this.ambientHumOsc.start(0);

      this.scheduleRadioCycle();
    } catch {}
  }

  /** Stops background city ambience */
  public stopAmbience(): void {
    if (this.ambientGainNode && this.ctx) {
      try {
        this.ambientGainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      } catch {}
    }
    window.setTimeout(() => {
      try {
        this.ambientNoiseSource?.stop();
        this.ambientHumOsc?.stop();
      } catch {}
      this.ambientNoiseSource = null;
      this.ambientHumOsc = null;
      this.ambientGainNode = null;
    }, 350);

    if (this.radioTimerId) {
      window.clearInterval(this.radioTimerId);
      this.radioTimerId = null;
    }
    if (this.folkTimerId) {
      window.clearInterval(this.folkTimerId);
      this.folkTimerId = null;
    }
  }

  /** Schedules periodic live traffic radio bulletins or folk beat grooves */
  private scheduleRadioCycle(): void {
    if (this.radioTimerId) window.clearInterval(this.radioTimerId);
    if (this.folkTimerId) window.clearInterval(this.folkTimerId);

    if (this.radioStation === 'FM_98_4') {
      // First announcement after 4 seconds, then every 24 seconds
      window.setTimeout(() => {
        if (this.radioStation === 'FM_98_4' && !this.muted) {
          this.broadcastDhakaTrafficUpdate();
        }
      }, 4000);

      this.radioTimerId = window.setInterval(() => {
        if (this.radioStation === 'FM_98_4' && !this.muted) {
          this.broadcastDhakaTrafficUpdate();
        }
      }, 26000);
    } else if (this.radioStation === 'FOLK') {
      let step = 0;
      this.folkTimerId = window.setInterval(() => {
        if (this.radioStation === 'FOLK' && !this.muted) {
          this.playProceduralFolkRhythm(step++);
        }
      }, 340);
    }
  }

  /** Plays FM radio tuner static crackle burst */
  public playRadioStaticBurst(): void {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.18);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.3;

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(2400, now);
    bpf.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    src.connect(bpf);
    bpf.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(now);
  }

  /** Plays iconic retro FM radio jingle chime (C5 - G5 - E5 - C6) */
  public playRadioJingle(): void {
    this.init();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const jingleNotes = [523.25, 783.99, 659.25, 1046.5]; // C5, G5, E5, C6
    jingleNotes.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  /** Broadcasts a live Dhaka traffic update */
  public broadcastDhakaTrafficUpdate(): void {
    if (this.muted || this.radioStation !== 'FM_98_4') return;
    this.playRadioStaticBurst();
    this.playRadioJingle();

    const bulletin = SoundEngine.TRAFFIC_BULLETINS[this.lastBulletinIndex % SoundEngine.TRAFFIC_BULLETINS.length];
    this.lastBulletinIndex++;

    // Try SpeechSynthesis if supported in browser with Bengali voice or standard speaker
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(bulletin);
        utter.rate = 1.12;
        utter.pitch = 1.05;
        utter.volume = this.muted ? 0 : 0.85;

        // Try to select Bengali voice if available on system
        const voices = window.speechSynthesis.getVoices();
        const bnVoice = voices.find((v) => v.lang.startsWith('bn') || v.lang.includes('BD'));
        if (bnVoice) {
          utter.voice = bnVoice;
        }
        window.speechSynthesis.speak(utter);
      } catch {}
    }
  }

  /** Procedural Bangladeshi folk rhythm loop (Dotara plucks + Tabla bols) */
  private playProceduralFolkRhythm(step: number): void {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const isTablaDownbeat = step % 4 === 0;
    const isTablaUpbeat = step % 2 === 1;

    // Tabla Dagga / Bayan bass thud
    if (isTablaDownbeat) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }

    // Tabla Dayan crisp rim snap (টিন/না)
    if (isTablaUpbeat) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }

    // Dotara pluck melody
    const dotaraNotes = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const noteIdx = (step * 2 + (step % 3)) % dotaraNotes.length;
    const oscD = this.ctx.createOscillator();
    const gainD = this.ctx.createGain();
    oscD.type = 'sawtooth';
    oscD.frequency.setValueAtTime(dotaraNotes[noteIdx], now);

    const bpf = this.ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.setValueAtTime(1400, now);
    bpf.Q.setValueAtTime(3.0, now);

    gainD.gain.setValueAtTime(0.08, now);
    gainD.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    oscD.connect(bpf);
    bpf.connect(gainD);
    gainD.connect(this.ctx.destination);
    oscD.start(now);
    oscD.stop(now + 0.16);
  }

  /** Switches between Radio Stations */
  public toggleRadio(): 'FM_98_4' | 'FOLK' | 'OFF' {
    if (this.radioStation === 'FM_98_4') {
      this.radioStation = 'FOLK';
    } else if (this.radioStation === 'FOLK') {
      this.radioStation = 'OFF';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      this.radioStation = 'FM_98_4';
    }

    this.playRadioStaticBurst();
    this.scheduleRadioCycle();
    return this.radioStation;
  }

  public setRadioStation(station: 'FM_98_4' | 'FOLK' | 'OFF'): void {
    this.radioStation = station;
    this.playRadioStaticBurst();
    this.scheduleRadioCycle();
  }

  public getRadioStation(): 'FM_98_4' | 'FOLK' | 'OFF' {
    return this.radioStation;
  }

  public getRadioStationLabel(): string {
    if (this.radioStation === 'FM_98_4') return 'ঢাকা এফএম ৯৮.৪ [ট্রাফিক]';
    if (this.radioStation === 'FOLK') return 'পুরান ঢাকা সুর [ফোক]';
    return 'রেডিও বন্ধ';
  }
}

export const soundEngine = new SoundEngine();
