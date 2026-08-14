import { motion } from "framer-motion";
import type { Theme } from "../lib/themes";
import { RNG } from "../lib/rng";

export const STOCK_PHOTOS = [
  "https://images.pexels.com/photos/10069427/pexels-photo-10069427.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/15389252/pexels-photo-15389252.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/10044368/pexels-photo-10044368.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  "https://images.pexels.com/photos/10044351/pexels-photo-10044351.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
];

export const ANOMALY_TYPES = ["eye", "moon", "skeleton", "burning", "stock"] as const;
export type AnomalyType = (typeof ANOMALY_TYPES)[number];

interface Props {
  type: AnomalyType;
  theme: Theme;
  seed: number;
  frozen: boolean;
}

export function Anomaly({ type, theme, seed, frozen }: Props) {
  const rng = new RNG("anom" + seed);

  if (type === "eye") {
    const look = rng.float(-6, 6);
    return (
      <motion.div
        className="pointer-events-none relative"
        style={{ width: "min(70vw, 620px)", aspectRatio: "2/1", mixBlendMode: "screen" }}
        animate={frozen ? {} : { scale: [1, 1.03, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <svg viewBox="0 0 200 100" className="h-full w-full" style={{ filter: "url(#melt)" }}>
          <path d="M4 50 Q100 -6 196 50 Q100 106 4 50 Z" fill="none" stroke={theme.ink} strokeWidth={1.5} />
          <path d="M4 50 Q100 -6 196 50 Q100 106 4 50 Z" fill={theme.bg2} opacity={0.6} />
          <circle cx={100 + look} cy={50} r={34} fill={theme.colors[0]} opacity={0.35} />
          <circle cx={100 + look} cy={50} r={34} fill="none" stroke={theme.ink} strokeWidth={1} />
          {Array.from({ length: 40 }).map((_, i) => {
            const a = (i / 40) * Math.PI * 2;
            return <line key={i} x1={100 + look + Math.cos(a) * 8} y1={50 + Math.sin(a) * 8} x2={100 + look + Math.cos(a) * 34} y2={50 + Math.sin(a) * 34} stroke={rng.pick(theme.colors)} strokeWidth={0.4} opacity={0.6} />;
          })}
          <circle cx={100 + look} cy={50} r={13} fill="#000" />
          <circle cx={100 + look + 3} cy={47} r={4} fill="#fff" opacity={0.8} />
        </svg>
      </motion.div>
    );
  }

  if (type === "moon") {
    return (
      <motion.div
        className="pointer-events-none"
        style={{ width: "min(46vw, 380px)", aspectRatio: "1", mixBlendMode: "screen" }}
        animate={frozen ? {} : { rotate: 360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx={50} cy={50} r={44} fill={theme.colors[2]} opacity={0.25} />
          <circle cx={50} cy={50} r={44} fill="none" stroke={theme.ink} strokeWidth={0.6} />
          {Array.from({ length: rng.int(14, 26) }).map((_, i) => {
            const x = rng.float(12, 88), y = rng.float(12, 88);
            const d = Math.hypot(x - 50, y - 50);
            if (d > 42) return null;
            return <circle key={i} cx={x} cy={y} r={rng.float(1, 7)} fill="none" stroke={theme.ink} strokeWidth={0.4} opacity={0.5} />;
          })}
        </svg>
      </motion.div>
    );
  }

  if (type === "skeleton") {
    return (
      <motion.div
        className="pointer-events-none"
        style={{ width: "min(30vw, 240px)", aspectRatio: "1/2", mixBlendMode: "screen", opacity: 0.5 }}
        animate={frozen ? {} : { y: [0, -14, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
      >
        <svg viewBox="0 0 60 120" className="h-full w-full" style={{ filter: "url(#blur-soft)" }}>
          <g fill="none" stroke={theme.ink} strokeWidth={1.4} opacity={0.85}>
            <circle cx={30} cy={16} r={11} />
            <line x1={30} y1={27} x2={30} y2={74} />
            {Array.from({ length: 7 }).map((_, i) => (
              <path key={i} d={`M30 ${34 + i * 5} Q${18 - i} ${37 + i * 5} 15 ${40 + i * 5}`} />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <path key={"r" + i} d={`M30 ${34 + i * 5} Q${42 + i} ${37 + i * 5} 45 ${40 + i * 5}`} />
            ))}
            <line x1={30} y1={40} x2={8} y2={62} />
            <line x1={30} y1={40} x2={52} y2={62} />
            <line x1={30} y1={74} x2={18} y2={110} />
            <line x1={30} y1={74} x2={42} y2={110} />
          </g>
        </svg>
      </motion.div>
    );
  }

  if (type === "burning") {
    return (
      <motion.div
        className="pointer-events-none relative"
        style={{ width: "min(40vw, 320px)", aspectRatio: "1", mixBlendMode: "screen" }}
        animate={frozen ? {} : { filter: ["hue-rotate(0deg)", "hue-rotate(30deg)", "hue-rotate(0deg)"] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full" style={{ filter: "url(#warp)" }}>
          <defs>
            <radialGradient id={"fire" + seed}>
              <stop offset="0%" stopColor="#fff8a0" />
              <stop offset="40%" stopColor="#ff7a00" />
              <stop offset="100%" stopColor="#7a0000" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={50} cy={55} r={44} fill={`url(#fire${seed})`} opacity={0.8} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <path key={i} d={`M50 55 L${50 + Math.cos(a) * 40} ${55 + Math.sin(a) * 40}`} stroke="#ffcc00" strokeWidth={1} opacity={0.5} />;
          })}
          <path d={`M30 40 h40 v30 h-40 Z`} fill="none" stroke="#301500" strokeWidth={1.4} />
        </svg>
      </motion.div>
    );
  }

  // stock — oddly normal
  const src = STOCK_PHOTOS[seed % STOCK_PHOTOS.length];
  return (
    <div className="pointer-events-none relative" style={{ width: "min(46vw, 400px)" }}>
      <div className="relative overflow-hidden" style={{ border: `10px solid #e8dcc0`, boxShadow: "0 10px 40px rgba(0,0,0,0.6)", transform: `rotate(${rng.float(-4, 4)}deg)` }}>
        <img src={src} loading="lazy" alt="" className="block w-full" style={{ filter: "sepia(0.3) contrast(1.05)" }} />
        <div className="absolute inset-0" style={{ mixBlendMode: "multiply", background: `${theme.bg2}55` }} />
        <span className="absolute bottom-1 right-2 font-mono text-[10px] text-white/70">'94</span>
      </div>
      <p className="mt-1 text-center font-mono text-[9px]" style={{ color: theme.ink }}>UNINDEXED · WHY IS THIS HERE</p>
    </div>
  );
}
