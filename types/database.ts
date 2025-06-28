export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      attendance: {
        Row: {
          id: string
          lecture_id: string
          student_id: string
          status: 'present' | 'absent' | 'late'
          marked_at: string
          marked_by: string | null
        }
        Insert: {
          id?: string
          lecture_id: string
          student_id: string
          status: 'present' | 'absent' | 'late'
          marked_at?: string
          marked_by?: string | null
        }
        Update: {
          id?: string
          lecture_id?: string
          student_id?: string
          status?: 'present' | 'absent' | 'late'
          marked_at?: string
          marked_by?: string | null
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          academic_year: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          academic_year: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          academic_year?: string
          created_at?: string
        }
      }
      exam_results: {
        Row: {
          id: string
          exam_id: string
          student_id: string
          marks_obtained: number
          grade: string | null
          percentage: number | null
          rank: number | null
          remarks: string | null
          evaluated_by: string | null
          evaluated_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id: string
          marks_obtained: number
          grade?: string | null
          percentage?: number | null
          rank?: number | null
          remarks?: string | null
          evaluated_by?: string | null
          evaluated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string
          marks_obtained?: number
          grade?: string | null
          percentage?: number | null
          rank?: number | null
          remarks?: string | null
          evaluated_by?: string | null
          evaluated_at?: string | null
          created_at?: string
        }
      }
      exam_syllabus: {
        Row: {
          id: string
          exam_id: string
          topic: string
          weightage: number | null
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          topic: string
          weightage?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          topic?: string
          weightage?: number | null
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          subject_id: string
          class_id: string
          title: string
          description: string | null
          exam_type: 'Unit Test' | 'Chapter Test' | 'Monthly Test' | 'Prelims' | 'Board Exam'
          exam_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          total_marks: number
          location: string | null
          instructions: string | null
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          class_id: string
          title: string
          description?: string | null
          exam_type: 'Unit Test' | 'Chapter Test' | 'Monthly Test' | 'Prelims' | 'Board Exam'
          exam_date: string
          start_time: string
          end_time: string
          duration_minutes: number
          total_marks: number
          location?: string | null
          instructions?: string | null
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          class_id?: string
          title?: string
          description?: string | null
          exam_type?: 'Unit Test' | 'Chapter Test' | 'Monthly Test' | 'Prelims' | 'Board Exam'
          exam_date?: string
          start_time?: string
          end_time?: string
          duration_minutes?: number
          total_marks?: number
          location?: string | null
          instructions?: string | null
          status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lecture_materials: {
        Row: {
          id: string
          lecture_id: string
          title: string
          description: string | null
          material_type: string | null
          file_url: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lecture_id: string
          title: string
          description?: string | null
          material_type?: string | null
          file_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lecture_id?: string
          title?: string
          description?: string | null
          material_type?: string | null
          file_url?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      lecture_notes: {
        Row: {
          id: string
          lecture_id: string
          student_id: string
          title: string
          content: string | null
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lecture_id: string
          student_id: string
          title: string
          content?: string | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lecture_id?: string
          student_id?: string
          title?: string
          content?: string | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lecture_questions: {
        Row: {
          id: string
          lecture_id: string
          student_id: string
          question: string
          answer: string | null
          answered_by: string | null
          answered_at: string | null
          upvotes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          lecture_id: string
          student_id: string
          question: string
          answer?: string | null
          answered_by?: string | null
          answered_at?: string | null
          upvotes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          lecture_id?: string
          student_id?: string
          question?: string
          answer?: string | null
          answered_by?: string | null
          answered_at?: string | null
          upvotes?: number | null
          created_at?: string
        }
      }
      lectures: {
        Row: {
          id: string
          subject_id: string
          teacher_id: string | null
          class_id: string
          topic: string
          description: string | null
          scheduled_date: string
          start_time: string
          end_time: string
          location: string | null
          status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
          max_students: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          teacher_id?: string | null
          class_id: string
          topic: string
          description?: string | null
          scheduled_date: string
          start_time: string
          end_time: string
          location?: string | null
          status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
          max_students?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          teacher_id?: string | null
          class_id?: string
          topic?: string
          description?: string | null
          scheduled_date?: string
          start_time?: string
          end_time?: string
          location?: string | null
          status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
          max_students?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      notification_recipients: {
        Row: {
          id: string
          notification_id: string
          recipient_id: string
          read_at: string | null
          delivered_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          notification_id: string
          recipient_id: string
          read_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          notification_id?: string
          recipient_id?: string
          read_at?: string | null
          delivered_at?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          title: string
          message: string
          type: 'exam' | 'lecture' | 'assignment' | 'general' | 'absence'
          priority: number | null
          scheduled_for: string | null
          sent_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message: string
          type: 'exam' | 'lecture' | 'assignment' | 'general' | 'absence'
          priority?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: 'exam' | 'lecture' | 'assignment' | 'general' | 'absence'
          priority?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'student' | 'teacher' | 'admin'
          roll_number: string | null
          class: string | null
          phone: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_email: string | null
          date_of_birth: string | null
          address: string | null
          guardian_notifications: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: 'student' | 'teacher' | 'admin'
          roll_number?: string | null
          class?: string | null
          phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_email?: string | null
          date_of_birth?: string | null
          address?: string | null
          guardian_notifications?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'student' | 'teacher' | 'admin'
          roll_number?: string | null
          class?: string | null
          phone?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_email?: string | null
          date_of_birth?: string | null
          address?: string | null
          guardian_notifications?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          description?: string | null
          created_at?: string
        }
      }
      teachers: {
        Row: {
          id: string
          subject: string
          qualification: string | null
          experience_years: number | null
          created_at: string
        }
        Insert: {
          id: string
          subject: string
          qualification?: string | null
          experience_years?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          subject?: string
          qualification?: string | null
          experience_years?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      attendance_status: 'present' | 'absent' | 'late'
      exam_status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
      exam_type: 'Unit Test' | 'Chapter Test' | 'Monthly Test' | 'Prelims' | 'Board Exam'
      lecture_status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
      notification_type: 'exam' | 'lecture' | 'assignment' | 'general' | 'absence'
      user_role: 'student' | 'teacher' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}