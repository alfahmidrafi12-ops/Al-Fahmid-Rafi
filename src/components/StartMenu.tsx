import React from 'react';
import { Volume2, VolumeX, Play, Sun, Moon, Sunset } from 'lucide-react';
import { DRIVER_PROFILES, DriverId, TimeOfDay } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface StartMenuProps {
  selectedDriver: DriverId;
  onSelectDriver: (id: DriverId) => void;
  timeOfDay: TimeOfDay;
  onSelectTimeOfDay: (tod: TimeOfDay) => void;
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartGame: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  selectedDriver,
  onSelectDriver,
  timeOfDay,
  onSelectTimeOfDay,
  highScore,
  isMuted,
  onToggleMute,
  onStartGame,
}) => {
  const drivers = Object.values(DRIVER_PROFILES);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header */}
      <div className="pointer-events-auto mx-auto flex w-full max-w-6xl items-start justify-between gap-6">
        <div className="rounded-xl border border-white/12 bg-zinc-950/90 px-5 py-4 shadow-xl">
          <h1 className="text-3xl font-bold tracking-tight text-amber-400 sm:text-5xl">
            ধান্দাবাজ ৩D
          </h1>
          <p className="mt-1 text-sm text-zinc-300 sm:text-base">
            পুরান ঢাকা রিকশা মেহেম · সবজির দোকান সাফ · বাস ও সিএনজি ট্রাফিক
          </p>
          {highScore > 0 && (
            <p className="mt-2 text-xs text-zinc-400">
              সর্বোচ্চ রেকর্ড:{' '}
              <span className="font-display-num font-bold text-emerald-400">
                ৳{highScore.toLocaleString('en-IN')} BDT
              </span>
            </p>
          )}
        </div>

        {/* Lighting Atmosphere & Audio Controls */}
        <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-zinc-950/90 p-1.5 shadow-xl">
          <button
            type="button"
            onClick={() => onSelectTimeOfDay(TimeOfDay.DUSK)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              timeOfDay === TimeOfDay.DUSK
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Sunset className="h-3.5 w-3.5" />
            <span>গোধূলি</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTimeOfDay(TimeOfDay.NIGHT)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              timeOfDay === TimeOfDay.NIGHT
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>নিয়ন রাত</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTimeOfDay(TimeOfDay.NOON)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              timeOfDay === TimeOfDay.NOON
                ? 'bg-amber-500 text-zinc-950'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>রোদ্রোজ্জ্বল দুপুর</span>
          </button>

          <div className="h-5 w-px bg-white/12" />

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'শব্দ চালু করুন' : 'শব্দ বন্ধ করুন'}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Driver Selection & Launch Dock */}
      <div className="pointer-events-auto mx-auto w-full max-w-3xl rounded-2xl border border-white/15 bg-zinc-950/92 p-5 shadow-2xl sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-zinc-100 sm:text-lg">
            রিকশাচালক নির্বাচন করুন
          </h2>
          <p className="text-xs text-zinc-400">
            সবজির দোকান +৳১৫,০০০ · বাসের হর্ন ও সিএনজি ডজ · বেল শকওয়েভ [B]
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {drivers.map((drv) => {
            const isSelected = selectedDriver === drv.id;
            return (
              <button
                key={drv.id}
                type="button"
                onClick={() => onSelectDriver(drv.id)}
                className={`group flex flex-col items-start rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10'
                    : 'border-white/12 bg-zinc-900/80 hover:border-white/30 hover:bg-zinc-900'
                }`}
              >
                <div className="flex w-full items-center gap-3">
                  {drv.avatarUrl ? (
                    <img
                      src={drv.avatarUrl}
                      alt={drv.nameBn}
                      className="h-12 w-12 rounded-full border-2 border-amber-400 object-cover object-top shadow-md shrink-0"
                    />
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 font-bold text-white shrink-0"
                      style={{
                        backgroundColor: `#${drv.panjabiColor.toString(16).padStart(6, '0')}`,
                      }}
                    >
                      {drv.nameBn.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-base font-bold text-white truncate sm:text-lg">{drv.nameBn}</span>
                      <span
                        className="h-3 w-3 rounded-full border border-white/40 shrink-0"
                        style={{
                          backgroundColor: `#${drv.panjabiColor.toString(16).padStart(6, '0')}`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-zinc-300 truncate">{drv.subtitleBn}</span>
                  </div>
                </div>
                <span className="mt-2 text-xs font-medium text-amber-300">{drv.perkBn}</span>
              </button>
            );
          })}
        </div>

        {/* Sound FX Preview Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/60 px-3.5 py-2">
          <span className="text-xs font-semibold text-amber-400">সাউন্ড টেস্ট:</span>
          <button
            type="button"
            onClick={() => soundEngine.playGameStartVoice()}
            className="rounded-lg bg-zinc-800/90 px-2.5 py-1 text-xs text-zinc-200 hover:bg-amber-500 hover:text-zinc-950 transition-colors cursor-pointer"
            title="গেম শুরুর ডায়লগ শুনুন"
          >
            🔊 গরীবেরা ভালো আছো?
          </button>
          <button
            type="button"
            onClick={() => soundEngine.playCrashVoice()}
            className="rounded-lg bg-zinc-800/90 px-2.5 py-1 text-xs text-zinc-200 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
            title="সংঘর্ষের ডায়লগ শুনুন"
          >
            💥 ও কি লাগছে!
          </button>
          <button
            type="button"
            onClick={() => soundEngine.playCaughtVoice()}
            className="rounded-lg bg-zinc-800/90 px-2.5 py-1 text-xs text-zinc-200 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
            title="রিকশা ধরে ফেলার ডায়লগ শুনুন"
          >
            🚨 রিকশা ধাওয়া
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row">
          <div className="text-xs text-zinc-400">
            <span className="text-zinc-200 font-medium">কন্ট্রোল:</span> W/S বা ↑/↓ ড্রাইভ · A/D বা ←/→ মোড় · SPACE ড্রিফট · B রিকশার বেল
          </div>

          <button
            type="button"
            onClick={onStartGame}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3 text-base font-bold text-zinc-950 shadow-lg hover:bg-amber-400 active:scale-98 transition-all whitespace-nowrap shrink-0 cursor-pointer sm:w-auto"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>গেম শুরু করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
