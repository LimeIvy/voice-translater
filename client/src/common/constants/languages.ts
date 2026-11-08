export const LANGUAGES = [
  { code: "ja", flag: "jp", label: "日本語", icon: "flags/jp.svg" },
  { code: "en", flag: "us", label: "英語",  icon: "flags/us.svg" },
  { code: "zh", flag: "cn", label: "中国語", icon: "flags/cn.svg" },
  { code: "ko", flag: "kr", label: "韓国語", icon: "flags/kr.svg" },
  { code: "de", flag: "de", label: "ドイツ語", icon: "flags/de.svg" },
  { code: "es", flag: "es", label: "スペイン語", icon: "flags/es.svg" },
  { code: "fr", flag: "fr", label: "フランス語", icon: "flags/fr.svg" },
  { code: "it", flag: "it", label: "イタリア語", icon: "flags/it.svg" },
  { code: "ru", flag: "ru", label: "ロシア語", icon: "flags/ru.svg" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
