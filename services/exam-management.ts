import { supabase } from '@/lib/supabase';

export interface Exam {
  id: string;
  name: string;
  course_id: string;
  subject: string;
  chapter?: string;
  topic?: string;
  question_by?: string;
  total_marks: number;
  created_at: string;
  course?: {
    id: string;
    name: string;
    code: string;
  };
  question_by_profile?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface ExamBatch {
  id: string;
  exam_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  notes?: string;
  created_at: string;
  exam?: Exam;
}

export interface ExamAttendance {
  id: string;
  batch_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  score?: number;
  recorded_by?: string;
  recorded_at: string;
  student?: {
    id: string;
    full_name: string;
    roll?: string;
  };
}

export interface ExamReview {
  id: string;
  exam_id: string;
  reviewer_id: string;
  role: 'student' | 'teacher' | 'staff';
  comment?: string;
  reviewed_at: string;
  reviewer?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface ExamWithBatches extends Exam {
  exam_batches: ExamBatch[];
}

export interface Student {
  id: string;
  full_name: string;
  roll?: string;
}

export interface BatchAttendanceData {
  batch_id: string;
  attendances: {
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    score?: number;
  }[];
  recorded_by?: string;
}

class ExamManagementService {
  // Exam CRUD operations
  async getExams() {
    const { data, error } = await supabase
      .from('exams')
      .select(
        `
        *,
        course:courses(id, name, code),
        question_by_profile:profiles!exams_question_by_fkey(id, full_name, role)
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching exams: ${error.message}`);
    }

    return data as Exam[];
  }

  async getExamById(id: string) {
    const { data, error } = await supabase
      .from('exams')
      .select(
        `
        *,
        course:courses(id, name, code),
        question_by_profile:profiles!exams_question_by_fkey(id, full_name, role)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching exam: ${error.message}`);
    }

    return data as Exam;
  }

  async createExam(examData: {
    name: string;
    course_id: string;
    subject: string;
    chapter?: string;
    topic?: string;
    question_by?: string;
    total_marks?: number;
  }) {
    const { data, error } = await supabase
      .from('exams')
      .insert({
        ...examData,
        total_marks: examData.total_marks || 100,
      })
      .select(
        `
        *,
        course:courses(id, name, code),
        question_by_profile:profiles!exams_question_by_fkey(id, full_name, role)
      `
      )
      .single();

    if (error) {
      throw new Error(`Error creating exam: ${error.message}`);
    }

    return data as Exam;
  }

  async updateExam(
    id: string,
    updates: Partial<{
      name: string;
      course_id: string;
      subject: string;
      chapter: string;
      topic: string;
      question_by: string;
      total_marks: number;
    }>
  ) {
    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        course:courses(id, name, code),
        question_by_profile:profiles!exams_question_by_fkey(id, full_name, role)
      `
      )
      .single();

    if (error) {
      throw new Error(`Error updating exam: ${error.message}`);
    }

    return data as Exam;
  }

  async deleteExam(id: string) {
    // First, get all exam batches for this exam
    const { data: batches, error: batchesError } = await supabase
      .from('exam_batches')
      .select('id')
      .eq('exam_id', id);

    if (batchesError) {
      throw new Error(`Error fetching exam batches: ${batchesError.message}`);
    }

    // Delete all exam attendances for these batches
    if (batches && batches.length > 0) {
      const batchIds = batches.map((b) => b.id);
      const { error: attendanceError } = await supabase
        .from('exam_attendances')
        .delete()
        .in('batch_id', batchIds);

      if (attendanceError) {
        throw new Error(
          `Error deleting exam attendances: ${attendanceError.message}`
        );
      }
    }

    // Delete all exam batches
    const { error: batchError } = await supabase
      .from('exam_batches')
      .delete()
      .eq('exam_id', id);

    if (batchError) {
      throw new Error(`Error deleting exam batches: ${batchError.message}`);
    }

    // Delete all exam reviews
    const { error: reviewError } = await supabase
      .from('exam_reviews')
      .delete()
      .eq('exam_id', id);

    if (reviewError) {
      throw new Error(`Error deleting exam reviews: ${reviewError.message}`);
    }

    // Finally, delete the exam itself
    const { error } = await supabase.from('exams').delete().eq('id', id);

    if (error) {
      throw new Error(`Error deleting exam: ${error.message}`);
    }
  }

  // Exam Batches operations
  async getExamBatches(examId: string) {
    const { data, error } = await supabase
      .from('exam_batches')
      .select(
        `
        *,
        exam:exams(*)
      `
      )
      .eq('exam_id', examId)
      .order('scheduled_start', { ascending: true });

    if (error) {
      throw new Error(`Error fetching exam batches: ${error.message}`);
    }

    return data as ExamBatch[];
  }

  async getExamWithBatches(examId: string) {
    const { data, error } = await supabase
      .from('exams')
      .select(
        `
        *,
        course:courses(id, name, code),
        question_by_profile:profiles!exams_question_by_fkey(id, full_name, role),
        exam_batches(
          *,
          exam_attendances(count)
        )
      `
      )
      .eq('id', examId)
      .single();

    if (error) {
      throw new Error(`Error fetching exam with batches: ${error.message}`);
    }

    return data as ExamWithBatches;
  }

  async createExamBatch(batchData: {
    exam_id: string;
    scheduled_start: string;
    scheduled_end: string;
    status?: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('exam_batches')
      .insert({
        ...batchData,
        status: batchData.status || 'scheduled',
      })
      .select(
        `
        *,
        exam:exams(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Error creating exam batch: ${error.message}`);
    }

    return data as ExamBatch;
  }

  async updateExamBatch(
    id: string,
    updates: Partial<{
      scheduled_start: string;
      scheduled_end: string;
      status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
      notes: string;
    }>
  ) {
    const { data, error } = await supabase
      .from('exam_batches')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        exam:exams(*)
      `
      )
      .single();

    if (error) {
      throw new Error(`Error updating exam batch: ${error.message}`);
    }

    return data as ExamBatch;
  }

  async deleteExamBatch(id: string) {
    const { error } = await supabase.from('exam_batches').delete().eq('id', id);

    if (error) {
      throw new Error(`Error deleting exam batch: ${error.message}`);
    }
  }

  // Exam Attendance operations
  async getExamAttendances(batchId: string) {
    const { data, error } = await supabase
      .from('exam_attendances')
      .select(
        `
        *,
        student:profiles!exam_attendances_student_id_fkey(
          id,
          full_name,
          students(roll)
        )
      `
      )
      .eq('batch_id', batchId)
      .order('recorded_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching exam attendances: ${error.message}`);
    }

    return data.map((attendance) => ({
      ...attendance,
      student: {
        id: attendance.student.id,
        full_name: attendance.student.full_name,
        roll: attendance.student.students?.[0]?.roll,
      },
    })) as ExamAttendance[];
  }

  async markExamAttendance(attendanceData: {
    batch_id: string;
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    score?: number;
    recorded_by?: string;
  }) {
    // Check if student already has attendance for this exam (across all batches)
    const { data: existingAttendance, error: checkError } = await supabase
      .from('exam_attendances')
      .select(
        `
        *,
        exam_batches!inner(exam_id)
      `
      )
      .eq('student_id', attendanceData.student_id)
      .eq(
        'exam_batches.exam_id',
        await this.getExamIdFromBatch(attendanceData.batch_id)
      );

    if (checkError) {
      throw new Error(
        `Error checking existing attendance: ${checkError.message}`
      );
    }

    if (existingAttendance && existingAttendance.length > 0) {
      throw new Error('Student already has attendance recorded for this exam');
    }

    const { data, error } = await supabase
      .from('exam_attendances')
      .insert(attendanceData)
      .select(
        `
        *,
        student:profiles!exam_attendances_student_id_fkey(
          id,
          full_name,
          students(roll)
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Error marking exam attendance: ${error.message}`);
    }

    return {
      ...data,
      student: {
        id: data.student.id,
        full_name: data.student.full_name,
        roll: data.student.students?.[0]?.roll,
      },
    } as ExamAttendance;
  }

  async updateExamAttendance(
    id: string,
    updates: Partial<{
      status: 'present' | 'absent' | 'late' | 'excused';
      score: number;
    }>
  ) {
    const { data, error } = await supabase
      .from('exam_attendances')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        student:profiles!exam_attendances_student_id_fkey(
          id,
          full_name,
          students(roll)
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Error updating exam attendance: ${error.message}`);
    }

    return {
      ...data,
      student: {
        id: data.student.id,
        full_name: data.student.full_name,
        roll: data.student.students?.[0]?.roll,
      },
    } as ExamAttendance;
  }

  async deleteExamAttendance(id: string) {
    const { error } = await supabase
      .from('exam_attendances')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting exam attendance: ${error.message}`);
    }
  }

  // Bulk attendance operations
  async markBatchAttendance(batchAttendanceData: BatchAttendanceData) {
    const { batch_id, attendances, recorded_by } = batchAttendanceData;

    // Get existing attendance records for this batch
    const { data: existingAttendance, error: checkError } = await supabase
      .from('exam_attendances')
      .select('id, student_id')
      .eq('batch_id', batch_id);

    if (checkError) {
      throw new Error(
        `Error checking existing attendance: ${checkError.message}`
      );
    }

    const existingStudentIds =
      existingAttendance?.map((a) => a.student_id) || [];
    const attendanceRecords = attendances.map((attendance) => ({
      batch_id,
      student_id: attendance.student_id,
      status: attendance.status,
      score: attendance.score,
      recorded_by,
    }));

    // Separate into updates and inserts
    const toUpdate = attendanceRecords.filter((record) =>
      existingStudentIds.includes(record.student_id)
    );
    const toInsert = attendanceRecords.filter(
      (record) => !existingStudentIds.includes(record.student_id)
    );

    // Update existing records
    for (const record of toUpdate) {
      const existingRecord = existingAttendance?.find(
        (a) => a.student_id === record.student_id
      );
      if (existingRecord) {
        await supabase
          .from('exam_attendances')
          .update({
            status: record.status,
            score: record.score,
            recorded_by: record.recorded_by,
          })
          .eq('id', existingRecord.id);
      }
    }

    // Insert new records
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('exam_attendances')
        .insert(toInsert);

      if (insertError) {
        throw new Error(`Error inserting attendance: ${insertError.message}`);
      }
    }

    // Get all attendance records for this batch to return
    const { data, error } = await supabase
      .from('exam_attendances')
      .select(
        `
        *,
        student:profiles!exam_attendances_student_id_fkey(
          id,
          full_name,
          students(roll)
        )
      `
      )
      .eq('batch_id', batch_id);

    if (error) {
      throw new Error(`Error marking batch attendance: ${error.message}`);
    }

    return data.map((attendance) => ({
      ...attendance,
      student: {
        id: attendance.student.id,
        full_name: attendance.student.full_name,
        roll: attendance.student.students?.[0]?.roll,
      },
    })) as ExamAttendance[];
  }

  async updateBatchAttendance(
    batchId: string,
    attendances: {
      id: string;
      status?: 'present' | 'absent' | 'late' | 'excused';
      score?: number;
    }[]
  ) {
    const updatePromises = attendances.map((attendance) =>
      this.updateExamAttendance(attendance.id, {
        status: attendance.status,
        score: attendance.score,
      })
    );

    const results = await Promise.all(updatePromises);
    return results;
  }

  async getStudentsNotInBatch(batchId: string) {
    // Get the exam and course from the batch
    const { data: batchData, error: batchError } = await supabase
      .from('exam_batches')
      .select(
        `
        exam_id,
        exam:exams(course_id)
      `
      )
      .eq('id', batchId)
      .single();

    if (batchError) {
      throw new Error(`Error fetching batch info: ${batchError.message}`);
    }

    // Handle both array and single object response
    const examData = Array.isArray(batchData.exam)
      ? batchData.exam[0]
      : batchData.exam;
    const courseId = examData.course_id;
    const examId = batchData.exam_id;

    // Get all students in the course
    const allStudents = await this.getStudentsForCourse(courseId);

    // Get students who already have attendance for this exam
    const { data: attendedStudents, error: attendanceError } = await supabase
      .from('exam_attendances')
      .select(
        `
        student_id,
        exam_batches!inner(exam_id)
      `
      )
      .eq('exam_batches.exam_id', examId);

    if (attendanceError) {
      throw new Error(
        `Error fetching attended students: ${attendanceError.message}`
      );
    }

    const attendedStudentIds = attendedStudents.map((a) => a.student_id);
    return allStudents.filter(
      (student) => !attendedStudentIds.includes(student.id)
    );
  }

  // Exam Reviews operations
  async getExamReviews(examId: string) {
    const { data, error } = await supabase
      .from('exam_reviews')
      .select(
        `
        *,
        reviewer:profiles!exam_reviews_reviewer_id_fkey(
          id,
          full_name,
          role
        )
      `
      )
      .eq('exam_id', examId)
      .order('reviewed_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching exam reviews: ${error.message}`);
    }

    return data.map((review) => ({
      ...review,
      reviewer: {
        id: review.reviewer.id,
        full_name: review.reviewer.full_name,
        role: review.reviewer.role,
      },
    })) as ExamReview[];
  }

  async createExamReview(reviewData: {
    exam_id: string;
    reviewer_id: string;
    role: 'student' | 'teacher' | 'staff';
    comment?: string;
  }) {
    const { data, error } = await supabase
      .from('exam_reviews')
      .insert(reviewData)
      .select(
        `
        *,
        reviewer:profiles!exam_reviews_reviewer_id_fkey(
          id,
          full_name,
          role
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Error creating exam review: ${error.message}`);
    }

    return {
      ...data,
      reviewer: {
        id: data.reviewer.id,
        full_name: data.reviewer.full_name,
        role: data.reviewer.role,
      },
    } as ExamReview;
  }

  async updateExamReview(id: string, updates: { comment?: string }) {
    const { data, error } = await supabase
      .from('exam_reviews')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        reviewer:profiles!exam_reviews_reviewer_id_fkey(
          id,
          full_name,
          role
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Error updating exam review: ${error.message}`);
    }

    return {
      ...data,
      reviewer: {
        id: data.reviewer.id,
        full_name: data.reviewer.full_name,
        role: data.reviewer.role,
      },
    } as ExamReview;
  }

  async deleteExamReview(id: string) {
    const { error } = await supabase.from('exam_reviews').delete().eq('id', id);

    if (error) {
      throw new Error(`Error deleting exam review: ${error.message}`);
    }
  }

  // Helper methods
  async getExamStatistics(examId: string) {
    const { data, error } = await supabase
      .from('exam_attendances')
      .select(
        `
        status,
        score,
        exam_batches!inner(exam_id)
      `
      )
      .eq('exam_batches.exam_id', examId);

    if (error) {
      throw new Error(`Error fetching exam statistics: ${error.message}`);
    }

    const stats = {
      total: data.length,
      present: data.filter((a) => a.status === 'present').length,
      absent: data.filter((a) => a.status === 'absent').length,
      late: data.filter((a) => a.status === 'late').length,
      excused: data.filter((a) => a.status === 'excused').length,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
    };

    const scores = data.filter((a) => a.score !== null).map((a) => a.score!);
    if (scores.length > 0) {
      stats.averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      stats.maxScore = Math.max(...scores);
      stats.minScore = Math.min(...scores);
    }

    return stats;
  }

  // Helper methods
  private async getExamIdFromBatch(batchId: string): Promise<string> {
    const { data, error } = await supabase
      .from('exam_batches')
      .select('exam_id')
      .eq('id', batchId)
      .single();

    if (error) {
      throw new Error(`Error fetching exam ID from batch: ${error.message}`);
    }

    return data.exam_id;
  }

  async getCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Error fetching courses: ${error.message}`);
    }

    return data;
  }

  async getStudentsForCourse(courseId: string) {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(
        `
        student_id,
        profiles!course_enrollments_student_id_fkey(
          id,
          full_name,
          students(roll)
        )
      `
      )
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Error fetching students for course: ${error.message}`);
    }

    return data.map((enrollment) => {
      const profile = Array.isArray(enrollment.profiles)
        ? enrollment.profiles[0]
        : enrollment.profiles;
      return {
        id: profile.id,
        full_name: profile.full_name,
        roll: profile.students?.[0]?.roll,
      };
    });
  }

  async getExamResults(examId: string) {
    const { data, error } = await supabase
      .from('exam_attendances')
      .select(
        `
        *,
        student:profiles!exam_attendances_student_id_fkey(
          id,
          full_name,
          students(roll)
        ),
        exam_batches!inner(exam_id)
      `
      )
      .eq('exam_batches.exam_id', examId)
      .not('score', 'is', null)
      .order('score', { ascending: false });

    if (error) {
      throw new Error(`Error fetching exam results: ${error.message}`);
    }

    return data.map((attendance) => ({
      ...attendance,
      student: {
        id: attendance.student.id,
        full_name: attendance.student.full_name,
        roll: attendance.student.students?.[0]?.roll,
      },
    }));
  }
}

export const examManagementService = new ExamManagementService();
