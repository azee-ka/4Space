// components/messages/ReactionOverlay.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { MessageType } from "@/app/(tabs)/messages/ChatOverlay";
import { EdgeInsets } from "react-native-safe-area-context";

const { width: SW, height: SH } = Dimensions.get("window");
const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

type ReactionKey = "like" | "love" | "laugh" | "sad" | "angry";

type Props = {
  visible: boolean;
  layout: { x: number; y: number; width: number; height: number } | null;
  message: MessageType | null;
  isOwn: boolean;
  theme: {
    bubbleOwn: string;
    bubbleOther: string;
    textOnOwn: string;
    textOnOther: string;
    backdropTintIntensity: number;
  };
  insets: EdgeInsets;
  currentUsername: string;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onUnsend: () => void;
  onShowSummary: () => void;
  onToggleReaction: (type: ReactionKey) => void;
};

const VIEWPORT_GUTTER = 12;
const ROW_SPACING = 10;
const BETWEEN_ROWS = 12;
// extra clearance so the first emoji button never overlaps the bubble
const REACT_CLEARANCE = 12;
const MIN_GAP = 14; // minimum clear gap between bubble and rows
const FOCUS_SHIFT_X = 12; // nudge the focused bubble slightly left to feel 'centered'
const FOCUS_POP = 0.04;   // subtle pop scale for the focused bubble

function clampX(x: number, w: number) {
  return Math.max(VIEWPORT_GUTTER, Math.min(x, SW - VIEWPORT_GUTTER - w));
}
function clampY(y: number, h: number, insets: EdgeInsets) {
  const top = insets.top + VIEWPORT_GUTTER;
  const bottom = SH - insets.bottom - VIEWPORT_GUTTER - h;
  return Math.max(top, Math.min(y, bottom));
}

function ReactionChip({ em, active, onPress }: { em: string; active: boolean; onPress: () => void }) {
  const pressed = useRef(new Animated.Value(0)).current;
  const onPressIn = () => Animated.spring(pressed, { toValue: 1, stiffness: 300, damping: 16, mass: 0.25, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(pressed, { toValue: 0, stiffness: 300, damping: 18, mass: 0.3, useNativeDriver: true }).start();
  const scale = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const glow = pressed.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });
  return (
    <Animated.View style={[styles.chipWrap, { transform: [{ scale }] }]}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.chipTouch} hitSlop={8}>
        <Animated.View style={[styles.chipGlow, { opacity: Animated.add(glow, active ? 0.25 : 0) }]} />
        <Text style={[styles.reactionEmoji, active && styles.reactionEmojiActive]}>{em}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ActionItem({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  const pressed = useRef(new Animated.Value(0)).current;
  const onPressIn = () => Animated.spring(pressed, { toValue: 1, stiffness: 300, damping: 18, mass: 0.25, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(pressed, { toValue: 0, stiffness: 300, damping: 20, mass: 0.3, useNativeDriver: true }).start();
  const scale = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] });
  const overlay = pressed.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] });
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={styles.actionItem} hitSlop={6}>
        <Animated.View pointerEvents="none" style={[styles.actionPressOverlay, { opacity: overlay }]} />
        <Text style={[styles.actionText, danger && { color: "#FF6666", fontWeight: "800" }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function ReactionOverlay({
  visible,
  layout,
  message,
  isOwn,
  theme,
  insets,
  currentUsername,
  onClose,
  onReply,
  onCopy,
  onUnsend,
  onShowSummary,
  onToggleReaction,
}: Props) {
  const open = useRef(new Animated.Value(0)).current;

  // Animated anchors for the bubble preview
  const bubbleX = useRef(new Animated.Value(0)).current;
  const bubbleY = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current; // extra pop specific to the focused bubble

  // Animated anchors for rows (computed after we know their sizes)
  const reactX = useRef(new Animated.Value(0)).current;
  const reactY = useRef(new Animated.Value(0)).current;
  const actionsX = useRef(new Animated.Value(0)).current;
  const actionsY = useRef(new Animated.Value(0)).current;

  // Row sizes (measured)
  const [reactSize, setReactSize] = useState({ w: 0, h: 0 });
  const [actionsSize, setActionsSize] = useState({ w: 0, h: 0 });

  // Recompute positions any time inputs change
  const computeAndAnimate = () => {
    if (!layout) return;

    // viewport bounds
    const topBound = insets.top + VIEWPORT_GUTTER;
    const bottomBound = SH - insets.bottom - VIEWPORT_GUTTER;

    // measured/fallback sizes
    const reactH = reactSize.h || 48;
    const actionsH = actionsSize.h || 44;
    const msgH = layout.height;
    const msgW = layout.width;

    // anchor horizontally at original message center
    const desiredCenterX = layout.x + msgW / 2;
    const bubbleLeft = clampX(desiredCenterX - msgW / 2 - FOCUS_SHIFT_X, msgW);

    // build a vertical block: [reactions] + gap + [message] + gap + [actions]
    const blockH = reactH + MIN_GAP + msgH + MIN_GAP + actionsH;

    // try to center the whole block on the original message center Y
    const desiredCenterY = layout.y + msgH / 2;
    let blockTop = desiredCenterY - blockH / 2;

    // clamp the block to the screen; rows stay fixed, the bubble will move to the computed gap
    if (blockTop < topBound) blockTop = topBound;
    if (blockTop + blockH > bottomBound) blockTop = Math.max(topBound, bottomBound - blockH);

    // rows are fixed relative to the block
    const reactionsTop = blockTop;
    const bubbleTop = reactionsTop + reactH + MIN_GAP;
    const actionsTop = bubbleTop + msgH + MIN_GAP;

    // center rows horizontally on the bubble center, then clamp
    const bubbleCenter = bubbleLeft + msgW / 2;
    const reactLeft = clampX(bubbleCenter - (reactSize.w || 180) / 2, (reactSize.w || 180));
    const actionsLeft = clampX(bubbleCenter - (actionsSize.w || 220) / 2, (actionsSize.w || 220));

    // animate to targets (rows stay put; bubble moves)
    Animated.spring(bubbleX, { toValue: bubbleLeft, stiffness: 240, damping: 22, mass: 0.4, useNativeDriver: true }).start();
    Animated.spring(bubbleY, { toValue: bubbleTop, stiffness: 240, damping: 22, mass: 0.4, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(bubbleScale, { toValue: 1 + FOCUS_POP, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(bubbleScale, { toValue: 1, stiffness: 260, damping: 18, mass: 0.5, useNativeDriver: true })
    ]).start();

    Animated.spring(reactX, { toValue: reactLeft, stiffness: 240, damping: 22, mass: 0.4, useNativeDriver: true }).start();
    Animated.spring(reactY, { toValue: reactionsTop, stiffness: 240, damping: 22, mass: 0.4, useNativeDriver: true }).start();

    Animated.spring(actionsX, { toValue: actionsLeft, stiffness: 240, damping: 22, mass: 0.4, useNativeDriver: true }).start();
    Animated.spring(actionsY, { toValue: actionsTop, stiffness: 240, damping: 22, mass: 0.4, useNativeDriver: true }).start();
  };

  // Open/close animation – always start the bubble from the message's real position
  useEffect(() => {
    if (visible && layout) {
      // reset bubble to the message origin so it animates FROM there
      bubbleX.setValue(layout.x);
      bubbleY.setValue(layout.y);
      bubbleScale.setValue(0.98);
      // fade/scale overlay in
      Animated.spring(open, {
        toValue: 1,
        stiffness: 180,
        damping: 18,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
      // compute target positions right after paint
      requestAnimationFrame(() => {
        computeAndAnimate();
      });
    } else {
      Animated.timing(open, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, layout?.x, layout?.y]);

  // Follow layout changes from caller
  useEffect(() => {
    computeAndAnimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout?.x, layout?.y, layout?.width, layout?.height, reactSize.w, reactSize.h, actionsSize.w, actionsSize.h]);

  // Orientation change support
  useEffect(() => {
    const sub = Dimensions.addEventListener("change", () => {
      computeAndAnimate();
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible || !message || !layout) return null;

  const scale = open.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const opacity = open.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] });
  const rowPop = open.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  const myReaction = message.reactions.find((r) => r.user_username === currentUsername)?.reaction_type;
  const buttons: { em: string; key: ReactionKey }[] = [
    { em: "👍", key: "like" },
    { em: "❤️", key: "love" },
    { em: "😂", key: "laugh" },
    { em: "😢", key: "sad" },
    { em: "😡", key: "angry" },
  ];

  const onReactRowLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== reactSize.w || height !== reactSize.h) setReactSize({ w: width, h: height });
  };
  const onActionsLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== actionsSize.w || height !== actionsSize.h) setActionsSize({ w: width, h: height });
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 1000, opacity }]}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <AnimatedBlur
          intensity={theme.backdropTintIntensity}
          tint="dark"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: SW / 2 },
                { translateY: SH / 2 },
                { scale },
                { translateX: -SW / 2 },
                { translateY: -SH / 2 },
              ],
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Bubble preview (clamped) */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: layout.width,
          zIndex: 2,
          transform: [{ translateX: bubbleX }, { translateY: bubbleY }, { scale: Animated.multiply(scale, bubbleScale) }],
        }}
      >
        <View style={[styles.bubble, { backgroundColor: isOwn ? theme.bubbleOwn : theme.bubbleOther }]}>
          <Text numberOfLines={4} style={[styles.bubbleText, { color: isOwn ? theme.textOnOwn : theme.textOnOther }]}>
            {message.text}
          </Text>
        </View>
      </Animated.View>

      {/* Reactions row (glassy capsule) */}
      <Animated.View
        style={{ position: "absolute", zIndex: 3, transform: [{ translateX: reactX }, { translateY: reactY }, { scale }, { scale: rowPop }] }}
        onLayout={onReactRowLayout}
      >
        <View style={styles.glassRow}>
          <AnimatedBlur intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0.04)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassGlare}
          />
          <View style={styles.glassRowInner}>
            {buttons.map((b) => (
              <ReactionChip key={b.key} em={b.em} active={myReaction === b.key} onPress={() => onToggleReaction(b.key)} />
            ))}
          </View>
        </View>
      </Animated.View>

      {/* Actions list (glassy sheet) */}
      <Animated.View
        style={{ position: "absolute", zIndex: 3, transform: [{ translateX: actionsX }, { translateY: actionsY }, { scale }, { scale: rowPop }] }}
        onLayout={onActionsLayout}
      >
        <View style={styles.glassActions}>
          <AnimatedBlur intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassGlare}
          />
          <ActionItem label="Reply" onPress={onReply} />
          <ActionItem label="Copy" onPress={onCopy} />
          <ActionItem label="See reactions" onPress={onShowSummary} />
          <ActionItem label="Unsend" onPress={onUnsend} danger />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleText: { fontSize: 16, lineHeight: 22 },

  glassRow: {
    borderRadius: 44,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 10,
  },
  glassRowInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  glassGlare: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.85,
  },
  chipWrap: {
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  chipTouch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  chipGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 255, 255, 0.25)",
    shadowColor: "#00FFFF",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  reactionEmoji: { fontSize: 26, color: "#FFFFFF" },
  reactionEmojiActive: { transform: [{ scale: 1.12 }] },

  glassActions: {
    overflow: "hidden",
    borderRadius: 18,
    width: 240,
    backgroundColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 12,
  },
  actionItem: {
    paddingLeft: 18,
    paddingRight: 10,
    paddingVertical: 12,
  },
  actionPressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  actionText: { fontSize: 16, color: "#FFF" },
});