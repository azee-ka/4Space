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
import { View, StyleSheet, ActivityIndicator } from "react-native";

// Hooks for profile + notifications
import useProfile from "../hooks/useProfile";
import useNotifications from "../hooks/useNotifications";
import { useNotificationsSocket } from "../state/services/notificationsSocket";

function AppStack() {
  // 1) Authentication
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // 2) Profile (only fetches once after login)
  const {
    minimalProfileData,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();

  // 3) Notifications (Redux + WebSocket)
  const { notifications, count } = useNotifications();
  useNotificationsSocket(isAuthenticated);

  // 4) Title logic from route segments
  const segments = useSegments();
  let currentTitle = "Home";
  if (segments.length > 1) {
    switch (segments[1]) {
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

  // 5) Don’t render anything until auth state is known
  if (authLoading) {
    return null;
  }

  // 6) If the user is authenticated but profile is still loading, show a spinner
  if (isAuthenticated && profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#19dee8" />
      </View>
    );
  }

  // 7) If there was a profile‐fetch error, you can warn or still show UI
  if (profileError) {
    console.warn("[AppStack] Profile fetch error:", profileError);
  }

  return (
    <View style={{ flex: 1 }}>
      {isAuthenticated && (
        <>
          <Navbar
            title={currentTitle}
            sidebarOpen={sidebarOpen}
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenNotifications={() => setNotifOpen(true)}
            notificationCount={count}
          />

          <Sidebar
            visible={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNavigate={(route) => {
              setSidebarOpen(false);
              // e.g. router.push(route)
            }}
            profileData={minimalProfileData || {}}
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

export default function RootLayout() {
  return (
    <Provider store={store}>
      {/* ← Keep exactly these edges so bottom‐tabs stay where they were */}
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <AppStack />
        <StatusBar style="auto" />
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
