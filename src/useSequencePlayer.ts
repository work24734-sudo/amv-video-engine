import { useCallback, useEffect, useRef, useState } from 'react';

export type ClipStatus = 'idle' | 'loading' | 'ready' | 'error';
export type AspectRatio = '16:9' | '9:16';

export interface VideoClip {
  id: string;
  name: string;
  url: string;
  duration: number;
  status: ClipStatus;
}

interface InternalClip extends VideoClip {
  el: HTMLVideoElement;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const DEFAULT_CLIP_DURATION = 3;

export function useSequencePlayer() {
  const [clips, setClips] = useState<InternalClip[]>([]);
  const [clipDuration, setClipDuration] = useState(DEFAULT_CLIP_DURATION);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [masterTime, setMasterTime] = useState(0);
  const [localTime, setLocalTime] = useState(0);
  const [cutId, setCutId] = useState(0);
  const [frameNonce, setFrameNonce] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  const activeRef = useRef<HTMLVideoElement | null>(null);
  const isLoopingRef = useRef(isLooping);
  const currentIndexRef = useRef(currentIndex);
  const clipsRef = useRef<InternalClip[]>(clips);
  const clipDurationRef = useRef(clipDuration);
  const isPlayingRef = useRef(isPlaying);
  const rafRef = useRef<number | null>(null);
  const cutIdRef = useRef(0);

  isLoopingRef.current = isLooping;
  currentIndexRef.current = currentIndex;
  clipsRef.current = clips;
  clipDurationRef.current = clipDuration;
  isPlayingRef.current = isPlaying;

  const masterDuration = clips.length * clipDuration;

  const detachListeners = (el: HTMLVideoElement) => {
    el.onloadedmetadata = null;
    el.oncanplay = null;
    el.onerror = null;
    el.onplay = null;
    el.onpause = null;
    el.onended = null;
  };

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const advanceTo = useCallback(
    (index: number, localStart: number, autoplay: boolean) => {
      const list = clipsRef.current;
      const dur = clipDurationRef.current;
      if (index < 0 || index >= list.length) return;

      const prev = activeRef.current;
      const nextEl = list[index].el;
      if (prev && prev !== nextEl) {
        prev.pause();
        detachListeners(prev);
      }

      const isCut = prev !== nextEl;
      activeRef.current = nextEl;
      setFrameNonce((n) => n + 1);
      if (isCut) {
        cutIdRef.current += 1;
        setCutId(cutIdRef.current);
      }
      nextEl.onplay = () => {
        isPlayingRef.current = true;
        setIsPlaying(true);
      };
      nextEl.onpause = () => {
        if (rafRef.current === null) {
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      };
      nextEl.onended = () => {
        const loop = isLoopingRef.current;
        if (index + 1 < list.length) {
          advanceTo(index + 1, 0, true);
        } else if (loop && list.length > 0) {
          advanceTo(0, 0, true);
        } else {
          stopRaf();
          isPlayingRef.current = false;
          setIsPlaying(false);
        }
      };

      const clamped = Math.max(0, Math.min(localStart, dur));
      nextEl.currentTime = clamped;
      setCurrentIndex(index);
      setLocalTime(clamped);
      setMasterTime(index * dur + clamped);

      if (autoplay) {
        void nextEl.play().catch(() => {
          isPlayingRef.current = false;
          setIsPlaying(false);
        });
      }
    },
    [],
  );

  const tick = useCallback(() => {
    const el = activeRef.current;
    const list = clipsRef.current;
    const dur = clipDurationRef.current;
    const i = currentIndexRef.current;
    if (!el || list.length === 0) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const lt = el.currentTime;

    if (lt >= dur) {
      const loop = isLoopingRef.current;
      if (i + 1 < list.length) {
        advanceTo(i + 1, 0, true);
      } else if (loop && list.length > 0) {
        advanceTo(0, 0, true);
      } else {
        el.pause();
        stopRaf();
        isPlayingRef.current = false;
        setIsPlaying(false);
        setLocalTime(dur);
        setMasterTime(list.length * dur);
        return;
      }
    } else if (lt < dur - 0.15 && el.paused && isPlayingRef.current) {
      void el.play().catch(() => {});
    }

    setLocalTime(lt);
    setMasterTime(i * dur + lt);
    rafRef.current = requestAnimationFrame(tick);
  }, [advanceTo]);

  const startRaf = useCallback(() => {
    stopRaf();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => () => stopRaf(), []);

  const loadFiles = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files).filter((f) => f.type.startsWith('video/'));
      if (incoming.length === 0) return;

      const created: InternalClip[] = incoming.map((file) => {
        const url = URL.createObjectURL(file);
        const el = document.createElement('video');
        el.src = url;
        el.preload = 'auto';
        el.muted = false;
        el.playsInline = true;
        el.crossOrigin = 'anonymous';
        return {
          id: uid(),
          name: file.name,
          url,
          duration: 0,
          status: 'loading' as ClipStatus,
          el,
        };
      });

      // Attach metadata/canplay/error using stable clip id lookups so they
      // survive subsequent appends without index drift.
      created.forEach((clip) => {
        const el = clip.el;
        const id = clip.id;
        el.onloadedmetadata = () => {
          setClips((prev) =>
            prev.map((c) => (c.id === id ? { ...c, duration: el.duration, status: 'ready' as ClipStatus } : c)),
          );
        };
        el.oncanplay = () => {
          setClips((prev) =>
            prev.map((c) => (c.id === id && c.status !== 'ready' ? { ...c, status: 'ready' as ClipStatus } : c)),
          );
        };
        el.onerror = () => {
          setClips((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'error' as ClipStatus } : c)));
        };
      });

      const wasEmpty = clipsRef.current.length === 0;

      setClips((prev) => [...prev, ...created]);

      if (wasEmpty) {
        clipsRef.current = [...clipsRef.current, ...created];
        setCurrentIndex(0);
        setLocalTime(0);
        setMasterTime(0);
        setIsPlaying(false);
        isPlayingRef.current = false;
        activeRef.current = created[0].el;
        created[0].el.currentTime = 0;
        setFrameNonce((n) => n + 1);
      } else {
        clipsRef.current = [...clipsRef.current, ...created];
      }
    },
    [],
  );

  const play = useCallback(() => {
    const el = activeRef.current;
    if (!el || clipsRef.current.length === 0) return;
    const dur = clipDurationRef.current;
    if (currentIndexRef.current >= clipsRef.current.length) return;
    if (localTime >= dur - 0.05) {
      advanceTo(currentIndexRef.current, 0, true);
    } else {
      void el.play().catch(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
      });
    }
    startRaf();
  }, [advanceTo, startRaf, localTime]);

  const pause = useCallback(() => {
    stopRaf();
    activeRef.current?.pause();
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) pause();
    else play();
  }, [play, pause]);

  const seekMaster = useCallback(
    (time: number) => {
      const list = clipsRef.current;
      const dur = clipDurationRef.current;
      if (list.length === 0 || dur <= 0) return;

      const total = list.length * dur;
      const clamped = Math.max(0, Math.min(time, total - 0.001));
      const index = Math.min(Math.floor(clamped / dur), list.length - 1);
      const local = clamped - index * dur;

      const wasPlaying = isPlayingRef.current;
      stopRaf();
      advanceTo(index, local, false);
      if (wasPlaying) {
        const el = activeRef.current;
        if (el) {
          void el.play().catch(() => {});
          startRaf();
        }
      }
    },
    [advanceTo, startRaf],
  );

  const goTo = useCallback(
    (index: number) => {
      stopRaf();
      advanceTo(index, 0, true);
      startRaf();
    },
    [advanceTo, startRaf],
  );

  const nextClip = useCallback(() => {
    const list = clipsRef.current;
    const i = currentIndexRef.current;
    const target = i + 1 < list.length ? i + 1 : 0;
    stopRaf();
    advanceTo(target, 0, true);
    startRaf();
  }, [advanceTo, startRaf]);

  const prevClip = useCallback(() => {
    const list = clipsRef.current;
    const i = currentIndexRef.current;
    const target = i - 1 >= 0 ? i - 1 : list.length - 1;
    stopRaf();
    advanceTo(target, 0, true);
    startRaf();
  }, [advanceTo, startRaf]);

  const setClipDurationValue = useCallback(
    (value: number) => {
      const safe = Math.max(0.5, Math.min(60, value));
      stopRaf();
      setClipDuration(safe);
      clipDurationRef.current = safe;
      const list = clipsRef.current;
      if (list.length > 0) {
        advanceTo(0, 0, false);
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
    },
    [advanceTo],
  );

  const toggleLoop = useCallback(() => setIsLooping((v) => !v), []);

  const toggleAspectRatio = useCallback(() => {
    setAspectRatio((r) => (r === '16:9' ? '9:16' : '16:9'));
  }, []);

  const clearAll = useCallback(() => {
    stopRaf();
    clipsRef.current.forEach((c) => {
      detachListeners(c.el);
      c.el.src = '';
      URL.revokeObjectURL(c.url);
    });
    setClips([]);
    clipsRef.current = [];
    setCurrentIndex(0);
    setLocalTime(0);
    setMasterTime(0);
    setIsPlaying(false);
    isPlayingRef.current = false;
    activeRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopRaf();
      clipsRef.current.forEach((c) => {
        detachListeners(c.el);
        c.el.src = '';
        URL.revokeObjectURL(c.url);
      });
    };
  }, []);

  const publicClips: VideoClip[] = clips.map(({ el: _el, ...rest }) => rest);

  return {
    clips: publicClips,
    activeVideoEl: activeRef,
    clipDuration,
    currentIndex,
    isPlaying,
    isLooping,
    masterTime,
    localTime,
    masterDuration,
    cutId,
    frameNonce,
    isPlayingRef,
    aspectRatio,
    loadFiles,
    play,
    pause,
    togglePlay,
    seekMaster,
    goTo,
    nextClip,
    prevClip,
    setClipDuration: setClipDurationValue,
    toggleLoop,
    toggleAspectRatio,
    clearAll,
  };
}
