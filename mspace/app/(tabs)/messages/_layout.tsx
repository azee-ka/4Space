// app/messages/_layout.tsx

import { Stack } from "expo-router";

export const unstable_settings = {
  headerShown: false,
};

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
