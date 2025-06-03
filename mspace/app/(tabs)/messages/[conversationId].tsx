// app/messages/[conversationId].tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useRouter, useLocalSearchParams } from "expo-router";
import useApi from "../../../hooks/useApi"; // Adjust this import if your hooks folder is in a different relative path
import useWebSocket from "../../../hooks/useWebSocket"; // Likewise, point to your actual useWebSocket location
import ProfilePicture from "../../../utils/getProfilePicture";
import CustomTextarea from "./utils/CustomTextarea";
import {
  shouldGroupMessages,
  isFirstGroupedMessage,
  isLastGroupedMessage,
} from "./utils/messageGrouping";
import DOMPurify from "dompurify";

type MessageType = {
  uuid: string;
  text: string;
  sender_username: string;
  sent_at: string;
};

type ConversationType = {
  participants: Array<{
    user: {
      id: number;
      first_name: string;
      last_name: string;
      username: string;
      profile_image: string | null;
    };
  }>;
  view_type: "inbox" | "request";
  conversation_status: "blocked" | "invite" | "allowed" | string;
};

export default function ChatScreen() {
  const { callApi } = useApi();
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId: string }>();
  const conversationId = params.conversationId!;

  const [conversation, setConversation] = useState<ConversationType | null>(
    null
  );
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [input, setInput] = useState("");
  const [justSent, setJustSent] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // ─── 1) Fetch conversation details ───
  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const resp = await callApi(
          `messages/get_conversation_details/${conversationId}/`
        );
        // console.log('fetchConversation', resp.data)
        setConversation(resp.data);
      } catch (err) {
        console.error("Error fetching conversation details:", err);
      }
    };
    fetchConversation();
  }, [conversationId]);

  // ─── 2) Paginated fetch of messages ───
  const fetchMessages = useCallback(
    async (pageToLoad: number) => {
      try {
        const resp = await callApi(
          `messages/get_messages/${conversationId}/?limit=30&offset=${
            pageToLoad * 30
          }`
        );
        const { results, next } = resp.data;
        if (pageToLoad === 0) {
          setMessages(results);
        } else {
          setMessages((prev) => [...results, ...prev]);
        }
        setHasMore(!!next);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    setLoading(true);
    fetchMessages(0);
    setPage(1);
  }, [fetchMessages]);

  // ─── 3) WebSocket hook called at top level ───
  //     always call hooks at top of component!
  const { socketRef, sendMessage } = useWebSocket(
    `messages/inbox/${conversationId}/`,
    {
      onMessage: (data: MessageType) => {
        setMessages((prev) => {
          if (prev.some((m) => m.uuid === data.uuid)) return prev;
          return [...prev, data];
        });
      },
      onOpen: () => {
        console.log("WebSocket connected to conversation", conversationId);
      },
      onClose: () => {
        console.log("WebSocket closed for conversation", conversationId);
      },
      onError: (err) => {
        console.error("WebSocket error:", err);
      },
      // Re-run the hook whenever conversationId changes
      dependencies: [conversationId],
    }
  );

  // ─── 4) Clean up WebSocket on unmount or conversationId change ───
  useEffect(() => {
    return () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.close();
      }
    };
  }, [socketRef]);

  // ─── 5) Auto‐scroll behavior ───
  const chatListRef = useRef<FlatList<MessageType>>(null);
  useEffect(() => {
    if (chatListRef.current && (!userScrolledUp || justSent)) {
      chatListRef.current.scrollToEnd({ animated: true });
      setJustSent(false);
    }
  }, [messages, userScrolledUp, justSent]);

  // ─── 6) Handle sending a new message ───
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const safeText = DOMPurify.sanitize(trimmed);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Use the sendMessage callback returned by `useWebSocket`
      sendMessage({
        text: safeText,
        sender_username: "CURRENT_USERNAME", // replace with your actual username from auth state
      });
      setInput("");
      setJustSent(true);
    } else {
      console.warn("WebSocket not open; cannot send message.");
    }
  };

  // ─── 7) Accept / Reject / Block logic for “requests” ───
  const handleAcceptRequest = async () => {
    try {
      await callApi(`messages/request/${conversationId}/accept/`, "POST");
      const updated = await callApi(
        `messages/get_conversation_details/${conversationId}`
      );
      setConversation(updated.data);
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };
  const handleRejectRequest = async () => {
    try {
      await callApi(`messages/request/${conversationId}/reject/`, "POST");
      router.push("/messages/requests");
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };
  const handleBlockRequest = async () => {
    try {
      await callApi(`messages/request/${conversationId}/block/`, "POST");
      router.push("/messages/requests");
    } catch (err) {
      console.error("Error blocking request:", err);
    }
  };

  // ─── 8) Helper: is message from current user? ───
  const isOwnMessage = (msg: MessageType) => {
    return msg.sender_username === "CURRENT_USERNAME";
  };

  // ─── 9) Render Footer (either input box or Accept/Reject UI) ───
  const renderFooter = () => {
    if (!conversation) return null;
    const { view_type, conversation_status } = conversation;
    const isBlocked = conversation_status === "blocked";
    const isInvite = conversation_status === "invite";
    const isInviteAccepted = conversation_status === "allowed";
    const inviteWasSent = messages.length >= 1;

    // If blocked → show “You cannot send messages”
    if (isBlocked) {
      return (
        <View style={styles.requestWarningContainer}>
          <Text style={styles.requestWarningText}>
            You cannot send messages in this conversation.
          </Text>
        </View>
      );
    }

    // If it’s an “invite” and a message was already sent → show “Invite Sent”
    if (isInvite && inviteWasSent) {
      return (
        <View style={styles.requestWarningContainer}>
          <Text style={styles.requestWarningHeading}>Invite Sent</Text>
          <Text style={styles.requestWarningText}>
            You can send more messages once your request is accepted.
          </Text>
        </View>
      );
    }

    // If it’s an invite & no messages yet (view_type=inbox), OR it's accepted inbox
    if (
      (isInvite && messages.length === 0 && view_type === "inbox") ||
      (isInviteAccepted && view_type === "inbox")
    ) {
      return (
        <>
          {isInvite && messages.length === 0 && (
            <View style={styles.inviteInfoPanel}>
              <Text style={styles.inviteHeading}>New Chat Request</Text>
              <Text style={styles.inviteDescription}>
                You can send{" "}
                <Text style={{ fontWeight: "600" }}>one message</Text> as a
                request. The recipient must accept it before further replies.
              </Text>
            </View>
          )}
          <View style={styles.writeMessageContainer}>
            <Icon
              name="smile"
              size={24}
              color="#ccc"
              style={{ marginRight: 8 }}
            />
            <CustomTextarea
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              style={styles.chatTextarea}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={styles.sendMessageBtn}
            >
              <Icon name="send" size={20} color="#00EAFF" />
            </TouchableOpacity>
          </View>
        </>
      );
    }

    // If it’s a “request” view (someone else’s request) → show Accept/Reject/Block
    if (view_type === "request") {
      return (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.requestBtnPrimary}
            onPress={handleAcceptRequest}
          >
            <Text style={styles.requestBtnTextPrimary}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.requestBtnSubtle}
            onPress={handleRejectRequest}
          >
            <Text style={styles.requestBtnTextSubtle}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.requestBtnDanger}
            onPress={handleBlockRequest}
          >
            <Text style={styles.requestBtnTextDanger}>Block</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ─── 10) Show a loading spinner until conversation + first messages arrive ───
  if (loading && !conversation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#19dee8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Chat Header: avatars + names ─── */}
      <View style={styles.chatHeader}>
        {conversation?.participants && (
          <>
            <View style={styles.avatarGroup}>
              {conversation.participants
                .filter((p) => p.user.username !== "CURRENT_USERNAME")
                .slice(0, 3)
                .map((p, idx) => (
                  <ProfilePicture
                    key={p.user.id}
                    src={p.user.profile_image}
                    style={[
                      styles.stackedAvatar,
                      { left: idx * 22, zIndex: 3 - idx },
                    ]}
                  />
                ))}
              {conversation.participants.length > 4 && (
                <View style={[styles.stackedAvatar, styles.stackedExtra]}>
                  <Text style={{ color: "#FFF", fontSize: 12 }}>
                    +{conversation.participants.length - 3}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName}>
                {conversation.participants
                  .filter((p) => p.user.username !== "CURRENT_USERNAME")
                  .map((p) => `${p.user.first_name} ${p.user.last_name}`)
                  .join(", ")}
              </Text>
              <Text style={styles.chatHeaderUsername}>
                {conversation.participants
                  .filter((p) => p.user.username !== "CURRENT_USERNAME")
                  .map((p) => `@${p.user.username}`)
                  .join(", ")}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ─── Chat Body: FlatList of message “bubbles” ─── */}
      <FlatList
        ref={chatListRef}
        data={messages}
        keyExtractor={(item) => item.uuid}
        renderItem={({ item, index }) => {
          const previous = messages[index - 1];
          const next = messages[index + 1];
          const grouped = shouldGroupMessages(item, previous);
          const first = isFirstGroupedMessage(item, previous);
          const last = isLastGroupedMessage(item, next);
          const emojiOnly =
            /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\s]+$/u.test(
              item.text.trim()
            );
          const own = isOwnMessage(item);

          return (
            <React.Fragment>
              {(!grouped ||
                new Date(item.sent_at).getTime() -
                  new Date(previous?.sent_at || 0).getTime() >
                  15 * 60 * 1000) && (
                <Text style={styles.chatTimestamp}>
                  {new Date(item.sent_at).toLocaleString()}
                </Text>
              )}
              <View
                style={[
                  styles.chatBubbleRow,
                  own ? styles.chatBubbleRowOwn : styles.chatBubbleRowOther,
                  grouped ? {} : { marginVertical: 4 },
                ]}
              >
                <View style={styles.bubbleWrapper}>
                  <View
                    style={[
                      styles.chatBubble,
                      own ? styles.chatBubbleOwn : styles.chatBubbleOther,
                      grouped && first && own && styles.chatBubbleFirstOwn,
                      grouped && last && own && styles.chatBubbleLastOwn,
                      grouped && first && !own && styles.chatBubbleFirstOther,
                      grouped && last && !own && styles.chatBubbleLastOther,
                      emojiOnly && styles.emojiOnlyBubble,
                    ]}
                  >
                    <Text
                      style={emojiOnly ? styles.emojiText : styles.bubbleText}
                    >
                      {item.text}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.ellipsisBtn}>
                    <Icon name="more-vertical" size={16} color="#AAA" />
                  </TouchableOpacity>
                </View>
              </View>
            </React.Fragment>
          );
        }}
        contentContainerStyle={styles.chatBody}
        onScroll={(e) => {
          const offsetY = e.nativeEvent.contentOffset.y;
          const atBottom =
            e.nativeEvent.contentSize.height -
              offsetY -
              e.nativeEvent.layoutMeasurement.height <
            10;
          setUserScrolledUp(!atBottom);

          if (offsetY < 100 && hasMore && !loading) {
            fetchMessages(page);
            setPage((prev) => prev + 1);
          }
        }}
        scrollEventThrottle={16}
      />

      {/* ─── Chat Footer: either TextInput or “Accept/Reject” UI ─── */}
      <View style={styles.chatFooter}>{renderFooter()}</View>
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
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(63,69,79,0.13)",
    borderBottomColor: "rgba(255,255,255,0.04)",
    borderBottomWidth: 1,
  },
  avatarGroup: {
    flexDirection: "row",
    width: 64,
    height: 46,
    position: "relative",
    marginRight: 12,
  },
  stackedAvatar: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(140,200,200,0.25)",
    backgroundColor: "#2e2e2e",
  },
  stackedExtra: {
    left: 66,
    zIndex: 0,
    backgroundColor: "#444",
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderInfo: {
    flexDirection: "column",
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#EEF5F8",
  },
  chatHeaderUsername: {
    fontSize: 13,
    color: "#9FB5C2",
  },
  chatBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatTimestamp: {
    textAlign: "center",
    fontSize: 10,
    color: "#BABABA",
    marginVertical: 6,
  },
  chatBubbleRow: {
    maxWidth: "70%",
  },
  chatBubbleRowOwn: {
    alignSelf: "flex-end",
  },
  chatBubbleRowOther: {
    alignSelf: "flex-start",
  },
  bubbleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatBubble: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  chatBubbleOwn: {
    backgroundColor: "rgba(87,187,253,0.4)",
    borderColor: "rgba(0,161,220,0.13)",
  },
  chatBubbleOther: {
    backgroundColor: "rgba(124,124,232,0.36)",
    borderColor: "rgba(120,100,200,0.13)",
  },
  chatBubbleFirstOwn: {
    borderTopRightRadius: 14,
    borderTopLeftRadius: 14,
  },
  chatBubbleLastOwn: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginBottom: 4,
  },
  chatBubbleFirstOther: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  chatBubbleLastOther: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    marginBottom: 4,
  },
  emojiOnlyBubble: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    padding: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: "#E0F8FF",
  },
  emojiText: {
    fontSize: 28,
  },
  ellipsisBtn: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
  },
  chatFooter: {
    borderTopColor: "rgba(255,255,255,0.04)",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  requestWarningContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  requestWarningHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00EAFF",
    marginBottom: 6,
  },
  requestWarningText: {
    fontSize: 12,
    color: "#D5D5D5",
    lineHeight: 18,
  },
  inviteInfoPanel: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  inviteHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00EAFF",
    marginBottom: 4,
  },
  inviteDescription: {
    fontSize: 12,
    color: "#C4C4C4",
    lineHeight: 18,
  },
  writeMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  chatTextarea: {
    flex: 1,
    fontSize: 14,
    color: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginRight: 8,
  },
  sendMessageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  requestBtnPrimary: {
    flex: 1,
    backgroundColor: "rgba(0,200,255,0.15)",
    borderColor: "rgba(0,255,255,0.2)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  requestBtnTextPrimary: {
    color: "#00EAFF",
    fontWeight: "500",
  },
  requestBtnSubtle: {
    flex: 1,
    backgroundColor: "rgba(180,180,180,0.1)",
    borderColor: "rgba(200,200,200,0.12)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  requestBtnTextSubtle: {
    color: "#CCCCCC",
    fontWeight: "500",
  },
  requestBtnDanger: {
    flex: 1,
    backgroundColor: "rgba(255,80,80,0.12)",
    borderColor: "rgba(255,0,0,0.2)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  requestBtnTextDanger: {
    color: "#FF6B6B",
    fontWeight: "500",
  },
});
