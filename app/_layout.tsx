import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { GlobalNotificationProvider } from '../contexts/GlobalNotificationContext';
import { NotificationSetup } from '@/components/NotificationSetup';
import { usePushTokenActivity } from '@/hooks/usePushTokenActivity';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Initialize push token activity tracking
  usePushTokenActivity();

  useEffect(() => {
    if (isLoading) {
      console.log('Auth is loading, waiting...');
      return;
    }

    const inAuthGroup =
      segments[0] === '(tabs)' ||
      segments[0] === '(admin-tabs)' ||
      segments[0] === '(teacher-tabs)';

    console.log('Navigation check:', {
      isAuthenticated,
      inAuthGroup,
      segments: segments[0],
      userRole: user?.role,
      isLoading,
    });

    if (!isAuthenticated) {
      if (inAuthGroup) {
        console.log(
          'Redirecting to login selection - not authenticated but in protected route'
        );
        router.replace('/login-selection');
      }
    } else {
      if (!inAuthGroup) {
        console.log(
          'Redirecting to dashboard - authenticated but not in protected route'
        );
        // Redirect to appropriate dashboard based on user role
        if (user?.role === 'admin') {
          router.replace('/(admin-tabs)');
        } else if (user?.role === 'teacher') {
          router.replace('/(teacher-tabs)');
        } else {
          router.replace('/(tabs)');
        }
      }
    }
  }, [isAuthenticated, isLoading, segments, user?.role, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login-selection" />
      <Stack.Screen name="staff-login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="teacher" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <GlobalNotificationProvider>
        <NotificationSetup>
          <RootLayoutNav />
        </NotificationSetup>
        <StatusBar style="auto" />
      </GlobalNotificationProvider>
    </AuthProvider>
  );
}
