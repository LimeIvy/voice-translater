import type { Meta, StoryObj } from "@storybook/react-vite";

import Stepper from "../../common/components/ui/stepper";

const meta = {
  title: "HEROUI/Stepper",
  component: Stepper,
  args: {
    steps: 3,
    activeStep: 0,
    descriptions: ["音声を録音", "内容を確認", "音声を生成"],
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Numeric: Story = {};