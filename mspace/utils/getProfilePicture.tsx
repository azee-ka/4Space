// utils/profilePicture/getProfilePicture.tsx
import React from "react";
import { Image, StyleProp, ImageStyle } from "react-native";

interface ProfileProps {
  src: string | null;
  style?: StyleProp<ImageStyle>;
}

export default function ProfilePicture({ src, style }: ProfileProps) {
  if (src) {
    return <Image source={{ uri: src }} style={[{ borderRadius: 50 }, style]} />;
  }
  return (
    <Image
      source={require("../assets/default_profile_picture.png")}
      style={[{ borderRadius: 50 }, style]}
    />
  );
}
