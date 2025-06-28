import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chrome as Home, ArrowLeft } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View style={styles.content}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorNumber}>404</Text>
        </View>
        <Text style={styles.title}>Oops! Page Not Found</Text>
        <Text style={styles.message}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        
        <View style={styles.actions}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.primaryButton}>
              <Home size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </Link>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={() => {}}>
            <ArrowLeft size={20} color="#2563EB" />
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Inter-Bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter-SemiBold',
  },
});