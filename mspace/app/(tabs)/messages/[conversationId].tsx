// /app/messages/[conversationId].tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActionSheetIOS,
  Alert,
  Modal,
  Animated,
  Easing,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import useApi from "../../../hooks/useApi";
import useWebSocket from "../../../hooks/useWebSocket";
import ProfilePicture from "../../../utils/getProfilePicture";
import {
  shouldGroupMessages,
  isFirstGroupedMessage,
  isLastGroupedMessage,
} from "./utils/messageGrouping";
import useAuth from "@/hooks/useAuth";

//
// Add this at the very top to hide the bottom Tabs when this screen is active:
export const unstable_settings = {
  tabBarStyle: { display: "none" },
};

type MessageType = {
  uuid: string;
  text: string;
  sender_username: string;
  sent_at: string;
  _optimistic?: boolean;
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

function isEmojiOnlyMessage(text: string) {
  const cleaned = text.replace(/[\s\u200B]/g, "");
  if (!cleaned) return false;
  const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F)$/u;
  return [...cleaned].every((char) => emojiRegex.test(char));
}

export default function ChatScreen() {
  const { authState } = useAuth();
  const currentUsername = authState?.current?.user?.username || "UNKNOWN";
  const { callApi } = useApi();
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  // ── State for conversation & messages ──
  const [conversation, setConversation] = useState<ConversationType | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // ── State for input & scrolling ──
  const [input, setInput] = useState("");
  const [justSent, setJustSent] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const flatListRef = useRef<FlatList<MessageType>>(null);

  // ── State for long-press popup ──
  const [focusedMessage, setFocusedMessage] = useState<MessageType | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // ── 1) Fetch conversation details ──
  useEffect(() => {
    async function fetchConversation() {
      try {
        const resp = await callApi(
          `messages/get_conversation_details/${conversationId}/`
        );
        setConversation(resp.data);
      } catch (err) {
        console.error("Error fetching conversation details:", err);
      }
    }
    fetchConversation();
  }, [conversationId]);

  // ── 2) Paginated fetch of messages ──
  const fetchMessages = useCallback(
    async (pageToLoad: number) => {
      try {
        if (pageToLoad === 0) setLoading(true);
        else setLoadingOlder(true);

        const resp = await callApi(
          `messages/get_messages/${conversationId}/?limit=30&offset=${
            pageToLoad * 30
          }`
        );
        const { results, next } = resp.data;

        if (pageToLoad === 0) {
          setMessages(results);
        } else {
          setMessages((prev) => [...prev, ...results]);
        }

        setHasMore(!!next);
        setPage(pageToLoad + 1);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        if (pageToLoad === 0) setLoading(false);
        else setLoadingOlder(false);
      }
    },
    [conversationId]
  );

  // Initial messages load
  useEffect(() => {
    fetchMessages(0);
  }, []);

  // ── 3) WebSocket for real‐time incoming ──
  const { sendMessage } = useWebSocket(
    `messages/inbox/${conversationId}/`,
    {
      onMessage: (data) => {
        setMessages((prev) => {
          if (prev.some((m) => m.uuid === data.uuid)) return prev;
          return [data, ...prev];
        });
      },
    }
  );

  // ── 4) Auto‐scroll to bottom logic ──
  useEffect(() => {
    if (!loadingOlder && flatListRef.current) {
      if (!justSent && !userScrolledUp && loading === false) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }
  }, [messages, userScrolledUp, justSent, loadingOlder, loading]);

  // ── 5) Handle sending a message ──
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    setJustSent(true);
    sendMessage({
      text: trimmed,
      sender_username: currentUsername,
    });
  };

  // ── 6) Accept / Reject / Block for request‐type convos ──
  const handleAcceptRequest = async () => {
    try {
      await callApi(`messages/request/${conversationId}/accept/`, "POST");
      const updated = await callApi(
        `messages/get_conversation_details/${conversationId}/`
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

  // ── 7) Helper: is this the current user’s message? ──
  const isOwnMessage = (m: MessageType) => m.sender_username === currentUsername;

  // ── 8) Footer (input or request UI) ──
  const renderFooter = () => {
    if (!conversation) return null;
    const { view_type, conversation_status } = conversation;
    const isBlocked = conversation_status === "blocked";
    const isInvite = conversation_status === "invite";
    const isInviteAccepted = conversation_status === "allowed";
    const inviteSentOnce = messages.length > 0;

    if (isBlocked) {
      return (
        <View style={styles.requestWarningContainer}>
          <Text style={styles.requestWarningText}>
            You cannot send messages in this conversation.
          </Text>
        </View>
      );
    }

    if (isInvite && inviteSentOnce) {
      return (
        <View style={styles.requestWarningContainer}>
          <Text style={styles.requestWarningHeading}>Invite Sent</Text>
          <Text style={styles.requestWarningText}>
            You can send more messages once your request is accepted.
          </Text>
        </View>
      );
    }

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
              size={22}
              color="#818CF8"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.chatTextarea}
              placeholder="Type a message…"
              placeholderTextColor="#6B7280"
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={() => {
                if (input.trim()) handleSend();
              }}
            />
            <TouchableOpacity onPress={handleSend} style={styles.sendMessageBtn}>
              <Icon name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      );
    }

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

  // ── 9) Show loader until we have conversation + first messages ──
  if (loading && !conversation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#818CF8" />
      </View>
    );
  }

  // ── 10) Date separator renderer ──
  function renderDateSeparator(
    msg: MessageType,
    prev: MessageType | undefined
  ) {
    if (!prev) {
      return (
        <View style={styles.dateSeparatorWrapper}>
          <Text style={styles.dateSeparatorText}>
            {new Date(msg.sent_at).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      );
    }
    const curr = new Date(msg.sent_at).getTime();
    const pr = new Date(prev.sent_at).getTime();
    if (curr - pr > 15 * 60 * 1000) {
      return (
        <View style={styles.dateSeparatorWrapper}>
          <Text style={styles.dateSeparatorText}>
            {new Date(msg.sent_at).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      );
    }
    return null;
  }

  // ── 11) Fetch older when user scrolls to top ──
  const onEndReached = () => {
    if (hasMore && !loadingOlder) {
      fetchMessages(page);
    }
  };

  // ── 12) Track user scroll position ──
  const onScroll = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const contentHeight = e.nativeEvent.contentSize.height;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const distanceFromBottom = contentHeight - offsetY - layoutHeight;
    setUserScrolledUp(distanceFromBottom > 50);
  };

  // ── 13) Open & close popup ──
  const openPopup = (message: MessageType) => {
    setFocusedMessage(message);
    scaleAnim.setValue(0);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const closePopup = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setFocusedMessage(null);
    });
  };

  // ── 14) Show action menu inside popup ──
  const showActionMenu = (message: MessageType) => {
    const options = ["Unsend Message", "Report Message", "Cancel"];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            console.log("Unsend:", message.uuid);
          } else if (buttonIndex === 1) {
            console.log("Report:", message.uuid);
          }
          closePopup();
        }
      );
    } else {
      Alert.alert(
        "",
        "",
        [
          {
            text: "Unsend Message",
            onPress: () => {
              console.log("Unsend:", message.uuid);
              closePopup();
            },
          },
          {
            text: "Report Message",
            style: "destructive",
            onPress: () => {
              console.log("Report:", message.uuid);
              closePopup();
            },
          },
          { text: "Cancel", style: "cancel", onPress: closePopup },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#F4F4F5" />
        </TouchableOpacity>

        {conversation?.participants && (
          <>
            <View style={styles.avatarGroup}>
              {conversation.participants
                .filter((p) => p.user.username !== currentUsername)
                .slice(0, 3)
                .map((p, idx) => (
                  <View
                    key={p.user.id}
                    style={[
                      styles.avatarWrapper,
                      { left: idx * 18, zIndex: 3 - idx },
                    ]}
                  >
                    <ProfilePicture
                      src={p.user.profile_image}
                      style={styles.stackedAvatar}
                    />
                  </View>
                ))}
              {conversation.participants.length > 4 && (
                <View style={[styles.avatarWrapper, styles.stackedExtra]}>
                  <Text style={styles.extraCountText}>
                    +{conversation.participants.length - 3}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderName} numberOfLines={1}>
                {conversation.participants
                  .filter((p) => p.user.username !== currentUsername)
                  .map((p) => `${p.user.first_name} ${p.user.last_name}`)
                  .join(", ")}
              </Text>
              <Text style={styles.chatHeaderUsername} numberOfLines={1}>
                {conversation.participants
                  .filter((p) => p.user.username !== currentUsername)
                  .map((p) => `@${p.user.username}`)
                  .join(", ")}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ── Message List ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.uuid}
        inverted
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() =>
          loadingOlder ? (
            <ActivityIndicator
              size="small"
              color="#818CF8"
              style={{ marginTop: 12 }}
            />
          ) : null
        }
        renderItem={({ item, index }) => {
          const prev = messages[index + 1];
          const next = messages[index - 1];
          const grouped = shouldGroupMessages(item, prev);
          const first = isFirstGroupedMessage(item, prev);
          const last = isLastGroupedMessage(item, next);
          const plainText = item.text.replace(/<\/?[^>]+(>|$)/g, "").trim();
          const emojiOnly = isEmojiOnlyMessage(plainText);
          const own = isOwnMessage(item);

          return (
            <View key={item.uuid}>
              {renderDateSeparator(item, prev)}
              <View
                style={[
                  styles.chatBubbleRow,
                  own ? styles.chatBubbleRowOwn : styles.chatBubbleRowOther,
                  grouped ? { marginVertical: 4 } : { marginVertical: 8 },
                ]}
              >
                <View style={styles.bubbleWrapper}>
                  {!own && first && (
                    <ProfilePicture
                      src={
                        conversation?.participants.find(
                          (p) => p.user.username === item.sender_username
                        )?.user.profile_image || null
                      }
                      style={styles.messageAvatar}
                    />
                  )}

                  <Pressable
                    onLongPress={() => openPopup(item)}
                    style={({ pressed }) => [
                      styles.chatBubble,
                      own ? styles.chatBubbleOwn : styles.chatBubbleOther,
                      grouped && first && own && styles.chatBubbleFirstOwn,
                      grouped && last && own && styles.chatBubbleLastOwn,
                      grouped && first && !own && styles.chatBubbleFirstOther,
                      grouped && last && !own && styles.chatBubbleLastOther,
                      emojiOnly && styles.emojiOnlyBubble,
                      item._optimistic && styles.optimisticBubble,
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Text
                      style={
                        emojiOnly
                          ? styles.emojiText
                          : own
                          ? styles.bubbleTextOwn
                          : styles.bubbleTextOther
                      }
                    >
                      {item.text}
                    </Text>
                  </Pressable>
{/* 
                  <TouchableOpacity style={styles.ellipsisBtn}>
                    <Icon name="more-vertical" size={16} color="#6B7280" />
                  </TouchableOpacity> */}
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={[styles.chatBody, { paddingBottom: 16 }]}
      />

      {/* ── Footer ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 95 : 0}
      >
        <View style={styles.chatFooter}>{renderFooter()}</View>
      </KeyboardAvoidingView>

      {/* ── 15) Popup Modal ── */}
      {focusedMessage && (
        <Modal transparent animationType="none">
          <BlurView intensity={80} tint="dark" style={styles.blurContainer} />
          <View style={styles.modalContainer}>
            <Animated.View
              style={[
                styles.popupBubble,
                {
                  transform: [
                    {
                      scale: scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.popupText}>{focusedMessage.text}</Text>
            </Animated.View>

            <View style={styles.popupActions}>
              <TouchableOpacity
                onPress={() => showActionMenu(focusedMessage)}
                style={styles.popupActionBtn}
              >
                <Text style={styles.popupActionText}>⋯</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closePopup}
                style={[styles.popupActionBtn, styles.popupCancelBtn]}
              >
                <Text style={styles.popupCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Pressable style={styles.overlayTouchable} onPress={closePopup} />
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#18181B",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#18181B",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#27272A",
    borderBottomWidth: 1,
    borderBottomColor: "#3F3F46",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  avatarGroup: {
    flexDirection: "row",
    width: 64,
    height: 46,
    position: "relative",
    marginRight: 12,
  },
  avatarWrapper: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#27272A",
    backgroundColor: "#3F3F46",
    overflow: "hidden",
  },
  stackedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3F3F46",
  },
  stackedExtra: {
    left: 54,
    zIndex: 0,
    backgroundColor: "#3F3F46",
    alignItems: "center",
    justifyContent: "center",
  },
  extraCountText: {
    color: "#E4E4E7",
    fontSize: 12,
    fontWeight: "600",
  },
  chatHeaderInfo: {
    flexDirection: "column",
    flexShrink: 1,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F4F4F5",
  },
  chatHeaderUsername: {
    fontSize: 14,
    color: "#A1A1AA",
    marginTop: 2,
  },
  chatBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  dateSeparatorWrapper: {
    alignSelf: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginVertical: 8,
  },
  dateSeparatorText: {
    fontSize: 11,
    color: "#D4D4D8",
  },
  chatBubbleRow: {
    maxWidth: "75%",
  },
  chatBubbleRowOwn: {
    alignSelf: "flex-end",
  },
  chatBubbleRowOther: {
    alignSelf: "flex-start",
  },
  bubbleWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
    backgroundColor: "#3F3F46",
  },
  chatBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chatBubbleOwn: {
    backgroundColor: "#6366F1",
    borderColor: "#4F46E5",
  },
  chatBubbleOther: {
    backgroundColor: "#27272A",
    borderColor: "#3F3F46",
  },
  chatBubbleFirstOwn: {
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
  },
  chatBubbleLastOwn: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 4,
  },
  chatBubbleFirstOther: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  chatBubbleLastOther: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 4,
  },
  emojiOnlyBubble: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    padding: 6,
  },
  optimisticBubble: {
    opacity: 0.5,
  },
  bubbleTextOwn: {
    fontSize: 15,
    color: "#F9FAFB",
    lineHeight: 20,
  },
  bubbleTextOther: {
    fontSize: 15,
    color: "#D4D4D8",
    lineHeight: 20,
  },
  emojiText: {
    fontSize: 30,
    lineHeight: 36,
  },
  ellipsisBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  chatFooter: {
    borderTopWidth: 1,
    borderTopColor: "#3F3F46",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#27272A",
  },
  requestWarningContainer: {
    backgroundColor: "#3F3F46",
    borderColor: "#52525B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  requestWarningHeading: {
    fontSize: 15,
    fontWeight: "600",
    color: "#19dee8",
    marginBottom: 6,
  },
  requestWarningText: {
    fontSize: 13,
    color: "#E4E4E7",
    lineHeight: 20,
  },
  inviteInfoPanel: {
    backgroundColor: "#3F3F46",
    borderColor: "#52525B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  inviteHeading: {
    fontSize: 15,
    fontWeight: "600",
    color: "#19dee8",
    marginBottom: 6,
  },
  inviteDescription: {
    fontSize: 13,
    color: "#E4E4E7",
    lineHeight: 20,
  },
  writeMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202023",
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chatTextarea: {
    flex: 1,
    fontSize: 18,
    color: "#E4E4E7",
    paddingHorizontal: 10,
    paddingVertical: 10,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: 20,
    backgroundColor: "#27272A",
    marginRight: 10,
  },
  sendMessageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  requestBtnPrimary: {
    flex: 1,
    backgroundColor: "#6366F1",
    borderColor: "#4F46E5",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  requestBtnTextPrimary: {
    color: "#F9FAFB",
    fontWeight: "600",
    fontSize: 14,
  },
  requestBtnSubtle: {
    flex: 1,
    backgroundColor: "#27272A",
    borderColor: "#3F3F46",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  requestBtnTextSubtle: {
    color: "#A1A1AA",
    fontWeight: "600",
    fontSize: 14,
  },
  requestBtnDanger: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderColor: "#B91C1C",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  requestBtnTextDanger: {
    color: "#F9FAFB",
    fontWeight: "600",
    fontSize: 14,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  popupBubble: {
    backgroundColor: "#27272A",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 16,
  },
  popupText: {
    fontSize: 18,
    color: "#F4F4F5",
    lineHeight: 24,
    textAlign: "center",
  },
  popupActions: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  popupActionBtn: {
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  popupActionText: {
    fontSize: 28,
    color: "#E4E4E7",
  },
  popupCancelBtn: {
    backgroundColor: "#3F3F46",
    borderRadius: 12,
  },
  popupCancelText: {
    color: "#D4D4D8",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
});
