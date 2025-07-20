import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Calendar, ChevronDown, Users } from 'lucide-react-native';

interface NotificationFormProps {
  formData: {
    title: string;
    body: string;
    type: 'info' | 'warning' | 'success' | 'error';
    link: string;
    expires_at: Date | null;
    targetType: string;
  };
  onUpdateForm: (updates: Partial<NotificationFormProps['formData']>) => void;
  onShowTypeModal: () => void;
  onShowTargetModal: () => void;
  onShowDatePicker: () => void;
  getTargetDisplayText: () => string;
  getTypeDisplayText: () => string;
  getTypeIcon: (type: string) => React.ReactElement;
}

export default function NotificationForm({
  formData,
  onUpdateForm,
  onShowTypeModal,
  onShowTargetModal,
  onShowDatePicker,
  getTargetDisplayText,
  getTypeDisplayText,
  getTypeIcon,
}: NotificationFormProps) {
  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Compose Notification</Text>

      {/* Title Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter notification title..."
          value={formData.title}
          onChangeText={(text) => onUpdateForm({ title: text })}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Body Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Message *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Enter notification message..."
          value={formData.body}
          onChangeText={(text) => onUpdateForm({ body: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Type Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Type</Text>
        <TouchableOpacity style={styles.selector} onPress={onShowTypeModal}>
          <View style={styles.selectorContent}>
            {getTypeIcon(formData.type)}
            <Text style={styles.selectorText}>{getTypeDisplayText()}</Text>
          </View>
          <ChevronDown size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Target Recipients */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Target Recipients</Text>
        <TouchableOpacity style={styles.selector} onPress={onShowTargetModal}>
          <View style={styles.selectorContent}>
            <Users size={16} color="#64748B" />
            <Text style={styles.selectorText}>{getTargetDisplayText()}</Text>
          </View>
          <ChevronDown size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Link Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Link (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter deep link or screen path..."
          value={formData.link}
          onChangeText={(text) => onUpdateForm({ link: text })}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {/* Expiry Date */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Expires At (Optional)</Text>
        <TouchableOpacity style={styles.selector} onPress={onShowDatePicker}>
          <View style={styles.selectorContent}>
            <Calendar size={16} color="#64748B" />
            <Text style={styles.selectorText}>
              {formData.expires_at
                ? formData.expires_at.toLocaleDateString()
                : 'Select expiry date'}
            </Text>
          </View>
          <ChevronDown size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
    fontFamily: 'Inter-SemiBold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    fontFamily: 'Inter-Medium',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter-Regular',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
});
