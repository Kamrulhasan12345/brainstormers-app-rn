import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react-native';

interface Notification {
  id: string;
  recipient_id: string;
  title: string | null;
  body: string;
  link: string | null;
  expires_at: string | null;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
}

interface GlobalNotificationPopupProps {
  notification: Notification | null;
  onDismiss: () => void;
  onPress: () => void;
}

export default function GlobalNotificationPopup({
  notification,
  onDismiss,
  onPress,
}: GlobalNotificationPopupProps) {
  const [slideAnim] = useState(new Animated.Value(-100));
  const [opacityAnim] = useState(new Animated.Value(0));

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  }, [slideAnim, opacityAnim, onDismiss]);

  useEffect(() => {
    if (notification) {
      console.log(
        'GlobalNotificationPopup: Showing notification:',
        notification
      );

      // Reset animations first
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);

      // Slide in animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 5 seconds
      const timer = setTimeout(() => {
        console.log('GlobalNotificationPopup: Auto dismissing');
        handleDismiss();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      console.log('GlobalNotificationPopup: No notification to show');
    }
  }, [notification, slideAnim, opacityAnim, handleDismiss]);

  const handlePress = () => {
    handleDismiss();
    onPress();
  };

  const getNotificationIcon = (type: string) => {
    const size = 18;
    const color = getTypeColor(type);

    switch (type) {
      case 'info':
        return <Info size={size} color={color} />;
      case 'warning':
        return <AlertTriangle size={size} color={color} />;
      case 'success':
        return <CheckCircle size={size} color={color} />;
      case 'error':
        return <XCircle size={size} color={color} />;
      default:
        return <Info size={size} color={color} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#2563EB';
      case 'warning':
        return '#F59E0B';
      case 'success':
        return '#059669';
      case 'error':
        return '#EF4444';
      default:
        return '#64748B';
    }
  };

  const getTypeBackgroundColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#EBF4FF';
      case 'warning':
        return '#FEF3C7';
      case 'success':
        return '#D1FAE5';
      case 'error':
        return '#FEE2E2';
      default:
        return '#F1F5F9';
    }
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.popup,
          { borderLeftColor: getTypeColor(notification.type) },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getTypeBackgroundColor(notification.type) },
            ]}
          >
            {getNotificationIcon(notification.type)}
          </View>
          <View style={styles.textContainer}>
            {notification.title && (
              <Text style={styles.title} numberOfLines={1}>
                {notification.title}
              </Text>
            )}
            <Text style={styles.body} numberOfLines={2}>
              {notification.body}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <X size={16} color="#64748B" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  body: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
