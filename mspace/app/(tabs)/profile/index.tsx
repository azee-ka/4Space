// app/profile/index.tsx
import { View, Text } from 'react-native';

export default function Profile() {
  return (
    <View style={{ flex: 1, backgroundColor: 'red', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>Your Profile</Text>
    </View>
  );
}