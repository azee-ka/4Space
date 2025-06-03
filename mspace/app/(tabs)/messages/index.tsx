// app/messages/index.tsx

import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useRouter, useLocalSearchParams } from "expo-router";
import useApi from "../../../hooks/useApi";

import InboxScreen from "./inbox";
import RequestsScreen from "./requests";
import CreateMessageSheet from "./CreateMessageSheet";

export default function MessagesIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const currentTab = params.tab || "inbox"; // “inbox” or “requests”

  const [overlayVisible, setOverlayVisible] = useState(false);
  const { callApi } = useApi();

  const goToTab = useCallback(
  (tab: "inbox" | "requests") => {
    router.replace({ pathname: "/messages", params: { tab } });
  },
  [router]
);

  // Called when CreateMessageSheet’s “Start” is pressed:
  const onStartConversation = useCallback(
    async (recipients: { id: string }[]) => {
      setOverlayVisible(false);
      if (recipients.length > 0) {
        // If your API returns a new conversation ID, navigate there:
        const resp = await callApi("messages/create_conversation/", "POST", { users: recipients });
        const newConvId = resp.data.uuid;
        router.push({ pathname: `/messages/${newConvId}` });
        
        // For now, navigate to a placeholder:
        // router.push({
        //   pathname: `/messages/new`,
        //   params: { user: recipients[0].id },
        // });
      }
    },
    [router]
  );

  // Called whenever CreateMessageSheet’s input changes
  const searchUsers = useCallback(
    async (query: string) => {
      try {
        const resp = await callApi(`users/search/?q=${query}`);
        return resp.data.results as {
          id: string;
          username: string;
          profile_image?: string;
        }[];
      } catch {
        return [];
      }
    },
    [callApi]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── “Messages” Header ─── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          onPress={() => setOverlayVisible(true)}
          style={styles.headerButton}
        >
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* ─── Manual Tab Bar (Inbox / Requests) ─── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            currentTab === "inbox" && styles.tabItemActive,
          ]}
          onPress={() => goToTab("inbox")}
        >
          <Text
            style={[
              styles.tabText,
              currentTab === "inbox" && styles.tabTextActive,
            ]}
          >
            Inbox
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabItem,
            currentTab === "requests" && styles.tabItemActive,
          ]}
          onPress={() => goToTab("requests")}
        >
          <Text
            style={[
              styles.tabText,
              currentTab === "requests" && styles.tabTextActive,
            ]}
          >
            Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Content Area ─── */}
      <View style={styles.content}>
        {currentTab === "requests" ? (
          <RequestsScreen />
        ) : (
          <InboxScreen />
        )}
      </View>

      {/* ─── New Chat Sheet ─── */}
      <CreateMessageSheet
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
        onStartConversation={onStartConversation}
        searchUsers={searchUsers}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    height: 56,
    backgroundColor: "#1E1E1E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
  },
  headerButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#121212",
    borderBottomColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 1,
    height: 48,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemActive: {
    borderBottomColor: "#00FFFF",
    borderBottomWidth: 2,
  },
  tabText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#00FFFF",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
