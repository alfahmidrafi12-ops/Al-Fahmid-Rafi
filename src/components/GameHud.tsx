import React, { useEffect, useState } from 'react';
import {
  Bell,
  Camera,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Moon,
  Pause,
  Sun,
  Sunset,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  CameraMode,
  DRIVER_PROFILES,
  DriverId,
  HudSnapshot,
  InputState,
  ScreenPopup,
  TimeOfDay,
} from '../types/game';

interface GameHudProps {
  hud: HudSnapshot;
  driverId: DriverId;
  cameraMode: CameraMode;
  onChangeCamera: (mode: CameraMode) => void;
  timeOfDay: TimeOfDay;
  onChangeTimeOfDay: (tod: TimeOfDay) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onRingBell: () => void;
  onPause: () => void;
  onTouchInput: (partial: Partial<InputState>) => void;
  popups: ScreenPopup[];
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  driverId,
  cameraMode,
  onChangeCamera,
  timeOfDay,
  onChangeTimeOfDay,
  isMuted,
  onToggleMute,
  onRingBell,
  onPause,
  onTouchInput,
  popups,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [touchPadEnabled, setTouchPadEnabled] = useState(false);

  useEffect(() => {
    const isCoarse =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    if (isCoarse) {
      setTouchPadEnabled(true);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h' && !e.repeat) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const driver = DRIVER_PROFILES[driverId];
  const bellReady = hud.bellCooldownRatio >= 0.99;

  const healthLabel =
    hud.health > 60 ? 'মজবুত' : hud.health > 30 ? 'ক্ষতিগ্রস্ত' : 'বিপজ্জনক';
  const healthBarColor =
    hud.health > 60
      ? 'bg-emerald-500'
      : hud.health > 30
        ? 'bg-amber-500'
        : 'bg-rose-500';

  const renderWantedStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const active = i <= hud.wantedLevel;
      stars.push(
        <span
          key={i}
          className={active ? 'text-rose-500' : 'text-zinc-600'}
          aria-hidden="true"
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* Floating Action / Reward Popups */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {popups.map((p) => {
          const toneClasses =
            p.tone === 'veggie'
              ? 'text-emerald-300 border-purple-500/50 bg-purple-950/90'
              : p.tone === 'cash'
                ? 'text-emerald-300 border-emerald-500/40 bg-zinc-950/90'
                : p.tone === 'heal'
                  ? 'text-teal-300 border-teal-400/40 bg-zinc-950/90'
                  : p.tone === 'turbo'
                    ? 'text-amber-300 border-amber-400/50 bg-zinc-950/90'
                    : p.tone === 'bell'
                      ? 'text-yellow-200 border-yellow-400/50 bg-zinc-950/90'
                      : 'text-rose-300 border-rose-500/50 bg-zinc-950/90';

          return (
            <div
              key={p.id}
              style={{ left: `${p.xPercent}%`, top: `${p.yPercent}%` }}
              className={`animate-popup absolute rounded-lg border px-3.5 py-1.5 text-center shadow-lg ${toneClasses}`}
            >
              <div className="font-display-num text-sm font-bold sm:text-base whitespace-nowrap">
                {p.text}
              </div>
              {p.subtext && (
                <div className="text-[11px] text-zinc-300 whitespace-nowrap">{p.subtext}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Top HUD */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Cash, Combo & Health */}
        <div className="pointer-events-auto rounded-xl border border-white/14 bg-zinc-950/90 px-4 py-3 shadow-lg">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display-num text-2xl font-bold text-emerald-400 sm:text-3xl">
              ৳{hud.money.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-semibold text-zinc-400">BDT</span>
            {hud.combo > 1 && (
              <span className="font-display-num text-sm font-bold text-amber-400">
                · {hud.combo}x কম্বো
              </span>
            )}
          </div>

          {hud.combo > 0 && (
            <div className="mt-1.5 h-1 w-44 overflow-hidden rounded-full bg-zinc-800 sm:w-52">
              <div
                className="h-full bg-amber-400 transition-transform duration-75 origin-left"
                style={{ transform: `scaleX(${hud.comboTimerRatio})` }}
              />
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-zinc-300">
            <span>রিকশা: {healthLabel}</span>
            <span className="font-display-num font-semibold">{hud.health}%</span>
          </div>
          <div className="mt-1 h-2.5 w-44 overflow-hidden rounded-full border border-white/15 bg-zinc-900 sm:w-52">
            <div
              className={`h-full ${healthBarColor} transition-transform duration-150 origin-left`}
              style={{ transform: `scaleX(${Math.max(0, hud.health) / 100})` }}
            />
          </div>

          {hud.turboRemainingRatio > 0 && (
            <div className="mt-2 text-xs font-semibold text-amber-400">
              মালাই চা টার্বো শিল্ড ({Math.ceil(hud.turboRemainingRatio * 4.5)}s)
            </div>
          )}
        </div>

        {/* Right: Wanted Stars, Speed, Traffic & Pause */}
        <div className="pointer-events-auto flex items-start gap-2">
          <div className="rounded-xl border border-white/14 bg-zinc-950/90 px-4 py-3 text-right shadow-lg">
            <div
              className="text-xl leading-none tracking-wider sm:text-2xl"
              aria-label={`ওয়ান্টেড লেভেল ${hud.wantedLevel} স্টার`}
            >
              {renderWantedStars()}
            </div>
            <div className="mt-1.5 text-xs text-zinc-300">
              <span>{driver.nameBn}</span>
              <span className="mx-1.5 text-zinc-500">·</span>
              <span className="font-display-num font-bold text-amber-300">
                {hud.speedKmh} km/h
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-400">
              <span>দোকান: </span>
              <span className="font-display-num text-zinc-200">{hud.stallsSmashed}</span>
              <span className="mx-1.5 text-zinc-600">·</span>
              <span>ট্রাফিক: </span>
              <span className="font-display-num text-zinc-200">{hud.trafficCount}</span>
              <span className="mx-1.5 text-zinc-600">·</span>
              <span>জনতা: </span>
              <span className="font-display-num text-zinc-200">{hud.activeMobCount}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onPause}
            aria-label="গেম পজ করুন"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/14 bg-zinc-950/90 text-zinc-200 shadow-lg hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <Pause className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* On-Screen Touch Controls */}
      {touchPadEnabled && (
        <div className="pointer-events-none mb-14 flex items-end justify-between gap-4 px-1 sm:mb-16">
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              onPointerDown={() => onTouchInput({ left: true })}
              onPointerUp={() => onTouchInput({ left: false })}
              onPointerLeave={() => onTouchInput({ left: false })}
              onPointerCancel={() => onTouchInput({ left: false })}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-zinc-950/90 text-xl font-bold text-white active:bg-amber-500 active:text-zinc-950 select-none"
            >
              ◀
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchInput({ right: true })}
              onPointerUp={() => onTouchInput({ right: false })}
              onPointerLeave={() => onTouchInput({ right: false })}
              onPointerCancel={() => onTouchInput({ right: false })}
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-zinc-950/90 text-xl font-bold text-white active:bg-amber-500 active:text-zinc-950 select-none"
            >
              ▶
            </button>
          </div>

          <div className="pointer-events-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRingBell}
              className={`flex h-14 w-14 flex-col items-center justify-center rounded-2xl border text-xs font-bold select-none ${
                bellReady
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 active:bg-amber-500 active:text-zinc-950'
                  : 'border-white/15 bg-zinc-950/85 text-zinc-400'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span className="mt-0.5">বেল</span>
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchInput({ backward: true })}
              onPointerUp={() => onTouchInput({ backward: false })}
              onPointerLeave={() => onTouchInput({ backward: false })}
              onPointerCancel={() => onTouchInput({ backward: false })}
              className="flex h-14 px-4 items-center justify-center rounded-2xl border border-white/20 bg-zinc-950/90 text-xs font-bold text-rose-300 active:bg-rose-500 active:text-white select-none"
            >
              ব্রেক
            </button>
            <button
              type="button"
              onPointerDown={() => onTouchInput({ forward: true })}
              onPointerUp={() => onTouchInput({ forward: false })}
              onPointerLeave={() => onTouchInput({ forward: false })}
              onPointerCancel={() => onTouchInput({ forward: false })}
              className="flex h-16 px-5 items-center justify-center rounded-2xl border border-emerald-400/50 bg-emerald-600 text-sm font-bold text-white shadow-lg active:bg-emerald-500 select-none"
            >
              চালান ▲
            </button>
          </div>
        </div>
      )}

      {/* Unified Bottom Dock */}
      <div className="pointer-events-auto mx-auto flex flex-col items-center max-w-[min(940px,95vw)]">
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          className="mb-1 flex items-center gap-1 rounded-t-lg border border-b-0 border-white/14 bg-zinc-950/90 px-3 py-1 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>কন্ট্রোল দেখান [H]</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>কন্ট্রোল লুকান [H]</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl border border-white/14 bg-zinc-950/92 px-3 py-2 shadow-xl">
            {/* Bell Button */}
            <button
              type="button"
              onClick={onRingBell}
              className={`relative overflow-hidden flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                bellReady
                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                  : 'border-white/10 bg-zinc-900 text-zinc-400'
              }`}
            >
              {!bellReady && (
                <span
                  className="pointer-events-none absolute inset-0 bg-amber-500/15 origin-left transition-transform duration-75"
                  style={{ transform: `scaleX(${hud.bellCooldownRatio})` }}
                />
              )}
              <Bell className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">ক্রিং ক্রিং শকওয়েভ [B]</span>
            </button>

            <div className="hidden h-5 w-px bg-white/12 sm:block" />

            {/* Camera View Switcher */}
            <div className="flex items-center gap-1 rounded-lg bg-zinc-900 p-0.5">
              <Camera className="ml-1.5 mr-1 h-3.5 w-3.5 text-zinc-400 shrink-0" />
              {(
                [
                  [CameraMode.CHASE, 'চেজ'],
                  [CameraMode.ACTION, 'অ্যাকশন'],
                  [CameraMode.DRIVER, 'ড্রাইভার'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeCamera(mode)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    cameraMode === mode
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Atmosphere Presets */}
            <div className="hidden items-center gap-1 rounded-lg bg-zinc-900 p-0.5 md:flex">
              <button
                type="button"
                onClick={() => onChangeTimeOfDay(TimeOfDay.DUSK)}
                title="গোধূলি"
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  timeOfDay === TimeOfDay.DUSK ? 'bg-zinc-700 text-amber-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sunset className="h-3.5 w-3.5" />
                <span>গোধূলি</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTimeOfDay(TimeOfDay.NIGHT)}
                title="নিয়ন রাত"
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  timeOfDay === TimeOfDay.NIGHT ? 'bg-zinc-700 text-sky-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>রাত</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTimeOfDay(TimeOfDay.NOON)}
                title="দুপুর"
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                  timeOfDay === TimeOfDay.NOON ? 'bg-zinc-700 text-yellow-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>দুপুর</span>
              </button>
            </div>

            {/* Touch Pad Button */}
            <button
              type="button"
              onClick={() => setTouchPadEnabled((v) => !v)}
              title="টাচ কন্ট্রোল"
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                touchPadEnabled
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="h-3.5 w-3.5" />
              <span>টাচ প্যাড</span>
            </button>

            {/* Mute Button */}
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? 'শব্দ চালু করুন' : 'শব্দ বন্ধ করুন'}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-300 hover:text-white cursor-pointer shrink-0"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>

            <span className="hidden text-[11px] text-zinc-400 lg:inline whitespace-nowrap pl-1">
              W/S ড্রাইভ · A/D মোড় · SPACE ব্রেক · B বেল
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
