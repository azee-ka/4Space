// app/(tabs)/explore/[postId].tsx

import React, { useRef } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Feather";
import { formatDistanceToNow } from "date-fns";
import {
  ExpandPostProvider,
  useExpandPostContext,
} from "../../../context/expandPostContext";

const { width } = Dimensions.get("window");
const INPUT_BAR_HEIGHT = 56;

function PostHeader({ origin }: { origin: string | undefined }) {
  const router = useRouter();
  const {
    post,
    currentMediaIndex,
    setCurrentMediaIndex,
    toggleLikeDislike,
    toggleBookmark,
    postBookmarked,
  } = useExpandPostContext();

  const flatListRef = useRef();

  if (!post) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#19dee8" />
      </View>
    );
  }

  const media = post.media_files || post.post?.media_files || [];
  const mediaIndex = currentMediaIndex ?? 0;

  const handleScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentMediaIndex?.(idx);
  };

  return (
    <View style={styles.headerWrap}>
      {/* ← BACK BUTTON */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backBtn}
      >
        <Icon name="arrow-left" size={28} color="#19dee8" />
      </TouchableOpacity>

      {/* USER + TIME */}
      <View style={styles.headerRow}>
        <Image
          source={
            post.author?.profile_image
              ? { uri: post.author.profile_image }
              : require("../../../assets/default_profile_picture.png")
          }
          style={styles.avatar}
        />
        <View>
          <Text style={styles.username}>@{post.author?.username}</Text>
          <Text style={styles.time}>
            {post.meta?.created_at
              ? formatDistanceToNow(new Date(post.meta.created_at), {
                  addSuffix: true,
                })
              : ""}
          </Text>
        </View>
      </View>

      {/* MEDIA CAROUSEL */}
      {media.length > 0 && (
        <View style={styles.media}>
          <FlatList
            ref={flatListRef as any}
            data={media}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.file || item.url || item }}
                style={styles.mediaImage}
                resizeMode="cover"
              />
            )}
            onMomentumScrollEnd={handleScroll}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            initialScrollIndex={mediaIndex}
          />
          {media.length > 1 && (
            <View style={styles.dots}>
              {media.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        mediaIndex === i ? "#19dee8" : "#444",
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* CAPTION */}
      <Text style={styles.caption}>{post.caption || post.content}</Text>

      {/* ACTIONS ROW */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.action}
          onPress={() => toggleLikeDislike("like")}
        >
          <Icon
            name="heart"
            size={22}
            color={
              post.status?.like_status === "liked" ? "#19dee8" : "#aaa"
            }
          />
          <Text style={styles.actionText}>
            {post.stats?.likes_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action}>
          <Icon name="message-circle" size={22} color="#aaa" />
          <Text style={styles.actionText}>
            {post.stats?.comments_count || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={toggleBookmark}>
          <Icon
            name="bookmark"
            size={22}
            color={postBookmarked ? "#19dee8" : "#aaa"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PostDetailInner({ origin }: { origin: string | undefined }) {
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
  } = useExpandPostContext();

  const inputRef = useRef<TextInput>(null);

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#111317" }}>
        <ActivityIndicator size="large" color="#19dee8" />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: "#111317" }}>
        {/* 1) Fillable FlatList for comments */}
        <View style={{ flex: 1 }}>
          <FlatList
            ListHeaderComponent={<PostHeader origin={origin} />}
            data={comments}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={styles.commentRow}>
                <Image
                  source={
                    item.author?.profile_image
                      ? { uri: item.author.profile_image }
                      : require("../../../assets/default_profile_picture.png")
                  }
                  style={styles.commentAvatar}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>
                      @{item.author?.username}
                    </Text>
                    <Text style={styles.commentTime}>
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{item.text}</Text>
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
              return (
                <Text style={styles.noCommentsText}>No Comments Yet</Text>
              );
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

        {/* 2) Input bar (non‐absolute) */}
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
  // read both postId and “origin” from the URL
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
  headerWrap: {
    backgroundColor: "#181a1f",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  backBtn: {
    marginBottom: 12,
    alignSelf: "flex-start",
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
  username: { color: "#fff", fontWeight: "bold", fontSize: 17 },
  time: { color: "#aaa", fontSize: 13, marginTop: 2 },
  media: {
    marginBottom: 10,
    alignSelf: "center",
    backgroundColor: "#181a21",
    overflow: "hidden",
    borderRadius: 14,
    width: width * 0.96,
    height: width * 0.7,
  },
  mediaImage: {
    width: width * 0.96,
    height: width * 0.7,
    borderRadius: 14,
    backgroundColor: "#222",
  },
  dots: {
    flexDirection: "row",
    alignSelf: "center",
    position: "absolute",
    bottom: 13,
    gap: 7,
  },
  dot: { width: 7, height: 7, borderRadius: 6, marginHorizontal: 2 },
  caption: {
    color: "#eee",
    fontSize: 16,
    marginBottom: 10,
    marginTop: 2,
    lineHeight: 22,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
    marginTop: 12,
    marginBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#242424",
    paddingTop: 10,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 12,
    padding: 2,
  },
  actionText: { color: "#aaa", fontSize: 16, marginLeft: 2 },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 18,
    marginVertical: 12,
    gap: 12,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#222",
    marginTop: 3,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 2,
  },
  commentUser: { color: "#19dee8", fontWeight: "bold", fontSize: 15 },
  commentTime: { color: "#888", fontSize: 13, marginTop: 1 },
  commentText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 2,
    lineHeight: 21,
  },
  noCommentsText: {
    color: "#888",
    textAlign: "center",
    marginTop: 40,
    fontSize: 17,
  },

  // ── INPUT BAR ───────────────────────────────────────────────────────────
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
