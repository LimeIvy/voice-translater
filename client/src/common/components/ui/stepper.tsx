import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/common/lib/utils";

export type StepperProps = {
  steps: number;
  activeStep?: number;
  descriptions?: string[];
  className?: string;
};

export default function Stepper({
  steps,
  activeStep = 0,
  descriptions,
  className,
}: StepperProps) {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError("steps must be a positive integer");
  }

  if (!Number.isInteger(activeStep) || activeStep < 0 || activeStep > steps) {
    throw new RangeError("activeStep must be within the steps range");
  }

  if (descriptions && descriptions.length !== steps) {
    throw new RangeError("descriptions must contain one entry per step");
  }

  const shouldReduceMotion = useReducedMotion();
  const isComplete = activeStep === steps;
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 28 };

  return (
    <motion.nav
      aria-hidden={isComplete}
      aria-label="Progress"
      animate={{ opacity: isComplete ? 0 : 1 }}
      className={className}
      initial={false}
      style={{ pointerEvents: isComplete ? "none" : undefined }}
      transition={{
        duration: isComplete ? (shouldReduceMotion ? 0.15 : 0.35) : 0.2,
        delay: isComplete ? (shouldReduceMotion ? 0.15 : 0.75) : 0,
      }}
    >
      <ol className="flex w-[150%] items-start">
        {Array.from({ length: steps }, (_, index) => {
          const isCompleted = index < activeStep;
          const isActive = activeStep < steps && index === activeStep;
          const isHighlighted = isCompleted || isActive;

          return (
            <li
              aria-current={isActive ? "step" : undefined}
              aria-label={`ステップ ${index + 1}${isCompleted ? " 完了" : isActive ? " 進行中" : ""}`}
              className="relative flex min-w-0 flex-1 flex-col items-center"
              key={index}
            >
              {index < steps - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-5 z-0 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-button-border"
                  style={{
                    left: "calc(50% + 20px)",
                    width: "calc(100% - 40px)",
                  }}
                >
                  <motion.span
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    className="absolute inset-0 origin-left rounded-full bg-primary"
                    initial={false}
                    transition={transition}
                  />
                </span>
              )}
              <motion.span
                animate={{ scale: isActive ? 1.06 : 1 }}
                className={cn(
                  "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  isActive ? "text-white" : "text-button-text",
                  isHighlighted
                    ? "bg-primary shadow-primary"
                    : "bg-button-surface ring-1 ring-inset ring-button-border",
                )}
                initial={false}
                transition={transition}
              >
                {isCompleted ? (
                  <motion.span
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    aria-hidden="true"
                    className="text-white"
                    initial={
                      shouldReduceMotion
                        ? false
                        : { opacity: 0, scale: 0.5, rotate: -45 }
                    }
                    transition={transition}
                  >
                    <Check size={18} strokeWidth={3} />
                  </motion.span>
                ) : (
                  index + 1
                )}
              </motion.span>
              {descriptions && (
                <span
                  className={cn(
                    "mt-4 text-center text-sm font-normal",
                    isHighlighted ? "text-[#168B73]" : "text-[#687A99]",
                  )}
                >
                  {descriptions[index]}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
}
