import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { Heart, Pause, Volume2, VolumeX } from "lucide-react";
import { createGame, type GameApi } from "@/game/engine";
import type { Hud } from "@/game/types";

const INITIAL: Hud = {
  score: 0,
  lives: 3,
  combo: 0,
  sheet: 1,
  fill: 0,
  quota: 8,
  best: 0,
  message: "Catch the bright drops. Dodge the muddy ones.",
  mode: "title",
  muted: false,
  newBest: false,
};

export function WaterDropGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameApi | null>(null);
  const [hud, setHud] = useState<Hud>(INITIAL);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createGame(canvas, setHud);
    gameRef.current = game;
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  function hold(side: "left" | "right" | "boost", down: boolean) {
    gameRef.current?.setHold(side, down);
  }

  const playing = hud.mode === "play";
  const primary =
    hud.mode === "pause" ? "Resume" : hud.mode === "title" ? "Start" : hud.mode === "over" ? "Again" : "Restart";

  return (
    <main className="flex h-dvh w-full flex-col bg-ink text-line">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-mist/40 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
        <div className="min-w-0">
          <h1 className="font-display truncate text-xl leading-none font-semibold text-line">Water Drop</h1>
          <p className="truncate text-xs text-mist" role="status" aria-live="polite">
            {hud.combo > 1 && playing ? `Streak ×${hud.combo}. ` : ""}
            {hud.message}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Meter label="Score" value={String(hud.score)} />
          <div className="flex items-center gap-1" aria-label={`Lives ${hud.lives}`}>
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                aria-hidden="true"
                className={i < hud.lives ? "size-4 fill-rain text-rain" : "size-4 text-mist"}
                strokeWidth={1.75}
              />
            ))}
          </div>
          <Meter label="Round" value={`${hud.sheet} · ${hud.fill}/${hud.quota}`} />
          <Meter label="Best" value={String(hud.best)} accent />
          <IconButton label={hud.muted ? "Unmute" : "Mute"} onClick={() => gameRef.current?.toggleMute()}>
            {hud.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </IconButton>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none bg-ink"
          aria-label="Water Drop playfield. Move left and right to catch clean drops and avoid dirty ones."
        />
        {hud.mode === "pause" || hud.mode === "over" ? (
          <div className="pointer-events-none absolute inset-x-3 top-3 border border-mist bg-ink/90 px-3 py-2">
            <p className="text-xs tracking-widest text-rain uppercase">
              {hud.mode === "over" ? "Run over" : "Held"}
            </p>
            <p className="font-display text-2xl leading-tight font-semibold text-line">
              {hud.mode === "over" ? (hud.newBest ? `New best ${hud.score}` : `Score ${hud.score}`) : "Rain on hold"}
            </p>
          </div>
        ) : null}
        {playing ? (
          <div className="absolute top-2 right-2">
            <IconButton label="Pause" onClick={() => gameRef.current?.togglePause()}>
              <Pause className="size-4" />
            </IconButton>
          </div>
        ) : null}
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-2 border-t border-mist/40 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <HoldButton label="Left" name="Move left" onHold={(down) => hold("left", down)} />
        <HoldButton label="Fast run" onHold={(down) => hold("boost", down)} />
        <button
          type="button"
          className={
            playing
              ? "flex h-14 items-center justify-center rounded-xl border border-mist bg-sheet px-2 text-sm font-semibold text-line"
              : "flex h-14 items-center justify-center rounded-xl bg-rain px-2 text-sm font-semibold text-ink"
          }
          onClick={() => (hud.mode === "pause" ? gameRef.current?.togglePause() : gameRef.current?.start())}
        >
          {primary}
        </button>
        <HoldButton label="Right" name="Move right" onHold={(down) => hold("right", down)} />
      </div>
      <p className="sr-only">
        Arrows or A and D to move. Hold Fast run, Shift, or F to sprint. Tap either half of the sheet, or hold the pads.
        P pauses. M mutes.
      </p>
    </main>
  );
}

function Meter({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <p className="text-right leading-none">
      <span className="block text-xs tracking-widest text-mist uppercase">{label}</span>
      <span className={accent ? "text-sm text-rain tabular-nums" : "text-sm text-line tabular-nums"}>{value}</span>
    </p>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-xl border border-mist bg-ink/80 text-line"
    >
      {children}
    </button>
  );
}

function HoldButton({ label, name, onHold }: { label: string; name?: string; onHold: (down: boolean) => void }) {
  function down(e: PointerEvent<HTMLButtonElement>) {
    if (!e.isPrimary || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    onHold(true);
  }
  return (
    <button
      type="button"
      aria-label={name ?? label}
      className="h-14 touch-none rounded-xl border border-rain bg-sheet px-1 text-sm font-semibold text-line select-none active:bg-rain active:text-ink"
      onPointerDown={down}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onLostPointerCapture={() => onHold(false)}
    >
      {label}
    </button>
  );
}
