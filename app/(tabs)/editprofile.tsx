import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react-native';

interface FormData {
  fullName: string;
  currentPassword: string;
  newPassword: string;
  enableNotifications: boolean;
}

interface EditableFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  placeholder?: string;
  editable?: boolean;
}

interface PasswordSectionProps {
  currentPassword: string;
  newPassword: string;
  onCurrentPasswordChange: (text: string) => void;
  onNewPasswordChange: (text: string) => void;
  errors: Partial<FormData>;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
}

interface NotificationSectionProps {
  enableNotifications: boolean;
  onToggleNotifications: (value: boolean) => void;
}

// Reusable EditableField Component
const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  showPassword = false,
  onTogglePassword,
  placeholder,
  editable = true,
}) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputContainer, !editable && styles.disabledInput]}>
      <TextInput
        style={[
          styles.textInput,
          error && styles.textInputError,
          !editable && styles.disabledTextInput,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        secureTextEntry={secureTextEntry && !showPassword}
        editable={editable}
      />
      {secureTextEntry && editable && (
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={onTogglePassword}
        >
          {showPassword ? (
            <EyeOff size={20} color="#64748B" />
          ) : (
            <Eye size={20} color="#64748B" />
          )}
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Reusable Password Section Component
const PasswordSection: React.FC<PasswordSectionProps> = ({
  currentPassword,
  newPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  errors,
  showCurrentPassword,
  showNewPassword,
  onToggleCurrentPassword,
  onToggleNewPassword,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Lock size={20} color="#2563EB" />
      <Text style={styles.sectionTitle}>Change Password</Text>
    </View>
    <View style={styles.sectionContent}>
      <EditableField
        label="Current Password"
        value={currentPassword}
        onChangeText={onCurrentPasswordChange}
        error={errors.currentPassword}
        secureTextEntry={true}
        showPassword={showCurrentPassword}
        onTogglePassword={onToggleCurrentPassword}
        placeholder="Enter your current password"
      />
      <EditableField
        label="New Password"
        value={newPassword}
        onChangeText={onNewPasswordChange}
        error={errors.newPassword}
        secureTextEntry={true}
        showPassword={showNewPassword}
        onTogglePassword={onToggleNewPassword}
        placeholder="Enter your new password"
      />
      <Text style={styles.helperText}>
        Password must be at least 6 characters long. Enter your current password
        to verify your identity.
      </Text>
    </View>
  </View>
);

// Reusable Notification Section Component
const NotificationSection: React.FC<NotificationSectionProps> = ({
  enableNotifications,
  onToggleNotifications,
}) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Bell size={20} color="#2563EB" />
      <Text style={styles.sectionTitle}>Notifications</Text>
    </View>
    <View style={styles.sectionContent}>
      <View style={styles.toggleContainer}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Enable Push Notifications</Text>
          <Text style={styles.toggleDescription}>
            Receive notifications about exams, lectures, and important updates
          </Text>
        </View>
        <Switch
          value={enableNotifications}
          onValueChange={onToggleNotifications}
          trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
          thumbColor={enableNotifications ? '#FFFFFF' : '#FFFFFF'}
        />
      </View>
    </View>
  </View>
);

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  // Debug logging for user object
  console.log('=== EditProfile Component Debug ===');
  console.log('User object:', JSON.stringify(user, null, 2));
  console.log('User ID:', user?.id);
  console.log('User Email:', user?.email);
  console.log('User Email Type:', typeof user?.email);
  console.log('Auth User Keys:', user ? Object.keys(user) : 'No user');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    currentPassword: '',
    newPassword: '',
    enableNotifications: false,
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const loadUserProfile = useCallback(async () => {
    try {
      console.log('=== Loading User Profile Debug ===');
      console.log('User ID for profile loading:', user?.id);

      setLoading(true);
      if (!user?.id) {
        console.log('No user ID available, skipping profile load');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      console.log('Profile query result:');
      console.log('- Data:', profileData);
      console.log('- Error:', error);

      if (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
        return;
      }

      console.log('Setting form data with profile:', profileData);
      setFormData((prev) => ({
        ...prev,
        fullName: profileData?.full_name || '',
      }));
    } catch (err) {
      console.error('Error loading profile:', err);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const verifyCurrentPassword = async (password: string): Promise<boolean> => {
    try {
      console.log('=== Password Verification Debug ===');
      console.log('User object:', JSON.stringify(user, null, 2));
      console.log('User email:', user?.email);
      console.log('User email type:', typeof user?.email);
      console.log('User email exists:', !!user?.email);
      console.log('Password provided:', !!password);
      console.log('Password length:', password?.length);

      if (!user?.email) {
        console.error('No email found in user object');
        return false;
      }

      // Simple approach: Try to sign in with current credentials
      // This temporarily creates a new session, but it's the most reliable way
      console.log('Attempting to sign in with:', user.email);
      const { error, data } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      console.log('Sign in result:');
      console.log('- Error:', error);
      console.log('- Data:', data);
      console.log('- Success:', !error);

      // If sign-in is successful, the password is correct
      return !error;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (formData.currentPassword || formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('=== Save Process Debug ===');
    console.log('Form data:', JSON.stringify(formData, null, 2));
    console.log('User object:', JSON.stringify(user, null, 2));

    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    try {
      setSaving(true);
      const updates = [];

      // Update full name in profiles table
      if (formData.fullName.trim()) {
        console.log('Adding profile update to queue');
        updates.push(
          supabase
            .from('profiles')
            .update({ full_name: formData.fullName.trim() })
            .eq('id', user?.id)
        );
      }

      // Update password if provided
      if (formData.currentPassword && formData.newPassword) {
        console.log('Password change requested');

        // First, verify the current password
        const isCurrentPasswordValid = await verifyCurrentPassword(
          formData.currentPassword
        );

        console.log(
          'Current password validation result:',
          isCurrentPasswordValid
        );

        if (!isCurrentPasswordValid) {
          console.log('Current password validation failed');
          setErrors({ currentPassword: 'Current password is incorrect' });
          setSaving(false);
          return;
        }

        // If current password is valid, update to new password
        console.log('Updating to new password');
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        console.log('Password update result:', passwordError);

        if (passwordError) {
          console.error('Password update failed:', passwordError);
          setErrors({
            newPassword: 'Failed to update password. Please try again.',
          });
          setSaving(false);
          return;
        }

        updates.push(Promise.resolve({ data: null, error: null }));
      }

      console.log('Executing updates, count:', updates.length);
      // Execute all updates
      const results = await Promise.all(updates);
      console.log('Update results:', results);

      // Check for errors in profile update
      const profileUpdateResult = results.find(
        (result) => result && 'data' in result && 'error' in result
      );

      if (profileUpdateResult?.error) {
        console.error('Profile update error:', profileUpdateResult.error);
        throw new Error(profileUpdateResult.error.message);
      }

      // Check for errors in password update
      const passwordUpdateResult = results.find(
        (result) =>
          result && 'data' in result && result.data && 'user' in result.data
      );

      if (passwordUpdateResult?.error) {
        console.error('Password update error:', passwordUpdateResult.error);
        throw new Error(passwordUpdateResult.error.message);
      }

      console.log('All updates successful');

      // Refresh user data in AuthContext to reflect changes
      await refreshUser();

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Clear password fields
            setFormData((prev) => ({
              ...prev,
              currentPassword: '',
              newPassword: '',
            }));
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const renderPasswordSection = () => (
    <PasswordSection
      currentPassword={formData.currentPassword}
      newPassword={formData.newPassword}
      onCurrentPasswordChange={(text) =>
        setFormData((prev) => ({ ...prev, currentPassword: text }))
      }
      onNewPasswordChange={(text) =>
        setFormData((prev) => ({ ...prev, newPassword: text }))
      }
      errors={errors}
      showCurrentPassword={showCurrentPassword}
      showNewPassword={showNewPassword}
      onToggleCurrentPassword={() =>
        setShowCurrentPassword(!showCurrentPassword)
      }
      onToggleNewPassword={() => setShowNewPassword(!showNewPassword)}
    />
  );

  const renderNotificationSection = () => (
    <NotificationSection
      enableNotifications={formData.enableNotifications}
      onToggleNotifications={(value) =>
        setFormData((prev) => ({ ...prev, enableNotifications: value }))
      }
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#2563EB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <View style={[styles.section, styles.firstSection]}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>
          <View style={styles.sectionContent}>
            <EditableField
              label="Full Name"
              value={formData.fullName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, fullName: text }))
              }
              error={errors.fullName}
              placeholder="Enter your full name"
            />
            <EditableField
              label="Email"
              value={user?.email || ''}
              onChangeText={() => {}}
              editable={false}
            />
            <Text style={styles.helperText}>
              Email cannot be changed from this screen
            </Text>
          </View>
        </View>

        {/* Password Section */}
        {renderPasswordSection()}

        {/* Notification Section */}
        {renderNotificationSection()}

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Save size={20} color="#FFFFFF" />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  firstSection: {
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  disabledInput: {
    opacity: 0.6,
  },
  disabledTextInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  saveButtonContainer: {
    padding: 20,
    paddingTop: 0,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
});
