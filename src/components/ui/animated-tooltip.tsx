import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import { cn } from "@/lib/utils";

export interface TooltipItem {
  id: string;
  name: string;
  designation: string;
  image?: string;
  initials?: string;
  color?: string;
}

export const AnimatedTooltip = ({
  items,
  className,
}: {
  items: TooltipItem[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<string | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const halfWidth = target.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  const roleColors: Record<string, string> = {
    owner: "from-amber-500 via-amber-400 to-yellow-300",
    admin: "from-primary via-violet-400 to-purple-300",
    editor: "from-blue-500 via-blue-400 to-cyan-300",
    viewer: "from-muted-foreground via-muted-foreground to-muted",
  };

  return (
    <div className={cn("flex items-center", className)}>
      {items.map((item) => (
        <div
          className="-mr-3 relative group"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 10,
                  },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute -top-16 -left-1/2 translate-x-1/2 flex text-xs flex-col items-center justify-center rounded-md bg-foreground z-50 shadow-xl px-4 py-2"
              >
                <div className="absolute inset-x-10 z-30 w-[20%] -bottom-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent h-px" />
                <div className="absolute left-10 w-[40%] z-30 -bottom-px bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px" />
                <div className="font-bold text-background relative z-30 text-base">
                  {item.name}
                </div>
                <div className="text-muted text-xs">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>

          {item.image ? (
            <img
              onMouseMove={handleMouseMove}
              src={item.image}
              alt={item.name}
              className="object-cover !m-0 !p-0 object-top rounded-full h-12 w-12 border-2 group-hover:scale-105 group-hover:z-30 border-background relative transition duration-500"
            />
          ) : (
            <div
              onMouseMove={handleMouseMove}
              className={cn(
                "!m-0 !p-0 rounded-full h-12 w-12 border-2 border-background relative transition duration-500",
                "group-hover:scale-105 group-hover:z-30",
                "flex items-center justify-center text-sm font-bold",
                "bg-gradient-to-br text-white shadow-lg",
                roleColors[item.designation.toLowerCase()] || roleColors.viewer
              )}
            >
              {item.initials || item.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
