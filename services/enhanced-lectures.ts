import { supabase } from '@/lib/supabase';
import { LectureWithDetails } from '@/types/database-new';
import { databaseNotificationService } from './database-notifications';

class EnhancedLectureService {
  async getAllLectures(): Promise<LectureWithDetails[]> {
    const { data, error } = await supabase
      .from('lectures')
      .select(
        `
        *,
        course:courses(
          id,
          name,
          code,
          department
        ),
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getLecturesForStudent(
    studentId: string
  ): Promise<LectureWithDetails[]> {
    const { data, error } = await supabase
      .from('lectures')
      .select(
        `
        *,
        course:courses!inner(
          id,
          name,
          code,
          department,
          course_enrollments!inner(
            student_id
          )
        ),
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq('course.course_enrollments.student_id', studentId)
      .eq('course.course_enrollments.status', 'active')
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getLecturesByFilter(filters: {
    courseId?: string;
    instructorId?: string;
    startDate?: string;
    endDate?: string;
    studentId?: string;
  }): Promise<LectureWithDetails[]> {
    let query = supabase.from('lectures').select(`
        *,
        course:courses(
          id,
          name,
          code,
          department
        ),
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        )
      `);

    if (filters.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    if (filters.instructorId) {
      query = query.eq('instructor_id', filters.instructorId);
    }

    if (filters.startDate) {
      query = query.gte('scheduled_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('scheduled_at', filters.endDate);
    }

    if (filters.studentId) {
      // Filter by courses the student is enrolled in
      query = query
        .eq('course.course_enrollments.student_id', filters.studentId)
        .eq('course.course_enrollments.status', 'active');
    }

    const { data, error } = await query.order('scheduled_at', {
      ascending: false,
    });

    if (error) throw error;
    return data;
  }

  async getLectureById(id: string): Promise<LectureWithDetails | null> {
    const { data, error } = await supabase
      .from('lectures')
      .select(
        `
        *,
        course:courses(
          id,
          name,
          code,
          department
        ),
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        ),
        attendance(
          id,
          student_id,
          status,
          student:user_profiles!student_id(
            first_name,
            last_name
          )
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    // Calculate attendance stats
    if (data.attendance) {
      const total = data.attendance.length;
      const present = data.attendance.filter(
        (a) => a.status === 'present' || a.status === 'late'
      ).length;
      data.attendance_count = total;
      data.attendance_rate = total > 0 ? (present / total) * 100 : 0;
    }

    return data;
  }

  async createLecture(lecture: {
    title: string;
    description?: string;
    scheduled_at: string;
    course_id: string;
    instructor_id?: string;
    duration_minutes?: number;
    location?: string;
    is_mandatory?: boolean;
  }): Promise<LectureWithDetails> {
    const { data, error } = await supabase
      .from('lectures')
      .insert({
        ...lecture,
        duration_minutes: lecture.duration_minutes || 60,
        is_mandatory: lecture.is_mandatory ?? true,
      })
      .select(
        `
        *,
        course:courses(
          id,
          name,
          code,
          department
        ),
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (error) throw error;

    // Schedule reminder notifications for enrolled students
    await this.scheduleReminders(data.id, data.course_id);

    return data;
  }

  async updateLecture(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      scheduled_at: string;
      course_id: string;
      instructor_id: string;
      duration_minutes: number;
      location: string;
      is_mandatory: boolean;
    }>
  ): Promise<LectureWithDetails> {
    const { data, error } = await supabase
      .from('lectures')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        course:courses(
          id,
          name,
          code,
          department
        ),
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (error) throw error;

    // If scheduled time changed, update reminders
    if (updates.scheduled_at) {
      await this.scheduleReminders(id, data.course_id);
    }

    return data;
  }

  async deleteLecture(id: string): Promise<void> {
    const { error } = await supabase.from('lectures').delete().eq('id', id);

    if (error) throw error;
  }

  async getUpcomingLectures(
    studentId?: string,
    limit: number = 10
  ): Promise<LectureWithDetails[]> {
    const now = new Date().toISOString();

    let query = supabase
      .from('lectures')
      .select(
        `
        *,
        course:courses(
          id,
          name,
          code,
          department
        ),
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .gte('scheduled_at', now);

    if (studentId) {
      query = query
        .eq('course.course_enrollments.student_id', studentId)
        .eq('course.course_enrollments.status', 'active');
    }

    const { data, error } = await query
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  private async scheduleReminders(
    lectureId: string,
    courseId: string
  ): Promise<void> {
    try {
      // Get enrolled students
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('student_id')
        .eq('course_id', courseId)
        .eq('status', 'active');

      if (error) {
        console.error('Failed to get enrolled students:', error);
        return;
      }

      const studentIds = enrollments.map((e) => e.student_id);
      if (studentIds.length > 0) {
        await databaseNotificationService.createLectureReminder(
          lectureId,
          studentIds
        );
      }
    } catch (error) {
      console.error('Failed to schedule lecture reminders:', error);
    }
  }

  async getLectureCount(): Promise<number> {
    const { count, error } = await supabase
      .from('lectures')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  async getLectureCountForStudent(studentId: string): Promise<number> {
    const { count, error } = await supabase
      .from('lectures')
      .select('*', { count: 'exact', head: true })
      .eq('course.course_enrollments.student_id', studentId)
      .eq('course.course_enrollments.status', 'active');

    if (error) throw error;
    return count || 0;
  }
}

export const enhancedLectureService = new EnhancedLectureService();
