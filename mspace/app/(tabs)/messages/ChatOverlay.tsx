// app/messages/ChatOverlay.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActionSheetIOS,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import useApi from "../../../hooks/useApi";
import useWebSocket from "../../../hooks/useWebSocket";
import ProfilePicture from "../../../utils/getProfilePicture";
import {
  shouldGroupMessages,
  isFirstGroupedMessage,
  isLastGroupedMessage,
} from "./utils/messageGrouping";
import useAuth from "@/hooks/useAuth";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

function isEmojiOnlyMessage(text: string) {
  // Strip spaces and zero‐width‐spaces:
  const cleaned = text.replace(/[\s\u200B]/g, "");
  if (!cleaned) return false;

  // This pattern matches one “Extended_Pictographic” cluster (an emoji),
  // optionally followed by a U+FE0F/FE0E variation selector,
  // then zero or more sequences of [ZWJ + another Extended_Pictographic(+opt. var.sel.)].
  //
  // By wrapping it in ^(?: … )+$ we ensure the entire string is made up of one
  // or more back‐to‐back emoji clusters (no other characters allowed).
  const emojiOnlyRegex = new RegExp(
    "^" +
      "(?:" +
      "\\p{Extended_Pictographic}(?:\\uFE0F|\\uFE0E)?" +
      "(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\uFE0E)?)*" +
      ")+" +
      "$",
    "u"
  );

  return emojiOnlyRegex.test(cleaned);
}

interface ChatOverlayProps {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
}

export default function ChatOverlay({
  visible,
  conversationId,
  onClose,
}: ChatOverlayProps) {
  const insets = useSafeAreaInsets();
  const { authState } = useAuth();
  const currentUsername = authState?.current?.user?.username || "UNKNOWN";
  const { callApi } = useApi();

  // Gap from top (safe area + extra 20px)
  const OPEN_TOP = insets.top + 20;
  // Distance to translate sheet off-screen
  const SHEET_OFFSET = SCREEN_HEIGHT - OPEN_TOP;

  // ── ANIMATION / PANRESPONDER ──
  const translateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const [closing, setClosing] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > SHEET_OFFSET * 0.25) {
          triggerClose();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const triggerClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    Animated.timing(translateY, {
      toValue: SHEET_OFFSET,
      duration: 250,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setClosing(false);
    });
  }, [closing, onClose, translateY, SHEET_OFFSET]);

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(SHEET_OFFSET);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateY, visible, SHEET_OFFSET]);

  // ── STATE FOR MESSAGES & CONVERSATION ──
  const [conversation, setConversation] = useState<ConversationType | null>(
    null
  );
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const flatListRef = useRef<FlatList<MessageType>>(null);

  // ── STATE FOR INPUT & SCROLLING ──
  const [input, setInput] = useState("");
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // ── STATE FOR LONG-PRESS POPUP ──
  const [focusedMessage, setFocusedMessage] = useState<MessageType | null>(
    null
  );
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // ── FETCH CONVERSATION DETAILS ──
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

  // ── FETCH MESSAGES (PAGINATED) ──
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
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.uuid));
            const filtered = results.filter((m) => !existingIds.has(m.uuid));
            return [...prev, ...filtered];
          });
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

  useEffect(() => {
    fetchMessages(0);
  }, []);

  // ── WEBSOCKET FOR REAL‐TIME INCOMING ──
  const { sendMessage } = useWebSocket(`messages/inbox/${conversationId}/`, {
    onMessage: (data: MessageType) => {
      setMessages((prev) => {
        if (prev.some((m) => m.uuid === data.uuid)) return prev;
        return [data, ...prev];
      });
    },
  });

  // ── 4) Auto‐scroll to bottom logic ──
  useEffect(() => {
    if (!loadingOlder && flatListRef.current) {
      if (!justSent && !userScrolledUp && loading === false) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }
  }, [messages, userScrolledUp, justSent, loadingOlder, loading]);

  // ── SEND A MESSAGE ──
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    setJustSent(true);
    sendMessage({ text: trimmed, sender_username: currentUsername });
  };

  // ── HANDLERS FOR REQUEST‐TYPE ──
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
      triggerClose();
    } catch (err) {
      console.error("Error rejecting request:", err);
    }
  };
  const handleBlockRequest = async () => {
    try {
      await callApi(`messages/request/${conversationId}/block/`, "POST");
      triggerClose();
    } catch (err) {
      console.error("Error blocking request:", err);
    }
  };

  const isOwnMessage = (m: MessageType) =>
    m.sender_username === currentUsername;

  // ── RENDER FOOTER (INPUT / REQUEST UI) ──
  const renderFooter = () => {
    if (!conversation) return null;
    const { view_type, conversation_status } = conversation;
    const isBlocked = conversation_status === "blocked";
    const isInvite = conversation_status === "invite";
    const isInviteAccepted = conversation_status === "allowed";

    if (isBlocked) {
      return (
        <View style={styles.requestWarningContainer}>
          <Text style={styles.requestWarningText}>
            You cannot send messages in this conversation.
          </Text>
        </View>
      );
    }

    if (isInvite && messages.length > 0) {
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
                <Text style={{ fontWeight: "700" }}>one message</Text> as a
                request. The recipient must accept it to continue.
              </Text>
            </View>
          )}
          <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
            <View style={styles.writeMessageContainer}>
              <Icon
                name="smile"
                size={22}
                color="#66E0FF"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.chatTextarea}
                placeholder="Type a message…"
                placeholderTextColor="#7A7A7A"
                value={input}
                onChangeText={setInput}
                multiline
                onSubmitEditing={() => {
                  if (input.trim()) handleSend();
                }}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={styles.sendMessageBtn}
              >
                <Icon name="send" size={20} color="#1B1B1F" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </>
      );
    }

    if (view_type === "request") {
      return (
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.requestBtn, styles.requestBtnPrimary]}
            onPress={handleAcceptRequest}
          >
            <Text style={styles.requestBtnTextPrimary}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestBtn, styles.requestBtnSubtle]}
            onPress={handleRejectRequest}
          >
            <Text style={styles.requestBtnTextSubtle}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.requestBtn, styles.requestBtnDanger]}
            onPress={handleBlockRequest}
          >
            <Text style={styles.requestBtnTextDanger}>Block</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  // ── LONG-PRESS POPUP ──
  const openPopup = (message: MessageType) => {
    setFocusedMessage(message);
    scaleAnim.setValue(0);
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 180,
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

  // ── SCROLL / FETCH OLDER ──
  const onEndReached = () => {
    if (hasMore && !loadingOlder) {
      fetchMessages(page);
    }
  };
  const onScroll = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const contentHeight = e.nativeEvent.contentSize.height;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const distanceFromBottom = contentHeight - offsetY - layoutHeight;
    setUserScrolledUp(distanceFromBottom > 50);
  };

  // ── IF STILL LOADING FIRST CONVERSATION ──
  if (loading && !conversation) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlayContainer}>
        {/* ── BACKDROP ── */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={triggerClose}
        />

        {/* ── SLIDING SHEET ── */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              top: OPEN_TOP,
              bottom: 0,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* ── DRAG HANDLE ── */}
          <View
            {...panResponder.panHandlers}
            style={styles.dragHandleContainer}
          >
            <View style={styles.dragHandle} />
          </View>

          {/* ── HEADER ── */}
          <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
            <View style={styles.chatHeader}>
              <TouchableOpacity
                onPress={triggerClose}
                style={styles.backButton}
              >
                <Icon name="arrow-left" size={24} color="#66E0FF" />
              </TouchableOpacity>

              {conversation?.participants && (
                <View style={styles.headerGroup}>
                  <View style={styles.avatarGroup}>
                    {conversation.participants
                      .filter((p) => p.user.username !== currentUsername)
                      .slice(0, 3)
                      .map((p, idx) => (
                        <View
                          key={p.user.id}
                          style={[
                            styles.avatarWrapper,
                            { left: idx * 16, zIndex: 3 - idx },
                          ]}
                        >
                          <ProfilePicture
                            src={p.user.profile_image}
                            style={styles.stackedAvatar}
                          />
                        </View>
                      ))}
                    {conversation.participants.filter(
                      (p) => p.user.username !== currentUsername
                    ).length > 3 && (
                      <View style={[styles.avatarWrapper, styles.stackedExtra]}>
                        <Text style={styles.extraCountText}>
                          +
                          {conversation.participants.filter(
                            (p) => p.user.username !== currentUsername
                          ).length - 3}
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
                </View>
              )}
            </View>
          </BlurView>

          {/* ── MESSAGE LIST ── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.uuid}
            inverted
            onScroll={onScroll}
            scrollEventThrottle={16}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.1}
            bounces={true}
            overScrollMode="always"
            contentContainerStyle={[
              {
                flexGrow: 1,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 0,
              },
            ]}
            ListFooterComponent={() =>
              loadingOlder ? (
                <ActivityIndicator
                  size="small"
                  color="#66E0FF"
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
                  {/** Date separator **/}
                  {(() => {
                    if (!prev) {
                      return (
                        <View style={styles.dateSeparatorWrapper}>
                          <Text style={styles.dateSeparatorText}>
                            {new Date(item.sent_at).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      );
                    }
                    const curr = new Date(item.sent_at).getTime();
                    const pr = new Date(prev.sent_at).getTime();
                    if (curr - pr > 15 * 60 * 1000) {
                      return (
                        <View style={styles.dateSeparatorWrapper}>
                          <Text style={styles.dateSeparatorText}>
                            {new Date(item.sent_at).toLocaleString([], {
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
                  })()}

                  {/** Chat bubble **/}
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

                      {own ? (
                        // ── OWN MESSAGE ──
                        emojiOnly ? (
                          <View style={styles.emojiOnlyContainerOwn}>
                            <Pressable onLongPress={() => openPopup(item)}>
                              <Text style={styles.emojiText}>{item.text}</Text>
                            </Pressable>
                          </View>
                        ) : (
                          <LinearGradient
                            colors={["rgb(30, 170, 200)", "rgb(0, 140, 160)"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                              styles.chatBubble,
                              styles.chatBubbleOwn,
                              grouped && first && styles.chatBubbleFirstOwn,
                              grouped && last && styles.chatBubbleLastOwn,
                            ]}
                          >
                            <Pressable
                              onLongPress={() => openPopup(item)}
                              style={{ flex: 1 }}
                            >
                              <Text style={styles.bubbleTextOwn}>
                                {item.text}
                              </Text>
                            </Pressable>
                          </LinearGradient>
                        )
                      ) : // ── OTHER'S MESSAGE ──
                      emojiOnly ? (
                        <View style={styles.emojiOnlyContainerOther}>
                          <Pressable onLongPress={() => openPopup(item)}>
                            <Text style={styles.emojiText}>{item.text}</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.chatBubble,
                            styles.chatBubbleOther,
                            grouped && first && styles.chatBubbleFirstOther,
                            grouped && last && styles.chatBubbleLastOther,
                            { overflow: "hidden" },
                          ]}
                        >
                          <BlurView
                            intensity={20}
                            tint="dark"
                            style={StyleSheet.absoluteFillObject}
                          />
                          <Pressable
                            onLongPress={() => openPopup(item)}
                            style={{ flex: 1 }}
                          >
                            <Text style={styles.bubbleTextOther}>
                              {item.text}
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />

          {/* ── FOOTER / INPUT ── */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top - 15 : 0}
          >
            <View
              style={[styles.chatFooter, { paddingBottom: insets.bottom + 8 }]}
            >
              {renderFooter()}
            </View>
          </KeyboardAvoidingView>

          {/* ── LONG-PRESS POPUP modal ── */}
          {focusedMessage && (
            <Modal transparent animationType="none">
              <BlurView
                intensity={60}
                tint="dark"
                style={styles.blurContainer}
              />
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

                <Pressable
                  style={styles.overlayTouchable}
                  onPress={closePopup}
                />
              </View>
            </Modal>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Container ──
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1B1B1F",
  },

  // ── Backdrop ──
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  // ── Sliding sheet ──
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#1B1B1F",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },

  // ── Drag Handle ──
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#666",
  },

  // ── Header ──
  headerBlur: {
    width: "100%",
    overflow: "hidden",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(27,27,31,0.4)",
  },
  backButton: {
    marginRight: 12,
    padding: 6,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 8,
  },
  headerGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  avatarGroup: {
    flexDirection: "row",
    minWidth: 40,
    height: 44,
    position: "relative",
    marginRight: 12,
  },
  avatarWrapper: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.6)",
    backgroundColor: "#27272A",
    overflow: "hidden",
    shadowColor: "#66E0FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  stackedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#27272A",
  },
  stackedExtra: {
    left: 48,
    zIndex: 0,
    backgroundColor: "#27272A",
    alignItems: "center",
    justifyContent: "center",
  },
  extraCountText: {
    color: "#66E0FF",
    fontSize: 12,
    fontWeight: "600",
  },
  chatHeaderInfo: {
    flexDirection: "column",
    flexShrink: 1,
    marginLeft: 12,
  },
  chatHeaderName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F4F4F5",
    letterSpacing: 0.3,
    maxWidth: "100%",
  },
  chatHeaderUsername: {
    fontSize: 14,
    color: "#8A8A8A",
    marginTop: 4,
  },

  // ── Chat Body ──
  dateSeparatorWrapper: {
    alignSelf: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(43,43,47,0.5)",
    marginVertical: 8,
  },
  dateSeparatorText: {
    fontSize: 11,
    color: "#BFBFBF",
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
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    backgroundColor: "#27272A",
    borderWidth: 1,
    borderColor: "#1B1B1F",
    shadowColor: "#66E0FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  chatBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  chatBubbleOwn: {
    borderWidth: 1,
    borderColor: "rgb(0, 150, 170)",
    backgroundColor: "transparent",
  },
  chatBubbleOther: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "transparent",
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

  // ── Containers for emoji-only messages ──
  //    Increased padding + center alignment prevents clipping
  emojiOnlyContainerOwn: {
    backgroundColor: "transparent",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiOnlyContainerOther: {
    backgroundColor: "transparent",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  bubbleTextOwn: {
    fontSize: 15,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  bubbleTextOther: {
    fontSize: 15,
    color: "#D4D4D8",
    lineHeight: 20,
  },
  // ── Bump default emoji size ──
  emojiText: {
    fontSize: 40,
    lineHeight: 44,
  },

  // ── Footer/Input ──
  chatFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    backgroundColor: "#1B1B1F",
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  inputBlur: {
    marginHorizontal: 12,
    borderRadius: 30,
    overflow: "hidden",
  },
  writeMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(27,27,31,0.7)",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  chatTextarea: {
    flex: 1,
    fontSize: 18,
    color: "#FFFFFF",
    paddingHorizontal: 5,
    paddingVertical: 10,
    maxHeight: 120,
    minHeight: 44,
    borderRadius: 20,
    backgroundColor: "rgba(27,27,31,0.5)",
    marginRight: 0,
  },
  sendMessageBtn: {
    width: 38,
    height: 38,
    borderRadius: 22,
    backgroundColor: "#66E0FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#66E0FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  requestWarningContainer: {
    backgroundColor: "rgba(43,43,47,0.8)",
    borderColor: "#52525B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
  },
  requestWarningHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#66E0FF",
    marginBottom: 6,
  },
  requestWarningText: {
    fontSize: 13,
    color: "#D4D4D8",
    lineHeight: 20,
  },
  inviteInfoPanel: {
    backgroundColor: "rgba(43,43,47,0.8)",
    borderColor: "#52525B",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  inviteHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#66E0FF",
    marginBottom: 6,
  },
  inviteDescription: {
    fontSize: 13,
    color: "#D4D4D8",
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 12,
  },
  requestBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  requestBtnPrimary: {
    backgroundColor: "#66E0FF",
  },
  requestBtnTextPrimary: {
    color: "#1B1B1F",
    fontWeight: "700",
    fontSize: 14,
  },
  requestBtnSubtle: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  requestBtnTextSubtle: {
    color: "#A1A1AA",
    fontWeight: "600",
    fontSize: 14,
  },
  requestBtnDanger: {
    backgroundColor: "#E03F5F",
  },
  requestBtnTextDanger: {
    color: "#FFFFFF",
    fontWeight: "700",
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
    backgroundColor: "rgba(43,43,47,0.9)",
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
    color: "#D4D4D8",
  },
  popupCancelBtn: {
    backgroundColor: "#27272A",
    borderRadius: 12,
  },
  popupCancelText: {
    color: "#A1A1AA",
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
});
