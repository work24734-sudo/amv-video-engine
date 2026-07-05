import { useRef } from 'react';
import { Upload, Film, Trash2 } from 'lucide-react';

interface Props {
  onLoad: (files: FileList | File[]) => void;
  onClear: () => void;
  clipCount: number;
}

export function UploadPanel({ onLoad, onClear, clipCount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50">
        <Upload size={14} />
        Source Clips
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        className="group w-full rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-left transition-all hover:border-accent-400/50 hover:bg-accent-400/[0.06] hover:shadow-glow"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/15 text-accent-400 transition-transform group-hover:scale-105">
            <Film size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white/90">Add video files</div>
            <div className="text-xs text-white/45">Multiple selection supported</div>
          </div>
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length) onLoad(e.target.files);
          e.target.value = '';
        }}
      />

      {clipCount > 0 && (
        <button
          onClick={onClear}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-red-400/30 hover:text-red-300"
        >
          <Trash2 size={13} />
          Clear all ({clipCount})
        </button>
      )}
    </div>
  );
}
