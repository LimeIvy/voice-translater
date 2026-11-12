import { afterEach, expect, it, vi } from "vitest";
import { generateSpeech } from "./ttsApi";

afterEach(() => vi.unstubAllGlobals());

it("sends trimmed text and the cancellation signal, then returns audio", async () => {
  const audio = new Blob(["RIFF"], { type: "audio/wav" });
  const fetchMock = vi.fn().mockResolvedValue(new Response(audio));
  vi.stubGlobal("fetch", fetchMock);
  const controller = new AbortController();
  const result = await generateSpeech(" hello ", controller.signal);
  expect(await result.text()).toBe("RIFF");
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/tts$/), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "hello" }),
    signal: controller.signal,
  });
});

it("rejects empty text without sending a request", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  await expect(generateSpeech("  ")).rejects.toThrow("文章がありません");
  expect(fetchMock).not.toHaveBeenCalled();
});

it("reports a backend timeout", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 504 })));
  await expect(generateSpeech("hello")).rejects.toThrow("タイムアウト");
});
