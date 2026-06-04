import { useEffect, useState } from "react"

interface TimerBarProps {
  headTimestamp: number
  ttlMs: number
  clockOffset: number
}

export function TimerBar({ headTimestamp, ttlMs, clockOffset }: TimerBarProps) {
  const [progress, setProgress] = useState(100)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const enteredAtMs = headTimestamp * 1000
      const expiresAtMs = enteredAtMs + ttlMs
      const now = Date.now() + clockOffset
      const remainingMs = Math.max(0, expiresAtMs - now)

      setProgress((remainingMs / ttlMs) * 100)
      setSecondsLeft(Math.ceil(remainingMs / 1000))
    }

    updateProgress()
    const interval = window.setInterval(updateProgress, 200)
    return () => window.clearInterval(interval)
  }, [headTimestamp, ttlMs, clockOffset])

  return (
    <div className="w-full mt-1">
      <div
        className="w-full rounded-full h-1 overflow-hidden border border-light"
        style={{ backgroundColor: "var(--bg-inset)" }}
      >
        <div
          className="h-full transition-all duration-200 ease-linear rounded-full"
          style={{
            width: `${progress}%`,
            background: "var(--base-color)",
          }}
        />
      </div>
      <div className="flex justify-end mt-0.5" role="status" aria-live="polite" aria-label="Tempo restante">
        <span className="tech-label text-[7px]" style={{ color: "var(--base-color)" }}>
          {secondsLeft}s
        </span>
      </div>
    </div>
  )
}
