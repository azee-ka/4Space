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
import * as MediaLibrary from "expo-media-library";
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

// ─────── Types ───────
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
  const translateY = useRef(new Animated.Value(0)).current;
  const plusAnim = useRef(new Animated.Value(0)).current;

  // For long-press bubble focus:
  const blurOpacity = useRef(new Animated.Value(0)).current;
  // We'll animate scale via a spring from 0.8→1.1→1.0
  const bubbleScale = useRef(new Animated.Value(0.8)).current;
  // We also track x/y translation via Animated.ValueXY
  const bubbleTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // ─────── Refs ───────
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<MessageType>>(null);
  const bubbleRefs = useRef<Record<string, React.RefObject<View>>>({});

  // ─────── State ───────
  const [focusedMessage, setFocusedMessage] = useState<MessageType | null>(
    null
  );
  const [focusedLayout, setFocusedLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [plusX, setPlusX] = useState(0);
  const [plusY, setPlusY] = useState(0);
  const [attachmentsToSend, setAttachmentsToSend] = useState<
    { uri: string; type: string; name: string }[]
  >([]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [plusMenuVisible, setPlusMenuVisible] = useState(false);

  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [showChainModal, setShowChainModal] = useState<{
    rootUuid: string;
    chain: MessageType[];
  } | null>(null);

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

  const [showTimestamps, setShowTimestamps] = useState(false);

  const OPEN_TOP = insets.top + 20;
  const SHEET_OFFSET = SCREEN_HEIGHT - OPEN_TOP;

  const bubblePanResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setShowTimestamps(true),
      onPanResponderRelease: () => setShowTimestamps(false),
    })
  ).current;

  // ─────── Slide‐Up Sheet Animation ───────
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

  // ─────── “+” Menu Animation ───────
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

  // ─────── Drag‐to‐Close (Swipe down) ───────
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

  // ─────── Fetch Conversation Details ───────
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
  }, [conversationId, visible]);

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
        console.error("Error fetching messages:", err);
      } finally {
        if (pageToLoad === 0) setLoading(false);
        else setLoadingOlder(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    if (visible) fetchMessages(0);
  }, [fetchMessages, visible]);

  // ─────── WebSocket for Live Updates ───────
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
      } else if (data.type === "unsend") {
        const { message_uuid } = data;
        setMessages((prev) =>
          prev.filter((m) => m.uuid !== message_uuid)
        );
      }
    },
  });

  // ─────── Auto‐scroll on new messages ───────
  useEffect(() => {
    if (!loadingOlder && flatListRef.current) {
      if (!justSent && !userScrolledUp && loading === false) {
        flatListRef.current.scrollToEnd({ animated: false });
      }
    }
  }, [messages, userScrolledUp, justSent, loadingOlder, loading]);

  // ─────── Helper: Is it my message? ───────
  const isOwnMessage = (m: MessageType) =>
    m.sender_username === currentUsername;

  // ─────── Build Reply Chain (all ancestors) ───────
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
    setMessages((prev) => [optimisticMessage, ...prev]);

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

  // ─────── Pick Media ───────
  const handleMediaPick = async () => {
    setShowPlusMenu(false);
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
    const existing = msg.reactions.some(
      (r) =>
        r.user_username === currentUsername &&
        r.reaction_type === reactionType
    );

    setMessages((prev) =>
      prev.map((m) => {
        if (m.uuid !== msg.uuid) return m;
        let newReactions: ReactionType[];
        if (existing) {
          newReactions = m.reactions.filter(
            (r) => !(r.user_username === currentUsername && r.reaction_type === reactionType)
          );
        } else {
          newReactions = [
            ...m.reactions,
            {
              id: `temp-${Date.now()}`,
              user_username: currentUsername,
              reaction_type: reactionType,
              reacted_at: new Date().toISOString(),
            },
          ];
        }
        return { ...m, reactions: newReactions };
      })
    );

    if (existing) {
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
      console.error("Error unsending message:", err);
      Alert.alert("Unable to unsend", "Try again in a moment.");
    }
  };

  // ─────── Save Media ───────
  const handleSaveMedia = async (att: AttachmentType) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Can't save media without permission.");
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(att.url);
      if (asset) {
        Alert.alert("Saved!", "Media saved to your camera roll.");
      }
    } catch (err) {
      console.error("Error saving media:", err);
      Alert.alert("Save failed", "Could not save media.");
    }
  };

  // ─────── Detect Scroll Up ───────
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

  // ─────── Measure & Open Long‐Press Popup ───────
  const measureAndOpenPopup = (message: MessageType) => {
    const ref = bubbleRefs.current[message.uuid];
    if (!ref || !ref.current) {
      openPopupDirectly(message, null);
      return;
    }
    UIManager.measureInWindow(
      findNodeHandle(ref.current)!,
      (x: number, y: number, width: number, height: number) => {
        openPopupDirectly(message, { x, y, width, height });
      }
    );
  };

  const openPopupDirectly = (
    message: MessageType,
    layout: { x: number; y: number; width: number; height: number } | null
  ) => {
    setFocusedMessage(message);

    if (layout) {
      const maxBubbleWidth = SCREEN_WIDTH * 0.6;
      let finalWidth = layout.width;
      if (layout.width > maxBubbleWidth) {
        finalWidth = maxBubbleWidth;
      }

      setFocusedLayout({
        x: layout.x,
        y: layout.y,
        width: finalWidth,
        height: layout.height,
      });

      // Initialize scale to 0.8, and set translate to bubble center
      bubbleScale.setValue(0.8);
      bubbleTranslate.setValue({
        x: layout.x + layout.width / 2,
        y: layout.y + layout.height / 2,
      });

      // Animate background blur instantly
      Animated.timing(blurOpacity, {
        toValue: 1,
        duration: 150,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();

      // Animate bubble: spring from 0.8→1.1→1.0, and move to center
      Animated.parallel([
        Animated.spring(bubbleScale, {
          toValue: 1.1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(bubbleTranslate, {
          toValue: {
            x: SCREEN_WIDTH / 2,
            y: SCREEN_HEIGHT / 2,
          },
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // After overshoot, settle to 1.0
        Animated.spring(bubbleScale, {
          toValue: 1.0,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }).start();
      });
    } else {
      Animated.timing(blurOpacity, {
        toValue: 1,
        duration: 150,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }).start();
      setFocusedLayout(null);
    }
  };

  const closePopup = () => {
    Animated.timing(blurOpacity, {
      toValue: 0,
      duration: 120,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start(() => {
      setFocusedMessage(null);
      setFocusedLayout(null);
    });
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
          <Image
            source={{ uri: att.url }}
            style={styles.largeMediaFull}
          />
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

  // ─────── Render Single Message Bubble ───────
  const renderMessageItem = ({
    item,
    index,
  }: {
    item: MessageType;
    index: number;
  }) => {
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

    return (
      <View style={{ marginVertical: 6 }}>
        {(!prev ||
          new Date(prev.sent_at).getTime() +
            15 * 60 * 1000 <
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
              own
                ? styles.parentPreviewOwn
                : styles.parentPreviewOther,
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

        <View
          style={[
            styles.messageRow,
            own ? styles.messageRowOwn : styles.messageRowOther,
          ]}
        >
          <Pressable
            ref={bubbleRef}
            {...bubblePanResponderRef.panHandlers}
            onLongPress={() => measureAndOpenPopup(item)}
            style={[
              styles.bubbleContainer,
              own
                ? styles.bubbleContainerOwn
                : styles.bubbleContainerOther,
              emojiOnly && styles.emojiOnlyContainer,
            ]}
          >
            {emojiOnly ? (
              <Text style={styles.emojiText}>{item.text}</Text>
            ) : (
              <Text
                style={[
                  styles.messageText,
                  own
                    ? styles.messageTextOwn
                    : styles.messageTextOther,
                ]}
              >
                {item.text}
              </Text>
            )}
          </Pressable>

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

        {item.attachments?.length > 0 && (
          <View
            style={[
              styles.mediaBubbleContainer,
              own
                ? styles.mediaBubbleOwn
                : styles.mediaBubbleOther,
            ]}
          >
            {item.attachments.map((att) =>
              renderMediaAttachment(att)
            )}
          </View>
        )}

        {item.reactions?.length > 0 && (
          <View
            style={[
              styles.reactionContainer,
              own
                ? styles.reactionContainerOwn
                : styles.reactionContainerOther,
            ]}
          >
            {(() => {
              const counts: Record<string, number> = {};
              item.reactions.forEach((r) => {
                counts[r.reaction_type] =
                  (counts[r.reaction_type] || 0) + 1;
              });
              return Object.entries(counts).map(
                ([type, count]) => {
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
                      onPress={() =>
                        handleToggleReaction(item, type)
                      }
                      style={styles.reactionBtn}
                    >
                      <Text style={styles.reactionEmoji}>
                        {emoji} {count}
                      </Text>
                    </Pressable>
                  );
                }
              );
            })()}
          </View>
        )}
      </View>
    );
  };

  // ─────── Render the Focused Bubble + Reaction/Action Overlay ───────
  const renderPopupOverlay = () => {
    if (!focusedMessage) return null;

    // If layout missing, just blur + fallback menu
    if (!focusedLayout) {
      return (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.blurContainer,
            { opacity: blurOpacity },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={closePopup}
          >
            <BlurView
              intensity={70}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
          {/* Fallback reaction/action at bottom */}
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
                  handleUnsend(focusedMessage);
                  closePopup();
                }}
                style={styles.popupActionBtn}
              >
                <Text style={styles.popupActionText}>Unsend</Text>
              </Pressable>
              {focusedMessage.attachments?.length > 0 && (
                <Pressable
                  onPress={() => {
                    handleSaveMedia(focusedMessage.attachments[0]);
                    closePopup();
                  }}
                  style={styles.popupActionBtn}
                >
                  <Text style={styles.popupActionText}>Save</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      );
    }

    const { x, y, width, height } = focusedLayout;
    const isOwn = isOwnMessage(focusedMessage);
    const emojiOnly = isEmojiOnlyMessage(
      focusedMessage.text.replace(/<\/?[^>]+(>|$)/g, "").trim()
    );

    // Center coordinates:
    const centerX = SCREEN_WIDTH / 2 - width / 2;
    const centerY = SCREEN_HEIGHT / 2 - height / 2;

    // Animated style for bubble:
    const bubbleAnimatedStyle = {
      transform: [
        {
          translateX: bubbleTranslate.x.interpolate({
            inputRange: [0, SCREEN_WIDTH],
            outputRange: [x, centerX],
            extrapolate: "clamp",
          }),
        },
        {
          translateY: bubbleTranslate.y.interpolate({
            inputRange: [0, SCREEN_HEIGHT],
            outputRange: [y, centerY],
            extrapolate: "clamp",
          }),
        },
        { scale: bubbleScale },
      ],
      width,
      height,
    };

    return (
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.blurContainer,
          { opacity: blurOpacity },
        ]}
      >
        {/* Tapping anywhere outside the bubble will close */}
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={closePopup}
        >
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        {/* Focused bubble */}
        <Animated.View
          style={[styles.focusedBubbleWrapper, bubbleAnimatedStyle]}
        >
          <View
            style={[
              styles.bubbleContainer,
              isOwn
                ? styles.bubbleContainerOwn
                : styles.bubbleContainerOther,
              emojiOnly && styles.emojiOnlyContainer,
              { width: "100%", height: "100%", justifyContent: "center" },
            ]}
          >
            {emojiOnly ? (
              <Text style={styles.emojiText}>
                {focusedMessage.text}
              </Text>
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

        {/* Reaction row above bubble */}
        <View
          style={[
            styles.reactionPopupRow,
            {
              position: "absolute",
              left: centerX + width / 2 - (width * 0.6) / 2,
              top: centerY - 50,
            },
          ]}
        >
          {["👍", "❤️", "😂", "😢", "😡"].map((emoji) => (
            <Pressable
              key={emoji}
              onPress={async () => {
                await handleToggleReaction(focusedMessage, {
                  "👍": "like",
                  "❤️": "love",
                  "😂": "laugh",
                  "😢": "sad",
                  "😡": "angry",
                }[emoji]);
                closePopup();
              }}
              style={styles.reactionEmojiBtn}
            >
              <Text style={styles.reactionEmojiLarge}>{emoji}</Text>
            </Pressable>
          ))}
        </View>

        {/* Action buttons below bubble (no “Cancel”) */}
        <View
          style={[
            styles.popupActionButtons,
            {
              position: "absolute",
              top: centerY + height / 2 + 10,
              left: centerX,
              width,
            },
          ]}
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
              handleUnsend(focusedMessage);
              closePopup();
            }}
            style={styles.popupActionBtn}
          >
            <Text style={styles.popupActionText}>Unsend</Text>
          </Pressable>
          {focusedMessage.attachments?.length > 0 && (
            <Pressable
              onPress={() => {
                handleSaveMedia(focusedMessage.attachments[0]);
                closePopup();
              }}
              style={styles.popupActionBtn}
            >
              <Text style={styles.popupActionText}>Save</Text>
            </Pressable>
          )}
        </View>
      </Animated.View>
    );
  };

  if (loading && !conversation) {
    return null;
  }

  return (
    <>
      <Modal
        animationType="none"
        transparent
        visible={visible}
        onRequestClose={triggerClose}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.overlayContainer}>
            <Pressable
              style={styles.backdrop}
              onPress={triggerClose}
            />

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
              <View
                {...panResponder.panHandlers}
                style={styles.dragHandleContainer}
              >
                <View style={styles.dragHandle} />
              </View>

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
                          .filter(
                            (p) => p.user.username !== currentUsername
                          )
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
                            style={[
                              styles.avatarWrapper,
                              styles.stackedExtra,
                            ]}
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

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.select({
                  ios: 90,
                  android: 80,
                })}
              >
                <View
                  style={[
                    styles.chatFooter,
                    { paddingBottom: insets.bottom + 10 },
                  ]}
                >
                  {attachmentsToSend.length > 0 && (
                    <View style={styles.attachmentsPreview}>
                      {attachmentsToSend.map((file, idx) => (
                        <View
                          key={idx}
                          style={styles.attachmentPreview}
                        >
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
                        style={[
                          styles.requestBtn,
                          styles.requestBtnPrimary,
                        ]}
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
                        style={[
                          styles.requestBtn,
                          styles.requestBtnSubtle,
                        ]}
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
                        style={[
                          styles.requestBtn,
                          styles.requestBtnDanger,
                        ]}
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
                        <Text style={styles.requestBtnTextDanger}>
                          Block
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <BlurView
                      intensity={30}
                      tint="dark"
                      style={styles.footerBlur}
                    >
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
                          <Pressable
                            onPress={() => setReplyingTo(null)}
                          >
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
                        <Pressable
                          onPress={() =>
                            inputRef.current?.focus()
                          }
                          style={{ marginRight: 12 }}
                        >
                          <MaterialIcons
                            name="insert-emoticon"
                            size={24}
                            color="#0A84FF"
                          />
                        </Pressable>

                        <Pressable
                          onPress={() => setShowPlusMenu(true)}
                          onLayout={(e) => {
                            const { x, y } =
                              e.nativeEvent.layout;
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

                        <Pressable
                          onPress={handleSend}
                          style={styles.sendButton}
                        >
                          <FontAwesome
                            name="send"
                            size={22}
                            color="#0A84FF"
                          />
                        </Pressable>
                      </View>
                    </BlurView>
                  )}
                </View>
              </KeyboardAvoidingView>

              {focusedMessage && renderPopupOverlay()}
            </Animated.View>

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
                        const res =
                          await DocumentPicker.getDocumentAsync({
                            copyToCacheDirectory: false,
                          });
                        if (res.type === "success") {
                          const { uri, name, mimeType } = res;
                          setAttachmentsToSend((prev) => [
                            ...prev,
                            {
                              uri,
                              type:
                                mimeType ||
                                "application/octet-stream",
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
                        Alert.alert(
                          "Launcher",
                          "No additional apps."
                        );
                      }}
                    >
                      <FontAwesome
                        name="gamepad"
                        size={28}
                        color="#FFF"
                      />
                      <Text style={styles.plusMenuButtonText}>
                        Play
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </Animated.View>
            )}
          </View>
        </GestureHandlerRootView>
      </Modal>

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
              <Pressable
                onPress={() => setShowChainModal(null)}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color="#000"
                />
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
                      { marginLeft: idx * 12 },
                    ]}
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
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
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
    backgroundColor: "#111",
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
    backgroundColor: "#222",
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

  timeTextMain: {
    fontSize: 11,
    color: "#AAA",
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
    backgroundColor: "transparent",
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

  // ─────── Long‐Press Overlay ───────
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  focusedBubbleWrapper: {
    position: "absolute",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  reactionPopupRow: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 40,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  reactionEmojiBtn: {
    marginHorizontal: 8,
  },
  reactionEmojiLarge: {
    fontSize: 32,
  },
  popupActionButtons: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingVertical: 12,
  },
  popupActionBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  popupActionText: {
    fontSize: 16,
    color: "#FFF",
  },
  popupContainerFallback: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  // ─────── “+” Menu Overlay ───────
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

  // ─────── Replying Banner ───────
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
