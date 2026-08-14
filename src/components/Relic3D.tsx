import { useEffect, useMemo, useRef, useState } from "react";
import type { Theme } from "../lib/themes";
import { RNG } from "../lib/rng";

export const RELIC_FORMS = ["tesseract", "icosahedron", "helix", "orbital", "cathedral"] as const;
export type RelicForm = (typeof RELIC_FORMS)[number];

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Geometry {
  points: Vec3[];
  edges: [number, number][];
}

function tesseract(): Geometry {
  const points: Vec3[] = [];
  for (const scale of [1, 0.48]) {
    for (let mask = 0; mask < 8; mask++) {
      points.push({
        x: (mask & 1 ? 1 : -1) * scale,
        y: (mask & 2 ? 1 : -1) * scale,
        z: (mask & 4 ? 1 : -1) * scale,
      });
    }
  }
  const edges: [number, number][] = [];
  for (let layer = 0; layer < 2; layer++) {
    for (let a = 0; a < 8; a++) {
      for (let bit = 0; bit < 3; bit++) {
        const b = a ^ (1 << bit);
        if (a < b) edges.push([a + layer * 8, b + layer * 8]);
      }
    }
  }
  for (let i = 0; i < 8; i++) edges.push([i, i + 8]);
  return { points, edges };
}

function icosahedron(): Geometry {
  const p = (1 + Math.sqrt(5)) / 2;
  const points: Vec3[] = [
    { x: -1, y: p, z: 0 }, { x: 1, y: p, z: 0 }, { x: -1, y: -p, z: 0 }, { x: 1, y: -p, z: 0 },
    { x: 0, y: -1, z: p }, { x: 0, y: 1, z: p }, { x: 0, y: -1, z: -p }, { x: 0, y: 1, z: -p },
    { x: p, y: 0, z: -1 }, { x: p, y: 0, z: 1 }, { x: -p, y: 0, z: -1 }, { x: -p, y: 0, z: 1 },
  ].map((v) => ({ x: v.x * 0.68, y: v.y * 0.68, z: v.z * 0.68 }));
  const edges: [number, number][] = [];
  for (let a = 0; a < points.length; a++) {
    for (let b = a + 1; b < points.length; b++) {
      const dx = points[a].x - points[b].x;
      const dy = points[a].y - points[b].y;
      const dz = points[a].z - points[b].z;
      if (Math.hypot(dx, dy, dz) < 1.5) edges.push([a, b]);
    }
  }
  return { points, edges };
}

function helix(seed: number): Geometry {
  const rng = new RNG(`helix-${seed}`);
  const points: Vec3[] = [];
  const edges: [number, number][] = [];
  const count = 42;
  for (let strand = 0; strand < 2; strand++) {
    for (let i = 0; i < count; i++) {
      const a = i * 0.42 + strand * Math.PI;
      points.push({ x: Math.cos(a) * 0.72, y: (i / (count - 1) - 0.5) * 2.5, z: Math.sin(a) * 0.72 });
      if (i > 0) edges.push([strand * count + i - 1, strand * count + i]);
      if (strand === 1 && i % rng.int(3, 5) === 0) edges.push([i, count + i]);
    }
  }
  return { points, edges };
}

function orbital(): Geometry {
  const points: Vec3[] = [{ x: 0, y: 0, z: 0 }];
  const edges: [number, number][] = [];
  for (let ring = 0; ring < 3; ring++) {
    const start = points.length;
    const count = 28;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const base = { x: Math.cos(a) * (0.7 + ring * 0.22), y: Math.sin(a) * (0.7 + ring * 0.22), z: 0 };
      const tilt = (ring + 1) * 0.72;
      points.push({ x: base.x, y: base.y * Math.cos(tilt), z: base.y * Math.sin(tilt) });
      edges.push([start + i, start + ((i + 1) % count)]);
    }
  }
  points.push({ x: 1.1, y: 0.2, z: 0.4 }, { x: -0.72, y: -0.66, z: 0.28 }, { x: 0.2, y: 0.85, z: -0.65 });
  return { points, edges };
}

function cathedral(seed: number): Geometry {
  const rng = new RNG(`cathedral-${seed}`);
  const points: Vec3[] = [];
  const edges: [number, number][] = [];
  const towers = [-0.9, -0.45, 0, 0.45, 0.9];
  for (const x of towers) {
    const h = x === 0 ? 1.5 : rng.float(0.65, 1.15);
    const start = points.length;
    points.push(
      { x: x - 0.15, y: -1, z: -0.18 }, { x: x + 0.15, y: -1, z: -0.18 },
      { x: x + 0.15, y: h * 0.45, z: -0.18 }, { x: x - 0.15, y: h * 0.45, z: -0.18 },
      { x: x, y: h, z: 0 },
      { x: x - 0.15, y: -1, z: 0.18 }, { x: x + 0.15, y: -1, z: 0.18 },
      { x: x + 0.15, y: h * 0.45, z: 0.18 }, { x: x - 0.15, y: h * 0.45, z: 0.18 },
    );
    const local: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 0], [5, 6], [6, 7], [7, 8], [8, 5], [0, 5], [1, 6], [2, 7], [3, 8], [2, 4], [3, 4], [7, 4], [8, 4]];
    local.forEach(([a, b]) => edges.push([start + a, start + b]));
  }
  return { points, edges };
}

function makeGeometry(form: RelicForm, seed: number): Geometry {
  if (form === "tesseract") return tesseract();
  if (form === "icosahedron") return icosahedron();
  if (form === "helix") return helix(seed);
  if (form === "orbital") return orbital();
  return cathedral(seed);
}

function rotate(point: Vec3, rx: number, ry: number, rz: number): Vec3 {
  let { x, y, z } = point;
  let n = y * Math.cos(rx) - z * Math.sin(rx);
  z = y * Math.sin(rx) + z * Math.cos(rx);
  y = n;
  n = x * Math.cos(ry) + z * Math.sin(ry);
  z = -x * Math.sin(ry) + z * Math.cos(ry);
  x = n;
  n = x * Math.cos(rz) - y * Math.sin(rz);
  y = x * Math.sin(rz) + y * Math.cos(rz);
  x = n;
  return { x, y, z };
}

interface Props {
  theme: Theme;
  seed: number;
  form: RelicForm;
  frozen?: boolean;
  reduced?: boolean;
  compact?: boolean;
  onMutate?: () => void;
}

export function InteractiveRelic({ theme, seed, form, frozen = false, reduced = false, compact = false, onMutate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const geometry = useMemo(() => makeGeometry(form, seed), [form, seed]);
  const state = useRef({ rx: -0.25, ry: 0.35, rz: 0, vx: 0.003, vy: 0.006, zoom: 1, dragging: false, x: 0, y: 0, pulse: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const ctx = canvas.getContext("2d")!;
    let width = 300;
    let height = 300;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    resize();
    let frame = 0;

    const draw = () => {
      frame++;
      if ((frozen || reduced) && frame % 4 !== 0) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const s = state.current;
      if (!frozen && !reduced && !s.dragging) {
        s.rx += s.vx;
        s.ry += s.vy;
        s.vx *= 0.997;
        s.vy *= 0.997;
        s.vx += 0.00001;
        s.vy += 0.00002;
      }
      s.pulse *= 0.94;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width, height) * 0.31 * s.zoom;
      const centerX = width / 2;
      const centerY = height / 2;
      const projected = geometry.points.map((point) => {
        const p = rotate(point, s.rx, s.ry, s.rz);
        const perspective = 3.6 / (3.6 + p.z);
        return { x: centerX + p.x * radius * perspective, y: centerY + p.y * radius * perspective, z: p.z, perspective };
      });

      const halo = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.min(width, height) * 0.48);
      halo.addColorStop(0, `${theme.glow}22`);
      halo.addColorStop(0.6, `${theme.glow}08`);
      halo.addColorStop(1, "transparent");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);

      geometry.edges
        .map((edge) => ({ edge, z: (projected[edge[0]].z + projected[edge[1]].z) / 2 }))
        .sort((a, b) => a.z - b.z)
        .forEach(({ edge, z }, index) => {
          const a = projected[edge[0]];
          const b = projected[edge[1]];
          const depth = Math.max(0.15, Math.min(1, (z + 2) / 4));
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = theme.colors[index % theme.colors.length];
          ctx.globalAlpha = 0.18 + depth * 0.72;
          ctx.lineWidth = 0.45 + depth * 1.1 + s.pulse;
          ctx.shadowColor = theme.glow;
          ctx.shadowBlur = (3 + s.pulse * 8) * depth;
          ctx.stroke();
        });

      projected
        .map((point, index) => ({ ...point, index }))
        .sort((a, b) => a.z - b.z)
        .forEach((point) => {
          const depth = Math.max(0.2, Math.min(1, (point.z + 2) / 4));
          ctx.beginPath();
          ctx.arc(point.x, point.y, (1.2 + depth * 2.3) * point.perspective + s.pulse, 0, Math.PI * 2);
          ctx.fillStyle = theme.colors[point.index % theme.colors.length];
          ctx.globalAlpha = 0.4 + depth * 0.6;
          ctx.shadowBlur = 8 * depth;
          ctx.fill();
        });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [geometry, theme, frozen, reduced]);

  const pointerDown = (event: React.PointerEvent) => {
    const s = state.current;
    s.dragging = true;
    s.x = event.clientX;
    s.y = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: React.PointerEvent) => {
    const s = state.current;
    const rect = event.currentTarget.getBoundingClientRect();
    if (s.dragging) {
      const dx = event.clientX - s.x;
      const dy = event.clientY - s.y;
      s.ry += dx * 0.012;
      s.rx += dy * 0.012;
      s.vy = dx * 0.0008;
      s.vx = dy * 0.0008;
      s.x = event.clientX;
      s.y = event.clientY;
    } else if (!reduced) {
      s.rz = ((event.clientX - rect.left) / rect.width - 0.5) * 0.22;
    }
  };
  const pointerUp = () => (state.current.dragging = false);

  return (
    <div
      ref={wrapRef}
      data-interactive
      className="relative h-full min-h-[180px] w-full touch-none overflow-hidden"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onWheel={(event) => {
        event.preventDefault();
        state.current.zoom = Math.min(1.65, Math.max(0.55, state.current.zoom - event.deltaY * 0.001));
      }}
      onDoubleClick={() => {
        state.current.pulse = 2;
        onMutate?.();
      }}
      style={{
        background: `radial-gradient(circle, ${theme.bg2}88, ${theme.bg}dd)`,
        border: compact ? `1px solid ${theme.hud}33` : undefined,
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="pointer-events-none absolute left-2 top-2 font-mono text-[8px] uppercase tracking-widest opacity-55">
        spatial relic / {form}
      </div>
      {!compact && <div className="pointer-events-none absolute bottom-2 right-2 font-mono text-[8px] uppercase tracking-widest opacity-45">drag rotate / wheel depth / double mutate</div>}
    </div>
  );
}

export function RelicLab({ theme, seed, frozen, reduced }: { theme: Theme; seed: number; frozen: boolean; reduced: boolean }) {
  const [formIndex, setFormIndex] = useState(seed % RELIC_FORMS.length);
  const form = RELIC_FORMS[formIndex];
  const next = () => setFormIndex((index) => (index + 1) % RELIC_FORMS.length);
  return (
    <div>
      <div className="h-[260px]">
        <InteractiveRelic theme={theme} seed={seed} form={form} frozen={frozen} reduced={reduced} onMutate={next} />
      </div>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {RELIC_FORMS.map((item, index) => (
          <button
            key={item}
            onClick={() => setFormIndex(index)}
            title={item}
            className="h-6 font-mono text-[8px] uppercase"
            style={{ border: `1px solid ${theme.hud}`, background: index === formIndex ? `${theme.glow}44` : "transparent" }}
          >
            {item.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}