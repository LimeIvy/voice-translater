import { useEffect, useRef } from "react";
import { useSpeech } from "@/common/tts/useSpeech";
import type { TranslationSegment } from "@/common/translation/translationStore";
import { getCurrentTime } from "@/common/lib/utils";
import { SpeechButton } from "./speech-button";

type TranslationBubbleProps = {
  segment?: TranslationSegment;
  interimText?: string;
  languageCode?: string;
};

export function TranslationBubble({ segment, interimText, languageCode = "ja" }: TranslationBubbleProps) {
  const { play, stop, status, error } = useSpeech();
  const text = segment?.text ?? interimText;
  const isSelf = (segment?.speaker ?? "self") === "self";
  const translation = segment?.translation?.trim() ?? "";
  const previousTranslationRef = useRef(translation);

  useEffect(() => {
    const previousTranslation = previousTranslationRef.current;
    previousTranslationRef.current = translation;

    if (
      !segment ||
      !isSelf ||
      !translation ||
      previousTranslation ||
      previousTranslation === translation
    ) {
      return;
    }

    void play(translation);
  }, [segment, isSelf, translation, play]);

  if (!text) return null;

  return (
    <div className={isSelf ? "ml-auto flex w-full max-w-[90%] items-end justify-end gap-2" : "mr-auto flex w-full max-w-[90%] items-end justify-start gap-2"}>
      {segment && (
        <time className={isSelf ? "mb-1 shrink-0 self-end whitespace-nowrap text-[10px] leading-none text-muted-foreground" : "order-2 mb-1 shrink-0 self-end whitespace-nowrap text-[10px] leading-none text-muted-foreground"}>
          {getCurrentTime(languageCode)}
        </time>
      )}

      <div className={isSelf ? "min-w-0 rounded-xl border border-blue-100 bg-secondary px-4 py-3" : "min-w-0 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3"}>
        <p className="text-sm leading-relaxed text-slate-500">{text}</p>
        {segment && (
          <div className="mt-1 flex flex-col items-start gap-2">
            <p className="text-lg font-bold leading-snug text-slate-900">{segment.translation || "翻訳中…"}</p>
            {isSelf && (
              <SpeechButton
                text={translation}
                status={status}
                error={error}
                play={play}
                stop={stop}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
