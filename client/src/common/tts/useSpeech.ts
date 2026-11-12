import { useCallback, useEffect, useRef, useState } from "react";
import { generateSpeech } from "./ttsApi";

const speechCache = new Map<string, Blob>();
const speechRequests = new Map<string, Promise<Blob>>();

type SpeechStatus = "idle" | "loading" | "playing";

export function useSpeech() {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    requestIdRef.current += 1;
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const play = useCallback(async (text: string) => {
    const cacheKey = text.trim();
    if (!cacheKey) return;

    const requestId = ++requestIdRef.current;
    cleanup();
    setError(null);
    setStatus("loading");
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      let blob = speechCache.get(cacheKey);
      if (!blob) {
        let request = speechRequests.get(cacheKey);
        if (!request) {
          request = generateSpeech(cacheKey, controller.signal)
            .then((result) => {
              speechCache.set(cacheKey, result);
              speechRequests.delete(cacheKey);
              return result;
            })
            .catch((cause) => {
              speechRequests.delete(cacheKey);
              throw cause;
            });
          speechRequests.set(cacheKey, request);
        }
        blob = await request;
      }

      if (requestId !== requestIdRef.current) return;
      controllerRef.current = null;
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        if (requestId !== requestIdRef.current) return;
        cleanup();
        setStatus("idle");
      };
      audio.onerror = () => {
        if (requestId !== requestIdRef.current) return;
        requestIdRef.current += 1;
        cleanup();
        setError("音声を再生できませんでした。");
        setStatus("idle");
      };

      await audio.play();
      if (requestId === requestIdRef.current && audioRef.current === audio) {
        setStatus("playing");
      }
    } catch (cause) {
      if (requestId !== requestIdRef.current) return;
      cleanup();
      setStatus("idle");
      setError(
        cause instanceof TypeError
          ? "音声生成サービスに接続できません。サーバーの起動と接続先を確認してください。"
          : cause instanceof Error ? cause.message : "音声の取得または再生に失敗しました。",
      );
    }
  }, [cleanup]);

  useEffect(() => () => {
    requestIdRef.current += 1;
    cleanup();
  }, [cleanup]);

  return { play, stop, status, error };
}
