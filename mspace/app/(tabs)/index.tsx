// app/index.tsx

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // two cards per row with 16px padding on sides & 16px gap

export default function Dashboard() {
  // Weekly post activity for the bar chart
  const postsPerDay = [40, 55, 70, 85, 50, 65, 95];

  // The stat cards in the first grid
  const statCards = [
    { label: "Total Posts", value: "1,242", detail: "+12 this week", status: "positive" },
    { label: "Avg Likes/Post", value: "134", detail: "↑ from 121", status: "positive" },
    { label: "Impressions", value: "24.6k", detail: "7-day total", status: "neutral" },
    { label: "Engagement Rate", value: "72%", detail: "last 30 days", status: "positive" },
    { label: "Top Hashtag", value: "#BuildInPublic", detail: "Used 91×", status: "neutral" },
    { label: "Most Saved Post", value: "Post #1121", detail: "58 saves", status: "highlight" },
    { label: "Content Format: Images", value: "61%", detail: "dominant type", status: "neutral" },
    { label: "Video View Rate", value: "38%", detail: "on all reels", status: "neutral" },
  ];

  // Audience segments
  const audienceSegments = [
    { label: "Top Location:", value: "New York, US" },
    { label: "Most Active Hour:", value: "8–9 PM" },
    { label: "Loyal Followers:", value: "2,315" },
    { label: "Interaction Source:", value: "Shares" },
  ];

  // Most engaging posts
  const engagingPosts = [
    { icon: "💬", title: "Post #872", metric: "246 interactions" },
    { icon: "🔥", title: "Post #859", metric: "2.4k reach" },
    { icon: "📈", title: "Post #830", metric: "+19% shares" },
  ];

  // Posts needing review
  const reviewPosts = [
    { icon: "🚩", title: "Post #804", metric: "flagged 3×" },
    { icon: "⚠️", title: "Post #781", metric: "comment reported" },
    { icon: "🛑", title: "Post #773", metric: "under moderation" },
  ];

  // Quick Tools
  const quickTools = [
    "Create Post",
    "Schedule Draft",
    "Boost Content",
    "Pin Highlight",
    "Engage Comments",
    "Export Insights",
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back. Your content insights & performance at a glance.
          </Text>
        </View>
        <View style={styles.userBadge}>
          <Text style={styles.userRole}>Creator</Text>
          <Text style={styles.userAvatar}>📸</Text>
        </View>
      </View>

      {/* STAT CARDS GRID */}
      <View style={styles.statGrid}>
        {statCards.map(({ label, value, detail, status }, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardValue}>{value}</Text>
            <Text style={[styles.cardDetail, styles[status]]}>{detail}</Text>
          </View>
        ))}
      </View>

      {/* SPLIT: Chart + Audience */}
      <View style={styles.splitRow}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Weekly Post Activity</Text>
          <Text style={styles.chartTitle}>Posts per Day</Text>
          <View style={styles.chartBars}>
            {postsPerDay.map((val, i) => (
              <View key={i} style={styles.barWrapper}>
                <View style={[styles.bar, { height: `${val}%` }]} />
              </View>
            ))}
          </View>
          <View style={styles.chartLabels}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <Text key={i} style={styles.chartLabelText}>
                {day}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Audience Segments</Text>
          {audienceSegments.map(({ label, value }, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.listLabel}>{label}</Text>
              <Text style={styles.listValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* SPLIT: Engaging + Review */}
      <View style={styles.splitRow}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Most Engaging Posts</Text>
          {engagingPosts.map(({ icon, title, metric }, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.listIcon}>{icon}</Text>
              <View>
                <Text style={styles.listLabel}>
                  <Text style={styles.listBold}>{title}</Text> – {metric}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Posts Needing Review</Text>
          {reviewPosts.map(({ icon, title, metric }, i) => (
            <View key={i} style={styles.listRow}>
              <Text style={styles.listIcon}>{icon}</Text>
              <View>
                <Text style={styles.listLabel}>
                  <Text style={styles.listBold}>{title}</Text> – {metric}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* QUICK TOOLS */}
      <View style={styles.actionsPanel}>
        <Text style={styles.panelTitle}>Quick Tools</Text>
        <View style={styles.actionGrid}>
          {quickTools.map((tool, i) => (
            <TouchableOpacity key={i} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>{tool}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#a6b5c4",
    marginTop: 4,
  },
  userBadge: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  userRole: {
    fontSize: 12,
    color: "#b3c5d4",
  },
  userAvatar: {
    fontSize: 18,
    marginTop: 2,
  },

  /* STAT CARDS GRID */
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: "rgba(67,67,67,0.125)",
    borderColor: "rgba(55,56,56,0.5)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 12,
    color: "#e2f9ff",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
  },
  cardDetail: {
    fontSize: 12,
    color: "#cfd8df",
  },
  positive: { color: "#3de3ef" },
  neutral: { color: "#c2cfd8" },
  highlight: { color: "#f9de85" },

  /* SPLIT ROW */
  splitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  panel: {
    width: CARD_WIDTH,
    backgroundColor: "rgba(66,66,67,0.214)",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    overflow: 'scroll'
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#e8f2fc",
    marginBottom: 12,
  },

  /* CHART */
  chartTitle: {
    fontSize: 12,
    color: "#b8d8e3",
    marginBottom: 8,
  },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    backgroundColor: "rgba(255,255,255,0.015)",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 8,
  },
  barWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    marginHorizontal: 2,
  },
  bar: {
    width: 8,
    backgroundColor: "#5ba8dc",
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  chartLabelText: {
    fontSize: 10,
    color: "#9eb2c2",
  },

  /* LIST ROWS */
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  listIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  listLabel: {
    fontSize: 14,
    color: "#d4e1ec",
  },
  listValue: {
    fontSize: 14,
    color: "#aadfff",
    marginLeft: 4,
  },
  listBold: {
    fontWeight: "600",
    color: "#ffffff",
  },

  /* QUICK TOOLS */
  actionsPanel: {
    backgroundColor: "rgba(66,66,67,0.214)",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 8, // supported in newer RN, if not, use margin
  },
  actionButton: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: "#daf4ff",
  },
});
