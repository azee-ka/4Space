// /screens/Explore.tsx

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import MasonryList from "@react-native-seoul/masonry-list";
import { useRouter } from "expo-router";
import useApi from "../../../hooks/useApi";
import ExploreVisualPostCard from "../../../components/ExploreVisualPostCard";
import ExploreThreadPostCard from "../../../components/ExploreThreadPostCard";
import { ExpandPostProvider } from "../../../context/expandPostContext";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;

const TAB_OPTIONS = [
  { key: "visual", label: "Visual" },
  { key: "thread", label: "Thread" },
];

export default function Explore() {
  const router = useRouter();
  const { callApi } = useApi();

  const [activeTab, setActiveTab] = useState<"visual" | "thread">("visual");

  // ─── Visual tab state ────────────────────────────────────────────────────────
  const [visualPosts, setVisualPosts] = useState<any[]>([]);
  const [visualPage, setVisualPage] = useState(0);
  const [visualHasMore, setVisualHasMore] = useState(true);
  const [visualLoading, setVisualLoading] = useState(false);
  const [visualRefreshing, setVisualRefreshing] = useState(false);

  // ─── Thread tab state ────────────────────────────────────────────────────────
  const [threadPosts, setThreadPosts] = useState<any[]>([]);
  const [threadPage, setThreadPage] = useState(0);
  const [threadHasMore, setThreadHasMore] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadRefreshing, setThreadRefreshing] = useState(false);

  // ─── Fetch Visual Posts ──────────────────────────────────────────────────────
  const fetchVisualPosts = useCallback(
    async (reset = false) => {
      if (visualLoading) return;
      setVisualLoading(true);

      try {
        const limit = 20;
        const offset = reset ? 0 : visualPage * limit;

        // callApi returns AxiosResponse<{ results: any[]; next: string | null; ... }>
        const resp = await callApi(
          `posts/explore/get-posts/?post_type=Visual&limit=${limit}&offset=${offset}`
        );

        const data = resp.data; // { results: [...], next: "...", previous: "...", count: number }

        if (reset) {
          setVisualPosts(data.results);
          setVisualPage(1);
        } else {
          setVisualPosts((prev) => [...prev, ...data.results]);
          setVisualPage((prev) => prev + 1);
        }
        setVisualHasMore(!!data.next);
      } catch (e) {
        console.error("Error fetching visual posts", e);
      } finally {
        setVisualLoading(false);
      }
    },
    [visualLoading, visualPage]
  );

  // ─── Fetch Thread Posts ──────────────────────────────────────────────────────
  const fetchThreadPosts = useCallback(
    async (reset = false) => {
      if (threadLoading) return;
      setThreadLoading(true);

      try {
        const limit = 20;
        const offset = reset ? 0 : threadPage * limit;

        const resp = await callApi(
          `posts/explore/get-posts/?post_type=Thread&limit=${limit}&offset=${offset}`
        );
        console.log('resp', resp)
        const data = resp.data; // { results: [...], next: "...", previous: "...", count: number }

        if (reset) {
          setThreadPosts(data.results);
          setThreadPage(1);
        } else {
          setThreadPosts((prev) => [...prev, ...data.results]);
          setThreadPage((prev) => prev + 1);
        }
        setThreadHasMore(!!data.next);
      } catch (e) {
        console.error("Error fetching thread posts", e);
      } finally {
        setThreadLoading(false);
      }
    },
    [threadLoading, threadPage]
  );

  // ─── When the active tab flips, reset and reload that tab ────────────────────
  useEffect(() => {
    if (activeTab === "visual") {
      setVisualPage(0);
      setVisualHasMore(true);
      fetchVisualPosts(true);
    } else {
      setThreadPage(0);
      setThreadHasMore(true);
      fetchThreadPosts(true);
    }
  }, [activeTab]);

  // ─── Pull‐to‐refresh handlers ─────────────────────────────────────────────────
  const onRefreshVisual = async () => {
    setVisualRefreshing(true);
    setVisualPage(0);
    await fetchVisualPosts(true);
    setVisualRefreshing(false);
  };
  const onRefreshThread = async () => {
    setThreadRefreshing(true);
    setThreadPage(0);
    await fetchThreadPosts(true);
    setThreadRefreshing(false);
  };

  // ─── Infinite scroll handlers ────────────────────────────────────────────────
  const loadMoreVisual = () => {
    if (!visualLoading && visualHasMore) {
      fetchVisualPosts(false);
    }
  };
  const loadMoreThread = () => {
    if (!threadLoading && threadHasMore) {
      fetchThreadPosts(false);
    }
  };

  // ─── Navigation on tap ───────────────────────────────────────────────────────
  const handleVisualPress = (post: any) => {
    router.push(`explore/${post.id}?origin=explore`);
  };
  const handleThreadPress = (post: any) => {
    router.push(`explore/${post.id}?origin=explore`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ─── Header + Tab Buttons ────────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={styles.tabRow}>
          {TAB_OPTIONS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab.key as "visual" | "thread")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── Content Area ──────────────────────────────────────────────────────── */}
      {activeTab === "visual" ? (
        // If we’re still loading the very first “page” of visual posts:
        visualLoading && visualPosts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#19dee8" />
          </View>
        ) : visualPosts.length === 0 ? (
          // No visual posts at all:
          <View style={styles.noPostsContainer}>
            <Text style={styles.noPostsText}>No Visual Posts</Text>
          </View>
        ) : (
          // Show Masonry grid of “Visual” posts
          <MasonryList
            data={visualPosts}
            keyExtractor={(item) => item.id.toString()}
            numColumns={NUM_COLUMNS}
            spacing={16}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMoreVisual}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.masonryContent}
            refreshControl={
              <RefreshControl
                refreshing={visualRefreshing}
                onRefresh={onRefreshVisual}
                tintColor="#19dee8"
              />
            }
            renderItem={({ item }) => (
              <ExploreVisualPostCard
                post={item}
                onClick={() => handleVisualPress(item)}
              />
            )}
          />
        )
      ) : // ───────────────────────────────────────────────────────────────────
      // THREAD tab chosen:
      threadLoading && threadPosts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#19dee8" />
        </View>
      ) : threadPosts.length === 0 ? (
        <View style={styles.noPostsContainer}>
          <Text style={styles.noPostsText}>No Thread Posts</Text>
        </View>
      ) : (
        <FlatList
          data={threadPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
    <ExpandPostProvider postId={item.id} postData={item}>
      <ExploreThreadPostCard onPress={() => handleThreadPress(item)} />
    </ExpandPostProvider>
  )}
          onEndReached={loadMoreThread}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={threadRefreshing}
              onRefresh={onRefreshThread}
              tintColor="#19dee8"
            />
          }
          ListFooterComponent={
            threadLoading ? (
              <ActivityIndicator
                size="small"
                color="#19dee8"
                style={{ marginVertical: 12 }}
              />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#121212",
    backgroundColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    // backgroundColor: "#121212",
    backgroundColor: "#000",
  },
  headerTitle: {
    color: "#19dee8",
    fontSize: 24,
    fontWeight: "700",
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(25,222,232,0.08)",
    marginLeft: 8,
  },
  tabButtonActive: {
    backgroundColor: "#19dee8",
  },
  tabText: {
    color: "#EEE",
    fontSize: 15,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#121212",
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPostsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPostsText: {
    color: "#b5dbe7",
    fontSize: 16,
  },
  masonryContent: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 20,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 20,
  },
});
