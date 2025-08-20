// app/(tabs)/messages/ChatOverlay.tsx
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
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Modal,
  Image,
  Linking,
  Alert,
  ImageBackground,
  Keyboard,
} from "react-native";

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
  theme?: { name?: string; themeIdx?: number; bgImage?: string | null } | null;
};

export type Lane = {
  id: string;
  title: string;
  emoji?: string; // MaterialIcons name if present
  color?: string;
  is_archived?: boolean;
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

const DEFAULT_THEME = {
  name: "Midnight",
  bgGradient: ["#05080D", "#071019", "#000000"],
  bubbleOwn: "#147AFF",
  bubbleOther: "rgba(30,31,36,0.35)",
  textOnOwn: "#FFFFFF",
  textOnOther: "#EAFBFF",
  backdropTintIntensity: 50,
};

const THEMES = [
  DEFAULT_THEME,
  {
    name: "Aurora",
    bgGradient: ["#091322", "#0a1e2e", "#063345"],
    bubbleOwn: "#19C37D",
    bubbleOther: "rgba(20,34,54,0.38)",
    textOnOwn: "#00120a",
    textOnOther: "#E7F7F0",
    backdropTintIntensity: 42,
  },
  {
    name: "Sunset",
    bgGradient: ["#150a0e", "#26101c", "#310f1f"],
    bubbleOwn: "#FF6B4A",
    bubbleOther: "rgba(42,27,36,0.36)",
    textOnOwn: "#1E0A08",
    textOnOther: "#FFEDE9",
    backdropTintIntensity: 46,
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
  blurBtn: Platform.select({ ios: 14, android: 8, default: 12 }),
  blurHeader: Platform.select({ ios: 22, android: 10, default: 16 }),
  blurFooter: Platform.select({ ios: 16, android: 8, default: 12 }),
  strokeSoft: "rgba(255,255,255,0.14)",
  sheen: "rgba(255,255,255,0.22)",
  fillGhost: "rgba(255,255,255,0.06)",
  fillSolid: "rgba(255,255,255,0.12)",
};

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

  const doHaptics = useCallback(() => {
    if (haptics === "none") return;
    if (haptics === "selection") Haptics.selectionAsync();
    else if (haptics === "light")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (haptics === "medium")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [haptics]);

  return (
    <Animated.View
      style={[
        { borderRadius: radius, transform: [{ scale }], opacity },
        Platform.select({
          ios: {
            shadowColor: "#FFFFFF",
            shadowOpacity: 0.12,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          },
          android: { elevation: 5 },
          default: {},
        }),
        style,
      ]}
    >
      <Pressable
        onPress={() => {
          doHaptics();
          onPress?.();
        }}
        onLongPress={() => {
          if (haptics !== "none")
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onLongPress?.();
        }}
        onPressIn={() =>
          Animated.spring(press, {
            toValue: 1,
            useNativeDriver: true,
            stiffness: 320,
            damping: 20,
            mass: 0.25,
          }).start()
        }
        onPressOut={() =>
          Animated.spring(press, {
            toValue: 0,
            useNativeDriver: true,
            stiffness: 320,
            damping: 20,
            mass: 0.25,
          }).start()
        }
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
                ? ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.06)"]
                : [GLASS.fillGhost, "rgba(255,255,255,0.02)"]
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
          {/* stroke */}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radius,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(255,255,255,0.14)",
              },
            ]}
          />
        </View>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function LiquidBubble({
  children,
  own,
  emojiOnly,
  radius,
  theme,
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
  theme: (typeof THEMES)[number];
  style?: any;
}) {
  const baseColor = own ? theme.bubbleOwn : theme.bubbleOther;
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
  const [inputHeight, setInputHeight] = useState(44);

  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [justSent, setJustSent] = useState(false);

  // lanes / mode / theme
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [activeLaneId, setActiveLaneId] = useState<string | null>(null);
  const [mode, setMode] = useState<ConversationMode>("personal");
  const [themeIdx, setThemeIdx] = useState(0);
  const theme = THEMES[themeIdx];
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

  // --- bubbly effects & swipe-to-time/reply maps ---
  const msgScales = useRef<Record<string, Animated.Value>>({}).current;
  const msgOpacities = useRef<Record<string, Animated.Value>>({}).current;
  const msgPanX = useRef<Record<string, Animated.Value>>({}).current;
  const seenMsgsRef = useRef<Set<string>>(new Set());

  // input liquid-glass glow + stretch
  const inputGlowX = useRef(new Animated.Value(0)).current;
  const inputGlowA = useRef(new Animated.Value(0)).current;
  const [inputShellW, setInputShellW] = useState(0);

  const ensureAnimFor = useCallback(
    (id: string, isOwn: boolean) => {
      if (!msgScales[id])
        msgScales[id] = new Animated.Value(isOwn ? 0.96 : 0.98);
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
          const { themeIdx: serverIdx, bgImage: serverBg } =
            resp.data.theme || {};
          if (typeof serverIdx === "number")
            setThemeIdx(Math.min(Math.max(serverIdx, 0), THEMES.length - 1));
          if (serverBg) setBgImage(serverBg);
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
          if (typeof prefs.bgImage === "string") setBgImage(prefs.bgImage);
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, conversationId]);

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
            },
          }
        );
      } catch {}
    },
    [conversationId, themeIdx, bgImage]
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
                color: "#147AFF",
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
              color: "#147AFF",
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
          color: "#147AFF",
        };
        setLanes((p) => (p.length ? p : [fallback]));
        setActiveLaneId((prev) => prev ?? "default");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, conversationId]);

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

  /* autoscroll (inverted list) - keep at visual bottom without teleporting to top */
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
      const t = setTimeout(() => setJustSent(false), 250);
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
      shownPeople
        .map((u: any) => `@${usernameOf(u) || "unknown"}`)
        .join(", "),
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

    // light haptic on send
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

    // snap to bottom IMMEDIATELY (FlatList is inverted => offset 0 is bottom)
    requestAnimationFrame(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    });

    setJustSent(true);

    const basePayload: any = {
      text: trimmed,
      sender_username: currentUsername,
      conversation: conversationId,
      context: activeLaneId,
      ...(replyingTo && { parent_message_uuid: replyingTo.uuid }),
    };

    setInput("");
    setInputHeight(44);
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

  /* overlay tracking + keyboard (no pulses) */
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const keyboardWasOpen = useRef(false);

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

  const onScroll = (e: any) => {
    const { contentOffset } = e.nativeEvent;
    const nearBottom = contentOffset.y <= 50; // inverted list
    setUserScrolledUp(!nearBottom);

    if (focusedMessage) {
      const ref = bubbleRefs.current[focusedMessage.uuid];
      if (ref) {
        ref.measureInWindow((x, y, w, h) => {
          setOverlayLayout({
            x: clampX(x, w),
            y: clampY(y, h),
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
              {/* reactions cluster above bubble like iMessage */}
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
              <Animated.View style={[styles.timeChip, { opacity: timeOpacity }]}>
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
              { top: insets.top, bottom: 0, transform: [{ translateY }] },
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
                colors={theme.bgGradient}
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
                              color: theme.bubbleOwn,
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
                            color: theme.bubbleOwn,
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
                          ? styles.lanePillActive
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
              }}
              windowSize={10}
              maxToRenderPerBatch={20}
              initialNumToRender={20}
              removeClippedSubviews
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingTop: 16,
                paddingBottom: 8,
              }}
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
            />

            {/* Footer */}
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.select({ ios: 40, android: 80 })}
            >
              <View
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
                    <BlurView
                      intensity={GLASS.blurFooter}
                      tint="dark"
                      style={styles.footerBlur}
                    />
                    {/* <LinearGradient
                      colors={[
                        "rgba(255,255,255,0.08)",
                        "rgba(255,255,255,0.02)",
                      ]}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    /> */}

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

                    {/* Composer (no auto scaling; interactive glow+stretch only) */}
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
                        padV={6}
                        variant="solid"
                        style={{ marginRight: 8 }}
                      >
                        <MaterialIcons name="add" size={20} color="#EFFFFF" />
                      </GlassPressable>

                      {/* Liquid glass input with moving glow + stretch */}
                      <PanGestureHandler
                        onGestureEvent={Animated.event(
                          [{ nativeEvent: { x: inputGlowX } }],
                          { useNativeDriver: false }
                        )}
                        onHandlerStateChange={(e) => {
                          const st = (e as any).nativeEvent.state;
                          if (
                            st === GestureState.ACTIVE ||
                            st === GestureState.BEGAN
                          ) {
                            Animated.timing(inputGlowA, {
                              toValue: 1,
                              duration: 120,
                              useNativeDriver: true,
                            }).start();
                          } else if (
                            st === GestureState.END ||
                            st === GestureState.CANCELLED ||
                            st === GestureState.FAILED
                          ) {
                            Animated.timing(inputGlowA, {
                              toValue: 0,
                              duration: 220,
                              useNativeDriver: true,
                            }).start();
                          }
                        }}
                      >
                        <Animated.View
                          style={[
                            styles.inputShell,
                            {
                              transform: [
                                {
                                  scaleX: inputShellW
                                    ? (inputGlowX as any).interpolate({
                                        inputRange: [
                                          0,
                                          inputShellW * 0.12,
                                          inputShellW * 0.88,
                                          inputShellW,
                                        ],
                                        outputRange: [1.04, 1, 1, 1.06],
                                        extrapolate: "clamp",
                                      })
                                    : 1,
                                },
                              ],
                            },
                          ]}
                          onLayout={(e) => {
                            setInputShellW(e.nativeEvent.layout.width);
                            inputGlowX.setValue(
                              e.nativeEvent.layout.width / 2
                            );
                          }}
                        >
                          <Animated.View
                            pointerEvents="none"
                            style={[
                              styles.inputGlow,
                              {
                                opacity: inputGlowA,
                                transform: [
                                  {
                                    translateX: Animated.subtract(
                                      inputGlowX,
                                      40
                                    ),
                                  },
                                ],
                              },
                            ]}
                          />
                          <TextInput
                            ref={inputRef}
                            style={[
                              styles.chatInput,
                              {
                                minHeight: 44,
                                height: Math.min(
                                  Math.max(44, inputHeight),
                                  140
                                ),
                                maxHeight: 140,
                              },
                            ]}
                            placeholder={`Message${
                              lanes.find((l) => l.id === activeLaneId)?.title
                                ? ` ${
                                    lanes.find((l) => l.id === activeLaneId)
                                      ?.title
                                  }`
                                : ""
                            }`}
                            placeholderTextColor="#99AAB0"
                            value={input}
                            onChangeText={(t) => {
                              setInput(t);
                              if (activeLaneId) {
                                setLaneDrafts((prev) => ({
                                  ...prev,
                                  [activeLaneId]: {
                                    input: t,
                                    attachments:
                                      prev[activeLaneId]?.attachments ?? [],
                                    replyingToUuid: replyingTo?.uuid || null,
                                  },
                                }));
                              }
                            }}
                            multiline
                            onContentSizeChange={(e) =>
                              setInputHeight(e.nativeEvent.contentSize.height)
                            }
                            returnKeyType="send"
                            onSubmitEditing={() => {
                              if (
                                input.trim() ||
                                attachmentsToSend.length
                              )
                                handleSend();
                            }}
                          />
                        </Animated.View>
                      </PanGestureHandler>

                      {input.trim() !== "" && (
                        <GlassPressable
                          onPress={handleSend}
                          style={styles.sendButton}
                          accessibilityLabel="Send message"
                          radius={18}
                          padH={10}
                          padV={6}
                          variant="solid"
                          haptics="light"
                        >
                          <FontAwesome
                            name="send"
                            size={18}
                            color="rgba(255,255,255,0.95)"
                          />
                        </GlassPressable>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </Animated.View>

          {/* Reaction overlay (long-press) */}
          <ReactionOverlay
            visible={!!focusedMessage && !!overlayLayout}
            layout={overlayLayout}
            message={focusedMessage}
            theme={{
              bubbleOwn: theme.bubbleOwn,
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
              persistPrefs({ themeIdx: next });
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
                    color: theme.bubbleOwn,
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
            onCycleTheme={() => {
              const next = (themeIdx + 1) % THEMES.length;
              setThemeIdx(next);
              persistPrefs({ themeIdx: next });
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
            mode={mode}
            onSetMode={async (next) => {
              setMode(next);
              try {
                await callApiRef.current(
                  `messages/conversations/${conversationId}/mode/`,
                  "PATCH",
                  { mode: next }
                );
              } catch {}
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.38)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },

  orb: { position: "absolute", borderRadius: 999 },

  headerActionsRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  headerBlur: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },

  identityBar: {
    flexDirection: "row",
    flex: 1,
    flexGrow: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  avatarGroupWide: {
    width: 56,
    height: 40,
    position: "relative",
    marginRight: 4,
  },
  avatarWrapper: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: "rgba(0,0,0,0.6)",
    backgroundColor: "rgba(20,22,26,0.5)",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  stackedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333",
  },
  identityTextCol: { flexDirection: "column", flex: 1, minWidth: 0 },
  chatHeaderName: {
    fontSize: 15, // compact
    fontWeight: "900",
    color: "#EFFFFF",
    letterSpacing: 0.25,
  },
  chatHeaderUsername: { fontSize: 11, color: "#b7d5db", marginTop: 1 },

  // lanes
  lanePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  lanePillActive: {
    backgroundColor: "rgba(255,255,255,0.12)", // neutral fill
  },
  lanePillInactive: {
    backgroundColor: "transparent",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  laneText: { fontWeight: "900" },
  laneTextActive: { color: "#EFFFFF" },
  laneTextInactive: { color: "#d7e7ea" },

  messageRowOwn: { alignSelf: "flex-end" },
  messageRowOther: { alignSelf: "flex-start" },

  bubbleWrap: { maxWidth: BUBBLE_MAX_W },

  messageText: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  emojiText: { fontSize: 40, lineHeight: 44 },

  // time chip that appears when pulling left
  timeChip: {
    position: "absolute",
    right: -56,
    top: 8,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
  },
  timeChipText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  mediaBubbleContainer: { marginTop: 6, borderRadius: 18, overflow: "hidden" },
  mediaBubbleOwn: { alignSelf: "flex-end" },
  mediaBubbleOther: { alignSelf: "flex-start" },
  largeMediaFull: {
    width: SCREEN_WIDTH * 0.75 - 4,
    height: (SCREEN_WIDTH * 0.75 - 4) * (9 / 16),
    backgroundColor: "#000",
  },

  // reactions
  reactCluster: {
    position: "absolute",
    top: -18,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  reactClusterOwn: { right: 6 },
  reactClusterOther: { left: 6 },
  reactChip: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  reactionPillText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  footerWrap: { position: "relative", paddingHorizontal: 8, paddingTop: 4 },
  footerBlur: { width: "100%", position: "absolute", top: 0, bottom: 0 },
  chatFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    // borderTopColor: "rgba(255,255,255,0.12)",
    backgroundColor: "transparent",
  },

  replyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  replyingBannerText: {
    color: "#EFFFFF",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },

  writeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 100,
    marginHorizontal: 1,
    marginVertical: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },

  inputShell: {
    flex: 1,
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  // moving glow inside the input
  inputGlow: {
    position: "absolute",
    top: 2,
    bottom: 2,
    width: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },

  chatInput: {
    flex: 1,
    fontSize: 17,
    color: "#EFFFFF",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 11 : 8,
    textAlignVertical: "top",
  },
  sendButton: { marginLeft: 8 },

  attachmentsPreview: {
    maxHeight: 150,
    marginBottom: 6,
    marginHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 5,
  },
  attachmentPreview: {
    marginRight: 10,
    marginBottom: 10,
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  attachmentThumbnail: { width: "100%", height: "100%" },
  removeAttachmentBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 2,
  },

  dateSeparatorText: {
    color: "#cfe4ea",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  branchLine: {
    width: 2,
    height: 18,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
  },
  parentPreviewText: {
    color: "#dbeef2",
    fontSize: 12,
    fontWeight: "700",
    maxWidth: SCREEN_WIDTH * 0.6,
  },

  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginTop: 6,
  },
  requestBtnTextPrimary: {
    color: "#00120a",
    fontWeight: "900",
    textAlign: "center",
  },
  requestBtnTextSubtle: {
    color: "#EFFFFF",
    fontWeight: "900",
    textAlign: "center",
  },
  requestBtnTextDanger: {
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
  },

  requestWarningText: {
    color: "#ffd5d5",
    fontWeight: "800",
    textAlign: "center",
  },
});