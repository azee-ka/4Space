// /screens/Timeline.tsx

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { useWindowDimensions } from "react-native";
import RenderHTML from "react-native-render-html";
import Icon from "react-native-vector-icons/Feather";
import FA from "react-native-vector-icons/FontAwesome";
import { formatDistanceToNow } from "date-fns";
import {
  ExpandPostProvider,
  useExpandPostContext,
} from "../../../context/expandPostContext";
import { useRouter } from "expo-router";
import useApi from "../../../hooks/useApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_HORIZONTAL_MARGIN = 8;
const CARD_WIDTH = SCREEN_WIDTH - CARD_HORIZONTAL_MARGIN * 2;
const MEDIA_HEIGHT = Math.round(CARD_WIDTH * 0.75);
const AVATAR_SIZE = 48;

function TimelinePostCard({ onPressDetails }: { onPressDetails: () => void }) {
  const {
    post,
    currentMediaIndex,
    setCurrentMediaIndex,
    toggleLikeDislike,
    toggleBookmark,
    postBookmarked,
    commentText,
    setCommentText,
    addComment,
    votePost,
  } = useExpandPostContext();
  const { callApi } = useApi();

  // Detect Repost / Quote
  const isRepost = Boolean(post.is_repost && post.parent_post);
  const isQuote = Boolean(post.parent_post && post.quote_text);

  // Determine effective author & content
  const effectiveAuthor = isRepost
    ? post.parent_post.author
    : isQuote
    ? post.parent_post.author
    : post.author;

  const effectivePostObject = isRepost
    ? post.parent_post.post
    : isQuote
    ? post.parent_post.post
    : post.post;

  // Unwrap post_type if repost/quote
  const effectiveType =
    isRepost || isQuote ? post.parent_post.post_type : post.post_type;

  const isThread = effectiveType === "Thread";

  // Media files only if not a Thread
  const mediaFiles = isThread
    ? []
    : isRepost || isQuote
    ? post.parent_post.post.media_files || []
    : post.media_files || post.post?.media_files || [];

  const mediaIndex = currentMediaIndex ?? 0;
  const flatListRef = React.useRef<FlatList<any>>(null);

  // Double‐tap to like animation
  const lastTap = React.useRef<number | null>(null);
  const [heartAnim] = useState(new Animated.Value(0));

  const handleDoubleTap = () => {
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
      Animated.delay(500),
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

  // Decide what text to show
  const textContent = isThread
    ? effectivePostObject?.content || ""
    : effectivePostObject?.caption || post.caption || post.content || "";

  // We'll need dimensions for RenderHTML
  const { width: contentWidth } = useWindowDimensions();

  // Report Handler
  const reportPost = async () => {
    try {
      await callApi(`posts/post/${post.id}/report/`, "POST", {});
      Alert.alert("Reported", "Thank you for your feedback.");
    } catch (e) {
      console.error("Error reporting post", e);
      Alert.alert("Error", "Could not submit report.");
    }
  };

  return (
    <View style={styles.postCard}>
      {/* Repost / Quote Banner */}
      {isRepost && post.parent_post && (
        <TouchableOpacity
          style={[styles.banner, styles.repostBanner]}
          onPress={() => onPressDetails?.()}
        >
          <Icon name="repeat" size={14} color="#7fff00" />
          <Text style={styles.bannerText}>Repost</Text>
        </TouchableOpacity>
      )}
      {isQuote && post.parent_post && (
        <TouchableOpacity
          style={[styles.banner, styles.quoteBanner]}
          onPress={() => onPressDetails?.()}
        >
          <FA name="quote-left" size={20} color="#1ccaff" />
          <Text style={styles.bannerText}>Quote</Text>
        </TouchableOpacity>
      )}

      {/* Header (author + time) */}
      <View style={styles.postHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={
              effectiveAuthor?.profile_image
                ? { uri: effectiveAuthor.profile_image }
                : require("../../../assets/default_profile_picture.png")
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
        <TouchableOpacity onPress={onPressDetails} style={styles.detailsBtn}>
          <Icon name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Quoted Snippet */}
      {isQuote && post.parent_post && (
        <TouchableOpacity
          style={styles.quoteBlockSmall}
          onPress={() => onPressDetails?.()}
          activeOpacity={0.8}
        >
          <View style={styles.quoteMetaSmall}>
            <Image
              source={
                post.parent_post.author.profile_image
                  ? { uri: post.parent_post.author.profile_image }
                  : require("../../../assets/default_profile_picture.png")
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

      {/* Media Carousel (if not Thread) */}
      {mediaFiles.length > 0 && (
        <View style={styles.mediaWrapper}>
          <FlatList
            data={mediaFiles}
            ref={flatListRef}
            horizontal
            pagingEnabled
            snapToInterval={CARD_WIDTH}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <TouchableWithoutFeedback onPress={handleDoubleTap}>
                <View style={{ width: CARD_WIDTH }}>
                  <Image
                    source={{ uri: item.file || item.url }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                  />
                  <Animated.View
                    style={[
                      styles.animatedHeart,
                      {
                        opacity: heartOpacity,
                        transform: [{ scale: heartScale }],
                      },
                    ]}
                  >
                    <Icon
                      name="heart"
                      size={80}
                      color="rgba(255, 45, 83, 0.92)"
                    />
                  </Animated.View>
                </View>
              </TouchableWithoutFeedback>
            )}
            onScroll={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / CARD_WIDTH
              );
              setCurrentMediaIndex?.(idx);
            }}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: CARD_WIDTH,
              offset: CARD_WIDTH * index,
              index,
            })}
            style={{ width: CARD_WIDTH, height: MEDIA_HEIGHT }}
          />
          {mediaFiles.length > 1 && (
            <View style={styles.dotsContainer}>
              {mediaFiles.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === mediaIndex ? "#19dee8" : "#555",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Caption / Thread Content */}
      {Boolean(textContent) && (
        <View style={styles.postContent}>
          <RenderHTML
            contentWidth={contentWidth - CARD_HORIZONTAL_MARGIN * 2}
            source={{ html: textContent || "<p></p>" }}
            baseStyle={styles.postText}
            tagsStyles={{
              p: { marginBottom: 6 },
              strong: { fontWeight: "bold" },
              em: { fontStyle: "italic" },
              a: { color: "#19dee8", textDecorationLine: "underline" },
            }}
          />
        </View>
      )}

      {/* Interaction Row (under content/media) */}
      <View style={styles.interactionRow}>
        {/* Left: Vertical Vote Buttons */}
        <View style={styles.votePanel}>
          <TouchableOpacity
            onPress={() => votePost("upvote")}
            style={styles.voteBtn}
          >
            <FA
              name="arrow-up"
              size={20}
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
              size={20}
              color={
                post.status?.vote_status === "downvoted" ? "#ff4b5c" : "#888"
              }
            />
          </TouchableOpacity>
        </View>

        {/* Right: Two Rows – Actions & Comment Input */}
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

            <TouchableOpacity onPress={onPressDetails} style={styles.actionBtn}>
              <Icon name="message-circle" size={22} color="#888" />
              <Text style={styles.actionText}>
                {post.stats?.comments_count || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleBookmark} style={styles.actionBtn}>
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
              onSubmitEditing={() => {
                addComment();
              }}
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
    </View>
  );
}

export default function Timeline() {
  const router = useRouter();
  const { callApi } = useApi();

  const [posts, setPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState<"All" | "Thread" | "Visual">("All");
  const filters: Array<"All" | "Thread" | "Visual"> = [
    "All",
    "Thread",
    "Visual",
  ];

  const pageRef = useRef<number>(0);

  const fetchPosts = useCallback(
  async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const limit = 10;
      const offset = reset ? 0 : pageRef.current * limit;
      const baseUrl = "posts/timeline/get-posts/";
      const qs =
        filter === "All"
          ? `?limit=${limit}&offset=${offset}`
          : `?post_type=${filter}&limit=${limit}&offset=${offset}`;
      const resp = await callApi(`${baseUrl}${qs}`);
      const data = resp.data; // { results: [...], next: "...", ... }

      if (reset) {
        setPosts(data.results);
        pageRef.current = 1;
      } else {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          // Filter out any duplicates from the new page
          const newResults = data.results.filter((r) => !existingIds.has(r.id));
          return [...prev, ...newResults];
        });
        pageRef.current += 1;
      }
      setHasMore(!!data.next);
    } catch (e) {
      console.error("Error fetching posts", e);
    } finally {
      setLoading(false);
    }
  },
  [loading, filter]
);

  // Whenever `filter` changes, reset page counter and re‐fetch
  useEffect(() => {
    pageRef.current = 0;
    fetchPosts(true);
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    pageRef.current = 0;
    await fetchPosts(true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(false);
    }
  };

  // Client‐side: only show posts where p.post_type matches the filter
  const filteredPosts = posts.filter((p) => {
    if (filter === "All") return true;
    return p.post_type === filter;
  });

  const showingLoader = loading && posts.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#121212" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.container}>
        {/* Header + Filters */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Timeline</Text>
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterPill,
                  filter === f && styles.filterPillActive,
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f && styles.filterTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feed */}
        {showingLoader ? (
          <ActivityIndicator
            size="large"
            color="#19dee8"
            style={{ marginTop: 80 }}
          />
        ) : posts.length > 0 ? (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <ExpandPostProvider postId={item.id} postData={item}>
                <TimelinePostCard
                  onPressDetails={() => router.push(`timeline/${item.id}`)}
                />
              </ExpandPostProvider>
            )}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#19dee8"
              />
            }
            ListFooterComponent={
              loading && filteredPosts.length > 0 ? (
                <ActivityIndicator
                  size="small"
                  color="#19dee8"
                  style={{ marginVertical: 16 }}
                />
              ) : null
            }
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <View style={styles.noPosts}>
            <Icon
              name="frown"
              size={48}
              color="rgba(255,255,255,0.3)"
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.noPostsText}>
              No posts found. Check back later.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  // Header & Filters
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#121212",
  },
  headerTitle: {
    color: "#19dee8",
    fontSize: 24,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(25,222,232,0.08)",
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: "#19dee8",
  },
  filterText: {
    color: "#EEE",
    fontSize: 15,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#121212",
    fontWeight: "700",
  },

  // No Posts Placeholder
  noPosts: {
    marginTop: 100,
    alignItems: "center",
  },
  noPostsText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 18,
  },

  // POST CARD
  postCard: {
    backgroundColor: "#1a1a1a",
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

  // Media + Dots
  mediaWrapper: {
    position: "relative",
  },
  mediaImage: {
    width: CARD_WIDTH,
    height: MEDIA_HEIGHT,
    backgroundColor: "#000",
  },
  dotsContainer: {
    position: "absolute",
    bottom: 6,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  animatedHeart: {
    position: "absolute",
    top: MEDIA_HEIGHT / 2 - 40,
    left: CARD_WIDTH / 2 - 40,
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

  // Interaction Row (under content/media)
  interactionRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: CARD_HORIZONTAL_MARGIN,
    paddingTop: 0,
    padding: 0,
    alignItems: "flex-start",
    // backgroundColor: 'green',
    height: 95,
  },

  // Left: Vertical Vote Panel
  votePanel: {
    width: 35,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0, // added small top padding so arrows align with actions
    // backgroundColor: 'red',
  },
  voteBtn: {
    paddingVertical: 4,
  },
  voteCount: {
    color: "#ccc",
    fontSize: 14,
    marginVertical: 2, // tighten up count spacing
    fontWeight: "500",
  },

  // Right: Two-row panel
  rightPanel: {
    flex: 1,
    height: "100%",
    // backgroundColor: 'blue',
    flexDirection: "column",
    gap: 4,
    paddingTop: 14,
  },

  // Row 1: Action Buttons
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4, // reduced gap before comment row
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12, // tightened spacing between icons
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

  // Row 2: Comment Input
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4, // slight gap after action row
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
});
