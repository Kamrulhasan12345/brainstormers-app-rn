import { Stack } from 'expo-router';

export default function TeacherLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="lectures" />
      <Stack.Screen name="students" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="grades" />
    </Stack>
  );
}