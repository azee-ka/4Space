// app/messages/CreateMessageSheet.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7; // sheet covers 70% of screen

interface User {
  id: string;
  username: string;
  profile_image?: string;
}

interface CreateMessageSheetProps {
  visible: boolean;
  onClose: () => void;
  onStartConversation: (recipients: User[]) => void;
  searchUsers: (query: string) => Promise<User[]>;
}

export default function CreateMessageSheet({
  visible,
  onClose,
  onStartConversation,
  searchUsers,
}: CreateMessageSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [selected, setSelected] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const panRef = useRef<PanResponder | null>(null);

  // Animate sheet up/down when `visible` changes
  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setQuery("");
        setResults([]);
        setSelected([]);
      });
    }
  }, [visible]);

  // PanResponder to allow dragging sheet down to dismiss
  if (!panRef.current) {
    panRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > SHEET_HEIGHT * 0.25) {
          Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }

  // Search whenever `query` changes
  useEffect(() => {
    let active = true;
    if (query.trim()) {
      searchUsers(query.trim())
        .then((users) => {
          if (active) setResults(users);
        })
        .catch(() => {
          if (active) setResults([]);
        });
    } else {
      setResults([]);
    }
    return () => {
      active = false;
    };
  }, [query]);

  const handleSelect = (user: User) => {
    if (!selected.some((s) => s.id === user.id)) {
      setSelected((prev) => [...prev, user]);
      setQuery("");
      setResults([]);
    }
  };

  const handleRemove = (id: string) => {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  };

  const handleStart = () => {
    onStartConversation(selected);
    onClose();
  };

  return visible ? (
    <KeyboardAvoidingView
      style={StyleSheet.absoluteFill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Semi‐transparent backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sliding sheet */}
      <Animated.View
        style={[styles.sheetContainer, { transform: [{ translateY }] }]}
        {...panRef.current!.panHandlers}
      >
        {/* Drag handle */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>New Chat</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Recipient “pills” + search input */}
        <View style={styles.recipientBar}>
          <FlatList
            data={selected}
            horizontal
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{item.username}</Text>
                <TouchableOpacity onPress={() => handleRemove(item.id)}>
                  <Feather
                    name="x"
                    size={14}
                    color="#ddd"
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Type a username..."
            placeholderTextColor="#888"
            autoFocus
          />
        </View>

        {/* Search results list */}
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.resultText}>{item.username}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* “Start” button */}
        <TouchableOpacity
          style={[
            styles.startButton,
            { opacity: selected.length ? 1 : 0.5 },
          ]}
          disabled={selected.length === 0}
          onPress={handleStart}
        >
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  ) : null;
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: SHEET_HEIGHT,
    backgroundColor: "#181a1f",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#555",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  recipientBar: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  pillText: {
    color: "#fff",
    fontSize: 13,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 32,
  },
  resultsList: {
    maxHeight: SHEET_HEIGHT * 0.35,
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: "rgba(255,255,255,0.05)",
    borderBottomWidth: 1,
  },
  resultText: {
    color: "#e0e0e0",
    fontSize: 15,
  },
  startButton: {
    backgroundColor: "#00eaff",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  startButtonText: {
    color: "#121212",
    fontSize: 16,
    fontWeight: "600",
  },
});
