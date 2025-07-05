import { supabase } from '@/lib/supabase';
import {
  StudentWithProfile,
  CourseEnrollment,
  Profile,
  Student,
} from '@/types/database-new';

interface CreateStudentData {
  email: string;
  password: string;
  full_name: string;
  roll?: string;
}

interface UpdateStudentData {
  full_name?: string;
  roll?: string;
}

class StudentService {
  async getAllStudents(): Promise<StudentWithProfile[]> {
    const { data, error } = await supabase
      .from('students')
      .select(
        `
        *,
        profile:profiles(*),
        enrollments:course_enrollments(
          *,
          course:courses(
            id,
            name,
            code
          )
        )
      `
      )
      .order('roll');

    if (error) throw error;
    return data || [];
  }

  async getStudentById(studentId: string): Promise<StudentWithProfile | null> {
    const { data, error } = await supabase
      .from('students')
      .select(
        `
        *,
        profile:profiles(*),
        enrollments:course_enrollments(
          *,
          course:courses(
            id,
            name,
            code
          )
        )
      `
      )
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return data;
  }

  async createStudent(
    studentData: CreateStudentData
  ): Promise<{ user: any; student: Student; profile: Profile }> {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: studentData.email,
      password: studentData.password,
      options: {
        data: {
          role: 'student',
          full_name: studentData.full_name,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'student',
        full_name: studentData.full_name,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    // Generate roll number if not provided
    const roll = studentData.roll || (await this.generateRollNumber());

    // Create student record
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        id: authData.user.id,
        roll,
      })
      .select()
      .single();

    if (studentError) throw studentError;

    return {
      user: authData.user,
      student,
      profile,
    };
  }

  async updateStudent(
    studentId: string,
    updates: UpdateStudentData
  ): Promise<{ student: Student; profile?: Profile }> {
    const updatePromises = [];

    // Update student table if roll is provided
    if (updates.roll) {
      updatePromises.push(
        supabase
          .from('students')
          .update({ roll: updates.roll })
          .eq('id', studentId)
          .select()
          .single()
      );
    }

    // Update profile table if full_name is provided
    if (updates.full_name) {
      updatePromises.push(
        supabase
          .from('profiles')
          .update({ full_name: updates.full_name })
          .eq('id', studentId)
          .select()
          .single()
      );
    }

    const results = await Promise.all(updatePromises);

    // Check for errors
    for (const result of results) {
      if (result.error) throw result.error;
    }

    // Get updated student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) throw studentError;

    return { student };
  }

  async deleteStudent(studentId: string): Promise<void> {
    // First, update any active enrollments to dropped
    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .update({ status: 'dropped' })
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (enrollmentError) throw enrollmentError;

    // Delete from students table (this will cascade due to foreign key constraints)
    const { error: studentError } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (studentError) throw studentError;

    // Delete from profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', studentId);

    if (profileError) throw profileError;

    // Note: Auth user deletion should be handled separately by admin
    // as it requires elevated permissions
  }

  async enrollInCourse(
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

  async unenrollFromCourse(studentId: string, courseId: string): Promise<void> {
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
    return data || [];
  }

  private async generateRollNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    const nextNumber = (count || 0) + 1;
    return `${year}-STU-${nextNumber.toString().padStart(4, '0')}`;
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
        body: `You have been enrolled in ${course.code} - ${course.name}`,
        type: 'success',
        link: `/courses/${courseId}`,
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
      .from('students')
      .select(
        `
        *,
        profile:profiles(*)
      `
      )
      .or(`roll.ilike.%${query}%,profile.full_name.ilike.%${query}%`, {
        foreignTable: 'profiles',
      })
      .order('roll');

    if (error) throw error;
    return data || [];
  }
}

export const studentService = new StudentService();
