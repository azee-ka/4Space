// /components/struct/Sidebar.js

import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import ProfilePicture from "../../utils/getProfilePicture";

const SIDEBAR_WIDTH = 270;

export default function Sidebar({
  visible,
  onClose,
  onNavigate,
  onSignOut,
  profileData,
  profileLoading,
}) {
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setShouldRender(false));
    }
  }, [visible, slideAnim]);

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <TouchableOpacity style={styles.overlayBG} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.spacer} />

        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("Home")}>
          <Icon name="home" size={21} color="#fff" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("Explore")}>
          <Icon name="grid" size={21} color="#fff" />
          <Text style={styles.navLabel}>Explore</Text>
        </TouchableOpacity>

        {/* …more nav items… */}

        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.profileRow} onPress={() => onNavigate("Profile")}>
            {profileLoading ? (
              <ActivityIndicator size="small" color="#fff" style={styles.profilePlaceholder} />
            ) : (
              <ProfilePicture
                src={profileData?.profile_image || null}
                style={styles.profilePic}
              />
            )}

            <View>
              <Text style={styles.usernameText}>
                @{profileData?.username || ""}
              </Text>
              <Text style={styles.fullnameText}>
                {profileData
                  ? `${profileData.first_name} ${profileData.last_name}`
                  : ""}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signoutBtn} onPress={onSignOut}>
            <Text style={styles.signoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    flexDirection: "row",
    zIndex: 99,
  },
  overlayBG: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SIDEBAR_WIDTH,
    height: "100%",
    // backgroundColor: "#161617",
    backgroundColor: "#0b0b0bff",
    paddingTop: 60,
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  spacer: {
    height: 10,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  navLabel: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 15,
  },
  profileSection: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },
  profilePic: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: "#222",
  },
  profilePlaceholder: {
    width: 42,
    height: 42,
    marginRight: 10,
  },
  usernameText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  fullnameText: {
    color: "#bbb",
    fontSize: 13,
  },
  signoutBtn: {
    backgroundColor: "#242a2c",
    padding: 10,
    borderRadius: 13,
    alignItems: "center",
  },
  signoutText: {
    color: "#19dee8",
    fontWeight: "bold",
  },
});
