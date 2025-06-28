import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Notification } from '@/types/admin';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web notifications require different handling
      if (typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification.requestPermission === 'function') {
        try {
          const permission = await window.Notification.requestPermission();
          return permission === 'granted';
        } catch (error) {
          console.warn('Web notification permission request failed:', error);
          return false;
        }
      }
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async scheduleNotification(
    title: string,
    body: string,
    scheduledFor: Date,
    data?: any
  ): Promise<string> {
    if (Platform.OS === 'web') {
      // For web, we'll use browser notifications
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
        try {
          new window.Notification(title, {
            body,
            icon: '/assets/images/icon.png',
            data,
          });
        } catch (error) {
          console.warn('Web notification creation failed:', error);
        }
      }
      return 'web-notification';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        date: scheduledFor,
      },
    });

    return notificationId;
  }

  async scheduleExamReminder(
    examTitle: string,
    examDate: Date,
    studentPhone?: string,
    guardianPhone?: string
  ): Promise<void> {
    const reminderTimes = [
      { hours: 24, label: '1 day before' },
      { hours: 2, label: '2 hours before' },
      { hours: 0.5, label: '30 minutes before' },
    ];

    for (const reminder of reminderTimes) {
      const reminderDate = new Date(examDate.getTime() - (reminder.hours * 60 * 60 * 1000));
      
      if (reminderDate > new Date()) {
        await this.scheduleNotification(
          `Exam Reminder - ${examTitle}`,
          `Your exam is in ${reminder.label}. Don't forget to prepare!`,
          reminderDate,
          { type: 'exam', examTitle }
        );
      }
    }

    // Send SMS to guardian (mock implementation)
    if (guardianPhone) {
      this.sendSMSToGuardian(
        guardianPhone,
        `BrainStormers: Your ward has an exam "${examTitle}" on ${examDate.toLocaleDateString()}. Please ensure they are prepared.`
      );
    }
  }

  async scheduleAbsenceNotification(
    studentName: string,
    lectureTitle: string,
    date: Date,
    guardianPhone?: string,
    guardianEmail?: string
  ): Promise<void> {
    const message = `BrainStormers Alert: ${studentName} was absent from ${lectureTitle} on ${date.toLocaleDateString()}. Please contact the institute for details.`;

    // Send immediate notification
    await this.scheduleNotification(
      'Student Absence Alert',
      `${studentName} was absent from ${lectureTitle}`,
      new Date(),
      { type: 'absence', studentName, lectureTitle }
    );

    // Send SMS to guardian
    if (guardianPhone) {
      this.sendSMSToGuardian(guardianPhone, message);
    }

    // Send email to guardian (mock implementation)
    if (guardianEmail) {
      this.sendEmailToGuardian(guardianEmail, 'Student Absence Alert', message);
    }
  }

  private async sendSMSToGuardian(phone: string, message: string): Promise<void> {
    // Mock SMS implementation
    // In production, integrate with SMS service like Twilio
    console.log(`SMS to ${phone}: ${message}`);
    
    // For demo purposes, show a notification
    if (Platform.OS !== 'web') {
      await this.scheduleNotification(
        'SMS Sent to Guardian',
        `Message sent to ${phone}`,
        new Date(),
        { type: 'sms', phone }
      );
    }
  }

  private async sendEmailToGuardian(email: string, subject: string, message: string): Promise<void> {
    // Mock email implementation
    // In production, integrate with email service
    console.log(`Email to ${email}: ${subject} - ${message}`);
  }

  async cancelNotification(notificationId: string): Promise<void> {
    if (Platform.OS !== 'web') {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (Platform.OS !== 'web') {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  }
}

export const notificationService = new NotificationService();