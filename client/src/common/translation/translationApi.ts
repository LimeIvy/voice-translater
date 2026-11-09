import type { LanguageCode } from "@/common/constants/languages";

export type TranslateInput = {
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
};

type TranslationResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};


const apiUrl = "http://127.0.0.1:8080";

export async function translateText({ text, targetLanguage }: TranslateInput) {
  const response = await fetch(`${apiUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{
        role: "user",
        content: [
          "<|plamo:tag|>dataset<|plamo:msg|>translation",
          `<|plamo:tag|>input<|plamo:msg|>${text}`,
          `<|plamo:tag|>output<|plamo:key|>lang<|plamo:val|>${targetLanguage}`,
          "<|plamo:key|>form<|plamo:val|>plain<|plamo:msg|>",
        ].join(""),
      }],
      temperature: 0,
      stream: false,
    }),
  });

  const data = (await response.json()) as TranslationResponse;
  if (!response.ok) throw new Error(data.error?.message ?? "翻訳に失敗しました");
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
