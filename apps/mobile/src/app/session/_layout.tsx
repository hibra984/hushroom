import { Stack } from 'expo-router';

export default function SessionLayout() {
  return (
    <Stack>
      <Stack.Screen name="new" options={{ title: 'New Session' }} />
      <Stack.Screen name="[id]" options={{ title: 'Session Detail' }} />
    </Stack>
  );
}
