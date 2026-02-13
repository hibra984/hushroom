import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack>
      <Stack.Screen name="new" options={{ title: 'New Session' }} />
      <Stack.Screen name="[id]" options={{ title: 'Session Detail' }} />
      <Stack.Screen name="active" options={{ title: 'Live Session', headerShown: false }} />
      <Stack.Screen name="evaluate" options={{ title: 'Evaluate' }} />
    </Stack>
  );
}
