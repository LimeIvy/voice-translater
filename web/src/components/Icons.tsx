import type { ComponentType } from "react";
import { FaMicrophone, FaStop, FaPlay, FaPause } from "react-icons/fa";

const iconMap = {
  "mic-idle": FaMicrophone,
  "mic-listening": FaStop,
  "play": FaPlay,
  "pause": FaPause,
} as const;

export type IconName = keyof typeof iconMap;

type IconProps = {
  name: IconName;
  size?: number | string;
  color?: string;
};

export function MyIcon({ name, size = 24, color = "currentColor" }: IconProps) {
  const IconComponent: ComponentType<{ size?: number | string; color?: string }> = iconMap[name];
  return <IconComponent size={size} color={color} />;
}
