import { useEffect, useRef, useState } from "react";
import { MyIcon } from "./Icons";
import { useQuery } from "@tanstack/react-query";
import { cancelTts, enqueueTts } from "../lib/ttsPlayback";

type Props = { text: string; createdAt: number; index: number };

export function TtsAudio({ text, createdAt, index }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { data, error, isPending } = useQuery({
    queryKey: ["tts", createdAt, index, text],
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async ({ signal }) => {
      const apiURL = import.meta.env.VITE_API_URL;
      if (!apiURL) throw new Error("VITE_API_URL が設定されていません。");
      const response = await fetch(`${apiURL}/api/v1/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { detail?: unknown } | null;
        throw new Error(typeof body?.detail === "string" ? body.detail : "音声生成に失敗しました。");
      }
      return response.blob();
    },
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!data || !audio) return;
    const url = URL.createObjectURL(data);
    audio.src = url;
    enqueueTts(audio);
    return () => {
      cancelTts(audio);
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
    };
  }, [data, error, isPending]);

  if (isPending) return <p className="mt-2 text-xs text-muted-foreground" role="status">音声を生成中…</p>;
  if (error) return <p className="mt-2 text-xs text-destructive" role="alert">{error.message}</p>;
  return data ? (
    <>
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        type="button"
        className="mt-2 inline-flex size-8 items-center justify-center rounded-full border hover:bg-blue-100"
        aria-label={isPlaying ? "読み上げを一時停止" : "翻訳文を再生"}
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) return;
          if (audio.paused) enqueueTts(audio);
          else audio.pause();
        }}
      >
        {isPlaying ? <MyIcon name="pause" size={16}/> : <MyIcon name="play" size={16}/>}
      </button>
    </>
  ) : null;
}
