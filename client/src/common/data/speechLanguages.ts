export const speechLanguages = [
  { code: "zh-CN", name: "中国語" },
  { code: "en-US", name: "英語" },
  { code: "ja-JP", name: "日本語" },
  { code: "ko-KR", name: "韓国語" },
  { code: "de-DE", name: "ドイツ語" },
  { code: "es-ES", name: "スペイン語" },
  { code: "fr-FR", name: "フランス語" },
  { code: "it-IT", name: "イタリア語" },
  { code: "ru-RU", name: "ロシア語" },
] as const;

export type SpeechLanguageCode = (typeof speechLanguages)[number]["code"];
