import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import MicSelect, {
  type AudioInputDevice,
} from "@/common/components/MicSelect";

const devices: AudioInputDevice[] = [
  {
    id: "wasapi:realtek-microphone-array",
    name: "Realtek Audio (マイク配列)",
    isDefault: true,
  },
  {
    id: "wasapi:usb-microphone",
    name: "USB Audio Device (マイク)",
    isDefault: false,
  },
  {
    id: "wasapi:headset-microphone",
    name: "Bluetooth Headset (ヘッドセット)",
    isDefault: false,
  },
];

function MicSelectExample() {
  const [deviceId, setDeviceId] = useState(devices[0].id);

  return (
    <MicSelect
      devices={devices}
      value={deviceId}
      onChange={setDeviceId}
    />
  );
}

function EmptyMicSelectExample() {
  return (
    <MicSelect
      devices={[]}
      value=""
      onChange={() => {}}
    />
  );
}

const meta = {
  title: "Common/MicSelect",
  component: MicSelectExample,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof MicSelectExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoDevices: Story = {
  render: () => <EmptyMicSelectExample />,
};
