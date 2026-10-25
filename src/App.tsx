import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { GameHud } from './components/GameHud';
import { GameOverModal } from './components/GameOverModal';
import { StartMenu } from './components/StartMenu';
import { DhakaGameEngine } from './game/DhakaGameEngine';
import {
  CameraMode,
  DriverId,
  GamePhase,
  HudSnapshot,
  InputState,
  ScreenPopup,
  TimeOfDay,
} from './types/game';

const INITIAL_HUD: HudSnapshot = {
  money: 0,
  highScore: 0,
  health: 100,
  wantedLevel: 0,
  speedKmh: 0,
  combo: 0,
  comboTimerRatio: 0,
  stallsSmashed: 0,
  distanceMeters: 0,
  bellCooldownRatio: 1,
  turboRemainingRatio: 0,
  activeMobCount: 0,
  trafficCount: 0,
};

export function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<DhakaGameEngine | null>(null);

  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [selectedDriver, setSelectedDriver] = useState<DriverId>('kader');
  const [cameraMode, setCameraMode] = useState<CameraMode>(CameraMode.CHASE);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(TimeOfDay.DUSK);
  const [isMuted, setIsMuted] = useState(false);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [popups, setPopups] = useState<ScreenPopup[]>([]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new DhakaGameEngine(container, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onPhaseChange: (nextPhase) => {
        setPhase(nextPhase);
      },
      onPopup: (popup) => {
        setPopups((prev) => [...prev.slice(-5), popup]);
        window.setTimeout(() => {
          setPopups((prev) => prev.filter((item) => item.id !== popup.id));
        }, 1200);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleSelectDriver = useCallback((id: DriverId) => {
    setSelectedDriver(id);
    engineRef.current?.setDriver(id, true);
  }, []);

  const handleSelectTimeOfDay = useCallback((tod: TimeOfDay) => {
    setTimeOfDay(tod);
    engineRef.current?.applyTimeOfDay(tod);
  }, []);

  const handleChangeCamera = useCallback((mode: CameraMode) => {
    setCameraMode(mode);
    engineRef.current?.setCameraMode(mode);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    soundEngine.init();
    setPopups([]);
    engineRef.current?.startGame();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.togglePause();
  }, []);

  const handleBackToMenu = useCallback(() => {
    setPopups([]);
    engineRef.current?.returnToMenu();
  }, []);

  const handleRingBell = useCallback(() => {
    engineRef.current?.triggerBell();
  }, []);

  const handleTouchInput = useCallback((partial: Partial<InputState>) => {
    engineRef.current?.setTouchInput(partial);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Dedicated isolated WebGL canvas container (never torn down by React state updates) */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 h-full w-full"
        aria-label="ধান্দাবাজ ৩D পুরান ঢাকা গেম ক্যানভাস"
      />

      {phase === GamePhase.MENU && (
        <StartMenu
          selectedDriver={selectedDriver}
          onSelectDriver={handleSelectDriver}
          timeOfDay={timeOfDay}
          onSelectTimeOfDay={handleSelectTimeOfDay}
          highScore={hud.highScore}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartGame={handleStartGame}
        />
      )}

      {(phase === GamePhase.PLAYING ||
        phase === GamePhase.PAUSED ||
        phase === GamePhase.GAME_OVER) && (
        <GameHud
          hud={hud}
          driverId={selectedDriver}
          cameraMode={cameraMode}
          onChangeCamera={handleChangeCamera}
          timeOfDay={timeOfDay}
          onChangeTimeOfDay={handleSelectTimeOfDay}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onRingBell={handleRingBell}
          onPause={handlePause}
          onTouchInput={handleTouchInput}
          popups={popups}
        />
      )}

      {(phase === GamePhase.PAUSED || phase === GamePhase.GAME_OVER) && (
        <GameOverModal
          phase={phase}
          hud={hud}
          driverId={selectedDriver}
          onResume={handlePause}
          onRestart={handleStartGame}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </main>
  );
}

export default App;
