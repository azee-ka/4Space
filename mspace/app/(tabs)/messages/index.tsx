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
import ChatOverlay from "./ChatOverlay";

export default function MessagesIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const currentTab = params.tab || "inbox";

  // “+ → New Chat” sheet state
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Which conversation is open in ChatOverlay?
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);

  const { callApi } = useApi();

  const goToTab = useCallback(
    (tab: "inbox" | "requests") => {
      router.replace({ pathname: "/messages", params: { tab } });
    },
    [router]
  );

  // Called by InboxScreen / RequestsScreen when a conversation is tapped
  const onOpenConversation = useCallback((conversationUuid: string) => {
    setOpenConversationId(conversationUuid);
  }, []);

  // Called by CreateMessageSheet → “Start”
  const onStartConversation = useCallback(
    async (recipients: { id: string }[]) => {
      if (recipients.length === 0) return;
      try {
        const payload = recipients.map((u) => ({
          id: u.user?.id ?? u.id,
          username: u.user?.username ?? u.username,
        }));
        console.log('payload', payload);
        const res = await callApi("messages/create_conversation/", "POST", {
          recipients: payload,
        });
        const newUuid = res.data.conversation_uuid;
        setOverlayVisible(false);
        setOpenConversationId(newUuid);
      } catch (e) {
        console.error("Error starting conversation", e);
      }
    },
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          onPress={() => setOverlayVisible(true)}
          style={styles.headerButton}
        >
          <Icon name="plus" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
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

      {/* Content */}
      <View style={styles.content}>
        {currentTab === "requests" ? (
          <RequestsScreen onOpenConversation={onOpenConversation} />
        ) : (
          <InboxScreen />
        )}
      </View>

      {/* New Chat Sheet */}
      <CreateMessageSheet
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
        onStartConversation={onStartConversation}
      />

      {/* Chat Overlay */}
      {openConversationId !== null && (
        <ChatOverlay
          visible={true}
          conversationId={openConversationId}
          onClose={() => setOpenConversationId(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    // height: 56,
    // backgroundColor: "#1E1E1E",
    // flexDirection: "row",
    // alignItems: "center",
    // justifyContent: "space-between",
    // paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1E1E1E",
  },
  headerTitle: { 
    color: "#19dee8",
    fontSize: 24,
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#121212",
    borderBottomColor: "rgba(255,255,255,0.08)",
    borderBottomWidth: 1,
    height: 48,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabItemActive: { borderBottomColor: "#00FFFF", borderBottomWidth: 2 },
  tabText: { color: "#888", fontSize: 16, fontWeight: "500" },
  tabTextActive: { color: "#00FFFF" },
  content: { flex: 1, backgroundColor: "transparent" },
});
