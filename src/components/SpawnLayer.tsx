import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Theme } from "../lib/themes";
import { RNG } from "../lib/rng";
import { SpecimenSVG, SPECIMEN_TYPES, GLYPHS } from "./Specimen";

const FRAGMENTS = [
  "IT REMEMBERS YOU",
  "DO NOT FEED THE ARCHIVE",
  "SPECIMEN STABLE",
  "signal degraded",
  "the map breathes",
  "ERROR 0x00FLESH",
  "we were here first",
  "recursion detected",
  "▓▓ VOID ▓▓",
  "keep scrolling",
  "you are being indexed",
  "organ 44 missing",
  "sanctified / corrupted",
  "the eye opens downward",
];

interface Spawn {
  id: number;
  x: number;
  y: number;
  kind: "sigil" | "ripple" | "text" | "swarm";
  data: unknown;
}

let uid = 0;

interface Props {
  theme: Theme;
  seed: number;
  reduced: boolean;
  frozen: boolean;
}

export function SpawnLayer({ theme, seed, reduced, frozen }: Props) {
  const [spawns, setSpawns] = useState<Spawn[]>([]);

  const remove = useCallback((id: number) => {
    setSpawns((s) => s.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (frozen) return;
      const el = e.target as HTMLElement;
      if (el.closest("[data-interactive]")) return; // don't spawn over windows/buttons
      const rng = new RNG(`${seed}-${e.clientX}-${e.clientY}-${uid}`);
      const r = rng.float(0, 1);
      let kind: Spawn["kind"];
      if (r < 0.34) kind = "ripple";
      else if (r < 0.6) kind = "sigil";
      else if (r < 0.82) kind = "text";
      else kind = "swarm";
      let data: unknown;
      if (kind === "sigil") data = { glyph: rng.pick(GLYPHS), rot: rng.float(-40, 40), color: rng.pick(theme.colors) };
      else if (kind === "text") data = { text: rng.pick(FRAGMENTS), color: rng.pick(theme.colors) };
      else if (kind === "swarm")
        data = Array.from({ length: reduced ? 3 : rng.int(5, 9) }, () => ({
          type: rng.pick(SPECIMEN_TYPES),
          dx: rng.float(-120, 120),
          dy: rng.float(-120, 120),
          s: rng.float(24, 54),
          seed: rng.int(0, 99999).toString(),
        }));
      else data = { color: rng.pick(theme.colors) };
      const id = ++uid;
      setSpawns((s) => [...s.slice(-24), { id, x: e.clientX, y: e.clientY, kind, data }]);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [theme, seed, reduced, frozen]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9990]">
      <AnimatePresence>
        {spawns.map((sp) => {
          if (sp.kind === "ripple") {
            const d = sp.data as { color: string };
            return (
              <motion.div
                key={sp.id}
                className="absolute rounded-full border"
                style={{ left: sp.x, top: sp.y, borderColor: d.color, mixBlendMode: "screen" }}
                initial={{ width: 8, height: 8, x: -4, y: -4, opacity: 0.9 }}
                animate={{ width: 260, height: 260, x: -130, y: -130, opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                onAnimationComplete={() => remove(sp.id)}
              />
            );
          }
          if (sp.kind === "sigil") {
            const d = sp.data as { glyph: string; rot: number; color: string };
            return (
              <motion.div
                key={sp.id}
                className="absolute select-none"
                style={{ left: sp.x, top: sp.y, color: d.color, fontSize: 64, textShadow: `0 0 20px ${d.color}` }}
                initial={{ opacity: 0, scale: 0.2, rotate: d.rot - 90, x: -32, y: -32 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.2, 1.4, 1.2, 2], rotate: d.rot + 90 }}
                transition={{ duration: 2.2, ease: "easeOut" }}
                onAnimationComplete={() => remove(sp.id)}
              >
                {d.glyph}
              </motion.div>
            );
          }
          if (sp.kind === "text") {
            const d = sp.data as { text: string; color: string };
            return (
              <motion.div
                key={sp.id}
                className="absolute select-none whitespace-nowrap font-mono text-sm uppercase tracking-widest"
                style={{ left: sp.x, top: sp.y, color: d.color }}
                initial={{ opacity: 0, y: 0, x: -20, filter: "blur(4px)" }}
                animate={{ opacity: [0, 1, 1, 0], y: -70, filter: "blur(0px)" }}
                transition={{ duration: 2.6 }}
                onAnimationComplete={() => remove(sp.id)}
              >
                {d.text}
              </motion.div>
            );
          }
          // swarm
          const items = sp.data as { type: (typeof SPECIMEN_TYPES)[number]; dx: number; dy: number; s: number; seed: string }[];
          return (
            <div key={sp.id} className="absolute" style={{ left: sp.x, top: sp.y }}>
              {items.map((it, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{ width: it.s, height: it.s }}
                  initial={{ opacity: 0, x: -it.s / 2, y: -it.s / 2, scale: 0.2 }}
                  animate={{ opacity: [0, 1, 0], x: it.dx, y: it.dy, scale: [0.2, 1, 0.6], rotate: it.dx }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  onAnimationComplete={() => i === 0 && remove(sp.id)}
                >
                  <SpecimenSVG seed={it.seed} type={it.type} colors={theme.colors} ink={theme.ink} showFrame={false} />
                </motion.div>
              ))}
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
