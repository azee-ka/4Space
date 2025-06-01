import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Image, TouchableOpacity, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import { formatDistanceToNow } from 'date-fns';
import fetchWithAuth from '../../../utils/fetchWithAuth'
import { useAuth } from '../../../hooks/useAuth';

export default function PostDetail() {
  const { authState } = useAuth();
  const { postId } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [currentMedia, setCurrentMedia] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchWithAuth(`posts/${postId}/`, { method: 'GET', authState }
      )
      .then(resp => isMounted && setPost(resp.data))
      .catch(() => isMounted && setPost(null))
      .finally(() => isMounted && setLoading(false));
    return () => { isMounted = false; };
  }, [postId]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 80 }} />;

  if (!post) return (
    <View style={{ flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#aaa', fontSize: 20 }}>Post not found.</Text>
    </View>
  );

  // Media array support
  const media = post.media_files || post.post?.media_files || [];
  const width = Dimensions.get('window').width;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#121212' }}>
      <View style={styles.card}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-left" size={28} color="#19dee8" />
        </TouchableOpacity>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            {post.author?.profile_image && (
              <Image source={{ uri: post.author.profile_image }} style={styles.avatarImg} />
            )}
          </View>
          <View>
            <Text style={styles.username}>@{post.author?.username}</Text>
            <Text style={styles.time}>
              {post.meta?.created_at ? formatDistanceToNow(new Date(post.meta.created_at), { addSuffix: true }) : ''}
            </Text>
          </View>
        </View>

        {/* Media Carousel */}
        {media.length > 0 && (
          <View style={[styles.media, { width, height: width * 0.8 }]}>
            <Image
              source={{ uri: media[currentMedia]?.url || media[currentMedia] }}
              style={{ width: '100%', height: '100%', borderRadius: 15 }}
              resizeMode="cover"
            />
            {media.length > 1 && (
              <View style={styles.mediaNav}>
                <TouchableOpacity
                  disabled={currentMedia === 0}
                  onPress={() => setCurrentMedia(idx => Math.max(0, idx - 1))}
                  style={styles.mediaNavBtn}
                >
                  <Icon name="chevron-left" size={30} color={currentMedia === 0 ? '#444' : '#19dee8'} />
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={currentMedia === media.length - 1}
                  onPress={() => setCurrentMedia(idx => Math.min(media.length - 1, idx + 1))}
                  style={styles.mediaNavBtn}
                >
                  <Icon name="chevron-right" size={30} color={currentMedia === media.length - 1 ? '#444' : '#19dee8'} />
                </TouchableOpacity>
              </View>
            )}
            {media.length > 1 && (
              <View style={styles.dots}>
                {media.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      { backgroundColor: currentMedia === i ? '#19dee8' : '#555' }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <Text style={styles.text}>{post.caption || post.content}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Icon name="message-circle" size={18} color="#aaa" /><Text style={styles.statText}>{post.stats?.comments_count || 0}</Text></View>
          <View style={styles.stat}><Icon name="heart" size={18} color="#aaa" /><Text style={styles.statText}>{post.stats?.likes_count || 0}</Text></View>
          <View style={styles.stat}><Icon name="repeat" size={18} color="#aaa" /><Text style={styles.statText}>{post.stats?.reposts_count || 0}</Text></View>
        </View>

        {/* You can add comments, actions, etc here */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, paddingTop: 0, backgroundColor: '#18181b', borderBottomLeftRadius: 18, borderBottomRightRadius: 18, minHeight: 600, marginBottom: 24 },
  backBtn: { marginTop: 40, marginBottom: 16, alignSelf: 'flex-start' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#222', marginRight: 11, overflow: 'hidden' },
  avatarImg: { width: 52, height: 52, borderRadius: 26, resizeMode: 'cover' },
  username: { color: '#fff', fontWeight: 'bold', fontSize: 19 },
  time: { color: '#aaa', fontSize: 14, marginTop: 3 },
  media: { marginBottom: 18, alignSelf: 'center', borderRadius: 15, backgroundColor: '#222', overflow: 'hidden' },
  mediaNav: { position: 'absolute', top: '42%', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  mediaNavBtn: { backgroundColor: 'rgba(25,222,232,0.13)', borderRadius: 20, padding: 3 },
  dots: { flexDirection: 'row', alignSelf: 'center', marginTop: 7, gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 6, marginHorizontal: 2 },
  text: { color: '#eee', fontSize: 18, marginBottom: 14, marginTop: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 19, marginTop: 12, marginBottom: 18 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: '#aaa', fontSize: 16, marginLeft: 2 }
});
