import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HeadlineRevealProps {
  text: string;
  className?: string;
  delayStart?: number;
  gradient?: boolean;
}

export const HeadlineReveal: React.FC<HeadlineRevealProps> = ({
  text,
  className,
  delayStart = 300,
  gradient = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const words = text.split(" ");

  return (
    <div ref={containerRef} className="relative">
      <style>{`
        @keyframes headline-word-appear {
          0% { opacity: 0; transform: translateY(24px) scale(0.85); filter: blur(8px); }
          60% { opacity: 0.9; transform: translateY(4px) scale(0.97); filter: blur(1px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .headline-word {
          display: inline-block;
          opacity: 0;
          margin: 0 0.12em;
          transition: text-shadow 0.3s ease, transform 0.3s ease;
        }
        .headline-word-gradient {
          background: linear-gradient(135deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        }
        .headline-word.revealed {
          animation: headline-word-appear 0.7s ease-out forwards;
        }
        .headline-word:hover {
          text-shadow: 0 0 20px hsl(var(--primary) / 0.6);
          transform: translateY(-2px);
        }
        .headline-underline {
          width: 0;
          transition: width 1.5s ease-out;
        }
        .headline-underline.active {
          width: 100%;
        }
      `}</style>

      <p className={cn("flex flex-wrap justify-center leading-snug", className)}>
        {words.map((word, i) => (
          <span
            key={i}
            className={cn("headline-word cursor-default", gradient && "headline-word-gradient", visible && "revealed")}
            style={{ animationDelay: visible ? `${delayStart + i * 120}ms` : undefined }}
          >
            {word}
          </span>
        ))}
      </p>

      {/* Decorative underline */}
      <div className="flex justify-center mt-3">
        <div
          className={cn(
            "headline-underline h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent",
            visible && "active"
          )}
          style={{ transitionDelay: `${delayStart + words.length * 120 + 200}ms` }}
        />
      </div>
    </div>
  );
};
