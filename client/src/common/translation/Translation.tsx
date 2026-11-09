import { useEffect, useRef } from "react";
import { TranslationBubble } from "@/common/components/ui/bubble";
import type { LanguageCode } from "@/common/constants/languages";
import { useTranslationStore } from "./translationStore";
import { useTranslation } from "./useTranslation";

type Props = { sourceLanguage: string; targetLanguage: string; interimText: string };

export function Translation({ sourceLanguage, targetLanguage, interimText }: Props) {
  const segments = useTranslationStore((state) => state.segments);
  const setTranslation = useTranslationStore((state) => state.setTranslation);
  const { mutateAsync, error } = useTranslation();
  const translatingRef = useRef(new Set<string>());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const container = scrollRef.current;
      container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [segments, interimText]);

  useEffect(() => {
    const pending = segments.map((segment, index) => ({ segment, index })).filter(({ segment }) => segment.text && !segment.translation);
    const requests = pending.filter(({ segment, index }) => {
      const key = `${index}:${segment.text}:${sourceLanguage}:${targetLanguage}`;
      if (translatingRef.current.has(key)) return false;
      translatingRef.current.add(key);
      return true;
    });

    void Promise.all(requests.map(async ({ segment, index }) => {
      const key = `${index}:${segment.text}:${sourceLanguage}:${targetLanguage}`;
      try {
        const result = await mutateAsync({
          text: segment.text,
          sourceLanguage: sourceLanguage.split("-")[0] as LanguageCode,
          targetLanguage: targetLanguage.split("-")[0] as LanguageCode,
        });
        setTranslation(index, result);
      } finally {
        translatingRef.current.delete(key);
      }
    }));
  }, [segments, sourceLanguage, targetLanguage, setTranslation, mutateAsync]);

  return (
    <div ref={scrollRef} className="mx-auto h-120 w-100 max-w-full overflow-y-auto rounded-2xl p-4">
      <div className="flex min-h-full flex-col justify-end gap-4">
        {!segments.length && !interimText && <p className="my-auto text-center text-sm text-muted-foreground">翻訳結果がここに表示されます</p>}
        {segments.map((segment, index) => (
          <TranslationBubble key={index} segment={error?.message === segment.text ? { ...segment, translation: "翻訳に失敗しました" } : segment} languageCode={sourceLanguage} />
        ))}
        {interimText && <TranslationBubble interimText={interimText} languageCode={sourceLanguage} />}
      </div>
    </div>
  );
}
