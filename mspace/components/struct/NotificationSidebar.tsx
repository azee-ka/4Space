import React, { useRef, useEffect, useState } from 'react';
import { Animated, View, TouchableOpacity, StyleSheet, FlatList, Image, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import ProfilePicture from '../../utils/getProfilePicture';

const DRAWER_WIDTH = 300;

export default function NotificationSidebar({ visible, onClose, notifications }) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current; // start offscreen to the right
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      // When opening: make sure we render, then animate in
      setShouldRender(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // When closing: animate out, then hide completely
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, slideAnim, overlayAnim]);

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Semi-transparent background that closes sidebar on tap */}
      <Animated.View style={[styles.overlayBG, { opacity: overlayAnim }]}>
        <TouchableOpacity style={styles.fullScreenTouchable} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* The sliding drawer itself */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="chevron-left" size={26} color="#19dee8" />
          </TouchableOpacity>
          <Text style={styles.drawerTitle}>Notifications</Text>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <View style={styles.notifRow}>
              <ProfilePicture src={item.sender?.profile_image || null} style={styles.avatar} />
              <View style={styles.textContainer}>
                <Text style={styles.titleText}>{item.title}</Text>
                <Text style={styles.messageText}>{item.message}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={notifications.length === 0 && styles.emptyContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>No notifications.</Text>}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Full‐screen overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,            // ← ensure it spans all the way left
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 101,
  },
  // Semi‐transparent background behind the drawer
  overlayBG: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  // Invisible full‐screen TouchableOpacity to catch taps
  fullScreenTouchable: {
    flex: 1,
  },
  // The sliding drawer panel
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,           // anchor the drawer to the right edge
    width: DRAWER_WIDTH,
    bottom: 0,
    backgroundColor: '#18191c',
    paddingTop: 38,
    paddingHorizontal: 18,
    zIndex: 15,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  drawerTitle: {
    color: '#19dee8',
    fontSize: 22,
    marginLeft: 13,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.4,
    borderBottomColor: '#252728',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2b2b2b',
  },
  textContainer: {
    marginLeft: 10,
    flexShrink: 1,
  },
  titleText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 2,
  },
  messageText: {
    color: '#aaa',
    fontSize: 13,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
