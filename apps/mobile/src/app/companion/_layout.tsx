import { Stack } from 'expo-router';

export default function CompanionLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: 'Companion' }} />
    </Stack>
  );
}
