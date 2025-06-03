// /app/_layout.js

import React, { useState } from "react";
import { Provider } from "react-redux";
import store from "../state/store";
import { StatusBar } from "expo-status-bar";
import { Stack, useSegments } from "expo-router";
import useAuth from "../hooks/useAuth";
import Navbar from "../components/struct/Navbar";
import NotificationSidebar from "../components/struct/NotificationSidebar";
import Sidebar from "../components/struct/Sidebar";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <AppStack />
        <StatusBar style="auto" />
      </SafeAreaView>
    </Provider>
  );
}

function AppStack() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const segments = useSegments();
  const isOnConversation =
    segments[1] === "messages" && segments.length === 3;

  let currentTitle = "Home";
  if (segments.length > 1) {
    const route = segments[1];
    switch (route) {
      case "timeline":
        currentTitle = "Timeline";
        break;
      case "explore":
        currentTitle = "Explore";
        break;
      case "messages":
        currentTitle = "Messages";
        break;
      case "profile":
        currentTitle = "Profile";
        break;
      default:
        currentTitle = "Home";
    }
  }

  if (isLoading) return null;

  const profileData = {
    username: "gizmo",
    profile_image: "https://yourdomain.com/myprofileimg.png",
    first_name: "Gizmo",
    last_name: "Bot",
  };
  const notifications = [
    {
      id: 1,
      title: "Welcome!",
      message: "Hello world",
      sender: { profile_image: "https://yourdomain.com/someimg.png" },
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      {isAuthenticated && !isOnConversation && (
        <>
          <Navbar
            title={currentTitle}
            sidebarOpen={sidebarOpen}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenNotifications={() => setNotifOpen(true)}
          />
          <Sidebar
            visible={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNavigate={(route) => {
              setSidebarOpen(false);
            }}
            profileData={profileData}
            onSignOut={async () => {
              setSidebarOpen(false);
              await logout();
            }}
          />
          <NotificationSidebar
            visible={notifOpen}
            onClose={() => setNotifOpen(false)}
            notifications={notifications}
          />
        </>
      )}

      <Stack>
        {isAuthenticated ? (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="+not-found" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
});
