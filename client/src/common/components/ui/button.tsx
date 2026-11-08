import { Button, type ButtonProps } from "@heroui/react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/common/lib/utils";

export type AppButtonProps = Omit<ButtonProps, "className"> & {
  className?: string;
};

const variantStyles: Partial<
  Record<NonNullable<ButtonProps["variant"]>, string>
> = {
  primary:
    "bg-primary text-button-surface shadow-primary",
  secondary:
    "border border-button-border bg-button-surface shadow-secondary text-button-text",
};

const baseStyles =
  "min-h-12 rounded-button px-5 text-base font-black disabled:shadow-none";

export default function AppButton({
  children = "Click Me",
  className,
  size = "md",
  variant = "primary",
  ...props
}: AppButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const isInteractionDisabled = props.isDisabled || props.isPending;
  const isAnimating = !shouldReduceMotion && !isInteractionDisabled;

  return (
    <motion.span
      className="inline-flex"
      whileHover={
        isAnimating ? { filter: "brightness(1.05)" } : undefined
      }
      whileTap={
        isAnimating
          ? {
              y: 2,
              scale: 0.80,
              filter: "brightness(0.97)",
              transition: { type: "spring", stiffness: 1000, damping: 60 },
            }
          : undefined
      }
      transition={{ type: "spring", stiffness: 500, damping: 45 }}
    >
      <Button
        {...props}
        className={cn(baseStyles, variantStyles[variant], className)}
        size={size}
        variant={variant}
      >
        {children}
      </Button>
    </motion.span>
  );
}
