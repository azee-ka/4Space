// app/index.tsx
import { View, Text } from 'react-native';

export default function Dashboard() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'red' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>Dashboard</Text>
    </View>
  );
}
