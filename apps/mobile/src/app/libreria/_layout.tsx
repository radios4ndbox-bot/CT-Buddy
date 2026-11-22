import { Stack } from 'expo-router';

export default function LibreriaLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Libreria' }}>
      <Stack.Screen name="index" options={{ title: 'Libreria' }} />
      <Stack.Screen name="[id]" options={{ title: 'Modello' }} />
    </Stack>
  );
}
