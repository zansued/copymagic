import * as React from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Eye, EyeOff, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

const PERSPECTIVE = 1000;

interface CreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  variant?: "gradient" | "dark" | "glass";
}

export function CreditCard({
  cardNumber = "4532 •••• •••• 9010",
  cardHolder = "SEU NOME",
  expiryDate = "12/28",
  cvv = "•••",
  variant = "gradient",
  className,
}: CreditCardProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [isClicked, setIsClicked] = React.useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - (rect.left + rect.width / 2));
    y.set(event.clientY - (rect.top + rect.height / 2));
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variantStyles = {
    gradient: "bg-gradient-to-br from-primary via-primary/80 to-accent",
    dark: "bg-gradient-to-br from-card via-muted to-card",
    glass: "bg-card/50 backdrop-blur-xl border border-border/30",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className="relative w-80 h-48 sm:w-96 sm:h-56"
        style={{ perspective: PERSPECTIVE }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="relative w-full h-full cursor-pointer"
          style={{
            transformStyle: "preserve-3d",
            rotateX,
            rotateY: isFlipped ? 180 : rotateY,
          }}
          animate={{ scale: isClicked ? 0.95 : 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 20 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            setIsClicked(true);
            setTimeout(() => setIsClicked(false), 200);
            setTimeout(() => setIsFlipped(!isFlipped), 100);
          }}
        >
          {/* Front */}
          <motion.div
            className={cn(
              "absolute inset-0 rounded-2xl p-6 sm:p-8 shadow-2xl",
              variantStyles[variant]
            )}
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {/* Shimmer */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
              />
            </div>

            <div className="relative h-full flex flex-col justify-between text-primary-foreground">
              <div className="flex justify-between items-start">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-7 sm:w-12 sm:h-9 rounded bg-gradient-to-br from-amber-600 to-yellow-700 shadow-inner" />
                  <Wifi className="w-5 h-5 sm:w-6 sm:h-6 rotate-90 opacity-80" />
                </motion.div>

                <motion.button
                  className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(!isVisible);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isVisible ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </motion.button>
              </div>

              <motion.div
                className="text-lg sm:text-2xl font-mono tracking-wider"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {isVisible ? "4532 1234 5678 9010" : cardNumber}
              </motion.div>

              <div className="flex justify-between items-end">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <div className="text-[10px] sm:text-xs opacity-70 mb-0.5">TITULAR</div>
                  <div className="font-medium text-xs sm:text-sm tracking-wide">{cardHolder}</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <div className="text-[10px] sm:text-xs opacity-70 mb-0.5">VALIDADE</div>
                  <div className="font-medium text-xs sm:text-sm">{isVisible ? expiryDate : "••/••"}</div>
                </motion.div>
                <motion.div
                  className="text-2xl sm:text-3xl font-bold italic opacity-90"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                >
                  VISA
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Back */}
          <motion.div
            className={cn("absolute inset-0 rounded-2xl shadow-2xl", variantStyles[variant])}
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="absolute top-8 left-0 right-0 h-12 bg-black/80" />
            <div className="absolute top-24 left-6 right-6 bg-white/90 h-10 rounded flex items-center justify-end px-3">
              <span className="text-foreground font-mono font-bold text-sm">
                {isVisible ? "123" : cvv}
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-primary-foreground text-[10px] space-y-1 opacity-60">
              <p>Pagamento seguro via Mercado Pago</p>
              <p>Seus dados são criptografados e protegidos.</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Glow effects */}
        <motion.div
          className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-4 -left-4 w-24 h-24 bg-accent/20 rounded-full blur-2xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
