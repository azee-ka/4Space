// app/messages/ChatOverlay.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
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
  PanResponder,
  findNodeHandle,
  UIManager,
} from "react-native";

import * as Clipboard from "expo-clipboard";
import { Video } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import useApi from "../../../hooks/useApi";
import useWebSocket from "../../../hooks/useWebSocket";
import ProfilePicture from "../../../utils/getProfilePicture";
import useAuth from "@/hooks/useAuth";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get(
  "window"
);

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  reply_count?: number; // number of replies (to display “n Replies”)
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

  // ─── Animated values for sliding sheet and “+” menu ───────────────────────────
  const translateY = useRef(new Animated.Value(0)).current;
  const plusAnim = useRef(new Animated.Value(0)).current;

  // ─── Animated values for full-screen blur & focused bubble scale ───────────────
  const blurOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current; // start at 1, animate to 1.1

  // We’ll store the measured x/y/width/height of the tapped bubble here:
  const [focusedLayout, setFocusedLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Which message is currently “focused” (long-pressed)?
  const [focusedMessage, setFocusedMessage] = useState<MessageType | null>(
    null
  );

  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<MessageType>>(null);

  // For measuring individual bubbles:
  const bubbleRefs = useRef<Record<string, React.RefObject<View>>>({});

  // ─── “+” menu state ────────────────────────────────────────────────────────────
  const [plusX, setPlusX] = useState(0);
  const [plusY, setPlusY] = useState(0);
  const [attachmentsToSend, setAttachmentsToSend] = useState<
    { uri: string; type: string; name: string }[]
  >([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [plusMenuVisible, setPlusMenuVisible] = useState(false);

  // ─── Reply state & thread modal ────────────────────────────────────────────────
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [showChainModal, setShowChainModal] = useState<{
    rootUuid: string;
    chain: MessageType[];
  } | null>(null);

  // ─── Conversation & messages ──────────────────────────────────────────────────
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
  const [closing, setClosing] = useState(false);
  const [justSent, setJustSent] = useState(false);

  // When dragging a bubble, show timestamps
  const [showTimestamps, setShowTimestamps] = useState(false);

  // Offsets for sliding sheet:
  const OPEN_TOP = insets.top + 20;
  const SHEET_OFFSET = SCREEN_HEIGHT - OPEN_TOP;

  // ─── PANRESPONDER for showing timestamps ────────────────────────────────────────
  const bubblePanResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setShowTimestamps(true),
      onPanResponderRelease: () => setShowTimestamps(false),
    })
  ).current;

  // ─── Animate sliding sheet into view ────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    translateY.setValue(SHEET_OFFSET);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateY, visible, SHEET_OFFSET]);

  // ─── Animate “+” menu in/out ───────────────────────────────────────────────────
  useEffect(() => {
    if (showPlusMenu) {
      setPlusMenuVisible(true);
      plusAnim.setValue(0);
      Animated.timing(plusAnim, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (plusMenuVisible) {
      Animated.timing(plusAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setPlusMenuVisible(false);
      });
    }
  }, [showPlusMenu, plusAnim, plusMenuVisible]);

  // ─── Drag-to-close the sheet ─────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
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

  // ─── FETCH CONVERSATION DETAILS ────────────────────────────────────────────────
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
    if (visible) fetchConversation();
  }, [conversationId, visible, callApi]);

  // ─── FETCH MESSAGES (PAGINATED) ────────────────────────────────────────────────
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
    [conversationId, callApi]
  );

  useEffect(() => {
    if (visible) fetchMessages(0);
  }, [fetchMessages, visible]);

  // ─── WEBSOCKET FOR LIVE UPDATES ───────────────────────────────────────────────
  const { sendMessage } = useWebSocket(`messages/inbox/${conversationId}/`, {
    onMessage: (data: any) => {
      if (data.type === "chat_message") {
        const newMsg: MessageType = data.message;
        setMessages((prev) => {
          if (prev.some((m) => m.uuid === newMsg.uuid)) return prev;
          return [newMsg, ...prev];
        });
      } else if (data.type === "reaction_update") {
        const { message_uuid, reactions } = data;
        setMessages((prev) =>
          prev.map((m) =>
            m.uuid === message_uuid ? { ...m, reactions } : m
          )
        );
      }
    },
  });

  // ─── AUTO-SCROLL ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadingOlder && flatListRef.current) {
      if (!justSent && !userScrolledUp && loading === false) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }
  }, [messages, userScrolledUp, justSent, loadingOlder, loading]);

  // ─── HELPER: IS THIS USER’S MESSAGE? ────────────────────────────────────────────
  const isOwnMessage = (m: MessageType) =>
    m.sender_username === currentUsername;

  // ─── BUILD REPLY CHAIN (ALL ANCESTORS) ─────────────────────────────────────────
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

  // ─── OPEN THREAD OVERLAY ───────────────────────────────────────────────────────
  const openChainModal = (msg: MessageType) => {
    const chain = getReplyChain(msg.uuid);
    if (chain.length > 1) {
      setShowChainModal({ rootUuid: msg.uuid, chain });
    }
  };

  // ─── SEND MESSAGE + ATTACHMENTS ───────────────────────────────────────────────
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
      const newMessage: MessageType = resp.data;

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
      console.error("Error sending message with attachments:", err);
      setMessages((prev) =>
        prev.filter((msg) => msg.uuid !== optimisticMessage.uuid)
      );
      Alert.alert(
        "Message Failed",
        "Unable to send your message. Please try again."
      );
    }
  };

  // ─── PICK MEDIA (PHOTO/VIDEO) ─────────────────────────────────────────────────
  const handleMediaPick = async () => {
    setShowPlusMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("We need permission to access your media library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,
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

  // ─── TOGGLE REACTIONS ──────────────────────────────────────────────────────────
  const handleToggleReaction = async (
    msg: MessageType,
    reactionType: string
  ) => {
    const messageUuid = msg.uuid;
    const existing = msg.reactions.some(
      (r) =>
        r.user_username === currentUsername && r.reaction_type === reactionType
    );
    try {
      if (existing) {
        await callApi(
          `messages/remove_reaction/${messageUuid}/${reactionType}/`,
          "DELETE"
        );
      } else {
        await callApi(`messages/add_reaction/${messageUuid}/`, "POST", {
          reaction_type: reactionType,
        });
      }
    } catch (err) {
      console.error("Reaction error:", err);
    }
  };

  // ─── ON SCROLL DETECT IF USER SCROLLED UP ─────────────────────────────────────
  const onScroll = (e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const contentHeight = e.nativeEvent.contentSize.height;
    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
    const distanceFromBottom = contentHeight - offsetY - layoutHeight;
    setUserScrolledUp(distanceFromBottom > 100);
  };
  const onEndReached = () => {
    if (hasMore && !loadingOlder) {
      fetchMessages(page);
    }
  };

  // ─── MEASURE + OPEN LONG-PRESS POPUP ───────────────────────────────────────────
  const measureAndOpenPopup = (message: MessageType) => {
    const ref = bubbleRefs.current[message.uuid];
    if (!ref || !ref.current) {
      // Fallback if ref is missing
      openPopupDirectly(message, null);
      return;
    }

    // Measure the bubble’s on-screen coordinates
    UIManager.measureInWindow(
      findNodeHandle(ref.current)!,
      (x: number, y: number, width: number, height: number) => {
        openPopupDirectly(message, { x, y, width, height });
      }
    );
  };

  // ─── OPEN THE POPUP (FOCUS + BLUR + ANIMATIONS) ───────────────────────────────
  const openPopupDirectly = (
    message: MessageType,
    layout: { x: number; y: number; width: number; height: number } | null
  ) => {
    setFocusedMessage(message);

    if (layout) {
      setFocusedLayout({
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
      });

      // 1) Fade in the blur
      // 2) Then scale the bubble from 1 → 1.1 (in place)
      blurOpacity.setValue(0);
      bubbleScale.setValue(1);

      Animated.sequence([
        Animated.timing(blurOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(bubbleScale, {
          toValue: 1.1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // If we failed to measure, just fade in blur
      blurOpacity.setValue(0);
      Animated.timing(blurOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();
      setFocusedLayout(null);
    }
  };

  // ─── CLOSE THE POPUP ───────────────────────────────────────────────────────────
  const closePopup = () => {
    // 1) shrink bubble back 1.1 → 1
    // 2) fade blur out 1 → 0
    Animated.sequence([
      Animated.timing(bubbleScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(blurOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      setFocusedMessage(null);
      setFocusedLayout(null);
    });
  };

  // ─── RENDER MEDIA ATTACHMENTS ─────────────────────────────────────────────────
  const renderMediaAttachment = (att: AttachmentType) => {
    if (att.mime_type.startsWith("image/")) {
      return (
        <Image
          key={att.id}
          source={{ uri: att.url }}
          style={styles.largeMediaFull}
        />
      );
    } else if (att.mime_type.startsWith("video/")) {
      return (
        <Video
          key={att.id}
          source={{ uri: att.url }}
          style={styles.largeMediaFull}
          useNativeControls
          resizeMode="contain"
        />
      );
    } else {
      return (
        <Pressable
          key={att.id}
          style={styles.docCard}
          onPress={() => Linking.openURL(att.url)}
        >
          <MaterialIcons
            name="insert-drive-file"
            size={48}
            color="#888"
          />
          <Text style={styles.docFileName} numberOfLines={1}>
            {att.url.split("/").pop()}
          </Text>
        </Pressable>
      );
    }
  };

  // ─── RENDER A SINGLE MESSAGE BUBBLE ────────────────────────────────────────────
  const renderMessageItem = ({
    item,
    index,
  }: {
    item: MessageType;
    index: number;
  }) => {
    // Create or retrieve a ref for this bubble
    if (!bubbleRefs.current[item.uuid]) {
      bubbleRefs.current[item.uuid] = React.createRef<View>();
    }
    const bubbleRef = bubbleRefs.current[item.uuid];

    const prev = messages[index + 1];
    const plainText = item.text.replace(/<\/?[^>]+(>|$)/g, "").trim();
    const emojiOnly = isEmojiOnlyMessage(plainText);
    const own = isOwnMessage(item);
    const msgDate = new Date(item.sent_at);
    const timeString = msgDate.toLocaleString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Parent (for threads)
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

    // Are we a true “knot” (two different people replied to same parent)? Not strictly necessary here.
    const isKnot =
      own &&
      parentMsg &&
      parentMsg.sender_username !== currentUsername &&
      messages.some(
        (m) =>
          m.parent_message_uuid === parentMsg!.uuid &&
          m.sender_username !== currentUsername
      );

    return (
      <View style={{ marginVertical: 6 }}>
        {/* 15-minute gap → date separator */}
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

        {/* Parent-preview bubble (threaded reply) */}
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
                ]}
              />
              <Text style={styles.parentPreviewText}>
                {parentMsg.sender_username}: {parentPreviewText}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Actual bubble + optionally timestamp */}
        <View
          style={[
            styles.messageRow,
            own ? styles.messageRowOwn : styles.messageRowOther,
          ]}
        >
          <Pressable
            ref={bubbleRef}
            {...bubblePanResponderRef}
            onLongPress={() => measureAndOpenPopup(item)}
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

          {/* If dragging, show timestamp */}
          {showTimestamps && (
            <Text
              style={[
                styles.timeTextMain,
                own
                  ? { marginLeft: 8, textAlign: "left" }
                  : { marginRight: 8, textAlign: "right" },
              ]}
            >
              {timeString}
            </Text>
          )}
        </View>

        {/* Media attachments (full-width) */}
        {item.attachments?.length > 0 && (
          <View
            style={[
              styles.mediaBubbleContainer,
              own ? styles.mediaBubbleOwn : styles.mediaBubbleOther,
            ]}
          >
            {item.attachments.map((att) =>
              renderMediaAttachment(att)
            )}
          </View>
        )}

        {/* Reaction badges (below bubble) */}
        {item.reactions?.length > 0 && (
          <View
            style={[
              styles.reactionContainer,
              own ? styles.reactionContainerOwn : styles.reactionContainerOther,
            ]}
          >
            {(() => {
              const counts: Record<string, number> = {};
              item.reactions.forEach((r) => {
                counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
              });
              return Object.entries(counts).map(([type, count]) => {
                let emoji = "❓";
                switch (type) {
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
                return (
                  <Pressable
                    key={type}
                    onPress={() => handleToggleReaction(item, type)}
                    style={styles.reactionBtn}
                  >
                    <Text style={styles.reactionEmoji}>
                      {emoji} {count}
                    </Text>
                  </Pressable>
                );
              });
            })()}
          </View>
        )}

        {/* ── “Replies” indicator ─────────────────────────────────────────────────── */}
        {item.reply_count && item.reply_count > 0 && (
          <Pressable
            style={[
              styles.replyCountContainer,
              isOwnMessage(item)
                ? styles.replyCountOwn
                : styles.replyCountOther,
            ]}
            onPress={() => openChainModal(item)}
          >
            <Text style={styles.replyCountText}>
              {item.reply_count > 1
                ? `${item.reply_count} Replies`
                : "1 Reply"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  // ─── RENDER THE FULL-SCREEN LONG-PRESS OVERLAY ─────────────────────────────────
  const renderPopupOverlay = () => {
    if (!focusedMessage || !focusedLayout) {
      // Fallback: just show full blur + bottom-center actions (no in-place bubble)
      return (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.blurContainer,
            { opacity: blurOpacity },
          ]}
        >
          {/* Tappable background to close */}
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closePopup}
          />

          {/* FULL-SCREEN BLUR */}
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />

          {/* NAV HEADER (blurred) */}
          <BlurView intensity={70} tint="dark" style={styles.navHeaderBlur}>
            <View style={styles.navHeaderContent}>
              <Pressable onPress={triggerClose} style={styles.navBackButton}>
                <MaterialIcons name="chevron-left" size={28} color="#FFF" />
              </Pressable>
              <ProfilePicture
                src={conversation?.participants
                  .filter((p) => p.user.username !== currentUsername)[0]
                  ?.user.profile_image}
                style={styles.navAvatar}
              />
              <Text style={styles.navTitle}>
                {conversation?.participants
                  .filter((p) => p.user.username !== currentUsername)
                  .map((p) => `${p.user.first_name} ${p.user.last_name}`)
                  .join(", ")}
              </Text>
              <Pressable style={styles.navFaceTimeBtn}>
                <MaterialIcons name="videocam" size={24} color="#FFF" />
              </Pressable>
              <Pressable onPress={closePopup} style={styles.navCloseBtn}>
                <MaterialIcons name="close" size={24} color="#FFF" />
              </Pressable>
            </View>
          </BlurView>

          {/* BOTTOM-CENTER “Tapback” reactions (fallback) */}
          <View style={styles.popupContainerFallback}>
            <View style={styles.reactionPopupRow}>
              {["👍", "❤️", "😂", "😢", "😡"].map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={async () => {
                    await handleToggleReaction(
                      focusedMessage,
                      {
                        "👍": "like",
                        "❤️": "love",
                        "😂": "laugh",
                        "😢": "sad",
                        "😡": "angry",
                      }[emoji]
                    );
                    closePopup();
                  }}
                  style={styles.reactionEmojiBtn}
                >
                  <Text style={styles.reactionEmojiLarge}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.popupActionButtons}>
              <Pressable
                onPress={() => {
                  setReplyingTo(focusedMessage);
                  closePopup();
                }}
                style={styles.popupActionBtn}
              >
                <Text style={styles.popupActionText}>Reply</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Clipboard.setString(focusedMessage.text || "");
                  closePopup();
                }}
                style={styles.popupActionBtn}
              >
                <Text style={styles.popupActionText}>Copy</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  console.log("Unsend:", focusedMessage.uuid);
                  closePopup();
                }}
                style={styles.popupActionBtn}
              >
                <Text style={styles.popupActionText}>Unsend</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  /* “More…” → you can open ActionSheetIOS or custom menu */
                  console.log("More…:", focusedMessage.uuid);
                  closePopup();
                }}
                style={styles.popupActionBtn}
              >
                <Text style={styles.popupActionText}>More…</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      );
    }

    // If we have a measured layout, position the bubble exactly at (x,y) and scale it.
    const { x, y, width, height } = focusedLayout;
    const isOwn = isOwnMessage(focusedMessage);
    const emojiOnly = isEmojiOnlyMessage(
      focusedMessage.text.replace(/<\/?[^>]+(>|$)/g, "").trim()
    );

    // We’ll animate the bubble to stay at (x, y) but scale from 1 → 1.1
    const bubbleAnimatedStyle = {
      position: "absolute" as const,
      top: y,
      left: x,
      width,
      height,
      transform: [{ scale: bubbleScale }],
    };

    // Center the reaction row above: we’ll measure its width onLayout
    const [reactionRowWidth, setReactionRowWidth] = useState(0);
    const [actionRowWidth, setActionRowWidth] = useState(0);

    const reactionLeft =
      x + width / 2 - (reactionRowWidth / 2 || 0);
    const actionLeft =
      x + width / 2 - (actionRowWidth / 2 || 0);

    return (
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.blurContainer,
          { opacity: blurOpacity },
        ]}
      >
        {/* Tappable background to close */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={closePopup}
        />

        {/* FULL-SCREEN BLUR */}
        <BlurView
          intensity={70}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        {/* NAV HEADER (blurred) */}
        <BlurView intensity={70} tint="dark" style={styles.navHeaderBlur}>
          <View style={styles.navHeaderContent}>
            <Pressable onPress={triggerClose} style={styles.navBackButton}>
              <MaterialIcons name="chevron-left" size={28} color="#FFF" />
            </Pressable>
            <ProfilePicture
              src={conversation?.participants
                .filter((p) => p.user.username !== currentUsername)[0]
                ?.user.profile_image}
              style={styles.navAvatar}
            />
            <Text style={styles.navTitle}>
              {conversation?.participants
                .filter((p) => p.user.username !== currentUsername)
                .map((p) => `${p.user.first_name} ${p.user.last_name}`)
                .join(", ")}
            </Text>
            <Pressable style={styles.navFaceTimeBtn}>
              <MaterialIcons name="videocam" size={24} color="#FFF" />
            </Pressable>
            <Pressable onPress={closePopup} style={styles.navCloseBtn}>
              <MaterialIcons name="close" size={24} color="#FFF" />
            </Pressable>
          </View>
        </BlurView>

        {/* Focused bubble, slightly enlarged (scale=1.1) */}
        <Animated.View style={bubbleAnimatedStyle}>
          <View
            style={[
              styles.bubbleContainer,
              isOwn ? styles.bubbleContainerOwn : styles.bubbleContainerOther,
              emojiOnly && styles.emojiOnlyContainer,
              { width: "100%", height: "100%", justifyContent: "center" },
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
                numberOfLines={3} // shrink if too long
              >
                {focusedMessage.text}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ── Tapback capsule (reaction row) ──────────────────────────────────────── */}
        <View
          style={[
            styles.reactionPopupRow,
            {
              position: "absolute" as const,
              top: y - 48,
              left: reactionLeft < 0 ? 0 : reactionLeft,
            },
          ]}
          onLayout={(e) => setReactionRowWidth(e.nativeEvent.layout.width)}
        >
          {/* Little “tail” (a rotated square) ▼ */}
          <View style={styles.tapbackTail} />

          {/* Actual emojis */}
          {["😘", "👍", "👎", "😂", "‼️", "❓", "🤔"].map((emoji) => (
            <Pressable
              key={emoji}
              onPress={async () => {
                // map emoji → reaction_type
                const mapping: Record<string, string> = {
                  "😘": "love",
                  "👍": "like",
                  "👎": "dislike",
                  "😂": "laugh",
                  "‼️": "exclaim",
                  "❓": "question",
                  "🤔": "thinking",
                };
                const reactionType = mapping[emoji] || "like";
                await handleToggleReaction(focusedMessage, reactionType);
                closePopup();
              }}
              style={styles.reactionEmojiBtn}
            >
              <Text style={styles.reactionEmojiLarge}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Custom action sheet (beneath bubble) ───────────────────────────────── */}
        <View
          style={[
            styles.popupActionButtons,
            {
              position: "absolute" as const,
              top: y + height + 12,
              left: actionLeft < 0 ? 0 : actionLeft,
              width: actionRowWidth || width,
            },
          ]}
          onLayout={(e) => setActionRowWidth(e.nativeEvent.layout.width)}
        >
          <Pressable
            onPress={() => {
              setReplyingTo(focusedMessage);
              closePopup();
            }}
            style={styles.popupActionBtn}
          >
            <Text style={styles.popupActionText}>Reply</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable
            onPress={() => {
              Clipboard.setString(focusedMessage.text || "");
              closePopup();
            }}
            style={styles.popupActionBtn}
          >
            <Text style={styles.popupActionText}>Copy</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable
            onPress={() => {
              console.log("Unsend:", focusedMessage.uuid);
              closePopup();
            }}
            style={styles.popupActionBtn}
          >
            <Text style={styles.popupActionText}>Unsend</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable
            onPress={() => {
              console.log("More…:", focusedMessage.uuid);
              closePopup();
            }}
            style={styles.popupActionBtn}
          >
            <Text style={styles.popupActionText}>More…</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  if (loading && !conversation) {
    return null;
  }

  return (
    <>
      {/* ── MAIN MODAL ─────────────────────────────────────────────────────────────── */}
      <Modal
        animationType="none"
        transparent
        visible={visible}
        onRequestClose={triggerClose}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.overlayContainer}>
            {/* BACKDROP behind sheet */}
            <Pressable style={styles.backdrop} onPress={triggerClose} />

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
              <View
                {...panResponder.panHandlers}
                style={styles.dragHandleContainer}
              >
                <View style={styles.dragHandle} />
              </View>

              {/* CHAT HEADER (inside sheet) */}
              <BlurView intensity={50} tint="dark" style={styles.headerBlur}>
                <View style={styles.chatHeader}>
                  <Pressable
                    onPress={triggerClose}
                    style={styles.backButton}
                  >
                    <MaterialIcons
                      name="chevron-left"
                      size={28}
                      color="#FFF"
                    />
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
                        <Text
                          style={styles.chatHeaderName}
                          numberOfLines={1}
                        >
                          {conversation.participants
                            .filter(
                              (p) => p.user.username !== currentUsername
                            )
                            .map(
                              (p) =>
                                `${p.user.first_name} ${p.user.last_name}`
                            )
                            .join(", ")}
                        </Text>
                        <Text
                          style={styles.chatHeaderUsername}
                          numberOfLines={1}
                        >
                          {conversation.participants
                            .filter(
                              (p) => p.user.username !== currentUsername
                            )
                            .map((p) => `@${p.user.username}`)
                            .join(", ")}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </BlurView>

              {/* MESSAGES LIST */}
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
                  paddingTop: 12,
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

              {/* FOOTER / INPUT AREA */}
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
              >
                <View
                  style={[
                    styles.chatFooter,
                    { paddingBottom: insets.bottom + 30 },
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
                  ) : conversation &&
                    conversation.view_type === "request" ? (
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
                        <Text style={styles.requestBtnTextPrimary}>
                          Accept
                        </Text>
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
                        <Text style={styles.requestBtnTextSubtle}>
                          Reject
                        </Text>
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
                    <BlurView intensity={30} tint="dark" style={styles.footerBlur}>
                      {/* REPLYING BANNER */}
                      {replyingTo && (
                        <View style={styles.replyingBanner}>
                          <Text style={styles.replyingBannerText}>
                            Replying to {replyingTo.sender_username}: “
                            {replyingTo.text
                              ? replyingTo.text.length > 30
                                ? replyingTo.text.substring(0, 30) + "…"
                                : replyingTo.text
                              : "Attachment"}
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
                        {/* EMOJI BUTTON */}
                        <Pressable
                          onPress={() => inputRef.current?.focus()}
                          style={{ marginRight: 12 }}
                        >
                          <MaterialIcons name="insert-emoticon" size={24} color="#0A84FF" />
                        </Pressable>

                        {/* “+” BUTTON */}
                        <Pressable
                          onPress={() => setShowPlusMenu(true)}
                          onLayout={(e) => {
                            const { x, y } = e.nativeEvent.layout;
                            setPlusX(x);
                            setPlusY(y);
                          }}
                          style={{ marginRight: 12 }}
                        >
                          <MaterialIcons
                            name="add-circle-outline"
                            size={24}
                            color="#0A84FF"
                          />
                        </Pressable>

                        {/* TEXT INPUT */}
                        <TextInput
                          ref={inputRef}
                          style={styles.chatInput}
                          placeholder="iMessage"
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

                        {/* SEND BUTTON */}
                        <Pressable onPress={handleSend} style={styles.sendButton}>
                          <FontAwesome name="send" size={22} color="#0A84FF" />
                        </Pressable>
                      </View>
                    </BlurView>
                  )}
                </View>
              </KeyboardAvoidingView>

              {/* LONG-PRESS OVERLAY: Tapback + Actions */}
              {focusedMessage && renderPopupOverlay()}
            </Animated.View>

            {/* “+” MENU OVERLAY */}
            {plusMenuVisible && (
              <Animated.View
                style={[
                  styles.plusMenuOverlayContainer,
                  { opacity: plusAnim },
                ]}
              >
                <Pressable
                  style={styles.plusMenuBackdrop}
                  onPress={() => setShowPlusMenu(false)}
                >
                  <BlurView
                    intensity={30}
                    tint="dark"
                    style={styles.plusMenuBackdrop}
                  />
                </Pressable>
                <Animated.View
                  style={[
                    styles.plusMenuButtonsContainer,
                    {
                      left: plusX,
                      bottom: plusY + OPEN_TOP,
                      transform: [
                        {
                          translateY: plusAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [120, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.plusMenuContentContainer}>
                    <Pressable
                      style={styles.plusMenuButton}
                      onPress={handleMediaPick}
                    >
                      <MaterialIcons
                        name="photo-library"
                        size={28}
                        color="#FFF"
                      />
                      <Text style={styles.plusMenuButtonText}>
                        Photo &amp; Video
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.plusMenuButton}
                      onPress={async () => {
                        setShowPlusMenu(false);
                        const res = await DocumentPicker.getDocumentAsync({
                          copyToCacheDirectory: false,
                        });
                        if (res.type === "success") {
                          const { uri, name, mimeType } = res;
                          setAttachmentsToSend((prev) => [
                            ...prev,
                            {
                              uri,
                              type: mimeType || "application/octet-stream",
                              name,
                            },
                          ]);
                        }
                      }}
                    >
                      <MaterialIcons
                        name="insert-drive-file"
                        size={28}
                        color="#FFF"
                      />
                      <Text style={styles.plusMenuButtonText}>
                        Document
                      </Text>
                    </Pressable>

                    <Pressable
                      style={styles.plusMenuButton}
                      onPress={() => {
                        setShowPlusMenu(false);
                        Alert.alert("Launcher", "No additional apps.");
                      }}
                    >
                      <FontAwesome name="gamepad" size={28} color="#FFF" />
                      <Text style={styles.plusMenuButtonText}>Play</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </Animated.View>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* ── REPLY CHAIN (THREAD) MODAL ─────────────────────────────────────────────── */}
      {showChainModal && (
        <Modal transparent animationType="fade">
          <BlurView
            intensity={80}
            tint="dark"
            style={styles.chainBlurContainer}
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
                    style={[
                      styles.chainMessageRow,
                      { marginLeft: idx * 12 }, // indent by level
                    ]}
                  >
                    {/* vertical branch line */}
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
                        own
                          ? styles.chainBubbleOwn
                          : styles.chainBubbleOther,
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
  // ── OVERLAY BEHIND SLIDING SHEET ───────────────────────────────────────────────
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },

  // ── SLIDING SHEET ─────────────────────────────────────────────────────────────
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

  // ── DRAG HANDLE ───────────────────────────────────────────────────────────────
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: "#111",
  },
  dragHandle: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
  },

  // ── CHAT HEADER (in sheet) ───────────────────────────────────────────────────
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

  // ── DATE SEPARATOR ────────────────────────────────────────────────────────────
  dateSeparatorWrapper: {
    alignSelf: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: "#222",
    marginVertical: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: "#DDD",
  },

  // ── PARENT PREVIEW (thread) ───────────────────────────────────────────────────
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
    height: 20,
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

  // ── MESSAGE ROW (bubble + optional timestamp) ────────────────────────────────
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "75%",
  },
  messageRowOwn: {
    alignSelf: "flex-end",
    marginLeft: "25%",
  },
  messageRowOther: {
    alignSelf: "flex-start",
    marginRight: "25%",
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
    backgroundColor: "#0A84FF", // iMessage blue
  },
  bubbleContainerOther: {
    backgroundColor: "#1C1C1E", // dark gray bubble
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

  // ── EMOJI-ONLY BUBBLE ─────────────────────────────────────────────────────────
  emojiOnlyContainer: {
    backgroundColor: "transparent",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  emojiText: {
    fontSize: 40,
    lineHeight: 44,
  },

  // ── TIMESTAMP (appears when dragging) ────────────────────────────────────────
  timeTextMain: {
    fontSize: 11,
    color: "#AAA",
  },

  // ── MEDIA BUBBLE (full-width) ─────────────────────────────────────────────────
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
    width: (SCREEN_WIDTH * 0.75) - 4,
    height: ((SCREEN_WIDTH * 0.75) - 4) * (9 / 16),
    backgroundColor: "#000",
  },
  docCard: {
    width: (SCREEN_WIDTH * 0.75) - 4,
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

  // ── REACTIONS (below bubble) ────────────────────────────────────────────────
  reactionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  reactionContainerOwn: {
    alignSelf: "flex-end",
    marginRight: 14,
  },
  reactionContainerOther: {
    alignSelf: "flex-start",
    marginLeft: 14,
  },
  reactionBtn: {
    marginRight: 6,
    backgroundColor: "#333",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reactionEmoji: {
    fontSize: 14,
    color: "#FFF",
  },

  // ── “Replies” indicator on a bubble ──────────────────────────────────────────
  replyCountContainer: {
    position: "absolute",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#333",
  },
  replyCountOwn: {
    right: -60, // adjust so it sits top-right of bubble
    top: 4,
  },
  replyCountOther: {
    left: -60, // adjust so it sits top-left of bubble
    top: 4,
  },
  replyCountText: {
    fontSize: 12,
    color: "#FFF",
  },

  // ── FOOTER (chat input) ──────────────────────────────────────────────────────
  footerBlur: {
    width: "100%",
    paddingTop: 6,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  chatFooter: {
    borderTopWidth: 1,
    backgroundColor: "#000",
    paddingHorizontal: 2,
  },
  writeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 100,
    marginHorizontal: 1,
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chatInput: {
    flex: 1,
    fontSize: 17,
    color: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    maxHeight: 100,
    minHeight: 40,
    borderRadius: 18,
    backgroundColor: "#2C2C2E",
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── ATTACHMENT PREVIEWS ──────────────────────────────────────────────────────
  attachmentsPreview: {
    maxHeight: 150,
    marginBottom: 6,
    marginHorizontal: 12,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 5,
  },
  attachmentPreview: {
    marginRight: 10,
    marginBottom: 10,
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
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

  // ── REQUEST / INVITE UI ───────────────────────────────────────────────────────
  requestWarningContainer: {
    backgroundColor: "#2C2C2E",
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
    gap: 12,
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

  // ── LONG-PRESS POPUP OVERLAY ──────────────────────────────────────────────────
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },

  // ── NAV HEADER FOR LONG-PRESS ─────────────────────────────────────────────────
  navHeaderBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60 + insets.top, // status bar + nav height
    zIndex: 1000,
  },
  navHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: insets.top,
    paddingHorizontal: 12,
    height: 60 + insets.top,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  navBackButton: {
    padding: 6,
  },
  navAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    marginLeft: 8,
  },
  navTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  navFaceTimeBtn: {
    padding: 6,
    marginRight: 12,
  },
  navCloseBtn: {
    padding: 6,
  },

  // ── TAPBACK CAPSULE (reaction row) ───────────────────────────────────────────
  reactionPopupRow: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 40,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    zIndex: 1001,
  },
  tapbackTail: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    marginLeft: -6,
    width: 12,
    height: 12,
    backgroundColor: "#1C1C1E",
    transform: [{ rotate: "45deg" }],
    borderBottomLeftRadius: 2,
  },
  reactionEmojiBtn: {
    marginHorizontal: 6,
  },
  reactionEmojiLarge: {
    fontSize: 32,
  },

  // ── CUSTOM ACTION SHEET ──────────────────────────────────────────────────────
  popupActionButtons: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingVertical: 6,
    zIndex: 1001,
  },
  popupActionBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  popupActionText: {
    fontSize: 16,
    color: "#FFF",
  },
  separator: {
    height: 1,
    backgroundColor: "#333",
    marginHorizontal: 12,
  },
  popupContainerFallback: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  // ── “+” MENU OVERLAY ─────────────────────────────────────────────────────────
  plusMenuOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  plusMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  plusMenuButtonsContainer: {
    position: "absolute",
    bottom: 0,
    width: 200,
    maxHeight: SCREEN_HEIGHT * 0.45,
    borderRadius: 10,
    overflow: "hidden",
  },
  plusMenuContentContainer: {
    paddingVertical: 8,
  },
  plusMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  plusMenuButtonText: {
    color: "#FFF",
    fontSize: 15,
    marginLeft: 12,
  },

  // ── REPLYING BANNER ABOVE INPUT ──────────────────────────────────────────────
  replyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    padding: 8,
    marginHorizontal: 16,
    borderRadius: 6,
    marginBottom: 6,
  },
  replyingBannerText: {
    color: "#EEE",
    flex: 1,
    fontSize: 13,
  },

  // ── THREAD (“BRANCHING”) OVERLAY ───────────────────────────────────────────────
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
