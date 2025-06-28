import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { User, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      
      // Navigation will be handled by the auth context and layout
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'teacher' | 'student') => {
    switch (role) {
      case 'admin':
        setEmail('admin@brainstormers.edu');
        setPassword('admin123');
        break;
      case 'teacher':
        setEmail('teacher@brainstormers.edu');
        setPassword('teacher123');
        break;
      case 'student':
        setEmail('student@brainstormers.edu');
        setPassword('student123');
        break;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-br from-blue-600 to-blue-800">
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
            <GraduationCap size={48} color="#FFFFFF" />
          </View>
          <Text className="text-4xl font-bold text-white mb-2">BrainStormers</Text>
          <Text className="text-blue-100 text-lg">Excellence in HSC Education</Text>
        </View>

        {/* Login Card */}
        <View className="bg-white rounded-3xl p-8 shadow-2xl">
          <Text className="text-3xl font-bold text-gray-900 text-center mb-2">Welcome Back</Text>
          <Text className="text-gray-600 text-center mb-8">Sign in to continue your learning journey</Text>

          {/* Email Input */}
          <View className="mb-4">
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
              <User size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-base"
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-base"
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className={`bg-blue-600 rounded-xl py-4 items-center mb-6 shadow-lg ${isLoading ? 'opacity-70' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-lg font-semibold">Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Demo Accounts */}
          <View className="mb-6">
            <Text className="text-gray-600 text-center font-semibold mb-3">Demo Accounts</Text>
            <View className="flex-row justify-between gap-2">
              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                onPress={() => fillDemoCredentials('admin')}>
                <Text className="text-gray-700 text-sm font-medium">Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                onPress={() => fillDemoCredentials('teacher')}>
                <Text className="text-gray-700 text-sm font-medium">Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                onPress={() => fillDemoCredentials('student')}>
                <Text className="text-gray-700 text-sm font-medium">Student</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <Text className="text-gray-500 text-center text-sm">
            Contact administration for account access
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}