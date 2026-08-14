// Evolving color systems for the organism.

export interface Theme {
  name: string;
  bg: string; // base background
  bg2: string; // secondary background for gradients
  ink: string; // text / line color
  colors: string[]; // specimen palette
  glow: string; // accent glow
  hud: string; // hud color
}

export interface ColorTuning {
  hue: number;
  saturation: number;
  luminance: number;
  accent: string | null;
  background: string | null;
  inverted: boolean;
}

export const DEFAULT_TUNING: ColorTuning = {
  hue: 0,
  saturation: 100,
  luminance: 100,
  accent: null,
  background: null,
  inverted: false,
};

export const THEMES: Theme[] = [
  {
    name: "RADIOACTIVE",
    bg: "#050705",
    bg2: "#0a1207",
    ink: "#c6ff4d",
    colors: ["#c6ff4d", "#7cff00", "#e8ff9e", "#3a7d00", "#d9ff2e", "#a8ff57"],
    glow: "#aaff00",
    hud: "#c6ff4d",
  },
  {
    name: "ULTRAVIOLET",
    bg: "#0a020e",
    bg2: "#1a0525",
    ink: "#ff5ad9",
    colors: ["#ff5ad9", "#c04bff", "#ff9df0", "#7a1fb0", "#ff2ec4", "#e0a0ff"],
    glow: "#ff33cc",
    hud: "#ff8ae6",
  },
  {
    name: "INFRARED",
    bg: "#0c0303",
    bg2: "#1f0505",
    ink: "#ff5544",
    colors: ["#ff5544", "#ff2a1a", "#ffb0a0", "#8a1500", "#ff7a5c", "#ffd0c0"],
    glow: "#ff3018",
    hud: "#ff8877",
  },
  {
    name: "PETROLEUM",
    bg: "#02060a",
    bg2: "#04121c",
    ink: "#4fd8ff",
    colors: ["#4fd8ff", "#1f9fd0", "#a0ecff", "#0a5a78", "#2ec4e0", "#c0f4ff"],
    glow: "#22c8ff",
    hud: "#7fe4ff",
  },
  {
    name: "BRUISE",
    bg: "#07040a",
    bg2: "#140a1c",
    ink: "#b48cff",
    colors: ["#b48cff", "#8a5cff", "#d9c0ff", "#4a2f7a", "#a06cff", "#e0d0ff"],
    glow: "#9a6cff",
    hud: "#cbb0ff",
  },
  {
    name: "DIRTY_CREAM",
    bg: "#0b0a07",
    bg2: "#171307",
    ink: "#e8dcae",
    colors: ["#e8dcae", "#c9b56a", "#f5eecb", "#8a7a40", "#d6c380", "#fffbe0"],
    glow: "#d8c880",
    hud: "#efe6c0",
  },
  {
    name: "SILVER_VOID",
    bg: "#050506",
    bg2: "#101014",
    ink: "#d0d6de",
    colors: ["#d0d6de", "#9aa2ad", "#eef2f6", "#5a616b", "#b8bfc8", "#ffffff"],
    glow: "#c8ced8",
    hud: "#e0e6ee",
  },
  {
    name: "CYANOTYPE",
    bg: "#00080c",
    bg2: "#001b26",
    ink: "#b8f6ff",
    colors: ["#00e5ff", "#1b8da8", "#b8f6ff", "#00475c", "#63dfff", "#d9fbff"],
    glow: "#00d9ff",
    hud: "#79edff",
  },
  {
    name: "TOXIC_ROSE",
    bg: "#0a0205",
    bg2: "#21050f",
    ink: "#ff6f98",
    colors: ["#ff2f70", "#ff799e", "#ffbad0", "#8f0036", "#d40058", "#fff0f5"],
    glow: "#ff145f",
    hud: "#ff8bab",
  },
  {
    name: "SOLAR_FLARE",
    bg: "#0b0500",
    bg2: "#281000",
    ink: "#ffd447",
    colors: ["#ff5a00", "#ff9d00", "#ffe45c", "#8a2100", "#ff2d00", "#fff3b0"],
    glow: "#ff7300",
    hud: "#ffc247",
  },
  {
    name: "FUNGAL_OCHRE",
    bg: "#080704",
    bg2: "#1c180c",
    ink: "#d6c67c",
    colors: ["#a8b64a", "#d6a84d", "#ede0a1", "#596226", "#917832", "#fff1ba"],
    glow: "#c3d34d",
    hud: "#ded18e",
  },
  {
    name: "NEGATIVE_ICE",
    bg: "#e5f0ec",
    bg2: "#a8c7c1",
    ink: "#071715",
    colors: ["#071715", "#163d38", "#365f58", "#00100d", "#537f77", "#0c2925"],
    glow: "#004e45",
    hud: "#092d28",
  },
];

export function mutateThemeIndex(current: number, rand: number): number {
  let n = (current + 1 + Math.floor(rand * (THEMES.length - 1))) % THEMES.length;
  if (n === current) n = (n + 1) % THEMES.length;
  return n;
}

function hexToHsl(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return [(h + 360) % 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return `#${rgb.map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function tuneColor(hex: string, tuning: ColorTuning): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(
    (h + tuning.hue + 360) % 360,
    Math.min(100, Math.max(0, s * (tuning.saturation / 100))),
    Math.min(96, Math.max(2, l * (tuning.luminance / 100)))
  );
}

function accentScale(accent: string): string[] {
  const [h, s, l] = hexToHsl(accent);
  return [
    accent,
    hslToHex((h + 28) % 360, Math.min(100, s + 12), Math.max(18, l - 17)),
    hslToHex((h + 350) % 360, Math.max(20, s - 20), Math.min(92, l + 25)),
    hslToHex((h + 65) % 360, Math.min(100, s + 8), Math.max(12, l - 28)),
    hslToHex((h + 180) % 360, Math.min(100, s + 5), l),
    hslToHex(h, Math.max(10, s - 35), Math.min(96, l + 35)),
  ];
}

export function tuneTheme(base: Theme, tuning: ColorTuning): Theme {
  let colors = base.colors.map((color) => tuneColor(color, tuning));
  let ink = tuneColor(base.ink, tuning);
  let glow = tuneColor(base.glow, tuning);
  let hud = tuneColor(base.hud, tuning);
  let bg = tuneColor(base.bg, tuning);
  let bg2 = tuneColor(base.bg2, tuning);

  if (tuning.accent) {
    colors = accentScale(tuning.accent);
    ink = colors[2];
    glow = colors[0];
    hud = colors[5];
  }
  if (tuning.background) {
    const [h, s, l] = hexToHsl(tuning.background);
    bg = tuning.background;
    bg2 = hslToHex((h + 8) % 360, Math.min(100, s + 8), Math.min(30, l + 8));
  }
  if (tuning.inverted) {
    const oldBg = bg;
    bg = ink;
    bg2 = colors[2];
    ink = oldBg;
    hud = oldBg;
    colors = colors.map((color, index) => (index % 2 === 0 ? oldBg : color));
  }

  return { ...base, name: `${base.name}${tuning.accent ? ".CUSTOM" : ""}`, bg, bg2, ink, colors, glow, hud };
}
