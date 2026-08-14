import { useEffect, useState } from "react";
import type { Theme } from "../lib/themes";

interface Props {
  theme: Theme;
  frozen: boolean;
  diagnostic: boolean;
  seed: number;
  actions: {
    mutate: () => void;
    regen: () => void;
    freeze: () => void;
    diag: () => void;
    window: () => void;
    colors: () => void;
    relic: () => void;
  };
}

export function HUD({ theme, frozen, diagnostic, seed, actions }: Props) {
  const [depth, setDepth] = useState(0);
  const [time, setTime] = useState("");
  useEffect(() => {
    const onS = () => setDepth(window.scrollY);
    window.addEventListener("scroll", onS, { passive: true });
    const t = setInterval(() => {
      const d = new Date();
      setTime(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`);
    }, 1000);
    return () => {
      window.removeEventListener("scroll", onS);
      clearInterval(t);
    };
  }, []);

  const keys: [string, string, () => void][] = [
    ["M", "MUTATE", actions.mutate],
    ["R", "REGEN", actions.regen],
    ["S", frozen ? "RESUME" : "FREEZE", actions.freeze],
    ["D", "DIAG", actions.diag],
    ["C", "COLOR", actions.colors],
    ["G", "3D", actions.relic],
    ["+", "WINDOW", actions.window],
  ];

  return (
    <>
      {/* top bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[9200] flex items-start justify-between p-3 font-mono text-[11px]" style={{ color: theme.hud }}>
        <div className="pointer-events-auto" data-interactive>
          <div className="flex items-center gap-2">
            <span className="flicker text-lg leading-none">⊛</span>
            <span className="text-sm font-bold tracking-[0.3em]">LIVING&nbsp;ARCHIVE</span>
          </div>
          <div className="mt-1 opacity-70">
            SYS://organism.<span style={{ color: theme.glow }}>{theme.name}</span>
          </div>
          <div className="opacity-50">seed {seed.toString(16).toUpperCase().padStart(6, "0")} · idx unbounded</div>
        </div>
        <div className="pointer-events-auto text-right" data-interactive>
          <div className="opacity-70">{time} UTC±?</div>
          <div className="opacity-50">DEPTH {Math.round(depth).toString().padStart(6, "0")}</div>
          <div className="mt-0.5 flex items-center justify-end gap-1">
            {frozen && <span className="animate-pulse" style={{ color: theme.glow }}>◼ FROZEN</span>}
            {diagnostic && <span style={{ color: theme.glow }}>▦ DIAG</span>}
            {!frozen && !diagnostic && <span className="opacity-60">● SCANNING</span>}
          </div>
        </div>
      </div>

      {/* corner brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => (
        <div
          key={c}
          className="pointer-events-none fixed z-[9200] h-6 w-6"
          style={{
            top: c[0] === "t" ? 8 : undefined,
            bottom: c[0] === "b" ? 8 : undefined,
            left: c[1] === "l" ? 8 : undefined,
            right: c[1] === "r" ? 8 : undefined,
            borderTop: c[0] === "t" ? `1px solid ${theme.hud}` : undefined,
            borderBottom: c[0] === "b" ? `1px solid ${theme.hud}` : undefined,
            borderLeft: c[1] === "l" ? `1px solid ${theme.hud}` : undefined,
            borderRight: c[1] === "r" ? `1px solid ${theme.hud}` : undefined,
            opacity: 0.6,
          }}
        />
      ))}

      {/* control cluster (also mobile) */}
      <div className="pointer-events-auto fixed bottom-3 left-1/2 z-[9200] flex max-w-[calc(100vw-16px)] -translate-x-1/2 gap-1 overflow-x-auto font-mono text-[10px]" data-interactive>
        {keys.map(([k, label, fn]) => (
          <button
            key={k}
            onClick={fn}
            className="flex min-w-10 flex-col items-center px-2 py-1 transition-colors"
            style={{ border: `1px solid ${theme.hud}66`, color: theme.hud, background: `${theme.bg2}cc` }}
          >
            <span className="text-sm font-bold" style={{ color: theme.glow }}>{k}</span>
            <span className="opacity-60 text-[8px] tracking-widest">{label}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function BootOverlay({ theme, onDone }: { theme: Theme; onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const seq = [
      "INITIALIZING ARCHIVE DAEMON...",
      "mounting /dev/organism ... OK",
      "loading symbolic index ... 44%",
      "loading symbolic index ... 91%",
      "WARNING: index is not empty",
      "WARNING: something is already here",
      "calibrating retina ... OK",
      "the archive is now watching.",
    ];
    let i = 0;
    const iv = setInterval(() => {
      setLines((l) => [...l, seq[i]]);
      i++;
      if (i >= seq.length) {
        clearInterval(iv);
        setTimeout(() => {
          setGone(true);
          setTimeout(onDone, 700);
        }, 900);
      }
    }, 260);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9600] flex items-center justify-center font-mono transition-opacity duration-700"
      style={{ background: theme.bg, color: theme.ink, opacity: gone ? 0 : 1 }}
    >
      <div className="w-[min(90vw,520px)] text-[12px]">
        <div className="mb-3 text-2xl tracking-[0.3em]" style={{ color: theme.glow }}>⊛ LIVING ARCHIVE</div>
        {lines.map((l, i) => (
          <div key={i} className={i > 3 ? "" : "opacity-70"} style={{ color: l.startsWith("WARNING") ? theme.glow : undefined }}>
            {"> "}
            {l}
          </div>
        ))}
        <span className="animate-pulse">_</span>
      </div>
    </div>
  );
}
