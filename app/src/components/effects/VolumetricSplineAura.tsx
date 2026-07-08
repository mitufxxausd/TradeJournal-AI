import { memo } from "react";

const VolumetricSplineAura = memo(function VolumetricSplineAura() {
  return (
    <div className="relative w-full h-full min-h-[280px] flex items-center justify-center overflow-hidden rounded-full">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        style={{
          transformOrigin: "center",
          animation: "rotate 8s linear infinite",
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="filter1" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves={3}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1.5" result="blurred" />
            <feDiffuseLighting
              in="blurred"
              lightingColor="#3b82f6"
              surfaceScale={2}
              result="light"
            >
              <feDistantLight azimuth={45} elevation={60} />
            </feDiffuseLighting>
          </filter>
          <filter id="filter2" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves={5}
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="1" result="blurred" />
            <feDiffuseLighting
              in="blurred"
              lightingColor="#22c55e"
              surfaceScale={3}
              result="light"
            >
              <fePointLight x={50} y={50} z={20} />
            </feDiffuseLighting>
          </filter>
          <radialGradient id="fadeMask" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="70%" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="circleMask">
            <circle cx="100" cy="100" r="100" fill="url(#fadeMask)" />
          </mask>
        </defs>
        <g mask="url(#circleMask)">
          <path d="M0,0 H200 V200 H0 Z" fill="#18181b" filter="url(#filter1)" />
          <path
            d="M0,0 H200 V200 H0 Z"
            fill="#22c55e"
            opacity="0.3"
            style={{ mixBlendMode: "color-dodge" }}
            filter="url(#filter2)"
          />
        </g>
      </svg>
      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default VolumetricSplineAura;
