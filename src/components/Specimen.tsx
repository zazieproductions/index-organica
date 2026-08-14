import { useMemo } from "react";
import { RNG } from "../lib/rng";

export const SPECIMEN_TYPES = [
  "anatomy",
  "insect",
  "machine",
  "geometry",
  "satellite",
  "scan",
  "ruin",
  "botanical",
  "face",
  "interface",
  "photo",
  "map",
] as const;

export type SpecimenType = (typeof SPECIMEN_TYPES)[number];

const LABELS = [
  "SPECIMEN",
  "FIG.",
  "PLATE",
  "SIGIL",
  "NODE",
  "RELIC",
  "ORGAN",
  "VOID",
  "OBJ",
  "SCAN",
  "RITE",
  "ECHO",
  "GRAFT",
  "BLOOM",
];

const GLYPHS = "☉☽✶✷❖◈⟁⌬⏣⎔◉⊛⊕⍟※∴⧉⨀⟠⌖⎈⍉".split("");

function poly(cx: number, cy: number, r: number, n: number, rot = 0): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + "Z";
}

function blob(rng: RNG, cx: number, cy: number, r: number, wobble: number): string {
  const n = rng.int(6, 10);
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 - wobble + rng.float(0, wobble * 2));
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % n];
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    d += `Q${p0[0].toFixed(1)} ${p0[1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return d + "Z";
}

interface Ctx {
  rng: RNG;
  c: string[];
  ink: string;
}

function drawAnatomy({ rng, c }: Ctx) {
  const els: React.ReactNode[] = [];
  const cx = 50 + rng.float(-8, 8);
  const cy = 50 + rng.float(-8, 8);
  els.push(<path key="o" d={blob(rng, cx, cy, rng.float(24, 34), 0.35)} fill={rng.pick(c)} opacity={0.55} />);
  els.push(<path key="o2" d={blob(rng, cx, cy, rng.float(14, 22), 0.4)} fill={rng.pick(c)} opacity={0.7} />);
  // vessels
  for (let i = 0; i < rng.int(5, 10); i++) {
    const a = rng.float(0, Math.PI * 2);
    const x2 = cx + Math.cos(a) * rng.float(30, 48);
    const y2 = cy + Math.sin(a) * rng.float(30, 48);
    const mx = cx + Math.cos(a) * 20 + rng.float(-12, 12);
    const my = cy + Math.sin(a) * 20 + rng.float(-12, 12);
    els.push(
      <path key={"v" + i} d={`M${cx} ${cy} Q${mx} ${my} ${x2} ${y2}`} stroke={rng.pick(c)} strokeWidth={rng.float(0.4, 1.4)} fill="none" opacity={0.7} />
    );
  }
  return els;
}

function drawInsect({ rng, c, ink }: Ctx) {
  const els: React.ReactNode[] = [];
  const col = rng.pick(c);
  // body segments (mirrored)
  const segs = rng.int(3, 5);
  for (let i = 0; i < segs; i++) {
    const y = 30 + i * (40 / segs);
    els.push(<ellipse key={"b" + i} cx={50} cy={y} rx={rng.float(6, 11)} ry={rng.float(4, 7)} fill={col} opacity={0.8} />);
    // legs both sides
    for (const s of [-1, 1]) {
      const lx = 50 + s * 8;
      const ex = 50 + s * rng.float(22, 40);
      const ey = y + rng.float(-14, 14);
      els.push(<path key={"l" + i + s} d={`M${lx} ${y} L${(lx + ex) / 2} ${y - 6} L${ex} ${ey}`} stroke={rng.pick(c)} strokeWidth={1} fill="none" opacity={0.85} />);
    }
  }
  // head + antennae
  els.push(<circle key="h" cx={50} cy={24} r={rng.float(5, 8)} fill={rng.pick(c)} />);
  for (const s of [-1, 1]) {
    els.push(<path key={"a" + s} d={`M${50 + s * 3} 22 Q${50 + s * 12} ${10} ${50 + s * 18} ${8}`} stroke={ink} strokeWidth={0.7} fill="none" />);
  }
  return els;
}

function drawMachine({ rng, c, ink }: Ctx) {
  const els: React.ReactNode[] = [];
  for (let i = 0; i < rng.int(3, 6); i++) {
    const x = rng.float(15, 70);
    const y = rng.float(15, 70);
    const w = rng.float(10, 28);
    const h = rng.float(8, 24);
    els.push(<rect key={"r" + i} x={x} y={y} width={w} height={h} fill="none" stroke={rng.pick(c)} strokeWidth={rng.float(0.6, 1.6)} opacity={0.8} />);
    if (rng.bool()) els.push(<rect key={"rf" + i} x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill={rng.pick(c)} opacity={0.25} />);
  }
  // gears
  for (let i = 0; i < rng.int(1, 3); i++) {
    const gx = rng.float(25, 75);
    const gy = rng.float(25, 75);
    const gr = rng.float(6, 13);
    els.push(<path key={"g" + i} d={poly(gx, gy, gr, rng.int(8, 14))} fill="none" stroke={rng.pick(c)} strokeWidth={1.2} />);
    els.push(<circle key={"gc" + i} cx={gx} cy={gy} r={gr * 0.4} fill={rng.pick(c)} opacity={0.7} />);
  }
  // wires
  for (let i = 0; i < rng.int(2, 5); i++) {
    els.push(<line key={"w" + i} x1={rng.float(0, 100)} y1={rng.float(0, 100)} x2={rng.float(0, 100)} y2={rng.float(0, 100)} stroke={ink} strokeWidth={0.4} opacity={0.5} />);
  }
  return els;
}

function drawGeometry({ rng, c }: Ctx) {
  const els: React.ReactNode[] = [];
  const cx = 50, cy = 50;
  const mode = rng.int(0, 2);
  if (mode === 0) {
    // flower of life
    const r = rng.float(11, 15);
    els.push(<circle key="c0" cx={cx} cy={cy} r={r} fill="none" stroke={rng.pick(c)} strokeWidth={0.7} />);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      els.push(<circle key={"c" + i} cx={cx + Math.cos(a) * r} cy={cy + Math.sin(a) * r} r={r} fill="none" stroke={rng.pick(c)} strokeWidth={0.7} opacity={0.85} />);
    }
  } else {
    // nested polygons
    for (let i = 0; i < rng.int(4, 7); i++) {
      const r = 8 + i * 5;
      els.push(<path key={"p" + i} d={poly(cx, cy, r, rng.int(3, 8), rng.float(0, 1))} fill="none" stroke={rng.pick(c)} strokeWidth={0.6} opacity={0.85} />);
    }
  }
  // radial lines
  for (let i = 0; i < rng.int(6, 16); i++) {
    const a = (i / 12) * Math.PI * 2;
    els.push(<line key={"rl" + i} x1={cx} y1={cy} x2={cx + Math.cos(a) * 46} y2={cy + Math.sin(a) * 46} stroke={rng.pick(c)} strokeWidth={0.3} opacity={0.4} />);
  }
  return els;
}

function drawSatellite({ rng, c, ink }: Ctx) {
  const els: React.ReactNode[] = [];
  els.push(<rect key="body" x={42} y={40} width={16} height={20} fill={rng.pick(c)} opacity={0.7} stroke={ink} strokeWidth={0.5} />);
  // panels
  for (const s of [-1, 1]) {
    const px = s < 0 ? 8 : 58;
    els.push(<rect key={"pn" + s} x={px} y={42} width={34} height={16} fill="none" stroke={rng.pick(c)} strokeWidth={0.7} />);
    for (let i = 0; i < 5; i++) els.push(<line key={"pl" + s + i} x1={px + i * 7} y1={42} x2={px + i * 7} y2={58} stroke={rng.pick(c)} strokeWidth={0.3} />);
  }
  // dish
  els.push(<ellipse key="dish" cx={50} cy={26} rx={9} ry={5} fill="none" stroke={rng.pick(c)} strokeWidth={1} />);
  els.push(<line key="mast" x1={50} y1={40} x2={50} y2={30} stroke={ink} strokeWidth={0.6} />);
  return els;
}

function drawScan({ rng, c }: Ctx) {
  const els: React.ReactNode[] = [];
  const cx = 50 + rng.float(-6, 6), cy = 50 + rng.float(-6, 6);
  for (let i = 0; i < rng.int(6, 12); i++) {
    els.push(<path key={"s" + i} d={blob(rng, cx, cy, 6 + i * 3.4, 0.14)} fill="none" stroke={rng.pick(c)} strokeWidth={0.5} opacity={0.6} />);
  }
  els.push(<line key="cx" x1={0} y1={cy} x2={100} y2={cy} stroke={rng.pick(c)} strokeWidth={0.3} opacity={0.5} strokeDasharray="2 3" />);
  els.push(<line key="cy" x1={cx} y1={0} x2={cx} y2={100} stroke={rng.pick(c)} strokeWidth={0.3} opacity={0.5} strokeDasharray="2 3" />);
  return els;
}

function drawRuin({ rng, c, ink }: Ctx) {
  const els: React.ReactNode[] = [];
  const cols = rng.int(3, 5);
  for (let i = 0; i < cols; i++) {
    const x = 15 + i * (70 / cols);
    const top = rng.float(25, 45);
    els.push(<rect key={"c" + i} x={x} y={top} width={rng.float(5, 9)} height={80 - top} fill={rng.pick(c)} opacity={0.5} />);
    // broken capital
    els.push(<rect key={"cap" + i} x={x - 2} y={top - 4} width={rng.float(9, 13)} height={4} fill={rng.pick(c)} opacity={0.7} />);
  }
  // arch
  els.push(<path key="arch" d={`M15 30 Q50 ${rng.float(2, 14)} 85 30`} fill="none" stroke={rng.pick(c)} strokeWidth={1.5} opacity={0.7} />);
  els.push(<line key="ground" x1={5} y1={80} x2={95} y2={80} stroke={ink} strokeWidth={0.6} />);
  // rubble
  for (let i = 0; i < rng.int(3, 7); i++) els.push(<rect key={"rb" + i} x={rng.float(10, 85)} y={rng.float(74, 82)} width={rng.float(2, 6)} height={rng.float(2, 5)} fill={rng.pick(c)} opacity={0.5} />);
  return els;
}

function drawBotanical({ rng, c, ink }: Ctx) {
  const els: React.ReactNode[] = [];
  els.push(<path key="stem" d={`M50 90 Q${rng.float(40, 60)} 60 50 30`} fill="none" stroke={rng.pick(c)} strokeWidth={1.5} />);
  for (let i = 0; i < rng.int(4, 8); i++) {
    const y = 80 - i * 8;
    const s = i % 2 === 0 ? -1 : 1;
    const ex = 50 + s * rng.float(14, 26);
    els.push(<path key={"lf" + i} d={`M50 ${y} Q${50 + s * 14} ${y - 8} ${ex} ${y - 3} Q${50 + s * 12} ${y + 4} 50 ${y}`} fill={rng.pick(c)} opacity={0.55} />);
    els.push(<line key={"lv" + i} x1={50} y1={y} x2={ex} y2={y - 3} stroke={ink} strokeWidth={0.3} opacity={0.6} />);
  }
  // flower/seed head
  const fy = 28;
  for (let i = 0; i < rng.int(5, 9); i++) {
    const a = (i / 7) * Math.PI * 2;
    els.push(<ellipse key={"pt" + i} cx={50 + Math.cos(a) * 8} cy={fy + Math.sin(a) * 8} rx={4} ry={2} fill={rng.pick(c)} opacity={0.7} transform={`rotate(${(a * 180) / Math.PI} ${50 + Math.cos(a) * 8} ${fy + Math.sin(a) * 8})`} />);
  }
  els.push(<circle key="core" cx={50} cy={fy} r={4} fill={rng.pick(c)} />);
  return els;
}

function drawFace({ rng, c, ink }: Ctx) {
  const els: React.ReactNode[] = [];
  els.push(<path key="head" d={blob(rng, 50, 50, rng.float(26, 32), 0.12)} fill={rng.pick(c)} opacity={0.4} />);
  // eyes — sometimes many, sometimes displaced
  const eyes = rng.int(2, 5);
  for (let i = 0; i < eyes; i++) {
    const ex = 50 + rng.float(-20, 20);
    const ey = 42 + rng.float(-8, 8);
    els.push(<ellipse key={"e" + i} cx={ex} cy={ey} rx={rng.float(4, 7)} ry={rng.float(2.5, 4)} fill="#fff" opacity={0.85} />);
    els.push(<circle key={"p" + i} cx={ex + rng.float(-2, 2)} cy={ey} r={rng.float(1.2, 2.4)} fill="#000" />);
  }
  // mouth
  els.push(<path key="m" d={`M${50 - rng.float(8, 14)} ${64 + rng.float(-4, 4)} Q50 ${64 + rng.float(-6, 10)} ${50 + rng.float(8, 14)} ${64 + rng.float(-4, 4)}`} fill="none" stroke={ink} strokeWidth={1.2} />);
  // teeth marks
  if (rng.bool(0.4)) for (let i = 0; i < 6; i++) els.push(<line key={"t" + i} x1={42 + i * 3} y1={64} x2={42 + i * 3} y2={68} stroke={ink} strokeWidth={0.5} />);
  return els;
}

function drawInterface({ rng, c, ink }: Ctx) {
  const els: React.ReactNode[] = [];
  els.push(<rect key="win" x={10} y={14} width={80} height={72} fill={rng.pick(c)} opacity={0.12} stroke={rng.pick(c)} strokeWidth={0.8} />);
  els.push(<rect key="bar" x={10} y={14} width={80} height={9} fill={rng.pick(c)} opacity={0.5} />);
  for (let i = 0; i < 3; i++) els.push(<rect key={"bt" + i} x={82 - i * 6} y={16} width={4} height={4} fill={ink} opacity={0.8} />);
  for (let i = 0; i < rng.int(4, 9); i++) {
    els.push(<rect key={"tx" + i} x={16} y={30 + i * 6} width={rng.float(20, 66)} height={2} fill={rng.pick(c)} opacity={0.6} />);
  }
  // fake button
  els.push(<rect key="ok" x={64} y={74} width={20} height={8} fill={rng.pick(c)} opacity={0.4} stroke={ink} strokeWidth={0.5} />);
  return els;
}

function drawPhoto({ rng }: Ctx) {
  // oddly normal — soft silhouette portraits, sepia frame
  const els: React.ReactNode[] = [];
  els.push(<rect key="frame" x={8} y={8} width={84} height={84} fill="#d8c9a8" opacity={0.9} />);
  els.push(<rect key="inner" x={14} y={14} width={72} height={72} fill={rng.pick(["#8a9a8f", "#7a8a9a", "#9a8a7a", "#6a7a6a"])} opacity={0.8} />);
  const people = rng.int(1, 3);
  for (let i = 0; i < people; i++) {
    const px = 50 + (i - (people - 1) / 2) * 22;
    els.push(<circle key={"hd" + i} cx={px} cy={44} r={8} fill="#3a3228" opacity={0.85} />);
    els.push(<path key={"bd" + i} d={`M${px - 12} 86 Q${px} 54 ${px + 12} 86 Z`} fill="#3a3228" opacity={0.85} />);
  }
  els.push(<rect key="scr" x={14} y={rng.float(20, 70)} width={72} height={1.5} fill="#fff" opacity={0.3} />);
  return els;
}

function drawMap({ rng, c, ink }: Ctx) {
  const els: React.ReactNode[] = [];
  // impossible contour map
  for (let i = 0; i < rng.int(4, 8); i++) {
    els.push(<path key={"ct" + i} d={blob(rng, 50 + rng.float(-15, 15), 50 + rng.float(-15, 15), 8 + i * 5, 0.4)} fill="none" stroke={rng.pick(c)} strokeWidth={0.4} opacity={0.6} />);
  }
  // grid
  for (let i = 1; i < 6; i++) {
    els.push(<line key={"gx" + i} x1={i * 16} y1={0} x2={i * 16} y2={100} stroke={ink} strokeWidth={0.2} opacity={0.3} />);
    els.push(<line key={"gy" + i} x1={0} y1={i * 16} x2={100} y2={i * 16} stroke={ink} strokeWidth={0.2} opacity={0.3} />);
  }
  // route
  let d = "M" + rng.float(10, 30) + " " + rng.float(10, 30);
  for (let i = 0; i < rng.int(4, 8); i++) d += " L" + rng.float(10, 90) + " " + rng.float(10, 90);
  els.push(<path key="route" d={d} fill="none" stroke={rng.pick(c)} strokeWidth={0.8} strokeDasharray="3 2" opacity={0.8} />);
  // markers
  for (let i = 0; i < rng.int(2, 5); i++) els.push(<path key={"mk" + i} d={poly(rng.float(15, 85), rng.float(15, 85), 3, 3)} fill={rng.pick(c)} />);
  return els;
}

const DRAWERS: Record<SpecimenType, (ctx: Ctx) => React.ReactNode> = {
  anatomy: drawAnatomy,
  insect: drawInsect,
  machine: drawMachine,
  geometry: drawGeometry,
  satellite: drawSatellite,
  scan: drawScan,
  ruin: drawRuin,
  botanical: drawBotanical,
  face: drawFace,
  interface: drawInterface,
  photo: drawPhoto,
  map: drawMap,
};

export interface SpecimenProps {
  seed: string;
  type: SpecimenType;
  colors: string[];
  ink: string;
  filterId?: string;
  showFrame?: boolean;
}

export function SpecimenSVG({ seed, type, colors, ink, filterId, showFrame = true }: SpecimenProps) {
  const { body, label, code, glyph } = useMemo(() => {
    const rng = new RNG(seed + type);
    const body = DRAWERS[type]({ rng, c: colors, ink });
    const label = rng.pick(LABELS) + " " + rng.int(100, 9999);
    const code = rng.pick(["Ω", "Δ", "Ψ", "Θ", "Φ"]) + "-" + rng.int(10, 99) + "." + rng.int(1000, 9999);
    const glyph = rng.pick(GLYPHS);
    return { body, label, code, glyph };
  }, [seed, type, colors, ink]);

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" style={{ filter: filterId ? `url(#${filterId})` : undefined }} preserveAspectRatio="xMidYMid meet">
      {showFrame && (
        <>
          <rect x={1} y={1} width={98} height={98} fill="none" stroke={ink} strokeWidth={0.4} opacity={0.4} />
          <rect x={3} y={3} width={94} height={94} fill="none" stroke={ink} strokeWidth={0.2} opacity={0.25} strokeDasharray="1 2" />
        </>
      )}
      {body}
      {showFrame && (
        <>
          <text x={4} y={97} fill={ink} fontSize={3.4} opacity={0.75} fontFamily="monospace">
            {label}
          </text>
          <text x={96} y={97} textAnchor="end" fill={ink} fontSize={3} opacity={0.6} fontFamily="monospace">
            {code}
          </text>
          <text x={94} y={9} textAnchor="end" fill={ink} fontSize={6} opacity={0.7}>
            {glyph}
          </text>
        </>
      )}
    </svg>
  );
}

export { LABELS, GLYPHS };
