export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          occurred_at?: string;
        };
      };
      attendances: {
        Row: {
          id: string;
          batch_id: string;
          student_id: string;
          recorded_by: string | null;
          status: 'present' | 'absent' | 'late' | 'excused';
          recorded_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          student_id: string;
          recorded_by?: string | null;
          status?: 'present' | 'absent' | 'late' | 'excused';
          recorded_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          student_id?: string;
          recorded_by?: string | null;
          status?: 'present' | 'absent' | 'late' | 'excused';
          recorded_at?: string;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          enrollment_date: string;
          status: 'active' | 'dropped' | 'completed';
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          enrollment_date?: string;
          status?: 'active' | 'dropped' | 'completed';
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          enrollment_date?: string;
          status?: 'active' | 'dropped' | 'completed';
        };
      };
      courses: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          created_at?: string;
        };
      };
      exam_attendances: {
        Row: {
          id: string;
          batch_id: string;
          student_id: string;
          score: number | null;
          recorded_by: string | null;
          status: 'present' | 'absent' | 'late' | 'excused';
          recorded_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          student_id: string;
          score?: number | null;
          recorded_by?: string | null;
          status?: 'present' | 'absent' | 'late' | 'excused';
          recorded_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          student_id?: string;
          score?: number | null;
          recorded_by?: string | null;
          status?: 'present' | 'absent' | 'late' | 'excused';
          recorded_at?: string;
        };
      };
      exam_batches: {
        Row: {
          id: string;
          exam_id: string;
          scheduled_start: string;
          scheduled_end: string;
          notes: string | null;
          status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          scheduled_start: string;
          scheduled_end: string;
          notes?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
          created_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          scheduled_start?: string;
          scheduled_end?: string;
          notes?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
          created_at?: string;
        };
      };
      exam_reviews: {
        Row: {
          id: string;
          exam_id: string;
          reviewer_id: string;
          role: 'student' | 'teacher' | 'staff';
          comment: string | null;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          reviewer_id: string;
          role: 'student' | 'teacher' | 'staff';
          comment?: string | null;
          reviewed_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          reviewer_id?: string;
          role?: 'student' | 'teacher' | 'staff';
          comment?: string | null;
          reviewed_at?: string;
        };
      };
      exams: {
        Row: {
          id: string;
          name: string;
          course_id: string | null;
          subject: string;
          chapter: string | null;
          topic: string | null;
          question_by: string | null;
          total_marks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          course_id?: string | null;
          subject: string;
          chapter?: string | null;
          topic?: string | null;
          question_by?: string | null;
          total_marks?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          course_id?: string | null;
          subject?: string;
          chapter?: string | null;
          topic?: string | null;
          question_by?: string | null;
          total_marks?: number;
          created_at?: string;
        };
      };
      lecture_batches: {
        Row: {
          id: string;
          lecture_id: string;
          scheduled_at: string;
          created_at: string;
          status:
            | 'scheduled'
            | 'completed'
            | 'postponed'
            | 'cancelled'
            | 'not_held';
          notes: string | null;
          end_time: string | null;
        };
        Insert: {
          id?: string;
          lecture_id: string;
          scheduled_at: string;
          created_at?: string;
          status?:
            | 'scheduled'
            | 'completed'
            | 'postponed'
            | 'cancelled'
            | 'not_held';
          notes?: string | null;
          end_time?: string | null;
        };
        Update: {
          id?: string;
          lecture_id?: string;
          scheduled_at?: string;
          created_at?: string;
          status?:
            | 'scheduled'
            | 'completed'
            | 'postponed'
            | 'cancelled'
            | 'not_held';
          notes?: string | null;
          end_time?: string | null;
        };
      };
      lecture_notes: {
        Row: {
          id: string;
          batch_id: string;
          uploaded_by: string | null;
          file_url: string;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          uploaded_by?: string | null;
          file_url: string;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          uploaded_by?: string | null;
          file_url?: string;
          uploaded_at?: string;
        };
      };
      lecture_reviews: {
        Row: {
          id: string;
          batch_id: string;
          reviewer_id: string;
          role: 'student' | 'teacher' | 'staff';
          comment: string | null;
          reviewed_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          reviewer_id: string;
          role: 'student' | 'teacher' | 'staff';
          comment?: string | null;
          reviewed_at?: string;
        };
        Update: {
          id?: string;
          batch_id?: string;
          reviewer_id?: string;
          role?: 'student' | 'teacher' | 'staff';
          comment?: string | null;
          reviewed_at?: string;
        };
      };
      lectures: {
        Row: {
          id: string;
          course_id: string;
          subject: string;
          chapter: string | null;
          topic: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          subject: string;
          chapter?: string | null;
          topic?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          subject?: string;
          chapter?: string | null;
          topic?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          title: string | null;
          body: string;
          link: string | null;
          expires_at: string | null;
          type: 'info' | 'warning' | 'success' | 'error';
          is_read: boolean;
          created_at: string;
          is_sent: boolean;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          title?: string | null;
          body: string;
          link?: string | null;
          expires_at?: string | null;
          type?: 'info' | 'warning' | 'success' | 'error';
          is_read?: boolean;
          created_at?: string;
          is_sent?: boolean;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          title?: string | null;
          body?: string;
          link?: string | null;
          expires_at?: string | null;
          type?: 'info' | 'warning' | 'success' | 'error';
          is_read?: boolean;
          created_at?: string;
          is_sent?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          role: 'admin' | 'teacher' | 'student';
          full_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: 'admin' | 'teacher' | 'student';
          full_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: 'admin' | 'teacher' | 'student';
          full_name?: string | null;
          created_at?: string;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android' | 'web' | null;
          last_active: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform?: 'ios' | 'android' | 'web' | null;
          last_active?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          platform?: 'ios' | 'android' | 'web' | null;
          last_active?: string;
        };
      };
      students: {
        Row: {
          id: string;
          roll: string;
        };
        Insert: {
          id: string;
          roll: string;
        };
        Update: {
          id?: string;
          roll?: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          designation: string | null;
          department: string | null;
        };
        Insert: {
          id: string;
          designation?: string | null;
          department?: string | null;
        };
        Update: {
          id?: string;
          designation?: string | null;
          department?: string | null;
        };
      };
    };
  };
}

// Additional types for our application
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type Attendance = Database['public']['Tables']['attendances']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type CourseEnrollment =
  Database['public']['Tables']['course_enrollments']['Row'];
export type ExamAttendance =
  Database['public']['Tables']['exam_attendances']['Row'];
export type ExamBatch = Database['public']['Tables']['exam_batches']['Row'];
export type ExamReview = Database['public']['Tables']['exam_reviews']['Row'];
export type Exam = Database['public']['Tables']['exams']['Row'];
export type LectureBatch =
  Database['public']['Tables']['lecture_batches']['Row'];
export type LectureNote = Database['public']['Tables']['lecture_notes']['Row'];
export type LectureReview =
  Database['public']['Tables']['lecture_reviews']['Row'];
export type Lecture = Database['public']['Tables']['lectures']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type PushToken = Database['public']['Tables']['push_tokens']['Row'];
export type Student = Database['public']['Tables']['students']['Row'];
export type Teacher = Database['public']['Tables']['teachers']['Row'];

// Extended types with relations
export interface StudentWithProfile extends Student {
  profile?: Profile;
  enrollments?: (CourseEnrollment & { course?: Course })[];
}

export interface TeacherWithProfile extends Teacher {
  profile?: Profile;
}

export interface CourseWithDetails extends Course {
  enrollments?: CourseEnrollment[];
  lectures?: Lecture[];
  exams?: Exam[];
  enrollment_count?: number;
  lecture_count?: number;
  total_duration?: number;
}

export interface LectureWithDetails extends Lecture {
  course?: Course;
  batches?: LectureBatch[];
}

export interface LectureBatchWithDetails extends LectureBatch {
  lecture?: Lecture;
  attendances?: Attendance[];
  lecture_notes?: LectureNote[];
  reviews?: LectureReview[];
  attendance_count?: number;
  attendance_rate?: number;
}

export interface ExamWithDetails extends Exam {
  course?: Course;
  question_by_profile?: Profile;
  batches?: ExamBatch[];
  reviews?: ExamReview[];
}

export interface ExamBatchWithDetails extends ExamBatch {
  exam?: Exam;
  attendances?: ExamAttendance[];
  attendance_count?: number;
  average_score?: number;
}
