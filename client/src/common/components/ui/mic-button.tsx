import { Button, Spinner, type ButtonProps } from "@heroui/react";
import { Mic, Square } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/common/lib/utils";

type MicButtonProps = Omit<ButtonProps, "children" | "onPress"> & {
  isLoading?: boolean;
  onRecordingChange?: (isRecording: boolean) => void;
};

export default function MicButton({
  isLoading = false,
  onRecordingChange,
  ...props
}: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const toggleRecording = () => {
    const nextValue = !isRecording;
    setIsRecording(nextValue);
    onRecordingChange?.(nextValue);
  };

  return (
    <Button
      {...props}
      isIconOnly
      isDisabled={isLoading || props.isDisabled}
      variant="primary"
      className={cn(
        "aspect-square h-14 min-h-14 max-h-14 w-14 min-w-14 max-w-14 rounded-full border-0 bg-primary p-0 text-button-surface shadow-none outline-none ring-0 hover:bg-primary-hover",
        props.className,
      )}
      aria-label={isRecording ? "録音停止" : "録音開始"}
      aria-pressed={isRecording}
      aria-busy={isLoading}
      onPress={isLoading ? undefined : toggleRecording}
    >
      {isLoading ? (
        <Spinner size="md" color="current" />
      ) : (
        <span className="relative inline-flex h-11 w-11 items-center justify-center">
          <AnimatePresence initial={false} mode="wait">
            {isRecording ? (
              <motion.span
                key="stop"
                className="absolute inline-flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              >
                <Square
                  aria-hidden="true"
                  size={36}
                  style={{ width: 28, height: 28 }}
                  strokeWidth={2}
                  fill="currentColor"
                />
              </motion.span>
            ) : (
              <motion.span
                key="mic"
                className="absolute inline-flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              >
                <Mic
                  aria-hidden="true"
                  size={40}
                  style={{ width: 32, height: 32 }}
                  strokeWidth={2}
                />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      )}
    </Button>
  );
}
