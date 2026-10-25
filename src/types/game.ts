export enum GamePhase {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export enum CameraMode {
  CHASE = 'CHASE',
  ACTION = 'ACTION',
  DRIVER = 'DRIVER',
}

export enum TimeOfDay {
  DUSK = 'DUSK',
  NIGHT = 'NIGHT',
  NOON = 'NOON',
}

export type DriverId = 'kader' | 'ishrak';

export interface DriverProfile {
  id: DriverId;
  nameBn: string;
  subtitleBn: string;
  perkBn: string;
  avatarUrl?: string;
  panjabiColor: number;
  vestColor: number;
  hasSunglasses: boolean;
  hasBeard: boolean;
  topSpeedBonus: number;
  steerResponseBonus: number;
  bellRadiusBonus: number;
}

export const DRIVER_PROFILES: Record<DriverId, DriverProfile> = {
  kader: {
    id: 'kader',
    nameBn: 'ওবায়দুল কাদের',
    subtitleBn: 'সাদা পাঞ্জাবি, মুজিব কোট ও কালো চশমা',
    perkBn: 'ভিআইপি বেল শকওয়েভ (+৩০% রেঞ্জ)',
    avatarUrl: '/assets/aistudio/WhatsApp_Image_2026-10-25_at_1.33.47_PM_72f9cad8.jpeg',
    panjabiColor: 0xf8fafc,
    vestColor: 0x1e293b,
    hasSunglasses: true,
    hasBeard: false,
    topSpeedBonus: 1.0,
    steerResponseBonus: 1.0,
    bellRadiusBonus: 1.35,
  },
  ishrak: {
    id: 'ishrak',
    nameBn: 'ইশরাক',
    subtitleBn: 'গাঢ় নীল পাঞ্জাবি ও আধুনিক ড্রিফট লুক',
    perkBn: 'টার্বো স্পিড ও শার্প ড্রিফট (+১৫%)',
    panjabiColor: 0x1d4ed8,
    vestColor: 0x0f172a,
    hasSunglasses: false,
    hasBeard: true,
    topSpeedBonus: 1.15,
    steerResponseBonus: 1.2,
    bellRadiusBonus: 1.0,
  },
};

export interface HudSnapshot {
  money: number;
  highScore: number;
  health: number;
  wantedLevel: number;
  speedKmh: number;
  combo: number;
  comboTimerRatio: number;
  stallsSmashed: number;
  distanceMeters: number;
  bellCooldownRatio: number;
  turboRemainingRatio: number;
  activeMobCount: number;
  trafficCount: number;
}

export interface ScreenPopup {
  id: number;
  text: string;
  subtext?: string;
  tone: 'cash' | 'heal' | 'turbo' | 'warning' | 'bell' | 'veggie';
  xPercent: number;
  yPercent: number;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
}
