import { ListBox, Select } from "@heroui/react";
import { Mic } from "lucide-react";

export type AudioInputDevice = {
  id: string;
  name: string;
  isDefault: boolean;
};

type MicSelectProps = {
  devices: AudioInputDevice[];
  value: string;
  onChange: (deviceId: string) => void;
};

function DeviceName({ value }: { value: string }) {
  const match = value.match(/^(.*?)\s*(\([^()]+\))$/);
  const name = match?.[1] ?? value;
  const detail = match?.[2];

  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate">{name}</span>
      {detail && (
        <span className="truncate text-xs opacity-60">
          {detail}
        </span>
      )}
    </span>
  );
}

function MicSelect({ devices, value, onChange }: MicSelectProps) {
  return (
    <Select<AudioInputDevice, "single">
      aria-label="マイク"
      placeholder="マイクを選択"
      selectedKey={value || null}
      onSelectionChange={(key) => {
        if (key !== null) {
          onChange(String(key));
        }
      }}
    >
      <Select.Trigger className="w-72">
        <Select.Value />

        <Select.Indicator />
      </Select.Trigger>

      <Select.Popover>
        <ListBox<AudioInputDevice> items={devices}>
          {(device) => (
            <ListBox.Item id={device.id} textValue={device.name}>
              <span className="flex min-w-0 items-center gap-2">
                <Mic className="h-5 w-5 shrink-0" />

                <DeviceName value={device.name} />
              </span>

              <ListBox.ItemIndicator />
            </ListBox.Item>
          )}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export default MicSelect;
