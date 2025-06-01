import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
// import useApi from '../../../utils/useApi';
import Icon from 'react-native-vector-icons/Feather';
import { formatDistanceToNow } from 'date-fns';
import { ExpandPostProvider } from '../../../context/expandPostContext';
import { useAuth } from '@/hooks/useAuth';
import fetchWithAuth from '../../../utils/fetchWithAuth'

function TimelinePostCard({ post, onPress }) {
  // Show first media as preview (if any)
  const imgUri = post.media_files?.[0]?.url || post.post?.media_files?.[0]?.url || undefined;
  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          {post.author?.profile_image && (
            <Image source={{ uri: post.author.profile_image }} style={styles.avatarImg} />
          )}
        </View>
        <View style={styles.userBlock}>
          <Text style={styles.username}>@{post.author?.username}</Text>
          <Text style={styles.time}>
            {post.meta?.created_at ? formatDistanceToNow(new Date(post.meta.created_at), { addSuffix: true }) : ''}
          </Text>
        </View>
      </View>
      {/* Media preview if exists */}
      {imgUri && (
        <Image source={{ uri: imgUri }} style={styles.mediaPreview} resizeMode="cover" />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postText} numberOfLines={imgUri ? 3 : 6}>
          {post.caption || post.content}
        </Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}><Icon name="message-circle" size={16} color="#aaa" /><Text style={styles.statText}>{post.stats?.comments_count || 0}</Text></View>
        <View style={styles.stat}><Icon name="heart" size={16} color="#aaa" /><Text style={styles.statText}>{post.stats?.likes_count || 0}</Text></View>
        <View style={styles.stat}><Icon name="repeat" size={16} color="#aaa" /><Text style={styles.statText}>{post.stats?.reposts_count || 0}</Text></View>
      </View>
    </TouchableOpacity>
  );
}

export default function Timeline() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Thread', 'Visual'];

  const { authState } = useAuth();

  const fetchPosts = useCallback(async (pageNum = 0, reset = false) => {
    setLoading(true);
    try {
      const limit = 20;
      const offset = pageNum * limit;
      const data = await fetchWithAuth(`posts/timeline/get-posts/?limit=${limit}&offset=${offset}`,
        { method: 'GET', authState }
      );
      // console.log('data', data);
      setPosts(reset ? data.results : [...posts, ...data.results]);
      setHasMore(!!data.next);
      setPage(pageNum);
    } catch (e) {
      // Optionally handle error
      console.error('Error fetching posts', e);
    } finally {
      setLoading(false);
    }
  }, [posts]);

  useEffect(() => {
    fetchPosts(0, true);
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(0, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) fetchPosts(page + 1);
  };

  const filteredPosts = posts.filter(post => filter === 'All' || post.post_type === filter);

  // console.log('filteredPosts', filteredPosts, 'posts', posts);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <View style={styles.filterRow}>
          {filters.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterActiveText]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {loading && posts.length === 0 ? (
        <ActivityIndicator size="large" color="#19dee8" style={{ marginTop: 70 }} />
      ) : filteredPosts.length > 0 ? (
        <FlatList
          data={filteredPosts}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <ExpandPostProvider postId={item.id} postData={item}>
      <TimelinePostCard
        post={item}
        onPress={() => router.push(`/timeline/${item.id}`)}
        // ...now can use context inside card if you want!
      />
    </ExpandPostProvider>
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#19dee8" />
          }
          ListFooterComponent={loading ? <ActivityIndicator size="small" /> : null}
          contentContainerStyle={{ paddingBottom: 30, paddingTop: 8 }}
        />
      ) : (
        <View style={styles.noPosts}>
          <Icon name="image" size={36} color="#555" style={{ marginBottom: 5 }} />
          <Text style={{ color: '#aaa', fontSize: 18 }}>No more posts. You’re caught up!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101013', paddingHorizontal: 0, paddingTop: 2 },
  header: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 2 },
  title: { fontSize: 28, color: '#19dee8', fontWeight: 'bold', marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18, backgroundColor: 'rgba(25,222,232,0.03)' },
  filterActive: { backgroundColor: '#19dee8' },
  filterText: { color: '#fff', fontSize: 16 },
  filterActiveText: { color: '#101013', fontWeight: 'bold', textDecorationLine: 'none' },
  noPosts: { marginTop: 80, alignItems: 'center' },
  postCard: {
    marginVertical: 7,
    marginHorizontal: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#19191d',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222', marginRight: 12, overflow: 'hidden' },
  avatarImg: { width: 44, height: 44, borderRadius: 22, resizeMode: 'cover' },
  userBlock: { flexDirection: 'column', flex: 1 },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  time: { color: '#aaa', fontSize: 13, marginTop: 2 },
  mediaPreview: { width: '100%', height: 200, borderRadius: 10, marginBottom: 8, backgroundColor: '#18181b' },
  postContent: { marginVertical: 6 },
  postText: { color: '#eee', fontSize: 17, lineHeight: 23 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { color: '#aaa', marginLeft: 3, fontSize: 15 },
});
