import { supabase } from '@/lib/supabase';
import {
  StudentProfile,
  StudentWithProfile,
  CourseEnrollment,
} from '@/types/database-new';

interface CreateStudentData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  student_id?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  current_semester?: number;
}

interface UpdateStudentData {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  phone?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  current_semester?: number;
  is_active?: boolean;
}

class StudentService {
  async getAllStudents(): Promise<StudentWithProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        `
        *,
        student_profile:student_profiles(*),
        enrollments:course_enrollments(
          *,
          course:courses(
            id,
            name,
            code,
            credits
          )
        )
      `
      )
      .eq('role', 'student')
      .order('last_name');

    if (error) throw error;
    return data;
  }

  async getStudentById(userId: string): Promise<StudentWithProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        `
        *,
        student_profile:student_profiles(*),
        enrollments:course_enrollments(
          *,
          course:courses(
            id,
            name,
            code,
            credits,
            department,
            semester
          )
        )
      `
      )
      .eq('user_id', userId)
      .eq('role', 'student')
      .single();

    if (error) throw error;
    return data;
  }

  async createStudent(
    studentData: CreateStudentData
  ): Promise<{ user: any; profile: StudentProfile }> {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: studentData.email,
      password: studentData.password,
      options: {
        data: {
          role: 'student',
          first_name: studentData.first_name,
          last_name: studentData.last_name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email: studentData.email,
        role: 'student',
        first_name: studentData.first_name,
        last_name: studentData.last_name,
      });

    if (profileError) throw profileError;

    // Generate student ID if not provided
    const student_id =
      studentData.student_id || (await this.generateStudentId());

    // Create student profile
    const { data: studentProfile, error: studentProfileError } = await supabase
      .from('student_profiles')
      .insert({
        user_id: authData.user.id,
        student_id,
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        date_of_birth: studentData.date_of_birth,
        phone: studentData.phone,
        address: studentData.address,
        emergency_contact_name: studentData.emergency_contact_name,
        emergency_contact_phone: studentData.emergency_contact_phone,
        guardian_name: studentData.guardian_name,
        guardian_phone: studentData.guardian_phone,
        guardian_email: studentData.guardian_email,
        guardian_relationship: studentData.guardian_relationship,
        current_semester: studentData.current_semester || 1,
      })
      .select()
      .single();

    if (studentProfileError) throw studentProfileError;

    return {
      user: authData.user,
      profile: studentProfile,
    };
  }

  async updateStudent(
    userId: string,
    updates: UpdateStudentData
  ): Promise<StudentProfile> {
    const { data, error } = await supabase
      .from('student_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteStudent(userId: string): Promise<void> {
    // Soft delete by deactivating
    const { error: profileError } = await supabase
      .from('student_profiles')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    // Also deactivate enrollments
    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .update({ status: 'dropped' })
      .eq('student_id', userId);

    if (enrollmentError) throw enrollmentError;
  }

  async enrollStudentInCourse(
    studentId: string,
    courseId: string
  ): Promise<CourseEnrollment> {
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    // Send enrollment notification
    await this.sendEnrollmentNotification(studentId, courseId);

    return data;
  }

  async unenrollStudentFromCourse(
    studentId: string,
    courseId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('course_enrollments')
      .update({ status: 'dropped' })
      .eq('student_id', studentId)
      .eq('course_id', courseId);

    if (error) throw error;
  }

  async getStudentEnrollments(studentId: string): Promise<CourseEnrollment[]> {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(
        `
        *,
        course:courses(*)
      `
      )
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }

  private async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear();
    const { count, error } = await supabase
      .from('student_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    const nextNumber = (count || 0) + 1;
    return `STU${year}${nextNumber.toString().padStart(4, '0')}`;
  }

  private async sendEnrollmentNotification(
    studentId: string,
    courseId: string
  ): Promise<void> {
    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('name, code')
      .eq('id', courseId)
      .single();

    if (courseError) return; // Don't throw, just skip notification

    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: studentId,
        title: 'Course Enrollment',
        message: `You have been enrolled in ${course.code} - ${course.name}`,
        type: 'course_enrollment',
        related_id: courseId,
        related_type: 'course',
      });

    if (notificationError) {
      console.error(
        'Failed to send enrollment notification:',
        notificationError
      );
    }
  }

  async searchStudents(query: string): Promise<StudentWithProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        `
        *,
        student_profile:student_profiles(*)
      `
      )
      .eq('role', 'student')
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
      )
      .order('last_name');

    if (error) throw error;
    return data;
  }

  async enrollInCourse(
    studentUserId: string,
    courseId: string
  ): Promise<CourseEnrollment> {
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        student_id: studentUserId,
        course_id: courseId,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async unenrollFromCourse(
    studentUserId: string,
    courseId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('course_enrollments')
      .update({ status: 'dropped' })
      .eq('student_id', studentUserId)
      .eq('course_id', courseId);

    if (error) throw error;
  }
}

export const studentService = new StudentService();
