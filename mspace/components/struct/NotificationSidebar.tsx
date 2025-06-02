import React, { useRef, useEffect, useState } from 'react';
import { Animated, View, TouchableOpacity, StyleSheet, FlatList, Image, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const DRAWER_WIDTH = 340;

export default function NotificationSidebar({ visible, onClose, notifications }) {
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current; // start offscreen right
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
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
      ]).start(() => setShouldRender(false));
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View
        style={[
          styles.overlayBG,
          { opacity: overlayAnim }
        ]}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [
              { translateX: slideAnim }
            ]
          }
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="chevron-left" size={26} color="#19dee8" />
          </TouchableOpacity>
          <Text style={{ color: '#19dee8', fontSize: 22, marginLeft: 13 }}>Notifications</Text>
        </View>
        <FlatList
          data={notifications}
          keyExtractor={n => n.id?.toString()}
          renderItem={({ item }) => (
            <View style={styles.notifRow}>
              <Image source={{ uri: item.sender?.profile_image }} style={styles.avatar} />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ color: '#fff' }}>{item.title}</Text>
                <Text style={{ color: '#aaa', fontSize: 13 }}>{item.message}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: '#888', marginTop: 40 }}>No notifications.</Text>}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', right: 0, top: 0, width: '100%', height: '100%',
    flexDirection: 'row', zIndex: 101,
  },
  overlayBG: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.12)',
    position: 'absolute',
    left: 0, top: 0, right: 0, bottom: 0,
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0, // anchor the drawer to the right
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#18191c',
    paddingTop: 38,
    paddingHorizontal: 18,
    zIndex: 15,
  },
  notifRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.4, borderBottomColor: '#252728'
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2b2b2b' }
});
