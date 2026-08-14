import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useDragControls } from "framer-motion";
import type { Theme } from "../lib/themes";
import { RNG } from "../lib/rng";
import { SpecimenSVG, SPECIMEN_TYPES } from "./Specimen";
import { RelicLab } from "./Relic3D";

interface WinShellProps {
  theme: Theme;
  title: string;
  children: React.ReactNode;
  start: { x: number; y: number };
  onClose: () => void;
  z: number;
  onFocus: () => void;
  w?: number;
}

function WinShell({ theme, title, children, start, onClose, z, onFocus, w = 260 }: WinShellProps) {
  const dragControls = useDragControls();
  return (
    <motion.div
      data-interactive
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onPointerDown={onFocus}
      initial={{ x: start.x, y: start.y, opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute select-none backdrop-blur-sm"
      style={{
        width: `min(${w}px, calc(100vw - 20px))`,
        zIndex: z,
        background: `${theme.bg2}e6`,
        border: `1px solid ${theme.hud}`,
        boxShadow: `0 0 30px ${theme.glow}44, inset 0 0 20px ${theme.bg}`,
      }}
    >
      <div
        onPointerDown={(event) => dragControls.start(event)}
        className="flex cursor-grab items-center justify-between px-2 py-1 font-mono text-[10px] uppercase tracking-widest active:cursor-grabbing"
        style={{ background: `${theme.hud}22`, color: theme.hud, borderBottom: `1px solid ${theme.hud}55` }}
      >
        <span className="truncate">{title}</span>
        <button
          onClick={onClose}
          className="ml-2 flex h-4 w-4 items-center justify-center leading-none hover:opacity-70"
          style={{ border: `1px solid ${theme.hud}`, color: theme.hud }}
        >
          ×
        </button>
      </div>
      <div className="p-2" style={{ color: theme.ink }}>
        {children}
      </div>
    </motion.div>
  );
}

// live microscopic feed — animated procedural cells drifting
function MicroFeed({ theme, seed }: { theme: Theme; seed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const rng = new RNG("micro" + seed);
    const cells = Array.from({ length: 14 }, () => ({
      x: rng.float(0, 220),
      y: rng.float(0, 120),
      r: rng.float(4, 16),
      vx: rng.float(-0.3, 0.3),
      vy: rng.float(-0.3, 0.3),
      c: rng.pick(theme.colors),
    }));
    let raf = 0;
    const loop = () => {
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, 220, 120);
      for (const c of cells) {
        c.x += c.vx;
        c.y += c.vy;
        if (c.x < -20) c.x = 240;
        if (c.x > 240) c.x = -20;
        if (c.y < -20) c.y = 140;
        if (c.y > 140) c.y = -20;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.strokeStyle = c.c;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = c.c;
        ctx.globalAlpha = 0.4;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [theme, seed]);
  return (
    <div>
      <canvas ref={ref} width={220} height={120} className="w-full" style={{ border: `1px solid ${theme.hud}44` }} />
      <div className="mt-1 flex justify-between font-mono text-[9px] opacity-70">
        <span>MAG ×{400 + (seed % 9) * 100}</span>
        <span className="animate-pulse">● LIVE</span>
      </div>
    </div>
  );
}

export interface WinDef {
  id: number;
  kind: "portal" | "micro" | "warning" | "diagram" | "specimen" | "relic3d";
  start: { x: number; y: number };
  z: number;
  seedN: number;
}

interface Props {
  wins: WinDef[];
  theme: Theme;
  frozen: boolean;
  reduced: boolean;
  onClose: (id: number) => void;
  onFocus: (id: number) => void;
}

const WARNINGS = [
  "BIOHAZARD // DO NOT ARCHIVE",
  "CONTAINMENT BREACH IMMINENT",
  "SUBJECT IS AWARE",
  "RADIATION LEVEL: ANOMALOUS",
  "MEMETIC HAZARD — AVERT GAZE",
  "SPECIMEN NO LONGER DECEASED",
];

export function WindowLayer({ wins, theme, frozen, reduced, onClose, onFocus }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[9000]">
      <div className="pointer-events-auto">
        {wins.map((w) => {
          const rng = new RNG("win" + w.seedN);
          if (w.kind === "portal") {
            return (
              <WinShell key={w.id} theme={theme} title={`PORTAL ${w.seedN % 999}`} start={w.start} z={w.z} onClose={() => onClose(w.id)} onFocus={() => onFocus(w.id)} w={220}>
                <div className="relative aspect-square overflow-hidden" style={{ background: theme.bg }}>
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                  >
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="absolute inset-0" style={{ opacity: 0.5 }}>
                        <SpecimenSVG seed={"portal" + w.seedN + i} type={rng.pick(SPECIMEN_TYPES)} colors={theme.colors} ink={theme.ink} showFrame={false} filterId="warp" />
                      </div>
                    ))}
                  </motion.div>
                  <div className="absolute inset-0" style={{ background: "url(#portal-grad)", boxShadow: `inset 0 0 60px ${theme.bg}` }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-1/3 w-1/3 rounded-full" style={{ background: theme.bg, boxShadow: `0 0 30px 10px ${theme.bg}` }} />
                  </div>
                </div>
                <p className="mt-1 font-mono text-[9px] opacity-70">gateway unstable · step through?</p>
              </WinShell>
            );
          }
          if (w.kind === "micro") {
            return (
              <WinShell key={w.id} theme={theme} title={`MICRO-FEED ${w.seedN % 99}`} start={w.start} z={w.z} onClose={() => onClose(w.id)} onFocus={() => onFocus(w.id)} w={240}>
                <MicroFeed theme={theme} seed={w.seedN} />
              </WinShell>
            );
          }
          if (w.kind === "warning") {
            return (
              <WinShell key={w.id} theme={theme} title="⚠ NOTICE" start={w.start} z={w.z} onClose={() => onClose(w.id)} onFocus={() => onFocus(w.id)} w={230}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" style={{ color: theme.glow }}>⚠</span>
                    <span className="font-mono text-xs uppercase leading-tight" style={{ color: theme.glow }}>
                      {rng.pick(WARNINGS)}
                    </span>
                  </div>
                  <div className="h-3 w-full" style={{ background: `repeating-linear-gradient(45deg, ${theme.glow} 0 8px, ${theme.bg} 8px 16px)` }} />
                  <p className="font-mono text-[9px] opacity-70">ref {rng.int(10000, 99999)} · clearance denied · this window cannot be trusted</p>
                </div>
              </WinShell>
            );
          }
          if (w.kind === "diagram") {
            return (
              <WinShell key={w.id} theme={theme} title={`DIAGRAM ${w.seedN % 888}`} start={w.start} z={w.z} onClose={() => onClose(w.id)} onFocus={() => onFocus(w.id)} w={250}>
                <div className="aspect-[4/3]">
                  <SpecimenSVG seed={"diag" + w.seedN} type={rng.pick(["machine", "map", "geometry", "satellite", "scan"])} colors={theme.colors} ink={theme.ink} />
                </div>
                <div className="mt-1 grid grid-cols-3 gap-1 font-mono text-[8px] opacity-70">
                  <span>θ {rng.int(0, 359)}°</span>
                  <span>λ {rng.float(0, 9).toFixed(2)}</span>
                  <span>Δ {rng.int(-99, 99)}</span>
                </div>
              </WinShell>
            );
          }
          if (w.kind === "relic3d") {
            return (
              <WinShell key={w.id} theme={theme} title={`SPATIAL RELIC ${w.seedN % 999}`} start={w.start} z={w.z} onClose={() => onClose(w.id)} onFocus={() => onFocus(w.id)} w={320}>
                <RelicLab theme={theme} seed={w.seedN} frozen={frozen} reduced={reduced} />
              </WinShell>
            );
          }
          // specimen
          return (
            <WinShell key={w.id} theme={theme} title={`SPECIMEN ${w.seedN % 9999}`} start={w.start} z={w.z} onClose={() => onClose(w.id)} onFocus={() => onFocus(w.id)} w={220}>
              <div className="aspect-square">
                <SpecimenSVG seed={"win" + w.seedN} type={rng.pick(SPECIMEN_TYPES)} colors={theme.colors} ink={theme.ink} filterId={rng.bool(0.5) ? "melt" : undefined} />
              </div>
            </WinShell>
          );
        })}
      </div>
    </div>
  );
}

export function useWindowManager() {
  const [wins, setWins] = useState<WinDef[]>([]);
  const topZ = useRef(9000);
  const idc = useRef(0);

  const open = useCallback((kind: WinDef["kind"], at?: { x: number; y: number }) => {
    const id = ++idc.current;
    topZ.current += 1;
    const panelWidth = Math.min(kind === "relic3d" ? 320 : 260, window.innerWidth - 20);
    const start = at ?? {
      x: Math.random() * Math.max(0, window.innerWidth - panelWidth - 20) + 10,
      y: Math.random() * Math.max(20, window.innerHeight - 360) + 50,
    };
    setWins((w) => [...w.slice(-11), { id, kind, start, z: topZ.current, seedN: Math.floor(Math.random() * 100000) }]);
  }, []);
  const close = useCallback((id: number) => setWins((w) => w.filter((x) => x.id !== id)), []);
  const closeAll = useCallback(() => setWins([]), []);
  const focus = useCallback((id: number) => {
    topZ.current += 1;
    const z = topZ.current;
    setWins((w) => w.map((x) => (x.id === id ? { ...x, z } : x)));
  }, []);
  return { wins, open, close, closeAll, focus };
}


