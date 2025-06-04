// app/messages/requests.tsx

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

type RequestType = {
  uuid: string;
  other_participant: {
    user: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
      profile_image: string | null;
    };
  };
  group_participant_count: number;
};

export default function RequestsScreen({ onOpenConversation }: { onOpenConversation: (id: string) => void }) {
  const router = useRouter();
  const { callApi } = useApi();

  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await callApi("messages/list_conversations_requests/");
        setRequests(res.data as RequestType[]);
      } catch (err) {
        console.error("Failed to fetch requests", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [callApi]);

  const onStartConversation = useCallback(
    async (recipients: { id: string }[]) => {
      setOverlayVisible(false);
      if (recipients.length > 0) {
        // Mirror Inbox behavior: create a new conversation via API
        try {
          const payload = recipients.map((u) => ({
            id: u.id,
            username: u.username,
          }));
          const res = await callApi("messages/create_conversation/", "POST", {
            recipients: payload,
          });
          router.push({ pathname: `/messages/${res.data.conversation_uuid}` });
        } catch (e) {
          console.error("Error starting conversation", e);
        }
      }
    },
    [router, callApi]
  );

  const renderItem = ({ item }: { item: RequestType }) => {
    const user = item.other_participant.user;
    const extraCount = Math.max(0, item.group_participant_count - 1);
    return (
      <TouchableOpacity
        style={styles.chatCard}
        // onPress={() =>
        //   router.push({
        //     pathname: `/messages/${item.uuid}`,
        //   })
        // }
        onPress={() => onOpenConversation(item.uuid)}
      >
        <ProfilePicture src={user.profile_image} style={styles.chatAvatar} />
        <View style={styles.chatMeta}>
          <Text style={styles.chatName}>
            {user.first_name} {user.last_name}
            {extraCount > 0 && <Text> +{extraCount}</Text>}
          </Text>
          <Text style={styles.chatUsername}>@{user.username}</Text>
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
          data={requests}
          keyExtractor={(item) => item.uuid}
          renderItem={renderItem}
          contentContainerStyle={styles.chatList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No message requests.</Text>
            </View>
          }
        />
      )}

      {/* “New Chat” floating button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setOverlayVisible(true)}
      >
        <Icon name="plus" size={20} color="#FFF" />
      </TouchableOpacity>

      <CreateMessageSheet
        visible={overlayVisible}
        onClose={() => setOverlayVisible(false)}
        onStartConversation={onStartConversation}
      />
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
