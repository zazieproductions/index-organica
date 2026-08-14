import { useEffect, useRef, useState, useMemo, memo } from "react";
import { motion } from "framer-motion";
import type { Theme } from "../lib/themes";
import { RNG } from "../lib/rng";
import { SpecimenSVG, SPECIMEN_TYPES, type SpecimenType } from "./Specimen";
import { Anomaly, ANOMALY_TYPES, type AnomalyType } from "./Anomalies";
import { InteractiveRelic, RELIC_FORMS, type RelicForm } from "./Relic3D";

const BAND = 720;
const TOTAL_BANDS = 500;
const FILTERS = [undefined, "melt", "warp", "glitch"] as const;

interface CardData {
  id: string;
  type: SpecimenType;
  x: number; // %
  y: number; // px within band
  size: number;
  rot: number;
  filter?: string;
  depth: number; // parallax factor
  blend: string;
}

interface BandData {
  cards: CardData[];
  anomaly: { type: AnomalyType; x: number; y: number; seed: number } | null;
  relic: { form: RelicForm; x: number; y: number; size: number; seed: number } | null;
  sigil: { glyph: string; x: number; y: number; size: number } | null;
}

const GLYPHS = "☉☽✶✷❖◈⟁⌬⏣⎔◉⊛⊕⍟⧉⨀⟠⌖".split("");

const BAND_CACHE = new Map<string, BandData>();

function buildBand(seed: number, band: number): BandData {
  const key = `${seed}:${band}`;
  const cached = BAND_CACHE.get(key);
  if (cached) return cached;
  const rng = new RNG(key);
  const count = rng.int(4, 7);
  const cards: CardData[] = [];
  for (let i = 0; i < count; i++) {
    cards.push({
      id: `${band}-${i}`,
      type: rng.pick(SPECIMEN_TYPES),
      x: rng.float(4, 78),
      y: rng.float(20, BAND - 200),
      size: rng.float(90, 320),
      rot: rng.float(-14, 14),
      filter: rng.chance(0.35) ? rng.pick(FILTERS.filter((f) => f) as string[]) : undefined,
      depth: rng.float(-0.15, 0.25),
      blend: rng.pick(["normal", "screen", "screen", "difference", "exclusion"]),
    });
  }
  const anomaly = rng.chance(0.22)
    ? { type: rng.pick(ANOMALY_TYPES), x: rng.float(15, 60), y: rng.float(60, BAND - 300), seed: rng.int(0, 99999) }
    : null;
  const relic = band % 4 === 0 || rng.chance(0.22)
    ? { form: rng.pick(RELIC_FORMS), x: rng.float(6, 58), y: rng.float(80, BAND - 330), size: rng.float(210, 340), seed: rng.int(0, 99999) }
    : null;
  const sigil = rng.chance(0.5)
    ? { glyph: rng.pick(GLYPHS), x: rng.float(0, 90), y: rng.float(0, BAND), size: rng.float(40, 160) }
    : null;
  const result = { cards, anomaly, relic, sigil };
  if (BAND_CACHE.size > 400) BAND_CACHE.clear();
  BAND_CACHE.set(key, result);
  return result;
}

interface CardProps {
  data: CardData;
  theme: Theme;
  frozen: boolean;
  diagnostic: boolean;
  seed: number;
  scrollY: number;
  bandTop: number;
  onOpen: (x: number, y: number) => void;
}

const SpecimenCard = memo(function SpecimenCard({ data, theme, frozen, diagnostic, seed, scrollY, bandTop, onOpen }: CardProps) {
  const parY = frozen ? 0 : (scrollY - bandTop) * data.depth;
  return (
    <motion.div
      data-interactive
      className="group absolute cursor-pointer"
      style={{
        left: `${data.x}%`,
        top: data.y,
        width: data.size,
        height: data.size,
        transform: `translateY(${parY}px) rotate(${data.rot}deg)`,
        mixBlendMode: data.blend as React.CSSProperties["mixBlendMode"],
      }}
      whileHover={frozen ? {} : { scale: 1.12, rotate: 0, zIndex: 50 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      onClick={(e) => onOpen(e.clientX, e.clientY)}
    >
      {/* ghost duplicate revealed on hover (split / layers) */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-70 group-hover:[filter:url(#glitch)]" style={{ transform: "translate(8px,8px) scale(1.04)", mixBlendMode: "screen" }}>
        <SpecimenSVG seed={data.id + "g"} type={data.type} colors={theme.colors} ink={theme.glow} showFrame={false} />
      </div>
      <div className="absolute inset-0 transition-all duration-500 group-hover:[filter:url(#warp)]">
        <SpecimenSVG seed={`${seed}${data.id}`} type={data.type} colors={theme.colors} ink={theme.ink} filterId={data.filter} />
      </div>
      {/* melting reveal from bottom on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-90 group-hover:[filter:url(#melt)]" style={{ mixBlendMode: "difference" }}>
        <SpecimenSVG seed={data.id + "m"} type={data.type} colors={[theme.glow]} ink={theme.glow} showFrame={false} />
      </div>
      {diagnostic && (
        <div className="pointer-events-none absolute inset-0 font-mono text-[8px]" style={{ border: `1px solid ${theme.hud}`, color: theme.hud }}>
          <span className="absolute left-0 top-0 bg-black/60 px-0.5">{data.type}</span>
          <span className="absolute bottom-0 right-0 bg-black/60 px-0.5">d{data.depth.toFixed(2)}</span>
        </div>
      )}
    </motion.div>
  );
});

interface FieldProps {
  seed: number;
  theme: Theme;
  frozen: boolean;
  diagnostic: boolean;
  reduced: boolean;
  onOpen: (x: number, y: number) => void;
}

export function InfiniteField({ seed, theme, frozen, diagnostic, reduced, onOpen }: FieldProps) {
  const [scrollY, setScrollY] = useState(0);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 800);
  const raf = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      if (raf.current) return;
      raf.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        raf.current = 0;
      });
    };
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const startBand = Math.max(0, Math.floor(scrollY / BAND) - 1);
  const endBand = Math.min(TOTAL_BANDS - 1, Math.ceil((scrollY + vh) / BAND) + 1);

  const bands = useMemo(() => {
    const arr: { index: number; data: BandData }[] = [];
    for (let b = startBand; b <= endBand; b++) arr.push({ index: b, data: buildBand(seed, b) });
    return arr;
  }, [seed, startBand, endBand]);

  return (
    <div className="relative w-full" style={{ height: TOTAL_BANDS * BAND }}>
      {bands.map(({ index, data }) => {
        const bandTop = index * BAND;
        return (
          <div key={index} className="absolute left-0 w-full" style={{ top: bandTop, height: BAND }}>
            {data.sigil && (
              <div
                className="pointer-events-none absolute select-none"
                style={{
                  left: `${data.sigil.x}%`,
                  top: data.sigil.y,
                  fontSize: data.sigil.size,
                  color: theme.ink,
                  opacity: 0.08,
                  transform: `translateY(${frozen ? 0 : (scrollY - bandTop) * 0.05}px)`,
                }}
              >
                {data.sigil.glyph}
              </div>
            )}
            {data.anomaly && (
              <div
                className="absolute"
                style={{ left: `${data.anomaly.x}%`, top: data.anomaly.y, transform: `translateY(${frozen ? 0 : (scrollY - bandTop) * 0.12}px)` }}
              >
                <Anomaly type={data.anomaly.type} theme={theme} seed={data.anomaly.seed} frozen={frozen || reduced} />
              </div>
            )}
            {data.relic && (
              <div
                className="absolute"
                style={{
                  left: `${data.relic.x}%`,
                  top: data.relic.y,
                  width: `min(${data.relic.size}px, 72vw)`,
                  height: `min(${data.relic.size}px, 72vw)`,
                  transform: `translateY(${frozen ? 0 : (scrollY - bandTop) * -0.08}px)`,
                  mixBlendMode: "screen",
                }}
              >
                <InteractiveRelic
                  theme={theme}
                  seed={data.relic.seed}
                  form={data.relic.form}
                  frozen={frozen}
                  reduced={reduced}
                  compact
                />
              </div>
            )}
            {data.cards.map((c) => (
              <SpecimenCard key={c.id} data={c} theme={theme} frozen={frozen} diagnostic={diagnostic} seed={seed} scrollY={scrollY} bandTop={bandTop} onOpen={onOpen} />
            ))}
            {diagnostic && (
              <div className="pointer-events-none absolute left-2 top-2 font-mono text-[9px]" style={{ color: theme.hud, opacity: 0.6 }}>
                BAND {index.toString().padStart(4, "0")} · {(bandTop).toFixed(0)}px · {data.cards.length} OBJ
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { BAND };
