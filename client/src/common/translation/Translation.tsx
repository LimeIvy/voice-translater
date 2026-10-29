import { useEffect } from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslationStore } from "./translationStore";
import { TranslateHistory } from "../../web/chat/TranslateHistory";

type Props = {
  sourceLanguage: string;
  targetLanguage: string;
  interimText: string;
};

type TranslationResponse = { translations: string[][]; detail?: string };
const apiURL = import.meta.env.VITE_API_URL;

export function Translation({
  sourceLanguage,
  targetLanguage,
  interimText,
}: Props) {
  const segments = useTranslationStore((state) => state.segments);
  const setTranslation = useTranslationStore((state) => state.setTranslation);
  const results = useQueries({
    queries: segments.map((segment, index) => ({
      queryKey: [
        "translation",
        index,
        segment.text,
        sourceLanguage,
        targetLanguage,
      ],
      enabled: !segment.translation,
      retry: false,
      queryFn: async () => {
        if (!apiURL) throw new Error("VITE_API_URL が設定されていません。");
        const response = await fetch(`${apiURL}/api/v1/translation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: segment.text,
            source_language: sourceLanguage,
            target_language: targetLanguage,
          }),
        });
        const data = (await response.json()) as TranslationResponse;
        if (!response.ok)
          throw new Error(data.detail ?? "翻訳に失敗しました。");
        return data.translations[0]?.[1] ?? "";
      },
    })),
  });

  useEffect(() => {
    results.forEach((result, index) => {
      if (result.data && !segments[index]?.translation)
        setTranslation(index, result.data);
    });
  }, [results, segments, setTranslation]);

  return (
    <TranslateHistory
      errors={results.map((result) => result.error?.message)}
      interimText={interimText}
    />
  );
}
