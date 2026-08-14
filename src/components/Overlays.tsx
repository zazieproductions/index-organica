import { useEffect, useRef } from "react";
import type { Theme } from "../lib/themes";

export function NoiseOverlay({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const S = 128;
    canvas.width = S;
    canvas.height = S;
    let raf = 0;
    let frame = 0;
    const draw = () => {
      frame++;
      // throttle to ~15fps to save perf
      if (!reduced && frame % 4 === 0) {
        const img = ctx.createImageData(S, S);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = 18;
        }
        ctx.putImageData(img, 0, 0);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[9995] h-full w-full opacity-40"
      style={{ imageRendering: "pixelated", width: "100vw", height: "100vh", mixBlendMode: "overlay" }}
    />
  );
}

export function ScanlinesVignette({ theme, diagnostic }: { theme: Theme; diagnostic: boolean }) {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[9994]"
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "multiply",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-[9993]"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${theme.bg}cc 100%)`,
        }}
      />
      {diagnostic && (
        <div
          className="pointer-events-none fixed inset-0 z-[9992] font-mono text-[9px]"
          style={{
            background:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px)",
          }}
        />
      )}
      {/* moving scan sweep */}
      <div className="pointer-events-none fixed inset-0 z-[9991] overflow-hidden">
        <div
          className="absolute left-0 h-24 w-full opacity-20"
          style={{
            background: `linear-gradient(180deg, transparent, ${theme.glow}44, transparent)`,
            animation: "sweep 8s linear infinite",
          }}
        />
      </div>
    </>
  );
}
