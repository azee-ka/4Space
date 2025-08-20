// components/messages/ChatDetailsSheet.tsx
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
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import useApi from "@/hooks/useApi";
import type { Lane } from "@/app/(tabs)/messages/ChatOverlay";

const { width: W, height: H } = Dimensions.get("window");
const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

// =========================
// Design tokens
// =========================
const BLUR_INTENSITY = Platform.select({ ios: 50, android: 9, default: 12 });
// Clearer buttons: even less frost for a more liquid look
const GLASS_BTN_BLUR = Platform.select({ ios: 14, android: 8, default: 12 });
const COLORS = {
  textPrimary: "#EFFFFF",
  textSecondary: "#b7d5db",
  textMuted: "#a8c2c8",
  onGlass: "#EAFBFF",
  neon: "#00F0FF",
  danger: "#ff6b6b",
};

// Reusable glassy pressable: variant-aware, with liquid sheen
function GlassPressable({
  children,
  onPress,
  onLongPress,
  onLayout,
  style,
  radius = 18,
  padH = 14,
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
  const pressA = useRef(new Animated.Value(0)).current;
  const scale = pressA.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const opacity = pressA.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const inkOpacity = pressA.interpolate({ inputRange: [0, 1], outputRange: [0, 0.08] });

  const handleIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pressA, { toValue: 1, useNativeDriver: true, stiffness: 360, damping: 22, mass: 0.25 }).start();
  };
  const handleOut = () => {
    Animated.spring(pressA, { toValue: 0, useNativeDriver: true, stiffness: 360, damping: 22, mass: 0.25 }).start();
  };

  // Softer gradients; clearer liquid glass
  const gradColors =
    variant === "solid"
      ? ["rgba(255,255,255,0.18)", "rgba(255,255,255,0.05)"]
      : ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.02)"];
  const blurIntensity = variant === "solid" ? GLASS_BTN_BLUR + 2 : GLASS_BTN_BLUR;
  const strokeColor = variant === "solid" ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)";
  const solidTint = "rgba(0,180,220,0.06)"; // clearer, less frosty hue

  // liquid-like sheen (moves slightly on press)
  const sheenOpacity = pressA.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });
  const sheenTranslate = pressA.interpolate({ inputRange: [0, 1], outputRange: [-22, 22] });

  return (
    <Animated.View
      style={[
        { transform: [{ scale }], opacity, borderRadius: radius, backgroundColor: "transparent" },
        Platform.select({
          ios: { shadowColor: "#FFFFFF", shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
          android: { elevation: 6 },
          default: {},
        }),
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        onLayout={onLayout}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{
          borderRadius: radius,
          overflow: "hidden",
          backgroundColor: "transparent",
          paddingHorizontal: padH,
          paddingVertical: padV,
        }}
      >
        {/* Glass layers */}
        <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, overflow: "hidden", borderRadius: radius }}>
          <BlurView intensity={blurIntensity} tint="light" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={gradColors} start={{ x: 0.15, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {variant === "solid" && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: solidTint }]} />}

          {/* liquid sheen */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: sheenOpacity, transform: [{ translateX: sheenTranslate }] }]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0.2 }}
              end={{ x: 1, y: 0.8 }}
              style={{ position: "absolute", left: -60, right: -60, top: 0, bottom: 0 }}
            />
          </Animated.View>

          {/* subtle stroke */}
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth, borderColor: strokeColor }]}
          />

          {/* soft ink on press to replace any platform ripple */}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF", opacity: inkOpacity }]} />
        </View>
        {children}
      </Pressable>
    </Animated.View>
  );
}

// =========================
// Types
// =========================
type Summary = {
  media: { id: string; url: string; mime_type: string }[];
  files: { id: string; name: string; url: string }[];
  links: { id: string; url: string; title?: string }[];
};

type Mode = "personal" | "work" | "family" | "dating" | "travel" | "events" | "wellness";

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
  onUpdateLane: (id: string, patch: Partial<Lane>) => void;
  onDeleteLane: (id: string) => void;
  themeName: string;
  onCycleTheme: () => void;
  onPickBackground: () => void;
  mode: Mode;
  onSetMode: (m: Mode) => void;
};

const TABS = ["Profile", "Media", "Files", "Links", "Lanes", "Theme", "Settings"] as const;

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
  onCycleTheme,
  onPickBackground,
  mode,
  onSetMode,
}: Props) {
  const { callApi } = useApi();
  const insets = useSafeAreaInsets();

  // master open + drag
  const open = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // tabs + summary + scroll memory
  const [tab, setTab] = useState<(typeof TABS)[number]>("Profile");
  const [summary, setSummary] = useState<Summary>({ media: [], files: [], links: [] });
  const tabsScrollRef = useRef<ScrollView>(null);
  const tabsScrollX = useRef(0);
  const tabsViewportW = useRef(W);
  const tabsContentW = useRef(0);
  const pillPositions = useRef<Record<string, { x: number; w: number }>>({}).current;
  const tabScrollY = useRef<Record<string, number>>({}).current;

  // derived transforms
  const topAnchor = Math.max(insets.top + 56, H * 0.16);
  const translateY = Animated.add(
    open.interpolate({ inputRange: [0, 1], outputRange: [H, topAnchor] }),
    dragY
  );
  const backdropOpacity = open.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const containerScale = open.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  // open/close
  useEffect(() => {
    Animated.timing(open, {
      toValue: visible ? 1 : 0,
      duration: visible ? 380 : 220,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!visible && finished) {
        dragY.setValue(0);
      }
    });
  }, [visible]);

  const animateClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(open, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(onClose);
  };

  // swipe-down to close — no jump-back
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx) * 1.05,
      onPanResponderMove: (_, g) => dragY.setValue(g.dy > 0 ? g.dy : 0),
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.vy > 1.0 || g.dy > H * 0.18;
        if (shouldClose) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          animateClose();
        } else {
          Haptics.selectionAsync();
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 5, speed: 22 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 5, speed: 22 }).start();
      },
    })
  ).current;

  // fetch summary after interactions to avoid hitching the open animation
  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    const task = InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          const res = await callApi(`messages/summary/${conversationId}/`);
          if (mounted) setSummary(res.data || { media: [], files: [], links: [] });
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

  // ---- UI bits ----

  const Pill = React.memo(
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
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          pillPositions[label] = { x, w: width };
        }}
        onPress={() => {
          Haptics.selectionAsync();
          requestAnimationFrame(() => {
            const pos = pillPositions[label];
            const scroller = tabsScrollRef.current;

            const viewW = tabsViewportW.current || W;
            const current = Math.max(0, tabsScrollX.current || 0);

            // Must match styles.tabsContent paddingHorizontal
            const CONTENT_PAD = 12;
            const SLACK = 1.5; // px tolerance

            if (!pos || !scroller) {
              onPress();
              return;
            }

            const itemL = pos.x;         // position within content
            const itemR = pos.x + pos.w; // right edge within content

            // Effective viewport bounds excluding inner padding
            const effL = current + CONTENT_PAD;
            const effR = current + viewW - CONTENT_PAD;

            // Positive => the pill is clipped on that side
            const leftOverflow = effL - itemL;
            const rightOverflow = itemR - effR;

            // If fully visible (within slack), don't move the scroll
            if (leftOverflow <= SLACK && rightOverflow <= SLACK) {
              onPress();
              return;
            }

            const maxX = Math.max(0, (tabsContentW.current || 0) - viewW);
            const MAX_NUDGE = viewW * 0.25; // cap: quarter screen
            const EXTRA = 4; // tiny buffer so it's not flush to the edge

            let target = current;

            if (leftOverflow > SLACK) {
              const delta = Math.min(leftOverflow + EXTRA, MAX_NUDGE);
              target = Math.max(0, Math.min(current - delta, maxX));
            } else if (rightOverflow > SLACK) {
              const delta = Math.min(rightOverflow + EXTRA, MAX_NUDGE);
              target = Math.max(0, Math.min(current + delta, maxX));
            }

            // Only nudge if the movement is meaningful
            if (Math.abs(target - current) >= 2) {
              tabsScrollX.current = target;
              scroller.scrollTo({ x: target, animated: true });
            }

            // Activate immediately after scheduling the nudge
            onPress();
          });
        }}
        accessibilityLabel={label}
        radius={17}
        padH={14}
        padV={8}
        style={{ marginHorizontal: 6 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {icon ? (
            <MaterialIcons
              name={icon}
              size={16}
              color={active ? COLORS.onGlass : COLORS.textPrimary}
              style={{ marginRight: 8, opacity: 0.9 }}
            />
          ) : null}
          {/* No active text highlight — fill distinguishes active */}
          <Text style={styles.pillText}>{label}</Text>
          {active && <View style={styles.pillGlow} />}
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

  const TabsBar = () => {
    // Restore scroll once on mount (not on every tab change) to avoid resets to 0 when activating rightmost pills
    useEffect(() => {
      const scroller = tabsScrollRef.current;
      if (scroller) scroller.scrollTo({ x: tabsScrollX.current || 0, animated: false });
    }, []);

    return (
      <View style={styles.tabsBar}>
        <View style={styles.tabsTrackWrap}>
          <ScrollView
            ref={tabsScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
            onScroll={(e) => {
              tabsScrollX.current = e.nativeEvent.contentOffset.x;
            }}
            scrollEventThrottle={16}
            onLayout={(e) => {
              tabsViewportW.current = e.nativeEvent.layout.width;
              // Ensure the scroll position is kept after layout changes
              const scroller = tabsScrollRef.current;
              if (scroller) scroller.scrollTo({ x: tabsScrollX.current || 0, animated: false });
            }}
            onContentSizeChange={(w) => {
              tabsContentW.current = w;
              // Keep position if content width changes
              const scroller = tabsScrollRef.current;
              if (scroller) scroller.scrollTo({ x: tabsScrollX.current || 0, animated: false });
            }}
          >
            {TABS.map((t) => (
              <Pill key={t} label={t} active={tab === t} onPress={() => setTab(t)} />
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  // ---- Sections ----

  const ProfileTab = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Profile"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Profile"] || 0 }}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="groups" size={20} color="#a1b7bf" />
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

      {(!conversation?.participants || conversation.participants.length === 0) && <Empty text="No participants" />}
    </ScrollView>
  );

  const MediaTab = () => (
    <FlatList
      contentContainerStyle={styles.mediaGrid}
      numColumns={3}
      data={summary.media}
      keyExtractor={(m) => m.id}
      renderItem={({ item }) => (
        <View style={styles.mediaThumbWrap}>
          <Image source={{ uri: item.url }} style={styles.mediaThumb} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.3)"]} style={StyleSheet.absoluteFill} />
        </View>
      )}
      ListEmptyComponent={<Empty text="No media yet" />}
    />
  );

  const FilesTab = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Files"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Files"] || 0 }}
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="insert-drive-file" size={20} color="#a1b7bf" />
        <Text style={styles.sectionHeaderText}>Files</Text>
      </View>
      {summary.files.length === 0 ? (
        <Empty text="No files yet" />
      ) : (
        summary.files.map((f) => (
          <GlassPressable key={f.id} radius={14} padH={12} padV={12} style={{ marginBottom: 12 }} variant="solid">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="insert-drive-file" size={20} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
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
        <MaterialIcons name="link" size={20} color="#a1b7bf" />
        <Text style={styles.sectionHeaderText}>Links</Text>
      </View>
      {summary.links.length === 0 ? (
        <Empty text="No links yet" />
      ) : (
        summary.links.map((l) => (
          <GlassPressable key={l.id} radius={14} padH={12} padV={12} style={{ marginBottom: 12 }} variant="solid">
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="link" size={20} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
              <Text style={styles.rowText} numberOfLines={1}>
                {l.title || l.url}
              </Text>
            </View>
          </GlassPressable>
        ))
      )}
    </ScrollView>
  );

  const LaneEditorRow = React.memo(({ lane, isActive }: { lane: Lane; isActive: boolean }) => {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(lane.title);
    const [emoji, setEmoji] = useState(lane.emoji || "🗂️");
    const [color, setColor] = useState(lane.color || "#147AFF");
    // --- Icon logic ---
    const [iconName, setIconName] = useState<keyof typeof MaterialIcons.glyphMap>((lane.emoji as any) || "view-agenda");
    const titleRef = useRef<TextInput | null>(null);
    const iconChoices: (keyof typeof MaterialIcons.glyphMap)[] = [
      "work", "assignment", "chat", "bookmark", "lightbulb", "favorite", "flight", "event", "task", "schedule", "folder", "dashboard", "code", "bug-report", "star", "book", "palette", "school", "group", "person", "map", "shopping-cart"
    ];
    useEffect(() => {
      if (editing) setTimeout(() => titleRef.current?.focus(), 0);
    }, [editing]);
    const palette = ["#147AFF", "#19C37D", "#FF6B4A", "#A07CFE", "#FFD14A", "#FF3B30"];

    return (
      <View style={{ paddingVertical: 8 }}>
        <GlassPressable
          onPress={() => onSetActiveLane(lane.id)}
          accessibilityLabel={`Lane ${lane.title}`}
          radius={999}
          padH={12}
          padV={9}
          style={{ alignSelf: "flex-start" }}
          variant={isActive ? "solid" : "ghost"}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name={(lane.emoji as any) || (iconName as any)} size={16} color={COLORS.textPrimary} style={{ marginRight: 6, opacity: 0.9 }} />
            <Text style={styles.laneText}>{lane.title}</Text>
          </View>
          {isActive && <View style={styles.pillGlow} />}
        </GlassPressable>

        <View style={{ flexDirection: "row", marginTop: 8 }}>
          <GlassPressable onPress={() => setEditing((e) => !e)} radius={12} padH={10} padV={8} style={{ marginRight: 8 }}>
            <MaterialIcons name="edit" size={18} color={COLORS.textPrimary} />
          </GlassPressable>
          <GlassPressable onPress={() => onArchiveLane(lane.id)} radius={12} padH={10} padV={8} style={{ marginRight: 8 }}>
            <MaterialIcons name="archive" size={18} color={COLORS.textPrimary} />
          </GlassPressable>
          <GlassPressable onPress={() => onDeleteLane(lane.id)} radius={12} padH={10} padV={8}>
            <MaterialIcons name="delete" size={18} color={COLORS.danger} />
          </GlassPressable>
        </View>

        {editing && (
          <View style={styles.editorCard}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name={iconName as any} size={22} color={COLORS.textPrimary} style={{ marginRight: 8 }} />
              <TextInput
                ref={titleRef}
                value={title}
                onChangeText={setTitle}
                placeholder="Lane name"
                placeholderTextColor="#9bb"
                style={[styles.titleInput, { marginLeft: 0 }]}
                blurOnSubmit={false}
                returnKeyType="done"
              />
            </View>
            <View style={styles.iconGrid}>
              {iconChoices.map((name) => (
                <GlassPressable
                  key={name as string}
                  onPress={() => setIconName(name)}
                  radius={12}
                  padH={8}
                  padV={8}
                  style={[styles.iconChoice, iconName === name && styles.iconChoiceActive]}
                >
                  <MaterialIcons name={name as any} size={18} color={COLORS.textPrimary} />
                </GlassPressable>
              ))}
            </View>
            <View style={styles.paletteRow}>
              {palette.map((c) => (
                <GlassPressable key={c} onPress={() => setColor(c)} radius={14} padH={0} padV={0} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c }} />
                </GlassPressable>
              ))}
            </View>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <GlassPressable
                onPress={() => {
                  onUpdateLane(lane.id, { title, emoji: iconName as string, color });
                  setEditing(false);
                }}
                radius={12}
                padH={12}
                padV={10}
                style={{ marginRight: 8 }}
                variant="solid"
              >
                <Text style={styles.addLaneText}>Save</Text>
              </GlassPressable>
              <GlassPressable
                onPress={() => {
                  setTitle(lane.title);
                  setColor(lane.color || "#147AFF");
                  setIconName(((lane.emoji as any) || "view-agenda") as any);
                  setEditing(false);
                }}
                radius={12}
                padH={12}
                padV={10}
              >
                <Text style={styles.rowText}>Cancel</Text>
              </GlassPressable>
            </View>
          </View>
        )}
      </View>
    );
  });

  const LanesTab = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Lanes"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Lanes"] || 0 }}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
    >
      <View style={styles.sectionHeader}>
        <MaterialIcons name="view-agenda" size={20} color="#a1b7bf" />
        <Text style={styles.sectionHeaderText}>Context lanes</Text>
      </View>

      {lanes.map((lane) => (
        <LaneEditorRow key={lane.id} lane={lane} isActive={activeLaneId === lane.id} />
      ))}

      <GlassPressable onPress={() => onCreateLane("New lane")} radius={999} padH={12} padV={9} style={{ alignSelf: "flex-start", marginTop: 12 }} variant="solid">
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="add" size={18} color={COLORS.onGlass} style={{ marginRight: 6 }} />
          <Text style={styles.addLaneText}>Add lane</Text>
        </View>
        <View style={styles.pillGlow} />
      </GlassPressable>
    </ScrollView>
  );

  const ThemeTab = () => (
    <ScrollView
      contentContainerStyle={styles.sectionContent}
      onScroll={(e) => (tabScrollY["Theme"] = e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      contentOffset={{ x: 0, y: tabScrollY["Theme"] || 0 }}
    >
      <Text style={styles.sectionLabel}>Theme</Text>
      <GlassPressable radius={14} padH={12} padV={12} style={{ marginBottom: 12 }} variant="solid">
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="palette" size={20} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
          <Text style={[styles.rowText, { marginRight: 10 }]}>Cycle theme</Text>
          <GlassPressable onPress={onCycleTheme} radius={999} padH={10} padV={6} variant="solid">
            <Text style={styles.actionChipText}>{themeName}</Text>
          </GlassPressable>
        </View>
      </GlassPressable>

      <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Background</Text>
      <GlassPressable onPress={onPickBackground} radius={14} padH={12} padV={12} variant="solid">
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialIcons name="wallpaper" size={20} color={COLORS.textPrimary} style={{ marginRight: 10 }} />
          <Text style={[styles.rowText]}>Choose background</Text>
        </View>
      </GlassPressable>
    </ScrollView>
  );

  const SettingsTab = () => {
    const modes: Mode[] = useMemo(
      () => ["personal", "work", "family", "dating", "travel", "events", "wellness"],
      []
    );
    return (
      <ScrollView
        contentContainerStyle={styles.sectionContent}
        onScroll={(e) => (tabScrollY["Settings"] = e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: tabScrollY["Settings"] || 0 }}
      >
        <Text style={styles.sectionLabel}>Mode</Text>
        <View style={styles.modeWrap}>
          {modes.map((m) => (
            <View key={m} style={styles.modeItemWrap}>
              <Pill
                label={m.toUpperCase() as any}
                active={mode === m}
                onPress={() => onSetMode(m)}
                icon={
                  m === "work"
                    ? "work"
                    : m === "family"
                    ? "diversity-3"
                    : m === "dating"
                    ? "favorite"
                    : m === "travel"
                    ? "flight"
                    : m === "events"
                    ? "event"
                    : m === "wellness"
                    ? "self-improvement"
                    : "person"
                }
              />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Privacy</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Read receipts</Text>
          <Text style={styles.settingValue}>On</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Vanish after read</Text>
          <Text style={styles.settingValue}>Off</Text>
        </View>
      </ScrollView>
    );
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
      {/* watery backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}>
        <AnimatedBlur tint="dark" intensity={BLUR_INTENSITY} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["rgba(0,40,60,0.45)", "rgba(0,0,0,0.22)"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* tap outside to close */}
      <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} />

      {/* floating orbs (decor) */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={["rgba(0,255,255,0.12)", "transparent"]}
          style={{ position: "absolute", width: 220, height: 220, borderRadius: 110, left: -40, top: insets.top + 60 }}
        />
        <LinearGradient
          colors={["rgba(160,124,254,0.10)", "transparent"]}
          style={{ position: "absolute", width: 260, height: 260, borderRadius: 130, right: -60, top: H * 0.22 }}
        />
      </View>

      {/* Sheet */}
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
   STYLES
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
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
  },

  handleWrap: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  handle: {
    width: 58,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
    shadowColor: COLORS.neon,
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  title: {
    color: COLORS.textPrimary,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.35,
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },

  // Tabs
  tabsBar: { paddingBottom: 6, backgroundColor: "transparent" },
  tabsTrackWrap: { position: "relative", marginTop: 2 },
  tabsContent: { alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  pillGlow: {
    position: "absolute",
    left: -14,
    right: -14,
    top: -14,
    bottom: -14,
    borderRadius: 999,
    shadowColor: COLORS.neon,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  pillText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.35,
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  // Sections & rows
  sectionContent: { padding: 16, paddingBottom: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionHeaderText: { color: COLORS.textSecondary, marginLeft: 6, fontWeight: "800", letterSpacing: 0.3 },

  avatarRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,240,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#2b2f3a" },

  personRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },

  mediaGrid: { padding: 12 },
  mediaThumbWrap: {
    width: (W - 48) / 3,
    height: (W - 48) / 3,
    borderRadius: 12,
    margin: 6,
    overflow: "hidden",
    backgroundColor: "rgba(10,10,12,0.35)",
  },
  mediaThumb: { width: "100%", height: "100%" },

  rowText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    flexShrink: 1,
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  // lanes
  laneText: {
    color: COLORS.textPrimary,
    fontWeight: "800",
  },

  // editor
  editorCard: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "transparent",
    borderRadius: 14,
    borderWidth: 0,
  },
  emojiInput: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "transparent",
    textAlign: "center",
    color: COLORS.textPrimary,
    fontSize: 20,
    borderWidth: 0,
    textShadowColor: "rgba(255,255,255,0.25)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  titleInput: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 10,
    color: COLORS.textPrimary,
    backgroundColor: "transparent",
    borderWidth: 0,
    textShadowColor: "rgba(255,255,255,0.2)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  paletteRow: { flexDirection: "row", marginTop: 10 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  iconChoice: { marginRight: 8, marginBottom: 8, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.18)" },
  iconChoiceActive: { borderColor: COLORS.neon, shadowColor: COLORS.neon, shadowOpacity: 0.2, shadowRadius: 8 },

  actionChipText: {
    color: COLORS.onGlass,
    fontWeight: "900",
    letterSpacing: 0.3,
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  addLaneText: {
    color: COLORS.onGlass,
    fontWeight: "900",
    textShadowColor: "rgba(255,255,255,0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },

  sectionLabel: { color: COLORS.textSecondary, marginBottom: 8, fontWeight: "800", letterSpacing: 0.3 },

  modeWrap: { flexDirection: "row", flexWrap: "wrap", paddingTop: 4 },
  modeItemWrap: { marginRight: 8, marginBottom: 10 },

  settingRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10 },
  settingLabel: { color: COLORS.textPrimary, fontWeight: "800" },
  settingValue: { color: COLORS.textMuted, fontWeight: "700" },

  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 30 },
  emptyText: { color: "#9aa0a6", fontWeight: "700" },
});