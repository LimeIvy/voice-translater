import type { Meta, StoryObj } from "@storybook/react-vite";
import { TranslationBubble } from "@/common/components/ui/bubble";

const meta = {
  title: "Common/TranslationBubble",
  component: TranslationBubble,
  parameters: { layout: "padded" },
} satisfies Meta<typeof TranslationBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

const segment = {
  text: "これで行けるかな",
  translation: "Can we go with this?",
  speaker: "self" as const,
  createdAt: Date.now(),
};

export const Self: Story = {
  args: { segment, languageCode: "ja-JP" },
};

export const Other: Story = {
  args: {
    segment: { ...segment, speaker: "other" },
    languageCode: "ja-JP",
  },
};

export const Interim: Story = {
  args: {
    interimText: "音声を認識しています…",
    languageCode: "ja-JP",
  },
};
