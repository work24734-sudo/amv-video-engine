import { CheckCircle2, Loader2, AlertCircle, Film } from 'lucide-react';
import type { VideoClip } from '../useSequencePlayer';

interface Props {
  clips: VideoClip[];
  currentIndex: number;
  onGoTo: (index: number) => void;
}

const statusIcon = (status: VideoClip['status'], active: boolean) => {
  if (active) return <div className="h-2 w-2 rounded-full bg-accent-400 shadow-glow animate-pulse-soft" />;
  switch (status) {
    case 'ready':
      return <CheckCircle2 size={13} className="text-emerald-400/80" />;
    case 'loading':
      return <Loader2 size={13} className="text-white/50 animate-spin" />;
    case 'error':
      return <AlertCircle size={13} className="text-red-400/80" />;
    default:
      return <div className="h-2 w-2 rounded-full bg-white/25" />;
  }
};

const fmt = (s: number) => {
  if (!s || !isFinite(s)) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export function ClipList({ clips, currentIndex, onGoTo }: Props) {
  if (clips.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-8 text-center">
        <Film size={22} className="mx-auto mb-2 text-white/25" />
        <p className="text-xs text-white/40">No clips loaded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clips.map((clip, i) => {
        const active = i === currentIndex;
        return (
          <button
            key={clip.id}
            onClick={() => onGoTo(i)}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
              active
                ? 'border-accent-400/40 bg-accent-400/[0.08] shadow-glow'
                : 'border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-[11px] font-semibold text-white/55">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`truncate text-xs font-medium ${active ? 'text-white' : 'text-white/70'}`}>
                {clip.name}
              </div>
              <div className="text-[10px] text-white/35">{fmt(clip.duration)}</div>
            </div>
            <div className="shrink-0">{statusIcon(clip.status, active)}</div>
          </button>
        );
      })}
    </div>
  );
}
