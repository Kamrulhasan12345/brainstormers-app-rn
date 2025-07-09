import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Users,
  ArrowLeft,
  Shield,
} from 'lucide-react-native';

export default function StaffLoginScreen() {
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
      console.log('Staff attempting login with:', email);
      await login({ email, password });
      console.log('Staff login successful');
      // Navigation will be handled automatically by the auth context
    } catch (error) {
      console.error('Staff login error:', error);
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Invalid credentials'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'teacher') => {
    switch (role) {
      case 'admin':
        setEmail('admin@brainstormers.edu');
        setPassword('admin123');
        break;
      case 'teacher':
        setEmail('teacher@brainstormers.edu');
        setPassword('teacher123');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Users size={48} color="#FFFFFF" />
              </View>
              <Text style={styles.title}>Staff Portal</Text>
              <Text style={styles.subtitle}>
                Teachers & Administration Access
              </Text>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              <Text style={styles.loginTitle}>Staff Login</Text>
              <Text style={styles.loginSubtitle}>
                Access your teaching dashboard and admin tools
              </Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Staff Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#9CA3AF"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
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
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Demo Accounts */}
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Demo Accounts</Text>
                <View style={styles.demoButtons}>
                  <TouchableOpacity
                    style={[styles.demoButton, styles.adminDemo]}
                    onPress={() => fillDemoCredentials('admin')}
                    disabled={isLoading}
                  >
                    <Shield size={16} color="#DC2626" style={styles.demoIcon} />
                    <Text style={[styles.demoButtonText, styles.adminText]}>
                      Admin Demo
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.demoButton, styles.teacherDemo]}
                    onPress={() => fillDemoCredentials('teacher')}
                    disabled={isLoading}
                  >
                    <Users size={16} color="#2563EB" style={styles.demoIcon} />
                    <Text style={[styles.demoButtonText, styles.teacherText]}>
                      Teacher Demo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Security Notice */}
              <View style={styles.securitySection}>
                <Text style={styles.securityTitle}>🔒 Security Notice</Text>
                <Text style={styles.securityText}>
                  Staff accounts have elevated privileges. Keep your credentials
                  secure and log out when finished.
                </Text>
              </View>

              {/* Help Text */}
              <View style={styles.helpSection}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpText}>
                  • Contact IT administration for account issues{'\n'}• Check
                  your institutional email for updates{'\n'}• Visit the main
                  office for password reset
                </Text>
              </View>

              {/* Footer */}
              <Text style={styles.footerText}>
                BrainStormers Staff Portal • Secure Access
              </Text>
            </View>
          </LinearGradient>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    fontSize: 18,
    color: '#E9D5FF',
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
    flex: 1,
  },
  loginTitle: {
    fontSize: 28,
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
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  demoSection: {
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  demoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  adminDemo: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  teacherDemo: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  demoIcon: {
    marginRight: 6,
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  adminText: {
    color: '#DC2626',
  },
  teacherText: {
    color: '#2563EB',
  },
  securitySection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#B45309',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  helpSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B21A8',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#7C3AED',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
