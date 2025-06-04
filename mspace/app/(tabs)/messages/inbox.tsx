// app/messages/inbox.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useRouter } from "expo-router";
import useApi from "../../../hooks/useApi";
import ProfilePicture from "../../../utils/getProfilePicture";
import CreateMessageSheet from "./CreateMessageSheet";
import useAuth from "../../../hooks/useAuth";
import ChatOverlay from "./ChatOverlay";

type ChatType = {
  uuid: string;
  group_participant_count: number;
  other_participant: {
    user: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
      profile_image: string | null;
    };
  };
};

export default function InboxScreen() {
  const router = useRouter();
  const { callApi } = useApi();
  const { authState } = useAuth();
  const [chats, setChats] = useState<ChatType[]>([]);
  const [loading, setLoading] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Fetch “inbox” list
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const resp = await callApi("messages/list_conversations/");
        console.log("chatsArray", resp.data);
        setChats(resp.data);
      } catch (err) {
        console.error("Failed to fetch inbox", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [authState]);

  const [openConversationId, setOpenConversationId] = useState<string | null>(null);
  const onOpenConversation = useCallback((conversationUuid: string) => {
    setOpenConversationId(conversationUuid);
  }, []);

  // New Chat callbacks
  const onStartConversation = useCallback(
    async (recipients: { id: string }[]) => {
      if (recipients.length === 0) return;
      try {
        const payload = recipients.map((u) => ({
          id: u.user?.id ?? u.id,
          username: u.user?.username ?? u.username,
        }));
        const res = await callApi("messages/create_conversation/", "POST", {
          recipients: payload,
        });
        const newUuid = res.data.conversation_uuid;
        console.log("res chat", res.data);
        setOverlayVisible(false);
        setOpenConversationId(newUuid);
      } catch (e) {
        console.error("Error starting conversation", e);
      }
    },
    []
  );

  const renderItem = ({ item }: { item: ChatType }) => {
    const { group_participant_count: count } = item;
    const firstUser = item.other_participant.user;
    const extraCount = count - 1; // how many “other” participants beyond the one we show

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => onOpenConversation(item.uuid)}
      >
        <ProfilePicture src={firstUser.profile_image} style={styles.chatAvatar} />

        <View style={styles.chatMeta}>
          {/* 
            Show “First Last” always.
            If it’s a group (count > 1), append +extraCount.
          */}
          <Text style={styles.chatName}>
            {firstUser.first_name} {firstUser.last_name}{" "}
            {extraCount > 0 ? `+${extraCount}` : ""}
          </Text>
          {/* 
            Underneath, you can still show a subtitle—e.g. “@username” for 1:1,
            or “X participants” for group. Adjust as desired.
          */}
          {count === 1 ? (
            <Text style={styles.chatUsername}>@{firstUser.username}</Text>
          ) : (
            <Text style={styles.chatUsername}>{count} participants</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#19dee8" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet.</Text>
            </View>
          }
        />
      )}

      <CreateMessageSheet
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
        onStartConversation={onStartConversation}
      />

      {openConversationId !== null && (
        <ChatOverlay
          visible={true}
          conversationId={openConversationId}
          onClose={() => setOpenConversationId(null)}
        />
      )}

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setOverlayVisible(true)}
      >
        <Icon name="plus" size={20} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: 10,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chatMeta: {
    flexDirection: "column",
  },
  chatName: {
    fontSize: 16,
    color: "#F0F0F0",
  },
  chatUsername: {
    fontSize: 13,
    color: "#999999",
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999999",
  },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgb(0, 179, 203)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
