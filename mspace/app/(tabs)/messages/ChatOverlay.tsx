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
import SettingsOverlay from "./ChatDetailsSheet";

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
  const sheenOpacity = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });
  const sheenShift = press.interpolate({
    inputRange: [0, 1],
    outputRange: [-22, 22],
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

  // component size for clamping
  const compW = useRef(0);
  const compH = useRef(0);
  const compWAV = useRef(new Animated.Value(0)).current;
  const compHAV = useRef(new Animated.Value(0)).current;

  // Torch geometry
  const SPOT_R = 100;
  const HOT_R = 40;
  const haloR = Math.round(SPOT_R * 1.8);
  const spotTX = Animated.subtract(glowX, SPOT_R);
  const spotTY = Animated.subtract(glowY, SPOT_R);
  const hotTX = Animated.subtract(glowX, HOT_R);
  const hotTY = Animated.subtract(glowY, HOT_R);
  const haloTX = Animated.subtract(glowX, haloR);
  const haloTY = Animated.subtract(glowY, haloR);

  return (
    <Animated.View
      style={[
        {
          borderRadius: radius,
          transform: [
            { scaleX: Animated.multiply(stretchX, scale) },
            { scaleY: Animated.multiply(stretchY, scale) },
          ],
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
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              compW.current = width;
              compH.current = height;
              compWAV.setValue(width);
              compHAV.setValue(height);
              if ((glowX as any)._value === 0 && (glowY as any)._value === 0) {
                glowX.setValue(width * 0.5);
                glowY.setValue(height * 0.5);
              }
            }}
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
                {/* halo */}
                <Animated.View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFill, { opacity: glowOpacity }]}
                >
                  <Animated.View
                    style={{
                      position: "absolute",
                      width: haloR * 2,
                      height: haloR * 2,
                      transform: [
                        { translateX: haloTX },
                        { translateY: haloTY },
                      ],
                    }}
                  >
                    <Svg width="100%" height="100%">
                      <Defs>
                        <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
                          <Stop
                            offset="0%"
                            stopColor="#FFFFFF"
                            stopOpacity={0.08}
                          />
                          <Stop
                            offset="100%"
                            stopColor="#FFFFFF"
                            stopOpacity={0.0}
                          />
                        </RadialGradient>
                      </Defs>
                      <Circle cx="50%" cy="50%" r="50%" fill="url(#halo)" />
                    </Svg>
                  </Animated.View>
                  <Animated.View
                    style={{
                      position: "absolute",
                      width: SPOT_R * 2,
                      height: SPOT_R * 2,
                      transform: [
                        { translateX: spotTX },
                        { translateY: spotTY },
                      ],
                    }}
                  >
                    <Svg width="100%" height="100%">
                      <Defs>
                        <RadialGradient id="spot" cx="50%" cy="50%" r="50%">
                          <Stop
                            offset="0%"
                            stopColor="#FFFFFF"
                            stopOpacity={0.36}
                          />
                          <Stop
                            offset="35%"
                            stopColor="#FFFFFF"
                            stopOpacity={0.18}
                          />
                          <Stop
                            offset="100%"
                            stopColor="#FFFFFF"
                            stopOpacity={0.0}
                          />
                        </RadialGradient>
                      </Defs>
                      <Circle cx="50%" cy="50%" r="50%" fill="url(#spot)" />
                    </Svg>
                  </Animated.View>
                  <Animated.View
                    style={{
                      position: "absolute",
                      width: HOT_R * 2,
                      height: HOT_R * 2,
                      transform: [{ translateX: hotTX }, { translateY: hotTY }],
                    }}
                  >
                    <Svg width="100%" height="100%">
                      <Defs>
                        <RadialGradient id="hot" cx="50%" cy="50%" r="50%">
                          <Stop
                            offset="0%"
                            stopColor="#FFFFFF"
                            stopOpacity={0.45}
                          />
                          <Stop
                            offset="100%"
                            stopColor="#FFFFFF"
                            stopOpacity={0.12}
                          />
                        </RadialGradient>
                      </Defs>
                      <Circle cx="50%" cy="50%" r="50%" fill="url(#hot)" />
                    </Svg>
                  </Animated.View>
                </Animated.View>
                {/* sheen */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: sheenOpacity,
                      transform: [{ translateX: sheenShift }],
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
// Orbital Lanes Navigator — radial, bouncy lane selection
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
  const ring = useRef(new Animated.Value(0)).current; // 0->1 expand

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
  }, [visible]);

  if (!visible) return null;

  const R = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) * 0.32; // radius of orbit
  const cx = SCREEN_WIDTH / 2;
  const cy = SCREEN_HEIGHT * 0.42;
  const items = lanes.filter((l) => !l.is_archived);
  const N = Math.max(1, items.length);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "rgba(0,0,0,0.35)", opacity: fade },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        pointerEvents="box-none"
      >
        {/* Central glass puck */}
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
          <BlurView
            intensity={18}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
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

        {/* Orbiting pills */}
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
// Reaction Overlay — long-press actions
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
  }, [visible]);
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
// Attach Menu — liquid action tray
// ————————————————————————————————————————————
function AttachMenu({
  visible,
  onDismiss,
  onPickMedia,
  onSetBackground,
  onCycleTheme,
  onStartPoll,
  onStartVoice,
  onShareLocation,
  onSchedule,
  onCamera,
  onDocument,
}: {
  visible: boolean;
  onDismiss: () => void;
  onPickMedia: () => void;
  onSetBackground: () => void;
  onCycleTheme: () => void;
  onStartPoll: () => void;
  onStartVoice: () => void;
  onShareLocation: () => void;
  onSchedule: () => void;
  onCamera: () => void;
  onDocument: () => void;
}) {
  const slide = useRef(new Animated.Value(300)).current;
  useEffect(() => {
    if (visible)
      Animated.timing(slide, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <Animated.View style={{ transform: [{ translateY: slide }] }}>
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[
              { icon: "insert-photo", label: "Media", onPress: onPickMedia },
              {
                icon: "wallpaper",
                label: "Background",
                onPress: onSetBackground,
              },
              { icon: "palette", label: "Theme", onPress: onCycleTheme },
              { icon: "poll", label: "Poll", onPress: onStartPoll },
              { icon: "keyboard-voice", label: "Voice", onPress: onStartVoice },
              {
                icon: "my-location",
                label: "Location",
                onPress: onShareLocation,
              },
              { icon: "schedule", label: "Schedule", onPress: onSchedule },
              { icon: "photo-camera", label: "Camera", onPress: onCamera },
              { icon: "description", label: "Document", onPress: onDocument },
            ].map((it) => (
              <View
                key={it.label}
                style={{ width: SCREEN_WIDTH / 3, padding: 6 }}
              >
                <GlassPressable
                  radius={16}
                  padH={12}
                  padV={12}
                  variant="ghost"
                  onPress={() => {
                    Haptics.selectionAsync();
                    it.onPress();
                  }}
                >
                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 6,
                    }}
                  >
                    <MaterialIcons
                      name={it.icon as any}
                      size={22}
                      color="#EFFFFF"
                    />
                    <Text
                      style={{
                        color: "#EFFFFF",
                        marginTop: 6,
                        fontWeight: "800",
                      }}
                    >
                      {it.label}
                    </Text>
                  </View>
                </GlassPressable>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// // ————————————————————————————————————————————
// // Chat Details Sheet — themes, lanes, rules, permissions
// // ————————————————————————————————————————————
// function ChatDetailsSheet({ visible, onClose, conversation, conversationId, lanes, activeLaneId, onSetActiveLane, onCreateLane, onArchiveLane, onUpdateLane, onDeleteLane, onPickBackground, onUseDefaultBlack, onApplyTheme, onSetAccent, themeName, mode, onSetMode, }: { visible: boolean; onClose: () => void; conversation: ConversationType | null; conversationId: string; lanes: Lane[]; activeLaneId: string | null; onSetActiveLane: (id: string) => void; onCreateLane: (title: string) => Promise<void> | void; onArchiveLane: (id: string) => Promise<void> | void; onUpdateLane: (id: string, patch: Partial<Lane>) => Promise<void> | void; onDeleteLane: (id: string) => Promise<void> | void; onPickBackground: () => Promise<void> | void; onUseDefaultBlack: () => void; onApplyTheme: (id: string) => void; onSetAccent: (hex: string) => void; themeName: string; mode: ConversationMode; onSetMode: (m: ConversationMode) => void; }) {
//   const slide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
//   useEffect(() => { if (visible) Animated.timing(slide, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, [visible]);
//   if (!visible) return null;

//   const modes: ConversationMode[] = ["personal", "work", "family", "dating", "travel", "events", "wellness"];

//   return (
//     <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]}>
//       <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
//       <Animated.View style={{ transform: [{ translateY: slide }], backgroundColor: "rgba(8,12,16,0.86)", borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: SCREEN_HEIGHT * 0.86 }}>
//         <View style={{ padding: 14 }}>
//           <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
//             <Text style={{ color: "#EFFFFF", fontWeight: "900", fontSize: 18 }}>Chat Details</Text>
//             <GlassPressable radius={14} padH={10} padV={6} onPress={onClose}><MaterialIcons name="close" size={18} color="#EFFFFF" /></GlassPressable>
//           </View>

//           {/* Themes */}
//           <Text style={styles.sectionHeader}>Appearance</Text>
//           <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
//             {THEMES.map((t) => (
//               <View key={t.id} style={{ width: SCREEN_WIDTH / 3, padding: 6 }}>
//                 <GlassPressable variant="ghost" radius={14} padH={10} padV={10} onPress={() => onApplyTheme(t.id)}>
//                   <LinearGradient colors={t.bgGradient as any} style={{ height: 70, borderRadius: 12 }} />
//                   <Text style={{ color: "#EFFFFF", marginTop: 6, fontWeight: "800", textAlign: "center" }}>{t.name}</Text>
//                 </GlassPressable>
//               </View>
//             ))}
//           </View>
//           <View style={{ flexDirection: "row", marginTop: 8 }}>
//             <GlassPressable variant="solid" radius={14} padH={12} padV={10} onPress={onPickBackground} style={{ marginRight: 8 }}>
//               <Text style={{ color: "#001410", fontWeight: "900" }}>Set Background</Text>
//             </GlassPressable>
//             <GlassPressable variant="ghost" radius={14} padH={12} padV={10} onPress={onUseDefaultBlack}>
//               <Text style={{ color: "#cfe5e9", fontWeight: "900" }}>Use Default</Text>
//             </GlassPressable>
//           </View>

//           {/* Lanes */}
//           <Text style={styles.sectionHeader}>Lanes</Text>
//           <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
//             {lanes.map((l) => (
//               <View key={l.id} style={{ width: SCREEN_WIDTH / 2 - 20, padding: 6 }}>
//                 <GlassPressable radius={16} padH={12} padV={10} onPress={() => onSetActiveLane(l.id)}>
//                   <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
//                     <View style={{ flexDirection: "row", alignItems: "center" }}>
//                       <MaterialIcons name={(l.emoji as any) || "view-agenda"} color="#EFFFFF" size={18} style={{ marginRight: 8 }} />
//                       <Text style={{ color: "#EFFFFF", fontWeight: "900" }}>{l.title}</Text>
//                     </View>
//                     <View style={{ flexDirection: "row" }}>
//                       <Pressable onPress={() => onArchiveLane(l.id)} style={{ padding: 6 }}><MaterialIcons name={l.is_archived ? "unarchive" : "archive"} color="#cfe5e9" size={18} /></Pressable>
//                       <Pressable onPress={() => onDeleteLane(l.id)} style={{ padding: 6 }}><MaterialIcons name="delete" color="#FFB3AE" size={18} /></Pressable>
//                     </View>
//                   </View>
//                   {/* Rules quick toggles */}
//                   <View style={{ flexDirection: "row", marginTop: 8 }}>
//                     <GlassPressable radius={12} padH={10} padV={6} variant={l.rules?.mute ? "solid" : "ghost"} onPress={() => onUpdateLane(l.id, { rules: { ...(l.rules || {}), mute: !l.rules?.mute } })} style={{ marginRight: 6 }}><Text style={{ color: l.rules?.mute ? "#001410" : "#cfe5e9", fontWeight: "800" }}>{l.rules?.mute ? "Muted" : "Mute"}</Text></GlassPressable>
//                     <GlassPressable radius={12} padH={10} padV={6} variant={l.rules?.pinned ? "solid" : "ghost"} onPress={() => onUpdateLane(l.id, { rules: { ...(l.rules || {}), pinned: !l.rules?.pinned } })} style={{ marginRight: 6 }}><Text style={{ color: l.rules?.pinned ? "#001410" : "#cfe5e9", fontWeight: "800" }}>{l.rules?.pinned ? "Pinned" : "Pin"}</Text></GlassPressable>
//                     <GlassPressable radius={12} padH={10} padV={6} variant={l.rules?.ephemeralSeconds ? "solid" : "ghost"} onPress={() => onUpdateLane(l.id, { rules: { ...(l.rules || {}), ephemeralSeconds: l.rules?.ephemeralSeconds ? null : 60 * 60 * 24 } })}><Text style={{ color: l.rules?.ephemeralSeconds ? "#001410" : "#cfe5e9", fontWeight: "800" }}>{l.rules?.ephemeralSeconds ? "24h" : "Ephemeral"}</Text></GlassPressable>
//                   </View>
//                 </GlassPressable>
//               </View>
//             ))}
//             <View style={{ width: SCREEN_WIDTH / 2 - 20, padding: 6 }}>
//               <GlassPressable radius={16} padH={12} padV={12} variant="solid" onPress={() => onCreateLane("New lane")}>
//                 <View style={{ flexDirection: "row", alignItems: "center" }}>
//                   <MaterialIcons name="add" color="#EFFFFF" size={18} style={{ marginRight: 8 }} />
//                   <Text style={{ color: "#EFFFFF", fontWeight: "900" }}>New lane</Text>
//                 </View>
//               </GlassPressable>
//             </View>
//           </View>

//           {/* Mode */}
//           <Text style={styles.sectionHeader}>Mode</Text>
//           <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
//             {modes.map((m) => (
//               <View key={m} style={{ paddingRight: 8, paddingBottom: 8 }}>
//                 <GlassPressable radius={14} padH={12} padV={8} variant={mode === m ? "solid" : "ghost"} onPress={() => onSetMode(m)}>
//                   <Text style={{ color: mode === m ? "#001410" : "#cfe5e9", fontWeight: "900" }}>{m}</Text>
//                 </GlassPressable>
//               </View>
//             ))}
//           </View>
//         </View>
//       </Animated.View>
//     </View>
//   );
// }

// ————————————————————————————————————————————
// Main — ChatOverlay (Liquid Glass with Orbital Lanes)
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
  const [showDetails, setShowDetails] = useState(false);
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
  const interactiveDismissRef = useRef(false);
  const dismissDragAccumRef = useRef(0);
  const lastScrollYRef = useRef(0);

const isDraggingRef = useRef(false);
const dismissBaselineYRef = useRef(0);           // y where interactive dismiss started
const skipNextKeyboardHideAnimRef = useRef(false); // avoid double-anim on programmatic dismiss (Android)
  const [showSettings, setShowSettings] = useState(false);

  // Message animations per id
  const msgScales = useRef<Record<string, Animated.Value>>({}).current;
  const msgOpacities = useRef<Record<string, Animated.Value>>({}).current;
  const msgPanX = useRef<Record<string, Animated.Value>>({}).current;
  const ensureAnimFor = useCallback((id: string) => {
    if (!msgScales[id]) msgScales[id] = new Animated.Value(0.97);
    if (!msgOpacities[id]) msgOpacities[id] = new Animated.Value(0);
    if (!msgPanX[id]) msgPanX[id] = new Animated.Value(0);
  }, []);
  const animateInIfNew = useCallback((id: string) => {
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
  }, []);

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
  }, [visible]);
  const triggerClose = useCallback(() => {
    Haptics.selectionAsync();
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose]);

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
          if (typeof serverIdx === "number")
            setThemeIdx(Math.max(0, Math.min(serverIdx, THEMES.length - 1)));
          if (serverBg !== undefined) setBgImage(serverBg || null);
          if (typeof accentColor === "string") setAccentColor(accentColor);
        }
      } catch {}
      try {
        const raw = await AsyncStorage.getItem(`chat:prefs:${conversationId}`);
        if (raw) {
          const prefs = JSON.parse(raw);
          if (typeof prefs.themeIdx === "number")
            setThemeIdx(
              Math.max(0, Math.min(prefs.themeIdx, THEMES.length - 1))
            );
          if (typeof prefs.bgImage === "string")
            setBgImage(prefs.bgImage || null);
          if (typeof prefs.accentColor === "string")
            setAccentColor(prefs.accentColor);
          if (typeof prefs.mode === "string") setMode(prefs.mode);
          if (typeof prefs.activeLaneId === "string")
            setActiveLaneId(prefs.activeLaneId);
        }
      } catch {}
    })();
  }, [visible, conversationId]);

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
    [conversationId, themeIdx, bgImage, accentColor]
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
  }, [visible, conversationId]);

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
    [conversationId, activeLaneId]
  );
  useEffect(() => {
    if (visible && activeLaneId) fetchMessages(0);
  }, [visible, activeLaneId]);

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

  // Keyboard sync for footer
useEffect(() => {
  const bottomPad = Math.max(0, insets.bottom - 4);

  // Snap without animation (keeps footer locked to keyboard with no 1-frame lag)
  const snap = (lift: number) => {
    footerTranslate.setValue(-lift);
  };

  // Animate when we’re not interactively dragging (mostly for hides)
  const animateTo = (lift: number, duration = 260) =>
    Animated.timing(footerTranslate, {
      toValue: -lift,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  const ensureBottom = () => {
    if (wasAtHardBottomRef.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const onShow = (e: any) => {
    const h = e?.endCoordinates?.height ?? 0;
    const lift = Math.max(0, h - bottomPad);
    keyboardHeightRef.current = lift;
    snap(lift);                // put footer exactly at keyboard height
    setKeyboardVisible(true);
    ensureBottom();
  };

  const onHide = (e: any) => {
    // If we already drove the footer interactively, don’t animate it again
    if (skipNextKeyboardHideAnimRef.current) {
      snap(0);
      skipNextKeyboardHideAnimRef.current = false;
    } else {
      animateTo(0, e?.duration ?? 220);
    }
    setKeyboardVisible(false);
    keyboardHeightRef.current = 0;
    interactiveDismissRef.current = false;
    dismissDragAccumRef.current = 0;
  };

  // iOS fires "will"+"did"; Android generally fires "did" only — handle both.
  const willShow = Keyboard.addListener("keyboardWillShow", onShow);
  const didShow  = Keyboard.addListener("keyboardDidShow", onShow);
  const willHide = Keyboard.addListener("keyboardWillHide", onHide);
  const didHide  = Keyboard.addListener("keyboardDidHide", onHide);

  return () => {
    willShow.remove();
    didShow.remove();
    willHide.remove();
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

  // Media pick/save
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

  // Overlay tracking during scroll
  const clampX = (x: number, width: number) =>
    Math.max(12, Math.min(x, SCREEN_WIDTH - width - 12));
  const clampY = (y: number, height: number) =>
    Math.max(
      insets.top + 12,
      Math.min(y, SCREEN_HEIGHT - insets.bottom - 12 - height)
    );

const onScroll = (e: any) => {
  const y = e?.nativeEvent?.contentOffset?.y ?? 0;
  const prevY = lastScrollYRef.current || 0;
  const dy = y - prevY; // inverted list: scrolling UP => y increases

  wasAtHardBottomRef.current = y <= 2;

  if (keyboardVisible && isDraggingRef.current && keyboardHeightRef.current > 0) {
    // take baseline on first upward movement this drag
    if (!interactiveDismissRef.current && dy > 0) {
      interactiveDismissRef.current = true;
      dismissBaselineYRef.current = y;
      dismissDragAccumRef.current = 0;
    }

    if (interactiveDismissRef.current) {
      const delta = Math.max(0, y - dismissBaselineYRef.current);
      dismissDragAccumRef.current = delta;

      const remaining = Math.max(0, keyboardHeightRef.current - delta);
      // negative Y lifts footer; drive it exactly with finger
      footerTranslate.setValue(-remaining);

      if (remaining <= 0.5) {
        // Fully dismissed by finger. On Android we must still close keyboard.
        if (Platform.OS !== "ios") {
          skipNextKeyboardHideAnimRef.current = true;
          Keyboard.dismiss();
        }
        interactiveDismissRef.current = false;
      }
    }
  }

  lastScrollYRef.current = y;

  if (focusedMessage) {
    const ref = bubbleRefs.current[focusedMessage.uuid];
    ref?.measureInWindow?.((x, winY, w, h) => {
      setOverlayLayout({
        x: clampX(x, w),
        y: clampY(winY, h),
        width: w,
        height: h,
      });
    });
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
          <Text
            style={{ color: "#EFFFFF", fontWeight: "800", flexShrink: 1 }}
            numberOfLines={1}
          >
            {att.url.split("/").pop()}
          </Text>
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

    // Reactions compact cluster
    const seenByUser: Record<string, ReactionType> = {};
    item.reactions.forEach((r) => {
      if (!seenByUser[r.user_username]) seenByUser[r.user_username] = r;
    });
    const reacts = Object.values(seenByUser);
    const maxBadges = 3;
    const overflow = Math.max(0, reacts.length - (maxBadges - 1));

    // Parent preview
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

        {/* Sender header for group */}
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
              {/* reactions cluster */}
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

              {/* time chip */}
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

  const openOverlayFor = (message: MessageType) => {
    const ref = bubbleRefs.current[message.uuid];
    if (!ref) return;
    Haptics.selectionAsync();
    ref.measureInWindow?.((x, y, width, height) => {
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

  // Lane API helpers
  const apiUpdateLane = async (id: string, patch: Partial<Lane>) => {
    try {
      const res = await callApiRef.current(
        `messages/contexts/${conversationId}/${id}/`,
        "PATCH",
        patch
      );
      const updated: Lane = res.data ?? { id, ...(patch as any) };
      setLanes((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updated } : l))
      );
    } catch {
      setLanes((prev) =>
        prev.map((l) => (l.id === id ? ({ ...l, ...patch } as Lane) : l))
      );
    }
  };
  const apiDeleteLane = async (id: string) => {
    try {
      await callApiRef.current(
        `messages/contexts/${conversationId}/${id}/`,
        "DELETE"
      );
    } catch {}
    setLanes((p) => p.filter((l) => l.id !== id));
    if (activeLaneId === id) {
      const firstActive = lanes.find((l) => l.id !== id && !l.is_archived);
      setActiveLaneId(firstActive?.id ?? null);
    }
  };

  if (loading && !conversation) return null;

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={triggerClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.containerWithoutOverflow}>
          {/* backdrop to close */}
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

            {/* Header — identity + orbital toggle */}
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

              {/* Orbital toggle */}
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

            {/* Inline lanes rail for discoverability */}
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
                            onPress: () => setShowDetails(true),
                          },
                          {
                            text: item.is_archived ? "Unarchive" : "Archive",
                            onPress: async () => {
                              await apiUpdateLane(item.id, {
                                is_archived: !item.is_archived,
                              });
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
                                    onPress: () => apiDeleteLane(item.id),
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
                      >
                        {item.title}
                      </Text>
                    </Pressable>
                  )
                }
              />
            </View>

            {/* Messages */}
            <Animated.View
              style={{ flex: 1, transform: [{ translateY: footerTranslate }] }}
            >
              <FlatList
                ref={flatListRef}
                data={messages}
                inverted
                renderItem={renderMessageItem}
                keyExtractor={(m) => m.uuid}
                onEndReached={() => {
                  if (hasMore && !loadingOlder) fetchMessages(page);
                }}
                onEndReachedThreshold={0.6}
                maintainVisibleContentPosition={{
                  minIndexForVisible: 1,
                  autoscrollToTopThreshold: 20,
                }}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews
                ListFooterComponent={
                  loadingOlder ? (
                    <ActivityIndicator style={{ marginVertical: 16 }} />
                  ) : null
                }
                contentContainerStyle={{
                  paddingTop: 12,
                  paddingHorizontal: 18,
                  paddingBottom: Math.max(12, footerHeight),
                }}
                onScroll={onScroll}
  scrollEventThrottle={16}
  keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
  onScrollBeginDrag={() => {
    isDraggingRef.current = true;
    dismissBaselineYRef.current = lastScrollYRef.current || 0;
    dismissDragAccumRef.current = 0;
  }}
  onScrollEndDrag={() => {
    isDraggingRef.current = false;
    interactiveDismissRef.current = false;
  }}
  onMomentumScrollBegin={() => {
    isDraggingRef.current = false;
    interactiveDismissRef.current = false;
  }}
  onMomentumScrollEnd={() => {
    isDraggingRef.current = false;
    interactiveDismissRef.current = false;
  }}
              />
            </Animated.View>

            {/* Footer */}
            <Animated.View
              style={[
                styles.footer,
                { transform: [{ translateY: footerTranslate }] },
              ]}
            >
              <View
                onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
                style={[
                  styles.chatFooter,
                  { paddingBottom: Math.max(0, insets.bottom - 4) },
                ]}
              >
                {attachmentsToSend.length > 0 && (
                  <View style={styles.attachmentsPreview}>
                    {attachmentsToSend.map((file, idx) => (
                      <View key={idx} style={styles.attachmentPreview}>
                        <Image
                          source={{ uri: file.uri }}
                          style={styles.attachmentThumbnail}
                        />
                        <Pressable
                          style={styles.removeAttachmentBtn}
                          onPress={() =>
                            setAttachmentsToSend((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                        >
                          <MaterialIcons
                            name="cancel"
                            size={20}
                            color="#FF3B30"
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {conversation?.conversation_status === "blocked" ? (
                  <View style={{ marginHorizontal: 12, marginTop: 6 }}>
                    <GlassPressable
                      radius={12}
                      padH={12}
                      padV={12}
                      variant="solid"
                      haptics="none"
                    >
                      <Text style={styles.requestWarningText}>
                        You cannot send messages in this conversation.
                      </Text>
                    </GlassPressable>
                  </View>
                ) : conversation?.view_type === "request" ? (
                  <View style={styles.requestActions}>
                    <GlassPressable
                      style={{ flex: 1, marginRight: 8 }}
                      variant="solid"
                      radius={12}
                      padH={12}
                      padV={10}
                      onPress={async () => {
                        try {
                          await callApiRef.current(
                            `messages/request/${conversationId}/accept/`,
                            "POST"
                          );
                          const updated = await callApiRef.current(
                            `messages/get_conversation_details/${conversationId}/`
                          );
                          setConversation(updated.data);
                        } catch {}
                      }}
                      haptics="light"
                    >
                      <Text style={styles.requestBtnTextPrimary}>Accept</Text>
                    </GlassPressable>
                    <GlassPressable
                      style={{ flex: 1, marginRight: 8 }}
                      variant="ghost"
                      radius={12}
                      padH={12}
                      padV={10}
                      onPress={async () => {
                        try {
                          await callApiRef.current(
                            `messages/request/${conversationId}/reject/`,
                            "POST"
                          );
                          triggerClose();
                        } catch {}
                      }}
                      haptics="selection"
                    >
                      <Text style={styles.requestBtnTextSubtle}>Reject</Text>
                    </GlassPressable>
                    <GlassPressable
                      style={{ flex: 1 }}
                      variant="solid"
                      radius={12}
                      padH={12}
                      padV={10}
                      onPress={async () => {
                        try {
                          await callApiRef.current(
                            `messages/request/${conversationId}/block/`,
                            "POST"
                          );
                          triggerClose();
                        } catch {}
                      }}
                      haptics="medium"
                    >
                      <Text style={styles.requestBtnTextDanger}>Block</Text>
                    </GlassPressable>
                  </View>
                ) : (
                  <View style={styles.footerWrap}>
                    {replyingTo && (
                      <View style={styles.replyingBanner}>
                        <GlassPressable
                          radius={12}
                          padH={10}
                          padV={8}
                          variant="ghost"
                          haptics="none"
                          style={{ flex: 1 }}
                        >
                          <Text style={styles.replyingBannerText}>
                            Replying to {replyingTo.sender_username}: “
                            {replyingTo.text
                              ? replyingTo.text.length > 30
                                ? replyingTo.text.substring(0, 30) + "…"
                                : replyingTo.text
                              : "Attachment"}
                            …”
                          </Text>
                        </GlassPressable>
                        <Pressable
                          onPress={() => setReplyingTo(null)}
                          style={{ paddingHorizontal: 10, paddingVertical: 8 }}
                        >
                          <MaterialIcons name="close" size={18} color="#BBB" />
                        </Pressable>
                      </View>
                    )}

                    <View style={styles.writeContainer}>
                      <GlassPressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          Keyboard.dismiss();
                          setAttachVisible(true);
                        }}
                        radius={18}
                        padH={10}
                        padV={8}
                        variant="solid"
                        style={{ marginRight: 6, marginLeft: -6 }}
                      >
                        <MaterialIcons name="add" size={20} color="#EFFFFF" />
                      </GlassPressable>

                      <View style={[styles.inputShell, { flex: 1 }]}>
                        <GlassInput
                          ref={inputRef}
                          style={styles.textInput}
                          value={input}
                          onChangeText={setInput}
                          placeholder="Message…"
                          multiline
                          scrollEnabled={false}
                          textAlignVertical="top"
                          autoCorrect
                          autoCapitalize="sentences"
                          underlineColorAndroid="transparent"
                          onSubmitEditing={() => {
                            if (
                              input.trim().length > 0 ||
                              attachmentsToSend.length > 0
                            )
                              handleSend();
                          }}
                          accessibilityLabel="Message input"
                        />
                      </View>

                      {input.trim().length > 0 ||
                      attachmentsToSend.length > 0 ? (
                        <GlassPressable
                          onPress={handleSend}
                          radius={16}
                          padH={10}
                          padV={8}
                          variant="solid"
                          haptics="light"
                          style={{ marginLeft: 6 }}
                        >
                          <MaterialIcons
                            name="send"
                            size={18}
                            color="#EFFFFF"
                          />
                        </GlassPressable>
                      ) : (
                        <GlassPressable
                          onPress={() => setOrbitalOpen(true)}
                          radius={16}
                          padH={10}
                          padV={8}
                          variant="ghost"
                          haptics="selection"
                          style={{ marginLeft: 6 }}
                        >
                          <MaterialIcons
                            name="blur-on"
                            size={20}
                            color="#EFFFFF"
                          />
                        </GlassPressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          </Animated.View>

          {/* Orbital Lanes */}
          <OrbitalNav
            visible={orbitalOpen}
            lanes={lanes}
            activeLaneId={activeLaneId}
            accentColor={accentColor}
            onPick={(id) => {
              setActiveLaneId(id);
              persistPrefs({ activeLaneId: id });
            }}
            onClose={() => setOrbitalOpen(false)}
          />

          {/* Reaction overlay */}
          <ReactionOverlay
            visible={!!focusedMessage && !!overlayLayout}
            layout={overlayLayout}
            message={focusedMessage}
            theme={{
              bubbleOwn: accentColor,
              bubbleOther: (theme as ThemeDef).bubbleOther,
              textOnOwn: (theme as ThemeDef).textOnOwn,
              textOnOther: (theme as ThemeDef).textOnOther,
              backdropTintIntensity: (theme as ThemeDef).backdropTintIntensity,
            }}
            insets={insets}
            currentUsername={currentUsername}
            isOwn={focusedMessage ? isOwnMessage(focusedMessage) : false}
            onClose={() => {
              if (focusedMessage && msgScales[focusedMessage.uuid]) {
                Animated.spring(msgScales[focusedMessage.uuid], {
                  toValue: 1,
                  useNativeDriver: true,
                  stiffness: 360,
                  damping: 18,
                  mass: 0.4,
                }).start();
              }
              setFocusedMessage(null);
              setOverlayLayout(null);
            }}
            onReply={() => {
              if (focusedMessage) setReplyingTo(focusedMessage);
              setFocusedMessage(null);
              setOverlayLayout(null);
            }}
            onCopy={() => {
              if (focusedMessage?.text)
                Clipboard.setStringAsync(focusedMessage.text);
              setFocusedMessage(null);
              setOverlayLayout(null);
            }}
            onUnsend={() => {
              if (focusedMessage) handleUnsend(focusedMessage);
              setFocusedMessage(null);
              setOverlayLayout(null);
            }}
            onToggleReaction={(type) => {
              if (focusedMessage) handleToggleReaction(focusedMessage, type);
              setFocusedMessage(null);
              setOverlayLayout(null);
            }}
          />

          {/* Attach menu */}
          <AttachMenu
            visible={attachVisible}
            onDismiss={() => setAttachVisible(false)}
            onPickMedia={handleMediaPick}
            onSetBackground={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: false,
              });
              if (!result.canceled && result.assets[0]?.uri) {
                setBgImage(result.assets[0].uri);
                persistPrefs({ bgImage: result.assets[0].uri });
              }
            }}
            onCycleTheme={() => {
              const next = (themeIdx + 1) % THEMES.length;
              setThemeIdx(next);
              const nextAccent = THEMES[next].accent;
              setAccentColor(nextAccent);
              persistPrefs({ themeIdx: next, accentColor: nextAccent });
            }}
            onStartPoll={() => Alert.alert("Poll", "Coming soon")}
            onStartVoice={() => Alert.alert("Voice note", "Coming soon")}
            onShareLocation={() => Alert.alert("Location", "Coming soon")}
            onSchedule={() => Alert.alert("Schedule message", "Coming soon")}
            onCamera={() => Alert.alert("Camera", "Coming soon")}
            onDocument={() => Alert.alert("Document", "Coming soon")}
          />

          {/* Details sheet */}
          {showSettings && (
            <SettingsOverlay
              visible={showSettings}
              onClose={() => setShowSettings(false)}
              version={"1.0.0"}
              themes={THEMES as any}
              currentThemeId={THEMES[themeIdx].id}
              accentColor={accentColor}
              onChangeTheme={(id) => {
                const idx = Math.max(
                  0,
                  THEMES.findIndex((t) => t.id === id)
                );
                setThemeIdx(idx);
                const nextAccent = THEMES[idx].accent;
                setAccentColor(nextAccent);
                persistPrefs({ themeIdx: idx, accentColor: nextAccent });
              }}
              backgroundImage={bgImage}
              onSetBackgroundImage={(uri) => {
                setBgImage(uri || null);
                persistPrefs({ bgImage: uri || null });
              }}
              onChangeAccent={(hex) => {
                setAccentColor(hex);
                persistPrefs({ accentColor: hex });
              }}
              onOpenLicenses={() => {
                /* nav to licenses */
              }}
              onOpenTerms={() => {
                /* open terms */
              }}
              onOpenPrivacy={() => {
                /* open privacy */
              }}
              onContactSupport={() => {
                /* start support flow */
              }}
              onSignOut={() => {
                /* your signout */
              }}
              onDeleteAccount={() => {
                /* your delete flow */
              }}
            />
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// ————————————————————————————————————————————
// Styles
// ————————————————————————————————————————————
const styles = StyleSheet.create({
  containerWithoutOverflow: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },

  identityBar: {
    flex: 1,
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
  },
  avatarGroupWide: { width: 64, height: 32, marginLeft: 8 },
  avatarWrapper: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  stackedAvatar: { width: 28, height: 28 },
  identityTextCol: { flex: 1, marginLeft: 28 },
  chatHeaderName: {
    color: "#EFFFFF",
    fontSize: 14.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  chatHeaderUsername: {
    color: "#b9d2d9",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 6,
  },

  lanePill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  lanePillActive: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  lanePillInactive: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  laneText: { fontWeight: "900" },
  laneTextActive: { color: "#EFFFFF" },
  laneTextInactive: { color: "#d7e7ea" },

  bubbleWrap: { maxWidth: BUBBLE_MAX_W },
  messageRowOwn: { alignSelf: "flex-end" },
  messageRowOther: { alignSelf: "flex-start" },

  reactCluster: {
    position: "absolute",
    top: -14,
    flexDirection: "row",
    zIndex: 2,
  },
  reactClusterOwn: { right: 8 },
  reactClusterOther: { left: 8 },
  reactChip: {
    marginHorizontal: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
  },
  reactionPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  emojiText: { fontSize: 36, lineHeight: 42 },
  messageText: { fontSize: 16, lineHeight: 22, fontWeight: "600" },

  timeChip: {
    position: "absolute",
    left: -48,
    top: "50%",
    marginTop: -10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 8,
  },
  timeChipText: { color: "#EFFFFF", fontSize: 11, fontWeight: "700" },

  mediaBubbleContainer: { marginTop: 8, maxWidth: SCREEN_WIDTH * 0.8 },
  mediaBubbleOwn: { alignSelf: "flex-end" },
  mediaBubbleOther: { alignSelf: "flex-start" },
  largeMediaFull: {
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_WIDTH * 0.75,
    borderRadius: 14,
    marginTop: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  branchLine: {
    width: 2,
    height: 16,
    borderRadius: 1,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  parentPreviewText: {
    color: "#d7e7ea",
    fontSize: 12,
    maxWidth: SCREEN_WIDTH * 0.7,
  },
  dateSeparatorText: { color: "#d7e7ea", fontWeight: "800", fontSize: 12 },

  chatFooter: { paddingHorizontal: 10, paddingTop: 8 },
  attachmentsPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  attachmentPreview: {
    marginRight: 8,
    marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  attachmentThumbnail: { width: 68, height: 68 },
  removeAttachmentBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    padding: 2,
  },

  requestWarningText: { color: "#fff", fontWeight: "800", textAlign: "center" },
  requestActions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    marginTop: 6,
  },
  requestBtnTextPrimary: {
    color: "#001410",
    fontWeight: "900",
    textAlign: "center",
  },
  requestBtnTextSubtle: {
    color: "#cfe5e9",
    fontWeight: "900",
    textAlign: "center",
  },
  requestBtnTextDanger: {
    color: "#1a0000",
    fontWeight: "900",
    textAlign: "center",
  },

  footer: { minHeight: 44, overflow: "visible" },
  footerWrap: { paddingHorizontal: 0, paddingVertical: 6 },
  replyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 6,
    marginBottom: 8,
  },
  replyingBannerText: { color: "#cfe5e9", fontWeight: "700" },

  writeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  inputShell: {
    minHeight: 40,
    maxHeight: 160,
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  textInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 0,
    paddingHorizontal: 15,
    fontSize: 16,
    lineHeight: 20,
    color: "#EFFFFF",
    includeFontPadding: false,
    backgroundColor: "transparent",
    textAlignVertical: "top",
  },

  // Orbital
  orbitPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  orbitPillActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.24)",
  },
  orbitPillInactive: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.16)",
  },
  orbitText: { fontWeight: "900" },
  orbitTextActive: { color: "#EFFFFF" },
  orbitTextInactive: { color: "#d7e7ea" },
});
