import React from 'react';
import { RotateCcw, Home, Play } from 'lucide-react';
import { DRIVER_PROFILES, DriverId, GamePhase, HudSnapshot } from '../types/game';

interface GameOverModalProps {
  phase: GamePhase.PAUSED | GamePhase.GAME_OVER;
  hud: HudSnapshot;
  driverId: DriverId;
  onResume: () => void;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  phase,
  hud,
  driverId,
  onResume,
  onRestart,
  onBackToMenu,
}) => {
  const driver = DRIVER_PROFILES[driverId];
  const isPaused = phase === GamePhase.PAUSED;
  const isNewRecord = hud.money > 0 && hud.money >= hud.highScore;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-zinc-950/95 p-6 shadow-2xl sm:p-7">
        <div className="text-center">
          <h2
            className={`text-3xl font-bold tracking-tight ${
              isPaused ? 'text-amber-400' : 'text-rose-500'
            }`}
          >
            {isPaused ? 'গেম বিরতি (Paused)' : 'জনতার হাতে ধরা!'}
          </h2>
          <p className="mt-1.5 text-sm text-zinc-300">
            {isPaused
              ? `${driver.nameBn}-এর রিকশা বর্তমানে থামানো আছে।`
              : 'ক্ষিপ্ত পুরান ঢাকাবাসী ও ট্রাফিক আপনার রিকশা ঘিরে ফেলেছে!'}
          </p>
        </div>

        <div className="my-6 space-y-3 border-y border-white/10 py-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">মোট ধান্দা কামাই</span>
            <span className="font-display-num text-xl font-bold text-emerald-400">
              ৳{hud.money.toLocaleString('en-IN')} BDT
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">সর্বোচ্চ রেকর্ড</span>
            <span className="font-display-num font-semibold text-amber-300">
              ৳{hud.highScore.toLocaleString('en-IN')} BDT
              {!isPaused && isNewRecord ? ' (নতুন রেকর্ড!)' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">দোকান ও সবজি সাফ</span>
            <span className="font-display-num font-semibold text-zinc-100">
              {hud.stallsSmashed} টি
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">অতিক্রান্ত দূরত্ব</span>
            <span className="font-display-num font-semibold text-zinc-100">
              {hud.distanceMeters.toLocaleString('en-IN')} মিটার
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row">
          {isPaused && (
            <button
              type="button"
              onClick={onResume}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>খেলা চালিয়ে যান</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
              isPaused
                ? 'border border-white/15 bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
            }`}
          >
            <RotateCcw className="h-4 w-4" />
            <span>আবার খেলুন</span>
          </button>

          <button
            type="button"
            onClick={onBackToMenu}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="h-4 w-4" />
            <span>ড্রাইভার বদলান</span>
          </button>
        </div>
      </div>
    </div>
  );
};
