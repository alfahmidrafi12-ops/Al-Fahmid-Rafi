import {
  AUDIO_START_VOICE_B64,
  AUDIO_CRASH_VOICE_B64,
  AUDIO_CAUGHT_VOICE_B64,
} from './audioData';

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
  };
  private audioElements: Record<string, HTMLAudioElement | null> = {
    startVoice: null,
    crashVoice: null,
    caughtVoice: null,
  };
  private lastCrashVoiceTime = 0;
  private isUnlocked = false;

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
      crashVoice: AUDIO_CRASH_VOICE_B64,
      caughtVoice: AUDIO_CAUGHT_VOICE_B64,
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
      crashVoice: AUDIO_CRASH_VOICE_B64,
      caughtVoice: AUDIO_CAUGHT_VOICE_B64,
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
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
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
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Plays "গরীবেরা ভালো আছো?" at game start */
  public playGameStartVoice(): void {
    this.playBufferOrElement('startVoice', 1.0);
  }

  /** Plays "ও কি লাগছে!" on collisions / crashes */
  public playCrashVoice(): void {
    const now = Date.now();
    if (now - this.lastCrashVoiceTime < 1000) return;
    this.lastCrashVoiceTime = now;
    this.playBufferOrElement('crashVoice', 1.0);
  }

  /** Plays crowd shouting dialogue when rickshaw gets caught (Game Over) */
  public playCaughtVoice(): void {
    this.playBufferOrElement('caughtVoice', 1.0);
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
}

export const soundEngine = new SoundEngine();
