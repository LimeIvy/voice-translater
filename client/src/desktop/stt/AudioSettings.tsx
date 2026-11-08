import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import MicSelect, { type AudioInputDevice } from "@/common/components/MicSelect";
import { useMicStore } from "@/common/stores/micStore";
import Mic from "./Mic";
import type { SpeechLanguageCode } from "@/common/data/speechLanguages";

type AudioSettingsProps = {
  language: SpeechLanguageCode;
};

export default function AudioSettings({ language }: AudioSettingsProps) {
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const selectedDeviceId = useMicStore(
    (state) => state.micDeviceId,
  );
  const setSelectedDeviceId = useMicStore(
    (state) => state.setMicDeviceId,
  );

  useEffect(() => {
    const loadDevices = async () => {
      const result = await invoke<AudioInputDevice[]>("list_input_devices");

      setDevices(result);

      const storedDeviceId =
        useMicStore.getState().micDeviceId;
      const storedDeviceExists = result.some(
        (device) => device.id === storedDeviceId,
      );

      if (storedDeviceExists) {
        return;
      }

      const defaultDevice = result.find(
        (device) => device.isDefault,
      );

      setSelectedDeviceId(
        defaultDevice?.id ?? result[0]?.id ?? "",
      );
    };

    void loadDevices();
  }, [setSelectedDeviceId]);

  return (
    <div className="space-y-4">
      <MicSelect
        devices={devices}
        value={selectedDeviceId}
        onChange={setSelectedDeviceId}
      />

      <Mic deviceId={selectedDeviceId} language={language} />
    </div>
  );
}
