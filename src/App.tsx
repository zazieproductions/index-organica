import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { DEFAULT_TUNING, THEMES, mutateThemeIndex, tuneTheme, type ColorTuning } from "./lib/themes";
import { SvgFilters } from "./components/SvgFilters";
import { InfiniteField } from "./components/InfiniteField";
import { CustomCursor } from "./components/CustomCursor";
import { NoiseOverlay, ScanlinesVignette } from "./components/Overlays";
import { SpawnLayer } from "./components/SpawnLayer";
import { WindowLayer, useWindowManager, type WinDef } from "./components/Windows";
import { HUD, BootOverlay } from "./components/HUD";
import { ColorLab } from "./components/ColorLab";
import { SignalEngine } from "./components/SignalEngine";
import { engine } from "./lib/audio";

function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(mq.matches);
    const on = () => setR(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return r;
}

const WIN_KINDS: WinDef["kind"][] = ["portal", "micro", "warning", "diagram", "specimen", "relic3d"];

export default function App() {
  const reduced = usePrefersReducedMotion();
  const [themeIndex, setThemeIndex] = useState(0);
  const [tuning, setTuning] = useState<ColorTuning>({ ...DEFAULT_TUNING });
  const [colorLabOpen, setColorLabOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(true);
  const [audioLive, setAudioLive] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffff));
  const [frozen, setFrozen] = useState(false);
  const [diagnostic, setDiagnostic] = useState(false);
  const [booted, setBooted] = useState(false);
  const [flash, setFlash] = useState(false);
  const theme = useMemo(() => tuneTheme(THEMES[themeIndex], tuning), [themeIndex, tuning]);
  const { wins, open, close, closeAll, focus } = useWindowManager();
  const kindCounter = useRef(0);

  // apply background to body
  useEffect(() => {
    document.documentElement.style.setProperty("--arch-bg", theme.bg);
    document.documentElement.style.setProperty("--signal", theme.glow);
    document.body.style.background = `radial-gradient(120% 80% at 50% 0%, ${theme.bg2}, ${theme.bg} 70%)`;
  }, [theme]);

  const mutate = useCallback(() => {
    setThemeIndex((i) => {
      const next = mutateThemeIndex(i, Math.random());
      engine.retune(next);
      return next;
    });
    engine.blip(2, true);
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
  }, []);
  const regen = useCallback(() => {
    setSeed(Math.floor(Math.random() * 0xffffff));
    engine.blip(5, true);
    setFlash(true);
    setTimeout(() => setFlash(false), 180);
  }, []);
  const freeze = useCallback(() => setFrozen((f) => !f), []);
  const diag = useCallback(() => setDiagnostic((d) => !d), []);
  const toggleColorLab = useCallback(() => setColorLabOpen((open) => !open), []);
  const toggleAudioPanel = useCallback(() => setAudioOpen((open) => !open), []);
  const toggleAudioLive = useCallback(() => {
    if (engine.running) {
      void engine.stop();
      setAudioLive(false);
    } else {
      void engine.start().then(() => setAudioLive(true));
    }
  }, []);

  const openWindow = useCallback(
    (kind?: WinDef["kind"], at?: { x: number; y: number }) => {
      const k = kind ?? WIN_KINDS[kindCounter.current++ % WIN_KINDS.length];
      open(k, at);
    },
    [open]
  );

  const spawnFromCard = useCallback(
    (x: number, y: number) => {
      const k = WIN_KINDS[Math.floor(Math.random() * WIN_KINDS.length)];
      const px = Math.min(Math.max(x - 110, 10), Math.max(10, window.innerWidth - 330));
      const py = Math.min(Math.max(y - 40, 60), window.innerHeight - 260);
      open(k, { x: px, y: py });
    },
    [open]
  );

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Escape") {
        closeAll();
        setColorLabOpen(false);
        return;
      }
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (k === "m") mutate();
      else if (k === "r") regen();
      else if (k === "s") freeze();
      else if (k === "d") diag();
      else if (k === "c") toggleColorLab();
      else if (k === "g") openWindow("relic3d");
      else if (k === "a") toggleAudioPanel();
      else if (k >= "1" && k <= "8") engine.blip(Number(k) - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mutate, regen, freeze, diag, toggleColorLab, toggleAudioPanel, openWindow, closeAll]);

  // seed a couple of windows after boot
  useEffect(() => {
    if (!booted) return;
    const t1 = setTimeout(() => openWindow("micro", { x: Math.max(10, window.innerWidth - 280), y: 90 }), 400);
    const t2 = setTimeout(() => openWindow("warning", { x: 30, y: Math.max(70, window.innerHeight - 260) }), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [booted, openWindow]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden" style={{ color: theme.ink }}>
      <SvgFilters seed={seed} diagnostic={diagnostic} />

      <InfiniteField seed={seed} theme={theme} frozen={frozen} diagnostic={diagnostic} reduced={reduced} onOpen={spawnFromCard} />

      <WindowLayer wins={wins} theme={theme} frozen={frozen} reduced={reduced} onClose={close} onFocus={focus} />
      <SpawnLayer theme={theme} seed={seed} reduced={reduced} frozen={frozen} />

      <NoiseOverlay reduced={reduced} />
      <ScanlinesVignette theme={theme} diagnostic={diagnostic} />

      {!reduced && <CustomCursor theme={theme} reduced={reduced} diagnostic={diagnostic} />}

      <HUD
        theme={theme}
        frozen={frozen}
        diagnostic={diagnostic}
        seed={seed}
        actions={{ mutate, regen, freeze, diag, window: () => openWindow(), colors: toggleColorLab, relic: () => openWindow("relic3d"), audio: toggleAudioPanel }}
        audioLive={audioLive}
      />

      {audioOpen && (
        <SignalEngine theme={theme} live={audioLive} onToggle={toggleAudioLive} onClose={() => setAudioOpen(false)} />
      )}

      {colorLabOpen && (
        <ColorLab
          theme={theme}
          themeIndex={themeIndex}
          tuning={tuning}
          onTheme={setThemeIndex}
          onTuning={setTuning}
          onClose={() => setColorLabOpen(false)}
        />
      )}

      {/* mutation flash */}
      {flash && (
        <div className="pointer-events-none fixed inset-0 z-[9700]" style={{ background: theme.glow, mixBlendMode: "difference", opacity: 0.5 }} />
      )}

      {/* frozen tint */}
      {frozen && <div className="pointer-events-none fixed inset-0 z-[8800]" style={{ background: `${theme.bg}22`, backdropFilter: "grayscale(0.4)" }} />}

      {!booted && <BootOverlay theme={theme} onDone={() => setBooted(true)} />}

      {/* bottom void marker */}
      <div className="pointer-events-none fixed bottom-16 left-1/2 z-[9100] -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.4em]" style={{ color: theme.hud, opacity: 0.4 }}>
        ▼ the archive continues ▼
      </div>
    </div>
  );
}
