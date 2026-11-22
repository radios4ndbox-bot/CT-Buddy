import { Stack } from 'expo-router';

export default function RefertoLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Indietro' }}>
      <Stack.Screen name="index" options={{ title: 'Nuovo referto' }} />
      <Stack.Screen name="reperti" options={{ title: 'Reperti' }} />
      <Stack.Screen name="conclusioni" options={{ title: 'Conclusioni' }} />
      <Stack.Screen name="anteprima" options={{ title: 'Referto' }} />
    </Stack>
  );
}
