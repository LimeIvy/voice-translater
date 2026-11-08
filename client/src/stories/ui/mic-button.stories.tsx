import type { Meta, StoryObj } from "@storybook/react-vite";

import MicButton from "@/common/components/ui/mic-button";

const meta = {
  title: "Common/MicButton",
  component: MicButton,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof MicButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
