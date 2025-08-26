// /components/struct/Navbar.js

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import SidebarMenuIcon from '../../utils/siderbarIcon/SidebarMenuIcon';

export default function Navbar({
  title,
  sidebarOpen,
  onOpenSidebar,
  onOpenNotifications,
  notificationCount = 0,   // ← new prop
}) {
  return (
    <View style={styles.navbar}>
      {/* Left: Hamburger + Logo */}
      <View
        style={[
          styles.leftSection,
          styles.leftAboveSidebar,
          sidebarOpen && { 
            backgroundColor: '#0b0b0bff' 
          },
        ]}
      >
        <SidebarMenuIcon sidebarOpen={sidebarOpen} onPress={onOpenSidebar} />
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.logoText}>4Space</Text>
      </View>

      {/* Center: (you can put the title here if desired) */}
      <View style={styles.centerSection}>
        {/* <Text style={styles.screenTitle}>{title}</Text> */}
      </View>

      {/* Right: Notification (bell icon with badge) */}
      <TouchableOpacity onPress={onOpenNotifications} style={styles.iconButton}>
        <Icon name="bell" size={25} color="#19dee8" />

        {/* Render badge if there are unread notifications */}
        {notificationCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
    // backgroundColor: '#121212',
    backgroundColor: "#000",
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderColor: '#333',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftAboveSidebar: {
    position: 'absolute',
    left: 10,
    top: 0,
    height: 53,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,             
    // backgroundColor: '#121212',
    backgroundColor: "#000",
    paddingHorizontal: 0,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  screenTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 40,
  },
  logo: {
    width: 22,
    height: 28,
    marginRight: 3,
  },
  logoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  iconButton: {
    padding: 8,
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
