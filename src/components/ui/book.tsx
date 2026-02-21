import React from "react";
import { cn } from "@/lib/utils";

interface BookProps {
  title: string;
  variant?: "simple" | "stripe";
  width?: number;
  color?: string;
  textColor?: string;
  illustration?: React.ReactNode;
  textured?: boolean;
  className?: string;
  onClick?: () => void;
}

const DefaultIllustration = (
  <svg fill="none" height="56" viewBox="0 0 36 56" width="36" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M3.03113 28.0005C6.26017 23.1765 11.7592 20.0005 18 20.0005C24.2409 20.0005 29.7399 23.1765 32.9689 28.0005C29.7399 32.8244 24.2409 36.0005 18 36.0005C11.7592 36.0005 6.26017 32.8244 3.03113 28.0005Z"
      fill="hsl(var(--primary))"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M32.9691 28.0012C34.8835 25.1411 36 21.7017 36 18.0015C36 8.06034 27.9411 0.00146484 18 0.00146484C8.05887 0.00146484 0 8.06034 0 18.0015C0 21.7017 1.11648 25.1411 3.03094 28.0012C6.25996 23.1771 11.7591 20.001 18 20.001C24.2409 20.001 29.74 23.1771 32.9691 28.0012Z"
      fill="hsl(var(--glow))"
      fillRule="evenodd"
    />
    <path
      clipRule="evenodd"
      d="M32.9692 28.0005C29.7402 32.8247 24.241 36.001 18 36.001C11.759 36.001 6.25977 32.8247 3.03077 28.0005C1.11642 30.8606 0 34.2999 0 38C0 47.9411 8.05887 56 18 56C27.9411 56 36 47.9411 36 38C36 34.2999 34.8836 30.8606 32.9692 28.0005Z"
      fill="hsl(var(--destructive))"
      fillRule="evenodd"
    />
  </svg>
);

export function Book({
  title,
  variant = "stripe",
  width = 140,
  color,
  textColor,
  illustration,
  textured = false,
  className,
  onClick,
}: BookProps) {
  const resolvedColor = color
    ? color
    : variant === "simple"
      ? "hsl(var(--card))"
      : "hsl(var(--primary))";

  const resolvedTextColor = textColor || "hsl(var(--foreground))";
  const resolvedIllustration = illustration || DefaultIllustration;

  return (
    <div
      className={cn("inline-block w-fit cursor-pointer", className)}
      style={{ perspective: 900 }}
      onClick={onClick}
    >
      <div
        className="aspect-[49/60] w-fit relative duration-[250ms] book-hover"
        style={{
          transformStyle: "preserve-3d",
          minWidth: width,
          containerType: "inline-size",
        }}
      >
        {/* Front face */}
        <div
          className="flex flex-col h-full rounded-l-md rounded-r overflow-hidden shadow-lg relative
            after:absolute after:border after:border-border/40 after:w-full after:h-full after:rounded-l-md after:rounded-r after:pointer-events-none"
          style={{
            width,
            background: "hsl(var(--card))",
          }}
        >
          {/* Top section */}
          <div
            className={cn(
              "w-full relative overflow-hidden",
              variant === "stripe" && "flex-1"
            )}
            style={{ background: resolvedColor }}
          >
            {variant === "stripe" && illustration !== null && (
              <div className={cn(
                "absolute inset-0 flex items-center justify-center",
                illustration ? "opacity-90" : "opacity-30"
              )}>
                {resolvedIllustration}
              </div>
            )}
            {/* Spine highlight */}
            <div
              className="absolute h-full w-[8.2%] mix-blend-overlay"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.08) 40%, transparent 100%)",
              }}
            />
          </div>

          {/* Bottom section with title */}
          <div
            className={cn(
              "relative flex-1",
              variant === "stripe" && "bg-gradient-to-b from-card to-background"
            )}
            style={{
              background:
                variant === "simple" && color
                  ? resolvedColor
                  : undefined,
            }}
          >
            {/* Spine shadow on bottom */}
            <div
              className="absolute h-full w-[8.2%] opacity-20"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.4), transparent)",
              }}
            />
            <div
              className={cn(
                "flex flex-col w-full p-[6.1%] pl-[14.3%]",
                variant === "simple" ? "gap-4" : "justify-between"
              )}
              style={{
                containerType: "inline-size",
                gap: `calc((24px / 196) * ${width})`,
              }}
            >
              <span
                className={cn(
                  "leading-[1.25em] tracking-[-.02em] text-balance font-semibold",
                  variant === "simple" ? "text-[12cqw]" : "text-[10.5cqw]"
                )}
                style={{ color: resolvedTextColor }}
              >
                {title}
              </span>
              {variant === "stripe" ? (
                <svg
                  className="scale-75 -ml-1 -mb-1"
                  height="24"
                  width="24"
                  style={{ fill: resolvedTextColor }}
                >
                  <path d="M21,21H3L12,3Z" />
                </svg>
              ) : (
                resolvedIllustration
              )}
            </div>
          </div>

          {/* Texture overlay */}
          {textured && (
            <div className="absolute inset-0 rounded-l-md rounded-r mix-blend-soft-light pointer-events-none opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-repeat" />
          )}
        </div>

        {/* Spine (right edge) */}
        <div
          className="h-[calc(100%_-_6px)] absolute top-[3px]"
          style={{
            width: `calc(29cqw - 2px)`,
            background:
              "linear-gradient(90deg, hsl(var(--border)), transparent 70%), linear-gradient(hsl(var(--card)), hsl(var(--muted)))",
            transform: `translateX(calc(${width}px - 29cqw / 2 - 3px)) rotateY(90deg) translateX(calc(29cqw / 2))`,
          }}
        />

        {/* Back face */}
        <div
          className="absolute left-0 top-0 rounded-l-md rounded-r h-full"
          style={{
            width,
            background: "hsl(var(--muted))",
            transform: "translateZ(calc(-1 * 29cqw))",
          }}
        />
      </div>
    </div>
  );
}
