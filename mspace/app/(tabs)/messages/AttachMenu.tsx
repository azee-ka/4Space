// app/(tabs)/messages/AttachMenu.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Animated,
  Easing,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const { width: W, height: H } = Dimensions.get("window");

const BLUR = Platform.select({
  ios: { overlay: 50, bubble: 18 },
  android: { overlay: 40, bubble: 6 },
  default: { overlay: 40, bubble: 12 },
}) as const;

type Item = {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
};

type Props = {
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
};

export default function AttachMenu({
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
}: Props) {
  // keep mounted while animating out
  const [mounted, setMounted] = useState(visible);

  // master open animation (drives blur, bubble, container)
  const a = useRef(new Animated.Value(0)).current;

  // build items once per prop change
  const items: Item[] = useMemo(
    () =>
      itemsFactory({
        onPickMedia,
        onCamera,
        onDocument,
        onStartPoll,
        onStartVoice,
        onShareLocation,
        onSchedule,
        onSetBackground,
        onCycleTheme,
      }),
    [
      onPickMedia,
      onCamera,
      onDocument,
      onStartPoll,
      onStartVoice,
      onShareLocation,
      onSchedule,
      onSetBackground,
      onCycleTheme,
    ]
  );

  // per-row bubbly pop-in (one Animated.Value per item)
  const rowAs = useRef(items.map(() => new Animated.Value(0))).current;

  // row height for centering first item at open
  const [rowH, setRowH] = useState(56);
  const topPad = Math.max(24, H * 0.5 - rowH / 2);
  const bottomPad = Math.max(24, H * 0.5 - rowH / 2 + 12);

  // bubble geometry (from center; glassy circle expands to fill)
  const baseR = 22;
  const targetR = Math.hypot(W * 0.5, H * 0.5) + 24; // reach corners
  const scaleTarget = targetR / baseR;

  const runOpen = useCallback(() => {
    a.stopAnimation();
    a.setValue(0);
    rowAs.forEach((v) => v.setValue(0));

    // run container open and row pop-in together for a bubbly entrance
    Animated.parallel([
      Animated.spring(a, {
        toValue: 1,
        useNativeDriver: true,
        speed: 10,
        bounciness: 8,
      }),
      Animated.sequence([
        Animated.delay(60),
        Animated.stagger(
          36,
          rowAs.map((v) =>
            Animated.spring(v, {
              toValue: 1,
              stiffness: 260,
              damping: 16,
              mass: 0.55,
              useNativeDriver: true,
            })
          )
        ),
      ]),
    ]).start();
  }, [a, rowAs]);

  const runClose = useCallback(
    (after?: () => void) => {
      Animated.parallel([
        Animated.timing(a, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.stagger(
          18,
          rowAs
            .slice()
            .reverse()
            .map((v) =>
              Animated.timing(v, {
                toValue: 0,
                duration: 140,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              })
            )
        ),
      ]).start(() => {
        setMounted(false);
        after?.();
      });
    },
    [a, rowAs]
  );

  // react to parent-visible prop with mount/unmount for close animation
  useEffect(() => {
    if (visible) {
      setMounted(true);
      runOpen();
    } else if (mounted) {
      runClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const requestDismiss = useCallback(() => runClose(onDismiss), [runClose, onDismiss]);

  // Derived animated styles (native-driver friendly)
  const overlayOpacity = a.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const containerY = a.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  const containerScale = a.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });

  const bubbleScale = a.interpolate({ inputRange: [0, 1], outputRange: [0.001, scaleTarget] });
  const bubbleOpacity = a.interpolate({
    inputRange: [0, 0.25, 0.7, 1],
    outputRange: [0, 1, 0.15, 0],
  });

  if (!mounted) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: overlayOpacity, zIndex: 1001 }]}
      pointerEvents={mounted ? "auto" : "none"}
      accessibilityElementsHidden={!mounted}
      importantForAccessibility={mounted ? "yes" : "no-hide-descendants"}
    >
      {/* Global soft blur (no backgrounds on rows) */}
      <BlurView intensity={BLUR.overlay} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Glass bubble that expands from the screen center for a smooth, watery feel */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bubble,
          {
            left: W / 2 - baseR,
            top: H / 2 - baseR,
            width: baseR * 2,
            height: baseR * 2,
            borderRadius: baseR,
            opacity: bubbleOpacity,
            transform: [{ scale: bubbleScale }],
          },
        ]}
      >
        <BlurView intensity={BLUR.bubble} tint="dark" style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Tap empty space anywhere to dismiss */}
      <Pressable style={StyleSheet.absoluteFill} onPress={requestDismiss} />

      {/* Whole-screen scroll that feels free and airy */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateY: containerY }, { scale: containerScale }] }]}
        pointerEvents="box-none"
      >
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Free space above the first item, sized so the first row sits inline with center */}
          <Pressable style={{ height: topPad }} onPress={requestDismiss} />

          {items.map((it, i) => (
            <BubblyRow
              key={it.label}
              index={i}
              icon={it.icon}
              label={it.label}
              onPress={() => {
                requestDismiss();
                // defer to allow close animation to start
                setTimeout(it.onPress, 180);
              }}
              a={rowAs[i]}
              onMeasureFirst={(h) => {
                if (i === 0 && h && Math.abs(h - rowH) > 1) setRowH(h);
              }}
            />
          ))}

          {/* Free space at the bottom so scrolling can travel through full screen */}
          <Pressable style={{ height: bottomPad }} onPress={requestDismiss} />
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

/** Create the item list */
function itemsFactory(cb: {
  onPickMedia: () => void;
  onCamera: () => void;
  onDocument: () => void;
  onStartPoll: () => void;
  onStartVoice: () => void;
  onShareLocation: () => void;
  onSchedule: () => void;
  onSetBackground: () => void;
  onCycleTheme: () => void;
}): Item[] {
  const {
    onPickMedia,
    onCamera,
    onDocument,
    onStartPoll,
    onStartVoice,
    onShareLocation,
    onSchedule,
    onSetBackground,
    onCycleTheme,
  } = cb;
  return [
    { icon: "photo", label: "Photos / Videos", onPress: onPickMedia },
    { icon: "camera-alt", label: "Camera", onPress: onCamera },
    { icon: "insert-drive-file", label: "Document", onPress: onDocument },
    { icon: "poll", label: "Poll", onPress: onStartPoll },
    { icon: "keyboard-voice", label: "Voice note", onPress: onStartVoice },
    { icon: "location-pin", label: "Share location", onPress: onShareLocation },
    { icon: "schedule", label: "Schedule", onPress: onSchedule },
    { icon: "wallpaper", label: "Background", onPress: onSetBackground },
    { icon: "palette", label: "Theme", onPress: onCycleTheme },
  ];
}

/** One row with no background, box shadow (not text glow), and a bubbly press animation. */
function BubblyRow({
  a,
  index,
  icon,
  label,
  onPress,
  onMeasureFirst,
}: {
  a: Animated.Value;
  index: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  onMeasureFirst?: (h: number) => void;
}) {
  // small pop on press
  const press = useRef(new Animated.Value(0)).current;
  const onPressIn = () => {
    Animated.spring(press, { toValue: 1, stiffness: 420, damping: 22, mass: 0.25, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(press, { toValue: 0, stiffness: 420, damping: 22, mass: 0.25, useNativeDriver: true }).start();
  };

  const rowOpacity = a.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const rowTY = a.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  const appearScale = a.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] });
  const pressScale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  const scale = Animated.multiply(appearScale, pressScale);

  const iconTY = a.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <Animated.View
      style={[
        styles.rowWrap,
        {
          opacity: rowOpacity,
          transform: [{ translateY: rowTY }, { scale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.rowInner}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={6}
        onLayout={(e) => {
          if (index === 0) onMeasureFirst?.(e.nativeEvent.layout.height);
        }}
      >
        <Animated.View style={[styles.iconBox, { transform: [{ translateY: iconTY }] }]}>
          <MaterialIcons name={icon} size={30} color="#EAFBFF" />
        </Animated.View>
        <Text style={styles.rowLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Whole-screen rows: no backgrounds, only box shadow
  rowWrap: {
    marginHorizontal: 10,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  rowInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
  },
  iconBox: {
    marginRight: 12,
  },
  rowLabel: {
    color: "#F2FBFF",
    letterSpacing: 0.25,
    flex: 1,
    fontSize: 20,
  },
  bubble: {
    position: "absolute",
    overflow: "hidden",
  },
});