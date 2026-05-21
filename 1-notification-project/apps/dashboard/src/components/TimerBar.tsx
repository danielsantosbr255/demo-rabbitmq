import { useEffect, useState } from 'react';

interface TimerBarProps {
  headTimestamp: number;
  ttlMs: number;
  clockOffset: number;
}

export function TimerBar({ headTimestamp, ttlMs, clockOffset }: TimerBarProps) {
  const [progress, setProgress] = useState(100);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const enteredAtMs = headTimestamp * 1000;
      const expiresAtMs = enteredAtMs + ttlMs;
      const now = Date.now() + clockOffset;
      const remainingMs = Math.max(0, expiresAtMs - now);

      setProgress((remainingMs / ttlMs) * 100);
      setSecondsLeft(Math.ceil(remainingMs / 1000));
    };

    updateProgress();
    const interval = window.setInterval(updateProgress, 200);
    return () => window.clearInterval(interval);
  }, [headTimestamp, ttlMs, clockOffset]);

  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-[9px] font-semibold text-amber-600 mb-1" role="status" aria-live="polite" aria-label="Tempo restante para próxima tentativa">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 animate-spin inline-block rounded-full border-t-2 border-amber-600" />
          Aguardando próxima tentativa
        </span>
        <span>{secondsLeft}s</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-400 to-orange-400 h-full transition-all duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
