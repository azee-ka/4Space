import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { formatDistanceToNow } from "date-fns";
import { useExpandPostContext } from "../../../context/expandPostContext";

function CommentItem({
  comment,
  onLike,
  onVote,
  onReply,
  replying,
  setReplyText,
  replyText,
}) {
  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <Image
          source={{ uri: comment.author?.profile_image }}
          style={styles.commentAvatar}
        />
        <View>
          <Text style={styles.commentUsername}>@{comment.author?.username}</Text>
          <Text style={styles.commentTime}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </Text>
        </View>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity onPress={() => onLike(comment.id)} style={styles.commentActionBtn}>
          <Icon
            name="heart"
            size={16}
            color={comment.like_status === "liked" ? "#19dee8" : "#aaa"}
          />
          <Text style={styles.commentActionText}>{comment.likes_count || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onVote(comment.id, "upvote")} style={styles.commentActionBtn}>
          <Icon
            name="arrow-up"
            size={16}
            color={comment.vote_status === "upvoted" ? "#19dee8" : "#aaa"}
          />
        </TouchableOpacity>
        <Text style={styles.commentActionText}>{comment.net_votes_count || 0}</Text>
        <TouchableOpacity onPress={() => onVote(comment.id, "downvote")} style={styles.commentActionBtn}>
          <Icon
            name="arrow-down"
            size={16}
            color={comment.vote_status === "downvoted" ? "#19dee8" : "#aaa"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onReply(comment.id)} style={styles.commentActionBtn}>
          <Icon name="corner-up-right" size={16} color="#aaa" />
          <Text style={styles.commentActionText}>Reply</Text>
        </TouchableOpacity>
      </View>
      {replying === comment.id && (
        <View style={{ marginLeft: 40, marginTop: 5 }}>
          <TextInput
            value={replyText}
            onChangeText={setReplyText}
            style={styles.replyInput}
            placeholder="Reply..."
            placeholderTextColor="#888"
            multiline
          />
          <TouchableOpacity
            onPress={() => onReply(comment.id, true)}
            style={styles.replySendBtn}
          >
            <Icon name="send" size={18} color="#19dee8" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function CommentsList() {
  const {
    comments,
    commentsLoading,
    toggleCommentLike,
    voteComment,
    replyToComment,
    commentReplyText,
    setCommentReplyText,
  } = useExpandPostContext();

  const [replying, setReplying] = React.useState(null);

  const handleReply = (commentId, send = false) => {
    if (send) {
      replyToComment(commentId);
      setReplying(null);
    } else {
      setReplying(replying === commentId ? null : commentId);
    }
  };

  return (
    <View>
      {comments.length === 0 && !commentsLoading ? (
        <Text style={styles.noCommentsText}>No Comments</Text>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => `${item.id}`}
          renderItem={({ item }) => (
            <CommentItem
              comment={item}
              onLike={toggleCommentLike}
              onVote={voteComment}
              onReply={handleReply}
              replying={replying}
              setReplyText={setCommentReplyText}
              replyText={commentReplyText}
            />
          )}
          ListFooterComponent={
            commentsLoading ? (
              <Text style={{ color: "#aaa", textAlign: "center", margin: 10 }}>Loading...</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentContainer: {
    marginVertical: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#23232b",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 10,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#333",
    marginRight: 9,
  },
  commentUsername: { color: "#19dee8", fontWeight: "bold", fontSize: 16 },
  commentTime: { color: "#888", fontSize: 12 },
  commentText: { color: "#eee", fontSize: 16, marginVertical: 4 },
  commentActions: { flexDirection: "row", gap: 12, alignItems: "center" },
  commentActionBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  commentActionText: { color: "#aaa", fontSize: 15, marginLeft: 3 },
  replyInput: {
    borderColor: "#19dee8",
    borderWidth: 1,
    borderRadius: 8,
    color: "#fff",
    padding: 8,
    marginTop: 8,
    minHeight: 36,
  },
  replySendBtn: { position: "absolute", right: 6, top: 6 },
  noCommentsText: {
    color: "#888",
    textAlign: "center",
    marginVertical: 18,
    fontSize: 16,
  },
});
