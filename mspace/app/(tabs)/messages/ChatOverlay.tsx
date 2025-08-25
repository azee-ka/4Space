import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Dimensions,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  InputAccessoryView, // (optional) if you later want to move the composer into an accessory view on iOS
  UIManager,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State as GestureState,
} from "react-native-gesture-handler";

import ProfilePicture from "@/utils/getProfilePicture";

// Project hooks (assumed existing in your app)
import useWebSocket from "@/hooks/useWebSocket";
import useApi from "@/hooks/useApi";
import useAuth from "@/hooks/useAuth";
import SettingsOverlay from "./SettingsOverlay";
import AttachMenu from "./AttachMenu";

// ————————————————————————————————————————————
// Types
// ————————————————————————————————————————————
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BUBBLE_MAX_W = Math.floor(SCREEN_WIDTH * 0.78);

type AttachmentType = {
  id: string;
  mime_type: string;
  url: string;
  uploaded_at: string;
};

export type ReactionType = {
  id: string;
  user_username: string;
  reaction_type: "like" | "love" | "laugh" | "sad" | "angry";
  reacted_at: string;
};

export type MessageType = {
  uuid: string;
  text: string;
  sender_username: string;
  sent_at: string;
  attachments: AttachmentType[];
  reactions: ReactionType[];
  parent_message_uuid: string | null;
  context?: string | null; // lane id
};

type ParticipantUser = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  username: string;
  profile_image?: string | null;
};

type ConversationType = {
  participants: Array<{ user: ParticipantUser } | ParticipantUser>;
  view_type: "inbox" | "request";
  conversation_status: "blocked" | "invite" | "allowed" | string;
  uuid?: string;
  mode?: ConversationMode;
  theme?: {
    name?: string;
    themeIdx?: number;
    bgImage?: string | null;
    accentColor?: string | null;
  } | null;
};

export type Lane = {
  id: string;
  title: string;
  emoji?: string; // MaterialIcons name if present
  color?: string;
  rules?: {
    mute?: boolean;
    pinned?: boolean;
    ephemeralSeconds?: number | null;
    autoArchiveDays?: number | null;
  };
  is_archived?: boolean;
};

export type ConversationMode =
  | "personal"
  | "work"
  | "family"
  | "dating"
  | "travel"
  | "events"
  | "wellness";

// ————————————————————————————————————————————
// Theme
// ————————————————————————————————————————————

const THEMES = [
  {
    id: "midnight",
    name: "Midnight",
    accent: "#17D4FF",
    bgGradient: ["#05080D", "#071019", "#000000"],
    bubbleOther: "rgba(30,31,36,0.35)",
    textOnOwn: "#FFFFFF",
    textOnOther: "#EAFBFF",
    backdropTintIntensity: 50,
  },
  {
    id: "aurora",
    name: "Aurora",
    accent: "#00E3D8",
    bgGradient: ["#091322", "#0a1e2e", "#063345"],
    bubbleOther: "rgba(20,34,54,0.38)",
    textOnOwn: "#00120a",
    textOnOther: "#E7F7F0",
    backdropTintIntensity: 42,
  },
  {
    id: "sunset",
    name: "Sunset",
    accent: "#FF6B4A",
    bgGradient: ["#150a0e", "#26101c", "#310f1f"],
    bubbleOther: "rgba(42,27,36,0.36)",
    textOnOwn: "#1E0A08",
    textOnOther: "#FFEDE9",
    backdropTintIntensity: 46,
  },
  {
    id: "violet",
    name: "Violet",
    accent: "#A07CFE",
    bgGradient: ["#0E0B1A", "#140F26"],
    bubbleOther: "rgba(36,30,54,0.36)",
    textOnOwn: "#0C0914",
    textOnOther: "#EFE9FF",
    backdropTintIntensity: 44,
  },
  {
    id: "emerald",
    name: "Emerald",
    accent: "#19C37D",
    bgGradient: ["#071411", "#0C201A"],
    bubbleOther: "rgba(18,34,28,0.36)",
    textOnOwn: "#00120A",
    textOnOther: "#E7F7F0",
    backdropTintIntensity: 45,
  },
] as const;

type ThemeDef = (typeof THEMES)[number];

const GLASS = {
  blurBtn: Platform.select({ ios: 8, android: 6, default: 8 }) as number,
  blurHeader: Platform.select({ ios: 16, android: 8, default: 12 }) as number,
  blurFooter: Platform.select({ ios: 18, android: 8, default: 12 }) as number,
  strokeSoft: "rgba(255,255,255,0.10)",
  sheen: "rgba(255,255,255,0.12)",
  fillGhost: "rgba(255,255,255,0.025)",
  fillSolid: "rgba(255,255,255,0.08)",
};

function isEmojiOnlyMessage(text: string) {
  const cleaned = text.replace(/[\s\u200B]/g, "");
  if (!cleaned) return false;
  const emojiOnlyRegex = new RegExp(
    "^" +
      "(?:" +
      "\\p{Extended_Pictographic}(?:\\uFE0F|\\uFE0E)?" +
      "(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\uFE0E)?)*" +
      ")+" +
      "$",
    "u"
  );
  return emojiOnlyRegex.test(cleaned);
}

// ————————————————————————————————————————————
// Core Liquid primitives — GlassPressable / GlassInput / LiquidBubble
// ————————————————————————————————————————————

function GlassPressable({
  children,
  onPress,
  onLongPress,
  accessibilityLabel,
  radius = 18,
  padH = 14,
  padV = 12,
  variant = "ghost",
  style,
  haptics = "selection",
  block = false,
  elastic = true,
  showBackground = true,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  radius?: number;
  padH?: number;
  padV?: number;
  variant?: "solid" | "ghost";
  style?: any;
  haptics?: "none" | "selection" | "light" | "medium";
  block?: boolean;
  elastic?: boolean;
  showBackground?: boolean;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.97],
  });
  const opacity = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94],
  });

  // Elastic drag physics
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const stretchX = dragX.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [0.96, 1, 1.06],
    extrapolate: "clamp",
  });
  const stretchY = dragY.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [0.96, 1, 1.06],
    extrapolate: "clamp",
  });

  // Torch spotlight
  const glowX = useRef(new Animated.Value(0)).current;
  const glowY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const showGlow = useCallback(
    (on: boolean) => {
      glowOpacity.stopAnimation();
      Animated.timing(glowOpacity, {
        toValue: on ? 0.5 : 0,
        duration: on ? 0 : 80,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    },
    [glowOpacity]
  );

  const onPressHaptics = useCallback(() => {
    if (haptics === "selection") Haptics.selectionAsync();
    else if (haptics === "light")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptics === "medium")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [haptics]);

  return (
    <Animated.View
      style={[
        {
          borderRadius: radius,
          transform: [{ scaleX: stretchX }, { scaleY: stretchY }, { scale }],
          opacity,
        },
        style,
      ]}
    >
      <PanGestureHandler
        enabled={elastic}
        activeOffsetX={[-2, 2]}
        activeOffsetY={[-2, 2]}
        onGestureEvent={Animated.event(
          [
            {
              nativeEvent: {
                translationX: dragX,
                translationY: dragY,
                x: glowX,
                y: glowY,
              },
            },
          ],
          { useNativeDriver: true }
        )}
        onHandlerStateChange={(e) => {
          const st = (e as any).nativeEvent.state;
          if (st === GestureState.BEGAN || st === GestureState.ACTIVE)
            showGlow(true);
          if (
            st === GestureState.END ||
            st === GestureState.CANCELLED ||
            st === GestureState.FAILED
          ) {
            showGlow(false);
            Animated.parallel([
              Animated.spring(dragX, {
                toValue: 0,
                useNativeDriver: true,
                stiffness: 280,
                damping: 18,
                mass: 0.4,
              }),
              Animated.spring(dragY, {
                toValue: 0,
                useNativeDriver: true,
                stiffness: 280,
                damping: 18,
                mass: 0.4,
              }),
            ]).start();
          }
        }}
      >
        <Animated.View>
          <Pressable
            onPress={() => {
              onPressHaptics();
              onPress?.();
            }}
            onLongPress={() => {
              if (haptics !== "none")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onLongPress?.();
            }}
            onPressIn={(evt) => {
              const { locationX, locationY } = (evt as any).nativeEvent || {};
              if (typeof locationX === "number") {
                glowX.setValue(locationX);
                glowY.setValue(locationY);
              }
              showGlow(true);
              Animated.spring(press, {
                toValue: 1,
                useNativeDriver: true,
                stiffness: 320,
                damping: 20,
                mass: 0.25,
              }).start();
            }}
            onPressOut={() => {
              showGlow(false);
              Animated.spring(press, {
                toValue: 0,
                useNativeDriver: true,
                stiffness: 320,
                damping: 20,
                mass: 0.25,
              }).start();
            }}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={{
              borderRadius: radius,
              overflow: showBackground ? "hidden" : "visible",
              backgroundColor: "transparent",
              paddingHorizontal: padH,
              paddingVertical: padV,
              width: block ? "100%" : undefined,
              alignSelf: block ? "stretch" : undefined,
            }}
          >
            {showBackground && (
              <View
                pointerEvents="none"
                style={{
                  ...StyleSheet.absoluteFillObject,
                  overflow: "hidden",
                  borderRadius: radius,
                }}
              >
                <BlurView
                  intensity={GLASS.blurBtn}
                  tint="light"
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={
                    variant === "solid"
                      ? ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]
                      : [GLASS.fillGhost, "rgba(255,255,255,0.012)"]
                  }
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* sheen */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: press.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.45],
                      }),
                      transform: [
                        {
                          translateX: press.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-22, 22],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0)",
                      GLASS.sheen,
                      "rgba(255,255,255,0)",
                    ]}
                    start={{ x: 0, y: 0.2 }}
                    end={{ x: 1, y: 0.8 }}
                    style={{
                      position: "absolute",
                      left: -60,
                      right: -60,
                      top: 0,
                      bottom: 0,
                    }}
                  />
                </Animated.View>
              </View>
            )}
            {children}
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

const GlassInput = React.forwardRef<TextInput, any>((props, ref) => {
  const {
    containerStyle,
    style: tiStyle,
    onPress,
    placeholderTextColor,
    maxLines,
    ...tiProps
  } = props || {};
  const resolvedPlaceholderColor =
    placeholderTextColor ?? "rgba(234,251,255,0.6)";
  const flat = StyleSheet.flatten(tiStyle) || ({} as any);
  const paddingH = flat.paddingHorizontal ?? flat.padding ?? 12;
  const paddingV = flat.paddingVertical ?? flat.padding ?? 8;
  const radius = flat.borderRadius ?? 18;
  const LINES_MAX: number =
    typeof maxLines === "number" ? Math.max(1, Math.min(maxLines, 20)) : 10;
  const fontSize = typeof flat.fontSize === "number" ? flat.fontSize : 16;
  const lineH =
    typeof flat.lineHeight === "number"
      ? flat.lineHeight
      : Math.round(fontSize * 1.35);
  const minH = Math.max(flat.minHeight ?? 40, lineH + paddingV * 2);
  const computedMaxH = lineH * LINES_MAX + paddingV * 2;
  const maxH = flat.maxHeight ?? computedMaxH;
  const [measuredH, setMeasuredH] = useState(minH);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(
    !!tiProps.scrollEnabled
  );
  const valueStr = typeof tiProps?.value === "string" ? tiProps.value : "";
  const isEmpty = !valueStr || valueStr.trim().length === 0;
  const isCollapsed = isEmpty && measuredH <= minH + 0.5;
  const textStyles = {
    color: flat.color ?? "#EAFBFF",
    fontSize: flat.fontSize,
    fontFamily: flat.fontFamily,
    fontWeight: flat.fontWeight,
    lineHeight: flat.lineHeight,
    letterSpacing: flat.letterSpacing,
    textAlign: flat.textAlign,
    textAlignVertical: flat.textAlignVertical,
  } as any;

  return (
    <Pressable
      onPress={() => {
        try {
          (ref as any)?.current?.focus?.();
        } catch {}
        onPress?.();
      }}
      style={[
        containerStyle,
        {
          minHeight: minH,
          height: measuredH,
          maxHeight: maxH,
          borderRadius: radius,
          overflow: "hidden",
          alignSelf: "stretch",
          justifyContent: isCollapsed ? "center" : "flex-start",
        },
      ]}
    >
      <BlurView
        intensity={GLASS.blurFooter}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[GLASS.fillGhost, "rgba(255,255,255,0.012)"]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: GLASS.strokeSoft,
          },
        ]}
      />
      <TextInput
        ref={ref}
        {...tiProps}
        multiline
        scrollEnabled={autoScrollEnabled}
        placeholderTextColor={resolvedPlaceholderColor}
        keyboardAppearance={(Platform.OS === "ios" ? "dark" : "default") as any}
        blurOnSubmit={false}
        returnKeyType="send"
        style={[
          textStyles,
          {
            backgroundColor: "transparent",
            paddingHorizontal: paddingH,
            paddingVertical: paddingV,
            margin: 0,
          },
        ]}
        onLayout={(e) => {
          const h = e?.nativeEvent?.layout?.height ?? minH;
          setMeasuredH(Math.max(minH, Math.min(maxH, Math.round(h))));
        }}
        onContentSizeChange={(e) => {
          const ch = e.nativeEvent.contentSize?.height ?? minH;
          const next = Math.max(
            minH,
            Math.min(maxH, Math.round(ch + paddingV * 2))
          );
          setMeasuredH(next);
          setAutoScrollEnabled(next >= maxH - 1);
        }}
      />
    </Pressable>
  );
});
GlassInput.displayName = "GlassInput";

function LiquidBubble({
  children,
  own,
  emojiOnly,
  radius,
  theme,
  accentColor,
  style,
}: {
  children: React.ReactNode;
  own: boolean;
  emojiOnly: boolean;
  radius: {
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
    borderBottomLeftRadius: number;
    borderBottomRightRadius: number;
  };
  theme: ThemeDef;
  accentColor: string;
  style?: any;
}) {
  const baseColor = own ? accentColor : theme.bubbleOther;
  return (
    <View
      style={[
        {
          borderRadius: 18,
          ...radius,
          overflow: "hidden",
          backgroundColor: "transparent",
        },
        style,
      ]}
    >
      {!own && (
        <BlurView intensity={6} tint="light" style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={
          own
            ? [baseColor, baseColor]
            : ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.02)"]
        }
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.00)"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: own
              ? "rgba(255,255,255,0.18)"
              : "rgba(255,255,255,0.12)",
            borderRadius: 18,
          },
        ]}
      />
      <View
        style={{
          paddingHorizontal: emojiOnly ? 0 : 14,
          paddingVertical: emojiOnly ? 0 : 10,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// ————————————————————————————————————————————
// Orbital Lanes Navigator
// ————————————————————————————————————————————
function OrbitalNav({
  visible,
  lanes,
  activeLaneId,
  onPick,
  onClose,
  accentColor,
}: {
  visible: boolean;
  lanes: Lane[];
  activeLaneId: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
  accentColor: string;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fade.setValue(0);
      ring.setValue(0);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(ring, {
          toValue: 1,
          useNativeDriver: true,
          stiffness: 240,
          damping: 18,
          mass: 0.8,
        }),
      ]).start();
    }
  }, [visible, fade, ring]);

  if (!visible) return null;

  const R = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.32;
  const cx = SCREEN_WIDTH / 2;
  const cy = SCREEN_HEIGHT * 0.42;
  const items = lanes.filter((l) => !l.is_archived);
  const N = Math.max(1, items.length);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "rgba(0,0,0,0.6)", opacity: fade },
      ]}
    >
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View
          style={{
            position: "absolute",
            left: cx - 40,
            top: cy - 40,
            width: 80,
            height: 80,
            borderRadius: 40,
            overflow: "hidden",
            transform: [{ scale: ring }],
          }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0.02)"]}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 40,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: "rgba(255,255,255,0.22)",
            }}
          />
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialIcons name="blur-on" color={accentColor} size={28} />
          </View>
        </Animated.View>

        {items.map((lane, idx) => {
          const theta = (Math.PI * 2 * idx) / N - Math.PI / 2;
          const x = cx + R * Math.cos(theta);
          const y = cy + R * Math.sin(theta);
          return (
            <Animated.View
              key={lane.id}
              style={{
                position: "absolute",
                left: x - 60,
                top: y - 22,
                transform: [{ scale: ring }],
              }}
            >
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  onPick(lane.id);
                  onClose();
                }}
                style={[
                  styles.orbitPill,
                  activeLaneId === lane.id
                    ? styles.orbitPillActive
                    : styles.orbitPillInactive,
                ]}
              >
                <MaterialIcons
                  name={(lane.emoji as any) || "view-agenda"}
                  color={activeLaneId === lane.id ? "#EFFFFF" : "#d7e7ea"}
                  size={16}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.orbitText,
                    activeLaneId === lane.id
                      ? styles.orbitTextActive
                      : styles.orbitTextInactive,
                  ]}
                >
                  {lane.title}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ————————————————————————————————————————————
// Reaction Overlay
// ————————————————————————————————————————————
function ReactionOverlay({
  visible,
  layout,
  message,
  theme,
  insets,
  currentUsername,
  isOwn,
  onClose,
  onReply,
  onCopy,
  onUnsend,
  onToggleReaction,
}: {
  visible: boolean;
  layout: { x: number; y: number; width: number; height: number } | null;
  message: MessageType | null;
  theme: {
    bubbleOwn: string;
    bubbleOther: string;
    textOnOwn: string;
    textOnOther: string;
    backdropTintIntensity: number;
  };
  insets: any;
  currentUsername: string;
  isOwn: boolean;
  onClose: () => void;
  onReply: () => void;
  onCopy: () => void;
  onUnsend: () => void;
  onToggleReaction: (type: ReactionType["reaction_type"]) => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      fade.setValue(0);
      Animated.timing(fade, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fade]);
  if (!visible || !layout || !message) return null;
  const buttons: Array<{ key: ReactionType["reaction_type"]; label: string }> =
    [
      { key: "like", label: "👍" },
      { key: "love", label: "❤️" },
      { key: "laugh", label: "😂" },
      { key: "sad", label: "😢" },
      { key: "angry", label: "😡" },
    ];
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={{
          position: "absolute",
          left: Math.max(12, layout.x - 20),
          top: Math.max(insets.top + 8, layout.y - 54),
        }}
      >
        <GlassPressable
          radius={18}
          padH={12}
          padV={10}
          variant="solid"
          haptics="none"
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {buttons.map((b) => (
              <Pressable
                key={b.key}
                onPress={() => {
                  onToggleReaction(b.key);
                  Haptics.selectionAsync();
                }}
                style={{ paddingHorizontal: 8 }}
              >
                <Text style={{ fontSize: 22 }}>{b.label}</Text>
              </Pressable>
            ))}
            <View style={{ width: 10 }} />
            {!isOwn && (
              <GlassPressable
                radius={12}
                padH={10}
                padV={6}
                variant="ghost"
                haptics="selection"
                onPress={onReply}
              >
                <Text style={{ color: "#EFFFFF", fontWeight: "800" }}>
                  Reply
                </Text>
              </GlassPressable>
            )}
            {!!message.text && (
              <GlassPressable
                radius={12}
                padH={10}
                padV={6}
                variant="ghost"
                haptics="selection"
                onPress={onCopy}
              >
                <Text style={{ color: "#EFFFFF", fontWeight: "800" }}>
                  Copy
                </Text>
              </GlassPressable>
            )}
            {isOwn && (
              <GlassPressable
                radius={12}
                padH={10}
                padV={6}
                variant="ghost"
                haptics="light"
                onPress={onUnsend}
              >
                <Text style={{ color: "#FFB3AE", fontWeight: "900" }}>
                  Unsend
                </Text>
              </GlassPressable>
            )}
          </View>
        </GlassPressable>
      </View>
    </Animated.View>
  );
}

// ————————————————————————————————————————————
// Main — ChatOverlay
// ————————————————————————————————————————————
export default function ChatOverlay({
  visible,
  conversationId,
  onClose,
}: {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { authState } = useAuth();
  const currentUsername = authState?.current?.user?.username || "UNKNOWN";
  const { callApi } = useApi();
  const callApiRef = useRef(callApi);
  callApiRef.current = callApi;

  const [conversation, setConversation] = useState<ConversationType | null>(
    null
  );
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [lanes, setLanes] = useState<Lane[]>([]);
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null);
  const [orbitalOpen, setOrbitalOpen] = useState(false);

  const [themeIdx, setThemeIdx] = useState(0);
  const theme = THEMES[themeIdx];
  const [accentColor, setAccentColor] = useState<string>(theme.accent);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversationMode>("personal");

  const [attachVisible, setAttachVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [attachmentsToSend, setAttachmentsToSend] = useState<
    { uri: string; type: string; name: string }[]
  >([]);

  const [focusedMessage, setFocusedMessage] = useState<MessageType | null>(
    null
  );
  const [overlayLayout, setOverlayLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const flatListRef = useRef<FlatList<MessageType>>(null);
  const bubbleRefs = useRef<Record<string, View | null>>({});

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const footerTranslate = useRef(new Animated.Value(0)).current;

  const [input, setInput] = useState("");
  const inputRef = useRef<TextInput>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const wasAtHardBottomRef = useRef(true);

  const keyboardHeightRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);

  const lastScrollTSRef = useRef(0);
  const lastVelocityRef = useRef(0);
  const controlRef = useRef<"idle" | "keyboard" | "scroll" | "settle">("idle");
  const ignoreKbdOnceRef = useRef(false);

  // Message animations per id
  const msgScales = useRef<Record<string, Animated.Value>>({}).current;
  const msgOpacities = useRef<Record<string, Animated.Value>>({}).current;
  const msgPanX = useRef<Record<string, Animated.Value>>({}).current;
  const ensureAnimFor = useCallback(
    (id: string) => {
      if (!msgScales[id]) msgScales[id] = new Animated.Value(0.97);
      if (!msgOpacities[id]) msgOpacities[id] = new Animated.Value(0);
      if (!msgPanX[id]) msgPanX[id] = new Animated.Value(0);
    },
    [msgOpacities, msgPanX, msgScales]
  );
  const animateInIfNew = useCallback(
    (id: string) => {
      Animated.parallel([
        Animated.spring(msgScales[id], {
          toValue: 1,
          useNativeDriver: true,
          stiffness: 320,
          damping: 22,
          mass: 0.6,
        }),
        Animated.timing(msgOpacities[id], {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [msgOpacities, msgScales]
  );

  // Open/Close animation
  useEffect(() => {
    if (!visible) return;
    translateY.setValue(SCREEN_HEIGHT);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
  }, [visible, translateY]);
  const triggerClose = useCallback(() => {
    Haptics.selectionAsync();
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, translateY]);

  // Load conversation + prefs
  const convLoadedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!visible || !conversationId) return;
    if (convLoadedForRef.current === conversationId) return;
    convLoadedForRef.current = conversationId;
    (async () => {
      try {
        const resp = await callApiRef.current(
          `messages/get_conversation_details/${conversationId}/`
        );
        setConversation(resp.data);
        if (resp.data?.mode) setMode(resp.data.mode);
        if (resp.data?.theme) {
          const {
            themeIdx: serverIdx,
            bgImage: serverBg,
            accentColor,
          } = resp.data.theme || {};
          if (typeof serverIdx === "number") {
            setThemeIdx(Math.max(0, Math.min(serverIdx, THEMES.length - 1)));
          }
          if (
            Object.prototype.hasOwnProperty.call(resp.data.theme, "bgImage")
          ) {
            setBgImage(serverBg ?? null); // allow explicit null from server
          }
          if (typeof accentColor === "string") setAccentColor(accentColor);
        }
      } catch {}
      try {
        const raw = await AsyncStorage.getItem(`chat:prefs:${conversationId}`);
        if (raw) {
          const prefs = JSON.parse(raw);
          if (typeof prefs.themeIdx === "number") {
            setThemeIdx(
              Math.max(0, Math.min(prefs.themeIdx, THEMES.length - 1))
            );
          }
          if (Object.prototype.hasOwnProperty.call(prefs, "bgImage")) {
            setBgImage(prefs.bgImage ?? null);
          }
          if (typeof prefs.accentColor === "string") {
            setAccentColor(prefs.accentColor);
          }
          if (typeof prefs.mode === "string") setMode(prefs.mode);
          if (typeof prefs.activeLaneId === "string")
            setActiveLaneId(prefs.activeLaneId);
        }
      } catch {}
    })();
  }, [visible, conversationId, callApiRef, setMode, setThemeIdx]);

  // Persist prefs (local + server)
  const persistPrefs = useCallback(
    async (
      patch: Partial<{
        themeIdx: number;
        bgImage: string | null;
        activeLaneId: string | null;
        accentColor: string;
        mode: ConversationMode;
      }>
    ) => {
      try {
        const raw =
          (await AsyncStorage.getItem(`chat:prefs:${conversationId}`)) || "{}";
        const prev = JSON.parse(raw);
        const next = { ...prev, ...patch };
        await AsyncStorage.setItem(
          `chat:prefs:${conversationId}`,
          JSON.stringify(next)
        );
      } catch {}
      try {
        await callApiRef.current(
          `messages/conversations/${conversationId}/prefs/`,
          "PATCH",
          {
            theme: {
              themeIdx: patch.themeIdx ?? themeIdx,
              bgImage: patch.bgImage ?? bgImage,
              accentColor: patch.accentColor ?? accentColor,
            },
            ...(patch.mode ? { mode: patch.mode } : {}),
          }
        );
      } catch {}
    },
    [conversationId, themeIdx, bgImage, accentColor, callApiRef]
  );

  // Lanes fetch/create once per open
  const lanesFetchedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!visible || !conversationId) return;
    if (lanesFetchedForRef.current === conversationId) return;
    lanesFetchedForRef.current = conversationId;
    (async () => {
      try {
        const ctxRes = await callApiRef.current(
          `messages/contexts/${conversationId}/`
        );
        const list: Lane[] = Array.isArray(ctxRes.data) ? ctxRes.data : [];
        if (list.length) {
          setLanes(list);
          setActiveLaneId((prev) =>
            prev && list.some((l) => l.id === prev) ? prev : list[0].id
          );
        } else {
          const created = await callApiRef.current(
            `messages/contexts/${conversationId}/`,
            "POST",
            { title: "Main", emoji: "chat", color: accentColor }
          );
          setLanes([created.data]);
          setActiveLaneId(created.data.id);
        }
      } catch {
        const fallback: Lane = {
          id: "default",
          title: "Main",
          emoji: "chat",
          color: accentColor,
        };
        setLanes([fallback]);
        setActiveLaneId("default");
      }
    })();
  }, [visible, conversationId, callApiRef, accentColor]);

  // Fetch messages for lane
  const fetchMessages = useCallback(
    async (pageToLoad: number) => {
      if (!activeLaneId || !conversationId) return;
      try {
        pageToLoad === 0 ? setLoading(true) : setLoadingOlder(true);
        const url = `messages/get_messages/${conversationId}/?limit=30&offset=${
          pageToLoad * 30
        }&context=${activeLaneId}`;
        const resp = await callApiRef.current(url);
        const { results, next } = resp.data || {};
        if (pageToLoad === 0)
          setMessages(Array.isArray(results) ? results : []);
        else
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.uuid));
            const filtered = (Array.isArray(results) ? results : []).filter(
              (m: any) => !existing.has(m.uuid)
            );
            return [...prev, ...filtered];
          });
        setHasMore(!!next);
        setPage(pageToLoad + 1);
      } catch {
      } finally {
        pageToLoad === 0 ? setLoading(false) : setLoadingOlder(false);
      }
    },
    [conversationId, activeLaneId, callApiRef]
  );
  useEffect(() => {
    if (visible && activeLaneId) fetchMessages(0);
  }, [visible, activeLaneId, fetchMessages]);

  // Live updates via WS
  const { sendMessage } = useWebSocket(`messages/inbox/${conversationId}/`, {
    onMessage: (data: any) => {
      if (data.type === "chat_message") {
        const msg: MessageType = data.message;
        if (activeLaneId && (msg.context ?? null) !== activeLaneId) return;
        setMessages((prev) => {
          const idx = prev.findIndex(
            (m) =>
              m.uuid.startsWith("temp-") &&
              m.sender_username === currentUsername &&
              (m.context ?? null) === (msg.context ?? null) &&
              m.text === msg.text
          );
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = msg;
            return next;
          }
          return prev.some((m) => m.uuid === msg.uuid) ? prev : [msg, ...prev];
        });
      } else if (data.type === "reaction_update") {
        const { message_uuid, reactions } = data;
        setMessages((prev) =>
          prev.map((m) => (m.uuid === message_uuid ? { ...m, reactions } : m))
        );
      } else if (data.type === "unsend") {
        const { message_uuid } = data;
        setMessages((prev) => prev.filter((m) => m.uuid !== message_uuid));
      }
    },
  });

  // Keyboard + footer sync (fixed)
  useEffect(() => {
    // iOS: mirror the system's interactive dismissal via frame changes.
    if (Platform.OS === "ios") {
      const bottomPad = Math.max(0, insets.bottom - 4);

      const frameSub = Keyboard.addListener(
        "keyboardWillChangeFrame",
        (e: any) => {
          const end = e?.endCoordinates;
          if (!end) return;
          const lift = Math.max(0, SCREEN_HEIGHT - end.screenY - bottomPad);
          const dur = e?.duration ?? 160;

          footerTranslate.stopAnimation(() => {
            Animated.timing(footerTranslate, {
              toValue: -lift,
              duration: Math.max(80, dur),
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start();
          });

          const visible = lift > 1;
          setKeyboardVisible(visible);
          controlRef.current = visible ? "keyboard" : "idle";
        }
      );

      const willHide = Keyboard.addListener("keyboardWillHide", () => {
        footerTranslate.stopAnimation(() => {
          Animated.timing(footerTranslate, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            setKeyboardVisible(false);
            keyboardHeightRef.current = 0;
            controlRef.current = "idle";
          });
        });
      });

      return () => {
        frameSub.remove();
        willHide.remove();
      };
    }

    // ANDROID: explicit show/hide
    const bottomPad = Math.max(0, insets.bottom - 4);

    const onShow = (e: any) => {
      const h = e?.endCoordinates?.height ?? 0;
      const lift = Math.max(0, h - bottomPad);
      footerTranslate.stopAnimation(() => {
        Animated.timing(footerTranslate, {
          toValue: -lift,
          duration: Math.min(200, e?.duration ?? 200),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
      keyboardHeightRef.current = lift;
      setKeyboardVisible(true);
      controlRef.current = "keyboard";
    };

    const onHide = (e: any) => {
      footerTranslate.stopAnimation(() => {
        Animated.timing(footerTranslate, {
          toValue: 0,
          duration: Math.min(220, e?.duration ?? 220),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setKeyboardVisible(false);
          keyboardHeightRef.current = 0;
          controlRef.current = "idle";
        });
      });
    };

    const didShow = Keyboard.addListener("keyboardDidShow", onShow);
    const didHide = Keyboard.addListener("keyboardDidHide", onHide);

    return () => {
      didShow.remove();
      didHide.remove();
    };
  }, [insets.bottom, footerTranslate]);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      (UIManager as any).setLayoutAnimationEnabledExperimental
    ) {
      (UIManager as any).setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Helpers
  const participantsUsers = useMemo(
    () =>
      (conversation?.participants ?? []).map((p: any) =>
        p?.user ? p.user : p
      ),
    [conversation]
  );
  const peers = useMemo(
    () =>
      participantsUsers.filter(
        (u: any) => (u?.username ?? u?.user?.username) !== currentUsername
      ),
    [participantsUsers, currentUsername]
  );
  const shownPeople = useMemo(
    () => (peers.length ? peers : participantsUsers),
    [peers, participantsUsers]
  );
  const nameLine = useMemo(
    () =>
      shownPeople
        .map(
          (u: any) =>
            [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
            `@${u?.username}`
        )
        .join(", "),
    [shownPeople]
  );
  const handleLine = useMemo(
    () => shownPeople.map((u: any) => `@${u?.username}`).join(", "),
    [shownPeople]
  );

  const isOwnMessage = (m: MessageType) =>
    m.sender_username === currentUsername;
  const needsTimeSeparator = (curr: MessageType, prev?: MessageType) => {
    if (!prev) return true;
    const t1 = new Date(curr.sent_at),
      t0 = new Date(prev.sent_at);
    const sameDay =
      t1.getFullYear() === t0.getFullYear() &&
      t1.getMonth() === t0.getMonth() &&
      t1.getDate() === t0.getDate();
    if (!sameDay) return true;
    return Math.abs((t1.getTime() - t0.getTime()) / 60000) >= 30;
  };

  // Open overlay (placed before renderer to avoid TDZ issues)
  const openOverlayFor = (message: MessageType) => {
    const ref = bubbleRefs.current[message.uuid];
    if (!ref) return;
    Haptics.selectionAsync();
    ref.measureInWindow?.((x, y, width, height) => {
      const clampX = (mx: number, w: number) =>
        Math.max(12, Math.min(mx, SCREEN_WIDTH - w - 12));
      const clampY = (my: number, h: number) =>
        Math.max(
          insets.top + 12,
          Math.min(my, SCREEN_HEIGHT - insets.bottom - 12 - h)
        );
      setFocusedMessage(message);
      setOverlayLayout({
        x: clampX(x, width),
        y: clampY(y, height),
        width,
        height,
      });
      Animated.spring(msgScales[message.uuid], {
        toValue: 0.98,
        useNativeDriver: true,
        stiffness: 360,
        damping: 18,
        mass: 0.4,
      }).start();
    });
  };

  // Media helpers
  const handleMediaPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("We need permission to access your media library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const newItems = result.assets.map((asset) => ({
        uri: asset.uri,
        type: (asset as any).mimeType || "image/jpeg",
        name: (asset as any).fileName || `media-${Date.now()}`,
      }));
      setAttachmentsToSend((prev) => [...prev, ...newItems]);
    }
  };
  const handleSaveMedia = async (att: AttachmentType) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Can't save media without permission."
        );
        return;
      }
      await MediaLibrary.createAssetAsync(att.url);
      Alert.alert("Saved!", "Media saved to your camera roll.");
    } catch {
      Alert.alert("Save failed", "Could not save media.");
    }
  };

  // Renderers
  const renderMediaAttachment = (att: AttachmentType) => {
    if (att.mime_type.startsWith("image/")) {
      return (
        <Pressable
          key={att.id}
          onLongPress={() =>
            Alert.alert("Save Image", "Save to your device?", [
              { text: "Cancel", style: "cancel" },
              { text: "Save", onPress: () => handleSaveMedia(att) },
            ])
          }
        >
          <Image source={{ uri: att.url }} style={styles.largeMediaFull} />
        </Pressable>
      );
    } else if (att.mime_type.startsWith("video/")) {
      return (
        <Pressable
          key={att.id}
          onLongPress={() =>
            Alert.alert("Save Video", "Save to your device?", [
              { text: "Cancel", style: "cancel" },
              { text: "Save", onPress: () => handleSaveMedia(att) },
            ])
          }
        >
          <Video
            source={{ uri: att.url }}
            style={styles.largeMediaFull}
            useNativeControls
            resizeMode="contain"
          />
        </Pressable>
      );
    }
    return (
      <GlassPressable
        key={att.id}
        variant="solid"
        radius={14}
        padH={12}
        padV={12}
        onPress={() => Linking.openURL(att.url)}
        onLongPress={() =>
          Alert.alert("Download File", "Download this file?", [
            { text: "Cancel", style: "cancel" },
            { text: "Download", onPress: () => Linking.openURL(att.url) },
          ])
        }
        haptics="selection"
        style={{ marginTop: 6, width: SCREEN_WIDTH * 0.75 - 4 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons
            name="insert-drive-file"
            size={24}
            color="#EFFFFF"
            style={{ marginRight: 10 }}
          />
        </View>
      </GlassPressable>
    );
  };

  const renderMessageItem = ({
    item,
    index,
  }: {
    item: MessageType;
    index: number;
  }) => {
    const prev = messages[index + 1];
    const next = messages[index - 1];
    const own = isOwnMessage(item);
    const plainText = item.text.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const emojiOnly = isEmojiOnlyMessage(plainText);
    const msgDate = new Date(item.sent_at);
    const showDateSeparator = needsTimeSeparator(item, prev);
    const firstOfGroup =
      !prev ||
      item.sender_username !== prev.sender_username ||
      Math.abs(
        new Date(item.sent_at).getTime() - new Date(prev.sent_at).getTime()
      ) /
        60000 >
        5;
    const lastOfGroup =
      !next ||
      next.sender_username !== item.sender_username ||
      Math.abs(
        new Date(next.sent_at).getTime() - new Date(item.sent_at).getTime()
      ) /
        60000 >
        5;
    const radius = {
      borderTopLeftRadius: own ? 18 : firstOfGroup ? 18 : 8,
      borderTopRightRadius: own ? (firstOfGroup ? 18 : 8) : 18,
      borderBottomLeftRadius: own ? 18 : lastOfGroup ? 18 : 8,
      borderBottomRightRadius: own ? (lastOfGroup ? 18 : 8) : 18,
    };

    const seenByUser: Record<string, ReactionType> = {};
    item.reactions.forEach((r) => {
      if (!seenByUser[r.user_username]) seenByUser[r.user_username] = r;
    });
    const reacts = Object.values(seenByUser);
    const maxBadges = 3;
    const overflow = Math.max(0, reacts.length - (maxBadges - 1));

    const parentMsg = item.parent_message_uuid
      ? messages.find((m) => m.uuid === item.parent_message_uuid)
      : null;
    const parentText = parentMsg
      ? parentMsg.text
        ? parentMsg.text.length > 50
          ? parentMsg.text.slice(0, 50) + "…"
          : parentMsg.text
        : "Attachment"
      : "";

    ensureAnimFor(item.uuid);
    animateInIfNew(item.uuid);
    const panX = msgPanX[item.uuid];
    const bubbleTranslateX = panX.interpolate({
      inputRange: [-80, 80],
      outputRange: [-20, 24],
      extrapolate: "clamp",
    });
    const timeOpacity = panX.interpolate({
      inputRange: [-80, -10],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <View
        style={{
          marginTop:
            (showDateSeparator ? 18 : firstOfGroup ? 10 : 2) +
            ((reacts?.length || 0) > 0 ? 16 : 0),
          marginBottom: lastOfGroup ? 8 : 2,
        }}
      >
        {showDateSeparator && (
          <GlassPressable
            radius={12}
            padH={12}
            padV={4}
            variant="ghost"
            style={{ alignSelf: "center" }}
            haptics="none"
          >
            <Text style={styles.dateSeparatorText}>
              {msgDate.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </GlassPressable>
        )}

        {firstOfGroup &&
          !own &&
          (() => {
            const sender = participantsUsers.find(
              (u: any) =>
                (u?.username ?? u?.user?.username) === item.sender_username
            ) as any;
            const senderFull = [sender?.first_name, sender?.last_name]
              .filter(Boolean)
              .join(" ")
              .trim();
            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    overflow: "hidden",
                    marginRight: 8,
                  }}
                >
                  <ProfilePicture
                    src={sender?.profile_image ?? null}
                    style={{ width: 28, height: 28 }}
                  />
                </View>
                <Text style={{ color: "#a7bdc5", fontSize: 12 }}>
                  {senderFull || `@${item.sender_username}`}
                </Text>
              </View>
            );
          })()}

        {parentMsg && (
          <GlassPressable
            radius={12}
            padH={8}
            padV={4}
            variant="ghost"
            style={[
              own ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
            ]}
            haptics="none"
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={styles.branchLine} />
              <Text style={styles.parentPreviewText} numberOfLines={1}>
                {parentMsg.sender_username}: {parentText}
              </Text>
            </View>
          </GlassPressable>
        )}

        <PanGestureHandler
          activeOffsetX={[-8, 8]}
          failOffsetY={[-8, 8]}
          onGestureEvent={Animated.event(
            [{ nativeEvent: { translationX: msgPanX[item.uuid] } }],
            { useNativeDriver: true }
          )}
          onHandlerStateChange={(e) => {
            const st = (e as any).nativeEvent.state;
            if (
              st === GestureState.END ||
              st === GestureState.CANCELLED ||
              st === GestureState.FAILED
            ) {
              const dx = (e as any).nativeEvent.translationX || 0;
              if (dx > 42 && !own) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setReplyingTo(item);
              }
              Animated.spring(msgPanX[item.uuid], {
                toValue: 0,
                useNativeDriver: true,
                stiffness: 300,
                damping: 20,
                mass: 0.5,
              }).start();
            }
          }}
        >
          <Animated.View
            style={{
              transform: [
                { translateX: bubbleTranslateX },
                { scale: msgScales[item.uuid] },
              ],
              opacity: msgOpacities[item.uuid],
            }}
          >
            <View
              style={[
                styles.bubbleWrap,
                { position: "relative" },
                own ? styles.messageRowOwn : styles.messageRowOther,
              ]}
            >
              {reacts.length > 0 && (
                <View
                  style={[
                    styles.reactCluster,
                    own ? styles.reactClusterOwn : styles.reactClusterOther,
                  ]}
                >
                  {reacts.slice(0, maxBadges).map((r, idx) => {
                    const emoji =
                      idx === maxBadges - 1 && overflow > 0
                        ? `+${overflow}`
                        : r.reaction_type === "like"
                        ? "👍"
                        : r.reaction_type === "love"
                        ? "❤️"
                        : r.reaction_type === "laugh"
                        ? "😂"
                        : r.reaction_type === "sad"
                        ? "😢"
                        : "😡";
                    return (
                      <View
                        key={`${r.user_username}-${idx}`}
                        style={styles.reactChip}
                      >
                        <Text style={styles.reactionPillText}>{emoji}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {emojiOnly ? (
                <Pressable
                  ref={(ref) => (bubbleRefs.current[item.uuid] = ref)}
                  delayLongPress={160}
                  onLongPress={() => openOverlayFor(item)}
                >
                  <Text
                    style={[
                      styles.emojiText,
                      own
                        ? { alignSelf: "flex-end" }
                        : { alignSelf: "flex-start" },
                      { color: own ? theme.textOnOwn : theme.textOnOther },
                    ]}
                  >
                    {item.text}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  ref={(ref) => (bubbleRefs.current[item.uuid] = ref)}
                  delayLongPress={160}
                  onLongPress={() => openOverlayFor(item)}
                >
                  <LiquidBubble
                    own={own}
                    emojiOnly={false}
                    radius={radius}
                    theme={theme as ThemeDef}
                    accentColor={accentColor}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: own ? theme.textOnOwn : theme.textOnOther },
                      ]}
                    >
                      {item.text}
                    </Text>
                  </LiquidBubble>
                </Pressable>
              )}

              <Animated.View
                style={[styles.timeChip, { opacity: timeOpacity }]}
              >
                <Text style={styles.timeChipText}>
                  {msgDate.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </Animated.View>
            </View>
            {item.attachments?.length > 0 && (
              <View
                style={[
                  styles.mediaBubbleContainer,
                  own ? styles.mediaBubbleOwn : styles.mediaBubbleOther,
                ]}
              >
                {item.attachments.map((att) => renderMediaAttachment(att))}
              </View>
            )}
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };

  // Send
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && attachmentsToSend.length === 0) return;
    if (!activeLaneId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const optimistic: MessageType = {
      uuid: `temp-${Date.now()}`,
      text: trimmed,
      sender_username: currentUsername,
      sent_at: new Date().toISOString(),
      attachments: attachmentsToSend.map((f) => ({
        id: `temp-${f.name}`,
        mime_type: f.type,
        url: f.uri,
        uploaded_at: new Date().toISOString(),
      })),
      reactions: [],
      parent_message_uuid: replyingTo?.uuid || null,
      context: activeLaneId,
    };
    setMessages((prev) => [optimistic, ...prev]);
    setInput("");
    setAttachmentsToSend([]);
    setReplyingTo(null);

    try {
      if (attachmentsToSend.length === 0) {
        sendMessage({
          text: trimmed,
          sender_username: currentUsername,
          conversation: conversationId,
          context: activeLaneId,
          ...(replyingTo && { parent_message_uuid: replyingTo.uuid }),
        });
      } else {
        const body: any = {
          conversation: conversationId,
          text: trimmed,
          context: activeLaneId,
          ...(replyingTo ? { parent_message_uuid: replyingTo.uuid } : {}),
        };
        const created = await callApiRef.current(
          "messages/create_message/",
          "POST",
          body
        );
        let newMessage: MessageType = created.data;
        if (attachmentsToSend.length > 0) {
          const formData = new FormData();
          attachmentsToSend.forEach((fileObj) => {
            formData.append("files", {
              uri: fileObj.uri,
              type: fileObj.type,
              name: fileObj.name,
            } as any);
          });
          const attResp = await callApiRef.current(
            `messages/upload_attachment/${newMessage.uuid}/`,
            "POST",
            formData,
            "multipart/form-data"
          );
          newMessage.attachments = attResp.data;
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.uuid === optimistic.uuid
              ? { ...newMessage, context: activeLaneId }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.uuid !== optimistic.uuid));
      Alert.alert(
        "Message Failed",
        "Unable to send your message. Please try again."
      );
    }
  };

  // Reactions
  const handleToggleReaction = async (
    msg: MessageType,
    reactionType: ReactionType["reaction_type"]
  ) => {
    const existingByUser = msg.reactions.find(
      (r) => r.user_username === currentUsername
    );
    const isSame = existingByUser?.reaction_type === reactionType;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.uuid !== msg.uuid) return m;
        let next = [...m.reactions];
        if (isSame && existingByUser)
          next = next.filter(
            (r) =>
              !(
                r.user_username === currentUsername &&
                r.reaction_type === reactionType
              )
          );
        else {
          if (existingByUser)
            next = next.filter((r) => r.user_username !== currentUsername);
          next.push({
            id: `temp-${Date.now()}`,
            user_username: currentUsername,
            reaction_type: reactionType,
            reacted_at: new Date().toISOString(),
          });
        }
        return { ...m, reactions: next };
      })
    );
    if (isSame && existingByUser)
      sendMessage({
        action: "remove_reaction",
        message_uuid: msg.uuid,
        reaction_type: reactionType,
      });
    else
      sendMessage({
        action: "add_reaction",
        message_uuid: msg.uuid,
        reaction_type: reactionType,
      });
  };

  const handleUnsend = async (msg: MessageType) => {
    try {
      await callApiRef.current(`messages/unsend_message/${msg.uuid}/`, "POST");
      setMessages((prev) => prev.filter((m) => m.uuid !== msg.uuid));
      sendMessage({ type: "unsend", message_uuid: msg.uuid });
    } catch {
      Alert.alert("Unable to unsend", "Try again in a moment.");
    }
  };

  // Scroll handler (Android-only interactive footer tracking)
  const onScroll = (e: any) => {
    const prevY = lastScrollYRef.current || 0;
    const y = e?.nativeEvent?.contentOffset?.y ?? 0;
    wasAtHardBottomRef.current = y <= 2;

    const now = Date.now();
    const dy = y - prevY;
    const dt = now - (lastScrollTSRef.current || now);
    if (dt > 0) {
      lastVelocityRef.current = (dy / dt) * 1000; // px/s
    }
    lastScrollTSRef.current = now;
    lastScrollYRef.current = y;

    // Keep reaction overlay anchored
    if (focusedMessage) {
      const ref = bubbleRefs.current[focusedMessage.uuid];
      ref?.measureInWindow?.((mx, winY, w, h) => {
        const clampX = (cx: number, w0: number) =>
          Math.max(12, Math.min(cx, SCREEN_WIDTH - w0 - 12));
        const clampY = (cy: number, h0: number) =>
          Math.max(
            insets.top + 12,
            Math.min(cy, SCREEN_HEIGHT - insets.bottom - 12 - h0)
          );
        setOverlayLayout({
          x: clampX(mx, w),
          y: clampY(winY, h),
          width: w,
          height: h,
        });
      });
    }

    // Android interactive dismissal mirror (safe + strictly Android)
    if (
      Platform.OS === "android" &&
      keyboardVisible &&
      isDraggingRef.current &&
      controlRef.current === "scroll" &&
      keyboardHeightRef.current > 0
    ) {
      const delta = Math.max(0, y - (dragStartYRef.current || 0));
      const remaining = Math.max(0, keyboardHeightRef.current - delta);

      footerTranslate.stopAnimation();
      footerTranslate.setValue(-remaining);

      if (remaining <= 0.5) {
        ignoreKbdOnceRef.current = true;
        Keyboard.dismiss();
      }
    }
  };

  if (loading && !conversation) return null;

  const reactionTheme = {
    bubbleOwn: accentColor,
    bubbleOther: theme.bubbleOther,
    textOnOwn: theme.textOnOwn,
    textOnOther: theme.textOnOther,
    backdropTintIntensity: theme.backdropTintIntensity,
  };
  const bottomInset = Math.max(8, footerHeight + 8);

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={triggerClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.containerWithoutOverflow}>
          <Pressable style={styles.backdrop} onPress={triggerClose} />
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                top: insets.top + 16,
                bottom: 0,
                transform: [{ translateY }],
              } as any,
            ]}
          >
            {/* background */}
            {bgImage ? (
              <ImageBackground
                source={{ uri: bgImage }}
                resizeMode="cover"
                style={StyleSheet.absoluteFillObject}
              >
                <LinearGradient
                  colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.82)"]}
                  style={StyleSheet.absoluteFillObject}
                />
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={(theme as ThemeDef).bgGradient as any}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            {/* Header */}
            <View
              style={{
                paddingHorizontal: 6,
                marginTop: 6,
                flexDirection: "row",
                gap: 10,
              }}
            >
              <GlassPressable
                onPress={triggerClose}
                radius={16}
                padH={10}
                padV={9}
                style={{ marginLeft: 10, alignSelf: "center" }}
                haptics="light"
              >
                <MaterialIcons name="chevron-left" size={24} color="#EFFFFF" />
              </GlassPressable>

              <GlassPressable
                onPress={() => setShowSettings(true)}
                radius={18}
                padH={10}
                padV={6}
                variant="ghost"
                style={styles.identityBar}
                haptics="selection"
                block
              >
                <View style={styles.avatarGroupWide}>
                  {shownPeople.slice(0, 3).map((u: any, idx: number) => (
                    <View
                      key={`${u?.id ?? u?.username ?? idx}-${idx}`}
                      style={[
                        styles.avatarWrapper,
                        { left: idx * 18, zIndex: 3 - idx },
                      ]}
                    >
                      <ProfilePicture
                        src={u?.profile_image}
                        style={styles.stackedAvatar}
                      />
                    </View>
                  ))}
                </View>
                <View style={styles.identityTextCol}>
                  <Text style={styles.chatHeaderName} numberOfLines={1}>
                    {nameLine || "Conversation"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.chatHeaderUsername} numberOfLines={1}>
                      {handleLine}
                    </Text>
                    <MaterialIcons
                      name="expand-more"
                      size={18}
                      color="#EFFFFF"
                    />
                  </View>
                </View>
              </GlassPressable>

              <GlassPressable
                radius={16}
                padH={10}
                padV={9}
                onPress={() => setOrbitalOpen(true)}
                haptics="selection"
              >
                <MaterialIcons name="blur-on" size={22} color={accentColor} />
              </GlassPressable>
            </View>

            {/* Inline lanes rail */}
            <View style={{ paddingVertical: 6 }}>
              <FlatList
                data={[
                  ...lanes.filter((l) => !l.is_archived),
                  { id: "__new__", title: "New", emoji: "add" } as any,
                ]}
                keyExtractor={(i: any) => i.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
                renderItem={({ item }: { item: any }) =>
                  item.id === "__new__" ? (
                    <GlassPressable
                      onPress={async () => {
                        Haptics.selectionAsync();
                        try {
                          const res = await callApiRef.current(
                            `messages/contexts/${conversationId}/`,
                            "POST",
                            {
                              title: "New lane",
                              emoji: "view-agenda",
                              color: accentColor,
                            }
                          );
                          const lane = res.data as Lane;
                          setLanes((p) => [lane, ...p]);
                          setActiveLaneId(lane.id);
                        } catch {
                          const lane: Lane = {
                            id: `local-${Date.now()}`,
                            title: "New lane",
                            emoji: "view-agenda",
                            color: accentColor,
                          };
                          setLanes((p) => [lane, ...p]);
                          setActiveLaneId(lane.id);
                        }
                      }}
                      radius={16}
                      padH={12}
                      padV={8}
                      variant="solid"
                      haptics="selection"
                      style={{ marginRight: 8 }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <MaterialIcons
                          name="add"
                          size={16}
                          color="#EFFFFF"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={{ color: "#EFFFFF", fontWeight: "900" }}>
                          New
                        </Text>
                      </View>
                    </GlassPressable>
                  ) : (
                    <Pressable
                      onPress={() => {
                        if (activeLaneId !== item.id) {
                          Haptics.selectionAsync();
                          setActiveLaneId(item.id);
                          persistPrefs({ activeLaneId: item.id });
                        }
                      }}
                      onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        Alert.alert(`${item.title}`, "Manage lane", [
                          {
                            text: "Rename / Edit",
                            onPress: () => setShowSettings(true),
                          },
                          {
                            text: item.is_archived ? "Unarchive" : "Archive",
                            onPress: async () => {
                              try {
                                await callApiRef.current(
                                  `messages/contexts/${conversationId}/${item.id}/`,
                                  "PATCH",
                                  { is_archived: !item.is_archived }
                                );
                              } catch {}
                              setLanes((prev) =>
                                prev.map((l) =>
                                  l.id === item.id
                                    ? { ...l, is_archived: !item.is_archived }
                                    : l
                                )
                              );
                              if (
                                !item.is_archived &&
                                activeLaneId === item.id
                              ) {
                                const firstActive = lanes.find(
                                  (l) => l.id !== item.id && !l.is_archived
                                );
                                setActiveLaneId(firstActive?.id ?? null);
                              }
                            },
                          },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () =>
                              Alert.alert(
                                "Delete lane?",
                                "This only removes the lane context. Messages remain in the conversation history.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: async () => {
                                      try {
                                        await callApiRef.current(
                                          `messages/contexts/${conversationId}/${item.id}/`,
                                          "DELETE"
                                        );
                                      } catch {}
                                      setLanes((p) =>
                                        p.filter((l) => l.id !== item.id)
                                      );
                                      if (activeLaneId === item.id) {
                                        const firstActive = lanes.find(
                                          (l) =>
                                            l.id !== item.id && !l.is_archived
                                        );
                                        setActiveLaneId(
                                          firstActive?.id ?? null
                                        );
                                      }
                                    },
                                  },
                                ]
                              ),
                          },
                          { text: "Cancel", style: "cancel" },
                        ]);
                      }}
                      style={[
                        styles.lanePill,
                        activeLaneId === item.id
                          ? styles.lanePillActive
                          : styles.lanePillInactive,
                        { marginRight: 8 },
                      ]}
                    >
                      <MaterialIcons
                        name={(item.emoji as any) || "view-agenda"}
                        size={16}
                        color={activeLaneId === item.id ? "#EFFFFF" : "#d7e7ea"}
                        style={{ marginRight: 6, opacity: 0.95 }}
                      />
                      <Text
                        style={[
                          styles.laneText,
                          activeLaneId === item.id
                            ? styles.laneTextActive
                            : styles.laneTextInactive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                    </Pressable>
                  )
                }
              />
            </View>

            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(m) => m.uuid}
              renderItem={renderMessageItem}
              inverted
              maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              keyboardDismissMode={
                Platform.OS === "ios" ? "interactive" : "on-drag"
              }
              keyboardShouldPersistTaps="handled"
              onEndReachedThreshold={0.4}
              onEndReached={() => {
                if (hasMore && !loadingOlder) {
                  fetchMessages(page);
                }
              }}
              onScrollBeginDrag={(e) => {
                isDraggingRef.current = true;
                controlRef.current = "scroll";
                dragStartYRef.current =
                  e?.nativeEvent?.contentOffset?.y ?? 0;
              }}
              onScrollEndDrag={() => {
                isDraggingRef.current = false;
                if (Platform.OS === "android" && keyboardVisible) {
                  ignoreKbdOnceRef.current = true;
                  Keyboard.dismiss();
                }
              }}
              onMomentumScrollEnd={() => {
                isDraggingRef.current = false;
                if (Platform.OS === "android" && keyboardVisible) {
                  ignoreKbdOnceRef.current = true;
                  Keyboard.dismiss();
                }
              }}
              ListFooterComponent={
                loadingOlder ? (
                  <View style={{ paddingVertical: 16 }}>
                    <ActivityIndicator color="#cde8ef" />
                  </View>
                ) : null
              }
              ListHeaderComponent={<View style={{ height: bottomInset }} />}
              contentContainerStyle={{
                paddingHorizontal: 12,
                // small spacer for the visual top (older messages) in inverted mode
                paddingBottom: 6,
              }}
              // Make the scroll bar avoid the composer too
              scrollIndicatorInsets={{ top: bottomInset }}
            />

            {/* Footer / Composer */}
            <Animated.View
              style={[
                styles.footer,
                { paddingBottom: Math.max(8, insets.bottom + 6) },
                { transform: [{ translateY: footerTranslate }] },
              ]}
              onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            >
              {replyingTo && (
                <View style={styles.replyBar}>
                  <MaterialIcons
                    name="reply"
                    size={16}
                    color="#EFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.replyText} numberOfLines={1}>
                    Replying to {replyingTo.sender_username}:{" "}
                    {replyingTo.text || "Attachment"}
                  </Text>
                  <Pressable
                    onPress={() => setReplyingTo(null)}
                    style={styles.replyClose}
                  >
                    <MaterialIcons name="close" size={16} color="#EFFFFF" />
                  </Pressable>
                </View>
              )}

              {attachmentsToSend.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    paddingHorizontal: 6,
                    paddingBottom: 6,
                  }}
                >
                  <FlatList
                    data={attachmentsToSend}
                    keyExtractor={(f) => f.uri}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                      <View
                        style={{
                          marginRight: 8,
                          position: "relative",
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          source={{ uri: item.uri }}
                          style={styles.attachPreviewThumb}
                        />
                        <Pressable
                          onPress={() =>
                            setAttachmentsToSend((prev) =>
                              prev.filter((f) => f.uri !== item.uri)
                            )
                          }
                          style={styles.attachPreviewClose}
                        >
                          <MaterialIcons
                            name="close"
                            size={14}
                            color="#EFFFFF"
                          />
                        </Pressable>
                      </View>
                    )}
                  />
                </View>
              )}

              <View style={styles.composerRow}>
                <GlassPressable
                  radius={16}
                  padH={10}
                  padV={10}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setAttachVisible(true);
                  }}
                  style={styles.attachBtn}
                >
                  <MaterialIcons name="add" size={22} color="#EFFFFF" />
                </GlassPressable>

                <GlassInput
                  ref={inputRef}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Message..."
                  maxLines={15}
                  containerStyle={styles.inputContainer}
                  style={styles.inputBox}
                  onSubmitEditing={handleSend}
                />

                <GlassPressable
                  radius={16}
                  padH={12}
                  padV={10}
                  onPress={handleSend}
                  style={styles.sendBtn}
                  haptics="light"
                >
                  <MaterialIcons name="send" size={18} color="white" />
                </GlassPressable>
              </View>
            </Animated.View>

            {/* Overlays */}
            <ReactionOverlay
              visible={!!focusedMessage && !!overlayLayout}
              layout={overlayLayout}
              message={focusedMessage}
              theme={reactionTheme}
              insets={insets}
              currentUsername={currentUsername}
              isOwn={focusedMessage ? isOwnMessage(focusedMessage) : false}
              onClose={() => setFocusedMessage(null)}
              onReply={() => {
                if (focusedMessage) setReplyingTo(focusedMessage);
                setFocusedMessage(null);
              }}
              onCopy={() => {
                if (focusedMessage?.text)
                  Clipboard.setStringAsync(focusedMessage.text);
                setFocusedMessage(null);
              }}
              onUnsend={() => {
                if (focusedMessage) handleUnsend(focusedMessage);
                setFocusedMessage(null);
              }}
              onToggleReaction={(type) => {
                if (focusedMessage) handleToggleReaction(focusedMessage, type);
                setFocusedMessage(null);
              }}
            />

            <OrbitalNav
              visible={orbitalOpen}
              lanes={lanes}
              activeLaneId={activeLaneId}
              onPick={(id) => {
                setActiveLaneId(id);
                persistPrefs({ activeLaneId: id });
              }}
              onClose={() => setOrbitalOpen(false)}
              accentColor={accentColor}
            />

            <SettingsOverlay
              visible={showSettings}
              onDismiss={() => setShowSettings(false)}
              themeIdx={themeIdx}
              setThemeIdx={(idx: number) => {
                setThemeIdx(idx);
                setAccentColor(THEMES[idx].accent);
                persistPrefs({ themeIdx: idx, accentColor: THEMES[idx].accent });
              }}
              bgImage={bgImage}
              setBgImage={(uri: string | null) => {
                setBgImage(uri);
                persistPrefs({ bgImage: uri });
              }}
              mode={mode}
              setMode={(m: ConversationMode) => {
                setMode(m);
                persistPrefs({ mode: m });
              }}
            />

            <AttachMenu
              visible={attachVisible}
              onDismiss={() => setAttachVisible(false)}
              onPickMedia={async () => {
                await handleMediaPick();
                setAttachVisible(false);
              }}
              onSetBackground={async () => {
                const res = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  quality: 0.8,
                  selectionLimit: 1,
                });
                if (!res.canceled && res.assets?.[0]?.uri) {
                  setBgImage(res.assets[0].uri);
                  persistPrefs({ bgImage: res.assets[0].uri });
                }
                setAttachVisible(false);
              }}
              onCycleTheme={() => {
                const next = (themeIdx + 1) % THEMES.length;
                setThemeIdx(next);
                setAccentColor(THEMES[next].accent);
                persistPrefs({ themeIdx: next, accentColor: THEMES[next].accent });
                setAttachVisible(false);
              }}
              onStartPoll={() => {
                Haptics.selectionAsync();
                Alert.alert("Poll", "Coming soon ✨");
                setAttachVisible(false);
              }}
              onStartVoice={() => {
                Haptics.selectionAsync();
                Alert.alert("Voice", "Coming soon ✨");
                setAttachVisible(false);
              }}
              onShareLocation={() => {
                Haptics.selectionAsync();
                Alert.alert("Location", "Coming soon ✨");
                setAttachVisible(false);
              }}
              onSchedule={() => {
                Haptics.selectionAsync();
                Alert.alert("Schedule", "Coming soon ✨");
                setAttachVisible(false);
              }}
              onCamera={async () => {
                const { status } =
                  await ImagePicker.requestCameraPermissionsAsync();
                if (status === "granted") {
                  const cap = await ImagePicker.launchCameraAsync({
                    quality: 0.8,
                  });
                  if (!cap.canceled && cap.assets?.[0]) {
                    const a = cap.assets[0];
                    setAttachmentsToSend((prev) => [
                      ...prev,
                      {
                        uri: a.uri,
                        type: (a as any).mimeType || "image/jpeg",
                        name: (a as any).fileName || `camera-${Date.now()}`,
                      },
                    ]);
                  }
                }
                setAttachVisible(false);
              }}
              onDocument={() => {
                Haptics.selectionAsync();
                Alert.alert("Documents", "Coming soon ✨");
                setAttachVisible(false);
              }}
            />
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  containerWithoutOverflow: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },

  // Header / identity
  identityBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarGroupWide: {
    width: 64,
    height: 32,
    marginLeft: 4,
  },
  avatarWrapper: {
    position: "absolute",
    top: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  stackedAvatar: { width: 28, height: 28 },
  identityTextCol: { flex: 1, marginLeft: 16, paddingRight: 8 },
  chatHeaderName: {
    color: "#EFFFFF",
    fontWeight: "900",
    fontSize: 14,
    marginBottom: 2,
  },
  chatHeaderUsername: {
    color: "#cde8ef",
    fontSize: 12,
    opacity: 0.8,
  },

  // Lanes
  lanePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  lanePillActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  lanePillInactive: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  laneText: { fontSize: 12, fontWeight: "800" },
  laneTextActive: { color: "#EFFFFF" },
  laneTextInactive: { color: "#d7e7ea" },

  // Messages
  dateSeparatorText: {
    color: "#cde8ef",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  branchLine: {
    width: 2,
    height: 16,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginRight: 8,
  },
  parentPreviewText: {
    color: "#cde8ef",
    fontSize: 12,
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  bubbleWrap: {
    maxWidth: BUBBLE_MAX_W,
    alignSelf: "flex-start",
  },
  messageRowOwn: {
    alignSelf: "flex-end",
  },
  messageRowOther: {
    alignSelf: "flex-start",
  },
  reactCluster: {
    position: "absolute",
    top: -12,
    flexDirection: "row",
    zIndex: 10,
  },
  reactClusterOwn: { right: 8 },
  reactClusterOther: { left: 8 },
  reactChip: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  reactionPillText: { color: "#EFFFFF", fontSize: 11, fontWeight: "900" },
  emojiText: {
    fontSize: 42,
    lineHeight: 46,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  timeChip: {
    position: "absolute",
    bottom: -18,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  timeChipText: { color: "#e7f7f0", fontSize: 10, fontWeight: "800" },
  mediaBubbleContainer: {
    marginTop: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  mediaBubbleOwn: { alignSelf: "flex-end" },
  mediaBubbleOther: { alignSelf: "flex-start" },
  largeMediaFull: {
    width: Math.min(SCREEN_WIDTH * 0.8, 340),
    height: Math.min(SCREEN_WIDTH * 0.8, 340),
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  // Footer / composer
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 6,
    paddingHorizontal: 10,
    backgroundColor: "transparent",
  },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 6,
    overflow: "hidden",
  },
  replyText: { color: "#EFFFFF", flex: 1, fontSize: 12, opacity: 0.9 },
  replyClose: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    width: '100%',
    flex: 1,
    // backgroundColor: "red",
  },
  attachBtn: { alignSelf: "flex-end" },
  sendBtn: {
    backgroundColor: "rgba(239, 255, 255, 0)",
    borderRadius: 16,
  },
  inputContainer: {
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0)",
  },
  inputBox: {
    flex: 1,
    flexGrow: 1,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 200,
    borderRadius: 16,
    // backgroundColor: "blue",
  },
  attachPreviewThumb: {
    width: 66,
    height: 66,
  },
  attachPreviewClose: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 3,
  },

  // Orbital
  orbitPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  orbitPillActive: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  orbitPillInactive: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  orbitText: { fontSize: 12, fontWeight: "800" },
  orbitTextActive: { color: "#EFFFFF" },
  orbitTextInactive: { color: "#d7e7ea" },
});