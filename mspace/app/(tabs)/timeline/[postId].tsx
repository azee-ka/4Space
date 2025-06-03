// app/(tabs)/timeline/[postId].tsx

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html";
import FA from "react-native-vector-icons/FontAwesome";
import Icon from "react-native-vector-icons/Feather";
import { formatDistanceToNow } from "date-fns";
import {
  ExpandPostProvider,
  useExpandPostContext,
} from "../../../context/expandPostContext";

const { width } = Dimensions.get("window");
const INPUT_BAR_HEIGHT = 56;

// We define these two constants so that the FlatList container and getItemLayout match exactly.
const IMAGE_CONTAINER_WIDTH = width * 0.96;
const IMAGE_CONTAINER_HEIGHT = width * 0.7;

function PostHeader({ origin }: { origin?: string }) {
  const router = useRouter();
  const {
    post,
    currentMediaIndex,
    setCurrentMediaIndex,
    toggleLikeDislike,
    toggleBookmark,
    postBookmarked,
    votePost,
  } = useExpandPostContext();

  // ── Double‐tap logic for main post ─────────────────────────────────────────
  const lastTap = useRef<number | null>(null);
  const [heartAnim] = useState(new Animated.Value(0));

  // Create a single, stable ref for the FlatList (so it does not recreate on every render)
  const flatListRef = useRef<FlatList<any> | null>(null);

  const handleDoubleTapPost = () => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      if (post.status?.like_status !== "liked") {
        toggleLikeDislike("like");
      }
      animateHeart();
    } else {
      lastTap.current = now;
    }
  };

  const animateHeart = () => {
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.spring(heartAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
      Animated.delay(400),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const heartScale = heartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });
  const heartOpacity = heartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!post) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#19dee8" />
      </View>
    );
  }

  const isRepost = post.is_repost && post.parent_post;
  const isQuote = post.parent_post && Boolean(post.quote_text);

  const effectiveAuthor = isRepost
    ? post.parent_post.author
    : isQuote
    ? post.parent_post.author
    : post.author;

  const effectiveContent = isRepost
    ? post.parent_post.post
    : isQuote
    ? post.parent_post.post
    : post.post;

  const isThread =
    (isRepost ? post.parent_post.post_type : post.post_type) === "Thread";

  const media = isThread
    ? []
    : isRepost || isQuote
    ? post.parent_post.post.media_files || []
    : post.media_files || post.post?.media_files || [];

  const mediaIndex = currentMediaIndex ?? 0;

  // When scrolling stops, update the index
  const onMomentumScrollEnd = (e: any) => {
    const idx = Math.round(
      e.nativeEvent.contentOffset.x / IMAGE_CONTAINER_WIDTH
    );
    setCurrentMediaIndex?.(idx);
  };

  const { width: contentWidth } = useWindowDimensions();

  return (
    <View style={styles.headerWrap}>
      {/* ← BACK BUTTON */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-left" size={28} color="#19dee8" />
      </TouchableOpacity>

      {/* ── Repost / Quote Banner ─────────────────────────────────────────────── */}
      {isRepost && post.parent_post && (
        <TouchableOpacity
          style={[styles.banner, styles.repostBanner]}
          onPress={() => router.push(`/timeline/${post.parent_post.id}`)}
        >
          <Icon name="repeat" size={16} color="#7fff00" />
          <Text style={styles.bannerText}>Repost</Text>
        </TouchableOpacity>
      )}
      {isQuote && post.parent_post && (
        <TouchableOpacity
          style={[styles.banner, styles.quoteBanner]}
          onPress={() => router.push(`/timeline/${post.parent_post.id}`)}
        >
          <FA name="quote-left" size={16} color="#1ccaff" />
          <Text style={styles.bannerText}>Quote</Text>
        </TouchableOpacity>
      )}

      {/* ── AUTHOR + TIME ──────────────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Image
          source={
            effectiveAuthor?.profile_image
              ? { uri: effectiveAuthor.profile_image }
              : require("../../../assets/default_profile_picture.png")
          }
          style={styles.avatar}
        />
        <View>
          <Text style={styles.username}>@{effectiveAuthor?.username}</Text>
          <Text style={styles.time}>
            {post.meta?.created_at
              ? formatDistanceToNow(new Date(post.meta.created_at), {
                  addSuffix: true,
                })
              : ""}
          </Text>
        </View>
      </View>

      {/* ── QUOTED‐POST BLOCK (if quote) ───────────────────────────────────────── */}
      {isQuote && post.parent_post && (
        <TouchableOpacity
          style={styles.quoteBlock}
          onPress={() => router.push(`/timeline/${post.parent_post.id}`)}
        >
          <View style={styles.quoteMeta}>
            <Image
              source={
                post.parent_post.author.profile_image
                  ? { uri: post.parent_post.author.profile_image }
                  : require("../../../assets/default_profile_picture.png")
              }
              style={styles.quoteAvatar}
            />
            <Text style={styles.quoteUsername}>
              @{post.parent_post.author.username}
            </Text>
            <Text style={styles.quoteDate}>
              {post.parent_post.meta?.created_at
                ? formatDistanceToNow(
                    new Date(post.parent_post.meta.created_at),
                    { addSuffix: true }
                  )
                : ""}
            </Text>
          </View>
          <Text style={styles.quoteText}>{post.quote_text}</Text>
        </TouchableOpacity>
      )}

      {/* ── MEDIA CAROUSEL (non‐thread), images individually wrapped for double‐tap ────────── */}
      {!isThread && media.length > 0 && (
        <View style={styles.media}>
          <FlatList
            data={media}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => idx.toString()}
            ref={flatListRef}
            getItemLayout={(_, index) => ({
              length: IMAGE_CONTAINER_WIDTH,
              offset: IMAGE_CONTAINER_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={onMomentumScrollEnd}
            initialScrollIndex={mediaIndex}
            renderItem={({ item }) => (
              <TouchableWithoutFeedback onPress={handleDoubleTapPost}>
                <Image
                  source={{ uri: item.file || item.url || (item as any) }}
                  style={{
                    width: IMAGE_CONTAINER_WIDTH,
                    height: IMAGE_CONTAINER_HEIGHT,
                    borderRadius: 14,
                    backgroundColor: "#222",
                  }}
                  resizeMode="cover"
                />
              </TouchableWithoutFeedback>
            )}
            style={{
              width: IMAGE_CONTAINER_WIDTH,
              height: IMAGE_CONTAINER_HEIGHT,
              borderRadius: 14,
              overflow: "hidden",
            }}
          />

          {/* Animated heart over the media */}
          <Animated.View
            style={[
              styles.animatedHeartMain,
              {
                opacity: heartOpacity,
                transform: [{ scale: heartScale }],
              },
            ]}
          >
            <Icon name="heart" size={100} color="rgba(255, 75, 92, 0.8)" />
          </Animated.View>

          {media.length > 1 && (
            <View style={styles.dots}>
              {media.map((_, i) => (
                <View
                  key={i.toString()}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: mediaIndex === i ? "#19dee8" : "#444",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── CAPTION / THREAD CONTENT (double‐tapable) ─────────────────────────── */}
      {isThread && (
        <TouchableWithoutFeedback onPress={handleDoubleTapPost}>
          <View>
            <RenderHTML
              contentWidth={contentWidth - 32}
              source={{ html: effectiveContent?.content || "<p></p>" }}
              baseStyle={styles.caption}
              tagsStyles={{
                p: { marginBottom: 8 },
                strong: { fontWeight: "bold" },
                em: { fontStyle: "italic" },
                a: { color: "#19dee8", textDecorationLine: "underline" },
              }}
            />

            <Animated.View
              style={[
                styles.animatedHeartMain,
                {
                  opacity: heartOpacity,
                  transform: [{ scale: heartScale }],
                },
              ]}
            >
              <Icon name="heart" size={100} color="rgba(255, 75, 92, 0.8)" />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* ── ACTIONS ROW ───────────────────────────────────────────────────────── */}
      <View style={styles.actionsRow}>
        {/* ── VOTE SECTION (VERTICAL) ───────────────────────────────────────── */}
        <View style={styles.voteSection}>
          <TouchableOpacity
            onPress={() => votePost("upvote")}
            style={styles.voteButton}
          >
            <FA
              name="arrow-up"
              size={22}
              color={
                post.status?.vote_status === "upvoted" ? "#19dee8" : "#aaa"
              }
            />
          </TouchableOpacity>

          <Text style={styles.voteCount}>
            {post.stats?.net_votes_count || 0}
          </Text>

          <TouchableOpacity
            onPress={() => votePost("downvote")}
            style={styles.voteButton}
          >
            <FA
              name="arrow-down"
              size={22}
              color={
                post.status?.vote_status === "downvoted" ? "#ff4b5c" : "#aaa"
              }
            />
          </TouchableOpacity>
        </View>

        {/* ── TWO ROWS OF ACTION BUTTONS ──────────────────────────────────────── */}
        <View style={styles.mainActionGrid}>
          {/* Row 1: Heart (with count), Comment (with count), Bookmark, Share */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.action}
              onPress={() => toggleLikeDislike("like")}
            >
              <Icon
                name="heart"
                size={20}
                color={
                  post.status?.like_status === "liked" ? "#ff4b5c" : "#aaa"
                }
              />
              <Text style={styles.actionCount}>
                {post.stats?.likes_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <Icon name="message-circle" size={20} color="#aaa" />
              <Text style={styles.actionCount}>
                {post.stats?.comments_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action} onPress={toggleBookmark}>
              <Icon
                name="bookmark"
                size={20}
                color={postBookmarked ? "#19dee8" : "#aaa"}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <Icon name="share-2" size={20} color="#aaa" />
            </TouchableOpacity>
          </View>

          {/* Row 2: Report (flag), AI Info (magic), Analytics (bar-chart + text) */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.action}>
              <FA name="flag" size={20} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <FA name="magic" size={20} color="#aaa" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <FA name="bar-chart" size={18} color="#aaa" />
              <Text style={styles.actionTextSmall}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function PostDetailInner({ origin }: { origin?: string }) {
  const {
    post,
    comments,
    commentsLoading,
    commentsLoadingMore,
    commentsNextPage,
    commentText,
    setCommentText,
    addComment,
    loadMoreComments,
    voteComment,
    toggleCommentLike,
  } = useExpandPostContext();

  const inputRef = useRef<TextInput>(null);

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#111317" }}>
        <ActivityIndicator size="large" color="#19dee8" />
      </SafeAreaView>
    );
  }

  // Combined header: post + comments header
  const CombinedHeader = () => (
    <>
      <PostHeader origin={origin} />
      <Text style={styles.commentsHeader}>
        Comments ({post.stats?.comments_count || 0})
      </Text>
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <SafeAreaView style={{ height: "100%", backgroundColor: "#111317" }}>
        {/* 1) FlatList for comments */}
        <View style={{ flex: 1 }}>
          <FlatList
            ListHeaderComponent={<CombinedHeader />}
            data={comments}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item, index }) => (
              <View>
                {/* Divider above every comment except the first */}
                {index > 0 && <View style={styles.commentDivider} />}

                <View style={styles.commentCard}>
                  <View style={styles.commentContainer}>
                    {/* ── COMMENT VOTE SECTION (VERTICAL) ───────────────── */}
                    <View style={styles.commentVoteSection}>
                      <TouchableOpacity
                        onPress={() => voteComment(item.id, "upvote")}
                        style={styles.voteButton}
                      >
                        <FA
                          name="arrow-up"
                          size={20}
                          color={
                            item.vote_status === "upvoted" ? "#19dee8" : "#aaa"
                          }
                        />
                      </TouchableOpacity>

                      <Text style={styles.commentVoteCount}>
                        {item.net_votes_count || 0}
                      </Text>

                      <TouchableOpacity
                        onPress={() => voteComment(item.id, "downvote")}
                        style={styles.voteButton}
                      >
                        <FA
                          name="arrow-down"
                          size={20}
                          color={
                            item.vote_status === "downvoted"
                              ? "#ff4b5c"
                              : "#aaa"
                          }
                        />
                      </TouchableOpacity>
                    </View>

                    {/* ── COMMENT BODY AND ACTION ROW ───────────────────── */}
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeader}>
                        <Image
                          source={
                            item.author?.profile_image
                              ? { uri: item.author.profile_image }
                              : require("../../../assets/default_profile_picture.png")
                          }
                          style={styles.commentAvatar}
                        />
                        <View>
                          <Text style={styles.commentUser}>
                            @{item.author?.username}
                          </Text>
                          <Text style={styles.commentTime}>
                            {formatDistanceToNow(new Date(item.created_at), {
                              addSuffix: true,
                            })}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.commentText}>{item.text}</Text>

                      {/* Single row of comment‐specific actions */}
                      <View style={styles.commentActionRow}>
                        <TouchableOpacity
                          style={styles.commentSmallAction}
                          onPress={() => toggleCommentLike(item.id)}
                        >
                          <FA
                            name="heart"
                            size={18}
                            color={
                              item.like_status === "liked" ? "#ff4b5c" : "#aaa"
                            }
                          />
                          <Text style={styles.commentActionCount}>
                            {item.likes_count || 0}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commentSmallAction}>
                          <Icon name="share-2" size={18} color="#aaa" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.commentSmallAction}>
                          <FA name="flag" size={18} color="#aaa" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={() => {
              if (commentsLoading) {
                return (
                  <ActivityIndicator
                    size="small"
                    color="#19dee8"
                    style={{ marginTop: 20 }}
                  />
                );
              }
              return <Text style={styles.noCommentsText}>No Comments Yet</Text>;
            }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: INPUT_BAR_HEIGHT + 12,
            }}
            onEndReached={() => {
              if (commentsNextPage && !commentsLoadingMore) {
                loadMoreComments();
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => {
              if (commentsLoadingMore) {
                return (
                  <ActivityIndicator
                    size="small"
                    color="#19dee8"
                    style={{ marginVertical: 12 }}
                  />
                );
              }
              return null;
            }}
          />
        </View>

        {/* 2) Input bar at bottom */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            value={commentText}
            onChangeText={setCommentText}
            style={styles.input}
            placeholder="Add a comment…"
            placeholderTextColor="#888"
            multiline
            blurOnSubmit={false}
            onSubmitEditing={() => {
              if (commentText.trim()) addComment();
            }}
          />
          <TouchableOpacity
            onPress={addComment}
            style={[styles.sendBtn, !commentText.trim() && { opacity: 0.5 }]}
            disabled={!commentText.trim()}
          >
            <Icon name="send" size={22} color="#19dee8" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

export default function PostDetailPage() {
  const { postId, origin } = useLocalSearchParams<{
    postId: string;
    origin?: string;
  }>();

  return (
    <ExpandPostProvider postId={postId}>
      <PostDetailInner origin={origin} />
    </ExpandPostProvider>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    minHeight: 260,
    backgroundColor: "#191b1f",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },

  /* HEADER / BANNER STYLES */
  headerWrap: {
    backgroundColor: "rgba(13, 13, 13, 0.41)",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  backBtn: {
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  repostBanner: {
    backgroundColor: "rgba(127,255,0,0.1)",
  },
  quoteBanner: {
    backgroundColor: "rgba(28,202,255,0.1)",
  },
  bannerText: {
    marginLeft: 6,
    color: "#fff",
    fontWeight: "600",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#222",
    marginRight: 12,
  },
  username: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },
  time: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 2,
  },

  /* QUOTE BLOCK STYLES */
  quoteBlock: {
    backgroundColor: "rgba(59, 61, 65, 0.119)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#1ccaff",
  },
  quoteMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  quoteAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#252d38",
    marginRight: 8,
  },
  quoteUsername: {
    color: "#c8c8c8",
    fontWeight: "500",
    marginRight: 6,
  },
  quoteDate: {
    color: "#898989",
    fontSize: 12,
    fontStyle: "italic",
  },
  quoteText: {
    color: "#dcdcdc",
    fontStyle: "italic",
    marginLeft: 5,
  },

  /* MEDIA CAROUSEL */
  media: {
    marginBottom: 10,
    alignSelf: "center",
    backgroundColor: "#181a21",
    overflow: "hidden",
    borderRadius: 14,
    width: IMAGE_CONTAINER_WIDTH,
    height: IMAGE_CONTAINER_HEIGHT,
  },
  dots: {
    flexDirection: "row",
    alignSelf: "center",
    position: "absolute",
    bottom: 13,
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 6,
    marginHorizontal: 2,
  },

  /* CAPTION / THREAD TEXT */
  caption: {
    color: "#eee",
    fontSize: 16,
    marginBottom: 10,
    marginTop: 2,
    lineHeight: 22,
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  /* Animated heart overlay (main post) */
  animatedHeartMain: {
    position: "absolute",
    top: IMAGE_CONTAINER_HEIGHT / 2 - 40,
    left: IMAGE_CONTAINER_WIDTH / 2 - 40,
  },

  /* ACTIONS ROW */
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#242424",
    gap: 20,
    height: 90,
  },

  /* ── VOTE SECTION (VERTICAL) ───────────────────────────────────────────── */
  voteSection: {
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  voteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    color: "rgb(0, 183, 228)",
  },
  voteCount: {
    color: "#aaa",
    fontSize: 14,
    marginVertical: 2,
  },

  /* ── MAIN POST: TWO ROWS OF ACTIONS ───────────────────────────────────── */
  mainActionGrid: {
    height: "100%",
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 4,
    marginRight: 16,
  },
  actionCount: {
    color: "#aaa",
    fontSize: 16,
    marginLeft: 4,
  },
  actionTextSmall: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 4,
  },

  /* COMMENTS HEADER */
  commentsHeader: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },

  /* COMMENTS */
  commentDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#333",
    marginHorizontal: 16,
  },
  commentCard: {
    backgroundColor: "rgba(13, 13, 13, 0.41)",
    marginHorizontal: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  commentVoteSection: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  commentVoteCount: {
    color: "#aaa",
    fontSize: 13,
    marginVertical: 2,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 4,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
    marginRight: 8,
  },
  commentUser: {
    color: "#19dee8",
    fontWeight: "bold",
    fontSize: 15,
  },
  commentTime: {
    color: "#888",
    fontSize: 13,
    marginTop: 1,
  },
  commentText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 4,
    lineHeight: 22,
  },
  commentActionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  commentSmallAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 16,
    padding: 2,
  },
  commentActionCount: {
    color: "#aaa",
    fontSize: 14,
    marginLeft: 4,
  },
  noCommentsText: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
    fontSize: 17,
  },

  /* INPUT BAR */
  inputBar: {
    height: INPUT_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#16191e",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#232232",
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    padding: 8,
    backgroundColor: "#20242b",
    borderRadius: 10,
    marginRight: 10,
    minHeight: 36,
    maxHeight: 120,
  },
  sendBtn: {
    padding: 8,
    borderRadius: 12,
  },
});
