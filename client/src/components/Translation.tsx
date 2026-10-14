import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

type Props = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

type TranslationResponse = { translations: string[][] };

const apiURL = import.meta.env.VITE_API_URL;

export function Translation({ text, sourceLanguage, targetLanguage }: Props) {
  const [debouncedText, setDebouncedText] = useState("");
  const isDebouncing = text.trim() !== debouncedText;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedText(text.trim()), 700);
    return () => window.clearTimeout(timer);
  }, [text]);

  const { data, error, isFetching } = useQuery({
    queryKey: ["translation", debouncedText, sourceLanguage, targetLanguage],
    enabled: Boolean(debouncedText) && !isDebouncing,
    retry: false,
    queryFn: async (): Promise<TranslationResponse> => {
      if (!apiURL) throw new Error("VITE_API_URL が設定されていません。");

      const response = await fetch(`${apiURL}/api/v1/translation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: debouncedText,
          source_language: sourceLanguage,
          target_language: targetLanguage,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "翻訳に失敗しました。");
      return result as TranslationResponse;
    },
  });

  return (
    <div className="w-4/5 rounded border p-2">
      {error && !isDebouncing
        ? error.message
        : isDebouncing || isFetching
          ? "翻訳中..."
          : data?.translations.map(([original, translated]) => (
              <p key={original}>{translated}</p>
            )) ?? "翻訳結果がここに表示されます"}
    </div>
  );
}
