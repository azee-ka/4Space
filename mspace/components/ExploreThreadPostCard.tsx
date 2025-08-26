import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  Alert,
  Dimensions,
} from "react-native";
import { useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html";
import Icon from "react-native-vector-icons/Feather";
import FA from "react-native-vector-icons/FontAwesome";
import { formatDistanceToNow } from "date-fns";
import { useExpandPostContext } from "../context/expandPostContext";
import useApi from "../hooks/useApi";

const AVATAR_SIZE = 48;
const CARD_HORIZONTAL_MARGIN = 8;

function ExploreThreadPostCardInner({
  onPress,
}: {
  onPress: () => void;
}) {
  // Pull everything from context, same as TimelinePostCard
  const {
    post,
    toggleLikeDislike,
    toggleBookmark,
    postBookmarked,
    commentText,
    setCommentText,
    addComment,
    votePost,
  } = useExpandPostContext();
  const { callApi } = useApi();

  // Detect Repost / Quote (still possible for Thread posts)
  const isRepost = Boolean(post.is_repost && post.parent_post);
  const isQuote = Boolean(post.parent_post && post.quote_text);

  // Determine “effective” author & content
  const effectiveAuthor = isRepost
    ? post.parent_post.author
    : isQuote
    ? post.parent_post.author
    : post.author;

  // If this is a repost/quote, the “thread” content lives under parent_post.post.content
  const effectivePostObject = isRepost
    ? post.parent_post.post
    : isQuote
    ? post.parent_post.post
    : post.post || post; // for normal thread, post.post may be undefined; use post

  // Double‐tap heart animation
  const lastTap = useRef<number | null>(null);
  const [heartAnim] = useState(new Animated.Value(0));
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (post.status?.like_status !== "liked") {
        toggleLikeDislike("like");
      }
      animateHeart();
    } else {
      lastTap.current = now;
    }
  }, [post.status, toggleLikeDislike]);

  const animateHeart = useCallback(() => {
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.spring(heartAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heartAnim]);

  const heartScale = heartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });
  const heartOpacity = heartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Thread content text
  const textContent = useMemo(
    () => effectivePostObject?.content || "",
    [effectivePostObject]
  );

  // Memoize the HTML source object
  const renderedSource = useMemo(
    () => ({ html: textContent || "<p></p>" }),
    [textContent]
  );

  // Memoize the tagsStyles object so it does not recreate each render
  const memoTagsStyles = useMemo(
    () => ({
      p: { marginBottom: 6 },
      strong: { fontWeight: "bold" },
      em: { fontStyle: "italic" },
      a: { color: "#19dee8", textDecorationLine: "underline" },
    }),
    []
  );

  // RenderHTML needs width
  const { width: contentWidth } = useWindowDimensions();

  // Report handler
  const reportPost = useCallback(async () => {
    try {
      await callApi(`posts/post/${post.id}/report/`, "POST", {});
      Alert.alert("Reported", "Thank you for your feedback.");
    } catch (e) {
      console.error("Error reporting post", e);
      Alert.alert("Error", "Could not submit report.");
    }
  }, [callApi, post.id]);

  return (
    <TouchableWithoutFeedback onPress={handleDoubleTap}>
      <View style={styles.postCard}>
        {/* Repost / Quote Banner */}
        {isRepost && post.parent_post && (
          <TouchableOpacity
            style={[styles.banner, styles.repostBanner]}
            onPress={onPress}
          >
            <Icon name="repeat" size={14} color="#7fff00" />
            <Text style={styles.bannerText}>Repost</Text>
          </TouchableOpacity>
        )}
        {isQuote && post.parent_post && (
          <TouchableOpacity
            style={[styles.banner, styles.quoteBanner]}
            onPress={onPress}
          >
            <FA name="quote-left" size={20} color="#1ccaff" />
            <Text style={styles.bannerText}>Quote</Text>
          </TouchableOpacity>
        )}

        {/* Header (author + time) */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={styles.postHeader}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={
                effectiveAuthor?.profile_image
                  ? { uri: effectiveAuthor.profile_image }
                  : require("../assets/default_profile_picture.png")
              }
              style={styles.avatarImg}
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.username}>@{effectiveAuthor?.username}</Text>
            <Text style={styles.time}>
              {post.meta?.created_at
                ? formatDistanceToNow(new Date(post.meta?.created_at), {
                    addSuffix: true,
                  })
                : ""}
            </Text>
          </View>
          <TouchableOpacity onPress={onPress} style={styles.detailsBtn}>
            <Icon name="chevron-right" size={24} color="#888" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Quoted Snippet (if Quote) */}
        {isQuote && post.parent_post && (
          <TouchableOpacity
            style={styles.quoteBlockSmall}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <View style={styles.quoteMetaSmall}>
              <Image
                source={
                  post.parent_post.author.profile_image
                    ? { uri: post.parent_post.author.profile_image }
                    : require("../assets/default_profile_picture.png")
                }
                style={styles.quoteAvatarSmall}
              />
              <Text style={styles.quoteUsernameSmall}>
                @{post.parent_post.author.username}
              </Text>
              <Text style={styles.quoteDateSmall}>
                {post.parent_post.meta?.created_at
                  ? formatDistanceToNow(
                      new Date(post.parent_post.meta?.created_at),
                      { addSuffix: true }
                    )
                  : ""}
              </Text>
            </View>
            <Text style={styles.quoteTextSmall}>{post.quote_text}</Text>
          </TouchableOpacity>
        )}

        {/* Thread Content */}
        {Boolean(textContent) && (
          <View style={styles.postContent}>
            <RenderHTML
              contentWidth={contentWidth - CARD_HORIZONTAL_MARGIN * 2}
              source={renderedSource}
              baseStyle={styles.postText}
              tagsStyles={memoTagsStyles}
            />
          </View>
        )}

        {/* Interaction Row */}
        <View style={styles.interactionRow}>
          {/* Left: Vote Buttons */}
          <View style={styles.votePanel}>
            <TouchableOpacity
              onPress={() => votePost("upvote")}
              style={styles.voteBtn}
            >
              <FA
                name="arrow-up"
                size={22}
                color={
                  post.status?.vote_status === "upvoted" ? "#19dee8" : "#888"
                }
              />
            </TouchableOpacity>
            <Text style={styles.voteCount}>
              {post.stats?.net_votes_count || 0}
            </Text>
            <TouchableOpacity
              onPress={() => votePost("downvote")}
              style={styles.voteBtn}
            >
              <FA
                name="arrow-down"
                size={22}
                color={
                  post.status?.vote_status === "downvoted" ? "#ff4b5c" : "#888"
                }
              />
            </TouchableOpacity>
          </View>

          {/* Right: Actions & Comment Input */}
          <View style={styles.rightPanel}>
            {/* Row 1: Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => toggleLikeDislike("like")}
                style={styles.actionBtn}
              >
                <Icon
                  name="heart"
                  size={22}
                  color={
                    post.status?.like_status === "liked" ? "#ff2d55" : "#888"
                  }
                />
                <Text style={styles.actionText}>
                  {post.stats?.likes_count || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn}>
                <Icon name="message-circle" size={22} color="#888" />
                <Text style={styles.actionText}>
                  {post.stats?.comments_count || 0}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleBookmark}
                style={styles.actionBtn}
              >
                <Icon
                  name="bookmark"
                  size={22}
                  color={postBookmarked ? "#19dee8" : "#888"}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={reportPost} style={styles.actionBtn}>
                <FA name="flag" size={21} color="#888" />
              </TouchableOpacity>

              <View style={styles.spacer} />

              <TouchableOpacity style={styles.shareBtn}>
                <Icon name="share-2" size={22} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Row 2: Add Comment Input */}
            <View style={styles.commentRow}>
              <View style={styles.avatarSmall}>
                <Icon name="user" size={16} color="#888" />
              </View>
              <TextInput
                style={styles.addCommentInput}
                placeholder="Add a comment…"
                placeholderTextColor="#777"
                returnKeyType="send"
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={addComment}
              />
              <TouchableOpacity
                onPress={() => {
                  addComment();
                  Keyboard.dismiss();
                }}
                style={{ marginLeft: 10 }}
              >
                <Icon name="send" size={20} color="#19dee8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Animated Heart (for double-tap) */}
        <Animated.View
          style={[
            styles.animatedHeart,
            {
              opacity: heartOpacity,
              transform: [{ scale: heartScale }],
            },
          ]}
        >
          <Icon name="heart" size={80} color="rgba(255, 45, 83, 0.92)" />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default React.memo(ExploreThreadPostCardInner);

const CARD_WIDTH = Dimensions.get("window").width - CARD_HORIZONTAL_MARGIN * 2;
const MEDIA_HEIGHT = Math.round(CARD_WIDTH * 0.75);

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: "#0c0c0cff",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    marginBottom: 24,
  },

  // Small banner for Repost / Quote
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    marginTop: CARD_HORIZONTAL_MARGIN,
    marginBottom: 4,
  },
  repostBanner: {
    backgroundColor: "rgba(127,255,0,0.1)",
  },
  quoteBanner: {
    backgroundColor: "rgba(28,202,255,0.1)",
  },
  bannerText: {
    marginLeft: 4,
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  // Post Header
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
    paddingVertical: 10,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  time: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  detailsBtn: {
    padding: 4,
  },

  // Quoted Snippet Block
  quoteBlockSmall: {
    backgroundColor: "rgba(59, 61, 65, 0.119)",
    borderRadius: 10,
    marginHorizontal: CARD_HORIZONTAL_MARGIN,
    marginBottom: 6,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#1ccaff",
  },
  quoteMetaSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  quoteAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#252d38",
    marginRight: 6,
  },
  quoteUsernameSmall: {
    color: "#c8c8c8",
    fontWeight: "500",
    marginRight: 6,
  },
  quoteDateSmall: {
    color: "#898989",
    fontSize: 11,
    fontStyle: "italic",
  },
  quoteTextSmall: {
    color: "#dcdcdc",
    fontSize: 13,
    fontStyle: "italic",
    marginLeft: 4,
  },

  // Caption / Content
  postContent: {
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
    paddingVertical: 6,
  },
  postText: {
    color: "#e0e0e0",
    fontSize: 15,
    lineHeight: 20,
  },

  // Interaction Row
  interactionRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
    alignItems: "flex-start",
    height: 95,
  },

  // Left: Vote Panel
  votePanel: {
    width: 35,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
  },
  voteBtn: {
    paddingVertical: 4,
  },
  voteCount: {
    color: "#ccc",
    fontSize: 14,
    marginVertical: 2,
    fontWeight: "500",
  },

  // Right: Actions & Comment
  rightPanel: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    gap: 4,
    paddingTop: 14,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 0,
  },
  actionText: {
    color: "#ccc",
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  spacer: {
    flex: 1,
  },

  // Comment Input
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  addCommentInput: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#292929",
    color: "#e0e0e0",
    paddingHorizontal: 12,
    fontSize: 14,
  },

  // Animated Heart
  animatedHeart: {
    position: "absolute",
    top: MEDIA_HEIGHT / 2 - 40,
    left: CARD_WIDTH / 2 - 40,
  },
});
