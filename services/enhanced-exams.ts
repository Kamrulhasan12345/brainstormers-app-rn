import { supabase } from '@/lib/supabase';
import { ExamWithDetails } from '@/types/database-new';
import { databaseNotificationService } from './database-notifications';

class EnhancedExamService {
  async getAllExams(): Promise<ExamWithDetails[]> {
    const { data, error } = await supabase
      .from('exams')
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

  async getExamsForStudent(studentId: string): Promise<ExamWithDetails[]> {
    const { data, error } = await supabase
      .from('exams')
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

  async getExamsByFilter(filters: {
    courseId?: string;
    instructorId?: string;
    startDate?: string;
    endDate?: string;
    studentId?: string;
  }): Promise<ExamWithDetails[]> {
    let query = supabase.from('exams').select(`
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

  async getExamById(id: string): Promise<ExamWithDetails | null> {
    const { data, error } = await supabase
      .from('exams')
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
        exam_attendance(
          id,
          student_id,
          status,
          marks_obtained,
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

    // Calculate exam stats
    if (data.exam_attendance) {
      const total = data.exam_attendance.length;
      const present = data.exam_attendance.filter(
        (a) => a.status === 'present'
      ).length;
      const marksArray = data.exam_attendance
        .filter((a) => a.status === 'present' && a.marks_obtained !== null)
        .map((a) => a.marks_obtained);

      data.attendance_count = total;
      data.average_marks =
        marksArray.length > 0
          ? marksArray.reduce((sum, marks) => sum + marks, 0) /
            marksArray.length
          : 0;
    }

    return data;
  }

  async createExam(exam: {
    title: string;
    description?: string;
    scheduled_at: string;
    course_id: string;
    instructor_id?: string;
    duration_minutes?: number;
    location?: string;
    total_marks?: number;
    passing_marks?: number;
  }): Promise<ExamWithDetails> {
    const { data, error } = await supabase
      .from('exams')
      .insert({
        ...exam,
        duration_minutes: exam.duration_minutes || 180,
        total_marks: exam.total_marks || 100,
        passing_marks: exam.passing_marks || 40,
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

  async updateExam(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      scheduled_at: string;
      course_id: string;
      instructor_id: string;
      duration_minutes: number;
      location: string;
      total_marks: number;
      passing_marks: number;
    }>
  ): Promise<ExamWithDetails> {
    const { data, error } = await supabase
      .from('exams')
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

  async deleteExam(id: string): Promise<void> {
    const { error } = await supabase.from('exams').delete().eq('id', id);

    if (error) throw error;
  }

  async getUpcomingExams(
    studentId?: string,
    limit: number = 10
  ): Promise<ExamWithDetails[]> {
    const now = new Date().toISOString();

    let query = supabase
      .from('exams')
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
    examId: string,
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
        await databaseNotificationService.createExamReminder(
          examId,
          studentIds
        );
      }
    } catch (error) {
      console.error('Failed to schedule exam reminders:', error);
    }
  }

  async getExamCount(): Promise<number> {
    const { count, error } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  async getExamCountForStudent(studentId: string): Promise<number> {
    const { count, error } = await supabase
      .from('exams')
      .select('*', { count: 'exact', head: true })
      .eq('course.course_enrollments.student_id', studentId)
      .eq('course.course_enrollments.status', 'active');

    if (error) throw error;
    return count || 0;
  }

  async getExamResults(examId: string) {
    const { data, error } = await supabase
      .from('exam_attendance')
      .select(
        `
        *,
        student:user_profiles!student_id(
          id,
          first_name,
          last_name,
          email
        ),
        student_profile:student_profiles!student_id(
          student_id
        )
      `
      )
      .eq('exam_id', examId)
      .order('marks_obtained', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getStudentExamHistory(studentId: string, courseId?: string) {
    let query = supabase
      .from('exam_attendance')
      .select(
        `
        *,
        exam:exams(
          id,
          title,
          scheduled_at,
          total_marks,
          passing_marks,
          course:courses(
            id,
            name,
            code
          )
        )
      `
      )
      .eq('student_id', studentId);

    if (courseId) {
      query = query.eq('exam.course_id', courseId);
    }

    const { data, error } = await query.order('exam.scheduled_at', {
      ascending: false,
    });

    if (error) throw error;
    return data;
  }
}

export const enhancedExamService = new EnhancedExamService();
