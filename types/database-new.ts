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
      user_profiles: {
        Row: {
          user_id: string;
          email: string;
          role: 'student' | 'teacher' | 'admin';
          first_name: string;
          last_name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          role: 'student' | 'teacher' | 'admin';
          first_name: string;
          last_name: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          role?: 'student' | 'teacher' | 'admin';
          first_name?: string;
          last_name?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          credits: number;
          department: string | null;
          semester: string | null;
          academic_year: string | null;
          instructor_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string | null;
          credits?: number;
          department?: string | null;
          semester?: string | null;
          academic_year?: string | null;
          instructor_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string | null;
          credits?: number;
          department?: string | null;
          semester?: string | null;
          academic_year?: string | null;
          instructor_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      student_profiles: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string | null;
          phone: string | null;
          address: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          guardian_email: string | null;
          guardian_relationship: string | null;
          admission_date: string;
          current_semester: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          student_id: string;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          phone?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          guardian_email?: string | null;
          guardian_relationship?: string | null;
          admission_date?: string;
          current_semester?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          student_id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string | null;
          phone?: string | null;
          address?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          guardian_email?: string | null;
          guardian_relationship?: string | null;
          admission_date?: string;
          current_semester?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      course_enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          enrollment_date: string;
          status: 'active' | 'completed' | 'dropped' | 'failed';
          grade: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          enrollment_date?: string;
          status?: 'active' | 'completed' | 'dropped' | 'failed';
          grade?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          enrollment_date?: string;
          status?: 'active' | 'completed' | 'dropped' | 'failed';
          grade?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lectures: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          course_id: string | null;
          instructor_id: string | null;
          duration_minutes: number;
          location: string | null;
          is_mandatory: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          scheduled_at: string;
          course_id?: string | null;
          instructor_id?: string | null;
          duration_minutes?: number;
          location?: string | null;
          is_mandatory?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          scheduled_at?: string;
          course_id?: string | null;
          instructor_id?: string | null;
          duration_minutes?: number;
          location?: string | null;
          is_mandatory?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      exams: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          scheduled_at: string;
          course_id: string | null;
          instructor_id: string | null;
          duration_minutes: number;
          location: string | null;
          total_marks: number;
          passing_marks: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          scheduled_at: string;
          course_id?: string | null;
          instructor_id?: string | null;
          duration_minutes?: number;
          location?: string | null;
          total_marks?: number;
          passing_marks?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          scheduled_at?: string;
          course_id?: string | null;
          instructor_id?: string | null;
          duration_minutes?: number;
          location?: string | null;
          total_marks?: number;
          passing_marks?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          lecture_id: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          marked_by: string | null;
          marked_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          lecture_id: string;
          status?: 'present' | 'absent' | 'late' | 'excused';
          marked_by?: string | null;
          marked_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          lecture_id?: string;
          status?: 'present' | 'absent' | 'late' | 'excused';
          marked_by?: string | null;
          marked_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      exam_attendance: {
        Row: {
          id: string;
          student_id: string;
          exam_id: string;
          status: 'present' | 'absent' | 'excused';
          marks_obtained: number | null;
          marked_by: string | null;
          marked_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          exam_id: string;
          status?: 'present' | 'absent' | 'excused';
          marks_obtained?: number | null;
          marked_by?: string | null;
          marked_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          exam_id?: string;
          status?: 'present' | 'absent' | 'excused';
          marks_obtained?: number | null;
          marked_by?: string | null;
          marked_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          sender_id: string | null;
          title: string;
          message: string;
          type:
            | 'lecture_reminder'
            | 'exam_reminder'
            | 'lecture_missed'
            | 'exam_missed'
            | 'general'
            | 'course_enrollment';
          related_id: string | null;
          related_type: string | null;
          is_read: boolean;
          scheduled_for: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          sender_id?: string | null;
          title: string;
          message: string;
          type:
            | 'lecture_reminder'
            | 'exam_reminder'
            | 'lecture_missed'
            | 'exam_missed'
            | 'general'
            | 'course_enrollment';
          related_id?: string | null;
          related_type?: string | null;
          is_read?: boolean;
          scheduled_for?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          sender_id?: string | null;
          title?: string;
          message?: string;
          type?:
            | 'lecture_reminder'
            | 'exam_reminder'
            | 'lecture_missed'
            | 'exam_missed'
            | 'general'
            | 'course_enrollment';
          related_id?: string | null;
          related_type?: string | null;
          is_read?: boolean;
          scheduled_for?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Additional types for our application
export type Course = Database['public']['Tables']['courses']['Row'];
export type StudentProfile =
  Database['public']['Tables']['student_profiles']['Row'];
export type CourseEnrollment =
  Database['public']['Tables']['course_enrollments']['Row'];
export type Lecture = Database['public']['Tables']['lectures']['Row'];
export type Exam = Database['public']['Tables']['exams']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type ExamAttendance =
  Database['public']['Tables']['exam_attendance']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Extended types with relations
export interface StudentWithProfile
  extends Database['public']['Tables']['user_profiles']['Row'] {
  student_profile?: StudentProfile;
  enrollments?: (CourseEnrollment & { course: Course })[];
}

export interface CourseWithDetails extends Course {
  instructor?: Database['public']['Tables']['user_profiles']['Row'];
  enrollment_count?: number;
  lectures?: Lecture[];
  exams?: Exam[];
}

export interface LectureWithDetails extends Lecture {
  course?: Course;
  instructor?: Database['public']['Tables']['user_profiles']['Row'];
  attendance_count?: number;
  attendance_rate?: number;
}

export interface ExamWithDetails extends Exam {
  course?: Course;
  instructor?: Database['public']['Tables']['user_profiles']['Row'];
  attendance_count?: number;
  average_marks?: number;
}
