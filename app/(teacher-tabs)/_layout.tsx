import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  BookOpen,
  MessageCircle,
  User,
} from 'lucide-react-native';

export default function TeacherTabLayout() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login-selection');
    } else if (user?.role !== 'teacher') {
      // Redirect non-teacher users to appropriate dashboard
      if (user?.role === 'admin') {
        router.replace('/(admin-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || user?.role !== 'teacher') {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'My Students',
          tabBarIcon: ({ size, color }) => (
            <GraduationCap size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lectures"
        options={{
          title: 'Lectures',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'Exams',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="qna"
        options={{
          title: 'Q&A',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />

      {/* Hide dynamic routes from tab bar */}
      <Tabs.Screen
        name="lectures/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="exams/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="students/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
