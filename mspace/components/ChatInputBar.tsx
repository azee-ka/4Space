// components/ChatInputBar.tsx
import React, { useMemo, useState } from "react";
import { View, TextInput, StyleSheet, Pressable, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { GlassView } from "./GlassView";
import { PlusIcon, PaperPlaneIcon, MicIcon } from "./icons";

type Props = {
  onSend?: (text: string) => void;
  onAttach?: () => void;
  onRecordStart?: () => void;
  onRecordEnd?: (cancelled: boolean) => void;
};

const ICON_PAD = 8;
const ICON_BTN = 36;
const ICON_SIZE = 22;

export const ChatInputBar: React.FC<Props> = ({ onSend, onAttach, onRecordStart, onRecordEnd }) => {
  const [value, setValue] = useState("");
  const isEmpty = value.trim().length === 0;

  const hold = useSharedValue(0);
  const micPulse = useSharedValue(0);

  const longPress = useMemo(
    () =>
      Gesture.LongPress()
        .minDuration(220)
        .onStart(() => {
          hold.value = withTiming(1, { duration: 150 });
          micPulse.value = withTiming(1, { duration: 500 });
          onRecordStart && onRecordStart();
        })
        .onEnd((_e, success) => {
          hold.value = withTiming(0, { duration: 180 });
          micPulse.value = withTiming(0, { duration: 300 });
          onRecordEnd && onRecordEnd(!success);
        }),
    []
  );

  const micRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(micPulse.value, [0, 1], [1, 1.16], Extrapolate.CLAMP) }],
    opacity: interpolate(micPulse.value, [0, 1], [0, 0.22], Extrapolate.CLAMP),
  }));

  const sendArmed = useSharedValue(0);
  const sendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(sendArmed.value, [0, 1], [1, 1.06]) }],
    opacity: interpolate(sendArmed.value, [0, 1], [0.65, 1]),
  }));
  React.useEffect(() => {
    sendArmed.value = withTiming(isEmpty ? 0 : 1, { duration: 120 });
  }, [isEmpty, sendArmed]);

  const edgeHold = useSharedValue(0);
  const pan = Gesture.Pan()
    .onBegin(() => { edgeHold.value = withSpring(1, { damping: 18, stiffness: 240 }); })
    .onFinalize(() => { edgeHold.value = withSpring(0, { damping: 18, stiffness: 200 }); });

  const inputMorph = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(edgeHold.value, [0, 1], [1, 1.02]) }],
  }));

  const handleSend = () => {
    const t = value.trim();
    if (!t) return;
    onSend && onSend(t);
    setValue("");
  };

  return (
    <View style={styles.container}>
      <GlassView radius={16} intensity={10} backgroundOpacity={0.10} interactive={false} style={styles.iconWrap}>
        <Pressable onPress={onAttach} style={styles.iconBtn} android_ripple={{ color: "rgba(0,0,0,0.06)", borderless: true }}>
          <PlusIcon size={ICON_SIZE} color="#0d0d0d" />
        </Pressable>
      </GlassView>

      <GestureDetector gesture={pan}>
        <GlassView radius={18} intensity={12} backgroundOpacity={0.12} ambientIridescence interactive style={styles.inputWrap}>
          <Animated.View style={[styles.inputInner, inputMorph]}>
            <TextInput
              placeholder="Message"
              placeholderTextColor="rgba(0,0,0,0.45)"
              value={value}
              onChangeText={setValue}
              style={styles.input}
              multiline
            />
          </Animated.View>
        </GlassView>
      </GestureDetector>

      {isEmpty ? (
        <GestureDetector gesture={longPress}>
          <GlassView radius={16} intensity={10} backgroundOpacity={0.10} interactive={false} style={styles.iconWrap}>
            <Pressable onPressIn={() => {}} style={styles.iconBtn}>
              <Animated.View style={[styles.micRing, micRingStyle]} />
              <MicIcon size={ICON_SIZE} color="#0d0d0d" />
            </Pressable>
          </GlassView>
        </GestureDetector>
      ) : (
        <GlassView radius={16} intensity={10} backgroundOpacity={0.10} interactive={false} style={styles.iconWrap}>
          <Pressable onPress={handleSend} style={styles.iconBtn}>
            <Animated.View style={sendStyle}>
              <PaperPlaneIcon size={ICON_SIZE} color="#0d0d0d" />
            </Animated.View>
          </Pressable>
        </GlassView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
  iconWrap: { borderRadius: 18 },
  iconBtn: { width: ICON_BTN, height: ICON_BTN, borderRadius: ICON_BTN / 2, alignItems: "center", justifyContent: "center", padding: ICON_PAD },
  micRing: { position: "absolute", width: ICON_BTN, height: ICON_BTN, borderRadius: ICON_BTN / 2, borderWidth: 2, borderColor: "rgba(0,0,0,0.15)" },
  inputWrap: { flex: 1, minHeight: 40 },
  inputInner: { paddingHorizontal: 12, paddingVertical: Platform.select({ ios: 10, android: 6 }) },
  input: { fontSize: 16, lineHeight: 20, color: "#0A0A0A", maxHeight: 140 },
});