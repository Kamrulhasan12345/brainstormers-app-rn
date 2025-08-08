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
  averageAttendanceRate: number; // Overall lecture attendance (for backward compatibility)
  // Today's specific stats
  todayScheduledLectures: number;
  todayCompletedLectures: number;
  todayLectureAttendance: number; // Today's lecture attendance
  todayExamAttendance: number; // Today's exam attendance
  todayScheduledExams: number;
  todayCompletedExams: number;
}

class AdminStatsService {
  async getAdminStatistics(): Promise<AdminStatistics> {
    try {
      const [
        students,
        lectureStats,
        exams,
        upcomingExamsCount,
        todayLectureStats,
        todayExamStats,
      ] = await Promise.all([
        this.getTotalStudents(),
        this.getLectureStatistics(),
        this.getExamStatistics(),
        this.getUpcomingExamsCount(),
        this.getTodayLectureStatistics(),
        this.getTodayExamStatistics(),
      ]);

      return {
        totalStudents: students,
        totalLectures: lectureStats.total,
        upcomingExams: upcomingExamsCount,
        completedLectures: lectureStats.completed,
        scheduledLectures: lectureStats.scheduled,
        totalExams: exams.total,
        completedExams: exams.completed,
        averageAttendanceRate: lectureStats.averageAttendance, // Backward compatibility
        // Today's specific stats
        todayScheduledLectures: todayLectureStats.scheduledToday,
        todayCompletedLectures: todayLectureStats.completedToday,
        todayLectureAttendance: todayLectureStats.averageAttendanceToday,
        todayExamAttendance: todayExamStats.averageAttendanceToday,
        todayScheduledExams: todayExamStats.scheduledToday,
        todayCompletedExams: todayExamStats.completedToday,
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

  async getTodayLectureStatistics(): Promise<{
    scheduledToday: number;
    completedToday: number;
    averageAttendanceToday: number;
  }> {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      // Get today's lecture batches with their status and attendances
      const { data: todayBatches, error } = await supabase
        .from('lecture_batches')
        .select(
          `
          status,
          attendances(status)
        `
        )
        .gte('scheduled_at', startOfDay.toISOString())
        .lt('scheduled_at', endOfDay.toISOString());

      if (error) throw error;

      console.log('ksjd');

      const scheduledToday =
        todayBatches?.filter(
          (b) => b.status === 'scheduled' || b.status === 'completed'
        ).length || 0;

      const completedToday =
        todayBatches?.filter((b) => b.status === 'completed').length || 0;

      // Calculate today's average attendance
      let totalAttendanceToday = 0;
      let totalStudentsToday = 0;

      todayBatches?.forEach((batch) => {
        const attendances = batch.attendances || [];
        const present = attendances.filter(
          (a: any) => a.status === 'present' || a.status === 'late'
        ).length;
        totalAttendanceToday += present;
        totalStudentsToday += attendances.length;
      });

      const averageAttendanceToday =
        totalStudentsToday > 0
          ? (totalAttendanceToday / totalStudentsToday) * 100
          : 0;

      return {
        scheduledToday,
        completedToday,
        averageAttendanceToday,
      };
    } catch (error) {
      console.error('Error fetching today lecture statistics:', error);
      return {
        scheduledToday: 0,
        completedToday: 0,
        averageAttendanceToday: 0,
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

  async getTodayExamStatistics(): Promise<{
    scheduledToday: number;
    completedToday: number;
    averageAttendanceToday: number;
  }> {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1
      );

      // Get today's exam batches with their status and exam attendances
      const { data: todayExamBatches, error } = await supabase
        .from('exam_batches')
        .select(
          `
          status,
          scheduled_end,
          exam_attendances(status)
        `
        )
        .gte('scheduled_start', startOfDay.toISOString())
        .lt('scheduled_start', endOfDay.toISOString());

      if (error) throw error;

      const scheduledToday =
        todayExamBatches?.filter(
          (b) => b.status === 'scheduled' || b.status === 'completed'
        ).length || 0;

      const completedToday =
        todayExamBatches?.filter(
          (b: any) =>
            b.status === 'completed' || new Date(b.scheduled_end) < today
        ).length || 0;

      // Calculate today's exam attendance
      let totalExamAttendanceToday = 0;
      let totalExamStudentsToday = 0;

      todayExamBatches?.forEach((batch) => {
        const attendances = batch.exam_attendances || [];
        const present = attendances.filter(
          (a: any) => a.status === 'present' || a.status === 'late'
        ).length;
        totalExamAttendanceToday += present;
        totalExamStudentsToday += attendances.length;
      });

      const averageAttendanceToday =
        totalExamStudentsToday > 0
          ? (totalExamAttendanceToday / totalExamStudentsToday) * 100
          : 0;

      return {
        scheduledToday,
        completedToday,
        averageAttendanceToday,
      };
    } catch (error) {
      console.error('Error fetching today exam statistics:', error);
      return {
        scheduledToday: 0,
        completedToday: 0,
        averageAttendanceToday: 0,
      };
    }
  }

  // Efficient method to get overall attendance rates for both lectures and exams
  async getOverallAttendanceRates(): Promise<{
    lectureAttendanceRate: number;
    examAttendanceRate: number;
  }> {
    try {
      // Get all lecture and exam attendances in parallel for efficiency
      const [lectureAttendances, examAttendances] = await Promise.all([
        supabase.from('attendances').select('status'),
        supabase.from('exam_attendances').select('status'),
      ]);

      // Calculate lecture attendance rate
      const totalLectureAttendances = lectureAttendances.data?.length || 0;
      const presentLectureAttendances =
        lectureAttendances.data?.filter(
          (a) => a.status === 'present' || a.status === 'late'
        ).length || 0;

      const lectureAttendanceRate =
        totalLectureAttendances > 0
          ? (presentLectureAttendances / totalLectureAttendances) * 100
          : 0;

      // Calculate exam attendance rate
      const totalExamAttendances = examAttendances.data?.length || 0;
      const presentExamAttendances =
        examAttendances.data?.filter(
          (a) => a.status === 'present' || a.status === 'late'
        ).length || 0;

      const examAttendanceRate =
        totalExamAttendances > 0
          ? (presentExamAttendances / totalExamAttendances) * 100
          : 0;

      return {
        lectureAttendanceRate,
        examAttendanceRate,
      };
    } catch (error) {
      console.error('Error fetching overall attendance rates:', error);
      return {
        lectureAttendanceRate: 0,
        examAttendanceRate: 0,
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
