import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  Image,
  Linking,
  Alert,
  ImageBackground,
  Keyboard,
  InteractionManager,
  LayoutAnimation, 
  UIManager,
} from "react-native";
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { Animated as RNAnimated } from "react-native";

import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Video } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State as GestureState,
} from "react-native-gesture-handler";

import useApi from "@/hooks/useApi";
import useWebSocket from "@/hooks/useWebSocket";
import ProfilePicture from "@/utils/getProfilePicture";
import useAuth from "@/hooks/useAuth";

import ReactionOverlay from "./ReactionOverlay";
import AttachMenu from "./AttachMenu";
import ChatDetailsSheet from "./ChatDetailsSheet";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const BUBBLE_MAX_W = Math.floor(SCREEN_WIDTH * 0.78);

/* =========================
   TYPES
========================= */

type AttachmentType = {
  id: string;
  mime_type: string;
  url: string;
  uploaded_at: string;
};

type ReactionType = {
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

type ConversationType = {
  participants: Array<{
    user: {
      id: number | string;
      first_name: string;
      last_name: string;
      username: string;
      profile_image: string | null;
    };
  }>;
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
  is_archived?: boolean;
  // optional lane-level rules (client-side persisted; server patched when available)
  mute?: boolean;
  pinned?: boolean;
  ephemeralSeconds?: number | null;
  autoArchiveDays?: number | null;
};

type ConversationMode =
  | "personal"
  | "work"
  | "family"
  | "dating"
  | "travel"
  | "events"
  | "wellness";

/* =========================
   THEME
========================= */

type ThemeDef = {
  id: string;
  name: string;
  accent: string;
  bgGradient: [string, string, string] | [string, string];
  bubbleOwn?: string;
  bubbleOther: string;
  textOnOwn: string;
  textOnOther: string;
  backdropTintIntensity: number;
};

const THEMES: ThemeDef[] = [
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
];

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

/* =========================
   GLASS BUTTON
========================= */


const GLASS = {
  // dial back blur/intensity to avoid frosty look
  blurBtn: Platform.select({ ios: 8, android: 6, default: 8 }),
  blurHeader: Platform.select({ ios: 16, android: 8, default: 12 }),
  // slightly less blur for footer for readability but not frosty
  blurFooter: Platform.select({ ios: 18, android: 8, default: 12 }),
  // soften stroke/sheen so it doesn't read like a box shadow
  strokeSoft: "rgba(255,255,255,0.10)",
  sheen: "rgba(255,255,255,0.12)",
  // lighter fills for a more liquid, less frosted look
  fillGhost: "rgba(255,255,255,0.025)",
  fillSolid: "rgba(255,255,255,0.08)",
};

// --- Legacy compat shim ---------------------------------------------
// Some older codepaths used a module-scope `drag` (Animated.ValueXY) and
// accessed `drag.x` / `drag.y`. After refactors to `dragX`/`dragY`, any
// missed reference can crash Hermes with: "Property 'drag' doesn't exist".
// Provide a harmless, always-present fallback so those stale refs no-op.
const __LEGACY_DRAG_X__ = new Animated.Value(0);
const __LEGACY_DRAG_Y__ = new Animated.Value(0);
// @ts-ignore – expose as read-only shape compatible with old callsites
const drag = { x: __LEGACY_DRAG_X__, y: __LEGACY_DRAG_Y__ } as const;
// ---------------------------------------------------------------------

function GlassPressable({
  children,
  onPress,
  onLongPress,
  accessibilityLabel,
  radius = 18,
  padH = 14,
  padV = 10,
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

  // NEW: elastic drag physics (squish + tilt)
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const squishX = dragX.interpolate({
    inputRange: [-80, 0, 80],
    outputRange: [0.98, 1, 0.98],
    extrapolate: "clamp",
  });
  const squishY = dragY.interpolate({
    inputRange: [-60, 0, 60],
    outputRange: [0.99, 1, 0.99],
    extrapolate: "clamp",
  });
  const tilt = dragX.interpolate({
    inputRange: [-120, 120],
    outputRange: ["-2deg", "2deg"],
    extrapolate: "clamp",
  });
  const driftX = dragX.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [-2, 0, 2],
    extrapolate: "clamp",
  });
  const driftY = dragY.interpolate({
    inputRange: [-80, 0, 80],
    outputRange: [-2, 0, 2],
    extrapolate: "clamp",
  });

  // Liquid stretch: stretch along drag axis, compress orthogonal; anchor at finger
  const stretchX = dragX.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [0.96, 1, 1.06],
    extrapolate: 'clamp',
  });
  const stretchY = dragY.interpolate({
    inputRange: [-120, 0, 120],
    outputRange: [0.96, 1, 1.06],
    extrapolate: 'clamp',
  });

  // Blend press scale with stretch for a single anchored scale
  const scaleXAnchored = Animated.multiply(stretchX, scale);
  const scaleYAnchored = Animated.multiply(stretchY, scale);

  // Subtle shear to sell the “liquid” bend
  const skewX = dragX.interpolate({
    inputRange: [-120, 120],
    outputRange: ['-6deg', '6deg'],
    extrapolate: 'clamp',
  });
  const skewY = dragY.interpolate({
    inputRange: [-120, 120],
    outputRange: ['-4deg', '4deg'],
    extrapolate: 'clamp',
  });

  // Finger-follow glow
  const glowX = useRef(new Animated.Value(0)).current;
  const glowY = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Feather factor to soften spotlight near container edges
const edgeFeatherAV = useRef(new Animated.Value(1)).current;

  // Track container size for clamping (numbers for JS-side calculations)
  const compWRef = useRef(0);
  const compHRef = useRef(0);

  // Component size for edge-anchored stretching
  const compWidth = useRef(new Animated.Value(0)).current;
  const compHeight = useRef(new Animated.Value(0)).current;
  // Scale anchoring down for very long containers so it doesn't look "sticky"
  const anchorScaleX = useRef(new Animated.Value(1)).current;
  const anchorScaleY = useRef(new Animated.Value(1)).current;
  // Gate anchoring by dominant axis (prevents diagonal "pivot")
  const anchorDomX = useRef(new Animated.Value(1)).current;
  const anchorDomY = useRef(new Animated.Value(1)).current;
  // Hysteresis state for dominant axis
  const domAxisRef = useRef<'x' | 'y' | null>(null);

  // Anchor at the edge opposite the drag direction, so stretch goes WITH the pull
  const anchorEdgeX = Animated.multiply(
    compWidth,
    dragX.interpolate({
      inputRange: [-40, 0, 40],
      outputRange: [1, 0, 0], // drag<0 => right edge; drag>=0 => left edge
      extrapolate: 'clamp',
    })
  );
  const anchorEdgeY = Animated.multiply(
    compHeight,
    dragY.interpolate({
      inputRange: [-40, 0, 40],
      outputRange: [1, 0, 0], // drag<0 => bottom edge; drag>=0 => top edge
      extrapolate: 'clamp',
    })
  );
  // Engage anchor only after a small stretch threshold to avoid jitter near neutral
  const anchorEngageX = dragX.interpolate({
    inputRange: [-16, -8, 0, 8, 16],
    outputRange: [1, 1, 0, 1, 1],
    extrapolate: 'clamp',
  });
  const anchorEngageY = dragY.interpolate({
    inputRange: [-16, -8, 0, 8, 16],
    outputRange: [1, 1, 0, 1, 1],
    extrapolate: 'clamp',
  });

  // Small positional pull so the whole bubble follows the gesture a bit
  const pullTX = dragX.interpolate({
    inputRange: [-120, 120],
    outputRange: [-6, 6],
    extrapolate: 'clamp',
  });
  const pullTY = dragY.interpolate({
    inputRange: [-120, 120],
    outputRange: [-4, 8],
    extrapolate: 'clamp',
  });

  // Spotlight (torch) geometry
  const SPOT_R = 100; // spotlight radius; tune 90–140
  const HOT_R = 40;   // specular hotspot radius

  // Elliptical torch: widen along dominant axis for a torch-like look
  const spotScaleX = dragX.interpolate({ inputRange: [-200, 0, 200], outputRange: [1.35, 1, 1.35], extrapolate: 'clamp' });
  const spotScaleY = dragY.interpolate({ inputRange: [-200, 0, 200], outputRange: [1.35, 1, 1.35], extrapolate: 'clamp' });
  const hotScaleX  = dragX.interpolate({ inputRange: [-200, 0, 200], outputRange: [1.18, 1, 1.18], extrapolate: 'clamp' });
  const hotScaleY  = dragY.interpolate({ inputRange: [-200, 0, 200], outputRange: [1.18, 1, 1.18], extrapolate: 'clamp' });
  const oneMinusDomX = Animated.subtract(1, anchorDomX);
  const oneMinusDomY = Animated.subtract(1, anchorDomY);
  // Gate stretch to dominant axis only (other axis stays at 1x)
const anchoredStretchX = Animated.add(Animated.multiply(stretchX, anchorDomX), oneMinusDomX);
const anchoredStretchY = Animated.add(Animated.multiply(stretchY, anchorDomY), oneMinusDomY);
const scaleXGated = Animated.multiply(anchoredStretchX, scale);
const scaleYGated = Animated.multiply(anchoredStretchY, scale);

  const spotScaleXFinal = Animated.add(Animated.multiply(spotScaleX, anchorDomX), oneMinusDomX);
  const spotScaleYFinal = Animated.add(Animated.multiply(spotScaleY, anchorDomY), oneMinusDomY);
  const hotScaleXFinal  = Animated.add(Animated.multiply(hotScaleX,  anchorDomX), oneMinusDomX);
  const hotScaleYFinal  = Animated.add(Animated.multiply(hotScaleY,  anchorDomY), oneMinusDomY);

  const spotTX = Animated.subtract(glowX, SPOT_R);
  const spotTY = Animated.subtract(glowY, SPOT_R);
  const hotTX = Animated.subtract(glowX, HOT_R);
  const hotTY = Animated.subtract(glowY, HOT_R);
  const HALO_R = Math.round(SPOT_R * 1.8);
  const haloTX = Animated.subtract(glowX, HALO_R);
  const haloTY = Animated.subtract(glowY, HALO_R);

    const panActiveRef = useRef(false);

    

const showGlow = useCallback((on: boolean) => {
  glowOpacity.stopAnimation();
  Animated.timing(glowOpacity, {
    toValue: on ? 0.50 : 0,
    duration: on ? 0 : 80,
    easing: Easing.linear,
    useNativeDriver: true,
  }).start();
}, [glowOpacity]);

  const moveGlow = useCallback((x: number, y: number) => {
    glowX.setValue(x);
    glowY.setValue(y);
  }, [glowX, glowY]);

  const doHaptics = useCallback(() => {
    if (haptics === "none") return;
    if (haptics === "selection") Haptics.selectionAsync();
    else if (haptics === "light")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptics === "medium")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [haptics]);

  // Normalize children deeply: wrap ANY bare strings/numbers in <Text>,
  // but do not recurse into existing <Text> nodes.
  const normalizedChildren = useMemo(() => {
    const wrapStringsDeep = (node: any, keyPrefix = 'gp') : any => {
      if (node == null || typeof node === 'boolean') return null;
      if (typeof node === 'string' || typeof node === 'number') {
        return <Text key={`${keyPrefix}_txt_${String(Math.random()).slice(2)}`}>{String(node)}</Text>;
      }
      if (Array.isArray(node)) {
        return node.map((n, i) => (
          <React.Fragment key={`${keyPrefix}_frag_${i}`}>
            {wrapStringsDeep(n, `${keyPrefix}_${i}`)}
          </React.Fragment>
        ));
      }
      if (React.isValidElement(node)) {
        // If it's already a <Text>, leave its children alone (strings are valid there)
        if (node.type === Text) return node;
        const child = (node.props as any)?.children;
        if (child === undefined) return node;
        const wrappedChild = wrapStringsDeep(child, keyPrefix);
        if (wrappedChild === child) return node;
        return React.cloneElement(node, { ...(node.props as any), children: wrappedChild });
      }
      return node;
    };

    return wrapStringsDeep(React.Children.toArray(children), 'gp');
  }, [children]);

  // DEV guard: warn + trace if a raw string is passed to GlassPressable
  useEffect(() => {
    if (!__DEV__) return;
    const arr = React.Children.toArray(children);
    let found = false;
    arr.forEach((c) => {
      if (typeof c === 'string' || typeof c === 'number') {
        found = true;
        // eslint-disable-next-line no-console
        console.warn('[GlassPressable] Raw text child received (will be auto-wrapped):', c);
      }
    });
    if (found) {
      // eslint-disable-next-line no-console
      console.trace('[GlassPressable] Callsite for raw text child');
    }
    // Helpful: list immediate child element types
    arr.forEach((c) => {
      if (React.isValidElement(c)) {
        const t: any = c.type as any;
        const name = t?.displayName || t?.name || String(t);
        // eslint-disable-next-line no-console
        console.log('[GlassPressable] immediate child element:', name);
      }
    });
  }, [children]);

  return (
    <Animated.View
      style={[
        {
          borderRadius: radius,
          transform: [
            { translateX: Animated.multiply(pullTX, anchorDomX) },
{ translateY: Animated.multiply(pullTY, anchorDomY) },
            { translateX: Animated.multiply(Animated.multiply(Animated.multiply(anchorEdgeX, anchorScaleX), anchorDomX), anchorEngageX) },
            { translateY: Animated.multiply(Animated.multiply(Animated.multiply(anchorEdgeY, anchorScaleY), anchorDomY), anchorEngageY) },
            { scaleX: scaleXGated },
{ scaleY: scaleYGated },
            { skewX },
            { skewY },
            { translateX: Animated.multiply(Animated.multiply(Animated.multiply(Animated.multiply(anchorEdgeX, anchorScaleX), anchorDomX), anchorEngageX), -1) },
            { translateY: Animated.multiply(Animated.multiply(Animated.multiply(Animated.multiply(anchorEdgeY, anchorScaleY), anchorDomY), anchorEngageY), -1) },
          ],
          opacity,
        },
        Platform.select({
          ios: { shadowOpacity: 0 },
          android: { elevation: 0 },
          default: {},
        }),
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
      },
    },
  ],
  {
    useNativeDriver: true,
    listener: (evt) => {
      const ne: any = (evt as any).nativeEvent || {};
      const w = compWRef.current || 0;
      const h = compHRef.current || 0;

      if (typeof ne.x === 'number' && typeof ne.y === 'number') {
        const xc = Math.max(0, Math.min(ne.x, w));
        const yc = Math.max(0, Math.min(ne.y, h));
        glowX.setValue(xc);
        glowY.setValue(yc);

        // Feather near borders so the circle edge never reads hard when clipped
        const nearest = Math.min(xc, w - xc, yc, h - yc);
        const factor = Math.max(0.6, Math.min(1, nearest / Math.max(1, SPOT_R)));
        edgeFeatherAV.setValue(factor);
      }

      // dominant-axis hysteresis (see §3 below to eliminate diagonal anchoring)
      const dx = typeof ne.translationX === 'number' ? ne.translationX : 0;
      const dy = typeof ne.translationY === 'number' ? ne.translationY : 0;
      const adx = Math.abs(dx);
      const ady = Math.abs(dy);
      if (domAxisRef.current === null) {
        if (adx >= ady + 12) { anchorDomX.setValue(1); anchorDomY.setValue(0); domAxisRef.current = 'x'; }
        else if (ady >= adx + 12) { anchorDomX.setValue(0); anchorDomY.setValue(1); domAxisRef.current = 'y'; }
      } else if (domAxisRef.current === 'x') {
        if (ady > adx + 20) { anchorDomX.setValue(0); anchorDomY.setValue(1); domAxisRef.current = 'y'; }
      } else if (domAxisRef.current === 'y') {
        if (adx > ady + 20) { anchorDomX.setValue(1); anchorDomY.setValue(0); domAxisRef.current = 'x'; }
      }

      if (!panActiveRef.current) { panActiveRef.current = true; showGlow(true); }
    },
  }
)}
        onHandlerStateChange={(e) => {
          const st = (e as any).nativeEvent.state;
          if (st === GestureState.BEGAN || st === GestureState.ACTIVE) {
            panActiveRef.current = true;
            showGlow(true);
          } else if (
            st === GestureState.END ||
            st === GestureState.CANCELLED ||
            st === GestureState.FAILED
          ) {
            panActiveRef.current = false;
            showGlow(false);
            anchorDomX.setValue(1);
anchorDomY.setValue(1);
domAxisRef.current = null;
edgeFeatherAV.setValue(1);
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
              compWidth.setValue(width);
              compHeight.setValue(height);
              compWRef.current = width;
              compHRef.current = height;
              if ((glowX as any)._value === 0 && (glowY as any)._value === 0) {
                glowX.setValue(width * 0.5);
                glowY.setValue(height * 0.5);
              } else {
                // ensure current light stays within bounds if size changed
                const curX = (glowX as any)._value ?? width * 0.5;
                const curY = (glowY as any)._value ?? height * 0.5;
                glowX.setValue(Math.max(0, Math.min(curX, width)));
                glowY.setValue(Math.max(0, Math.min(curY, height)));
              }
              // weaken edge-anchoring for very wide/tall components so it feels more natural
              const aspect = width / Math.max(1, height);
              const invAspect = height / Math.max(1, width);
              anchorScaleX.setValue(aspect > 1.6 ? 0.25 : 1); // was 0.35
              anchorScaleY.setValue(invAspect > 1.6 ? 0.35 : 1);
            }}
            onPress={() => {
              doHaptics();
              onPress?.();
            }}
            onLongPress={() => {
              if (haptics !== "none")
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onLongPress?.();
            }}
            onPressIn={(e) => {
              const { locationX, locationY } = (e as any).nativeEvent || {};
              const w = compWRef.current || 0;
              const h = compHRef.current || 0;
              if (typeof locationX === 'number' && typeof locationY === 'number') {
                const xc = Math.max(0, Math.min(locationX, w));
                const yc = Math.max(0, Math.min(locationY, h));
                glowX.setValue(xc);
                glowY.setValue(yc);
              }
              showGlow(true);
              anchorDomX.setValue(1);
              anchorDomY.setValue(1);
              Animated.spring(press, {
                toValue: 1,
                useNativeDriver: true,
                stiffness: 320,
                damping: 20,
                mass: 0.25,
              }).start();
            }}
            onPressOut={() => {
  if (!panActiveRef.current) {
    showGlow(false);
  }
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
              overflow: "hidden",
              backgroundColor: "transparent",
              paddingHorizontal: padH,
              paddingVertical: padV,
              width: block ? "100%" : undefined,
              alignSelf: block ? "stretch" : undefined,
            }}
          >
            {/* layers */}
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
                {/* finger-follow spotlight */}
<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: Animated.multiply(glowOpacity, edgeFeatherAV) }]}>{/* very soft outer halo to avoid hard-edged read */}
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: HALO_R * 2,
                      height: HALO_R * 2,
                      transform: [ { translateX: haloTX }, { translateY: haloTY }, { scaleX: spotScaleXFinal }, { scaleY: spotScaleYFinal } ],
                    }}
                    pointerEvents="none"
                  >
                    <Svg width="100%" height="100%">
                      <Defs>
                        <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
                         <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.06}/>
<Stop offset="60%"  stopColor="#FFFFFF" stopOpacity={0.03}/>
<Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.00}/>
                        </RadialGradient>
                      </Defs>
                      <Circle cx="50%" cy="50%" r="50%" fill="url(#halo)" />
                    </Svg>
                  </Animated.View>
                  {/** Main spot — bright center, natural falloff **/}
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: SPOT_R * 2,
                      height: SPOT_R * 2,
                      transform: [
                        { translateX: spotTX },
                        { translateY: spotTY },
                        { scaleX: spotScaleXFinal },
                        { scaleY: spotScaleYFinal },
                      ],
                    }}
                  >
                    <Svg width="100%" height="100%">
                      <Defs>
                        <RadialGradient id="spot" cx="50%" cy="50%" r="50%">
                          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.36}/>
<Stop offset="35%"  stopColor="#FFFFFF" stopOpacity={0.18}/>
<Stop offset="65%"  stopColor="#FFFFFF" stopOpacity={0.06}/>
<Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.00}/>
                        </RadialGradient>
                      </Defs>
                      <Circle cx="50%" cy="50%" r="50%" fill="url(#spot)" />
                    </Svg>
                  </Animated.View>

                  {/* Specular hotspot */}
                  <Animated.View
                    style={{
                      position: 'absolute',
                      width: HOT_R * 2,
                      height: HOT_R * 2,
                      transform: [
                        { translateX: Animated.add(hotTX, -4) },
                        { translateY: Animated.add(hotTY, -6) },
                        { scaleX: hotScaleXFinal },
                        { scaleY: hotScaleYFinal },
                      ],
                    }}
                  >
                    <Svg width="100%" height="100%">
                      <Defs>
                        <RadialGradient id="hot" cx="50%" cy="50%" r="50%">
                          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.40}/>
<Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.10}/>
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
            {normalizedChildren}
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
    ...tiProps
  } = props || {};

  // Flatten incoming style so we can split layout vs typography
  const flat = StyleSheet.flatten(tiStyle) || {} as any;

  // Honor explicit height/minHeight/maxHeight for layout
  const hasExplicitHeight =
    flat.height != null || flat.minHeight != null || flat.maxHeight != null;

  // Extract padding and radius from prior TextInput styles (so UI looks identical)
  const pick = (keys: string[]) => keys.reduce((acc: any, k) => (flat[k] !== undefined ? (acc[k] = flat[k], acc) : acc), {} as any);

  const paddingH = flat.paddingHorizontal ?? flat.padding ?? 12;
  const paddingV = flat.paddingVertical ?? flat.padding ?? 8;

  // Derive unified radius (fallback to 18)
  const radius = flat.borderRadius ?? 18;

  // Auto-size config and state
  const minH = flat.minHeight ?? 46;
  const maxH = flat.maxHeight ?? 160;
  const [measuredH, setMeasuredH] = useState(minH);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

  // Container-facing properties (size & margins)
  const containerFromTI = {
    // sizing
    height: flat.height,
    minHeight: flat.minHeight,
    maxHeight: flat.maxHeight,
    width: flat.width,
    flex: flat.flex,
    alignSelf: flat.alignSelf,
    // margins
    ...pick(["margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "marginHorizontal", "marginVertical"]),
  } as any;

  // Typography to keep on TextInput
  const textStyles = {
    color: flat.color,
    fontSize: flat.fontSize,
    fontFamily: flat.fontFamily,
    fontWeight: flat.fontWeight,
    lineHeight: flat.lineHeight,
    letterSpacing: flat.letterSpacing,
    textAlign: flat.textAlign,
    textAlignVertical: flat.textAlignVertical,
    includeFontPadding: flat.includeFontPadding,
  } as any;

  // Ensure inner TI doesn’t contribute its own background/border/padding
  const scrubbedTI = [
    textStyles,
    { backgroundColor: 'transparent', padding: 0, margin: 0, flex: 1 },
  ];

  // Ensure multiline auto-grow and scrollEnabled behave as desired
  const isMultiline = tiProps.multiline ?? true; // default to multiline for composer
  const scrollEnabled = isMultiline ? (tiProps.scrollEnabled ?? false) : tiProps.scrollEnabled;

  return (
    <GlassPressable
      variant="ghost"
      radius={radius}
      padH={paddingH}
      padV={paddingV}
      haptics="none"
      elastic={true} // keep pan enabled so glow follows finger over wide input
      showBackground={false} // avoid double BG under composer
      block
      onPress={() => {
        try { (ref as any)?.current?.focus?.(); } catch {}
        onPress?.();
      }}
      style={[
        hasExplicitHeight ? null : { flex: 1 },
        { minHeight: minH, height: measuredH },
        containerFromTI,
        containerStyle
      ]}
    >
      <View pointerEvents="box-none" style={{ flex: 1, alignSelf: 'stretch' }}>
        <TextInput
          ref={ref}
          {...tiProps}
          multiline={isMultiline}
          scrollEnabled={scrollEnabled}
          textAlignVertical={tiProps.textAlignVertical ?? 'top'}
          placeholderTextColor={placeholderTextColor}
          style={scrubbedTI}
          onContentSizeChange={(e) => {
            const ch = e.nativeEvent.contentSize?.height ?? minH;
            const target = clamp(ch + (paddingV * 2), minH, maxH);
            if (target !== measuredH) setMeasuredH(target);
          }}
        />
      </View>
    </GlassPressable>
  );
});
GlassInput.displayName = 'GlassInput';

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

/* =========================
   MAIN
========================= */

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
  callApiRef.current = callApi; // always latest

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const [conversation, setConversation] = useState<ConversationType | null>(
    null
  );

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [laneDrafts, setLaneDrafts] = useState<
    Record<
      string,
      {
        input: string;
        attachments: { uri: string; type: string; name: string }[];
        replyingToUuid: string | null;
      }
    >
  >({});

  const [input, setInput] = useState("");
  const [attachmentsToSend, setAttachmentsToSend] = useState<
    { uri: string; type: string; name: string }[]
  >([]);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
// input sizing constants to avoid bounce
const INPUT_MIN_HEIGHT = 46;  // was 20; 44 prevents first-line clipping
const INPUT_MAX_HEIGHT = 160; // ~5–6 lines with 16/20 typography
const [inputHeight, setInputHeight] = useState(INPUT_MIN_HEIGHT);

// add this right after inputHeight state:
const lastMeasuredHeightRef = useRef<number>(INPUT_MIN_HEIGHT);

// Animated container height (smoother than LayoutAnimation on every key)
const inputHeightAV = useRef(new Animated.Value(INPUT_MIN_HEIGHT)).current;

// Smooth placeholder fade (prevents "selected" flicker)
const placeholderAnim = useRef(new Animated.Value(1)).current;
const showPlaceholder = useMemo(
  () => input.length === 0 && attachmentsToSend.length === 0,
  [input, attachmentsToSend]
);
useEffect(() => {
  Animated.timing(placeholderAnim, {
    toValue: showPlaceholder ? 1 : 0,
    duration: 120,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start();
}, [showPlaceholder]);


  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [justSent, setJustSent] = useState(false);

  // dynamic sizing for footer + keyboard lift
  const [footerHeight, setFooterHeight] = useState(0);
  const [keyboardLift, setKeyboardLift] = useState(0);

  // lanes / mode / theme
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null);

  const [mode, setMode] = useState<ConversationMode>("personal");

  const [themeIdx, setThemeIdx] = useState(0);
  const theme = THEMES[themeIdx];

  const [accentColor, setAccentColor] = useState<string>(theme.accent);

  const [bgImage, setBgImage] = useState<string | null>(null);

  // overlays
  const [focusedMessage, setFocusedMessage] = useState<MessageType | null>(
    null
  );
  const [overlayLayout, setOverlayLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [attachVisible, setAttachVisible] = useState(false);

  const flatListRef = useRef<FlatList<MessageType>>(null);
  const inputRef = useRef<TextInput>(null);
  const bubbleRefs = useRef<Record<string, View | null>>({});
  const loadingOlderRef = useRef(false); // prevent duplicate loads near top
  const onEndReachedCalledDuringMomentum = useRef(false);
  const isUserDraggingRef = useRef(false);

  // --- bubbly effects & swipe-to-time/reply maps ---
  const msgScales = useRef<Record<string, Animated.Value>>({}).current;
  const msgOpacities = useRef<Record<string, Animated.Value>>({}).current;
  const msgPanX = useRef<Record<string, Animated.Value>>({}).current;
  const seenMsgsRef = useRef<Set<string>>(new Set());

  const ensureAnimFor = useCallback(
    (id: string, _isOwn: boolean) => {
      if (!msgScales[id]) msgScales[id] = new Animated.Value(0.97);
      if (!msgOpacities[id]) msgOpacities[id] = new Animated.Value(0);
      if (!msgPanX[id]) msgPanX[id] = new Animated.Value(0);
    },
    [msgScales, msgOpacities, msgPanX]
  );

  const animateInIfNew = useCallback(
    (id: string) => {
      if (!seenMsgsRef.current.has(id)) {
        seenMsgsRef.current.add(id);
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
      }
    },
    [msgScales, msgOpacities]
  );

  const OPEN_TOP = insets.top + 16;
  const SHEET_OFFSET = SCREEN_HEIGHT - OPEN_TOP;

  const convLoadedForRef = useRef<string | null>(null);
  const lanesFetchedForRef = useRef<string | null>(null);

  /* open/close */
  useEffect(() => {
    if (!visible) return;
    translateY.setValue(SHEET_OFFSET);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const triggerClose = useCallback(() => {
    Haptics.selectionAsync();
    Animated.timing(translateY, {
      toValue: SHEET_OFFSET,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, SHEET_OFFSET, translateY]);

  /* load conversation + prefs (RUNS ONCE PER OPEN/ID) */
  useEffect(() => {
    if (!visible || !conversationId) return;
    if (convLoadedForRef.current === conversationId) return; // guard
    convLoadedForRef.current = conversationId;

    let cancelled = false;
    (async () => {
      try {
        const resp = await callApiRef.current(
          `messages/get_conversation_details/${conversationId}/`
        );
        if (cancelled) return;
        setConversation(resp.data);
        if (resp.data?.mode) setMode(resp.data.mode);
        if (resp.data?.theme) {
          const { themeIdx: serverIdx, bgImage: serverBg, accentColor } =
            resp.data.theme || {};
          if (typeof serverIdx === "number")
            setThemeIdx(Math.min(Math.max(serverIdx, 0), THEMES.length - 1));
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
              Math.min(Math.max(prefs.themeIdx, 0), THEMES.length - 1)
            );
          if (typeof prefs.activeLaneId === "string")
            setActiveLaneId(prefs.activeLaneId);
          if (typeof prefs.bgImage === "string")
            setBgImage(prefs.bgImage || null);
          if (typeof prefs.accentColor === "string")
            setAccentColor(prefs.accentColor);
          if (typeof prefs.mode === "string") setMode(prefs.mode);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, conversationId]);

  // sync accent when theme changes (unless user already set a custom accent this session)
  useEffect(() => {
    setAccentColor((prev) => prev || THEMES[themeIdx].accent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeIdx]);

  // reset guards when closed
  useEffect(() => {
    if (!visible) {
      convLoadedForRef.current = null;
      lanesFetchedForRef.current = null;
    }
  }, [visible]);

  /* persist prefs (local + server; no spam) */
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
      // fire-and-forget
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

  /* lanes fetch/create (ONCE PER OPEN/ID) */
  useEffect(() => {
    if (!visible || !conversationId) return;
    if (lanesFetchedForRef.current === conversationId) return;

    lanesFetchedForRef.current = conversationId;
    let cancelled = false;

    (async () => {
      try {
        const ctxRes = await callApiRef.current(
          `messages/contexts/${conversationId}/`
        );
        if (cancelled) return;

        const list: Lane[] = Array.isArray(ctxRes.data) ? ctxRes.data : [];
        if (list.length) {
          setLanes(list);
          setActiveLaneId((prev) =>
            prev && list.some((l) => l.id === prev) ? prev : list[0].id
          );
        } else {
          try {
            const created = await callApiRef.current(
              `messages/contexts/${conversationId}/`,
              "POST",
              {
                title: "Main",
                emoji: "chat",
                color: accentColor,
              }
            );
            if (cancelled) return;
            setLanes([created.data]);
            setActiveLaneId(created.data.id);
          } catch {
            if (cancelled) return;
            const fallback: Lane = {
              id: "default",
              title: "Main",
              emoji: "chat",
              color: accentColor,
            };
            setLanes([fallback]);
            setActiveLaneId("default");
          }
        }
      } catch {
        if (cancelled) return;
        const fallback: Lane = {
          id: "default",
          title: "Main",
          emoji: "chat",
          color: accentColor,
        };
        setLanes((p) => (p.length ? p : [fallback]));
        setActiveLaneId((prev) => prev ?? "default");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, conversationId, accentColor]);

  /* per-lane draft restore/persist */
  const persistDraft = useCallback(
    (laneId: string | null) => {
      if (!laneId) return;
      setLaneDrafts((prev) => ({
        ...prev,
        [laneId]: {
          input,
          attachments: attachmentsToSend,
          replyingToUuid: replyingTo?.uuid || null,
        },
      }));
    },
    [input, attachmentsToSend, replyingTo]
  );

  const restoreDraft = useCallback(
    (laneId: string | null) => {
      if (!laneId) {
        setInput("");
        setAttachmentsToSend([]);
        setReplyingTo(null);
        return;
      }
      const d = laneDrafts[laneId];
      setInput(d?.input ?? "");
      setAttachmentsToSend(d?.attachments ?? []);
      setReplyingTo(
        d?.replyingToUuid
          ? messages.find((m) => m.uuid === d.replyingToUuid) ?? null
          : null
      );
    },
    [laneDrafts, messages]
  );

  const previousLaneRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = previousLaneRef.current;
    if (prev && prev !== activeLaneId) persistDraft(prev);
    previousLaneRef.current = activeLaneId;
    restoreDraft(activeLaneId);
    if (activeLaneId) persistPrefs({ activeLaneId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLaneId]);

  /* fetch messages for lane */
  const fetchMessages = useCallback(
    async (pageToLoad: number) => {
      if (!activeLaneId || !conversationId) return;
      try {
        pageToLoad === 0 ? setLoading(true) : setLoadingOlder(true);
        if (pageToLoad !== 0) loadingOlderRef.current = true;
        const url = `messages/get_messages/${conversationId}/?limit=30&offset=${
          pageToLoad * 30
        }&context=${activeLaneId}`;
        const resp = await callApiRef.current(url);
        const { results, next } = resp.data || {};
        if (pageToLoad === 0) {
          setMessages(Array.isArray(results) ? results : []);
        } else {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.uuid));
            const filtered = (Array.isArray(results) ? results : []).filter(
              (m: any) => !existing.has(m.uuid)
            );
            return [...prev, ...filtered];
          });
        }
        setHasMore(!!next);
        setPage(pageToLoad + 1);
      } catch {
        // ignore silently
      } finally {
        pageToLoad === 0 ? setLoading(false) : setLoadingOlder(false);
        if (pageToLoad !== 0) loadingOlderRef.current = false;
        onEndReachedCalledDuringMomentum.current = false;
      }
    },
    [conversationId, activeLaneId]
  );

  useEffect(() => {
    if (visible && activeLaneId) fetchMessages(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, activeLaneId]);

  /* live updates */
  const { sendMessage } = useWebSocket(`messages/inbox/${conversationId}/`, {
    onMessage: (data: any) => {
      if (data.type === "chat_message") {
        const msg: MessageType = data.message;
        if (activeLaneId && (msg.context ?? null) !== activeLaneId) return;

        setMessages((prev) => {
          // If this is our own message echoed back, replace the optimistic temp copy
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

  /* autoscroll (inverted list) */
  useEffect(() => {
    if (!loadingOlder && flatListRef.current) {
      if (!justSent && !userScrolledUp && loading === false) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    }
  }, [messages, userScrolledUp, justSent, loadingOlder, loading]);

  // small reset so autoscroll doesn't fight the user
  useEffect(() => {
    if (justSent) {
      const t = setTimeout(() => setJustSent(false), 400);
      return () => clearTimeout(t);
    }
  }, [justSent]);

  /* helpers */
  const isOwnMessage = (m: MessageType) =>
    m.sender_username === currentUsername;
  const timeDiffMin = (a: Date, b: Date) =>
    Math.abs((a.getTime() - b.getTime()) / 60000);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const needsTimeSeparator = (curr: MessageType, prev?: MessageType) => {
    if (!prev) return true;
    const t1 = new Date(curr.sent_at);
    const t0 = new Date(prev.sent_at);
    if (!isSameDay(t1, t0)) return true;
    return timeDiffMin(t1, t0) >= 30;
  };

  // ---- identity display helpers (robust fallbacks) ----
  const fullName = (u: any) =>
    [u?.first_name ?? u?.firstName, u?.last_name ?? u?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

  const usernameOf = (u: any) =>
    u?.username ?? u?.user_name ?? (u?.user && u.user.username) ?? null;

  // normalize participant shape
  const asUser = useCallback((p: any) => (p && p.user ? p.user : p), []);

  const participantsUsers = useMemo(
    () => (conversation?.participants ?? []).map(asUser),
    [conversation, asUser]
  );

  const peers = useMemo(
    () =>
      participantsUsers.filter((u: any) => usernameOf(u) !== currentUsername),
    [participantsUsers, currentUsername]
  );

  const shownPeople = useMemo(
    () => (peers.length ? peers : participantsUsers),
    [peers, participantsUsers]
  );

  const nameLine = useMemo(
    () =>
      shownPeople
        .map((u: any) => {
          const fn = fullName(u);
          const un = usernameOf(u) || "unknown";
          return fn || `@${un}`;
        })
        .join(", "),
    [shownPeople]
  );

  const handleLine = useMemo(
    () =>
      shownPeople.map((u: any) => `@${usernameOf(u) || "unknown"}`).join(", "),
    [shownPeople]
  );

  const participantsFlat = useMemo(
    () => (conversation?.participants ?? []).map((p: any) => p?.user ?? p),
    [conversation]
  );

  /* SEND */
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
    setJustSent(true);

    const basePayload: any = {
      text: trimmed,
      sender_username: currentUsername,
      conversation: conversationId,
      context: activeLaneId,
      ...(replyingTo && { parent_message_uuid: replyingTo.uuid }),
    };

    setInput("");
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
setInputHeight(INPUT_MIN_HEIGHT);

    setAttachmentsToSend([]);
    setReplyingTo(null);
    setLaneDrafts((prev) => ({
      ...prev,
      [activeLaneId]: { input: "", attachments: [], replyingToUuid: null },
    }));

    if (attachmentsToSend.length === 0) {
      sendMessage(basePayload);
      return;
    }

    try {
      const body: any = {
        conversation: conversationId,
        text: trimmed,
        context: activeLaneId,
      };
      if (replyingTo) body.parent_message_uuid = replyingTo.uuid;
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
    } catch {
      setMessages((prev) => prev.filter((m) => m.uuid !== optimistic.uuid));
      Alert.alert(
        "Message Failed",
        "Unable to send your message. Please try again."
      );
    }
  };

  /* REACTIONS */
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
        if (isSame && existingByUser) {
          next = next.filter(
            (r) =>
              !(
                r.user_username === currentUsername &&
                r.reaction_type === reactionType
              )
          );
        } else {
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

    if (isSame && existingByUser) {
      sendMessage({
        action: "remove_reaction",
        message_uuid: msg.uuid,
        reaction_type: reactionType,
      });
    } else {
      sendMessage({
        action: "add_reaction",
        message_uuid: msg.uuid,
        reaction_type: reactionType,
      });
    }
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

  /* MEDIA */
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
      if (activeLaneId) {
        setLaneDrafts((prev) => ({
          ...prev,
          [activeLaneId]: {
            input,
            attachments: [
              ...(prev[activeLaneId]?.attachments ?? []),
              ...newItems,
            ],
            replyingToUuid: replyingTo?.uuid || null,
          },
        }));
      }
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

  /* overlay tracking + keyboard handling */
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const keyboardWasOpen = useRef(false);

  // smooth footer raise/lower with keyboard + elastic input drag
  const footerTranslate = useRef(new Animated.Value(0)).current;
  const inputDrag = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // smooth send button presence
const sendAnim = useRef(new Animated.Value(0)).current;
const showSend = useMemo(
  () => input.trim().length > 0 || attachmentsToSend.length > 0,
  [input, attachmentsToSend]
);

useEffect(() => {
  Animated.timing(sendAnim, {
    toValue: showSend ? 1 : 0,
    duration: 160,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start();
}, [showSend]);

  useEffect(() => {
    const bottomPad = Math.max(0, insets.bottom - 4);

    const animateTo = (lift: number, duration = 260) =>
      Animated.timing(footerTranslate, {
        toValue: -lift, // negative Y to lift the footer with keyboard
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

    const ensureLatestVisible = (delay = 0) => {
      if (!userScrolledUp && flatListRef.current) {
        const fn = () =>
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        if (delay > 0) setTimeout(fn, delay);
        else requestAnimationFrame(fn);
      }
    };

    const willShow = Keyboard.addListener("keyboardWillShow", (e: any) => {
      setKeyboardVisible(true);
      const h = e.endCoordinates?.height ?? 0;
      const d = e.duration ?? 260;
      const lift = Math.max(0, h - bottomPad);
      setKeyboardLift(lift);
      animateTo(lift, d);
      ensureLatestVisible(Math.min(200, d));
    });

    const willHide = Keyboard.addListener("keyboardWillHide", (e: any) => {
      setKeyboardVisible(false);
      const d = e.duration ?? 220;
      setKeyboardLift(0);
      isUserDraggingRef.current = false;
      animateTo(0, d);
      // after footer settles, keep latest anchored if user was at bottom
      setTimeout(() => {
        if (!userScrolledUp && flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }, Math.min(200, d));
    });

    // Android fallback
    const didShow = Keyboard.addListener("keyboardDidShow", (e: any) => {
      if (!keyboardVisible) {
        setKeyboardVisible(true);
        const h = e.endCoordinates?.height ?? 0;
        const lift = Math.max(0, h - bottomPad);
        setKeyboardLift(lift);
        animateTo(lift, 240);
        ensureLatestVisible(120);
      }
    });

    const didHide = Keyboard.addListener("keyboardDidHide", () => {
      if (keyboardVisible) {
        setKeyboardVisible(false);
        setKeyboardLift(0);
        isUserDraggingRef.current = false;
        animateTo(0, 220);
        // run after interactions to avoid jank
        InteractionManager.runAfterInteractions(() => {
          if (!userScrolledUp && flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
          }
        });
      }
    });

    return () => {
      willShow.remove();
      willHide.remove();
      didShow.remove();
      didHide.remove();
    };
  }, [footerTranslate, keyboardVisible, insets.bottom, userScrolledUp]);

  useEffect(() => {
  if (
    Platform.OS === "android" &&
    (UIManager as any).setLayoutAnimationEnabledExperimental
  ) {
    (UIManager as any).setLayoutAnimationEnabledExperimental(true);
  }
}, []);

  const clampX = (x: number, width: number) => {
    const minX = 12;
    const maxX = SCREEN_WIDTH - width - 12;
    return Math.max(minX, Math.min(x, maxX));
  };
  const clampY = (y: number, height: number) => {
    const topBound = insets.top + 12;
    const bottomBound = SCREEN_HEIGHT - insets.bottom - 12 - height;
    return Math.max(topBound, Math.min(y, bottomBound));
  };

  const lastScrollYRef = useRef(0);

  const onScroll = (e: any) => {
    const { contentOffset } = e.nativeEvent;
    const y = contentOffset.y;
    const nearBottom = y <= 50; // inverted list
    setUserScrolledUp(!nearBottom);

    if (keyboardVisible && isUserDraggingRef.current && y > lastScrollYRef.current + 8) {
      Keyboard.dismiss();
    }
    lastScrollYRef.current = y;

    if (focusedMessage) {
      const ref = bubbleRefs.current[focusedMessage.uuid];
      if (ref) {
        ref.measureInWindow((x, winY, w, h) => {
          setOverlayLayout({
            x: clampX(x, w),
            y: clampY(winY, h),
            width: w,
            height: h,
          });
        });
      }
    }
  };

  const onEndReached = () => {
    if (onEndReachedCalledDuringMomentum.current) return;
    if (hasMore && !loadingOlderRef.current) {
      onEndReachedCalledDuringMomentum.current = true;
      fetchMessages(page);
    }
  };

  const openOverlayFor = (message: MessageType) => {
    const ref = bubbleRefs.current[message.uuid];
    if (!ref) return;
    Haptics.selectionAsync();
    ref.measureInWindow((x, y, width, height) => {
      setFocusedMessage(message);
      setOverlayLayout({
        x: clampX(x, width),
        y: clampY(y, height),
        width,
        height,
      });
      // gently scale the focused bubble
      ensureAnimFor(message.uuid, isOwnMessage(message));
      Animated.spring(msgScales[message.uuid], {
        toValue: 0.98,
        useNativeDriver: true,
        stiffness: 360,
        damping: 18,
        mass: 0.4,
      }).start();
    });
  };

  /* LANE ICON DETECTION */
  const hasMaterialIcon = useCallback((name?: string) => {
    if (!name) return false;
    // @ts-ignore
    const map = (MaterialIcons as any).glyphMap || {};
    return !!map[name];
  }, []);

  /* RENDERERS */
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
    const firstOfGroup = (() => {
      if (!prev) return true;
      if (item.sender_username !== prev.sender_username) return true;
      const t1 = new Date(item.sent_at);
      const t0 = new Date(prev.sent_at);
      return Math.abs((t1.getTime() - t0.getTime()) / 60000) > 5;
    })();
    const lastOfGroup =
      !next ||
      (() => {
        if (next.sender_username !== item.sender_username) return true;
        const t1 = new Date(next.sent_at);
        const t0 = new Date(item.sent_at);
        return Math.abs((t1.getTime() - t0.getTime()) / 60000) > 5;
      })();

    const radius = {
      borderTopLeftRadius: own ? 18 : firstOfGroup ? 18 : 8,
      borderTopRightRadius: own ? (firstOfGroup ? 18 : 8) : 18,
      borderBottomLeftRadius: own ? 18 : lastOfGroup ? 18 : 8,
      borderBottomRightRadius: own ? (lastOfGroup ? 18 : 8) : 18,
    };

    // distinct reactions by user
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

    // setup per-message animated values
    ensureAnimFor(item.uuid, own);
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
            const sender = participantsFlat.find(
              (u: any) => u?.username === item.sender_username
            );
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
              <View className="branchLine" style={styles.branchLine} />
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
              // Right-swipe to reply (others' messages)
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
              {/* reactions cluster above bubble */}
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

              {/* message bubble (emoji-only has NO bubble) */}
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
                    theme={theme}
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

              {/* elastic time chip revealed when pulling left */}
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

  /* lane mutators */
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

  /* animated bg orbs */
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = (val: Animated.Value, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: 8000,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 8000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    loop(orbA, 400);
    loop(orbB, 1200);
  }, [orbA, orbB]);

  const orbAStyle = {
    transform: [
      {
        translateY: orbA.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
      {
        scale: orbA.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
      },
    ],
    opacity: 0.18,
  };
  const orbBStyle = {
    transform: [
      {
        translateY: orbB.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 10],
        }),
      },
      {
        scale: orbB.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }),
      },
    ],
    opacity: 0.12,
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
          {/* backdrop */}
          <Pressable style={styles.backdrop} onPress={triggerClose} />

          <Animated.View
            style={[
              styles.sheetContainer,
              { top: insets.top + 16, bottom: 0, transform: [{ translateY }] },
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
                colors={theme.bgGradient as any}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            {/* subtle animated orbs */}
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { opacity: 1 }]}
            >
              <Animated.View
                style={[
                  styles.orb,
                  { width: 220, height: 220, left: -40, top: insets.top + 40 },
                  orbAStyle,
                ]}
              >
                <LinearGradient
                  colors={["rgba(0,255,255,0.18)", "transparent"]}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
              <Animated.View
                style={[
                  styles.orb,
                  {
                    width: 280,
                    height: 280,
                    right: -60,
                    top: SCREEN_HEIGHT * 0.22,
                  },
                  orbBStyle,
                ]}
              >
                <LinearGradient
                  colors={["rgba(160,124,254,0.15)", "transparent"]}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </Animated.View>

            {/* full-width identity bar */}
            <View
              style={{
                paddingHorizontal: 6,
                marginTop: 6,
                display: "flex",
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
                onPress={() => setShowDetails(true)}
                radius={18}
                padH={10}
                padV={5}
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
            </View>

            {/* lanes rail */}
            <View style={{ paddingVertical: 6 }}>
              <FlatList
                data={[
                  ...lanes,
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
                          ? [
                              styles.lanePillActive,
                              { borderColor: "rgba(255,255,255,0.22)" },
                            ]
                          : styles.lanePillInactive,
                        { marginRight: 8 },
                      ]}
                    >
                      {hasMaterialIcon(item.emoji) ? (
                        <MaterialIcons
                          name={item.emoji as any}
                          size={16}
                          color={
                            activeLaneId === item.id ? "#EFFFFF" : "#d7e7ea"
                          }
                          style={{ marginRight: 6, opacity: 0.95 }}
                        />
                      ) : (
                        <MaterialIcons
                          name="view-agenda"
                          size={16}
                          color={
                            activeLaneId === item.id ? "#EFFFFF" : "#d7e7ea"
                          }
                          style={{ marginRight: 6, opacity: 0.95 }}
                        />
                      )}
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
            <FlatList
              key={`lane-${activeLaneId || "none"}`}
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.uuid}
              inverted
              onScroll={onScroll}
              scrollEventThrottle={16}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.1}
              maintainVisibleContentPosition={{
                minIndexForVisible: 1,
                autoscrollToTopThreshold: 20,
              }}
              windowSize={10}
              maxToRenderPerBatch={20}
              initialNumToRender={20}
              onContentSizeChange={() => {
                if (!userScrolledUp) {
                  requestAnimationFrame(() => {
                    flatListRef.current?.scrollToOffset({
                      offset: 0,
                      animated: false,
                    });
                  });
                }
              }}
              removeClippedSubviews
              onScrollBeginDrag={() => {
                isUserDraggingRef.current = true;
              }}
              onScrollEndDrag={() => {
                isUserDraggingRef.current = false;
              }}
              onMomentumScrollEnd={() => {
                isUserDraggingRef.current = false;
              }}
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingTop: (keyboardVisible ? keyboardLift : 0) + 5,
                paddingBottom: 12,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              ListFooterComponent={() =>
                loadingOlder ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFF"
                    style={{ marginTop: 12 }}
                  />
                ) : null
              }
              renderItem={renderMessageItem}
              onMomentumScrollBegin={() => {
                onEndReachedCalledDuringMomentum.current = false;
              }}

              alwaysBounceVertical
              bounces
              decelerationRate="normal"
              overScrollMode="always"
            />

            {/* Footer */}
            <Animated.View
              style={{ transform: [{ translateY: footerTranslate }] }}
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
                          onPress={() => {
                            const next = attachmentsToSend.filter(
                              (_, i) => i !== idx
                            );
                            setAttachmentsToSend(next);
                            if (activeLaneId) {
                              setLaneDrafts((prev) => ({
                                ...prev,
                                [activeLaneId]: {
                                  input,
                                  attachments: next,
                                  replyingToUuid: replyingTo?.uuid || null,
                                },
                              }));
                            }
                          }}
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
                          style={{ paddingHorizontal: 6, paddingVertical: 8 }}
                        >
                          <MaterialIcons name="close" size={18} color="#BBB" />
                        </Pressable>
                      </View>
                    )}

                <View style={styles.writeContainer}>
<GlassPressable
  onPress={() => {
    Haptics.selectionAsync();
    keyboardWasOpen.current = keyboardVisible;
    Keyboard.dismiss();
    setAttachVisible(true);
  }}
  radius={18}
  padH={10}
  padV={8}
  variant="solid"
  style={{ marginRight: 6, marginLeft: -6,  }}
>
  <MaterialIcons name="add" size={20} color="#EFFFFF" />
</GlassPressable>

  {/* Elastic, bubbly input */}
  <PanGestureHandler
    activeOffsetX={[-5, 5]}
    activeOffsetY={[-5, 5]}
    onGestureEvent={Animated.event(
  [
    {
      nativeEvent: {
        translationX: drag.x,
        translationY: drag.y,
      },
    },
  ],
  {
    useNativeDriver: true,
    listener: (e: any) => {
      const { x, y } = e.nativeEvent || {};
      if (typeof x === 'number' && typeof y === 'number') moveGlow(x, y);
      if (!panActiveRef.current) {
        panActiveRef.current = true;
        showGlow(true);
      }
    },
  }
)}
    onHandlerStateChange={(e) => {
      const st = (e as any).nativeEvent.state;
      if (
        st === GestureState.END ||
        st === GestureState.CANCELLED ||
        st === GestureState.FAILED
      ) {
        Animated.spring(inputDrag, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          stiffness: 300,
          damping: 20,
          mass: 0.4,
        }).start();
      }
    }}
  >
    <Animated.View
      style={[
        styles.inputShell,
        {
          height: inputHeight,          // <- animate container height
          transform: [
            {
              translateX: inputDrag.x.interpolate({
                inputRange: [-100, 100],
                outputRange: [-6, 6],
                extrapolate: "clamp",
              }),
            },
            {
              translateY: inputDrag.y.interpolate({
                inputRange: [-80, 80],
                outputRange: [-4, 4],
                extrapolate: "clamp",
              }),
            },
            {
              scaleX: inputDrag.x.interpolate({
                inputRange: [-80, 0, 80],
                outputRange: [1.04, 1, 1.04],
                extrapolate: "clamp",
              }),
            },
            {
              scaleY: inputDrag.y.interpolate({
                inputRange: [-60, 0, 60],
                outputRange: [1.02, 1, 1.02],
                extrapolate: "clamp",
              }),
            },
          ],
        },
      ]}
    >
      <BlurView
        intensity={GLASS.blurFooter}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.08)",
          "rgba(255,255,255,0.04)",
        ]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* input row */}
      <View style={styles.inputRow}>
        <GlassInput containerStyle={{ flex: 1 }}
          ref={inputRef}
          style={styles.textInput}    // no fixed height here
          value={input}
          onChangeText={(t) => {
            // no LayoutAnimation here; it causes jitter on every keystroke
            setInput(t);
            if (activeLaneId) {
              setLaneDrafts((prev) => ({
                ...prev,
                [activeLaneId]: {
                  input: t,
                  attachments: prev[activeLaneId]?.attachments ?? [],
                  replyingToUuid: replyingTo?.uuid || null,
                },
              }));
            }
          }}
          onContentSizeChange={(e) => {
  const rawH = Math.ceil(e.nativeEvent.contentSize.height);
  const nextH = Math.min(
    INPUT_MAX_HEIGHT,
    Math.max(INPUT_MIN_HEIGHT, rawH)
  );
  if (nextH !== lastMeasuredHeightRef.current) {
    lastMeasuredHeightRef.current = nextH;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setInputHeight(nextH);
  }
}}
          placeholder="Message..."                // placeholder handled by overlay
          multiline
          scrollEnabled={false}         // let the outer container grow
          textAlignVertical="top"
          autoCorrect
          autoCapitalize="sentences"
          underlineColorAndroid="transparent"
          selectTextOnFocus={false}
          blurOnSubmit={false}
          onSubmitEditing={() => {
            if (showSend) handleSend();
          }}
          accessibilityLabel="Message input"
        />

        
      </View>
    </Animated.View>
  </PanGestureHandler>
  {input.trim() !== "" && (
  <Animated.View
          style={[
            styles.sendBtnWrap,
            {
              opacity: sendAnim,
              transform: [
                {
                  scale: sendAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={showSend ? "auto" : "none"}
        >
          <GlassPressable
            onPress={handleSend}
            radius={16}
            padH={10}
            padV={8}
            variant="solid"
            haptics="light"
          >
            <MaterialIcons name="send" size={18} color="#EFFFFF" />
          </GlassPressable>
        </Animated.View>
                )}
</View>
                  </View>
                )}
              </View>
            </Animated.View>
          </Animated.View>

          {/* Reaction overlay (long-press) */}
          <ReactionOverlay
            visible={!!focusedMessage && !!overlayLayout}
            layout={overlayLayout}
            message={focusedMessage}
            theme={{
              bubbleOwn: accentColor,
              bubbleOther: theme.bubbleOther,
              textOnOwn: theme.textOnOwn,
              textOnOther: theme.textOnOther,
              backdropTintIntensity: theme.backdropTintIntensity,
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
                Clipboard.setString(focusedMessage.text);
              setFocusedMessage(null);
              setOverlayLayout(null);
            }}
            onUnsend={() => {
              if (focusedMessage) handleUnsend(focusedMessage);
              setFocusedMessage(null);
              setOverlayLayout(null);
            }}
            onShowSummary={() => {}}
            onToggleReaction={(type) => {
              if (focusedMessage) handleToggleReaction(focusedMessage, type);
              setFocusedMessage(null);
              setOverlayLayout(null);
            }}
          />

          {/* Attach menu */}
          <AttachMenu
            visible={attachVisible}
            onDismiss={() => {
              setAttachVisible(false);
              if (keyboardWasOpen.current && inputRef.current)
                inputRef.current.focus();
              keyboardWasOpen.current = false;
            }}
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
              setAccentColor(THEMES[next].accent);
              persistPrefs({ themeIdx: next, accentColor: THEMES[next].accent });
            }}
            onStartPoll={() => Alert.alert("Poll", "Coming soon")}
            onStartVoice={() => Alert.alert("Voice note", "Coming soon")}
            onShareLocation={() => Alert.alert("Location", "Coming soon")}
            onSchedule={() => Alert.alert("Schedule message", "Coming soon")}
            onCamera={() => Alert.alert("Camera", "Coming soon")}
            onDocument={() => Alert.alert("Document", "Coming soon")}
          />

          {/* Details */}
          <ChatDetailsSheet
            visible={showDetails}
            onClose={() => setShowDetails(false)}
            conversation={conversation}
            conversationId={conversationId}
            lanes={lanes}
            activeLaneId={activeLaneId}
            onSetActiveLane={(id) => setActiveLaneId(id)}
            onCreateLane={async (title) => {
              try {
                const res = await callApiRef.current(
                  `messages/contexts/${conversationId}/`,
                  "POST",
                  {
                    title,
                    emoji: "view-agenda",
                    color: accentColor,
                  }
                );
                const lane = res.data as Lane;
                setLanes((p) => [lane, ...p]);
                setActiveLaneId(lane.id);
              } catch {}
            }}
            onArchiveLane={async (id) => {
              await apiUpdateLane(id, { is_archived: true });
              setActiveLaneId((prev) =>
                prev === id ? lanes.find((l) => l.id !== id)?.id ?? null : prev
              );
            }}
            onUpdateLane={async (id, patch) => {
              await apiUpdateLane(id, patch);
            }}
            onDeleteLane={apiDeleteLane}
            themeName={THEMES[themeIdx].name}
            // NEW: explicit theme/app/appearance handlers
            onApplyTheme={(id) => {
              const idx = Math.max(
                0,
                THEMES.findIndex((t) => t.id === id)
              );
              setThemeIdx(idx);
              const nextAccent = THEMES[idx].accent;
              setAccentColor(nextAccent);
              persistPrefs({ themeIdx: idx, accentColor: nextAccent });
            }}
            onPickBackground={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: false,
              });
              if (!result.canceled && result.assets[0]?.uri) {
                setBgImage(result.assets[0].uri);
                persistPrefs({ bgImage: result.assets[0].uri });
              }
            }}
            onUseDefaultBlack={() => {
              setBgImage(null);
              persistPrefs({ bgImage: null });
            }}
            onSetAccent={(hex) => {
              setAccentColor(hex);
              persistPrefs({ accentColor: hex });
            }}
            mode={mode}
            onSetMode={(m) => {
              setMode(m);
              persistPrefs({ mode: m });
            }}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  containerWithoutOverflow: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  identityBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    minHeight: 44,
  },
  avatarGroupWide: {
    width: 64,
    height: 32,
    marginLeft: 8,
  },
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
  stackedAvatar: {
    width: 28,
    height: 28,
  },
  identityTextCol: {
    flex: 1,
    marginLeft: 28,
  },
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
  laneText: {
    fontWeight: "900",
  },
  laneTextActive: {
    color: "#EFFFFF",
  },
  laneTextInactive: {
    color: "#d7e7ea",
  },

  bubbleWrap: {
    maxWidth: BUBBLE_MAX_W,
  },
  messageRowOwn: {
    alignSelf: "flex-end",
  },
  messageRowOther: {
    alignSelf: "flex-start",
  },

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
  reactionPillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  emojiText: {
    fontSize: 36,
    lineHeight: 42,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },

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
  timeChipText: {
    color: "#EFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  mediaBubbleContainer: {
    marginTop: 8,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  mediaBubbleOwn: {
    alignSelf: "flex-end",
  },
  mediaBubbleOther: {
    alignSelf: "flex-start",
  },
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
  dateSeparatorText: {
    color: "#d7e7ea",
    fontWeight: "800",
    fontSize: 12,
  },

  chatFooter: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
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
  attachmentThumbnail: {
    width: 68,
    height: 68,
  },
  removeAttachmentBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 12,
    padding: 2,
  },

  requestWarningText: {
    color: "#fff",
    fontWeight: "800",
    textAlign: "center",
  },
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

  footerWrap: {
    paddingHorizontal: 0,
    paddingVertical: 6,
  },
  replyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 6,
    marginBottom: 8,
  },
  replyingBannerText: {
    color: "#cfe5e9",
    fontWeight: "700",
  },

writeContainer: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 10,
  paddingVertical: 6,
  backgroundColor: 'transparent',
},

inputRow: {
  position: "relative",
  flexDirection: "row",
  alignItems: "center",
},
writeInput: {
  flex: 1,
  paddingHorizontal: 12,
  paddingTop: 8,
  paddingBottom: 8,
  fontSize: 16,
  lineHeight: 20,
  color: '#FFF',
  includeFontPadding: false,   // Android: removes extra top padding
  textAlign: 'left',
  textAlignVertical: 'center',    // default; we override dynamically when empty
},

inputShell: {
  flex: 1,
  borderRadius: 20,
  overflow: "hidden",
  minHeight: 44,
  maxHeight: 160,
  paddingHorizontal: 10,
  paddingVertical: 0,
  justifyContent: "center",
},

  footerBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  chatInput: {
    color: "#EFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sendButton: {
    marginLeft: 8,
    alignSelf: "flex-end",
  },

textInput: {
  flex: 1,
  paddingTop: 12,
  paddingBottom: 12,
  paddingHorizontal: 0,
  fontSize: 16,
  lineHeight: 20,
  color: "#EFFFFF",
  includeFontPadding: false,
  // backgroundColor: 'red',
},

// placeholderOverlay: {
//   position: "absolute",
//   left: 8,
//   right: 44, // room for send button
//   top: 0,
//   bottom: 0,
//   justifyContent: "center",
// },

// placeholderText: {
//   fontSize: 16,
//   color: "rgba(231, 255, 255, 0.6)",
// },

sendBtnWrap: {
  marginLeft: 6,
},
});