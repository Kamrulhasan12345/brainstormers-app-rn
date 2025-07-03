import { supabase } from '@/lib/supabase';
import { Attendance, ExamAttendance } from '@/types/database-new';
import { databaseNotificationService } from './database-notifications';

class AttendanceService {
  // Lecture Attendance
  async markLectureAttendance(
    lectureId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
    markedBy: string,
    notes?: string
  ): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        lecture_id: lectureId,
        student_id: studentId,
        status,
        marked_by: markedBy,
        marked_at: new Date().toISOString(),
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification if student missed lecture
    if (status === 'absent') {
      await databaseNotificationService.createMissedLectureNotification(
        lectureId,
        studentId
      );
    }

    return data;
  }

  async bulkMarkLectureAttendance(
    lectureId: string,
    attendanceRecords: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'late' | 'excused';
      notes?: string;
    }>,
    markedBy: string
  ): Promise<Attendance[]> {
    const now = new Date().toISOString();
    const records = attendanceRecords.map((record) => ({
      lecture_id: lectureId,
      student_id: record.studentId,
      status: record.status,
      marked_by: markedBy,
      marked_at: now,
      notes: record.notes,
    }));

    const { data, error } = await supabase
      .from('attendance')
      .upsert(records)
      .select();

    if (error) throw error;

    // Send notifications for missed lectures
    const missedStudents = attendanceRecords
      .filter((record) => record.status === 'absent')
      .map((record) => record.studentId);

    for (const studentId of missedStudents) {
      await databaseNotificationService.createMissedLectureNotification(
        lectureId,
        studentId
      );
    }

    return data;
  }

  async getLectureAttendance(
    lectureId: string
  ): Promise<(Attendance & { student: any })[]> {
    const { data, error } = await supabase
      .from('attendance')
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
      .eq('lecture_id', lectureId);

    if (error) throw error;
    return data;
  }

  async getStudentLectureAttendance(
    studentId: string,
    courseId?: string
  ): Promise<(Attendance & { lecture: any })[]> {
    let query = supabase
      .from('attendance')
      .select(
        `
        *,
        lecture:lectures(
          id,
          title,
          scheduled_at,
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
      query = query.eq('lecture.course_id', courseId);
    }

    const { data, error } = await query.order('lecture.scheduled_at', {
      ascending: false,
    });

    if (error) throw error;
    return data;
  }

  // Exam Attendance
  async markExamAttendance(
    examId: string,
    studentId: string,
    status: 'present' | 'absent' | 'excused',
    markedBy: string,
    marksObtained?: number,
    notes?: string
  ): Promise<ExamAttendance> {
    const { data, error } = await supabase
      .from('exam_attendance')
      .upsert({
        exam_id: examId,
        student_id: studentId,
        status,
        marked_by: markedBy,
        marked_at: new Date().toISOString(),
        marks_obtained: marksObtained,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification if student missed exam
    if (status === 'absent') {
      await databaseNotificationService.createMissedExamNotification(
        examId,
        studentId
      );
    }

    return data;
  }

  async bulkMarkExamAttendance(
    examId: string,
    attendanceRecords: Array<{
      studentId: string;
      status: 'present' | 'absent' | 'excused';
      marksObtained?: number;
      notes?: string;
    }>,
    markedBy: string
  ): Promise<ExamAttendance[]> {
    const now = new Date().toISOString();
    const records = attendanceRecords.map((record) => ({
      exam_id: examId,
      student_id: record.studentId,
      status: record.status,
      marked_by: markedBy,
      marked_at: now,
      marks_obtained: record.marksObtained,
      notes: record.notes,
    }));

    const { data, error } = await supabase
      .from('exam_attendance')
      .upsert(records)
      .select();

    if (error) throw error;

    // Send notifications for missed exams
    const missedStudents = attendanceRecords
      .filter((record) => record.status === 'absent')
      .map((record) => record.studentId);

    for (const studentId of missedStudents) {
      await databaseNotificationService.createMissedExamNotification(
        examId,
        studentId
      );
    }

    return data;
  }

  async getExamAttendance(
    examId: string
  ): Promise<(ExamAttendance & { student: any })[]> {
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
      .eq('exam_id', examId);

    if (error) throw error;
    return data;
  }

  async getStudentExamAttendance(
    studentId: string,
    courseId?: string
  ): Promise<(ExamAttendance & { exam: any })[]> {
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

  // Statistics
  async getLectureAttendanceStats(lectureId: string): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  }> {
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('lecture_id', lectureId);

    if (error) throw error;

    const stats = {
      total: data.length,
      present: data.filter((a) => a.status === 'present').length,
      absent: data.filter((a) => a.status === 'absent').length,
      late: data.filter((a) => a.status === 'late').length,
      excused: data.filter((a) => a.status === 'excused').length,
      attendanceRate: 0,
    };

    stats.attendanceRate =
      stats.total > 0 ? ((stats.present + stats.late) / stats.total) * 100 : 0;

    return stats;
  }

  async getStudentAttendanceStats(
    studentId: string,
    courseId?: string
  ): Promise<{
    lectureStats: {
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendanceRate: number;
    };
    examStats: {
      total: number;
      present: number;
      absent: number;
      excused: number;
      averageMarks: number;
    };
  }> {
    // Get lecture attendance
    let lectureQuery = supabase
      .from('attendance')
      .select('status, lecture:lectures(course_id)')
      .eq('student_id', studentId);

    if (courseId) {
      lectureQuery = lectureQuery.eq('lecture.course_id', courseId);
    }

    const { data: lectureData, error: lectureError } = await lectureQuery;
    if (lectureError) throw lectureError;

    // Get exam attendance
    let examQuery = supabase
      .from('exam_attendance')
      .select('status, marks_obtained, exam:exams(course_id)')
      .eq('student_id', studentId);

    if (courseId) {
      examQuery = examQuery.eq('exam.course_id', courseId);
    }

    const { data: examData, error: examError } = await examQuery;
    if (examError) throw examError;

    const lectureStats = {
      total: lectureData.length,
      present: lectureData.filter((a) => a.status === 'present').length,
      absent: lectureData.filter((a) => a.status === 'absent').length,
      late: lectureData.filter((a) => a.status === 'late').length,
      excused: lectureData.filter((a) => a.status === 'excused').length,
      attendanceRate: 0,
    };

    lectureStats.attendanceRate =
      lectureStats.total > 0
        ? ((lectureStats.present + lectureStats.late) / lectureStats.total) *
          100
        : 0;

    const examStats = {
      total: examData.length,
      present: examData.filter((a) => a.status === 'present').length,
      absent: examData.filter((a) => a.status === 'absent').length,
      excused: examData.filter((a) => a.status === 'excused').length,
      averageMarks: 0,
    };

    const marksArray = examData
      .filter((a) => a.status === 'present' && a.marks_obtained !== null)
      .map((a) => a.marks_obtained);

    examStats.averageMarks =
      marksArray.length > 0
        ? marksArray.reduce((sum, marks) => sum + marks, 0) / marksArray.length
        : 0;

    return { lectureStats, examStats };
  }
}

export const attendanceService = new AttendanceService();
