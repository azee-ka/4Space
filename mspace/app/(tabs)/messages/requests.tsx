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
import ProfilePicture from "../../../utils/profilePicture/getProfilePicture";
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

export default function RequestsScreen() {
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
        router.push({
          pathname: `/messages/new`,
          params: { user: recipients[0].id },
        });
      }
    },
    [router]
  );

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

  const renderItem = ({ item }: { item: RequestType }) => {
    const user = item.other_participant.user;
    const extraCount = Math.max(0, item.group_participant_count - 1);
    return (
      <TouchableOpacity
        style={styles.chatRequestItem}
        onPress={() =>
          router.push({
            pathname: `/messages/${item.uuid}`,
          })
        }
      >
        <ProfilePicture
          src={user.profile_image}
          style={styles.chatAvatar}
        />
        <View style={styles.chatInfo}>
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
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No message requests.</Text>
            </View>
          }
        />
      )}

      {/* “New Chat” floating button in Requests */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chatRequestItem: {
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
  chatInfo: {
    flexDirection: "column",
  },
  chatName: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  chatUsername: {
    fontSize: 13,
    color: "#888888",
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#AAA",
  },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00FFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
});
