// app/(tabs)/messages/ChatOverlay.tsx
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
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Rect,
  ClipPath,
  Path,
} from "react-native-svg";
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

// Project hooks
import useWebSocket from "@/hooks/useWebSocket";
import useApi from "@/hooks/useApi";
import useAuth from "@/hooks/useAuth";
import SettingsOverlay from "./SettingsOverlay";
import AttachMenu from "./AttachMenu";
import ReactionOverlay from "./ReactionOverlay";

// ————————————————————————————————————————————
// Dimensions + constants
// ————————————————————————————————————————————
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BUBBLE_MAX_W = Math.floor(SCREEN_WIDTH * 0.78);
const EXTRA_FOOTER_SPACING = 10; // lift footer a bit above bottom & keyboard
const EXTRA_KEYBOARD_CLEARANCE = 80; // extra lift so footer clears keyboard
const KBD_EASING = Easing.bezier(0.25, 0.1, 0.25, 1); // closer to system ease-in-out
const ANDROID_FALLBACK_DURATION = 140; // snappy default when Android doesn't report duration

// ————————————————————————————————————————————
// Types
// ————————————————————————————————————————————
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
  emoji?: string; // MaterialIcons name or actual emoji
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

// ————————————————————————————————————————————
// Helpers
// ————————————————————————————————————————————
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

// —— Icon / Emoji helper to avoid invalid Material icon warnings ——
const isValidMaterialIconName = (s?: string) =>
  !!s && /^[a-z0-9_\-]+$/i.test(s);
const isEmoji = (s?: string) => !!s && /\p{Extended_Pictographic}/u.test(s);
function IconOrEmoji({
  name,
  size,
  color,
  style,
}: {
  name?: string;
  size: number;
  color: string;
  style?: any;
}) {
  if (isValidMaterialIconName(name || "")) {
    return (
      <MaterialIcons
        name={name as any}
        size={size}
        color={color}
        style={style}
      />
    );
  }
  if (isEmoji(name)) {
    return <Text style={[{ fontSize: size, color }, style]}>{name}</Text>;
  }
  return (
    <MaterialIcons name="view-agenda" size={size} color={color} style={style} />
  );
}

// ————————————————————————————————————————————
// Goo system (light-weight metaball bridges)
// ————————————————————————————————————————————
type GooNode = {
  id: string;
  ref: any;
  group: string;
  active: boolean;
  center: { x: number; y: number };
  radius: number;
};

const GooContext = React.createContext<{
  nodes: Record<string, GooNode>;
  register: (id: string, ref: any, group: string) => void;
  unregister: (id: string) => void;
  update: (id: string, patch: Partial<GooNode>) => void;
} | null>(null);

function GooProvider({ children }: { children: React.ReactNode }) {
  const [nodes, setNodes] = useState<Record<string, GooNode>>({});

  // Keep a ref so our measuring interval doesn't depend on `nodes`
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const register = useCallback((id: string, ref: any, group: string) => {
    setNodes((n) => {
      const existing = n[id];
      if (existing) {
        // Update only if ref/group changed
        if (existing.ref === ref && existing.group === group) return n;
        return { ...n, [id]: { ...existing, ref, group } };
      }
      return {
        ...n,
        [id]: {
          id,
          ref,
          group,
          active: false,
          center: { x: 0, y: 0 },
          radius: 20,
        },
      };
    });
  }, []);

  const unregister = useCallback((id: string) => {
    setNodes((n) => {
      if (!n[id]) return n;
      const next = { ...n };
      delete next[id];
      return next;
    });
  }, []);

  const update = useCallback((id: string, patch: Partial<GooNode>) => {
    setNodes((n) => {
      const ex = n[id];
      if (!ex) return n;
      const next = { ...ex, ...patch };
      const same =
        next.active === ex.active &&
        next.group === ex.group &&
        next.ref === ex.ref &&
        next.radius === ex.radius &&
        next.center.x === ex.center.x &&
        next.center.y === ex.center.y;
      if (same) return n;
      return { ...n, [id]: next };
    });
  }, []);

  // Cheap measurement refresher — run once; only update when values change
  useEffect(() => {
    const tick = setInterval(() => {
      const snapshot = nodesRef.current;
      Object.values(snapshot).forEach((node) => {
        node?.ref?.measureInWindow?.(
          (x: number, y: number, w: number, h: number) => {
            const center = { x: x + w / 2, y: y + h / 2 };
            const radius = Math.max(18, Math.min(w, h) / 2);
            setNodes((n) => {
              const cur = n[node.id];
              if (!cur) return n;
              const sameCenter =
                Math.abs(cur.center.x - center.x) < 0.5 &&
                Math.abs(cur.center.y - center.y) < 0.5;
              const sameRadius = Math.abs((cur.radius ?? 0) - radius) < 0.5;
              if (sameCenter && sameRadius) return n;
              return {
                ...n,
                [node.id]: { ...cur, center, radius },
              };
            });
          }
        );
      });
    }, 120);
    return () => clearInterval(tick);
  }, []);

  return (
    <GooContext.Provider value={{ nodes, register, unregister, update }}>
      {children}
    </GooContext.Provider>
  );
}

function metaballPath(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
  handleLenRate = 2.4,
  v = 0.5,
  maxDistance = 180
) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  if (d > maxDistance || d <= Math.abs(r1 - r2) || d === 0) return "";

  const u1 = Math.acos((r1 - r2) / d);
  const u2 = Math.acos((r1 + r2) / d);
  const angleBetween = Math.atan2(y2 - y1, x2 - x1);

  const angle1 = angleBetween + u1 + (u2 - u1) * v;
  const angle2 = angleBetween - u1 - (u2 - u1) * v + Math.PI;

  const p1a = { x: x1 + r1 * Math.cos(angle1), y: y1 + r1 * Math.sin(angle1) };
  const p1b = { x: x1 + r1 * Math.cos(angle2), y: y1 + r1 * Math.sin(angle2) };
  const p2a = { x: x2 + r2 * Math.cos(angle1), y: y2 + r2 * Math.sin(angle1) };
  const p2b = { x: x2 + r2 * Math.cos(angle2), y: y2 + r2 * Math.sin(angle2) };

  const totalRadius = r1 + r2;
  const d2 = Math.min(
    v * handleLenRate,
    Math.hypot(p1a.x - p2a.x, p1a.y - p2a.y) / totalRadius
  );

  const h1 = d2 * r1;
  const h2 = d2 * r2;

  const c1a = {
    x: p1a.x + h1 * Math.sin(angle1),
    y: p1a.y - h1 * Math.cos(angle1),
  };
  const c2a = {
    x: p2a.x + h2 * Math.sin(angle1),
    y: p2a.y - h2 * Math.cos(angle1),
  };
  const c1b = {
    x: p1b.x - h1 * Math.sin(angle2),
    y: p1b.y + h1 * Math.cos(angle2),
  };
  const c2b = {
    x: p2b.x - h2 * Math.sin(angle2),
    y: p2b.y + h2 * Math.cos(angle2),
  };

  return `M ${p1a.x} ${p1a.y}
          C ${c1a.x} ${c1a.y} ${c2a.x} ${c2a.y} ${p2a.x} ${p2a.y}
          A ${r2} ${r2} 0 0 1 ${p2b.x} ${p2b.y}
          C ${c2b.x} ${c2b.y} ${c1b.x} ${c1b.y} ${p1b.x} ${p1b.y}
          A ${r1} ${r1} 0 0 1 ${p1a.x} ${p1a.y} Z`;
}

function GooSurface({
  nodes,
  accentColor = "#ffffff",
}: {
  nodes: Record<string, GooNode>;
  accentColor?: string;
}) {
  const entries = Object.values(nodes);
  if (entries.length < 2) return null;

  const pairs: Array<[GooNode, GooNode]> = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (a.group !== b.group) continue;
      const d = Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y);
      if ((a.active || b.active) && d <= 180) pairs.push([a, b]);
    }
  }
  if (!pairs.length) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="__gooGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={accentColor} stopOpacity={0.2} />
            <Stop offset="100%" stopColor={accentColor} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {pairs.map(([a, b], idx) => {
          const d = metaballPath(
            a.center.x,
            a.center.y,
            a.radius,
            b.center.x,
            b.center.y,
            b.radius,
            2.2,
            0.5,
            180
          );
          if (!d) return null;
          return (
            <React.Fragment key={`goo-${idx}`}>
              <Circle
                cx={a.center.x}
                cy={a.center.y}
                r={a.radius}
                fill="url(#__gooGlow)"
              />
              <Circle
                cx={b.center.x}
                cy={b.center.y}
                r={b.radius}
                fill="url(#__gooGlow)"
              />
              <Path d={d} fill={accentColor} opacity={0.06} />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// wrap so it reads context inside Provider (prevents stale reads)
function GooLayer({ accentColor }: { accentColor: string }) {
  const goo = React.useContext(GooContext);
  return (
    <GooSurface
      nodes={(goo?.nodes as Record<string, GooNode>) || {}}
      accentColor={accentColor}
    />
  );
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
  gooGroup = "default",
  rigid = false,
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
  gooGroup?: string;
  rigid?: boolean;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const scale = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03], // pop on press
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
    outputRange: [0.88, 1, 1.12],
    extrapolate: "clamp",
  });
  const stretchY = dragY.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [0.88, 1, 1.12],
    extrapolate: "clamp",
  });
  // Directional pull (anchor opposite edge)
  const edgePullX = dragX.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [-16, 0, 16],
    extrapolate: "clamp",
  });
  const edgePullY = dragY.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [-12, 0, 12],
    extrapolate: "clamp",
  });

  // Torch spotlight
  const glowX = useRef(new Animated.Value(0)).current;
  const glowY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const HL_R = 90;

  // Measure container to clamp the moving highlight within rounded edges
  const sizeRef = useRef({ w: 0, h: 0 });
  const onLayoutContainer = useCallback((e: any) => {
    const { width, height } = e?.nativeEvent?.layout || {};
    if (typeof width === "number" && typeof height === "number") {
      sizeRef.current = { w: width, h: height };
    }
  }, []);

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
  const clampHL = useCallback((x: number, y: number) => {
    const w = sizeRef.current.w || 1;
    const h = sizeRef.current.h || 1;
    const minX = HL_R;
    const maxX = Math.max(HL_R, w - HL_R);
    const minY = HL_R;
    const maxY = Math.max(HL_R, h - HL_R);
    return { cx: clamp(x, minX, maxX), cy: clamp(y, minY, maxY) };
  }, []);

  const highlightLeft = Animated.subtract(glowX, HL_R);
  const highlightTop = Animated.subtract(glowY, HL_R);
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

  // Goo registration
  const selfIdRef = useRef(`gp-${Math.random().toString(36).slice(2)}`);
  const wrapRef = useRef<View | null>(null);
  const goo = React.useContext(GooContext);
  useEffect(() => {
    if (!goo) return;
    const id = selfIdRef.current;
    goo.register(id, wrapRef.current, gooGroup);
    return () => goo.unregister(id);
  }, [gooGroup, goo?.register, goo?.unregister]);

  return (
    <Animated.View
      ref={wrapRef as any}
      style={[
        {
          borderRadius: radius,
          transform: [
            ...(rigid
              ? []
              : [
                  { translateX: edgePullX },
                  { translateY: edgePullY },
                  { scaleX: stretchX },
                  { scaleY: stretchY },
                ]),
            { scale },
          ],
          opacity,
          // Fix dark square artifacts during alpha compositing
          backfaceVisibility: "hidden",
          renderToHardwareTextureAndroid: true,
          needsOffscreenAlphaCompositing: true,
        } as any,
        style,
      ]}
    >
      <PanGestureHandler
        enabled={elastic && !rigid}
        activeOffsetY={[-10, 10]}
        failOffsetX={[-8, 8]}
        onGestureEvent={(e) => {
          if (rigid || !elastic) return;
          const ne: any = (e as any).nativeEvent || {};
          dragX.setValue(ne.translationX || 0);
          dragY.setValue(ne.translationY || 0);
          const { cx, cy } = clampHL(ne.x || 0, ne.y || 0);
          glowX.setValue(cx);
          glowY.setValue(cy);
        }}
        onHandlerStateChange={(e) => {
          if (rigid || !elastic) return; // no elastic state changes for rigid/disabled
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
              if (!rigid && typeof locationX === "number") {
                const { cx, cy } = clampHL(locationX, locationY);
                glowX.setValue(cx);
                glowY.setValue(cy);
              }
              if (!rigid) showGlow(true);
              if (goo) goo.update(selfIdRef.current, { active: true });
              Animated.spring(press, {
                toValue: 1,
                useNativeDriver: true,
                stiffness: 320,
                damping: 20,
                mass: 0.25,
              }).start();
            }}
            onPressOut={() => {
              if (!rigid) showGlow(false);
              if (goo) goo.update(selfIdRef.current, { active: false });
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
            onLayout={onLayoutContainer}
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

                {/* Edge lighting & inner shadow to simulate thickness */}
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                  <Defs>
                    <ClipPath id="__clipGlassBtn">
                      <Rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        rx={radius}
                        ry={radius}
                      />
                    </ClipPath>
                    <RadialGradient
                      id="__glassInnerShadow"
                      cx="50%"
                      cy="50%"
                      r="60%"
                    >
                      <Stop offset="60%" stopColor="#000000" stopOpacity={0} />
                      <Stop
                        offset="100%"
                        stopColor="#000000"
                        stopOpacity={0.22}
                      />
                    </RadialGradient>
                  </Defs>
                  <Rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    clipPath="url(#__clipGlassBtn)"
                    fill="url(#__glassInnerShadow)"
                  />
                </Svg>

                {/* Specular hotspot that follows touch (disabled for rigid buttons) */}
                {!rigid && (
                  <Animated.View
                    pointerEvents="none"
                    style={[StyleSheet.absoluteFill, { opacity: glowOpacity }]}
                  >
                    <Animated.View
                      style={{
                        position: "absolute",
                        width: HL_R * 2,
                        height: HL_R * 2,
                        transform: [
                          { translateX: highlightLeft as unknown as any },
                          { translateY: highlightTop as unknown as any },
                          {
                            scale: press.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.15],
                            }),
                          },
                        ],
                      }}
                    >
                      <Svg width="100%" height="100%">
                        <Defs>
                          <RadialGradient
                            id="__specHotspot"
                            cx="50%"
                            cy="50%"
                            r="50%"
                          >
                            <Stop
                              offset="0%"
                              stopColor="#ffffff"
                              stopOpacity={0.38}
                            />
                            <Stop
                              offset="45%"
                              stopColor="#ffffff"
                              stopOpacity={0.16}
                            />
                            <Stop
                              offset="100%"
                              stopColor="#ffffff"
                              stopOpacity={0}
                            />
                          </RadialGradient>
                        </Defs>
                        <Rect
                          x="0"
                          y="0"
                          width="100%"
                          height="100%"
                          fill="url(#__specHotspot)"
                        />
                      </Svg>
                    </Animated.View>
                  </Animated.View>
                )}

                {/* Soft rim pulse on press */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: press.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.28],
                      }),
                      transform: [
                        {
                          scale: press.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.98, 1.06],
                          }),
                        },
                      ],
                      borderRadius: radius,
                    } as any,
                  ]}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      ...StyleSheet.absoluteFillObject,
                      borderRadius: radius,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: "rgba(255,255,255,0.30)",
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
          renderToHardwareTextureAndroid: true,
          needsOffscreenAlphaCompositing: true,
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
      <BlurView
        intensity={own ? 10 : 6}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
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
      {/* subtle edge lighting */}
      <LinearGradient
        colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0.00)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* inner shadow to imply thickness */}
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="__bubbleInnerShadow" cx="50%" cy="50%" r="65%">
            <Stop offset="70%" stopColor="#000000" stopOpacity={0} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0.2} />
          </RadialGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#__bubbleInnerShadow)"
        />
      </Svg>
      {/* crisp rim */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: own
              ? "rgba(255,255,255,0.22)"
              : "rgba(255,255,255,0.14)",
            borderRadius: 18,
          },
        ]}
      />
      <View
        style={{
          paddingHorizontal: emojiOnly ? 0 : 14,
          paddingVertical: emojiOnly ? 0 : 10,
          maxWidth: BUBBLE_MAX_W,
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

  // if (!visible) return null;

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
          const active = activeLaneId === lane.id;
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
                  active ? styles.orbitPillActive : styles.orbitPillInactive,
                ]}
              >
                <IconOrEmoji
                  name={lane.emoji as any}
                  size={16}
                  color={active ? "#EFFFFF" : "#d7e7ea"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.orbitText,
                    active ? styles.orbitTextActive : styles.orbitTextInactive,
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

  // Keyboard progress (in pixels) – 0 when closed, >0 as it opens
  const kbdLift = useRef(new Animated.Value(0)).current;

  // Keep your “a bit higher” spacing OUTSIDE the keyboard animation so the
  // footer moves the exact same distance as the keyboard over the same time.
  const footerExtraOffset = useRef(
    new Animated.Value(-EXTRA_FOOTER_SPACING)
  ).current;

  // Final Y transform for the footer
  const footerTranslateY = Animated.add(
    Animated.multiply(kbdLift, -1),
    footerExtraOffset
  );

  const [input, setInput] = useState("");
  const inputRef = useRef<TextInput>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const wasAtHardBottomRef = useRef(true);

  const keyboardHeightRef = useRef(0);

  const controlRef = useRef<"idle" | "keyboard" | "scroll" | "settle">("idle");

  // state
  const [bottomGap, setBottomGap] = useState(15);
  const atBottomRef = useRef(true);
  const lastScrollYRef = useRef(0);

  // single computation
  const computeBottomGap = useCallback(
    (kbd: number) => {
      const base = 8;
      const closedTarget = atBottomRef.current
        ? Math.max(base, Math.max(0, footerHeight - 2)) // no EXTRA_FOOTER_SPACING here
        : base;
      return kbd > 0
        ? Math.max(base, kbd + EXTRA_KEYBOARD_CLEARANCE)
        : closedTarget;
    },
    [footerHeight]
  );

  // also recompute when footer height changes (keyboard closed)
  useEffect(() => {
    if (!keyboardVisible) setBottomGap(computeBottomGap(0));
  }, [footerHeight, keyboardVisible, computeBottomGap]);

  // seed once
  useEffect(() => {
    setBottomGap(computeBottomGap(keyboardHeightRef.current || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // onScroll with hysteresis + fixed braces
  const onScroll = (e?: any) => {
    try {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;
      const wasAtBottom = atBottomRef.current;
      // hysteresis: widen the “sticky” band
      const nowAtBottom = wasAtBottom ? y <= 12 : y <= 4;
      wasAtHardBottomRef.current = nowAtBottom;

      if (wasAtBottom !== nowAtBottom) {
        atBottomRef.current = nowAtBottom;
        if (!keyboardVisible) setBottomGap(computeBottomGap(0));
      }

      const dy = y - (lastScrollYRef.current || 0);
      lastScrollYRef.current = y;

      if (Platform.OS !== "ios" && keyboardVisible && dy > 2) {
        Keyboard.dismiss();
      }
    } catch {}
  };

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
            setBgImage(serverBg ?? null);
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

  // Keyboard + footer sync (match keyboard's timeline exactly)
  useEffect(() => {
    const bottomPad = Math.max(0, insets.bottom - 4);

    const animateKbd = (from: number, to: number, duration?: number) => {
      kbdLift.stopAnimation();
      kbdLift.setValue(from); // start exactly where the keyboard starts

      // Shrink/grow the messages container in lockstep with the keyboard
      setBottomGap(computeBottomGap(to));
      // When keyboard opens, remove resting pad; when it closes, restore if we're at bottom.

      Animated.timing(kbdLift, {
        toValue: to,
        duration: Math.max(1, duration ?? ANDROID_FALLBACK_DURATION),
        easing: KBD_EASING, // iOS keyboard curve equivalent
        useNativeDriver: true,
      }).start(() => {
        keyboardHeightRef.current = to;
        setKeyboardVisible(to > 1);
        controlRef.current = to > 0 ? "keyboard" : "idle";
      });
    };

    if (Platform.OS === "ios") {
      // Will-change frame gives us both start & end frames + duration
      const sub = Keyboard.addListener("keyboardWillChangeFrame", (e: any) => {
        const startY = e?.startCoordinates?.screenY ?? SCREEN_HEIGHT;
        const endY = e?.endCoordinates?.screenY ?? SCREEN_HEIGHT;
        const startLift = Math.max(0, SCREEN_HEIGHT - startY - bottomPad);
        const endLift = Math.max(0, SCREEN_HEIGHT - endY - bottomPad);
        const dur = e?.duration ?? 160;
        animateKbd(startLift, endLift, dur);
      });
      return () => sub.remove();
    }

    // ANDROID — approximate with will/did events
    const willShow = (e: any) => {
      const endH = e?.endCoordinates?.height ?? 0;
      const endLift = Math.max(0, endH - bottomPad);
      const dur = e?.duration ?? ANDROID_FALLBACK_DURATION;
      const startLift = keyboardHeightRef.current || 0;
      animateKbd(startLift, endLift, dur);
    };
    const didShow = (e: any) => {
      if (controlRef.current === "keyboard") return;
      const endH = e?.endCoordinates?.height ?? 0;
      const endLift = Math.max(0, endH - bottomPad);
      animateKbd(
        keyboardHeightRef.current || 0,
        endLift,
        ANDROID_FALLBACK_DURATION
      );
    };
    const willHide = (e: any) => {
      const start = keyboardHeightRef.current || 0;
      const dur = e?.duration ?? ANDROID_FALLBACK_DURATION;
      animateKbd(start, 0, dur);
    };
    const didHide = () => {
      animateKbd(keyboardHeightRef.current || 0, 0, ANDROID_FALLBACK_DURATION);
    };

    const s1 = Keyboard.addListener("keyboardWillShow", willShow as any);
    const s2 = Keyboard.addListener("keyboardDidShow", didShow);
    const s3 = Keyboard.addListener("keyboardWillHide", willHide as any);
    const s4 = Keyboard.addListener("keyboardDidHide", didHide);
    return () => {
      s1.remove();
      s2.remove();
      s3.remove();
      s4.remove();
    };
  }, [insets.bottom, kbdLift]);

  // Participants helpers
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

  // Overlay opener
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
          <Text style={{ color: "#EFFFFF" }}>Attachment</Text>
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
    const plainText = (item.text || "").replace(/<\/?[^>]+(>|$)/g, "").trim();
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
    const squishX = panX.interpolate({
      inputRange: [-120, 0, 120],
      outputRange: [0.98, 1, 1.06],
      extrapolate: "clamp",
    });
    const squishY = panX.interpolate({
      inputRange: [-120, 0, 120],
      outputRange: [1.06, 1, 0.98],
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
                { scaleX: squishX },
                { scaleY: squishY },
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

              {isEmojiOnlyMessage(item.text || "") ? (
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

  if (loading && !conversation) return null;

  const reactionTheme = {
    bubbleOwn: accentColor,
    bubbleOther: theme.bubbleOther,
    textOnOwn: theme.textOnOwn,
    textOnOther: theme.textOnOther,
    backdropTintIntensity: (theme as any).backdropTintIntensity ?? 40,
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={triggerClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GooProvider>
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
                  gooGroup="header"
                  onPress={triggerClose}
                  radius={16}
                  padH={10}
                  padV={9}
                  style={{ marginLeft: 10, alignSelf: "center" }}
                  haptics="light"
                >
                  <MaterialIcons
                    name="chevron-left"
                    size={24}
                    color="#EFFFFF"
                  />
                </GlassPressable>

                <GlassPressable
                  gooGroup="header"
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
                  gooGroup="header"
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
                  horizontal
                  data={[
                    ...lanes.filter((l) => !l.is_archived),
                    { id: "__new__", title: "New", emoji: "add" } as any,
                  ]}
                  keyExtractor={(item: any) => item.id}
                  contentContainerStyle={{ paddingHorizontal: 10, gap: 8 }}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }: { item: any }) => {
                    if (item.id === "__new__") {
                      return (
                        <GlassPressable
                          radius={14}
                          padH={10}
                          padV={6}
                          variant="ghost"
                          onPress={() => setOrbitalOpen(true)}
                          haptics="selection"
                          gooGroup="header"
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <MaterialIcons
                              name="add"
                              size={16}
                              color="#d7e7ea"
                              style={{ marginRight: 6, opacity: 0.95 }}
                            />
                            <Text style={styles.lanePillTextInactive}>
                              New Lane
                            </Text>
                          </View>
                        </GlassPressable>
                      );
                    }
                    const active = activeLaneId === item.id;
                    return (
                      <GlassPressable
                        radius={14}
                        padH={10}
                        padV={6}
                        variant={active ? "solid" : "ghost"}
                        onPress={() => {
                          setActiveLaneId(item.id);
                          persistPrefs({ activeLaneId: item.id });
                        }}
                        haptics="selection"
                        gooGroup="header"
                      >
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <IconOrEmoji
                            name={item.emoji as any}
                            size={16}
                            color={active ? "#EFFFFF" : "#d7e7ea"}
                            style={{ marginRight: 6, opacity: 0.95 }}
                          />
                          <Text
                            style={
                              active
                                ? styles.lanePillTextActive
                                : styles.lanePillTextInactive
                            }
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                        </View>
                      </GlassPressable>
                    );
                  }}
                />
              </View>

              {/* Messages */}
              <Animated.View style={{ flex: 1 }}>
                {loading ? (
                  <View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ActivityIndicator color={accentColor} />
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(m) => m.uuid}
                    renderItem={renderMessageItem}
                    onEndReachedThreshold={0.2}
                    onEndReached={() => {
                      if (!loadingOlder && hasMore) fetchMessages(page);
                    }}
                    ListFooterComponent={
                      loadingOlder ? (
                        <View style={{ paddingVertical: 12 }}>
                          <ActivityIndicator color={accentColor} />
                        </View>
                      ) : null
                    }
                    style={{ flex: 1 }}
                    inverted
                    automaticallyAdjustKeyboardInsets={false}
                    contentInsetAdjustmentBehavior="never"
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                      paddingHorizontal: 12,
                      paddingTop: bottomGap, // <-- single source of truth for visual bottom space
                      paddingBottom: 8, // small cushion for top edge (visual top)
                    }}
                    scrollIndicatorInsets={{
                      bottom: Math.max(8, footerHeight + insets.bottom),
                    }}
                    keyboardDismissMode={
                      Platform.OS === "ios" ? "interactive" : "on-drag"
                    }
                  />
                )}
              </Animated.View>

              {/* Footer composer */}
              <Animated.View
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  transform: [{ translateY: footerTranslateY }],
                }}
                // onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
                onLayout={(e) =>
                  setFooterHeight(Math.round(e.nativeEvent.layout.height))
                }
              >
                {replyingTo && (
                  <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
                    <GlassPressable
                      radius={12}
                      padH={10}
                      padV={6}
                      variant="ghost"
                      haptics="none"
                      onLongPress={() => setReplyingTo(null)}
                    >
                      <Text style={{ color: "#cfe6eb" }}>
                        Replying to @{replyingTo.sender_username} — tap &amp;
                        hold to cancel
                      </Text>
                    </GlassPressable>
                  </View>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    paddingTop: 20,
                    paddingBottom: 10,
                    paddingHorizontal: 15,
                    gap: 8,
                    boxSizing: "border-box",
                  }}
                >
                  <GlassPressable
                    radius={16}
                    padH={10}
                    padV={9}
                    onPress={() => setAttachVisible(true)}
                    haptics="selection"
                  >
                    <MaterialIcons name="add" size={20} color="#EFFFFF" />
                  </GlassPressable>

                  <GlassInput
                    ref={inputRef}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Message"
                    maxLines={8}
                    style={{ color: "#EAFBFF", fontSize: 16 }}
                    containerStyle={{ flex: 1 }}
                    onSubmitEditing={handleSend}
                  />

                  <GlassPressable
                    radius={16}
                    padH={12}
                    padV={10}
                    onPress={handleSend}
                    haptics="light"
                    variant="solid"
                  >
                    <MaterialIcons name="send" size={20} color="#EFFFFF" />
                  </GlassPressable>
                </View>
              </Animated.View>

              {/* Overlays */}
              <ReactionOverlay
                visible={!!focusedMessage}
                layout={overlayLayout}
                message={focusedMessage}
                theme={reactionTheme}
                insets={insets}
                currentUsername={currentUsername}
                isOwn={
                  focusedMessage
                    ? focusedMessage.sender_username === currentUsername
                    : false
                }
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
                  if (focusedMessage)
                    handleToggleReaction(focusedMessage, type);
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

              {/* Goo bridges layer (under overlays) */}
              <GooLayer accentColor={accentColor} />
            </Animated.View>
          </View>

          {/* External overlays */}
          <SettingsOverlay
            visible={showSettings}
            onClose={() => setShowSettings(false)}
            version=""
            themes={THEMES}
            currentThemeId={THEMES[themeIdx].id}
            accentColor={accentColor}
            backgroundImage={bgImage}
            onSetBackgroundImage={(uri) => {
              setBgImage(uri);
              persistPrefs({ bgImage: uri });
            }}
            onChangeTheme={(id) => {
              const idx = THEMES.findIndex((t) => t.id === id);
              const nextIdx = idx >= 0 ? idx : 0;
              setThemeIdx(nextIdx);
              const nextAccent = THEMES[nextIdx].accent;
              setAccentColor(nextAccent);
              persistPrefs({ themeIdx: nextIdx, accentColor: nextAccent });
            }}
            onChangeAccent={(hex) => {
              setAccentColor(hex);
              persistPrefs({ accentColor: hex });
            }}
          />

          <AttachMenu
            visible={attachVisible}
            onDismiss={() => setAttachVisible(false)}
            onPickMedia={handleMediaPick}
          />
        </GooProvider>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  containerWithoutOverflow: {
    flex: 1,
    overflow: "hidden",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },

  // Header identity
  identityBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarGroupWide: {
    width: 70,
    height: 40,
    position: "relative",
  },
  avatarWrapper: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  stackedAvatar: { width: 28, height: 28 },
  identityTextCol: { flex: 1, paddingRight: 6 },
  chatHeaderName: {
    color: "#EFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  chatHeaderUsername: {
    color: "#b8cfd6",
    fontSize: 12,
  },

  // Lanes
  lanePillTextActive: { color: "#EFFFFF", fontWeight: "800" },
  lanePillTextInactive: { color: "#d7e7ea", fontWeight: "700" },

  // Orbit
  orbitPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  orbitPillActive: {
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  orbitPillInactive: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  orbitText: {
    fontSize: 13,
    fontWeight: "800",
  },
  orbitTextActive: { color: "#EFFFFF" },
  orbitTextInactive: { color: "#d7e7ea" },

  // Bubbles
  bubbleWrap: { marginHorizontal: 6 },
  messageRowOwn: { alignSelf: "flex-end" },
  messageRowOther: { alignSelf: "flex-start" },
  messageText: { fontSize: 16, lineHeight: 21, fontWeight: "500" },
  emojiText: { fontSize: 34, lineHeight: 38 },

  timeChip: {
    position: "absolute",
    bottom: -18,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 8,
  },
  timeChipText: { color: "#cfe6eb", fontSize: 10, fontWeight: "700" },

  reactCluster: {
    flexDirection: "row",
    position: "absolute",
    top: -14,
    gap: 4,
  },
  reactClusterOwn: { right: 8 },
  reactClusterOther: { left: 8 },
  reactChip: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reactionPillText: { color: "#fff", fontSize: 12 },

  mediaBubbleContainer: {
    marginTop: 6,
    gap: 6,
  },
  mediaBubbleOwn: { alignItems: "flex-end" },
  mediaBubbleOther: { alignItems: "flex-start" },
  largeMediaFull: {
    width: Math.min(SCREEN_WIDTH * 0.75, 320),
    height: Math.min(SCREEN_WIDTH * 0.75, 320),
    borderRadius: 12,
  },

  branchLine: {
    width: 3,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 2,
    marginRight: 6,
  },
  parentPreviewText: {
    color: "#d0e7ec",
    maxWidth: SCREEN_WIDTH * 0.75,
  },

  dateSeparatorText: {
    color: "#cfe6eb",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  bottomScrim: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // height set dynamically where it's used
  },
});
