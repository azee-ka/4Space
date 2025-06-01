import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export default function Navbar({ onOpenSidebar, onOpenNotifications }) {
  return (
    <View style={styles.navbar}>
      {/* Left: Hamburger + Logo */}
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onOpenSidebar} style={{ marginRight: 10 }}>
          <Icon name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.logoText}>4Space</Text>
      </View>
      {/* Right: Notification */}
      <TouchableOpacity onPress={onOpenNotifications}>
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
    backgroundColor: '#161617',
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderColor: '#333'
  },
  leftSection: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 22, height: 28, marginRight: 3 },
  logoText: { color: '#fff', fontWeight: 'bold', fontSize: 20 }
});
