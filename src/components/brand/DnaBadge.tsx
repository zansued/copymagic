import { useRef, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dna } from "lucide-react";

interface DnaBadgeProps {
  name: string;
  summary?: string;
  compact?: boolean;
  onClick?: () => void;
}

const identityMatrix =
  "1, 0, 0, 0, " +
  "0, 1, 0, 0, " +
  "0, 0, 1, 0, " +
  "0, 0, 0, 1";

const maxRotate = 0.15;
const minRotate = -0.15;
const maxScale = 1;
const minScale = 0.98;

export function DnaBadge({ name, summary, compact = false, onClick }: DnaBadgeProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [matrix, setMatrix] = useState(identityMatrix);
  const [overlayAngle, setOverlayAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const getDimensions = () => {
    const rect = ref.current?.getBoundingClientRect();
    return {
      left: rect?.left || 0,
      right: rect?.right || 0,
      top: rect?.top || 0,
      bottom: rect?.bottom || 0,
    };
  };

  const getMatrix = (clientX: number, clientY: number) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;

    const scale = [
      maxScale - (maxScale - minScale) * Math.abs(xCenter - clientX) / (xCenter - left || 1),
      maxScale - (maxScale - minScale) * Math.abs(yCenter - clientY) / (yCenter - top || 1),
      maxScale - (maxScale - minScale) * (Math.abs(xCenter - clientX) + Math.abs(yCenter - clientY)) / ((xCenter - left || 1) + (yCenter - top || 1)),
    ];

    const rX = maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left || 1);
    const rY = maxRotate - (maxRotate - minRotate) * (top - clientY) / (top - bottom || 1);
    const rZ = -(maxRotate - (maxRotate - minRotate) * Math.abs(right - clientX) / (right - left || 1));

    return `${scale[0]}, 0, ${rZ}, 0, 0, ${scale[1]}, ${rY * 0.5}, 0, ${rX}, ${rY}, ${scale[2]}, 0, 0, 0, 0, 1`;
  };

  const onMouseEnter = () => setIsHovered(true);
  const onMouseLeave = () => {
    setIsHovered(false);
    setMatrix(identityMatrix);
    setOverlayAngle(0);
  };

  const onMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    const { left, right, top, bottom } = getDimensions();
    const xCenter = (left + right) / 2;
    const yCenter = (top + bottom) / 2;
    setMatrix(getMatrix(e.clientX, e.clientY));
    setOverlayAngle(
      ((Math.abs(xCenter - e.clientX) + Math.abs(yCenter - e.clientY)) / 1.5)
    );
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/brand-profiles");
    }
  };

  // SVG dimensions
  const width = compact ? 180 : 280;
  const height = compact ? 40 : 52;

  return (
    <button
      ref={ref}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseMove={onMouseMove}
      className="block cursor-pointer group"
      title="DNA de Marca ativo — clique para trocar"
    >
      <div
        style={{
          transform: `perspective(700px) matrix3d(${matrix})`,
          transformOrigin: "center center",
          transition: "transform 200ms ease-out",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${width} ${height}`}
          className={compact ? "w-[180px] h-auto" : "w-[280px] h-auto"}
        >
          <defs>
            <linearGradient id="dna-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(262 83% 58%)" />
              <stop offset="50%" stopColor="hsl(292 70% 50%)" />
              <stop offset="100%" stopColor="hsl(220 90% 56%)" />
            </linearGradient>
            <filter id="dna-blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            </filter>
            <mask id="dna-mask">
              <rect width={width} height={height} fill="white" rx="10" />
            </mask>
          </defs>

          {/* Background */}
          <rect width={width} height={height} rx="10" fill="hsl(228 14% 13%)" />
          <rect
            x="1"
            y="1"
            width={width - 2}
            height={height - 2}
            rx="9"
            fill="none"
            stroke="url(#dna-gradient)"
            strokeWidth="1.5"
            opacity={isHovered ? 1 : 0.5}
            style={{ transition: "opacity 300ms" }}
          />

          {/* DNA Icon area */}
          <circle cx={compact ? 20 : 24} cy={height / 2} r={compact ? 12 : 15} fill="hsl(262 83% 65% / 0.15)" />
          <text
            x={compact ? 20 : 24}
            y={height / 2 + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={compact ? 12 : 15}
          >
            🧬
          </text>

          {/* Text */}
          <text
            fontFamily="Inter, system-ui, sans-serif"
            fontSize={compact ? 8 : 9}
            fontWeight="600"
            fill="hsl(262 83% 80%)"
            x={compact ? 36 : 46}
            y={summary && !compact ? 19 : height / 2 + (compact ? 1 : 1)}
            dominantBaseline={summary && !compact ? "auto" : "central"}
            letterSpacing="0.5"
          >
            DNA ATIVO
          </text>

          <text
            fontFamily="Inter, system-ui, sans-serif"
            fontSize={compact ? 11 : 14}
            fontWeight="bold"
            fill="hsl(210 20% 92%)"
            x={compact ? 36 : 46}
            y={summary && !compact ? 36 : height / 2 + (compact ? 1 : 1)}
            dominantBaseline={summary && !compact ? "auto" : "central"}
          >
            {name.length > (compact ? 16 : 22) ? name.slice(0, compact ? 14 : 20) + "…" : name}
          </text>

          {/* Chevron indicator */}
          <text
            x={width - 16}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fill="hsl(215 15% 55%)"
            opacity={isHovered ? 1 : 0.5}
            style={{ transition: "opacity 300ms" }}
          >
            ›
          </text>

          {/* Holographic overlay */}
          <g style={{ mixBlendMode: "overlay" }} mask="url(#dna-mask)">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <g
                key={i}
                style={{
                  transform: `rotate(${overlayAngle + i * 15}deg)`,
                  transformOrigin: "center center",
                  transition: "transform 200ms ease-out",
                  animation: isHovered ? `dna-shimmer-${i} 4s infinite` : "none",
                  willChange: "transform",
                }}
              >
                <polygon
                  points={`0,0 ${width},${height} ${width},0 0,${height}`}
                  fill={
                    [
                      "hsl(262 83% 65%)",
                      "hsl(292 70% 50%)",
                      "hsl(220 90% 56%)",
                      "hsl(45 90% 55%)",
                      "hsl(170 70% 45%)",
                      "transparent",
                    ][i]
                  }
                  filter="url(#dna-blur)"
                  opacity="0.3"
                />
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Inject shimmer keyframes */}
      <style>{`
        ${[0, 1, 2, 3, 4, 5]
          .map(
            (i) => `
          @keyframes dna-shimmer-${i} {
            0% { transform: rotate(${i * 15}deg); }
            50% { transform: rotate(${(i + 1) * 15}deg); }
            100% { transform: rotate(${i * 15}deg); }
          }
        `
          )
          .join("")}
      `}</style>
    </button>
  );
}
