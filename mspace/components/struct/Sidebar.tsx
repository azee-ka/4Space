// /components/struct/Sidebar.js

import React, { useRef, useEffect, useState } from 'react';
import { Animated, View, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const SIDEBAR_WIDTH = 270;

export default function Sidebar({ visible, onClose, onNavigate, profileData, onSignOut }) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current; // initially hidden left
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true); // Mount instantly
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      // Animate out, then unmount after animation
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setShouldRender(false)); // Hide after anim
    }
  }, [visible]);

  // Only render overlay if open or animating
  if (!shouldRender) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <TouchableOpacity style={styles.overlayBG} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        {/* Push items down so they appear below the floating navbar */}
        <View style={styles.spacer} />

        {/* Navigation Links */}
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
          <Icon name="home" size={21} color="#fff" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Explore')}>
          <Icon name="grid" size={21} color="#fff" />
          <Text style={styles.navLabel}>Explore</Text>
        </TouchableOpacity>
        {/* ...more links... */}

        {/* Profile block at bottom */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileRow} onPress={() => onNavigate('Profile')}>
            <Image source={{ uri: profileData?.profile_image }} style={styles.profilePic} />
            <View>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>@{profileData?.username}</Text>
              <Text style={{ color: '#bbb', fontSize: 13 }}>
                {profileData?.first_name} {profileData?.last_name}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.signoutBtn} onPress={onSignOut}>
            <Text style={{ color: '#19dee8', fontWeight: 'bold' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    zIndex: 99,
  },
  overlayBG: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#161617',
    // Add top padding equivalent to navbar height (54px)
    paddingTop: 60,
    paddingVertical: 36,
    paddingHorizontal: 16,
    height: '100%',
  },
  spacer: {
    height: 10, // small extra space below navbar
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  navLabel: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 15,
  },
  profileSection: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  profilePic: {
    width: 42,
    height: 42,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#222',
  },
  signoutBtn: {
    backgroundColor: '#242a2c',
    padding: 10,
    borderRadius: 13,
    alignItems: 'center',
  },
});
