import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
  InteractionManager,
  Linking,
  Switch,
} from "react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import useApi from "@/hooks/useApi";
import type { Lane } from "@/app/(tabs)/messages/ChatOverlay";

const { width: W, height: H } = Dimensions.get("window");

/* =========================
   Liquid Glass tokens (NOT frosty)
========================= */
const ACCENT_DEFAULT = "#17D4FF";
const BLUR = {
  backdrop: Platform.select({ ios: 32, android: 18, default: 22 }),
  sheet: Platform.select({ ios: 18, android: 12, default: 14 }),
  chip: Platform.select({ ios: 10, android: 8, default: 9 }),
} as const;

const COLORS = {
  textPrimary: "#EAF6F8",
  textSecondary: "#A1B8C2",
  textMuted: "#8FA1AB",
  border: "rgba(255,255,255,0.12)",
  ghostOverlay: "rgba(255,255,255,0.03)", // almost clear
  solidOverlay: "rgba(23,212,255,0.18)", // liquid cyan tint when active
  focus: "#7FD1FF",
  danger: "#FF6B6B",
  black: "#000000",
};

/* =========================
   Types
========================= */
type Summary = {
  media: { id: string; url: string; mime_type: string }[];
  files: { id: string; name: string; url: string }[];
  links: { id: string; url: string; title?: string }[];
};

type Mode =
  | "personal"
  | "work"
  | "family"
  | "dating"
  | "travel"
  | "events"
  | "wellness";

type Props = {
  visible: boolean;
  onClose: () => void;

  conversation: any;
  conversationId: string;

  lanes: Lane[];
  activeLaneId: string | null;
  onSetActiveLane: (id: string) => void;
  onCreateLane: (title: string) => void;
  onArchiveLane: (id: string) => void;
  onUpdateLane: (
    id: string,
    patch: Partial<
      Lane & {
        mute?: boolean;
        ephemeralSeconds?: number | null;
        autoArchiveDays?: number | null;
        pinned?: boolean;
        color?: string;
      }
    >
  ) => void;
  onDeleteLane: (id: string) => void;

  themeName: string;

  // theme + appearance hooks (wired from ChatOverlay)
  onApplyTheme: (id: string) => void; // set theme by id
  onPickBackground: () => void; // open picker, set bg
  onUseDefaultBlack: () => void; // set bg to default black
  onSetAccent: (hex: string) => void; // set accent color

  mode: Mode;
  onSetMode?: (m: Mode) => void; // safe setter (no crash if missing)
};

const TABS = [
  "Profile",
  "Media",
  "Files",
  "Links",
  "Lanes",
  "Theme",
  "Settings",
] as const;

/* =========================
   Liquid Glass Pressable — compact pills
========================= */
function GlassPressable({
  children,
  onPress,
  onLongPress,
  onLayout,
  style,
  radius = 18,
  padH = 16,
  padV = 10,
  accessibilityLabel,
  variant = "ghost",
}: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onLayout?: (e: any) => void;
  style?: any;
  radius?: number;
  padH?: number;
  padV?: number;
  accessibilityLabel?: string;
  variant?: "solid" | "ghost";
}) {
  const a = useRef(new Animated.Value(0)).current;
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] });
  const ink = a.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] });

  const onIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(a, {
      toValue: 1,
      useNativeDriver: true,
      stiffness: 320,
      damping: 22,
      mass: 0.25,
    }).start();
  };
  const onOut = () => {
    Animated.spring(a, {
      toValue: 0,
      useNativeDriver: true,
      stiffness: 320,
      damping: 22,
      mass: 0.25,
    }).start();
  };

  const overlayColor =
    variant === "solid" ? COLORS.solidOverlay : COLORS.ghostOverlay;

  return (
    <Animated.View style={[{ transform: [{ scale }], borderRadius: radius }, style]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onIn}
        onPressOut={onOut}
        onLayout={onLayout}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{
          borderRadius: radius,
          overflow: "hidden",
          paddingHorizontal: padH,
          paddingVertical: padV,
          backgroundColor: "transparent",
        }}
      >
        {/* Liquid background (no frost) */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <BlurView intensity={BLUR.chip} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor }]} />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: radius,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: COLORS.border,
              },
            ]}
          />
          {/* subtle diagonal specular sweep */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0)",
              "rgba(255,255,255,0.22)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0.1 }}
            end={{ x: 1, y: 0.9 }}
            style={{
              position: "absolute",
              left: -60,
              right: -60,
              top: 0,
              bottom: 0,
              opacity: variant === "solid" ? 0.22 : 0.1,
            }}
          />
          {/* press ink */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: ink }]}
          />
        </View>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export default function ChatDetailsSheet({
  visible,
  onClose,
  conversation,
  conversationId,
  lanes,
  activeLaneId,
  onSetActiveLane,
  onCreateLane,
  onArchiveLane,
  onUpdateLane,
  onDeleteLane,
  themeName,
  onApplyTheme,
  onPickBackground,
  onUseDefaultBlack,
  onSetAccent,
  mode,
  onSetMode,
}: Props) {
  const { callApi } = useApi();
  const insets = useSafeAreaInsets();

  // open + drag
  const open = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // tabs + summary + scroll memory
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const [summary, setSummary] = useState<Summary>({
    media: [],
    files: [],
    links: [],
  });
  const tabsScrollRef = useRef<ScrollView>(null);
  const tabsScrollX = useRef(0);
  const tabsViewportW = useRef(W);
  const tabsContentW = useRef(0);
  const tabScrollY = useRef<Record<string, number>>({}).current;

  // conversation-ish local settings
  const [readReceipts, setReadReceipts] = useState<boolean>(
    conversation?.settings?.read_receipts ?? true
  );
  const [showPresence, setShowPresence] = useState<boolean>(
    conversation?.settings?.show_presence ?? true
  );
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(
    conversation?.last_seen_at ?? null
  );

  // appearance local
  const [accent, setAccent] = useState<string>(ACCENT_DEFAULT);
  const [selectedTheme, setSelectedTheme] = useState<string>(themeName);

  // Mode (safe locally)
  const [localMode, setLocalMode] = useState<Mode>(mode);
  const setModeSafe = (m: Mode) => {
    setLocalMode(m);
    if (typeof onSetMode === "function") onSetMode(m);
  };

  // media preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // settings sub-pages
  type SettingsPage = "root" | "general" | "privacy" | "notifications" | "advanced";
  const [settingsPage, setSettingsPage] = useState<SettingsPage>("root");

  // transforms
  const topAnchor = Math.max(insets.top + 56, H * 0.16);
  const translateY = Animated.add(
    open.interpolate({ inputRange: [0, 1], outputRange: [H, topAnchor] }),
    dragY
  );
  const backdropOpacity = open.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const containerScale = open.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1],
  });

  // open/close
  useEffect(() => {
    Animated.timing(open, {
      toValue: visible ? 1 : 0,
      duration: visible ? 300 : 180,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!visible && finished) dragY.setValue(0);
    });
  }, [visible]);

  const animateClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(open, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(onClose);
  };

  // swipe to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx) * 1.05,
      onPanResponderMove: (_, g) => dragY.setValue(g.dy > 0 ? g.dy : 0),
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.vy > 1.0 || g.dy > H * 0.18;
        if (shouldClose) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          animateClose();
        } else {
          Haptics.selectionAsync();
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
            speed: 20,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 20,
        }).start();
      },
    })
  ).current;

  // fetch media/files/links summary (Links tab now lists links from chat)
  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    const task = InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          const res = await callApi(`messages/summary/${conversationId}/`);
          if (mounted)
            setSummary(res.data || { media: [], files: [], links: [] });
        } catch {
          if (mounted) setSummary({ media: [], files: [], links: [] });
        }
      })();
    });
    return () => {
      mounted = false;
      task.cancel?.();
    };
  }, [visible, conversationId]);

  // PATCH helper (guarded)
  const updateSettings = async (patch: any) => {
    try {
      await callApi(
        `messages/conversations/${conversationId}/settings/`,
        "PATCH",
        patch
      );
    } catch {
      // optional backend; ignore failure
    }
  };

  const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

  /* ============ UI bits ============ */

  const TabsPill = React.memo(
    ({
      label,
      active,
      onPress,
      icon,
    }: {
      label: string;
      active?: boolean;
      onPress: () => void;
      icon?: keyof typeof MaterialIcons.glyphMap;
    }) => (
      <GlassPressable
        variant={active ? "solid" : "ghost"}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        radius={18}
        padH={16}
        padV={10}
        style={{ marginHorizontal: 6 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {icon ? (
            <MaterialIcons
              name={icon}
              size={16}
              color={COLORS.textPrimary}
              style={{ marginRight: 8, opacity: 0.9 }}
            />
          ) : null}
          <Text style={styles.pillText}>{label}</Text>
        </View>
      </GlassPressable>
    )
  );

  const Empty = ({ text }: { text: string }) => (
    <View style={styles.emptyWrap}>
      <MaterialIcons name="inbox" size={22} color="#9aa0a6" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  const TabsBar = () => (
    <View style={styles.tabsBar}>
      <ScrollView
        ref={tabsScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        onScroll={(e) => (tabsScrollX.current = e.nativeEvent.contentOffset.x)}
        onMomentumScrollEnd={(e) => (tabsScrollX.current = e.nativeEvent.contentOffset.x)}
        onScrollEndDrag={(e) => (tabsScrollX.current = e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        onLayout={(e) => {
          tabsViewportW.current = e.nativeEvent.layout.width;
        }}
        onContentSizeChange={(w) => {
          tabsContentW.current = w;
        }}
      >
        {TABS.map((t) => (
          <TabsPill key={t} label={t} active={tab === t} onPress={() => setTab(t)} />
        ))}
      </ScrollView>
    </View>
  );

  // keep tab-bar position stable (don’t auto-scroll it on tab change)
  useEffect(() => {
    const ref = tabsScrollRef.current;
    if (ref) ref.scrollTo({ x: tabsScrollX.current || 0, animated: false });
  }, [tab]);

  /* ============ Sections ============ */

  const ProfileTab = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Profile"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Profile"] || 0 }}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="groups" size={20} color={COLORS.textSecondary} />
        <Text style={styles.sectionHeaderText}>Participants</Text>
      </View>

      {conversation?.participants?.map((p: any) => (
        <View key={p.user.id} style={styles.personRow}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.personName}>
              {p.user.first_name} {p.user.last_name}
            </Text>
            <Text style={styles.personHandle}>@{p.user.username}</Text>
          </View>
        </View>
      ))}

      {(!conversation?.participants || conversation.participants.length === 0) && (
        <Empty text="No participants" />
      )}
    </ScrollView>
  );

  const MediaTab = () => (
    <>
      <FlatList
        contentContainerStyle={styles.mediaGrid}
        numColumns={3}
        data={summary.media}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => setImagePreview(item.url)} style={styles.mediaThumbWrap}>
            <Image source={{ uri: item.url }} style={styles.mediaThumb} />
          </Pressable>
        )}
        ListEmptyComponent={<Empty text="No media yet" />}
      />
      <Modal
        transparent
        visible={!!imagePreview}
        animationType="fade"
        onRequestClose={() => setImagePreview(null)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setImagePreview(null)}>
          <BlurView intensity={BLUR.backdrop} tint="dark" style={StyleSheet.absoluteFill} />
          {imagePreview ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: imagePreview }} style={styles.previewImage} resizeMode="contain" />
            </View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );

  const FilesTab = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Files"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Files"] || 0 }}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="insert-drive-file" size={20} color={COLORS.textSecondary} />
        <Text style={styles.sectionHeaderText}>Files</Text>
      </View>
      {summary.files.length === 0 ? (
        <Empty text="No files yet" />
      ) : (
        summary.files.map((f) => (
          <GlassPressable
            key={f.id}
            radius={14}
            padH={12}
            padV={12}
            style={{ marginBottom: 10 }}
            variant="solid"
            onPress={() => openUrl(f.url)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons
                name="insert-drive-file"
                size={20}
                color={COLORS.textPrimary}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.rowText} numberOfLines={1}>
                {f.name}
              </Text>
            </View>
          </GlassPressable>
        ))
      )}
    </ScrollView>
  );

  const LinksTab = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Links"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Links"] || 0 }}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="link" size={20} color={COLORS.textSecondary} />
        <Text style={styles.sectionHeaderText}>Links</Text>
      </View>

      {summary.links.length === 0 ? (
        <Empty text="No links yet" />
      ) : (
        summary.links.map((l) => (
          <GlassPressable
            key={l.id}
            radius={14}
            padH={12}
            padV={12}
            style={{ marginBottom: 10 }}
            variant="solid"
            onPress={() => openUrl(l.url)}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons
                name="link"
                size={20}
                color={COLORS.textPrimary}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.rowText} numberOfLines={1}>
                {l.title || l.url}
              </Text>
            </View>
          </GlassPressable>
        ))
      )}
    </ScrollView>
  );

  const LaneRules = ({ lane }: { lane: Lane }) => {
    const [mute, setMute] = useState<boolean>((lane as any).mute ?? false);
    const [pinned, setPinned] = useState<boolean>((lane as any).pinned ?? false);
    const [ephemeralSeconds, setEphemeralSeconds] = useState<number | null>(
      (lane as any).ephemeralSeconds ?? null
    );
    const [autoArchiveDays, setAutoArchiveDays] = useState<number | null>(
      (lane as any).autoArchiveDays ?? null
    );

    useEffect(() => {
      setMute((lane as any).mute ?? false);
      setPinned((lane as any).pinned ?? false);
      setEphemeralSeconds((lane as any).ephemeralSeconds ?? null);
      setAutoArchiveDays((lane as any).autoArchiveDays ?? null);
    }, [lane]);

    const savePatch = (patch: any) => onUpdateLane(lane.id, patch);

    return (
      <View style={styles.rulesCard}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Mute notifications</Text>
          <Switch
            value={mute}
            onValueChange={(v) => {
              setMute(v);
              savePatch({ mute: v });
            }}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Pin lane</Text>
          <Switch
            value={pinned}
            onValueChange={(v) => {
              setPinned(v);
              savePatch({ pinned: v });
            }}
          />
        </View>

        <View style={{ height: 10 }} />

        <Text style={styles.sectionLabel}>Ephemeral messages</Text>
        <View style={styles.segmentRow}>
          {[null, 3600, 21600, 86400].map((s, idx) => (
            <GlassPressable
              key={idx}
              variant={ephemeralSeconds === s ? "solid" : "ghost"}
              onPress={() => {
                setEphemeralSeconds(s);
                savePatch({ ephemeralSeconds: s });
              }}
              radius={14}
              padH={12}
              padV={8}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              <Text style={styles.rowText}>
                {s === null ? "Off" : s === 3600 ? "1 hr" : s === 21600 ? "6 hr" : "24 hr"}
              </Text>
            </GlassPressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Auto-archive after</Text>
        <View style={styles.segmentRow}>
          {[null, 3, 7, 30].map((d, idx) => (
            <GlassPressable
              key={idx}
              variant={autoArchiveDays === d ? "solid" : "ghost"}
              onPress={() => {
                setAutoArchiveDays(d);
                savePatch({ autoArchiveDays: d });
              }}
              radius={14}
              padH={12}
              padV={8}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              <Text style={styles.rowText}>{d === null ? "Never" : `${d} days`}</Text>
            </GlassPressable>
          ))}
        </View>
      </View>
    );
  };

  const LaneRow = ({ lane, isActive }: { lane: Lane; isActive: boolean }) => {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(lane.title);
    const [iconName, setIconName] = useState<keyof typeof MaterialIcons.glyphMap>(
      (lane.emoji as any) || "view-agenda"
    );

    const RightActions = () => (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => onArchiveLane(lane.id)} style={styles.swipeAction}>
          <MaterialIcons name="archive" size={20} color={COLORS.textPrimary} />
          <Text style={styles.swipeText}>Archive</Text>
        </Pressable>
        <Pressable
          onPress={() => onDeleteLane(lane.id)}
          style={[styles.swipeAction, { backgroundColor: "rgba(255,0,0,0.16)" }]}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.danger} />
          <Text style={[styles.swipeText, { color: COLORS.danger }]}>Delete</Text>
        </Pressable>
      </View>
    );

    return (
      <Swipeable
        renderRightActions={RightActions}
        overshootRight={false}
        friction={1.2}
        rightThreshold={28}
      >
        <View style={styles.laneRow}>
          <Pressable
            onPress={() => onSetActiveLane(lane.id)}
            style={[styles.laneBadge, isActive && { backgroundColor: COLORS.solidOverlay }]}
          >
            <MaterialIcons
              name={iconName as any}
              size={16}
              color={COLORS.textPrimary}
              style={{ marginRight: 6, opacity: 0.9 }}
            />
            <Text style={styles.laneText}>{lane.title}</Text>
          </Pressable>
          <View style={{ flexDirection: "row" }}>
            <GlassPressable
              radius={12}
              padH={10}
              padV={8}
              style={{ marginRight: 8 }}
              onPress={() => setEditing((e) => !e)}
            >
              <MaterialIcons name="edit" size={18} color={COLORS.textPrimary} />
            </GlassPressable>
            <GlassPressable
              radius={12}
              padH={10}
              padV={8}
              onPress={() => onArchiveLane(lane.id)}
            >
              <MaterialIcons name="archive" size={18} color={COLORS.textPrimary} />
            </GlassPressable>
          </View>
        </View>
        {editing && (
          <View style={styles.editorCard}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons
                name={iconName as any}
                size={22}
                color={COLORS.textPrimary}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Lane name"
                placeholderTextColor={COLORS.textMuted}
                style={styles.titleInput}
              />
            </View>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <GlassPressable
                onPress={() => {
                  onUpdateLane(lane.id, { title, emoji: iconName as string });
                  setEditing(false);
                }}
                radius={12}
                padH={12}
                padV={10}
                style={{ marginRight: 8 }}
                variant="solid"
              >
                <Text style={styles.rowText}>Save</Text>
              </GlassPressable>
              <GlassPressable
                onPress={() => setEditing(false)}
                radius={12}
                padH={12}
                padV={10}
              >
                <Text style={styles.rowText}>Cancel</Text>
              </GlassPressable>
            </View>

            <LaneRules lane={lane} />
          </View>
        )}
      </Swipeable>
    );
  };

  const LanesTab = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Lanes"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Lanes"] || 0 }}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="view-agenda" size={20} color={COLORS.textSecondary} />
        <Text style={styles.sectionHeaderText}>Context lanes</Text>
      </View>

      {lanes.length === 0 ? (
        <Empty text="No lanes yet" />
      ) : (
        lanes.map((lane) => (
          <LaneRow key={lane.id} lane={lane} isActive={activeLaneId === lane.id} />
        ))
      )}

      <GlassPressable
        onPress={() => onCreateLane("New lane")}
        radius={999}
        padH={12}
        padV={9}
        style={{ alignSelf: "flex-start", marginTop: 12 }}
        variant="solid"
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="add" size={18} color={COLORS.textPrimary} style={{ marginRight: 6 }} />
          <Text style={styles.rowText}>Add lane</Text>
        </View>
      </GlassPressable>
    </ScrollView>
  );

  const ThemeTab = () => {
    const THEMES = [
      { id: "midnight", name: "Midnight", accent: "#17D4FF", preview: ["#05080D", "#071019"] },
      { id: "violet", name: "Violet", accent: "#A07CFE", preview: ["#0E0B1A", "#140F26"] },
      { id: "emerald", name: "Emerald", accent: "#19C37D", preview: ["#071411", "#0C201A"] },
      { id: "sunset", name: "Sunset", accent: "#FF6B4A", preview: ["#1a0c0e", "#2a111a"] },
      { id: "aurora", name: "Aurora", accent: "#00E3D8", preview: ["#091322", "#0a1e2e"] },
    ];

    const applyTheme = (id: string) => {
      setSelectedTheme(id);
      onApplyTheme(id);
    };

    const accents = ["#17D4FF", "#A07CFE", "#19C37D", "#FFD14A", "#FF6B4A", "#00E3D8"];

    return (
      <ScrollView
        contentContainerStyle={styles.sectionContent}
        onScroll={(e) => (tabScrollY["Theme"] = e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: tabScrollY["Theme"] || 0 }}
      >
        <Text style={styles.sectionLabel}>Theme</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 6 }}>
          {THEMES.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => applyTheme(t.id)}
              style={[styles.themeCard, selectedTheme === t.id && styles.themeCardActive]}
            >
              <LinearGradient
                colors={t.preview as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.themeBubbleRow}>
                <View style={[styles.themeBubble, { backgroundColor: t.accent }]} />
                <View style={[styles.themeBubble, { backgroundColor: "rgba(255,255,255,0.2)" }]} />
                <View style={[styles.themeBubble, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
              </View>
              <Text style={styles.themeName}>{t.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Accent</Text>
        <View style={{ flexDirection: "row", paddingVertical: 4, flexWrap: "wrap" }}>
          {accents.map((c) => (
            <Pressable
              key={c}
              onPress={() => {
                setAccent(c);
                onSetAccent(c);
              }}
              style={[styles.accentDot, { backgroundColor: c }, accent === c && styles.accentDotActive]}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Background</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <GlassPressable
            onPress={onUseDefaultBlack}
            radius={14}
            padH={12}
            padV={10}
            variant="solid"
            style={{ marginRight: 8, marginBottom: 8 }}
          >
            <Text style={styles.rowText}>Use Default Black</Text>
          </GlassPressable>
          <GlassPressable
            onPress={onPickBackground}
            radius={14}
            padH={12}
            padV={10}
            style={{ marginBottom: 8 }}
          >
            <Text style={styles.rowText}>Pick Wallpaper</Text>
          </GlassPressable>
        </View>
      </ScrollView>
    );
  };

  const SettingsRoot = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Settings"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Settings"] || 0 }}
    >
      <Text style={styles.sectionLabel}>Settings</Text>
      <View style={{ height: 6 }} />
      <GlassPressable
        variant="solid"
        radius={14}
        padH={12}
        padV={12}
        onPress={() => setSettingsPage("general")}
        style={{ marginBottom: 8 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="tune" size={20} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
          <Text style={styles.rowText}>General</Text>
        </View>
      </GlassPressable>
      <GlassPressable
        variant="solid"
        radius={14}
        padH={12}
        padV={12}
        onPress={() => setSettingsPage("privacy")}
        style={{ marginBottom: 8 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="privacy-tip" size={20} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
          <Text style={styles.rowText}>Privacy</Text>
        </View>
      </GlassPressable>
      <GlassPressable
        variant="solid"
        radius={14}
        padH={12}
        padV={12}
        onPress={() => setSettingsPage("notifications")}
        style={{ marginBottom: 8 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons
            name="notifications-active"
            size={20}
            color={COLORS.textPrimary}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.rowText}>Notifications</Text>
        </View>
      </GlassPressable>
      <GlassPressable
        variant="solid"
        radius={14}
        padH={12}
        padV={12}
        onPress={() => setSettingsPage("advanced")}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="construction" size={20} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
          <Text style={styles.rowText}>Advanced</Text>
        </View>
      </GlassPressable>
    </ScrollView>
  );

  const SettingsGeneral = () => {
    const modes: Mode[] = useMemo(
      () => ["personal", "work", "family", "dating", "travel", "events", "wellness"],
      []
    );
    return (
      <ScrollView contentContainerStyle={styles.sectionContent}>
        <View style={styles.headerRowWithBack}>
          <Pressable onPress={() => setSettingsPage("root")} style={{ padding: 6, marginRight: 6 }}>
            <MaterialIcons name="chevron-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.sectionHeaderText}>General</Text>
        </View>

        <Text style={styles.sectionLabel}>Mode</Text>
        <View style={[styles.segmentRow, { marginBottom: 8 }]}>
          {modes.map((m) => (
            <GlassPressable
              key={m}
              variant={(localMode || mode) === m ? "solid" : "ghost"}
              onPress={() => setModeSafe(m)}
              radius={16}
              padH={14}
              padV={8}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              <Text style={styles.rowText}>{m.toUpperCase()}</Text>
            </GlassPressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.segmentRow}>
          <GlassPressable variant="solid" radius={14} padH={12} padV={10} onPress={() => setTab("Theme")}>
            <Text style={styles.rowText}>Open Theme</Text>
          </GlassPressable>
        </View>
      </ScrollView>
    );
  };

  const SettingsPrivacy = () => {
    const toggleReadReceipts = async (v: boolean) => {
      setReadReceipts(v);
      await updateSettings({ read_receipts: v });
    };
    const togglePresence = async (v: boolean) => {
      setShowPresence(v);
      await updateSettings({ show_presence: v });
    };
    return (
      <ScrollView contentContainerStyle={styles.sectionContent}>
        <View style={styles.headerRowWithBack}>
          <Pressable onPress={() => setSettingsPage("root")} style={{ padding: 6, marginRight: 6 }}>
            <MaterialIcons name="chevron-left" size={22} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.sectionHeaderText}>Privacy</Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Read receipts</Text>
          <Switch value={readReceipts} onValueChange={toggleReadReceipts} />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Show “Seen now”</Text>
          <Switch value={showPresence} onValueChange={togglePresence} />
        </View>
        {showPresence && lastSeenAt ? (
          <Text style={styles.settingHint}>Last seen: {new Date(lastSeenAt).toLocaleString()}</Text>
        ) : null}
      </ScrollView>
    );
  };

  const SettingsNotifications = () => (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      <View style={styles.headerRowWithBack}>
        <Pressable onPress={() => setSettingsPage("root")} style={{ padding: 6, marginRight: 6 }}>
          <MaterialIcons name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.sectionHeaderText}>Notifications</Text>
      </View>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Message notifications</Text>
        <Switch value={true} onValueChange={() => Haptics.selectionAsync()} />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Mentions only</Text>
        <Switch value={false} onValueChange={() => Haptics.selectionAsync()} />
      </View>
      <Text style={styles.settingHint}>
        Lane-level mute can be set inside each lane’s editor.
      </Text>
    </ScrollView>
  );

  const SettingsAdvanced = () => (
    <ScrollView contentContainerStyle={styles.sectionContent}>
      <View style={styles.headerRowWithBack}>
        <Pressable onPress={() => setSettingsPage("root")} style={{ padding: 6, marginRight: 6 }}>
          <MaterialIcons name="chevron-left" size={22} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.sectionHeaderText}>Advanced</Text>
      </View>

      <GlassPressable
        variant="solid"
        radius={14}
        padH={12}
        padV={12}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        style={{ marginBottom: 8 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="ios-share" size={20} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
          <Text style={styles.rowText}>Export chat (coming soon)</Text>
        </View>
      </GlassPressable>
      <GlassPressable
        variant="ghost"
        radius={14}
        padH={12}
        padV={12}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="delete-forever" size={20} color={COLORS.danger} style={{ marginRight: 10 }} />
          <Text style={[styles.rowText, { color: COLORS.danger }]}>
            Clear cached media (coming soon)
          </Text>
        </View>
      </GlassPressable>
    </ScrollView>
  );

  const SettingsTab = () => {
    switch (settingsPage) {
      case "root":
        return <SettingsRoot />;
      case "general":
        return <SettingsGeneral />;
      case "privacy":
        return <SettingsPrivacy />;
      case "notifications":
        return <SettingsNotifications />;
      case "advanced":
        return <SettingsAdvanced />;
      default:
        return null;
    }
  };

  const Body = () => {
    switch (tab) {
      case "Profile":
        return <ProfileTab />;
      case "Media":
        return <MediaTab />;
      case "Files":
        return <FilesTab />;
      case "Links":
        return <LinksTab />;
      case "Lanes":
        return <LanesTab />;
      case "Theme":
        return <ThemeTab />;
      case "Settings":
        return <SettingsTab />;
      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={animateClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      {/* backdrop — blur appears immediately */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
        pointerEvents="none"
      >
        <BlurView tint="dark" intensity={BLUR.backdrop} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.18)" }]} />
      </Animated.View>

      {/* tap outside to close */}
      <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />

      {/* sheet */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheetWrap,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            transform: [{ translateY }, { scale: containerScale }],
          },
        ]}
      >
        <View style={styles.sheetInner}>
          {/* Liquid glass scaffold */}
          <View pointerEvents="none" style={styles.sheetGlass}>
            <BlurView intensity={BLUR.sheet} tint="light" style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.ghostOverlay }]} />
            <LinearGradient
              colors={["rgba(255,255,255,0.20)", "rgba(255,255,255,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.2 }}
              style={{ position: "absolute", left: 0, right: 0, top: 0, height: 24 }}
            />
            <View style={styles.sheetBorder} />
          </View>

          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Chat Details</Text>
          </View>

          <TabsBar />
          <Body />
        </View>
      </Animated.View>
    </Modal>
  );
}

/* =========================
   STYLES — Liquid Glass & compact UI
========================= */
const styles = StyleSheet.create({
  sheetWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 9999,
    elevation: 1000,
  },
  sheetInner: {
    height: H * 0.84,
    backgroundColor: "transparent",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  sheetGlass: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetBorder: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  handleWrap: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  handle: {
    width: 58,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Tabs
  tabsBar: { paddingBottom: 6 },
  tabsContent: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  pillText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Sections
  headerRowWithBack: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionContent: { padding: 16, paddingBottom: 24 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionHeaderText: { color: COLORS.textSecondary, marginLeft: 6, fontWeight: "700", letterSpacing: 0.2 },

  // People
  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#2b2f3a" },

  personRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  personName: { color: COLORS.textPrimary, fontWeight: "800" },
  personHandle: { color: COLORS.textMuted, fontWeight: "700" },

  // Media
  mediaGrid: { padding: 12 },
  mediaThumbWrap: {
    width: (W - 48) / 3,
    height: (W - 48) / 3,
    borderRadius: 12,
    margin: 6,
    overflow: "hidden",
    backgroundColor: "rgba(10,10,12,0.35)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  mediaThumb: { width: "100%", height: "100%" },
  previewWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  previewImage: { width: W, height: H, maxHeight: H, maxWidth: W },

  rowText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    flexShrink: 1,
  },

  // Lanes
  laneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  laneBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  laneText: { color: COLORS.textPrimary, fontWeight: "800" },

  // Editor + rules
  editorCard: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 0,
  },
  rulesCard: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  titleInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 10,
    color: COLORS.textPrimary,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },

  sectionLabel: {
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Settings
  segmentRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingLabel: { color: COLORS.textPrimary, fontWeight: "700" },
  settingHint: { color: COLORS.textMuted, marginTop: 6 },

  // Empty
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 30 },
  emptyText: { color: "#9aa0a6", fontWeight: "700" },

  // Swipe actions
  swipeAction: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: "center",
  },
  swipeText: { color: COLORS.textPrimary, fontWeight: "700", marginTop: 4 },

  // Theme previews
  themeCard: {
    width: 140,
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    padding: 10,
  },
  themeCardActive: { borderColor: COLORS.focus },
  themeBubbleRow: { flexDirection: "row", marginBottom: 8 },
  themeBubble: { width: 14, height: 14, borderRadius: 7, marginRight: 6 },
  themeName: { color: COLORS.textPrimary, fontWeight: "800" },

  accentDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  accentDotActive: { borderColor: COLORS.focus },
});