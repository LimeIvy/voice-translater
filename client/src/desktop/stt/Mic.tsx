import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import MicButton from "../../common/components/ui/mic-button";
import type { SpeechLanguageCode } from "@/common/data/speechLanguages";
import { useTranslationStore } from "@/common/translation/translationStore";

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
  const [isLoading, setIsLoading] = useState(false);
  const addSegment = useTranslationStore((state) => state.addSegment);

  const start = async () => {
    if (!deviceId) {
      return;
    }

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

    if (recording.transcript.trim()) {
      addSegment(recording.transcript);
    }
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
      <MicButton
        isLoading={isLoading}
        onRecordingChange={handleRecordingChange}
      />
    </div>
  );
}
