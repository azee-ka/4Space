// app/messages/_layout.tsx

import { Stack } from "expo-router";

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
          gestureDirection: "vertical",
          // Only recognize a downward drag (dy > 5) as “close.”
          // Removing failOffsetY so upward drags simply do nothing.
          gestureHandlerProps: {
            activeOffsetY: [5, Number.POSITIVE_INFINITY],
          },
          // Only start the gesture if the touch begins within the top 30px.
          gestureResponseDistance: {
            vertical: 30,
          },
        }}
      />
    </Stack>
  );
}
