import { Provider } from "react-redux";
import store from "../state/store";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";
import Navbar from "../components/struct/Navbar";
import NotificationSidebar from "../components/struct/NotificationSidebar";
import Sidebar from "../components/struct/Sidebar";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";

// This is the main navigation/stack logic
function AppStack() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Example profile data and notifications (replace with real)
  const profileData = {
    username: "gizmo",
    profile_image: "https://yourdomain.com/myprofileimg.png",
    first_name: "Gizmo",
    last_name: "Bot"
  };
  const notifications = [
    {
      id: 1,
      title: "Welcome!",
      message: "Hello world",
      sender: { profile_image: "https://yourdomain.com/someimg.png" }
    }
  ];

  if (isLoading) return null;

  // console.log('isAuthenticated', isAuthenticated)

  return (
    <View style={{ flex: 1 }}>
      {isAuthenticated && (
        <>
          <Navbar
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenNotifications={() => setNotifOpen(true)}
          />
          <Sidebar
            visible={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNavigate={route => {
              // Example navigation: implement using router
              setSidebarOpen(false);
            }}
            profileData={profileData}
            onSignOut={async () => {
              setSidebarOpen(false); // close sidebar
              await logout();        // this clears redux and AsyncStorage
              // Optionally: navigate to login screen if not handled by auth state
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
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <AppStack />
        <StatusBar style="auto" />
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#161617" }
});
