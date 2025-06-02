// /components/ExploreVisualPostCard.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";

type VisualPost = {
  id: string;
  thumbnail: {
    file: string;       // fully‐qualified URL, e.g. "https://…/some.jpg"
    media_type: string; // "image" or "video"—we only show images here
  };
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 2;

// These must match your Explore.tsx “paddingHorizontal” and “spacing”:
const HORIZONTAL_PADDING = 8 + 8;          // 8px on each side (see contentContainerStyle below)
const HORIZONTAL_GUTTER   = 16 * (NUM_COLUMNS - 1); // one 8px gap between 2 cols

// Now each column’s width = (screen – total horizontal padding – total gutter) ÷ NUM_COLUMNS
const COLUMN_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - HORIZONTAL_GUTTER) / NUM_COLUMNS;

export default function ExploreVisualPostCard({
  post,
  onClick,
}: {
  post: VisualPost;
  onClick: () => void;
}) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const uri = post.thumbnail.file;
    Image.getSize(
      uri,
      (naturalWidth, naturalHeight) => {
        if (!isMounted) return;
        setAspectRatio(naturalWidth / naturalHeight);
        setLoading(false);
      },
      () => {
        if (!isMounted) return;
        setAspectRatio(1);
        setLoading(false);
      }
    );
    return () => {
      isMounted = false;
    };
  }, [post.thumbnail.file]);

  if (loading || aspectRatio == null) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: COLUMN_WIDTH, height: COLUMN_WIDTH },
        ]}
      >
        <ActivityIndicator color="#19dee8" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onClick}
      style={[styles.container, { width: COLUMN_WIDTH }]}
    >
      <Image
        source={{ uri: post.thumbnail.file }}
        style={{
          width: COLUMN_WIDTH,
          aspectRatio,
          borderRadius: 8,
        }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8, // vertical gutter
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#222",
  },
  placeholder: {
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 8,
  },
});
