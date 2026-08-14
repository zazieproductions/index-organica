import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { Theme } from "../lib/themes";
import { engine, DEFAULT_PARAMS, type EngineParams, type WaveKind } from "../lib/audio";

interface Props {
  theme: Theme;
  live: boolean; // engine running
  onToggle: () => void;
  onClose: () => void;
}

const WAVES: { kind: WaveKind; glyph: string }[] = [
  { kind: "sine", glyph: "∿" },
  { kind: "triangle", glyph: "⟁" },
  { kind: "sawtooth", glyph: "⩘" },
  { kind: "square", glyph: "⊓" },
];

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-[9px] uppercase tracking-widest opacity-70">
        <span>{label}</span>
        <span>
          {step < 1 ? value.toFixed(2) : Math.round(value)}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="chromatic-range block w-full"
      />
    </label>
  );
}

/** Oscilloscope + spectrum analyser, painted with the current theme. */
function Scope({ theme, live }: { theme: Theme; live: boolean }) {
  const waveRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    const wave = new Float32Array(2048) as Float32Array<ArrayBuffer>;
    const spec = new Uint8Array(1024) as Uint8Array<ArrayBuffer>;
    let t = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.016;
      const wc = waveRef.current;
      const sc = specRef.current;
      if (!wc || !sc) return;
      const wctx = wc.getContext("2d");
      const sctx = sc.getContext("2d");
      if (!wctx || !sctx) return;

      const W = wc.width;
      const H = wc.height;

      // --- oscilloscope ---
      wctx.fillStyle = `${theme.bg}`;
      wctx.fillRect(0, 0, W, H);
      wctx.strokeStyle = `${theme.hud}22`;
      wctx.beginPath();
      wctx.moveTo(0, H / 2);
      wctx.lineTo(W, H / 2);
      wctx.stroke();

      const gotWave = engine.getWave(wave);
      wctx.strokeStyle = theme.glow;
      wctx.lineWidth = 1.5;
      wctx.shadowColor = theme.glow;
      wctx.shadowBlur = 6;
      wctx.beginPath();
      const n = 512;
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * W;
        // when the engine is silent, draw a faint idle carrier so the scope is never dead
        const v = gotWave && live ? wave[Math.floor((i / n) * wave.length)] : Math.sin(i * 0.09 + t * 2) * 0.04;
        const y = H / 2 - v * H * 0.45;
        if (i === 0) wctx.moveTo(x, y);
        else wctx.lineTo(x, y);
      }
      wctx.stroke();
      wctx.shadowBlur = 0;

      // --- spectrum ---
      const SW = sc.width;
      const SH = sc.height;
      sctx.fillStyle = `${theme.bg}`;
      sctx.fillRect(0, 0, SW, SH);
      const gotSpec = engine.getSpectrum(spec);
      const bars = 48;
      const bw = SW / bars;
      for (let i = 0; i < bars; i++) {
        // log-ish bin mapping so bass doesn't eat the display
        const bin = Math.floor(Math.pow(i / bars, 1.7) * 340);
        const mag = gotSpec && live ? spec[bin] / 255 : Math.max(0, Math.sin(i * 0.4 + t * 1.4) * 0.06 + 0.05);
        const h = Math.max(1, mag * SH);
        sctx.fillStyle = i % 6 === 0 ? theme.glow : theme.colors[i % theme.colors.length];
        sctx.globalAlpha = 0.28 + mag * 0.72;
        sctx.fillRect(i * bw + 1, SH - h, bw - 2, h);
      }
      sctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [theme, live]);

  return (
    <div className="space-y-1.5">
      <canvas ref={waveRef} width={296} height={64} className="block w-full" style={{ border: `1px solid ${theme.hud}44` }} />
      <canvas ref={specRef} width={296} height={44} className="block w-full" style={{ border: `1px solid ${theme.hud}44` }} />
    </div>
  );
}

export function SignalEngine({ theme, live, onToggle, onClose }: Props) {
  const [params, setParams] = useState<EngineParams>({ ...engine.params });

  const patch = useCallback(<K extends keyof EngineParams>(key: K, value: EngineParams[K]) => {
    engine.set(key, value);
    setParams((prev) => ({ ...prev, [key]: value }));
  }, []);

  const randomize = useCallback(() => {
    const roots = [36.71, 41.2, 49, 55, 61.74, 73.42, 82.41, 98];
    patch("wave", WAVES[Math.floor(Math.random() * WAVES.length)].kind);
    patch("root", roots[Math.floor(Math.random() * roots.length)]);
    patch("spread", Math.random() * 28);
    patch("cutoff", 120 + Math.random() * 3800);
    patch("res", 1 + Math.random() * 18);
    patch("lfoRate", 0.05 + Math.random() * 7);
    patch("lfoDepth", Math.random());
    patch("drive", Math.random() * 0.85);
    patch("noise", Math.random() * 0.5);
  }, [patch]);

  const reset = useCallback(() => {
    (Object.keys(DEFAULT_PARAMS) as (keyof EngineParams)[]).forEach((k) => {
      if (k !== "volume") patch(k, DEFAULT_PARAMS[k] as never);
    });
  }, [patch]);

  return (
    <motion.aside
      data-interactive
      initial={{ opacity: 0, x: -40, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -40 }}
      className="fixed left-3 top-20 z-[9400] max-h-[calc(100vh-7rem)] w-[min(330px,calc(100vw-24px))] overflow-y-auto p-3 font-mono"
      style={{
        color: theme.ink,
        background: `${theme.bg2}f2`,
        border: `1px solid ${theme.hud}`,
        boxShadow: `0 0 40px ${theme.glow}33, inset 0 0 30px ${theme.bg}`,
      }}
    >
      <header className="mb-3 flex items-start justify-between border-b pb-2" style={{ borderColor: `${theme.hud}55` }}>
        <div>
          <div className="text-xs font-bold tracking-[0.25em]">AGON // SIGNAL ENGINE</div>
          <div className="mt-0.5 text-[8px] uppercase tracking-widest opacity-50">acoustic organ · handle with gloves</div>
        </div>
        <button onClick={onClose} className="h-5 w-5 text-xs" style={{ border: `1px solid ${theme.hud}` }}>
          X
        </button>
      </header>

      <Scope theme={theme} live={live} />

      <div className="mt-3 grid grid-cols-2 gap-1 text-[9px] uppercase tracking-widest">
        <button
          onClick={onToggle}
          className="border px-1 py-2 font-bold"
          style={{
            borderColor: theme.glow,
            color: live ? theme.bg : theme.glow,
            background: live ? theme.glow : "transparent",
            textShadow: live ? "none" : `0 0 8px ${theme.glow}88`,
          }}
        >
          {live ? "◼ KILL SIGNAL" : "▶ TRANSMIT"}
        </button>
        <div className="flex items-center justify-center gap-1 border px-1" style={{ borderColor: `${theme.hud}55` }}>
          {WAVES.map((w) => (
            <button
              key={w.kind}
              title={w.kind}
              onClick={() => patch("wave", w.kind)}
              className="h-7 w-7 text-base leading-none"
              style={{
                border: `1px solid ${params.wave === w.kind ? theme.glow : `${theme.hud}44`}`,
                color: params.wave === w.kind ? theme.glow : theme.ink,
                background: params.wave === w.kind ? `${theme.glow}22` : "transparent",
              }}
            >
              {w.glyph}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-2.5">
        <Slider label="root drone" value={params.root} min={24} max={220} suffix="hz" onChange={(v) => patch("root", v)} />
        <Slider label="voice spread" value={params.spread} min={0} max={40} suffix="ct" onChange={(v) => patch("spread", v)} />
        <Slider label="filter aperture" value={params.cutoff} min={60} max={6000} suffix="hz" onChange={(v) => patch("cutoff", v)} />
        <Slider label="resonant scream" value={params.res} min={0.5} max={24} step={0.5} onChange={(v) => patch("res", v)} />
        <Slider label="lfo pulse" value={params.lfoRate} min={0.05} max={12} step={0.05} suffix="hz" onChange={(v) => patch("lfoRate", v)} />
        <Slider label="lfo depth" value={params.lfoDepth} min={0} max={1} step={0.01} onChange={(v) => patch("lfoDepth", v)} />
        <Slider label="drive / teeth" value={params.drive} min={0} max={1} step={0.01} onChange={(v) => patch("drive", v)} />
        <Slider label="static bed" value={params.noise} min={0} max={1} step={0.01} onChange={(v) => patch("noise", v)} />
        <Slider label="output pressure" value={params.volume} min={0} max={1} step={0.01} onChange={(v) => patch("volume", v)} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1 text-[8px] uppercase tracking-widest">
        <button onClick={randomize} className="border px-1 py-2" style={{ borderColor: theme.hud }}>
          possess
        </button>
        <button onClick={reset} className="border px-1 py-2" style={{ borderColor: theme.hud }}>
          exorcise
        </button>
      </div>

      <div className="mt-3 border p-2 text-[8px] uppercase leading-relaxed tracking-wider opacity-60" style={{ borderColor: `${theme.hud}44` }}>
        keys 1–8 strike the signal ladder · M and R emit transmissions · the browser keeps the machine mute until you touch it
      </div>
    </motion.aside>
  );
}
