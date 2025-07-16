import { supabase } from '@/lib/supabase';
import {
  Lecture,
  LectureBatch,
  LectureWithDetails,
  LectureBatchWithDetails,
  Course,
  Attendance,
  LectureReview,
  LectureNote,
  Profile,
  Teacher,
  Student,
} from '@/types/database-new';

interface LectureFormData {
  subject: string;
  topic: string;
  chapter?: string;
  courseId: string;
  scheduledAt?: string;
  duration?: number;
  notes?: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

interface ReviewData {
  reviewerId: string;
  role: 'student' | 'teacher' | 'staff';
  comment?: string;
}

class LecturesManagementService {
  // Lecture Management
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
          created_at
        ),
        batches:lecture_batches(
          id,
          scheduled_at,
          status,
          notes,
          end_time,
          created_at
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch lectures: ${error.message}`);
    return data || [];
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
          created_at
        ),
        batches:lecture_batches(
          id,
          scheduled_at,
          status,
          notes,
          end_time,
          created_at
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch lecture: ${error.message}`);
    }
    return data;
  }

  async createLecture(lectureData: LectureFormData): Promise<Lecture> {
    const { data, error } = await supabase
      .from('lectures')
      .insert({
        subject: lectureData.subject,
        topic: lectureData.topic,
        chapter: lectureData.chapter,
        course_id: lectureData.courseId,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create lecture: ${error.message}`);
    return data;
  }

  async updateLecture(
    id: string,
    updates: Partial<LectureFormData>
  ): Promise<Lecture> {
    const { data, error } = await supabase
      .from('lectures')
      .update({
        subject: updates.subject,
        topic: updates.topic,
        chapter: updates.chapter,
        course_id: updates.courseId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update lecture: ${error.message}`);
    return data;
  }

  async deleteLecture(id: string): Promise<void> {
    const { error } = await supabase.from('lectures').delete().eq('id', id);

    if (error) throw new Error(`Failed to delete lecture: ${error.message}`);
  }

  // Lecture Batch Management
  async createLectureBatch(
    lectureId: string,
    scheduledAt: string,
    notes?: string
  ): Promise<LectureBatch> {
    // First, get the lecture to find the course
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select('course_id')
      .eq('id', lectureId)
      .single();

    if (lectureError)
      throw new Error(`Failed to fetch lecture: ${lectureError.message}`);

    const { data, error } = await supabase
      .from('lecture_batches')
      .insert({
        lecture_id: lectureId,
        scheduled_at: scheduledAt,
        status: 'scheduled',
        notes,
      })
      .select()
      .single();

    if (error)
      throw new Error(`Failed to create lecture batch: ${error.message}`);

    // Auto-enroll students for attendance
    try {
      await this.autoEnrollStudentsForBatch(data.id, lecture.course_id);
    } catch (enrollError) {
      console.warn('Failed to auto-enroll students:', enrollError);
    }

    return data;
  }

  async getLectureBatches(
    lectureId: string
  ): Promise<LectureBatchWithDetails[]> {
    const { data, error } = await supabase
      .from('lecture_batches')
      .select(
        `
        *,
        lecture:lectures(
          id,
          subject,
          topic,
          chapter,
          course:courses(
            id,
            name,
            code
          )
        ),
        attendances(
          id,
          student_id,
          status,
          recorded_at,
          recorded_by,
          student:profiles!student_id(
            id,
            full_name,
            students(
              roll
            )
          )
        ),
        reviews:lecture_reviews(
          id,
          reviewer_id,
          role,
          comment,
          reviewed_at,
          reviewer:profiles!reviewer_id(
            id,
            full_name
          )
        ),
        lecture_notes(
          id,
          file_url,
          uploaded_at,
          uploaded_by,
          uploader:profiles!uploaded_by(
            id,
            full_name
          )
        )
      `
      )
      .eq('lecture_id', lectureId)
      .order('scheduled_at', { ascending: false });

    if (error)
      throw new Error(`Failed to fetch lecture batches: ${error.message}`);

    // Calculate attendance statistics
    const batchesWithStats = (data || []).map((batch) => {
      const attendances = batch.attendances || [];
      const total = attendances.length;
      const present = attendances.filter(
        (a: Attendance) => a.status === 'present'
      ).length;
      const late = attendances.filter(
        (a: Attendance) => a.status === 'late'
      ).length;
      const absent = attendances.filter(
        (a: Attendance) => a.status === 'absent'
      ).length;
      const excused = attendances.filter(
        (a: Attendance) => a.status === 'excused'
      ).length;

      return {
        ...batch,
        attendance_count: total,
        attendance_rate: total > 0 ? ((present + late) / total) * 100 : 0,
        attendance_stats: {
          total,
          present,
          late,
          absent,
          excused,
        },
      };
    });

    return batchesWithStats;
  }

  async getBatchById(batchId: string): Promise<LectureBatchWithDetails | null> {
    const { data, error } = await supabase
      .from('lecture_batches')
      .select(
        `
        *,
        lecture:lectures(
          id,
          subject,
          topic,
          chapter,
          course:courses(
            id,
            name,
            code
          )
        ),
        attendances(
          id,
          student_id,
          status,
          recorded_at,
          recorded_by,
          student:profiles!student_id(
            id,
            full_name,
            students(
              roll
            )
          )
        ),
        reviews:lecture_reviews(
          id,
          reviewer_id,
          role,
          comment,
          reviewed_at,
          reviewer:profiles!reviewer_id(
            id,
            full_name
          )
        ),
        notes:lecture_notes(
          id,
          file_url,
          uploaded_at,
          uploaded_by,
          uploader:profiles!uploaded_by(
            id,
            full_name
          )
        )
      `
      )
      .eq('id', batchId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch batch: ${error.message}`);
    }

    // Calculate attendance statistics
    const attendances = data.attendances || [];
    const total = attendances.length;
    const present = attendances.filter(
      (a: Attendance) => a.status === 'present'
    ).length;
    const late = attendances.filter(
      (a: Attendance) => a.status === 'late'
    ).length;
    const absent = attendances.filter(
      (a: Attendance) => a.status === 'absent'
    ).length;
    const excused = attendances.filter(
      (a: Attendance) => a.status === 'excused'
    ).length;

    return {
      ...data,
      attendance_count: total,
      attendance_rate: total > 0 ? ((present + late) / total) * 100 : 0,
      attendance_stats: {
        total,
        present,
        late,
        absent,
        excused,
      },
    };
  }

  async updateBatchStatus(
    batchId: string,
    status: 'scheduled' | 'completed' | 'postponed' | 'cancelled' | 'not_held',
    notes?: string,
    endTime?: string
  ): Promise<LectureBatch> {
    const { data, error } = await supabase
      .from('lecture_batches')
      .update({
        status,
        notes,
        end_time: endTime,
      })
      .eq('id', batchId)
      .select()
      .single();

    if (error)
      throw new Error(`Failed to update batch status: ${error.message}`);
    return data;
  }

  // Attendance Management
  async markAttendance(
    batchId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
    recordedBy: string
  ): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendances')
      .upsert(
        {
          batch_id: batchId,
          student_id: studentId,
          status,
          recorded_by: recordedBy,
          recorded_at: new Date().toISOString(),
        },
        {
          onConflict: 'batch_id,student_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to mark attendance: ${error.message}`);
    return data;
  }

  async bulkMarkAttendance(
    batchId: string,
    attendanceRecords: AttendanceRecord[],
    recordedBy: string
  ): Promise<Attendance[]> {
    const records = attendanceRecords.map((record) => ({
      batch_id: batchId,
      student_id: record.studentId,
      status: record.status,
      recorded_by: recordedBy,
      recorded_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('attendances')
      .upsert(records)
      .select();

    if (error)
      throw new Error(`Failed to bulk mark attendance: ${error.message}`);
    return data || [];
  }

  async getAttendanceForBatch(batchId: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select(
        `
        *,
        student:profiles!student_id(
          id,
          full_name,
          students(
            roll
          )
        )
      `
      )
      .eq('batch_id', batchId)
      .order('recorded_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch attendance: ${error.message}`);

    // Remove duplicates based on student_id (keep the most recent one)
    const uniqueAttendances = (data || []).reduce(
      (acc: Attendance[], current: Attendance) => {
        const existingIndex = acc.findIndex(
          (item: Attendance) => item.student_id === current.student_id
        );
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Keep the most recent one
          if (
            new Date(current.recorded_at) >
            new Date(acc[existingIndex].recorded_at)
          ) {
            acc[existingIndex] = current;
          }
        }
        return acc;
      },
      [] as Attendance[]
    );

    return uniqueAttendances;
  }

  async getStudentAttendance(studentId: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select(
        `
        *,
        batch:lecture_batches!batch_id(
          id,
          scheduled_at,
          lecture:lectures(
            id,
            subject,
            topic,
            course:courses(
              id,
              name,
              code
            )
          )
        )
      `
      )
      .eq('student_id', studentId)
      .order('recorded_at', { ascending: false });

    if (error)
      throw new Error(`Failed to fetch student attendance: ${error.message}`);
    return data || [];
  }

  // Review Management
  async addReview(
    batchId: string,
    reviewData: ReviewData
  ): Promise<LectureReview> {
    const { data, error } = await supabase
      .from('lecture_reviews')
      .insert({
        batch_id: batchId,
        reviewer_id: reviewData.reviewerId,
        role: reviewData.role,
        comment: reviewData.comment,
        reviewed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add review: ${error.message}`);
    return data;
  }

  async getReviewsForBatch(batchId: string): Promise<LectureReview[]> {
    const { data, error } = await supabase
      .from('lecture_reviews')
      .select(
        `
        *,
        reviewer:profiles!reviewer_id(
          id,
          full_name
        )
      `
      )
      .eq('batch_id', batchId)
      .order('reviewed_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch reviews: ${error.message}`);
    return data || [];
  }

  async deleteReview(reviewId: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw new Error(`Failed to delete review: ${error.message}`);
  }

  // Utility functions
  async getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
    return data || [];
  }

  async getEnrolledStudents(courseId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(
        `
        student:profiles!student_id(
          id,
          full_name,
          students(
            roll
          )
        )
      `
      )
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (error)
      throw new Error(`Failed to fetch enrolled students: ${error.message}`);
    return data?.map((item: any) => item.student).filter(Boolean) || [];
  }

  async getTeachers(): Promise<(Teacher & { profile: Profile })[]> {
    const { data, error } = await supabase.from('teachers').select(
      `
        *,
        profile:profiles(
          id,
          full_name
        )
      `
    );

    if (error) throw new Error(`Failed to fetch teachers: ${error.message}`);
    return data || [];
  }

  // Statistics
  async getLectureStats(): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    averageAttendance: number;
  }> {
    const { data: batches, error } = await supabase.from('lecture_batches')
      .select(`
        status,
        attendances(status)
      `);

    if (error)
      throw new Error(`Failed to fetch lecture stats: ${error.message}`);

    const total = batches?.length || 0;
    const scheduled =
      batches?.filter((b) => b.status === 'scheduled').length || 0;
    const completed =
      batches?.filter((b) => b.status === 'completed').length || 0;
    const cancelled =
      batches?.filter((b) => b.status === 'cancelled').length || 0;

    // Calculate average attendance
    let totalAttendance = 0;
    let totalStudents = 0;

    batches?.forEach((batch) => {
      const attendances = batch.attendances || [];
      const present = attendances.filter(
        (a: any) => a.status === 'present' || a.status === 'late'
      ).length;
      totalAttendance += present;
      totalStudents += attendances.length;
    });

    const averageAttendance =
      totalStudents > 0 ? (totalAttendance / totalStudents) * 100 : 0;

    return {
      total,
      scheduled,
      completed,
      cancelled,
      averageAttendance,
    };
  }

  // Lecture Notes Management
  async uploadLectureNotes(
    batchId: string,
    fileUrl: string,
    uploadedBy: string
  ): Promise<LectureNote> {
    const { data, error } = await supabase
      .from('lecture_notes')
      .insert({
        batch_id: batchId,
        file_url: fileUrl,
        uploaded_by: uploadedBy,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error)
      throw new Error(`Failed to upload lecture notes: ${error.message}`);
    return data;
  }

  async getNotesForBatch(batchId: string): Promise<LectureNote[]> {
    const { data, error } = await supabase
      .from('lecture_notes')
      .select(
        `
        *,
        uploader:profiles!uploaded_by(
          id,
          full_name
        )
      `
      )
      .eq('batch_id', batchId)
      .order('uploaded_at', { ascending: false });

    if (error)
      throw new Error(`Failed to fetch lecture notes: ${error.message}`);
    return data || [];
  }

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
      .from('lecture_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw new Error(`Failed to delete note: ${error.message}`);
  }

  // Auto-enroll students to batch for attendance
  async autoEnrollStudentsForBatch(
    batchId: string,
    courseId: string
  ): Promise<Attendance[]> {
    // First check if attendance records already exist for this batch
    const { data: existingAttendances, error: existingError } = await supabase
      .from('attendances')
      .select('student_id')
      .eq('batch_id', batchId);

    if (existingError) {
      throw new Error(
        `Failed to check existing attendance: ${existingError.message}`
      );
    }

    // If attendance records already exist, don't create new ones
    if (existingAttendances && existingAttendances.length > 0) {
      return existingAttendances as Attendance[];
    }

    // Get all enrolled students for the course
    const { data: enrollments, error: enrollError } = await supabase
      .from('course_enrollments')
      .select('student_id')
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (enrollError)
      throw new Error(
        `Failed to fetch enrolled students: ${enrollError.message}`
      );

    if (!enrollments || enrollments.length === 0) {
      return [];
    }

    // Create attendance records for all enrolled students
    const attendanceRecords = enrollments.map((enrollment) => ({
      batch_id: batchId,
      student_id: enrollment.student_id,
      status: 'absent' as const, // Default to absent
      recorded_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('attendances')
      .insert(attendanceRecords)
      .select();

    if (error)
      throw new Error(`Failed to create attendance records: ${error.message}`);
    return data || [];
  }
}

export const lecturesManagementService = new LecturesManagementService();
