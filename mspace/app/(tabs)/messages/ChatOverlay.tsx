// app/messages/ChatOverlay.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Modal,
  Image,
  Linking,
  Alert,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";

import * as Clipboard from "expo-clipboard";
import * as MediaLibrary from "expo-media-library";
import { Video } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Keyboard } from "react-native";

import useApi from "../../../hooks/useApi";
import useWebSocket from "../../../hooks/useWebSocket";
import ProfilePicture from "../../../utils/getProfilePicture";
import useAuth from "@/hooks/useAuth";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type AttachmentType = {
  id: string;
  mime_type: string;
  url: string;
  uploaded_at: string;
};

type ReactionType = {
  id: string;
  user_username: string;
  reaction_type: string;
  reacted_at: string;
};

type MessageType = {
  uuid: string;
  text: string;
  sender_username: string;
  sent_at: string;
  attachments: AttachmentType[];
  reactions: ReactionType[];
  parent_message_uuid: string | null;
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

interface ChatOverlayProps {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
}

function isEmojiOnlyMessage(text: string) {
  const cleaned = text.replace(/[\s\u200B]/g, "");
  if (!cleaned) return false;
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

export default function ChatOverlay({
  visible,
  conversationId,
  onClose,
}: ChatOverlayProps) {
  const insets = useSafeAreaInsets();
  const { authState } = useAuth();
  const currentUsername = authState?.current?.user?.username || "UNKNOWN";
  const { callApi } = useApi();

  // ─────── Animation Values ───────
  const popupAnim = useRef(new Animated.Value(0)).current;
  const blurOpacity = popupAnim.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 1],
  });
  const popupScale = popupAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  // ─────── State ───────
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const attachAnim = useRef(new Animated.Value(0)).current;

  const [focusedMessage, setFocusedMessage] = useState<MessageType | null>(
    null
  );
  const [pressedLayout, setPressedLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [reactionSummaryMessage, setReactionSummaryMessage] = useState<
    MessageType | null
  >(null);

  const [conversation, setConversation] = useState<ConversationType | null>(
    null
  );
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [input, setInput] = useState("");
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [attachmentsToSend, setAttachmentsToSend] = useState<
    { uri: string; type: string; name: string }[]
  >([]);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [showChainModal, setShowChainModal] = useState<{
    rootUuid: string;
    chain: MessageType[];
  } | null>(null);

  const flatListRef = useRef<FlatList<MessageType>>(null);
  const inputRef = useRef<TextInput>(null);

  // map of refs for each bubble, keyed by message UUID.
  const bubbleRefs = useRef<Record<string, View | null>>({});

  const OPEN_TOP = insets.top + 20;
  const SHEET_OFFSET = SCREEN_HEIGHT - OPEN_TOP;

  // ─────── Slide-Up Sheet Animation ───────
  const translateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  useEffect(() => {
    if (!visible) return;
    translateY.setValue(SHEET_OFFSET);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const triggerClose = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SHEET_OFFSET,
      duration: 250,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [onClose]);

  // ─────── Fetch Conversation Details ───────
  useEffect(() => {
    if (!visible) return;
    (async () => {
      try {
        const resp = await callApi(
          `messages/get_conversation_details/${conversationId}/`
        );
        setConversation(resp.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [visible]);

  // ─────── Fetch Messages (paginated) ───────
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
        console.error(err);
      } finally {
        if (pageToLoad === 0) setLoading(false);
        else setLoadingOlder(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    if (visible) fetchMessages(0);
  }, [visible]);

  // ─────── WebSocket for Live Updates ───────
  const { sendMessage } = useWebSocket(`messages/inbox/${conversationId}/`, {
    onMessage: (data: any) => {
      console.log("WS incoming →", data);
      if (data.type === "chat_message") {
        const newMsg: MessageType = data.message;
        setMessages((prev) => {
          if (prev.some((m) => m.uuid === newMsg.uuid)) return prev;
          return [newMsg, ...prev];
        });
      } else if (data.type === "reaction_update") {
        const { message_uuid, reactions } = data;
        console.log("Applying reactions for", message_uuid, reactions);
        setMessages((prev) =>
          prev.map((m) =>
            m.uuid === message_uuid ? { ...m, reactions } : m
          )
        );
      } else if (data.type === "unsend") {
        const { message_uuid } = data;
        setMessages((prev) => prev.filter((m) => m.uuid !== message_uuid));
      }
    },
  });

  // ─────── Auto-scroll on new messages ───────
  useEffect(() => {
    if (!loadingOlder && flatListRef.current) {
      if (!justSent && !userScrolledUp && loading === false) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }
  }, [messages, userScrolledUp, justSent, loadingOlder, loading]);

  const isOwnMessage = (m: MessageType) =>
    m.sender_username === currentUsername;

  const getReplyChain = useCallback(
    (rootUuid: string): MessageType[] => {
      const chain: MessageType[] = [];
      let current = messages.find((m) => m.uuid === rootUuid) || null;
      while (current) {
        chain.push(current);
        if (current.parent_message_uuid) {
          current = messages.find(
            (m) => m.uuid === current!.parent_message_uuid
          );
        } else {
          break;
        }
      }
      return chain.reverse();
    },
    [messages]
  );

  const openChainModal = (msg: MessageType) => {
    const chain = getReplyChain(msg.uuid);
    if (chain.length > 1) {
      setShowChainModal({ rootUuid: msg.uuid, chain });
    }
  };

  // ─────── Send Message ───────
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && attachmentsToSend.length === 0) return;

    const optimisticMessage: MessageType = {
      uuid: `temp-${Date.now()}`,
      text: trimmed,
      sender_username: currentUsername,
      sent_at: new Date().toISOString(),
      attachments: attachmentsToSend.map((file) => ({
        id: `temp-${file.name}`,
        mime_type: file.type,
        url: file.uri,
        uploaded_at: new Date().toISOString(),
      })),
      reactions: [],
      parent_message_uuid: replyingTo?.uuid || null,
    };

    setInput("");
    setReplyingTo(null);
    setJustSent(true);

    if (attachmentsToSend.length === 0) {
      sendMessage({
        text: trimmed,
        sender_username: currentUsername,
        conversation: conversationId,
        ...(replyingTo && { parent_message_uuid: replyingTo.uuid }),
      });
      return;
    }

    try {
      const body: any = {
        conversation: conversationId,
        text: trimmed,
      };
      if (replyingTo) body.parent_message_uuid = replyingTo.uuid;

      const resp = await callApi("messages/create_message/", "POST", body);
      let newMessage: MessageType = resp.data;

      if (attachmentsToSend.length > 0) {
        const formData = new FormData();
        attachmentsToSend.forEach((fileObj) => {
          formData.append("files", {
            uri: fileObj.uri,
            type: fileObj.type,
            name: fileObj.name,
          } as any);
        });
        const attachmentResp = await callApi(
          `messages/upload_attachment/${newMessage.uuid}/`,
          "POST",
          formData,
          "multipart/form-data"
        );
        newMessage.attachments = attachmentResp.data;
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.uuid === optimisticMessage.uuid ? newMessage : msg
        )
      );
      setAttachmentsToSend([]);
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.filter((msg) => msg.uuid !== optimisticMessage.uuid)
      );
      Alert.alert(
        "Message Failed",
        "Unable to send your message. Please try again."
      );
    }
  };

  // ─────── Pick Media ───────
  const handleMediaPick = async () => {
    setAttachmentsToSend([]);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("We need permission to access your media library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const attachments = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `media-${Date.now()}`,
      }));
      setAttachmentsToSend((prev) => [...prev, ...attachments]);
    }
  };

  // ─────── Toggle Reaction ───────
  const handleToggleReaction = async (
    msg: MessageType,
    reactionType: string
  ) => {
    const existingByUser = msg.reactions.find(
      (r) => r.user_username === currentUsername
    );
    const isSameType = existingByUser?.reaction_type === reactionType;

    setMessages((prev) =>
      prev.map((m) => {
        if (m.uuid !== msg.uuid) return m;

        let newReactions: ReactionType[] = [...m.reactions];

        if (isSameType && existingByUser) {
          newReactions = newReactions.filter(
            (r) =>
              !(
                r.user_username === currentUsername &&
                r.reaction_type === reactionType
              )
          );
        } else {
          if (existingByUser) {
            newReactions = newReactions.filter(
              (r) => r.user_username !== currentUsername
            );
          }
          newReactions.push({
            id: `temp-${Date.now()}`,
            user_username: currentUsername,
            reaction_type: reactionType,
            reacted_at: new Date().toISOString(),
          });
        }

        return { ...m, reactions: newReactions };
      })
    );

    if (isSameType && existingByUser) {
      sendMessage({
        action: "remove_reaction",
        message_uuid: msg.uuid,
        reaction_type: reactionType,
      });
    } else {
      sendMessage({
        action: "add_reaction",
        message_uuid: msg.uuid,
        reaction_type: reactionType,
      });
    }
  };

  // ─────── Unsend Message ───────
  const handleUnsend = async (msg: MessageType) => {
    try {
      await callApi(`messages/unsend_message/${msg.uuid}/`, "POST");
      setMessages((prev) => prev.filter((m) => m.uuid !== msg.uuid));
      sendMessage({
        type: "unsend",
        message_uuid: msg.uuid,
      });
    } catch (err) {
      console.error(err);
      Alert.alert("Unable to unsend", "Try again in a moment.");
    }
  };

  // ─────── Save Media ───────
  const handleSaveMedia = async (att: AttachmentType) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Can't save media without permission."
        );
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(att.url);
      if (asset) {
        Alert.alert("Saved!", "Media saved to your camera roll.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Save failed", "Could not save media.");
    }
  };

  // ─────── Detect Scroll Up ───────
  const onScroll = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const contentHeight = e.nativeEvent.contentSize.height;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const distanceFromBottom = contentHeight - offsetY - layoutHeight;
    setUserScrolledUp(distanceFromBottom > 50);
  };
  const onEndReached = () => {
    if (hasMore && !loadingOlder) {
      fetchMessages(page);
    }
  };

  // ─────── Handle Long-Press on a Bubble ───────
  const handleLongPress = (message: MessageType) => {
    const ref = bubbleRefs.current[message.uuid];
    if (!ref) {
      // fallback to centered if ref missing
      setPressedLayout(null);
      setFocusedMessage(message);
      popupAnim.setValue(0);
      Animated.timing(popupAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    // Measure the bubble’s position & size on screen
    ref.measureInWindow((x, y, width, height) => {
      setPressedLayout({ x, y, width, height });
      setFocusedMessage(message);
      popupAnim.setValue(0);
      Animated.timing(popupAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  };

  // ─────── Close the Long-Press Overlay ───────
  const closePopup = () => {
    Animated.timing(popupAnim, {
      toValue: 0,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setFocusedMessage(null);
      setPressedLayout(null);
    });
  };

  // ─────── Open / Close Reaction Summary ───────
  const openReactionSummary = (msg: MessageType) => {
    setReactionSummaryMessage(msg);
  };
  const closeReactionSummary = () => {
    setReactionSummaryMessage(null);
  };

  // ─────── Render Media Attachment ───────
  const renderMediaAttachment = (att: AttachmentType) => {
    if (att.mime_type.startsWith("image/")) {
      return (
        <Pressable
          key={att.id}
          onLongPress={() =>
            Alert.alert(
              "Save Image",
              "Would you like to save this image to your device?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Save",
                  onPress: () => handleSaveMedia(att),
                },
              ]
            )
          }
        >
          <Image source={{ uri: att.url }} style={styles.largeMediaFull} />
        </Pressable>
      );
    } else if (att.mime_type.startsWith("video/")) {
      return (
        <Pressable
          key={att.id}
          onLongPress={() =>
            Alert.alert(
              "Save Video",
              "Would you like to save this video to your device?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Save",
                  onPress: () => handleSaveMedia(att),
                },
              ]
            )
          }
        >
          <Video
            source={{ uri: att.url }}
            style={styles.largeMediaFull}
            useNativeControls
            resizeMode="contain"
          />
        </Pressable>
      );
    } else {
      return (
        <Pressable
          key={att.id}
          style={styles.docCard}
          onPress={() => Linking.openURL(att.url)}
          onLongPress={() =>
            Alert.alert(
              "Download File",
              "Would you like to download this file?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Download",
                  onPress: () => Linking.openURL(att.url),
                },
              ]
            )
          }
        >
          <MaterialIcons name="insert-drive-file" size={48} color="#888" />
          <Text style={styles.docFileName} numberOfLines={1}>
            {att.url.split("/").pop()}
          </Text>
        </Pressable>
      );
    }
  };

  // ─────── Render Single Message Bubble ───────
  const renderMessageItem = ({
    item,
    index,
  }: {
    item: MessageType;
    index: number;
  }) => {
    const plainText = item.text.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const emojiOnly = isEmojiOnlyMessage(plainText);
    const own = isOwnMessage(item);
    const msgDate = new Date(item.sent_at);
    const prev = messages[index + 1];
    const parentMsg = item.parent_message_uuid
      ? messages.find((m) => m.uuid === item.parent_message_uuid)
      : null;
    const parentPreviewText = parentMsg
      ? parentMsg.text
        ? parentMsg.text.length > 50
          ? parentMsg.text.substring(0, 50) + "…"
          : parentMsg.text
        : "Attachment"
      : "";

    const isKnot =
      item.parent_message_uuid &&
      parentMsg &&
      parentMsg.sender_username !== currentUsername &&
      messages.some(
        (m) =>
          m.parent_message_uuid === parentMsg.uuid &&
          m.sender_username !== currentUsername
      );

    // ─────── Prepare distinct reactions ───────
    const uniqueByUser: { [username: string]: ReactionType } = {};
    item.reactions.forEach((r) => {
      if (!uniqueByUser[r.user_username]) {
        uniqueByUser[r.user_username] = r;
      }
    });
    const distinctReactions = Object.values(uniqueByUser);

    // At most 3 badges; overflow hides behind “+N”
    const maxToShow = 3;
    const overflowCount =
      distinctReactions.length > maxToShow
        ? distinctReactions.length - (maxToShow - 1)
        : 0;

    return (
      <View style={{ marginVertical: 6 }}>
        {(!prev ||
          new Date(prev.sent_at).getTime() + 15 * 60 * 1000 <
            msgDate.getTime()) && (
          <View style={styles.dateSeparatorWrapper}>
            <Text style={styles.dateSeparatorText}>
              {msgDate.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}

        {parentMsg && (
          <View
            style={[
              styles.parentPreviewContainer,
              own ? styles.parentPreviewOwn : styles.parentPreviewOther,
            ]}
          >
            <Pressable
              style={styles.parentPreviewInner}
              onPress={() => openChainModal(item)}
            >
              <View
                style={[
                  styles.branchLine,
                  isKnot && styles.branchKnot,
                  index -
                    messages.findIndex((m) => m.uuid === parentMsg.uuid) <
                  5
                    ? { height: 20 }
                    : { height: 40 },
                ]}
              />
              <Text style={styles.parentPreviewText} numberOfLines={1}>
                {parentMsg.sender_username}: {parentPreviewText}
              </Text>
            </Pressable>
          </View>
        )}

        {/* ─────── Bubble wrapper (position: "relative") ─────── */}
        <View
          style={[
            { position: "relative", maxWidth: "75%" },
            own ? styles.messageRowOwn : styles.messageRowOther,
            distinctReactions.length > 0 && styles.reactedMarginTop,
          ]}
        >
          <Pressable
            ref={(ref) => {
              bubbleRefs.current[item.uuid] = ref;
            }}
            delayLongPress={200}
            onLongPress={() => handleLongPress(item)}
            style={[
              styles.bubbleContainer,
              own ? styles.bubbleContainerOwn : styles.bubbleContainerOther,
              emojiOnly && styles.emojiOnlyContainer,
            ]}
          >
            {emojiOnly ? (
              <Text style={styles.emojiText}>{item.text}</Text>
            ) : (
              <Text
                style={[
                  styles.messageText,
                  own ? styles.messageTextOwn : styles.messageTextOther,
                ]}
              >
                {item.text}
              </Text>
            )}
          </Pressable>

          {/* ─────── Reaction Badges ─────── */}
          {distinctReactions.length > 0 &&
            distinctReactions.slice(0, maxToShow).map((r, idx) => {
              // Determine what to show on the last badge if overflow exists
              let emojiChar: string;
              if (idx === maxToShow - 1 && overflowCount > 0) {
                emojiChar = `+${overflowCount}`;
              } else {
                switch (r.reaction_type) {
                  case "like":
                    emojiChar = "👍";
                    break;
                  case "love":
                    emojiChar = "❤️";
                    break;
                  case "laugh":
                    emojiChar = "😂";
                    break;
                  case "sad":
                    emojiChar = "😢";
                    break;
                  case "angry":
                    emojiChar = "😡";
                    break;
                  default:
                    emojiChar = "❓";
                }
              }

              // Shift each subsequent badge inward by 12px
              const shiftX = idx * 12;
              const topOffset = -28; // same vertical offset as before

              // Highlight if it’s the current user’s reaction
              const isMine =
                (r.user_username === currentUsername &&
                  overflowCount === 0) ||
                (r.user_username === currentUsername && idx < maxToShow - 1);
              const badgeColor = isMine ? "#0A84FF" : "#333";

              return (
                <View
                  key={
                    idx === maxToShow - 1 && overflowCount > 0
                      ? `overflow-${idx}`
                      : r.user_username
                  }
                  style={[
                    styles.reactionBadge,
                    {
                      backgroundColor: badgeColor,
                      top: topOffset,
                      ...(own
                        ? { left: -18 + shiftX }
                        : { right: -18 - shiftX }),
                    },
                  ]}
                >
                  <Text style={styles.reactionBadgeText}>{emojiChar}</Text>
                </View>
              );
            })}
        </View>

        {item.attachments?.length > 0 && (
          <View
            style={[
              styles.mediaBubbleContainer,
              own ? styles.mediaBubbleOwn : styles.mediaBubbleOther,
            ]}
          >
            {item.attachments.map((att) => renderMediaAttachment(att))}
          </View>
        )}
      </View>
    );
  };

  // ─────── Render the Focused Bubble + Reaction/Action Overlay ───────
  function renderPopupOverlay() {
    if (!focusedMessage) return null;

    const plainText = focusedMessage.text.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const emojiOnly = isEmojiOnlyMessage(plainText);
    const isOwn = isOwnMessage(focusedMessage);

    const REACTION_ROW_HEIGHT = 40;
    const ACTION_ROW_HEIGHT = 50;
    const MARGIN = 8;

    if (pressedLayout) {
      const { x, y, width, height } = pressedLayout;

      // 1) Clamp X so the bubble copy doesn’t overflow screen edges
      const minX = 16;
      const maxX = SCREEN_WIDTH - width - 16;
      let clampedX = x;
      if (clampedX < minX) clampedX = minX;
      if (clampedX > maxX) clampedX = maxX;

      // 2) Style for the “bubble copy” preview
      const bubbleStyle = {
        position: "absolute" as const,
        top: y,
        left: clampedX,
        width: width,
        transform: [{ scale: popupScale }],
      };

      // 3) Compute vertical positions for reaction row (above) and action row (below)
      let reactionTop = y - MARGIN - REACTION_ROW_HEIGHT;
      if (reactionTop < insets.top + MARGIN) {
        reactionTop = insets.top + MARGIN;
      }

      let actionTop = y + height + MARGIN;
      if (
        actionTop + ACTION_ROW_HEIGHT >
        SCREEN_HEIGHT - insets.bottom - MARGIN
      ) {
        actionTop = SCREEN_HEIGHT - insets.bottom - MARGIN - ACTION_ROW_HEIGHT;
      }

      return (
        <Animated.View
          style={[styles.popupOverlayContainer, { opacity: blurOpacity }]}
        >
          {/* 1) Full-screen blur (tappable outside to close) */}
          <TouchableWithoutFeedback onPress={closePopup}>
            <AnimatedBlurView
              intensity={70}
              tint="dark"
              style={[
                StyleSheet.absoluteFill,
                {
                  transform: [
                    { translateX: SCREEN_WIDTH / 2 },
                    { translateY: SCREEN_HEIGHT / 2 },
                    { scale: popupScale },
                    { translateX: -SCREEN_WIDTH / 2 },
                    { translateY: -SCREEN_HEIGHT / 2 },
                  ],
                },
              ]}
            />
          </TouchableWithoutFeedback>

          {/* (A) Reaction Summary Overlay (if open) */}
          {reactionSummaryMessage === focusedMessage && (
            <View style={styles.summaryOverlay}>
              <BlurView intensity={50} tint="dark" style={styles.summaryBlur} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>Reactions</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  {(() => {
                    const grouping: Record<
                      string,
                      { count: number; users: string[] }
                    > = {};
                    focusedMessage.reactions.forEach((r) => {
                      if (!grouping[r.reaction_type]) {
                        grouping[r.reaction_type] = { count: 0, users: [] };
                      }
                      grouping[r.reaction_type].count += 1;
                      grouping[r.reaction_type].users.push(r.user_username);
                    });
                    return Object.entries(grouping).map(
                      ([reaction_type, { count, users }]) => {
                        let emoji = "❓";
                        switch (reaction_type) {
                          case "like":
                            emoji = "👍";
                            break;
                          case "love":
                            emoji = "❤️";
                            break;
                          case "laugh":
                            emoji = "😂";
                            break;
                          case "sad":
                            emoji = "😢";
                            break;
                          case "angry":
                            emoji = "😡";
                            break;
                        }
                        const youReacted =
                          users.indexOf(currentUsername) !== -1;
                        return (
                          <View key={reaction_type} style={styles.summaryRow}>
                            <Text style={styles.summaryEmoji}>{emoji}</Text>
                            <Text style={styles.summaryText}>
                              {count} – {users.join(", ")}
                            </Text>
                            {youReacted && (
                              <Pressable
                                onPress={async () => {
                                  await handleToggleReaction(
                                    focusedMessage,
                                    reaction_type
                                  );
                                  closeReactionSummary();
                                  closePopup();
                                }}
                                style={styles.unreactButton}
                              >
                                <Text style={styles.unreactText}>Unreact</Text>
                              </Pressable>
                            )}
                          </View>
                        );
                      }
                    );
                  })()}
                </ScrollView>
                <Pressable
                  onPress={closeReactionSummary}
                  style={styles.closeSummaryBtn}
                >
                  <Text style={styles.closeSummaryText}>Close</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* (1) “Bubble Copy” Preview */}
          <Animated.View style={bubbleStyle}>
            <View
              style={[
                styles.bubbleContainer,
                isOwn
                  ? styles.bubbleContainerOwn
                  : styles.bubbleContainerOther,
                emojiOnly && styles.emojiOnlyContainer,
              ]}
            >
              {emojiOnly ? (
                <Text style={styles.emojiText}>{focusedMessage.text}</Text>
              ) : (
                <Text
                  style={[
                    styles.messageText,
                    isOwn
                      ? styles.messageTextOwn
                      : styles.messageTextOther,
                  ]}
                  numberOfLines={3}
                >
                  {focusedMessage.text}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* (2) Reaction Row (above the bubble) */}
          <Animated.View
            style={{
              position: "absolute" as const,
              top: reactionTop,
              ...(isOwn ? { right: 16 } : { left: clampedX }),
              opacity: blurOpacity,
              transform: [{ scale: popupScale }],
            }}
          >
            <View style={styles.reactionsRowContainer}>
              {["👍", "❤️", "😂", "😢", "😡"].map((em) => (
                <Pressable
                  key={em}
                  onPress={async () => {
                    await handleToggleReaction(
                      focusedMessage,
                      {
                        "👍": "like",
                        "❤️": "love",
                        "😂": "laugh",
                        "😢": "sad",
                        "😡": "angry",
                      }[em]
                    );
                    closePopup();
                  }}
                  style={styles.reactionButton}
                >
                  <Text style={styles.reactionEmojiBtn}>{em}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* (3) Action Row (below the bubble) */}
          <Animated.View
            style={{
              position: "absolute" as const,
              top: actionTop,
              ...(isOwn ? { right: 16 } : { left: clampedX }),
              opacity: blurOpacity,
              transform: [{ scale: popupScale }],
            }}
          >
            <View style={styles.actionsRowContainer}>
              <Pressable
                onPress={() => {
                  setReplyingTo(focusedMessage);
                  closePopup();
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>Reply</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Clipboard.setString(focusedMessage.text || "");
                  closePopup();
                }}
                style={styles.actionButton}
              >
                <Text style={styles.actionText}>Copy</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  handleUnsend(focusedMessage);
                  closePopup();
                }}
                style={[styles.actionButton, { borderBottomWidth: 0 }]}
              >
                <Text style={styles.actionText}>Unsend</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      );
    }

    return null;
  }

  // ─────── Keyboard Tracking ───────
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const keyboardWasOpen = useRef(false);

  // ─────── Show / Hide Attach Menu ───────
  const showAttachMenuAnimated = () => {
    keyboardWasOpen.current = keyboardVisible;
    Keyboard.dismiss();
    setShowAttachMenu(true);
    attachAnim.setValue(0);
    Animated.timing(attachAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };
  const hideAttachMenu = () => {
    Animated.timing(attachAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowAttachMenu(false);
      if (keyboardWasOpen.current && inputRef.current) {
        inputRef.current.focus();
      }
      keyboardWasOpen.current = false;
    });
  };

  // ─────── Render the Attachment Menu Overlay ───────
  const renderAttachMenu = () => {
    if (!showAttachMenu) return null;

    const attachBlurOpacity = attachAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    const attachScale = attachAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });

    return (
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: attachBlurOpacity, zIndex: 1001 },
        ]}
      >
        {/* 1) Full-screen blur behind everything (pointerEvents="none" so touches pass through) */}
        <AnimatedBlurView
          intensity={60}
          tint="dark"
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateX: SCREEN_WIDTH / 2 },
                { translateY: SCREEN_HEIGHT / 2 },
                { scale: attachScale },
                { translateX: -SCREEN_WIDTH / 2 },
                { translateY: -SCREEN_HEIGHT / 2 },
              ],
            },
          ]}
        />

        {/* 2) One full-screen Pressable: any tap not handled by a child button will bubble here and close. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={hideAttachMenu}>
          {/* 3) The menu container itself is a child of this Pressable. 
                 Taps on empty space in or around the menu bubble up to this Pressable. */}
          <Animated.View
            style={[
              styles.attachMenuContainer,
              {
                transform: [{ scale: attachScale }],
                opacity: attachBlurOpacity,
              },
            ]}
          >
            <Animated.ScrollView
              style={StyleSheet.absoluteFill}
              contentContainerStyle={styles.attachScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* 4) Actual menu items live here */}
              <View style={styles.attachMenu}>
                {/* “Photos/Videos” Button */}
                <Pressable
                  style={styles.attachItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    hideAttachMenu();
                    handleMediaPick();
                  }}
                >
                  <MaterialIcons name="photo" size={24} color="#FFF" />
                  <Text style={styles.attachText}>Photos/Videos</Text>
                </Pressable>

                {/* “Play” Button */}
                <Pressable
                  style={styles.attachItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    hideAttachMenu();
                    console.log("Play");
                  }}
                >
                  <MaterialIcons name="games" size={24} color="#FFF" />
                  <Text style={styles.attachText}>Play</Text>
                </Pressable>

                {/* “Document” Button */}
                <Pressable
                  style={styles.attachItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    hideAttachMenu();
                    console.log("Document");
                  }}
                >
                  <MaterialIcons
                    name="insert-drive-file"
                    size={24}
                    color="#FFF"
                  />
                  <Text style={styles.attachText}>Document</Text>
                </Pressable>

                {/* “Location” Button */}
                <Pressable
                  style={styles.attachItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    hideAttachMenu();
                    console.log("Location");
                  }}
                >
                  <MaterialIcons name="location-pin" size={24} color="#FFF" />
                  <Text style={styles.attachText}>Location</Text>
                </Pressable>

                {/* “Contact” Button */}
                <Pressable
                  style={styles.attachItem}
                  onPress={(e) => {
                    e.stopPropagation();
                    hideAttachMenu();
                    console.log("Contact");
                  }}
                >
                  <MaterialIcons name="person" size={24} color="#FFF" />
                  <Text style={styles.attachText}>Contact</Text>
                </Pressable>

                {/* …you can add more items here in the same pattern… */}
              </View>
            </Animated.ScrollView>
          </Animated.View>
        </Pressable>
      </Animated.View>
    );
  };

  if (loading && !conversation) {
    return null;
  }

  return (
    <>
      {/* ─────── MAIN MODAL ─────── */}
      <Modal
        animationType="none"
        transparent
        visible={visible}
        onRequestClose={triggerClose}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.containerWithoutOverflow}>
            {/* BACKDROP */}
            <Pressable style={styles.backdrop} onPress={triggerClose} />

            {/* (A) Long-press overlay on messages */}
            {renderPopupOverlay()}

            {/* (B) Attach-menu overlay (when user taps “+”) */}
            {renderAttachMenu()}

            {/* SLIDING SHEET */}
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
              {/* DRAG HANDLE */}
              <View style={styles.dragHandleContainer}>
                <View style={styles.dragHandle} />
              </View>

              {/* HEADER */}
              <BlurView intensity={50} tint="dark" style={styles.headerBlur}>
                <View style={styles.chatHeader}>
                  <Pressable onPress={triggerClose} style={styles.backButton}>
                    <MaterialIcons name="chevron-left" size={28} color="#FFF" />
                  </Pressable>
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
                                { left: idx * 18, zIndex: 3 - idx },
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
                          <View
                            style={[styles.avatarWrapper, styles.stackedExtra]}
                          >
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
                            .map(
                              (p) => `${p.user.first_name} ${p.user.last_name}`
                            )
                            .join(", ")}
                        </Text>
                        <Text
                          style={styles.chatHeaderUsername}
                          numberOfLines={1}
                        >
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

              {/* ─────── MESSAGES LIST ─────── */}
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
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingHorizontal: 16,
                  paddingTop: 20,
                  paddingBottom: 0,
                }}
                ListFooterComponent={() =>
                  loadingOlder ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFF"
                      style={{ marginTop: 12 }}
                    />
                  ) : null
                }
                renderItem={renderMessageItem}
              />

              {/* ─────── FOOTER / INPUT AREA ─────── */}
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.select({
                  ios: 40,
                  android: 80,
                })}
              >
                <View
                  style={[
                    styles.chatFooter,
                    { paddingBottom: insets.bottom - 5 },
                  ]}
                >
                  {/* ATTACHMENT PREVIEWS */}
                  {attachmentsToSend.length > 0 && (
                    <View style={styles.attachmentsPreview}>
                      {attachmentsToSend.map((file, idx) => (
                        <View key={idx} style={styles.attachmentPreview}>
                          <Image
                            source={{ uri: file.uri }}
                            style={styles.attachmentThumbnail}
                          />
                          <Pressable
                            style={styles.removeAttachmentBtn}
                            onPress={() =>
                              setAttachmentsToSend((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                          >
                            <MaterialIcons
                              name="cancel"
                              size={20}
                              color="#FF3B30"
                            />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* IF BLOCKED / INVITE */}
                  {conversation &&
                  conversation.conversation_status === "blocked" ? (
                    <View style={styles.requestWarningContainer}>
                      <Text style={styles.requestWarningText}>
                        You cannot send messages in this conversation.
                      </Text>
                    </View>
                  ) : conversation && conversation.view_type === "request" ? (
                    <View style={styles.requestActions}>
                      <Pressable
                        style={[styles.requestBtn, styles.requestBtnPrimary]}
                        onPress={async () => {
                          try {
                            await callApi(
                              `messages/request/${conversationId}/accept/`,
                              "POST"
                            );
                            const updated = await callApi(
                              `messages/get_conversation_details/${conversationId}/`
                            );
                            setConversation(updated.data);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        <Text style={styles.requestBtnTextPrimary}>Accept</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.requestBtn, styles.requestBtnSubtle]}
                        onPress={async () => {
                          try {
                            await callApi(
                              `messages/request/${conversationId}/reject/`,
                              "POST"
                            );
                            triggerClose();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        <Text style={styles.requestBtnTextSubtle}>Reject</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.requestBtn, styles.requestBtnDanger]}
                        onPress={async () => {
                          try {
                            await callApi(
                              `messages/request/${conversationId}/block/`,
                              "POST"
                            );
                            triggerClose();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        <Text style={styles.requestBtnTextDanger}>Block</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <BlurView
                      intensity={0}
                      tint="dark"
                      style={styles.footerBlur}
                    >
                      {/* REPLYING BANNER */}
                      {replyingTo && (
                        <View style={styles.replyingBanner}>
                          <Text style={styles.replyingBannerText}>
                            Replying to {replyingTo.sender_username}: “
                            {replyingTo.text
                              ? replyingTo.text.length > 30
                                ? replyingTo.text.substring(0, 30) + "…"
                                : replyingTo.text
                              : "Attachment"}{" "}
                            … ”
                          </Text>
                          <Pressable onPress={() => setReplyingTo(null)}>
                            <MaterialIcons
                              name="close"
                              size={18}
                              color="#BBB"
                              style={{ marginLeft: 8 }}
                            />
                          </Pressable>
                        </View>
                      )}

                      <View style={styles.writeContainer}>
                        {/* “+” Attachment Button */}
                        <Pressable
                          onPress={showAttachMenuAnimated}
                          style={{ marginRight: 12 }}
                        >
                          <MaterialIcons
                            name="add"
                            size={24}
                            color="rgba(222, 222, 222, 0.62)"
                            style={{
                              backgroundColor: "rgba(81, 81, 81, 0.42)",
                              borderRadius: 999,
                              padding: 4,
                            }}
                          />
                        </Pressable>

                        {/* Text Input */}
                        <TextInput
                          ref={inputRef}
                          style={styles.chatInput}
                          placeholder="Message"
                          placeholderTextColor="#888"
                          value={input}
                          onChangeText={setInput}
                          multiline
                          returnKeyType="send"
                          onSubmitEditing={() => {
                            if (input.trim() || attachmentsToSend.length)
                              handleSend();
                          }}
                        />

                        {/* Send Button */}
                        {input.trim() !== "" && (
                          <Pressable
                            onPress={handleSend}
                            style={styles.sendButton}
                          >
                            <FontAwesome
                              name="send"
                              size={22}
                              color="rgba(222, 222, 222, 0.62)"
                            />
                          </Pressable>
                        )}
                      </View>
                    </BlurView>
                  )}
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* ─────── REPLY CHAIN (THREAD) MODAL ─────── */}
      {showChainModal && (
        <Modal transparent animationType="fade">
          <AnimatedBlurView
            intensity={80}
            tint="dark"
            style={[
              styles.chainBlurContainer,
              {
                transform: [
                  {
                    scale: popupAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.chainContainer}>
            <View style={styles.chainHeader}>
              <Text style={styles.chainTitle}>Thread</Text>
              <Pressable onPress={() => setShowChainModal(null)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </Pressable>
            </View>
            <View style={styles.chainScroll}>
              {showChainModal.chain.map((m, idx) => {
                const msgDate = new Date(m.sent_at);
                const own = isOwnMessage(m);
                return (
                  <View
                    key={m.uuid}
                    style={[styles.chainMessageRow, { marginLeft: idx * 12 }]}
                  >
                    {idx < showChainModal.chain.length - 1 && (
                      <View
                        style={[
                          styles.branchVerticalLine,
                          { left: idx * 12 + 8 },
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.chainBubble,
                        own ? styles.chainBubbleOwn : styles.chainBubbleOther,
                      ]}
                    >
                      <Text style={styles.chainSenderName}>
                        {m.sender_username}
                      </Text>
                      <Text style={styles.chainText}>{m.text}</Text>
                      <Text style={styles.chainTimeText}>
                        {msgDate.toLocaleString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  // ─────── CONTAINERS ───────
  containerWithoutOverflow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 6,
  },
  dragHandle: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
  },
  headerBlur: {
    width: "100%",
    overflow: "hidden",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  backButton: {
    marginRight: 12,
    padding: 6,
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
    borderColor: "#000",
    backgroundColor: "#222",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  stackedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
  },
  stackedExtra: {
    left: 54,
    zIndex: 0,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  extraCountText: {
    color: "#0A84FF",
    fontSize: 12,
    fontWeight: "700",
  },
  chatHeaderInfo: {
    flexDirection: "column",
    flexShrink: 1,
    marginLeft: 12,
  },
  chatHeaderName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
    letterSpacing: 0.2,
    maxWidth: "100%",
  },
  chatHeaderUsername: {
    fontSize: 14,
    color: "#AAA",
    marginTop: 2,
  },

  dateSeparatorWrapper: {
    alignSelf: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginVertical: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: "#DDD",
  },

  parentPreviewContainer: {
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  parentPreviewOwn: {
    alignSelf: "flex-end",
  },
  parentPreviewOther: {
    alignSelf: "flex-start",
  },
  parentPreviewInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    maxWidth: "85%",
  },
  parentPreviewText: {
    color: "#EEE",
    fontSize: 13,
    flexShrink: 1,
  },
  branchLine: {
    width: 2,
    backgroundColor: "#0A84FF",
    borderRadius: 1,
    marginRight: 6,
  },
  branchKnot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0A84FF",
    marginRight: 6,
  },

  messageRowOwn: {
    alignSelf: "flex-end",
    marginLeft: "25%",
  },
  messageRowOther: {
    alignSelf: "flex-start",
    marginRight: "25%",
  },
  reactedMarginTop: {
    marginTop: 20, // extra space for badge overlap
  },

  bubbleContainer: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  bubbleContainerOwn: {
    backgroundColor: "#0A84FF",
  },
  bubbleContainerOther: {
    backgroundColor: "#1C1C1E",
  },

  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: "#FFF",
  },
  messageTextOther: {
    color: "#FFF",
  },

  emojiOnlyContainer: {
    backgroundColor: "transparent",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  emojiText: {
    fontSize: 40,
    lineHeight: 44,
  },

  mediaBubbleContainer: {
    marginTop: 4,
    borderRadius: 18,
    overflow: "hidden",
  },
  mediaBubbleOwn: {
    alignSelf: "flex-end",
  },
  mediaBubbleOther: {
    alignSelf: "flex-start",
  },
  largeMediaFull: {
    width: SCREEN_WIDTH * 0.75 - 4,
    height: (SCREEN_WIDTH * 0.75 - 4) * (9 / 16),
    backgroundColor: "#000",
  },
  docCard: {
    width: SCREEN_WIDTH * 0.75 - 4,
    height: 120,
    backgroundColor: "#333",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 0,
  },
  docFileName: {
    marginTop: 6,
    maxWidth: "80%",
    color: "#CCC",
    fontSize: 14,
  },

  // ─────── Corner-badge styles for iMessage-style reactions ───────
  reactionBadge: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#000",
    zIndex: 5,
  },
  reactionBadgeText: {
    fontSize: 16,
    color: "#FFF",
    textAlign: "center",
  },

  footerBlur: {
    width: "100%",
    paddingTop: 0,
    backgroundColor: "transparent",
  },
  chatFooter: {
    borderTopWidth: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 2,
  },
  writeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 100,
    marginHorizontal: 1,
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  chatInput: {
    flex: 1,
    fontSize: 17,
    color: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    maxHeight: 120,
    minHeight: 40,
    borderRadius: 18,
    backgroundColor: "rgba(79, 79, 79, 0)",
    borderColor: "rgba(79, 79, 79, 0.3)",
    borderWidth: 1,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  attachmentsPreview: {
    maxHeight: 150,
    marginBottom: 6,
    marginHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 5,
  },
  attachmentPreview: {
    marginRight: 10,
    marginBottom: 10,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  removeAttachmentBtn: {
    position: "absolute",
    top: -6,
    right: -6,
  },

  // ─────── Styles for the Attach Menu ───────
  attachMenuContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1002,
    backgroundColor: "transparent",
  },
  attachScrollContent: {
    paddingTop: SCREEN_HEIGHT / 2 - 30,
    paddingBottom: 100,
  },
  attachMenu: {
    backgroundColor: "transparent",
    alignItems: "flex-start",
  },
  attachItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: "rgb(255, 255, 255)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 5,
  },
  attachText: {
    marginLeft: 16,
    fontSize: 18,
    color: "#FFF",
  },

  requestWarningContainer: {
    backgroundColor: "#2C2CDE",
    borderColor: "#444",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
  requestWarningText: {
    fontSize: 14,
    color: "#FFF",
    textAlign: "center",
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  requestBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  requestBtnPrimary: {
    backgroundColor: "#0A84FF",
  },
  requestBtnTextPrimary: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  requestBtnSubtle: {
    backgroundColor: "#444",
  },
  requestBtnTextSubtle: {
    color: "#AAA",
    fontWeight: "600",
    fontSize: 15,
  },
  requestBtnDanger: {
    backgroundColor: "#FF3B30",
  },
  requestBtnTextDanger: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },

  // ─────── Long-Press Overlay Styles ───────
  popupOverlayContainer: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  reactionsRowContainer: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 40,
    padding: 5,
    justifyContent: "space-around",
    alignItems: "center",
  },
  actionsRowContainer: {
    flexDirection: "column",
    backgroundColor: "rgba(104, 104, 104, 0.15)",
    borderRadius: 12,
    width: 200,
    justifyContent: "space-evenly",
    alignItems: "flex-start",
  },
  reactionButton: {
    marginHorizontal: 8,
  },
  reactionEmojiBtn: {
    fontSize: 28,
    color: "#FFF",
  },
  actionButton: {
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(157, 157, 157, 0.27)",
    width: "100%",
  },
  actionText: {
    fontSize: 16,
    color: "#FFF",
  },

  // ─────── Attachment Menu Styles ───────
  attachMenuContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1002,
    backgroundColor: "transparent",
  },
  attachScrollContent: {
    paddingTop: SCREEN_HEIGHT / 2 - 30,
    paddingBottom: 100,
  },
  attachMenu: {
    backgroundColor: "transparent",
    alignItems: "flex-start",
  },
  attachItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 20,
    paddingHorizontal: 24,
    shadowColor: "rgb(255, 255, 255)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 20,
    elevation: 5,
  },
  attachText: {
    marginLeft: 16,
    fontSize: 18,
    color: "#FFF",
  },

  // ─────── Summary Overlay Styles ───────
  summaryOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2000,
  },
  summaryBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  summaryContent: {
    marginTop: 16,
    marginHorizontal: 32,
    backgroundColor: "#EFEFF4",
    borderRadius: 12,
    padding: 16,
    maxHeight: SCREEN_HEIGHT * 0.5,
    elevation: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#000",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  unreactButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FF3B30",
    borderRadius: 6,
    marginLeft: 8,
  },
  unreactText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  closeSummaryBtn: {
    marginTop: 12,
    alignSelf: "flex-end",
  },
  closeSummaryText: {
    fontSize: 14,
    color: "#0A84FF",
    fontWeight: "700",
  },

  // ─────── Thread Overlay ───────
  chainBlurContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  chainContainer: {
    position: "absolute",
    top: "15%",
    left: "5%",
    right: "5%",
    bottom: "15%",
    backgroundColor: "#EFEFF4",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 20,
  },
  chainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  chainTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  chainScroll: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chainMessageRow: {
    marginVertical: 8,
  },
  chainBubble: {
    maxWidth: "75%",
    borderRadius: 14,
    padding: 10,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chainBubbleOwn: {
    backgroundColor: "#DCF8C6",
  },
  chainBubbleOther: {
    backgroundColor: "#FFF",
  },
  chainSenderName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  chainText: {
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
  },
  chainTimeText: {
    fontSize: 11,
    color: "#555",
    textAlign: "right",
    marginTop: 4,
  },
  branchVerticalLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#0A84FF",
  },
});
