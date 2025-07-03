import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/database-new';

interface CreateNotificationData {
  recipient_id: string;
  sender_id?: string;
  title: string;
  message: string;
  type:
    | 'lecture_reminder'
    | 'exam_reminder'
    | 'lecture_missed'
    | 'exam_missed'
    | 'general'
    | 'course_enrollment';
  related_id?: string;
  related_type?: string;
  scheduled_for?: string;
}

class DatabaseNotificationService {
  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  }

  async createNotification(
    notificationData: CreateNotificationData
  ): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notificationData,
        sent_at: notificationData.scheduled_for
          ? null
          : new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createBulkNotifications(
    notifications: CreateNotificationData[]
  ): Promise<Notification[]> {
    const now = new Date().toISOString();
    const notificationsWithTimestamp = notifications.map((notification) => ({
      ...notification,
      sent_at: notification.scheduled_for ? null : now,
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationsWithTimestamp)
      .select();

    if (error) throw error;
    return data;
  }

  // Specific notification creators
  async createLectureReminder(
    lectureId: string,
    studentIds: string[]
  ): Promise<void> {
    // Get lecture details
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select(
        `
        *,
        course:courses(name, code)
      `
      )
      .eq('id', lectureId)
      .single();

    if (lectureError) {
      console.error('Failed to get lecture details:', lectureError);
      return;
    }

    const lectureTime = new Date(lecture.scheduled_at);
    const reminderTime = new Date(lectureTime.getTime() - 30 * 60 * 1000); // 30 minutes before

    const notifications = studentIds.map((studentId) => ({
      recipient_id: studentId,
      title: 'Lecture Reminder',
      message: `${lecture.course.code} - ${
        lecture.title
      } starts in 30 minutes at ${lecture.location || 'TBD'}`,
      type: 'lecture_reminder' as const,
      related_id: lectureId,
      related_type: 'lecture',
      scheduled_for: reminderTime.toISOString(),
    }));

    await this.createBulkNotifications(notifications);
  }

  async createExamReminder(
    examId: string,
    studentIds: string[]
  ): Promise<void> {
    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(
        `
        *,
        course:courses(name, code)
      `
      )
      .eq('id', examId)
      .single();

    if (examError) {
      console.error('Failed to get exam details:', examError);
      return;
    }

    const examTime = new Date(exam.scheduled_at);
    const reminderTime24h = new Date(examTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
    const reminderTime1h = new Date(examTime.getTime() - 60 * 60 * 1000); // 1 hour before

    const notifications24h = studentIds.map((studentId) => ({
      recipient_id: studentId,
      title: 'Exam Reminder - 24 Hours',
      message: `${exam.course.code} exam "${exam.title}" is tomorrow at ${
        exam.location || 'TBD'
      }. Duration: ${exam.duration_minutes} minutes.`,
      type: 'exam_reminder' as const,
      related_id: examId,
      related_type: 'exam',
      scheduled_for: reminderTime24h.toISOString(),
    }));

    const notifications1h = studentIds.map((studentId) => ({
      recipient_id: studentId,
      title: 'Exam Reminder - 1 Hour',
      message: `${exam.course.code} exam "${exam.title}" starts in 1 hour at ${
        exam.location || 'TBD'
      }`,
      type: 'exam_reminder' as const,
      related_id: examId,
      related_type: 'exam',
      scheduled_for: reminderTime1h.toISOString(),
    }));

    await this.createBulkNotifications([
      ...notifications24h,
      ...notifications1h,
    ]);
  }

  async createMissedLectureNotification(
    lectureId: string,
    studentId: string
  ): Promise<void> {
    // Get lecture details
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select(
        `
        *,
        course:courses(name, code)
      `
      )
      .eq('id', lectureId)
      .single();

    if (lectureError) {
      console.error('Failed to get lecture details:', lectureError);
      return;
    }

    await this.createNotification({
      recipient_id: studentId,
      title: 'Missed Lecture',
      message: `You missed the lecture "${lecture.title}" for ${lecture.course.code}. Please contact your instructor for any materials or assignments.`,
      type: 'lecture_missed',
      related_id: lectureId,
      related_type: 'lecture',
    });
  }

  async createMissedExamNotification(
    examId: string,
    studentId: string
  ): Promise<void> {
    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select(
        `
        *,
        course:courses(name, code)
      `
      )
      .eq('id', examId)
      .single();

    if (examError) {
      console.error('Failed to get exam details:', examError);
      return;
    }

    await this.createNotification({
      recipient_id: studentId,
      title: 'Missed Exam',
      message: `You missed the exam "${exam.title}" for ${exam.course.code}. Please contact the administration immediately to discuss makeup options.`,
      type: 'exam_missed',
      related_id: examId,
      related_type: 'exam',
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }
}

export const databaseNotificationService = new DatabaseNotificationService();
