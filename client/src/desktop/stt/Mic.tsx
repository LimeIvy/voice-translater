import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import AppButton from "../../common/components/ui/button";
import type { SpeechLanguageCode } from "@/common/data/speechLanguages";

type RecordingResult = {
  sampleCount: number;
  sampleRate: number;
  channels: number;
  durationSeconds: number;
  transcript: string;
};

type MicProps = {
  deviceId: string;
  language: SpeechLanguageCode;
};

export default function Mic({
  deviceId,
  language,
}: MicProps) {
  const [result, setResult] =
    useState<RecordingResult | null>(null);

  const [isRecording, setIsRecording] =
    useState(false);

  const start = async () => {
    if (!deviceId) {
      return;
    }

    setResult(null);

    await invoke("start_recording", {
      deviceId,
    });

    setIsRecording(true);
  };

  const stop = async () => {
    const recording =
      await invoke<RecordingResult>(
        "stop_recording",
        { language },
      );

    setResult(recording);
    setIsRecording(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <AppButton
          isDisabled={!deviceId || isRecording}
          onPress={start}
        >
          録音開始
        </AppButton>

        <AppButton
          isDisabled={!isRecording}
          onPress={stop}
        >
          録音停止
        </AppButton>
      </div>

      {result && (
        <div>
          <p>
            録音時間：
            {result.durationSeconds.toFixed(1)}秒
          </p>

          <p>
            文字起こし：{result.transcript}
          </p>
        </div>
      )}
    </div>
  );
}
