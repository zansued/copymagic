import { memo, forwardRef, useState } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";

const AnimatedInput = memo(
  forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    function AnimatedInput({ className, type, ...props }, ref) {
      const radius = 100;
      const [visible, setVisible] = useState(false);
      const mouseX = useMotionValue(0);
      const mouseY = useMotionValue(0);

      function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }

      return (
        <motion.div
          style={{
            background: useMotionTemplate`radial-gradient(${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px, hsl(var(--primary) / 0.4), transparent 80%)`,
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          className="group/input rounded-lg p-[2px] transition duration-300"
        >
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-md border-none bg-card px-4 py-2 text-sm text-foreground",
              "transition duration-400 placeholder:text-muted-foreground",
              "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "shadow-[0px_0px_1px_1px_hsl(var(--border))]",
              className
            )}
            ref={ref}
            {...props}
          />
        </motion.div>
      );
    }
  )
);

AnimatedInput.displayName = "AnimatedInput";
export { AnimatedInput };
