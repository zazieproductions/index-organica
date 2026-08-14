import { useEffect, useRef } from "react";
import type { Theme } from "../lib/themes";

interface Props {
  theme: Theme;
  reduced: boolean;
  diagnostic: boolean;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export function CustomCursor({ theme, reduced, diagnostic }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ret = useRef<HTMLDivElement>(null);
  const coord = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100, px: -100, py: -100, down: false });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const parts: P[] = [];
    const MAX = reduced ? 0 : 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const move = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    const down = () => (pos.current.down = true);
    const up = () => (pos.current.down = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);

    const loop = () => {
      const p = pos.current;
      const dx = p.x - p.px;
      const dy = p.y - p.py;
      const speed = Math.hypot(dx, dy);
      p.px += dx * 0.35;
      p.py += dy * 0.35;

      // reticle
      if (ret.current) {
        const stretch = Math.min(speed / 30, 1.6);
        const ang = Math.atan2(dy, dx);
        ret.current.style.transform = `translate(${p.px}px, ${p.py}px) translate(-50%,-50%) rotate(${(ang * 180) / Math.PI}deg) scaleX(${1 + stretch}) scaleY(${1 - stretch * 0.35})`;
      }
      if (coord.current) {
        coord.current.style.transform = `translate(${p.x + 18}px, ${p.y + 14}px)`;
        coord.current.textContent = `X${Math.round(p.x).toString().padStart(4, "0")} Y${Math.round(p.y).toString().padStart(4, "0")} V${Math.round(speed).toString().padStart(3, "0")}`;
      }

      // spawn trail particles based on velocity
      if (MAX > 0 && speed > 2) {
        const n = Math.min(Math.floor(speed / 8), 3);
        for (let i = 0; i < n && parts.length < MAX; i++) {
          parts.push({
            x: p.x,
            y: p.y,
            vx: -dx * 0.05 + (Math.random() - 0.5) * 1.5,
            vy: -dy * 0.05 + (Math.random() - 0.5) * 1.5,
            life: 1,
            size: Math.random() * 2 + 1,
          });
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = parts.length - 1; i >= 0; i--) {
        const pt = parts[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.03;
        if (pt.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = pt.life * 0.8;
        ctx.fillStyle = theme.glow;
        ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [theme, reduced]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998]" style={{ mixBlendMode: "difference" }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div
        ref={ret}
        className="absolute left-0 top-0"
        style={{ width: 44, height: 44 }}
      >
        <svg viewBox="0 0 44 44" width={44} height={44}>
          <circle cx={22} cy={22} r={16} fill="none" stroke={theme.hud} strokeWidth={1} opacity={0.9} />
          <circle cx={22} cy={22} r={2} fill={theme.hud} />
          <line x1={22} y1={0} x2={22} y2={10} stroke={theme.hud} strokeWidth={1} />
          <line x1={22} y1={34} x2={22} y2={44} stroke={theme.hud} strokeWidth={1} />
          <line x1={0} y1={22} x2={10} y2={22} stroke={theme.hud} strokeWidth={1} />
          <line x1={34} y1={22} x2={44} y2={22} stroke={theme.hud} strokeWidth={1} />
          {diagnostic && <circle cx={22} cy={22} r={21} fill="none" stroke={theme.hud} strokeWidth={0.5} strokeDasharray="2 3" />}
        </svg>
      </div>
      <div
        ref={coord}
        className="absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] tracking-widest"
        style={{ color: theme.hud }}
      />
    </div>
  );
}
