// /screens/ExploreThreadPostCard.tsx

import React, { useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { formatDistanceToNow } from "date-fns";
import Icon from "react-native-vector-icons/Feather";
import { useRouter } from "expo-router";

export default function ThreadPostCard({ post, onPress }) {
  const router = useRouter();

  // If you need to navigate again, you can call:
  // router.push(`/posts/${post.id}`);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Image
          source={
            post.author.profile_image
              ? { uri: post.author.profile_image }
              : require("../assets/default_profile_picture.png")
          }
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{post.author.username}</Text>
          <Text style={styles.time}>
            {post.meta.created_at
              ? formatDistanceToNow(new Date(post.meta.created_at), {
                  addSuffix: true,
                })
              : ""}
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color="#888" />
      </View>

      <View style={styles.content}>
        <Text style={styles.text}>{post.content}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Icon
            name="heart"
            size={18}
            color={post.status.like_status === "liked" ? "#ff2d55" : "#888"}
          />
          <Text style={styles.statText}>{post.stats.likes_count || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon name="message-circle" size={18} color="#888" />
          <Text style={styles.statText}>{post.stats.comments_count || 0}</Text>
        </View>
        <View style={styles.statItem}>
          <Icon
            name="bookmark"
            size={18}
            color={post.bookmarked ? "#FFD700" : "#888"}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width:  Forty = 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#232323",
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  time: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    marginBottom: 8,
  },
  text: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 18,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statText: {
    color: "#ccc",
    marginLeft: 4,
    fontSize: 13,
  },
});
