import { LoaderCircle, Play, Square } from "lucide-react";

type SpeechStatus = "idle" | "loading" | "playing";

type SpeechButtonProps = {
  text: string;
  status: SpeechStatus;
  error: string | null;
  play: (text: string) => Promise<void>;
  stop: () => void;
};

export function SpeechButton({ text, status, error, play, stop }: SpeechButtonProps) {
  return (
    <div>
      <button
        type="button"
        disabled={status === "idle" && !text}
        aria-label={status === "loading" ? "音声生成をキャンセル" : status === "playing" ? "再生を停止" : "音声を再生"}
        onClick={() => {
          if (status !== "idle") stop();
          else void play(text);
        }}
        className="mt-1 flex cursor-pointer items-center gap-1 rounded-full text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          : status === "playing" ? <Square className="h-4 w-4" fill="currentColor" aria-hidden="true" />
          : <Play className="h-4 w-4" fill="currentColor" aria-hidden="true" />}
        {status !== "idle" && <span className="text-xs">{status === "loading" ? "生成中… キャンセル" : "停止"}</span>}
      </button>
      {error && <p role="alert" className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
