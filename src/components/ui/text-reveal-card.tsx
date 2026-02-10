import React, { useEffect, useRef, useState, memo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const TextRevealCard = ({
  text,
  revealText,
  children,
  className,
}: {
  text: string;
  revealText: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [widthPercentage, setWidthPercentage] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(0);
  const [localWidth, setLocalWidth] = useState(0);
  const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setLeft(rect.left);
      setLocalWidth(rect.width);
    }
  }, []);

  function mouseMoveHandler(event: React.MouseEvent) {
    event.preventDefault();
    if (cardRef.current) {
      const relativeX = event.clientX - left;
      setWidthPercentage((relativeX / localWidth) * 100);
    }
  }

  function touchMoveHandler(event: React.TouchEvent) {
    event.preventDefault();
    const clientX = event.touches[0]!.clientX;
    if (cardRef.current) {
      const relativeX = clientX - left;
      setWidthPercentage((relativeX / localWidth) * 100);
    }
  }

  const rotateDeg = (widthPercentage - 50) * 0.1;

  return (
    <div
      onMouseEnter={() => setIsMouseOver(true)}
      onMouseLeave={() => { setIsMouseOver(false); setWidthPercentage(0); }}
      onMouseMove={mouseMoveHandler}
      onTouchStart={() => setIsMouseOver(true)}
      onTouchEnd={() => { setIsMouseOver(false); setWidthPercentage(0); }}
      onTouchMove={touchMoveHandler}
      ref={cardRef}
      className={cn(
        "bg-card border border-border rounded-lg p-6 relative overflow-hidden",
        className
      )}
    >
      {children}

      <div className="h-32 relative flex items-center overflow-hidden">
        <motion.div
          style={{ width: "100%" }}
          animate={
            isMouseOver
              ? { opacity: widthPercentage > 0 ? 1 : 0, clipPath: `inset(0 ${100 - widthPercentage}% 0 0)` }
              : { clipPath: `inset(0 ${100 - widthPercentage}% 0 0)` }
          }
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          className="absolute bg-card z-20 will-change-transform"
        >
          <p
            style={{ textShadow: "4px 4px 15px hsl(var(--glow) / 0.4)" }}
            className="text-base sm:text-2xl py-8 font-bold bg-clip-text text-transparent bg-gradient-to-b from-foreground to-muted-foreground"
          >
            {revealText}
          </p>
        </motion.div>

        <motion.div
          animate={{
            left: `${widthPercentage}%`,
            rotate: `${rotateDeg}deg`,
            opacity: widthPercentage > 0 ? 1 : 0,
          }}
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          className="h-32 w-[4px] bg-gradient-to-b from-transparent via-primary to-transparent absolute z-50 will-change-transform"
        />

        <div className="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]">
          <p className="text-base sm:text-2xl py-8 font-bold bg-clip-text text-transparent bg-muted-foreground/30">
            {text}
          </p>
          <MemoizedStars />
        </div>
      </div>
    </div>
  );
};

export const TextRevealCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 className={cn("text-foreground text-lg font-bold mb-1", className)}>
    {children}
  </h2>
);

export const TextRevealCardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={cn("text-muted-foreground text-sm", className)}>{children}</p>
);

const Stars = () => {
  const random = () => Math.random();
  const randomMove = () => Math.random() * 4 - 2;
  return (
    <div className="absolute inset-0">
      {[...Array(40)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: random(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 10 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: "2px",
            height: "2px",
            backgroundColor: "hsl(var(--primary))",
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block"
        />
      ))}
    </div>
  );
};

export const MemoizedStars = memo(Stars);
