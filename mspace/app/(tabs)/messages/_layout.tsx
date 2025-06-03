// app/messages/_layout.tsx

import { Stack } from "expo-router";

// We do NOT want a nested <Tabs> here; instead, just treat "index" and "[conversationId]" as a Stack.
// This way, /messages → index.tsx shows our custom top tabs, and /messages/[conversationId] → chat screen.
export const unstable_settings = {
  headerShown: false,
};

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[conversationId]"
        options={{
          presentation: "modal",
          gestureEnabled: true,
          // animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
