// components/icons.tsx
import React from "react";
import Svg, { Path } from "react-native-svg";

export const PlusIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 22,
  color = "#0d0d0d",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
  </Svg>
);

export const PaperPlaneIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 22,
  color = "#0d0d0d",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
  </Svg>
);

export const MicIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 22,
  color = "#0d0d0d",
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M12 15a3 3 0 003-3V8a3 3 0 10-6 0v4a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 19h2v3h-2z"
    />
  </Svg>
);