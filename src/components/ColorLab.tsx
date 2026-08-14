import { motion } from "framer-motion";
import { DEFAULT_TUNING, THEMES, type ColorTuning, type Theme } from "../lib/themes";

interface Props {
  theme: Theme;
  themeIndex: number;
  tuning: ColorTuning;
  onTheme: (index: number) => void;
  onTuning: (tuning: ColorTuning) => void;
  onClose: () => void;
}

function RangeControl({
  label,
  value,
  min,
  max,
  onChange,
  suffix = "%",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-[9px] uppercase tracking-widest opacity-70">
        <span>{label}</span>
        <span>{value}{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="chromatic-range block w-full"
      />
    </label>
  );
}

export function ColorLab({ theme, themeIndex, tuning, onTheme, onTuning, onClose }: Props) {
  const patch = (next: Partial<ColorTuning>) => onTuning({ ...tuning, ...next });
  const randomize = () => {
    onTheme(Math.floor(Math.random() * THEMES.length));
    onTuning({
      hue: Math.floor(Math.random() * 361) - 180,
      saturation: Math.floor(Math.random() * 130) + 35,
      luminance: Math.floor(Math.random() * 75) + 55,
      accent: Math.random() > 0.55 ? `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}` : null,
      background: null,
      inverted: Math.random() > 0.85,
    });
  };

  return (
    <motion.aside
      data-interactive
      initial={{ opacity: 0, x: 40, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed right-3 top-20 z-[9400] max-h-[calc(100vh-7rem)] w-[min(330px,calc(100vw-24px))] overflow-y-auto p-3 font-mono"
      style={{
        color: theme.ink,
        background: `${theme.bg2}f2`,
        border: `1px solid ${theme.hud}`,
        boxShadow: `0 0 40px ${theme.glow}33, inset 0 0 30px ${theme.bg}`,
      }}
    >
      <header className="mb-3 flex items-start justify-between border-b pb-2" style={{ borderColor: `${theme.hud}55` }}>
        <div>
          <div className="text-xs font-bold tracking-[0.25em]">CHROMATIC ORGAN</div>
          <div className="mt-0.5 text-[8px] uppercase tracking-widest opacity-50">live spectral intervention</div>
        </div>
        <button onClick={onClose} className="h-5 w-5 text-xs" style={{ border: `1px solid ${theme.hud}` }}>X</button>
      </header>

      <div className="grid grid-cols-6 gap-1.5">
        {THEMES.map((preset, index) => (
          <button
            key={preset.name}
            aria-label={preset.name}
            title={preset.name}
            onClick={() => onTheme(index)}
            className="relative aspect-square transition-transform hover:scale-110"
            style={{
              background: `conic-gradient(${preset.colors.join(",")})`,
              border: index === themeIndex ? `2px solid ${theme.ink}` : `1px solid ${theme.hud}55`,
            }}
          >
            {index === themeIndex && <span className="absolute inset-1" style={{ border: `1px solid ${theme.bg}` }} />}
          </button>
        ))}
      </div>
      <div className="mt-1 truncate text-[8px] uppercase tracking-[0.2em] opacity-60">preset: {THEMES[themeIndex].name}</div>

      <div className="mt-4 space-y-3">
        <RangeControl label="spectrum shift" value={tuning.hue} min={-180} max={180} suffix="deg" onChange={(hue) => patch({ hue })} />
        <RangeControl label="signal saturation" value={tuning.saturation} min={0} max={220} onChange={(saturation) => patch({ saturation })} />
        <RangeControl label="luminous pressure" value={tuning.luminance} min={35} max={160} onChange={(luminance) => patch({ luminance })} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="text-[8px] uppercase tracking-widest opacity-70">
          signal color
          <span className="mt-1 flex items-center gap-2 border p-1" style={{ borderColor: `${theme.hud}55` }}>
            <input
              type="color"
              value={tuning.accent ?? theme.glow}
              onChange={(event) => patch({ accent: event.target.value })}
              className="h-6 w-8 border-0 bg-transparent p-0"
            />
            <span>{tuning.accent ?? "AUTO"}</span>
          </span>
        </label>
        <label className="text-[8px] uppercase tracking-widest opacity-70">
          void color
          <span className="mt-1 flex items-center gap-2 border p-1" style={{ borderColor: `${theme.hud}55` }}>
            <input
              type="color"
              value={tuning.background ?? theme.bg}
              onChange={(event) => patch({ background: event.target.value })}
              className="h-6 w-8 border-0 bg-transparent p-0"
            />
            <span>{tuning.background ?? "AUTO"}</span>
          </span>
        </label>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-2 text-[7px] uppercase tracking-widest opacity-70">
        <button onClick={() => patch({ accent: null })} className="border py-1" style={{ borderColor: `${theme.hud}55` }}>signal auto</button>
        <button onClick={() => patch({ background: null })} className="border py-1" style={{ borderColor: `${theme.hud}55` }}>void auto</button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 text-[8px] uppercase tracking-widest">
        <button onClick={() => patch({ inverted: !tuning.inverted })} className="border px-1 py-2" style={{ borderColor: theme.hud, background: tuning.inverted ? `${theme.glow}44` : "transparent" }}>
          {tuning.inverted ? "normal" : "invert"}
        </button>
        <button onClick={randomize} className="border px-1 py-2" style={{ borderColor: theme.hud }}>random</button>
        <button onClick={() => onTuning({ ...DEFAULT_TUNING })} className="border px-1 py-2" style={{ borderColor: theme.hud }}>reset</button>
      </div>

      <div className="mt-3 flex h-8 overflow-hidden border" style={{ borderColor: `${theme.hud}55` }}>
        {theme.colors.map((color, index) => <span key={index} className="h-full flex-1" style={{ background: color }} />)}
      </div>
    </motion.aside>
  );
}