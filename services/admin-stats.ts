import { supabase } from '@/lib/supabase';
import { lecturesManagementService } from './lectures-management';

interface AdminStatistics {
  totalStudents: number;
  totalLectures: number;
  upcomingExams: number;
  completedLectures: number;
  scheduledLectures: number;
  totalExams: number;
  completedExams: number;
  averageAttendanceRate: number;
}

class AdminStatsService {
  async getAdminStatistics(): Promise<AdminStatistics> {
    try {
      const [students, lectureStats, exams, upcomingExamsCount] =
        await Promise.all([
          this.getTotalStudents(),
          this.getLectureStatistics(),
          this.getExamStatistics(),
          this.getUpcomingExamsCount(),
        ]);

      return {
        totalStudents: students,
        totalLectures: lectureStats.total,
        upcomingExams: upcomingExamsCount,
        completedLectures: lectureStats.completed,
        scheduledLectures: lectureStats.scheduled,
        totalExams: exams.total,
        completedExams: exams.completed,
        averageAttendanceRate: lectureStats.averageAttendance,
      };
    } catch (error) {
      console.error('Error fetching admin statistics:', error);
      throw error;
    }
  }

  private async getTotalStudents(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching total students:', error);
      return 0;
    }
  }

  private async getLectureStatistics(): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    averageAttendance: number;
  }> {
    try {
      return await lecturesManagementService.getLectureStats();
    } catch (error) {
      console.error('Error fetching lecture statistics:', error);
      return {
        total: 0,
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        averageAttendance: 0,
      };
    }
  }

  private async getExamStatistics(): Promise<{
    total: number;
    completed: number;
    scheduled: number;
  }> {
    try {
      // Get all exam batches with their status
      const { data: examBatches, error } = await supabase
        .from('exam_batches')
        .select('status');

      console.log('Exam Batches Data: ', examBatches);

      if (error) throw error;

      const total = examBatches?.length || 0;
      const completed =
        examBatches?.filter((batch) => batch.status === 'completed').length ||
        0;
      const scheduled =
        examBatches?.filter((batch) => batch.status === 'scheduled').length ||
        0;

      return {
        total,
        completed,
        scheduled,
      };
    } catch (error) {
      console.error('Error fetching exam statistics:', error);
      return {
        total: 0,
        completed: 0,
        scheduled: 0,
      };
    }
  }

  private async getUpcomingExamsCount(): Promise<number> {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 7); // Next 7 days

      const { count, error } = await supabase
        .from('exam_batches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('scheduled_start', now.toISOString())
        .lte('scheduled_start', tomorrow.toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching upcoming exams:', error);
      return 0;
    }
  }

  // Additional helper methods for more detailed statistics
  async getStudentEnrollmentStats(): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    droppedEnrollments: number;
  }> {
    try {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('status');

      if (error) throw error;

      const totalEnrollments = enrollments?.length || 0;
      const activeEnrollments =
        enrollments?.filter((e) => e.status === 'active').length || 0;
      const completedEnrollments =
        enrollments?.filter((e) => e.status === 'completed').length || 0;
      const droppedEnrollments =
        enrollments?.filter((e) => e.status === 'dropped').length || 0;

      return {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        droppedEnrollments,
      };
    } catch (error) {
      console.error('Error fetching enrollment statistics:', error);
      return {
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        droppedEnrollments: 0,
      };
    }
  }

  async getAttendanceOverview(): Promise<{
    totalLectureAttendances: number;
    totalExamAttendances: number;
    presentLectureAttendances: number;
    presentExamAttendances: number;
    lectureAttendanceRate: number;
    examAttendanceRate: number;
  }> {
    try {
      const [lectureData, examData] = await Promise.all([
        supabase.from('attendances').select('status'),
        supabase.from('exam_attendances').select('status'),
      ]);

      const totalLectureAttendances = lectureData.data?.length || 0;
      const totalExamAttendances = examData.data?.length || 0;

      const presentLectureAttendances =
        lectureData.data?.filter(
          (a) => a.status === 'present' || a.status === 'late'
        ).length || 0;

      const presentExamAttendances =
        examData.data?.filter(
          (a) => a.status === 'present' || a.status === 'late'
        ).length || 0;

      const lectureAttendanceRate =
        totalLectureAttendances > 0
          ? (presentLectureAttendances / totalLectureAttendances) * 100
          : 0;

      const examAttendanceRate =
        totalExamAttendances > 0
          ? (presentExamAttendances / totalExamAttendances) * 100
          : 0;

      return {
        totalLectureAttendances,
        totalExamAttendances,
        presentLectureAttendances,
        presentExamAttendances,
        lectureAttendanceRate,
        examAttendanceRate,
      };
    } catch (error) {
      console.error('Error fetching attendance overview:', error);
      return {
        totalLectureAttendances: 0,
        totalExamAttendances: 0,
        presentLectureAttendances: 0,
        presentExamAttendances: 0,
        lectureAttendanceRate: 0,
        examAttendanceRate: 0,
      };
    }
  }

  async getCourseStatistics(): Promise<{
    totalCourses: number;
    coursesWithActiveEnrollments: number;
  }> {
    try {
      const { count: totalCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      if (coursesError) throw coursesError;

      // Get unique courses with active enrollments
      const { data: uniqueActiveCourses, error: uniqueError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('status', 'active');

      if (uniqueError) throw uniqueError;

      const coursesWithActiveEnrollments = new Set(
        uniqueActiveCourses?.map((e) => e.course_id) || []
      ).size;

      return {
        totalCourses: totalCourses || 0,
        coursesWithActiveEnrollments,
      };
    } catch (error) {
      console.error('Error fetching course statistics:', error);
      return {
        totalCourses: 0,
        coursesWithActiveEnrollments: 0,
      };
    }
  }
}

export const adminStatsService = new AdminStatsService();
