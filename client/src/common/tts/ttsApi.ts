const apiUrl = (
  import.meta.env.VITE_TTS_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export async function generateSpeech(text: string, signal?: AbortSignal): Promise<Blob> {
  const trimmedText = text.trim();
  if (!trimmedText) throw new Error("読み上げる文章がありません。");

  const response = await fetch(`${apiUrl}/api/v1/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: trimmedText }),
    signal,
  });

  if (!response.ok) {
    const messages: Record<number, string> = {
      422: "読み上げる文章を確認してください。",
      502: "音声生成に失敗しました。",
      503: "音声生成サービスを利用できません。",
      504: "音声生成がタイムアウトしました。",
    };
    throw new Error(messages[response.status] ?? `音声生成に失敗しました（${response.status}）。`);
  }
  return response.blob();
}
