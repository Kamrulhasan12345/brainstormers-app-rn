import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="lectures" />
      <Stack.Screen name="exams" />
      <Stack.Screen name="students" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}