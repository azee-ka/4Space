import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

// Try to use a platform standard slider. Prefer Expo's slider, fall back to @react-native-community/slider, else degrade to buttons.
let SliderBase: any = null;
try {
  // Expo-managed apps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  SliderBase = require("expo-slider").Slider;
} catch (e) {
  try {
    // Bare RN or non-Expo
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    SliderBase = require("@react-native-community/slider");
  } catch (e2) {
    SliderBase = null;
  }
}

function StdSlider(props: any) {
  if (!SliderBase) {
    const {
      value = 0,
      minimumValue = 0,
      maximumValue = 3,
      step = 1,
      onValueChange,
    } = props;
    const steps: number[] = [];
    for (let i = minimumValue; i <= maximumValue; i += step) steps.push(i);
    return (
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {steps.map((s) => (
          <Pressable
            key={s}
            onPress={() => onValueChange?.(s)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 8,
              marginRight: 6,
              backgroundColor:
                s === value
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.12)",
            }}
          >
            <Text
              style={{
                color: s === value ? "#001410" : "#cfe5e9",
                fontWeight: "900",
              }}
            >
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }
  return <SliderBase {...props} />;
}

// Reuse your GlassPressable if you colocate this file with ChatOverlay.tsx
// Otherwise uncomment and adjust import
// import { GlassPressable } from "@/components/GlassPrimitives";

// Lightweight inline GlassPressable clone so this file is drop-in
function GlassPressable({
  children,
  onPress,
  radius = 16,
  padH = 12,
  padV = 10,
  variant = "ghost",
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  radius?: number;
  padH?: number;
  padV?: number;
  variant?: "solid" | "ghost";
  style?: any;
}) {
  const a = useRef(new Animated.Value(0)).current;
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  return (
    <Animated.View style={[{ transform: [{ scale }], opacity: 1 }, style]}>
      <Pressable
        onPress={() => {
          Animated.spring(a, {
            toValue: 1,
            useNativeDriver: true,
            stiffness: 360,
            damping: 22,
            mass: 0.3,
          }).start(() =>
            Animated.spring(a, {
              toValue: 0,
              useNativeDriver: true,
              stiffness: 360,
              damping: 22,
              mass: 0.3,
            }).start()
          );
          Haptics.selectionAsync();
          onPress?.();
        }}
        style={{
          borderRadius: radius,
          overflow: "hidden",
          paddingHorizontal: padH,
          paddingVertical: padV,
        }}
      >
        <BlurView
          intensity={variant === "solid" ? 12 : 6}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            variant === "solid"
              ? ["rgba(255,255,255,0.12)", "rgba(255,255,255,0.04)"]
              : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.01)"]
          }
          style={StyleSheet.absoluteFill}
        />
        <View style={{ borderRadius: radius }}>{children}</View>
      </Pressable>
    </Animated.View>
  );
}

const { height: SH } = Dimensions.get("window");

// Theme type matches your THEMES[] shape in ChatOverlay
export type ThemeDef = {
  id: string;
  name: string;
  accent: string;
  bgGradient: string[];
  bubbleOther: string;
  textOnOwn: string;
  textOnOther: string;
  backdropTintIntensity: number;
};

// Storage helpers
const S = {
  get: async <T,>(k: string, fallback: T): Promise<T> => {
    try {
      const v = await AsyncStorage.getItem(k);
      if (v == null) return fallback;
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  },
  set: async (k: string, v: any) => {
    try {
      await AsyncStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

// Reusable rows
function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
  onPress,
  danger,
}: {
  icon?: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
      {icon && (
        <View style={styles.rowIcon}>
          <MaterialIcons
            name={icon}
            size={20}
            color={danger ? "#FF6666" : "#EFFFFF"}
          />
        </View>
      )}
      <View style={styles.rowTextWrap}>
        <Text
          style={[styles.rowTitle, danger && { color: "#FF6666" }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={{ marginLeft: 10 }}>{right}</View>
    </Pressable>
  );
}

function SettingToggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return <CustomSwitch value={value} onValueChange={onValueChange} />;
}

function ColorSwatch({
  color,
  selected,
  onPress,
}: {
  color: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.colorDot,
        {
          backgroundColor: color,
          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
        },
      ]}
    />
  );
}

function CustomSwitch({
  value,
  onValueChange,
  onColor,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  onColor?: string; // optional accent for the "on" state
}) {
  const ON = onColor ?? "#00E3D8"; // cyanish green
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      ios_backgroundColor="rgba(255,255,255,0.25)"
      trackColor={{ false: "rgba(255,255,255,0.25)", true: ON }}
      thumbColor={Platform.OS === "android" ? "#001410" : undefined}
    />
  );
}

function TextSizeControl({
  value,
  onChange,
}: {
  value: number; // 0..3
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ width: 180 }}>
      <StdSlider
        value={value}
        minimumValue={0}
        maximumValue={3}
        step={1}
        onValueChange={(v: any) => onChange(Array.isArray(v) ? v[0] : v)}
        style={{ height: 36 }}
      />
    </View>
  );
}

// Tabs
const TABS = [
  { key: "account", label: "Account", icon: "person" as const },
  { key: "privacy", label: "Privacy", icon: "lock" as const },
  {
    key: "notifications",
    label: "Notifications",
    icon: "notifications" as const,
  },
  { key: "appearance", label: "Appearance", icon: "palette" as const },
  { key: "chat", label: "Chat", icon: "chat" as const },
  { key: "storage", label: "Data", icon: "cloud" as const },
  {
    key: "accessibility",
    label: "Accessibility",
    icon: "accessibility" as const,
  },
  { key: "advanced", label: "Advanced", icon: "developer-mode" as const },
  { key: "about", label: "About", icon: "info" as const },
] as const;

export type SettingsTabKey = (typeof TABS)[number]["key"];

export default function SettingsOverlay({
  visible,
  onClose,
  version = "",
  themes,
  currentThemeId,
  accentColor,
  backgroundImage,
  onSetBackgroundImage,
  presetWallpapers,
  onChangeTheme,
  onChangeAccent,
  onOpenLicenses,
  onOpenTerms,
  onOpenPrivacy,
  onContactSupport,
  onSignOut,
  onDeleteAccount,
}: {
  visible: boolean;
  onClose: () => void;
  version?: string;
  themes?: ThemeDef[];
  currentThemeId?: string;
  accentColor?: string;
  backgroundImage?: string | null;
  onSetBackgroundImage?: (uri: string | null) => void;
  presetWallpapers?: string[];
  onChangeTheme?: (id: string) => void;
  onChangeAccent?: (hex: string) => void;
  onOpenLicenses?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onContactSupport?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
}) {
  // Bail out before any hooks to keep hook order stable
  // if (!visible) return null;
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(SH)).current;
  const [tab, setTab] = useState<SettingsTabKey>("account");
  const [bgImage, setBgImage] = useState<string | null>(
    backgroundImage ?? null
  );

  // Local persisted toggles (examples)
  const [toggles, setToggles] = useState({
    // privacy
    readReceipts: true,
    showTyping: true,
    lastSeen: "friends", // everyone | friends | nobody
    allowScreenshots: true,
    safeContentFilter: true,

    // notifications
    pushEnabled: true,
    previewInPush: true,
    soundEnabled: true,
    hapticsEnabled: true,

    // chat
    enterToSend: false,
    linkPreviews: true,
    autoCap: true,
    smartPunct: true,

    // data
    autoDownloadWifi: true,
    autoDownloadCell: false,
    lowDataMode: false,

    // accessibility
    reduceMotion: false,
    highContrast: false,
    largerText: 0, // 0..3

    // advanced
    devMode: false,
  });

  const setT = useCallback((patch: Partial<typeof toggles>) => {
    setToggles((p) => {
      const n = { ...p, ...patch };
      S.set("app:settings", n);
      return n;
    });
  }, []);

  // load
  useEffect(() => {
    if (visible) {
      (async () => {
        const t = await S.get("app:settings", toggles);
        setToggles(t);
        // Sync local state from the prop you pass in (per-conversation)
        setBgImage(backgroundImage ?? null);
      })();
      slide.setValue(SH);
      Animated.timing(slide, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Animated.timing(slide, {
      toValue: SH,
      duration: 220,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(onClose);
  }, [onClose]);


  const wallpapers = useMemo(
    () =>
      presetWallpapers && presetWallpapers.length
        ? presetWallpapers
        : [
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1200&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
          ],
    [presetWallpapers]
  );

  const setBackgroundAndPersist = useCallback(
    (uri: string | null) => {
      setBgImage(uri);
      onSetBackgroundImage?.(uri); // parent persists per-conversation & server
    },
    [onSetBackgroundImage]
  );

  const pickBackgroundFromLibrary = useCallback(async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setBackgroundAndPersist(res.assets[0].uri);
      }
    } catch {}
  }, [setBackgroundAndPersist]);

  const themeList: ThemeDef[] = useMemo(
    () =>
      themes ?? [
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
          id: "emerald",
          name: "Emerald",
          accent: "#19C37D",
          bgGradient: ["#071411", "#0C201A"],
          bubbleOther: "rgba(18,34,28,0.36)",
          textOnOwn: "#00120A",
          textOnOther: "#E7F7F0",
          backdropTintIntensity: 45,
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
      ],
    [themes]
  );

  // Tab content
  const renderTab = () => {
    switch (tab) {
      case "account":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="Profile" />
            <SettingRow
              icon="person"
              title="Edit profile"
              subtitle="Name, handle, bio, avatar"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={() => {}}
            />
            <SettingRow
              icon="security"
              title="Two-factor authentication"
              subtitle="Keep your account secure"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={() => {}}
            />
            <SettingRow
              icon="block"
              title="Blocked users"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={() => {}}
            />

            <SectionHeader title="Account actions" />
            <SettingRow
              icon="logout"
              title="Sign out"
              onPress={onSignOut}
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
            />
            <SettingRow
              icon="delete-forever"
              title="Delete account"
              danger
              onPress={onDeleteAccount}
              right={
                <MaterialIcons name="chevron-right" size={20} color="#FF6666" />
              }
            />
          </ScrollView>
        );
      case "privacy":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="Privacy & Safety" />
            <SettingRow
              title="Read receipts"
              subtitle="Allow others to see when you've read their messages"
              right={
                <SettingToggle
                  value={toggles.readReceipts}
                  onValueChange={(v) => setT({ readReceipts: v })}
                />
              }
            />
            <SettingRow
              title="Typing indicators"
              right={
                <SettingToggle
                  value={toggles.showTyping}
                  onValueChange={(v) => setT({ showTyping: v })}
                />
              }
            />
            <SettingRow
              title="Allow screenshots of disappearing messages"
              right={
                <SettingToggle
                  value={toggles.allowScreenshots}
                  onValueChange={(v) => setT({ allowScreenshots: v })}
                />
              }
            />
            <SettingRow
              title="Safe content filter"
              subtitle="Blur suspicious images and flag unsafe links"
              right={
                <SettingToggle
                  value={toggles.safeContentFilter}
                  onValueChange={(v) => setT({ safeContentFilter: v })}
                />
              }
            />

            <SectionHeader title="Last seen" />
            {(["everyone", "friends", "nobody"] as const).map((opt) => (
              <SettingRow
                key={opt}
                title={
                  opt === "everyone"
                    ? "Everyone"
                    : opt === "friends"
                    ? "Friends only"
                    : "Nobody"
                }
                right={
                  toggles.lastSeen === opt ? (
                    <MaterialIcons
                      name="radio-button-checked"
                      size={20}
                      color="#EFFFFF"
                    />
                  ) : (
                    <MaterialIcons
                      name="radio-button-unchecked"
                      size={20}
                      color="#cfe5e9"
                    />
                  )
                }
                onPress={() => setT({ lastSeen: opt })}
              />
            ))}
          </ScrollView>
        );
      case "notifications":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="Push" />
            <SettingRow
              title="Enable push notifications"
              right={
                <SettingToggle
                  value={toggles.pushEnabled}
                  onValueChange={(v) => setT({ pushEnabled: v })}
                />
              }
            />
            <SettingRow
              title="Show previews"
              subtitle="Display message text in notifications"
              right={
                <SettingToggle
                  value={toggles.previewInPush}
                  onValueChange={(v) => setT({ previewInPush: v })}
                />
              }
            />

            <SectionHeader title="In-app" />
            <SettingRow
              title="Sounds"
              right={
                <SettingToggle
                  value={toggles.soundEnabled}
                  onValueChange={(v) => setT({ soundEnabled: v })}
                />
              }
            />
            <SettingRow
              title="Haptics"
              right={
                <SettingToggle
                  value={toggles.hapticsEnabled}
                  onValueChange={(v) => setT({ hapticsEnabled: v })}
                />
              }
            />
          </ScrollView>
        );
      case "appearance":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="Theme" />
            <View style={styles.grid3}>
              {themeList.map((t) => (
                <View key={t.id} style={{ padding: 6, width: "33.33%" }}>
                  <GlassPressable
                    radius={14}
                    padH={10}
                    padV={10}
                    variant={currentThemeId === t.id ? "solid" : "ghost"}
                    onPress={() => onChangeTheme?.(t.id)}
                  >
                    <LinearGradient
                      colors={t.bgGradient as any}
                      style={{ height: 68, borderRadius: 12 }}
                    />
                    <Text style={styles.gridLabel}>{t.name}</Text>
                  </GlassPressable>
                </View>
              ))}
            </View>

            <SectionHeader title="Accent color" />
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                paddingHorizontal: 4,
              }}
            >
              {[
                "#17D4FF",
                "#19C37D",
                "#A07CFE",
                "#FF6B4A",
                "#00E3D8",
                "#FFC107",
                "#FF3B30",
                "#00B8D9",
                "#36B37E",
                "#6554C0",
                "#FF5630",
                "#FFAB00",
                "#F06292",
                "#4DB6AC",
                "#90CAF9",
                "#B39DDB",
              ].map((c) => (
                <ColorSwatch
                  key={c}
                  color={c}
                  selected={accentColor === c}
                  onPress={() => onChangeAccent?.(c)}
                />
              ))}
            </View>

            <SectionHeader title="Background" />
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {wallpapers.map((uri) => (
                <View key={uri} style={{ width: "33.33%", padding: 6 }}>
                  <Pressable
                    onPress={() => setBackgroundAndPersist(uri)}
                    style={{ borderRadius: 12, overflow: "hidden" }}
                  >
                    <Image
                      source={{ uri }}
                      style={{ width: "100%", height: 72 }}
                    />
                    {bgImage === uri ? (
                      <View
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          top: 0,
                          bottom: 0,
                          borderWidth: 2,
                          borderColor: "#EFFFFF",
                          borderRadius: 12,
                        }}
                      />
                    ) : null}
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <GlassPressable
                variant="solid"
                radius={14}
                padH={12}
                padV={10}
                onPress={pickBackgroundFromLibrary}
                style={{ marginRight: 8 }}
              >
                <Text style={{ color: "#001410", fontWeight: "900" }}>
                  Choose Photo…
                </Text>
              </GlassPressable>
              {bgImage ? (
                <GlassPressable
                  variant="ghost"
                  radius={14}
                  padH={12}
                  padV={10}
                  onPress={() => setBackgroundAndPersist(null)}
                >
                  <Text style={{ color: "#cfe5e9", fontWeight: "900" }}>
                    Clear Background
                  </Text>
                </GlassPressable>
              ) : null}
            </View>

            <SectionHeader title="Display" />
            <SettingRow
              title="Reduce motion"
              right={
                <SettingToggle
                  value={toggles.reduceMotion}
                  onValueChange={(v) => setT({ reduceMotion: v })}
                />
              }
            />
            <SettingRow
              title="High contrast text"
              right={
                <SettingToggle
                  value={toggles.highContrast}
                  onValueChange={(v) => setT({ highContrast: v })}
                />
              }
            />
          </ScrollView>
        );
      case "chat":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="Composer" />
            <SettingRow
              title="Enter to send"
              right={
                <SettingToggle
                  value={toggles.enterToSend}
                  onValueChange={(v) => setT({ enterToSend: v })}
                />
              }
            />
            <SettingRow
              title="Auto-capitalization"
              right={
                <SettingToggle
                  value={toggles.autoCap}
                  onValueChange={(v) => setT({ autoCap: v })}
                />
              }
            />
            <SettingRow
              title="Smart punctuation"
              right={
                <SettingToggle
                  value={toggles.smartPunct}
                  onValueChange={(v) => setT({ smartPunct: v })}
                />
              }
            />

            <SectionHeader title="Messages" />
            <SettingRow
              title="Link previews"
              right={
                <SettingToggle
                  value={toggles.linkPreviews}
                  onValueChange={(v) => setT({ linkPreviews: v })}
                />
              }
            />
          </ScrollView>
        );
      case "storage":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="Data usage" />
            <SettingRow
              title="Auto-download on Wi‑Fi"
              right={
                <SettingToggle
                  value={toggles.autoDownloadWifi}
                  onValueChange={(v) => setT({ autoDownloadWifi: v })}
                />
              }
            />
            <SettingRow
              title="Auto-download on Cellular"
              right={
                <SettingToggle
                  value={toggles.autoDownloadCell}
                  onValueChange={(v) => setT({ autoDownloadCell: v })}
                />
              }
            />
            <SettingRow
              title="Low data mode"
              right={
                <SettingToggle
                  value={toggles.lowDataMode}
                  onValueChange={(v) => setT({ lowDataMode: v })}
                />
              }
            />

            <SectionHeader title="Storage" />
            <SettingRow
              icon="delete-sweep"
              title="Clear cache"
              subtitle="Frees space; does not delete your messages"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={() => {}}
            />
          </ScrollView>
        );
      case "accessibility":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="Accessibility" />
            <SettingRow
              title="Larger text"
              subtitle={
                ["System default", "+1", "+2", "+3"][toggles.largerText]
              }
              right={
                <TextSizeControl
                  value={toggles.largerText}
                  onChange={(v) => setT({ largerText: v })}
                />
              }
            />
            <SettingRow
              title="Reduce motion"
              right={
                <SettingToggle
                  value={toggles.reduceMotion}
                  onValueChange={(v) => setT({ reduceMotion: v })}
                />
              }
            />
            <SettingRow
              title="High contrast text"
              right={
                <SettingToggle
                  value={toggles.highContrast}
                  onValueChange={(v) => setT({ highContrast: v })}
                />
              }
            />
          </ScrollView>
        );
      case "advanced":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="Developer" />
            <SettingRow
              title="Enable developer mode"
              right={
                <SettingToggle
                  value={toggles.devMode}
                  onValueChange={(v) => setT({ devMode: v })}
                />
              }
            />
            <SettingRow
              icon="bug-report"
              title="Send debug log"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={() => {}}
            />
            <SettingRow
              icon="refresh"
              title="Reset local state"
              danger
              right={
                <MaterialIcons name="chevron-right" size={20} color="#FF6666" />
              }
              onPress={() => {}}
            />
          </ScrollView>
        );
      case "about":
        return (
          <ScrollView
            contentContainerStyle={styles.padded}
            showsVerticalScrollIndicator={false}
          >
            <SectionHeader title="About" />
            <SettingRow title="Version" subtitle={version || ""} />
            <SettingRow
              title="Licenses"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={onOpenLicenses}
            />
            <SettingRow
              title="Privacy Policy"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={onOpenPrivacy}
            />
            <SettingRow
              title="Terms of Service"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={onOpenTerms}
            />
            <SettingRow
              icon="support-agent"
              title="Contact support"
              right={
                <MaterialIcons name="chevron-right" size={20} color="#cfe5e9" />
              }
              onPress={onContactSupport}
            />
          </ScrollView>
        );
    }
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={dismiss}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateY: slide }],
            },
            { backgroundColor: "rgba(0,0,0,0.4)" },
          ]}
        >
          {/* Glass background layers */}
          <BlurView
            intensity={50}
            tint="dark"
            style={[
              StyleSheet.absoluteFill,
              { borderTopLeftRadius: 22, borderTopRightRadius: 22 },
            ]}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: "rgba(255,255,255,0.16)",
            }}
          />
          {/* <LinearGradient
            pointerEvents="none"
            colors={["rgba(100, 100, 100, 0.19)", "rgba(255,255,255,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 14,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
            }}
          /> */}

          {/* Header */}
          <View style={styles.header}>
            <GlassPressable radius={14} padH={10} padV={8} onPress={dismiss}>
              <MaterialIcons name="close" size={20} color="#EFFFFF" />
            </GlassPressable>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.tabs]}
          >
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[
                  styles.tabBtn,
                  tab === t.key ? styles.tabBtnActive : styles.tabBtnInactive,
                ]}
              >
                <MaterialIcons
                  name={t.icon}
                  size={16}
                  color={tab === t.key ? "#001410" : "#cfe5e9"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.tabText,
                    tab === t.key
                      ? styles.tabTextActive
                      : styles.tabTextInactive,
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Content */}
          <View style={{ flex: 1 }}>
            {renderTab()}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: Platform.select({ ios: 60, android: 12, default: 24 }),
    backgroundColor: "rgba(8,12,16,0.36)",
    // backgroundColor: "transparent",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { color: "#EFFFFF", fontWeight: "900", fontSize: 18 },
  tabs: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    maxHeight: 40,
    backgroundColor: "transparent",
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  tabBtnActive: { backgroundColor: "rgba(255,255,255,0.96)" },
  tabBtnInactive: { backgroundColor: "rgba(255,255,255,0.08)" },
  tabText: { fontWeight: "900" },
  tabTextActive: { color: "#001410" },
  tabTextInactive: { color: "#cfe5e9" },

  padded: { paddingHorizontal: 14, paddingBottom: 18 },
  sectionHeader: {
    color: "#EFFFFF",
    fontWeight: "900",
    fontSize: 14,
    marginTop: 14,
    marginBottom: 8,
    opacity: 0.95,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  rowIcon: { width: 28, alignItems: "center", marginRight: 10 },
  rowTextWrap: { flex: 1 },
  rowTitle: { color: "#EFFFFF", fontWeight: "800", fontSize: 16 },
  rowSubtitle: { color: "#b9d2d9", fontSize: 12, marginTop: 2 },
  grid3: { flexDirection: "row", flexWrap: "wrap" },
  gridLabel: {
    color: "#EFFFFF",
    marginTop: 6,
    fontWeight: "800",
    textAlign: "center",
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    margin: 6,
    borderColor: "rgba(255,255,255,0.85)",
  },
});
