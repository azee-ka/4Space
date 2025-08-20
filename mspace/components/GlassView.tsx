// components/GlassView.tsx
import React, { useMemo } from "react";
import { View, StyleSheet, ViewProps, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

type Edge = "none" | "left" | "right" | "top" | "bottom";

export type GlassViewProps = ViewProps & {
  radius?: number;
  intensity?: number;
  backgroundOpacity?: number;
  ambientIridescence?: boolean;
  interactive?: boolean;
  onTouchMove?: (x: number, y: number) => void;
  children?: React.ReactNode;
};

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

export const GlassView: React.FC<GlassViewProps> = ({
  radius = 18,
  intensity = 12,
  backgroundOpacity = 0.12,
  ambientIridescence = true,
  interactive = true,
  style,
  children,
  onTouchMove,
  ...rest
}) => {
  const w = useSharedValue(0);
  const h = useSharedValue(0);
  const touchX = useSharedValue(-1);
  const touchY = useSharedValue(-1);
  const activeEdge = useSharedValue<Edge>("none");
  const edgeBulge = useSharedValue(0);
  const dragGlow = useSharedValue(0);

  const pickEdge = (x: number, y: number, width: number, height: number): Edge => {
    const margin = 28;
    const dLeft = x, dRight = width - x, dTop = y, dBottom = height - y;
    const minD = Math.min(dLeft, dRight, dTop, dBottom);
    if (minD > margin) return "none";
    switch (minD) {
      case dLeft: return "left";
      case dRight: return "right";
      case dTop: return "top";
      case dBottom: return "bottom";
      default: return "none";
    }
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((e) => {
          touchX.value = e.x; touchY.value = e.y;
          activeEdge.value = pickEdge(e.x, e.y, w.value, h.value);
          edgeBulge.value = withSpring(1, { damping: 18, stiffness: 220 });
          dragGlow.value = withTiming(1, { duration: 160 });
        })
        .onUpdate((e) => {
          touchX.value = e.x; touchY.value = e.y;
          const edge = pickEdge(e.x, e.y, w.value, h.value);
          activeEdge.value = edge;
          const d =
            edge === "left" ? e.x :
            edge === "right" ? w.value - e.x :
            edge === "top" ? e.y :
            edge === "bottom" ? h.value - e.y : 999;
          const t = Math.max(0, Math.min(1, 1 - d / 28));
          edgeBulge.value = withSpring(t, { damping: 18, stiffness: 260 });
          dragGlow.value = withTiming(Math.max(0.2, t), { duration: 80 });
          if (onTouchMove) runOnJS(onTouchMove)(e.x, e.y);
        })
        .onEnd(() => {
          edgeBulge.value = withSpring(0, { damping: 20, stiffness: 200 });
          dragGlow.value = withTiming(0, { duration: 140 });
          activeEdge.value = "none"; touchX.value = -1; touchY.value = -1;
        })
        .onFinalize(() => {
          edgeBulge.value = withSpring(0);
          dragGlow.value = withTiming(0, { duration: 140 });
          activeEdge.value = "none"; touchX.value = -1; touchY.value = -1;
        }),
    []
  );

  const onLayout = (evt: any) => {
    w.value = evt.nativeEvent.layout.width;
    h.value = evt.nativeEvent.layout.height;
  };

  const morphStyle = useAnimatedStyle(() => {
    const maxBulge = 1.04;
    const t = edgeBulge.value;
    let scaleX = 1, scaleY = 1, tx = 0, ty = 0;
    if (activeEdge.value === "left" || activeEdge.value === "right") {
      scaleX = 1 + (maxBulge - 1) * t;
      const dir = activeEdge.value === "left" ? -1 : 1;
      tx = dir * (w.value * (scaleX - 1)) / 2;
    } else if (activeEdge.value === "top" || activeEdge.value === "bottom") {
      scaleY = 1 + (maxBulge - 1) * t;
      const dir = activeEdge.value === "top" ? -1 : 1;
      ty = dir * (h.value * (scaleY - 1)) / 2;
    }
    return { transform: [{ translateX: tx }, { translateY: ty }, { scaleX }, { scaleY }] };
  });

  const Glow = () => {
    const glowStyle = useAnimatedStyle(() => ({ opacity: dragGlow.value }));
    return (
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="dragGlowGrad" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="white" stopOpacity="0.25" />
              <Stop offset="60%" stopColor="white" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="white" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100" height="100" fill="url(#dragGlowGrad)" />
        </Svg>
      </Animated.View>
    );
  };

  const IridescentEdges = () => {
    const edgeOpacity = useAnimatedStyle(() => {
      const t = edgeBulge.value;
      const edge = activeEdge.value;
      return { opacity: withTiming(edge === "none" ? 0 : t, { duration: 100 }) };
    });
    const cornerOpacity = useAnimatedStyle(() => ({
      opacity: withTiming(ambientIridescence ? 0.08 : 0, { duration: 300 }),
    }));

    const Rainbow = ({ vertical = false }: { vertical?: boolean }) => (
      <LinearGradient
        colors={["#ff0080", "#ffef00", "#00ffd5", "#6a00ff"]}
        locations={[0.05, 0.35, 0.65, 0.95]}
        start={vertical ? { x: 0.5, y: 0 } : { x: 0, y: 0.5 }}
        end={vertical ? { x: 0.5, y: 1 } : { x: 1, y: 0.5 }}
        style={vertical ? styles.irisV : styles.irisH}
      />
    );

    return (
      <>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, edgeOpacity]}>
          <Animated.View style={[styles.edgeStripLeft, activeEdge.value === "left" ? styles.edgeVisible : styles.edgeHidden]}>
            <Rainbow vertical />
          </Animated.View>
          <Animated.View style={[styles.edgeStripRight, activeEdge.value === "right" ? styles.edgeVisible : styles.edgeHidden]}>
            <Rainbow vertical />
          </Animated.View>
          <Animated.View style={[styles.edgeStripTop, activeEdge.value === "top" ? styles.edgeVisible : styles.edgeHidden]}>
            <Rainbow />
          </Animated.View>
          <Animated.View style={[styles.edgeStripBottom, activeEdge.value === "bottom" ? styles.edgeVisible : styles.edgeHidden]}>
            <Rainbow />
          </Animated.View>
        </Animated.View>

        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, cornerOpacity]}>
          <View style={[styles.corner, { top: 0, left: 0 }]}><Rainbow /></View>
          <View style={[styles.corner, { top: 0, right: 0 }]}><Rainbow /></View>
          <View style={[styles.corner, { bottom: 0, left: 0 }]}><Rainbow /></View>
          <View style={[styles.corner, { bottom: 0, right: 0 }]}><Rainbow /></View>
        </Animated.View>
      </>
    );
  };

  const Container: any = interactive ? GestureDetector : React.Fragment;
  const containerProps = interactive ? { gesture: pan } : {};

  return (
    <Container {...(containerProps as any)}>
      <Animated.View onLayout={onLayout} style={[styles.wrap, { borderRadius: radius }, morphStyle, style]} {...rest}>
<View style={{ borderRadius: radius, overflow: "hidden" }}>
          <AnimatedBlur
            intensity={intensity}
            tint={Platform.OS === "ios" ? "default" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(255,255,255,${backgroundOpacity})` }]} />
          <View style={styles.content}>{children}</View>
          <Glow />
          <IridescentEdges />
        </View>

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.35)" },
          ]}
        />
      </Animated.View>
    </Container>
  );
};

const styles = StyleSheet.create({
  wrap: { overflow: "visible" },
  content: { padding: 10 },

  irisH: { width: "100%", height: 12, opacity: 0.35 },
  irisV: { height: "100%", width: 12, opacity: 0.35 },

  edgeStripLeft: { position: "absolute", top: 0, bottom: 0, left: 0, width: 12, overflow: "hidden" },
  edgeStripRight: { position: "absolute", top: 0, bottom: 0, right: 0, width: 12, overflow: "hidden" },
  edgeStripTop: { position: "absolute", left: 0, right: 0, top: 0, height: 12, overflow: "hidden" },
  edgeStripBottom: { position: "absolute", left: 0, right: 0, bottom: 0, height: 12, overflow: "hidden" },
  edgeVisible: { opacity: 0.25 },
  edgeHidden: { opacity: 0 },

  corner: { position: "absolute", width: 16, height: 16, overflow: "hidden" },
});