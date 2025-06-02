// /components/struct/SidebarMenuIcon.js

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';

export default function SidebarMenuIcon({ sidebarOpen, onPress }) {
  // Single animated value: 0 when closed, 1 when open
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: sidebarOpen ? 1 : 0,
      duration: 500,            // match your .icon-bar transition: 0.5s
      useNativeDriver: false,   // width cannot use native driver
    }).start();
  }, [sidebarOpen, anim]);

  // Bar 1 interpolation
  const bar1Width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 18],
  });
  const bar1Rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const bar1TranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 6],
  });
  const bar1TranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const bar1Opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  // Bar 2 interpolation
  const bar2Width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [25, 25],
  });
  const bar2Rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const bar2TranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const bar2TranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });
  const bar2Opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  // Bar 3 interpolation (note initial width is 15 → scales to 25 when open)
  const bar3Width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 25],
  });
  const bar3Rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });
  const bar3TranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });
  const bar3TranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  const bar3Opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      {/* Bar 1 */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: bar1Width,
            opacity: bar1Opacity,
            transform: [
              { rotate: bar1Rotate },
              { translateX: bar1TranslateX },
              { translateY: bar1TranslateY },
            ],
          },
        ]}
      />

      {/* Bar 2 */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: bar2Width,
            opacity: bar2Opacity,
            transform: [
              { rotate: bar2Rotate },
              { translateX: bar2TranslateX },
              { translateY: bar2TranslateY },
            ],
          },
        ]}
      />

      {/* Bar 3 */}
      <Animated.View
        style={[
          styles.bar,
          {
            width: bar3Width,
            opacity: bar3Opacity,
            transform: [
              { rotate: bar3Rotate },
              { translateX: bar3TranslateX },
              { translateY: bar3TranslateY },
            ],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start', // align bars to left
    marginRight: 8,
  },
  bar: {
    height: 2.1,
    backgroundColor: 'white',
    marginVertical: 3,
    opacity: 0.6,
  },
});
