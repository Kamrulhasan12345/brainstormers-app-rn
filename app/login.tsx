import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      
      // Navigate based on user role
      if (email.includes('admin')) {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
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
        setEmail('arjun.sharma@brainstormers.edu');
        setPassword('student123');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#1D4ED8', '#1E40AF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <GraduationCap size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>BrainStormers</Text>
          <Text style={styles.subtitle}>Excellence in HSC Education</Text>
        </View>

        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Welcome Back</Text>
          <Text style={styles.loginSubtitle}>Sign in to continue your learning journey</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <User size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#64748B" />
                ) : (
                  <Eye size={20} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo Accounts</Text>
            <View style={styles.demoButtons}>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => fillDemoCredentials('admin')}>
                <Text style={styles.demoButtonText}>Admin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => fillDemoCredentials('teacher')}>
                <Text style={styles.demoButtonText}>Teacher</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => fillDemoCredentials('student')}>
                <Text style={styles.demoButtonText}>Student</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Contact administration for account access
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BFDBFE',
    fontFamily: 'Inter-Regular',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontFamily: 'Inter-Regular',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  demoSection: {
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  demoButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    fontFamily: 'Inter-Medium',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});