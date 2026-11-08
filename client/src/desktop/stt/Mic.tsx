import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import MicButton from "../../common/components/ui/mic-button";
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

  const [isLoading, setIsLoading] = useState(false);

  const start = async () => {
    if (!deviceId) {
      return;
    }

    setResult(null);

    await invoke("start_recording", {
      deviceId,
    });

  };

  const end = async () => {
    const recording =
      await invoke<RecordingResult>(
        "stop_recording",
        { language },
      );

    setResult(recording);
  };

  const handleRecordingChange = async (nextIsRecording: boolean) => {
    setIsLoading(true);

    try {
      if (nextIsRecording) {
        await start();
      } else {
        await end();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {result && (
        <div>
          <p>文字起こし：{result.transcript}</p>
        </div>
      )}
      <div className="flex items-center justify-center gap-2">
        <MicButton
          isLoading={isLoading}
          onRecordingChange={handleRecordingChange}
        />
      </div>
    </div>
  );
}
