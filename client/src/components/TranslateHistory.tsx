import { useEffect, useRef } from "react";
import { useTranslationStore } from "../store/translation";

type Props = { errors?: (string | undefined)[]; interimText?: string };

export function TranslateHistory({ errors = [], interimText = "" }: Props) {
  const segments = useTranslationStore((state) => state.segments);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments, interimText]);

  return (
    <div className="mx-auto h-120 w-100 max-w-full overflow-y-auto rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex min-h-full flex-col justify-end gap-4">
        {!segments.length && !interimText && (
          <p className="my-auto text-center text-sm text-muted-foreground">
            翻訳結果がここに表示されます
          </p>
        )}
        {segments.map((segment, index) => (
          <article key={index} className="ml-auto w-fit max-w-[92%]">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-left">
              <p className="whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-slate-500">
                {segment.text}
              </p>
              <p
                aria-live="polite"
                className={`mt-0.5 whitespace-pre-wrap wrap-break-word text-lg leading-snug ${
                  segment.translation ? "text-slate-900" : errors[index] ? "text-destructive" : "text-slate-500"
                }`}
              >
                {segment.translation || errors[index] || "翻訳中…"}
              </p>
            </div>
            <time
              dateTime={new Date(segment.createdAt).toISOString()}
              className="mt-1 block text-right text-[10px] tabular-nums text-muted-foreground"
            >
              {new Date(segment.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
            </time>
          </article>
        ))}
        {interimText && (
          <div className="ml-auto max-w-[92%] rounded-xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-3">
            <p className="whitespace-pre-wrap wrap-break-word text-xs leading-relaxed text-muted-foreground">{interimText}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
