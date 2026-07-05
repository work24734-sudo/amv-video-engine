import { useState } from 'react';
import { Clapperboard, Layers, Github, Timer, Clock, Sparkles } from 'lucide-react';
import { useSequencePlayer } from './useSequencePlayer';
import { useCanvasRenderer } from './useCanvasRenderer';
import { UploadPanel } from './components/UploadPanel';
import { ClipList } from './components/ClipList';
import { PlayerStage } from './components/PlayerStage';

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

function App() {
  const seq = useSequencePlayer();
  const [fxEnabled, setFxEnabled] = useState(true);

  const { canvasRef } = useCanvasRenderer({
    activeVideoEl: seq.activeVideoEl,
    cutId: seq.cutId,
    frameNonce: seq.frameNonce,
    isPlaying: seq.isPlaying,
    isPlayingRef: seq.isPlayingRef,
    enabled: fxEnabled,
    aspectRatio: seq.aspectRatio,
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-white/8 bg-ink-800/60 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 text-white shadow-neon-btn">
            <Clapperboard size={20} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">AMV Sequence Engine</h1>
            <p className="text-[11px] text-white/40">Master Polish · Neon Engine</p>
          </div>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          <UploadPanel onLoad={seq.loadFiles} onClear={seq.clearAll} clipCount={seq.clips.length} />

          {/* Visual engine toggle */}
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-medium text-white/70">
              <Sparkles size={14} className="text-accent-400" />
              Visual Engine
            </div>
            <button
              onClick={() => setFxEnabled((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                fxEnabled ? 'bg-accent-500' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  fxEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Slicer control */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50">
              <Timer size={14} />
              Clip Duration (Seconds)
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0.5}
                  max={60}
                  step={0.5}
                  value={seq.clipDuration}
                  onChange={(e) => seq.setClipDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-white outline-none transition-all focus:border-accent-400/50 focus:shadow-glow [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/35">
                  sec
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => seq.setClipDuration(v)}
                    className={`h-9 w-9 rounded-md border text-xs font-semibold transition-all ${
                      seq.clipDuration === v
                        ? 'border-accent-400/40 bg-accent-400/10 text-accent-400'
                        : 'border-white/8 bg-white/[0.02] text-white/50 hover:text-white/80'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Total output duration */}
          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.04] to-transparent px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-white/55">
              <Clock size={14} />
              Total Output Duration
            </div>
            <div className="text-right">
              <div className="text-base font-semibold tabular-nums text-white">
                {fmt(seq.masterDuration)}
              </div>
              <div className="text-[10px] text-white/35">
                {seq.clips.length} × {seq.clipDuration}s
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-white/50">
              <span className="flex items-center gap-2">
                <Layers size={14} />
                Sequence
              </span>
              {seq.clips.length > 0 && (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
                  {seq.clips.length} clip{seq.clips.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <ClipList clips={seq.clips} currentIndex={seq.currentIndex} onGoTo={seq.goTo} />
          </div>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex items-center justify-between px-5 py-4 text-[11px] text-white/35">
          <span className="flex items-center gap-1.5">
            <Github size={13} /> Canvas render engine
          </span>
          <span>v1.0.0</span>
        </div>
      </aside>

      {/* Main stage */}
      <main className="relative flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white/90">Preview</h2>
            <p className="text-xs text-white/40">
              Master timeline · {seq.clips.length} clips × {seq.clipDuration}s = {fmt(seq.masterDuration)}
            </p>
          </div>
          {seq.clips.length > 0 && (
            <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-soft" />
              {seq.isPlaying ? 'Playing' : 'Paused'} · {fmt(seq.masterTime)} / {fmt(seq.masterDuration)}
            </div>
          )}
        </div>

        <PlayerStage
          activeVideoEl={seq.activeVideoEl}
          canvasRef={canvasRef}
          isPlaying={seq.isPlaying}
          isLooping={seq.isLooping}
          masterTime={seq.masterTime}
          masterDuration={seq.masterDuration}
          currentIndex={seq.currentIndex}
          clipCount={seq.clips.length}
          clipDuration={seq.clipDuration}
          fxEnabled={fxEnabled}
          aspectRatio={seq.aspectRatio}
          onTogglePlay={seq.togglePlay}
          onSeekMaster={seq.seekMaster}
          onNext={seq.nextClip}
          onPrev={seq.prevClip}
          onToggleLoop={seq.toggleLoop}
          onToggleFx={() => setFxEnabled((v) => !v)}
          onToggleAspectRatio={seq.toggleAspectRatio}
        />
      </main>
    </div>
  );
}

export default App;
