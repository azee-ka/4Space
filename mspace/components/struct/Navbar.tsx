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
}) {
  return (
    <View style={styles.navbar}>
      {/* Left: Hamburger + Logo (floats above sidebar) */}
      <View
        style={[
          styles.leftSection,
          styles.leftAboveSidebar,
          sidebarOpen && { backgroundColor: '#161617' },
        ]}
      >
        <SidebarMenuIcon sidebarOpen={sidebarOpen} onPress={onOpenSidebar} />
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.logoText}>4Space</Text>
      </View>

      {/* Center: Title */}
      <View style={styles.centerSection}>
        {/* <Text style={styles.screenTitle}>{title}</Text> */}
      </View>

      {/* Right: Notification */}
      <TouchableOpacity
        onPress={onOpenNotifications}
        style={styles.iconButton}
      >
        <Icon name="bell" size={25} color="#19dee8" />
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
    // backgroundColor: '#000',
    backgroundColor: "#121212",
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderColor: '#333',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // Only this left block floats above sidebar
  leftAboveSidebar: {
    position: 'absolute',
    left: 10,
    top: 0,
    height: 53,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,             // above sidebar (zIndex: 99)
    // backgroundColor: '#000',  // default, changes when sidebarOpen
    backgroundColor: "#121212",
    paddingHorizontal: 0,     // match navbar padding
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  screenTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 40, // adjust to keep centered visually
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
});
