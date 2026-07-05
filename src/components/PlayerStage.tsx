import { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Film,
  Sparkles,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';

interface Props {
  activeVideoEl: React.MutableRefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isPlaying: boolean;
  isLooping: boolean;
  masterTime: number;
  masterDuration: number;
  currentIndex: number;
  clipCount: number;
  clipDuration: number;
  fxEnabled: boolean;
  aspectRatio: '16:9' | '9:16';
  onTogglePlay: () => void;
  onSeekMaster: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleLoop: () => void;
  onToggleFx: () => void;
  onToggleAspectRatio: () => void;
}

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export function PlayerStage({
  activeVideoEl,
  canvasRef,
  isPlaying,
  isLooping,
  masterTime,
  masterDuration,
  currentIndex,
  clipCount,
  clipDuration,
  fxEnabled,
  aspectRatio,
  onTogglePlay,
  onSeekMaster,
  onNext,
  onPrev,
  onToggleLoop,
  onToggleFx,
  onToggleAspectRatio,
}: Props) {
  const vaultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vault = vaultRef.current;
    const el = activeVideoEl.current;
    if (!vault || !el) return;
    if (el.parentElement === vault) return;
    el.classList.add('vault-video');
    vault.replaceChildren(el);
  }, [activeVideoEl, currentIndex, clipCount]);

  const pct = masterDuration > 0 ? (masterTime / masterDuration) * 100 : 0;
  const hasClip = clipCount > 0;
  const isPortrait = aspectRatio === '9:16';

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasClip || masterDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeekMaster(ratio * masterDuration);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Neon frame stage */}
      <div className="relative flex flex-1 items-center justify-center">
        <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10 blur-2xl" />

        <div
          className={`relative overflow-hidden rounded-[20px] border border-white/10 bg-black/70 shadow-neon-frame backdrop-blur-xl transition-all duration-500 ease-out ${
            isPortrait ? 'aspect-[9/16] h-full max-h-full' : 'aspect-video w-full max-w-full'
          }`}
        >
          {/* Neon edge glow layers */}
          <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-cyan-400/30" />
          <div className="pointer-events-none absolute -inset-px rounded-[20px] bg-gradient-to-br from-cyan-400/20 via-transparent to-fuchsia-500/20" />

          {/* Off-screen video vault */}
          <div
            ref={vaultRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 h-px w-px overflow-hidden opacity-0"
          />

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="h-full w-full"
            style={{ display: hasClip ? 'block' : 'none' }}
          />

          {!hasClip && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/30">
              <Film size={40} strokeWidth={1.2} />
              <p className="text-sm">Upload clips to begin</p>
            </div>
          )}

          {hasClip && (
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
              <div className="rounded-md bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white/85 backdrop-blur-md">
                Clip {currentIndex + 1} / {clipCount}
              </div>
              {fxEnabled && (
                <div className="flex items-center gap-1 rounded-md bg-cyan-400/15 px-2 py-1 text-[10px] font-medium text-cyan-200 backdrop-blur-md">
                  <Sparkles size={11} /> FX
                </div>
              )}
              <div className="rounded-md bg-fuchsia-500/15 px-2 py-1 text-[10px] font-medium text-fuchsia-200 backdrop-blur-md">
                {aspectRatio}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transport bar */}
      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-white/40">
          <span>Master Timeline</span>
          <span className="tabular-nums text-white/55">{clipDuration}s per clip</span>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <span className="w-12 text-right text-[11px] tabular-nums text-white/55">{fmt(masterTime)}</span>
          <div className="group relative flex-1">
            <div
              onClick={handleClick}
              className="relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500"
                style={{ width: `${pct}%` }}
              />
              {clipCount > 1 &&
                Array.from({ length: clipCount - 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full w-px bg-black/45"
                    style={{ left: `${((i + 1) / clipCount) * 100}%` }}
                  />
                ))}
              <div
                className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-white shadow-glow"
                style={{ left: `${pct}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={masterDuration || 0}
              step={0.01}
              value={Math.min(masterTime, masterDuration)}
              onChange={(e) => onSeekMaster(Number(e.target.value))}
              className="absolute inset-x-0 -top-1 h-4 w-full cursor-pointer opacity-0"
              disabled={!hasClip}
            />
          </div>
          <span className="w-12 text-[11px] tabular-nums text-white/55">{fmt(masterDuration)}</span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onToggleAspectRatio}
            title={isPortrait ? 'Switch to 16:9 Landscape' : 'Switch to 9:16 Portrait'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
              isPortrait
                ? 'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-300'
                : 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
            }`}
          >
            {isPortrait ? <RectangleVertical size={16} /> : <RectangleHorizontal size={16} />}
          </button>

          <button
            onClick={onToggleFx}
            title={fxEnabled ? 'FX on' : 'FX off'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
              fxEnabled
                ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                : 'border-white/8 bg-white/[0.02] text-white/50 hover:text-white/80'
            }`}
          >
            <Sparkles size={16} />
          </button>

          <button
            onClick={onToggleLoop}
            title={isLooping ? 'Loop on' : 'Loop off'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
              isLooping
                ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                : 'border-white/8 bg-white/[0.02] text-white/50 hover:text-white/80'
            }`}
          >
            {isLooping ? <Repeat size={16} /> : <Repeat size={16} className="opacity-40" />}
          </button>

          <button
            onClick={onPrev}
            disabled={!hasClip}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/8 bg-white/[0.02] text-white/70 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
          >
            <SkipBack size={18} />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={!hasClip}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-white shadow-neon-btn transition-transform hover:scale-105 disabled:opacity-30"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>

          <button
            onClick={onNext}
            disabled={!hasClip}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/8 bg-white/[0.02] text-white/70 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
          >
            <SkipForward size={18} />
          </button>

          <div className="ml-3 h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
