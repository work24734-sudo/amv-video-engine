import { useCallback, useEffect, useRef } from 'react';

export interface RendererHandle {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

interface Params {
  activeVideoEl: React.MutableRefObject<HTMLVideoElement | null>;
  cutId: number;
  frameNonce: number;
  isPlaying: boolean;
  isPlayingRef: React.MutableRefObject<boolean>;
  enabled: boolean;
  aspectRatio: '16:9' | '9:16';
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function useCanvasRenderer({
  activeVideoEl,
  cutId,
  frameNonce,
  isPlaying,
  isPlayingRef,
  enabled,
  aspectRatio,
}: Params): RendererHandle {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const decodeRef = useRef<HTMLCanvasElement | null>(null);
  const chanRRef = useRef<HTMLCanvasElement | null>(null);
  const chanGRef = useRef<HTMLCanvasElement | null>(null);
  const chanBRef = useRef<HTMLCanvasElement | null>(null);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef(performance.now());
  const lastCutIdRef = useRef(0);

  const spring = useRef({ v: 1, vel: 0 });
  const flash = useRef(0);
  const rgb = useRef(0);

  if (cutId !== lastCutIdRef.current) {
    lastCutIdRef.current = cutId;
    if (cutId > 0) {
      spring.current = { v: 1.3, vel: 0 };
      flash.current = 1;
      rgb.current = 28;
    }
  }

  const ensureCanvases = useCallback(() => {
    if (!decodeRef.current) {
      const make = () => document.createElement('canvas');
      decodeRef.current = make();
      chanRRef.current = make();
      chanGRef.current = make();
      chanBRef.current = make();
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = activeVideoEl.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW === 0 || cssH === 0) return;

    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ensureCanvases();
    const decode = decodeRef.current!;
    const chanR = chanRRef.current!;
    const chanG = chanGRef.current!;
    const chanB = chanBRef.current!;

    if (decode.width !== vw || decode.height !== vh) {
      decode.width = vw;
      decode.height = vh;
      chanR.width = chanG.width = chanB.width = vw;
      chanR.height = chanG.height = chanB.height = vh;
    }

    const dctx = decode.getContext('2d', { alpha: false })!;
    dctx.drawImage(video, 0, 0, vw, vh);

    const t = (performance.now() - startRef.current) / 1000;

    // --- Spring: critically-damped return to 1.0 ---
    const x = spring.current.v - 1;
    const omega = 16;
    spring.current.vel += (-omega * omega * x - 2 * omega * spring.current.vel) * 0.016;
    spring.current.v += spring.current.vel * 0.016;
    const scale = clamp(spring.current.v, 0.5, 2.5);

    // --- Flash: exponential decay ---
    flash.current *= 0.86;
    if (flash.current < 0.002) flash.current = 0;

    // --- RGB split: spike decays toward baseline drift ---
    rgb.current *= 0.9;
    if (rgb.current < 0.05) rgb.current = 0;
    const baseline = 2.2 + Math.sin(t * 0.7) * 1.1 + Math.sin(t * 1.9) * 0.6;
    const rgbAmt = rgb.current + baseline;

    // --- Camera drift (sine-based pseudo-3D) ---
    const driftX = Math.sin(t * 0.21) * 18 + Math.sin(t * 0.07) * 8;
    const driftY = Math.cos(t * 0.17) * 12 + Math.cos(t * 0.11) * 6;
    const pitch = Math.sin(t * 0.13) * 0.025;
    const yaw = Math.cos(t * 0.09) * 0.025;
    const breathe = 1 + Math.sin(t * 0.3) * 0.012;

    // --- Cover-fit: video fills canvas, cropping overflow ---
    const canvasAR = canvas.width / canvas.height;
    const videoAR = vw / vh;
    let baseW: number, baseH: number;
    if (videoAR > canvasAR) {
      // video wider -> match height, overflow width
      baseH = canvas.height;
      baseW = baseH * videoAR;
    } else {
      // video taller -> match width, overflow height
      baseW = canvas.width;
      baseH = baseW / videoAR;
    }
    const drawW = baseW * scale * breathe;
    const drawH = baseH * scale * breathe;
    const cx = canvas.width / 2 + driftX * dpr;
    const cy = canvas.height / 2 + driftY * dpr;
    const dx = cx - drawW / 2;
    const dy = cy - drawH / 2;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.transform(Math.cos(yaw), Math.sin(yaw) * pitch, -Math.sin(pitch), Math.cos(pitch), 0, 0);
    ctx.translate(-cx, -cy);

    if (enabled) {
      const ox = rgbAmt * dpr;
      const oy = (rgbAmt * 0.5) * dpr;

      const rctx = chanR.getContext('2d', { alpha: false })!;
      const gctx = chanG.getContext('2d', { alpha: false })!;
      const bctx = chanB.getContext('2d', { alpha: false })!;

      rctx.globalCompositeOperation = 'source-over';
      gctx.globalCompositeOperation = 'source-over';
      bctx.globalCompositeOperation = 'source-over';
      rctx.drawImage(decode, 0, 0);
      gctx.drawImage(decode, 0, 0);
      bctx.drawImage(decode, 0, 0);

      rctx.globalCompositeOperation = 'multiply';
      gctx.globalCompositeOperation = 'multiply';
      bctx.globalCompositeOperation = 'multiply';
      rctx.fillStyle = '#ff0000';
      gctx.fillStyle = '#00ff00';
      bctx.fillStyle = '#0000ff';
      rctx.fillRect(0, 0, vw, vh);
      gctx.fillRect(0, 0, vw, vh);
      bctx.fillRect(0, 0, vw, vh);

      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(chanR, dx - ox, dy - oy, drawW, drawH);
      ctx.drawImage(chanG, dx, dy, drawW, drawH);
      ctx.drawImage(chanB, dx + ox, dy + oy, drawW, drawH);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.drawImage(decode, dx, dy, drawW, drawH);
    }

    ctx.restore();

    if (flash.current > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flash.current})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [activeVideoEl, ensureCanvases, enabled]);

  const loop = useCallback(() => {
    draw();
    const playing = isPlayingRef.current;
    const settled =
      flash.current < 0.002 && Math.abs(spring.current.v - 1) < 0.005 && rgb.current < 0.05;
    if (!playing && settled) {
      rafRef.current = null;
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, isPlayingRef]);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const kick = useCallback(() => {
    stopRaf();
    rafRef.current = requestAnimationFrame(loop);
  }, [loop, stopRaf]);

  useEffect(() => {
    if (!enabled) {
      stopRaf();
      return;
    }
    kick();
    return () => stopRaf();
  }, [enabled, kick, isPlaying, cutId, frameNonce, aspectRatio, stopRaf]);

  useEffect(() => {
    if (!enabled) return;
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [enabled, draw]);

  return { canvasRef };
}
