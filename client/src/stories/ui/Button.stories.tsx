import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";

import AppButton from "@/common/components/ui/button";

type ButtonColor = {
  name: string;
  base: string;
  hover: string;
  shadow: string;
  dark?: boolean;
};

const colors: ButtonColor[] = [
  { name: "ミント", base: "#42d99c", hover: "#35ca8e", shadow: "#20a66f" },
  {
    name: "ライム",
    base: "#a3e635",
    hover: "#8fd326",
    shadow: "#65a30d",
    dark: true,
  },
  {
    name: "レモン",
    base: "#facc15",
    hover: "#eab308",
    shadow: "#b98906",
    dark: true,
  },
  { name: "オレンジ", base: "#fb923c", hover: "#f27f25", shadow: "#cf5f12" },
  { name: "ピーチ", base: "#ffad78", hover: "#fa9860", shadow: "#d87542" },
  { name: "コーラル", base: "#ff7f6e", hover: "#f36c5c", shadow: "#d44f42" },
  { name: "ローズ", base: "#fb7185", hover: "#f15d74", shadow: "#cf4058" },
  { name: "ピンク", base: "#f472b6", hover: "#e95ca7", shadow: "#c33f87" },
  { name: "ラベンダー", base: "#a78bfa", hover: "#9476ed", shadow: "#7357c5" },
  { name: "ブルー", base: "#60a5fa", hover: "#4b94ec", shadow: "#3476c4" },
  { name: "水色", base: "#38bdf8", hover: "#25ace8", shadow: "#168bc2" },
  {
    name: "シアン",
    base: "#22d3ee",
    hover: "#16bfd9",
    shadow: "#0898ae",
    dark: true,
  },
];

// 水色 or ミントで確定

const warmColors: ButtonColor[] = [
  {
    name: "クリーム",
    base: "#fde68a",
    hover: "#fcd34d",
    shadow: "#d4a72c",
    dark: true,
  },
  {
    name: "レモン",
    base: "#facc15",
    hover: "#eab308",
    shadow: "#b98906",
    dark: true,
  },
  {
    name: "ハニー",
    base: "#fbbf24",
    hover: "#f59e0b",
    shadow: "#b96b09",
    dark: true,
  },
  { name: "アンバー", base: "#f59e0b", hover: "#d97706", shadow: "#a34f05" },
  {
    name: "アプリコット",
    base: "#fdba74",
    hover: "#fb923c",
    shadow: "#d87542",
    dark: true,
  },
  {
    name: "ピーチ",
    base: "#ffad78",
    hover: "#fa9860",
    shadow: "#d87542",
    dark: true,
  },
  { name: "オレンジ", base: "#f97316", hover: "#ea580c", shadow: "#b7430b" },
  {
    name: "タンジェリン",
    base: "#ea580c",
    hover: "#c2410c",
    shadow: "#9a3412",
  },
  { name: "テラコッタ", base: "#c65d3b", hover: "#ad4c30", shadow: "#843921" },
  {
    name: "サーモン",
    base: "#fb8b78",
    hover: "#f47261",
    shadow: "#c84d40",
    dark: true,
  },
  { name: "コーラル", base: "#ff7f6e", hover: "#f36c5c", shadow: "#d44f42" },
  { name: "トマト", base: "#ef4444", hover: "#dc2626", shadow: "#a91b1b" },
  { name: "レッド", base: "#dc2626", hover: "#b91c1c", shadow: "#8f1717" },
  { name: "ローズ", base: "#fb7185", hover: "#f15d74", shadow: "#cf4058" },
  { name: "ピンク", base: "#f472b6", hover: "#e95ca7", shadow: "#c33f87" },
];

type ColorStyle = CSSProperties & {
  "--primary": string;
  "--primary-hover": string;
  "--primary-shadow": string;
};

const meta = {
  title: "HeroUI/Button",
  component: AppButton,
  argTypes: {
    children: {
      control: "text",
      description: "ボタンに表示するテキスト",
    },
  },
} satisfies Meta<typeof AppButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "通常ボタン",
    variant: "primary",
    className: "font-medium",
  },
};

export const Secondary: Story = {
  args: {
    children: "サブボタン",
    variant: "secondary",
  },
};

export const Disabled: Story = {
  args: {
    children: "無効なボタン",
    isDisabled: true,
  },
};

export const Loading: Story = {
  args: {
    children: "処理中",
    isPending: true,
  },
};

export const ColorPalette: Story = {
  args: {
    children: "カラーパレット",
  },
  render: () => (
    <div className="flex flex-wrap items-center gap-6 p-4">
      {colors.map(({ name, base, hover, shadow, dark }) => (
        <AppButton
          className={dark ? "min-w-32 text-button-text" : "min-w-32"}
          key={name}
          style={
            {
              "--primary": base,
              "--primary-hover": hover,
              "--primary-shadow": shadow,
            } as ColorStyle
          }
        >
          {name}
        </AppButton>
      ))}
    </div>
  ),
};

export const WarmPalette: Story = {
  args: {
    children: "暖色パレット",
  },
  render: () => (
    <div className="max-w-full overflow-x-auto">
      <div className="flex w-max flex-nowrap gap-4 p-4">
        {warmColors.map(({ name, base, hover, shadow, dark }) => (
          <div
            className="flex w-36 shrink-0 flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            key={name}
          >
            <AppButton
              className={dark ? "w-full text-button-text" : "w-full"}
              style={
                {
                  "--primary": base,
                  "--primary-hover": hover,
                  "--primary-shadow": shadow,
                } as ColorStyle
              }
            >
              {name}
            </AppButton>
            <span className="font-mono text-sm text-slate-500">{base}</span>
          </div>
        ))}
      </div>
    </div>
  ),
};
