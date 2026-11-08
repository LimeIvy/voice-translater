import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import LanguageSelect from "../../common/components/LanguageSelect";

function LanguageSelectExample() {
  const [speechLanguage, setSpeechLanguage] = useState("ja-JP");
  const [translationLanguage, setTranslationLanguage] = useState("en-US");

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">発話言語</span>
        <LanguageSelect
          value={speechLanguage}
          onChange={setSpeechLanguage}
        />
      </label>
      <label className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">翻訳言語</span>
        <LanguageSelect
          value={translationLanguage}
          onChange={setTranslationLanguage}
        />
      </label>
    </div>
  );
}

const meta = {
  title: "Common/LanguageSelect",
  component: LanguageSelectExample,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof LanguageSelectExample>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
