// components/GlassHeader.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassView } from "./GlassView";

type Props = {
  title?: string;
  right?: React.ReactNode;
  left?: React.ReactNode;
};

export const GlassHeader: React.FC<Props> = ({ title, right, left }) => {
  return (
    <GlassView radius={20} intensity={12} backgroundOpacity={0.10} ambientIridescence interactive style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.side}>{left}</View>
        <Text numberOfLines={1} style={styles.title}>{title ?? ""}</Text>
        <View style={styles.side}>{right}</View>
      </View>
    </GlassView>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 10,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  side: { width: 48, alignItems: "center", justifyContent: "center" },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#0A0A0A",
  },
});