import React, { useEffect, useState } from 'react';
import { Pause, Play, Radio, SkipForward, SlidersHorizontal, Volume2 } from 'lucide-react';
import {
  dhakaRadio,
  DhakaRadioSnapshot,
  DhakaRadioStationId,
} from '../audio/dhakaRadio';
import { soundEngine } from '../audio/soundEngine';

const STATIONS: { id: DhakaRadioStationId; freq: string; nameBn: string }[] = [
  { id: '88.8', freq: '88.8', nameBn: 'ক্লাসিক বাংলা' },
  { id: '98.4', freq: '98.4', nameBn: 'ঢাকা টক-শো' },
  { id: '101.6', freq: '101.6', nameBn: 'রিকশা ফিউশন' },
  { id: 'OFF', freq: 'OFF', nameBn: 'বন্ধ' },
];

export const DhakaRadioWidget: React.FC = () => {
  const [snap, setSnap] = useState<DhakaRadioSnapshot>(() => dhakaRadio.getSnapshot());
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    return dhakaRadio.subscribe(setSnap);
  }, []);

  const handleSelectStation = (id: DhakaRadioStationId) => {
    soundEngine.init();
    dhakaRadio.setStation(id);
  };

  const handleCycleStation = () => {
    soundEngine.init();
    dhakaRadio.cycleStation();
  };

  const handleNext = () => {
    soundEngine.init();
    dhakaRadio.nextTrackOrSegment();
  };

  const handleTogglePlay = () => {
    soundEngine.init();
    dhakaRadio.togglePlayPause();
  };

  const isOff = snap.stationId === 'OFF';

  return (
    <div className="pointer-events-auto relative flex flex-col items-center w-full max-w-[min(740px,94vw)]">
      {/* Expandable FM Stereo Tuner Drawer */}
      {drawerOpen && (
        <div className="mb-1.5 w-full max-w-md rounded-xl border border-white/15 bg-zinc-950/95 p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <Radio className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-white truncate">
                ঢাকা এফএম / রেডিও টিউনার
              </span>
            </div>
            <span className="font-display-num tabular-nums text-xs font-bold text-emerald-400 whitespace-nowrap shrink-0">
              {snap.frequencyLabel}
            </span>
          </div>

          {/* 4 Station Presets */}
          <div className="mt-2.5 grid grid-cols-4 gap-1.5">
            {STATIONS.map((st) => {
              const active = snap.stationId === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleSelectStation(st.id)}
                  className={`flex flex-col items-center justify-center rounded-lg border px-2 py-1.5 text-center transition-colors cursor-pointer ${
                    active
                      ? st.id === 'OFF'
                        ? 'border-rose-500/60 bg-rose-950/70 text-rose-200'
                        : 'border-emerald-400/70 bg-emerald-950/80 text-emerald-300'
                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  <span className="font-display-num tabular-nums text-xs font-bold leading-tight">
                    {st.freq}
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium whitespace-nowrap truncate max-w-full">
                    {st.nameBn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Program / Track & Volume Controls */}
          <div className="mt-2.5 flex items-center justify-between gap-3 rounded-lg bg-zinc-900/90 px-3 py-2 border border-white/8">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-amber-300 truncate">
                {snap.nowPlayingTitleBn}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {snap.nowPlayingSubBn}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(snap.volume * 100)}
                onChange={(e) => dhakaRadio.setVolume(Number(e.target.value) / 100)}
                aria-label="রেডিও ভলিউম"
                className="h-1.5 w-20 accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Compact Car-Stereo Strip */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/14 bg-zinc-950/92 px-3 py-1.5 shadow-xl">
        <button
          type="button"
          onClick={handleCycleStation}
          title="চ্যানেল বদলান [R]"
          className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            !isOff
              ? 'border-emerald-500/45 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
              : 'border-white/10 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Radio className="h-3.5 w-3.5 shrink-0" />
          <span className="font-display-num tabular-nums">{snap.frequencyLabel}</span>
          <span className="hidden sm:inline text-[11px] font-medium text-zinc-300">
            · {snap.stationNameBn}
          </span>
        </button>

        {/* Live Song / Dhaka Talk Chatter Ticker */}
        <div className="min-w-0 flex-1 px-1 text-left">
          <div className="truncate text-xs font-medium text-zinc-200">
            {snap.liveChatterBn}
          </div>
        </div>

        {/* Stereo Playback Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={snap.isPlaying ? 'রেডিও বিরতি' : 'রেডিও চালান'}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            {snap.isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isOff}
            title="পরবর্তী গান / টক সেগমেন্ট"
            aria-label="পরবর্তী গান বা আলোচনা"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen((prev) => !prev)}
            title="রেডিও টিউনার ও ভলিউম"
            aria-label="রেডিও টিউনার"
            className={`flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
              drawerOpen
                ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                : 'border-white/10 bg-zinc-900 text-zinc-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            <span className="hidden md:inline">টিউনার</span>
          </button>
        </div>
      </div>
    </div>
  );
};
