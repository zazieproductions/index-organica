interface Props {
  seed: number;
  diagnostic: boolean;
}

// Global reusable SVG filter defs. Kept in one hidden svg.
export function SvgFilters({ seed, diagnostic }: Props) {
  const bf = ((seed % 7) + 1) / 200; // baseFrequency variance
  return (
    <svg width={0} height={0} className="absolute" aria-hidden style={{ position: "absolute" }}>
      <defs>
        <filter id="melt" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency={`0.008 ${0.03 + bf}`} numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={diagnostic ? 22 : 10} xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <filter id="warp" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="turbulence" baseFrequency={`${0.01 + bf} ${0.01 + bf}`} numOctaves={3} seed={seed + 5} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={diagnostic ? 30 : 14} xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <filter id="glitch" x="-20%" y="-20%" width="140%" height="140%">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="src"
          />
          <feOffset in="src" dx="-1.5" dy="0" result="r" />
          <feOffset in="src" dx="1.5" dy="0" result="b" />
          <feComponentTransfer in="r" result="rr">
            <feFuncR type="identity" />
            <feFuncG type="discrete" tableValues="0" />
            <feFuncB type="discrete" tableValues="0" />
          </feComponentTransfer>
          <feComponentTransfer in="b" result="bb">
            <feFuncR type="discrete" tableValues="0" />
            <feFuncG type="discrete" tableValues="0" />
            <feFuncB type="identity" />
          </feComponentTransfer>
          <feBlend in="rr" in2="bb" mode="screen" result="rb" />
          <feBlend in="rb" in2="src" mode="screen" />
        </filter>

        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" result="g" />
          <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0" />
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>

        <filter id="blur-soft">
          <feGaussianBlur stdDeviation="0.7" />
        </filter>

        <radialGradient id="portal-grad">
          <stop offset="0%" stopColor="#000" />
          <stop offset="70%" stopColor="#000" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
