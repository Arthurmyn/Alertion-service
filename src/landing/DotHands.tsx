import { useEffect, useRef } from 'react';
import styles from './DotHands.module.css';

/**
 * The hero's dot-matrix canvas: two hands rendered as a halftone of black
 * dots, with a glitch dissolve between two poses. The source sheet holds four
 * tiles (left/right hand, pose A and B); each frame is sampled from them.
 */
const SHEET_URL = '/landing/hands.webp';

const RECTS = {
  LA: [0.0, 0.06, 0.47, 0.4],
  RA: [0.53, 0.06, 0.47, 0.4],
  LB: [0.0, 0.55, 0.47, 0.4],
  RB: [0.53, 0.55, 0.47, 0.4],
} as const;

/** Seconds before the animation repeats. */
const LOOP = 4 * 5;
/** The still frame shown when the visitor prefers reduced motion. */
const STILL_FRAME = 9;

type Rect = readonly [number, number, number, number];

function fract(n: number): number {
  return n - Math.floor(n);
}

function hash(a: number, b: number): number {
  return fract(Math.sin(a * 127.1 + b * 311.7) * 43758.5453);
}

function smooth(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function mixAt(t: number, on: number, off: number, dur: number): number {
  return smooth(on, on + dur, t) * (1 - smooth(off, off + dur, t));
}

function createTile(img: HTMLImageElement, rect: Rect): HTMLCanvasElement {
  const iw = img.naturalWidth || 1600;
  const ih = img.naturalHeight || 905;
  const tileW = 420;
  const tileH = Math.round(tileW * ((rect[3] * ih) / (rect[2] * iw)));
  const tile = document.createElement('canvas');
  tile.width = tileW;
  tile.height = tileH;
  const context = tile.getContext('2d');
  if (context) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(
      img,
      rect[0] * iw,
      rect[1] * ih,
      rect[2] * iw,
      rect[3] * ih,
      0,
      0,
      tileW,
      tileH,
    );
  }
  return tile;
}

export function DotHands({ stillOnly = false }: { stillOnly?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !hero || !ctx) return;

    const reduceMotion =
      stillOnly ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const fieldA = document.createElement('canvas');
    const fieldB = document.createElement('canvas');
    const ctxA = fieldA.getContext('2d', { willReadFrequently: true });
    const ctxB = fieldB.getContext('2d', { willReadFrequently: true });
    if (!ctxA || !ctxB) return;

    let W = 0;
    let H = 0;
    let DPR = 1;
    let step = 7;
    let rowStep = 14.35;
    let cols = 0;
    let rows = 0;
    let R = 3.22;
    let seeds: Float32Array | null = null;
    let portrait = false;
    let tiles: Record<'LA' | 'RA' | 'LB' | 'RB', HTMLCanvasElement> | null =
      null;
    let visible = true;
    let frame = 0;
    let disposed = false;

    function resize() {
      W = hero!.clientWidth || window.innerWidth;
      H = hero!.clientHeight || window.innerHeight;
      DPR = Math.min(2, window.devicePixelRatio || 1);
      portrait = H > W;

      canvas!.width = Math.round(W * DPR);
      canvas!.height = Math.round(H * DPR);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;

      step = Math.max(5, W / 205);
      rowStep = step * 2.05;
      cols = Math.ceil(W / step);
      rows = Math.ceil(H / rowStep);
      R = step * 0.46;

      fieldA.width = cols;
      fieldA.height = rows;
      fieldB.width = cols;
      fieldB.height = rows;

      seeds = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) {
        const rowBias = hash(j * 3.1, 7.7);
        for (let i = 0; i < cols; i++) {
          seeds[j * cols + i] = 0.55 * hash(i, j) + 0.45 * rowBias;
        }
      }
      if (reduceMotion) render(STILL_FRAME);
    }

    function drawHand(
      target: CanvasRenderingContext2D,
      tile: HTMLCanvasElement,
      isLeft: boolean,
      scale: number,
      rot: number,
      x: number,
      cy: number,
      hw: number,
      hh: number,
    ) {
      target.save();
      target.scale(cols / W, rows / H);
      const px = isLeft ? 0 : W;
      target.translate(px, cy);
      target.rotate(rot);
      target.scale(scale, scale);
      target.translate(-px, -cy);
      target.drawImage(tile, x, cy - hh / 2, hw, hh);
      target.restore();
    }

    function render(timeSec: number) {
      const t = ((timeSec % LOOP) + LOOP) % LOOP;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      if (!tiles || !seeds || cols === 0 || rows === 0) return;
      ctx!.setTransform(DPR, 0, 0, DPR, 0, 0);

      // Hand placement and drift
      const a = (2 * Math.PI * t) / LOOP;
      const hw = W * (portrait ? 0.66 : 0.53);
      const hh = hw * ((0.4 * 1520) / (0.47 * 2688));
      const cy = H * (portrait ? 0.66 : 0.54);

      const reachL = (0.035 * Math.sin(a) + 0.012 * Math.sin(2 * a + 1.3)) * W;
      const scaleL = 1 + 0.07 * Math.sin(a + 0.9);
      const rotL = 0.045 * Math.sin(a + 2.1);
      const xL = reachL - W * 0.045;

      const aR = a + Math.PI;
      const reachR =
        (0.035 * Math.sin(aR) + 0.012 * Math.sin(2 * aR + 1.3)) * W;
      const scaleR = 1 + 0.07 * Math.sin(aR + 0.9);
      const rotR = -0.045 * Math.sin(aR + 2.1);
      const xR = W - hw + W * 0.045 - reachR;

      ctxA!.fillStyle = '#ffffff';
      ctxA!.fillRect(0, 0, cols, rows);
      drawHand(ctxA!, tiles.LA, true, scaleL, rotL, xL, cy, hw, hh);
      drawHand(ctxA!, tiles.RA, false, scaleR, rotR, xR, cy, hw, hh);

      ctxB!.fillStyle = '#ffffff';
      ctxB!.fillRect(0, 0, cols, rows);
      drawHand(ctxB!, tiles.LB, true, scaleL, rotL, xL, cy, hw, hh);
      drawHand(ctxB!, tiles.RB, false, scaleR, rotR, xR, cy, hw, hh);

      const dataA = ctxA!.getImageData(0, 0, cols, rows).data;
      const dataB = ctxB!.getImageData(0, 0, cols, rows).data;

      // Pose switches (glitch dissolve)
      const mL = mixAt(t, 6.2, 14.6, 1.6);
      const mR = mixAt(t, 2.4, 10.4, 1.6);
      const tick = Math.floor(t * 7);

      // The quiet zone around the copy, sized for this hero's longer text.
      const qWidth = portrait ? 0.5 : 0.24;
      const qCenterY = portrait ? 0.33 : 0.41;
      const qHeight = portrait ? 0.085 : 0.125;
      const midCol = cols / 2;

      ctx!.fillStyle = '#0d0d0d';
      ctx!.beginPath();

      for (let j = 0; j < rows; j++) {
        const rowGlitch = hash(j, tick) > 0.965;
        const shift = rowGlitch ? Math.round((hash(tick, j) - 0.5) * 8) : 0;
        const rowOffset = j * cols;
        const py = (j + 0.5) * rowStep;
        const ey = (py / H - qCenterY) / qHeight;

        for (let i = 0; i < cols; i++) {
          const seed = seeds[rowOffset + i]!;
          const m = i < midCol ? mL : mR;
          const useB = seed < m;

          const sampleI = Math.max(0, Math.min(cols - 1, i - shift));
          const idx = (rowOffset + sampleI) * 4;
          const lum = (useB ? dataB[idx]! : dataA[idx]!) / 255;

          let v = (1 - lum - 0.16) / 0.42;
          if (v <= 0) continue;
          if (v > 1) v = 1;

          if (m > 0.001 && m < 0.999) {
            const diff = Math.abs(seed - m);
            if (diff < 0.12) {
              v *= diff / 0.12;
              if (hash(i + tick, j) <= 0.4) v *= 0.3;
            }
          }

          v *= 0.86 + 0.14 * Math.sin(t * 3.2 + seed * 40);

          // Keep the middle of the hero quiet, and the copy readable
          const cx = Math.abs((i + 0.5) / cols - 0.5);
          v *= smooth(0.035, 0.11, cx);
          const ex = cx / qWidth;
          v *= smooth(0.85, 1.25, Math.hypot(ex, ey));

          // Quantise to five dot sizes
          if (v < 0.13) continue;
          const level =
            v >= 0.87 ? 1 : v >= 0.65 ? 0.78 : v >= 0.39 ? 0.52 : 0.26;

          const radius = level === 0.26 ? R * 0.38 : R * level;
          const px = (i + 0.5) * step;
          ctx!.moveTo(px + radius, py);
          ctx!.arc(px, py, radius, 0, Math.PI * 2);
        }
      }
      ctx!.fill();
    }

    const sheet = new Image();
    sheet.onload = () => {
      if (disposed) return;
      tiles = {
        LA: createTile(sheet, RECTS.LA),
        RA: createTile(sheet, RECTS.RA),
        LB: createTile(sheet, RECTS.LB),
        RB: createTile(sheet, RECTS.RB),
      };
      if (reduceMotion) render(STILL_FRAME);
    };
    sheet.src = SHEET_URL;

    resize();
    window.addEventListener('resize', resize);

    // Draw only while the hero is on screen.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
    });
    observer.observe(hero);

    const start = performance.now();
    function loop(now: number) {
      if (disposed) return;
      if (visible && !document.hidden) render((now - start) / 1000);
      frame = requestAnimationFrame(loop);
    }
    if (!reduceMotion) frame = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [stillOnly]);

  return (
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  );
}
