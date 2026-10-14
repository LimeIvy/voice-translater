import os
from typing import Any

import httpx

SOURCE_LANGUAGES = {
    "ja-JP": "JA",
    "en-US": "EN",
    "zh-CN": "ZH",
    "ko-KR": "KO",
    "de-DE": "DE",
    "es-ES": "ES",
    "fr-FR": "FR",
    "it-IT": "IT",
    "ru-RU": "RU",
}

TARGET_LANGUAGES = {
    "ja-JP": "JA",
    "en-US": "EN-US",
    "zh-CN": "ZH",
    "ko-KR": "KO",
    "de-DE": "DE",
    "es-ES": "ES",
    "fr-FR": "FR",
    "it-IT": "IT",
    "ru-RU": "RU",
}


class TranslationService:
    async def translate(self, text: str, source: str, target: str) -> str:
        """指定した言語間で文章を翻訳します。"""
        normalized_text = text.strip()
        if not normalized_text:
            return ""

        source_language = SOURCE_LANGUAGES.get(source)
        if source_language is None:
            raise ValueError(f"対応していない翻訳元の言語コードです: {source}")

        target_language = TARGET_LANGUAGES.get(target)
        if target_language is None:
            raise ValueError(f"対応していない翻訳先の言語コードです: {target}")

        if source == target:
            return normalized_text
            
        api_key = os.getenv("DEEPL_API_KEY")
        if not api_key:
            raise RuntimeError("DEEPL APIキーが設定されていません。")

        api_url = os.getenv("DEEPL_API_URL")
        if not api_url:
            raise RuntimeError("DEEPL API URLが設定されていません。")

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    api_url,
                    headers={"Authorization": f"DeepL-Auth-Key {api_key}"},
                    data={
                        "text": normalized_text,
                        "source_lang": source_language,
                        "target_lang": target_language,
                    },
                )
        except httpx.HTTPError as error:
            raise RuntimeError("DeepL APIに接続できませんでした。") from error

        if not response.is_success:
            try:
                detail: Any = response.json()
            except ValueError:
                detail = response.text
            raise RuntimeError(
                f"DeepL APIでエラーが発生しました (HTTP {response.status_code}): {detail}"
            )

        try:
            data = response.json()
        except ValueError as error:
            raise RuntimeError("DeepL APIから正しいJSON応答が返りませんでした。") from error

        translations = data.get("translations", [])
        if not translations:
            raise RuntimeError("DeepL APIから翻訳結果が返りませんでした。")

        translated_text = translations[0].get("text", "").strip()
        if not translated_text:
            raise RuntimeError("DeepL APIから空の翻訳結果が返りました。")

        return translated_text
