import { useEffect, useRef, useState } from "react";
import { MyIcon } from "./Icons";
import { useQuery } from "@tanstack/react-query";
import { cancelTts, enqueueTts, prepareTts, unlockTts } from "../lib/ttsPlayback";
import type { Playback } from "../lib/ttsPlayback";

type Props = { text: string; createdAt: number; index: number };

export function TtsAudio({ text, createdAt, index }: Props) {
  const playbackRef = useRef<Playback | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
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
    if (!data) return;
    let disposed = false;
    void prepareTts(data).then((buffer) => {
      if (disposed) return;
      const item: Playback = {
        buffer,
        onPlaying: (playing) => {
          setIsPlaying(playing);
          if (playing) setPlaybackError("");
        },
        onBlocked: () => setPlaybackError("再生ボタンを押して音声を有効にしてください。"),
      };
      playbackRef.current = item;
      enqueueTts(item);
    }).catch(() => {
      if (!disposed) setPlaybackError("音声を読み込めませんでした。");
    });
    return () => {
      disposed = true;
      if (playbackRef.current) cancelTts(playbackRef.current);
      playbackRef.current = null;
    };
  }, [data]);

  if (isPending) return <p className="mt-2 text-xs text-muted-foreground" role="status">音声を生成中…</p>;
  if (error) return <p className="mt-2 text-xs text-destructive" role="alert">{error.message}</p>;
  return data ? (
    <>
      <button
        type="button"
        className="mt-2 inline-flex size-8 items-center justify-center rounded-full border hover:bg-blue-100"
        aria-label={isPlaying ? "読み上げを停止" : "翻訳文を再生"}
        onClick={() => {
          const item = playbackRef.current;
          if (!item) return;
          if (isPlaying) cancelTts(item);
          else {
            void unlockTts().then(() => enqueueTts(item)).catch(item.onBlocked);
          }
        }}
      >
        {isPlaying ? <MyIcon name="pause" size={16}/> : <MyIcon name="play" size={16}/>}
      </button>
      {playbackError && <p className="text-xs text-muted-foreground" role="status">{playbackError}</p>}
    </>
  ) : null;
}
