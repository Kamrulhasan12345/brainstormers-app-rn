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
    console.log('[StudentService] getAllStudents: fetching all students');
    // Fetch all students with their profile only
    const { data: students, error } = await supabase
      .from('students')
      .select(`*, profile:profiles(*)`)
      .order('roll');
    if (error) {
      console.error('[StudentService] getAllStudents: error', error);
      throw error;
    }
    console.log('[StudentService] getAllStudents: students', students);
    // For each student, fetch enrollments (with course info)
    const results = await Promise.all(
      (students || []).map(async (student) => {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select(`*, course:courses(id, name, code)`)
          .eq('student_id', student.id)
          .eq('status', 'active');
        if (enrollmentsError) {
          console.error(
            '[StudentService] getAllStudents: enrollments error',
            enrollmentsError,
            student.id
          );
        }
        return {
          ...student,
          enrollments: enrollments || [],
        };
      })
    );
    console.log('[StudentService] getAllStudents: results', results);
    return results;
  }

  async getStudentById(studentId: string): Promise<StudentWithProfile | null> {
    console.log('[StudentService] getStudentById: fetching student', studentId);
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
    if (error) {
      console.error('[StudentService] getStudentById: error', error);
      throw error;
    }
    console.log('[StudentService] getStudentById: data', data);
    return data;
  }

  async createStudent(
    studentData: CreateStudentData
  ): Promise<{ user: any; student: Student; profile: Profile }> {
    console.log(
      '[StudentService] createStudent: creating student via Supabase Edge Function',
      studentData
    );
    try {
      // 1. Check if email already exists in auth.users (via RPC or Edge Function)
      const emailCheckResponse = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/rpc/check_email_exists`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email: studentData.email }),
        }
      );
      const emailExists = await emailCheckResponse.json();
      if (emailCheckResponse.ok && emailExists === true) {
        throw new Error('A user with this email already exists.');
      }
      // 2. Call the Supabase Edge Function with anon key as Authorization
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-student`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(studentData),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        // Handle known Supabase auth errors
        let errorMessage = result.error || 'Failed to create student';
        if (result.details && result.details.code === 'email_exists') {
          errorMessage = 'A user with this email already exists.';
        } else if (result.details && result.details.code) {
          errorMessage = `Supabase error: ${result.details.code}`;
        }
        console.error(
          '[StudentService] createStudent: Edge Function error',
          result
        );
        throw new Error(errorMessage);
      }
      console.log(
        '[StudentService] createStudent: Edge Function result',
        result
      );
      return {
        user: result.user,
        student: result.student,
        profile: result.profile,
      };
    } catch (err) {
      console.error('[StudentService] createStudent: fetch error', err);
      throw err;
    }
  }

  async updateStudent(
    studentId: string,
    updates: UpdateStudentData
  ): Promise<{ student: Student; profile?: Profile }> {
    console.log(
      '[StudentService] updateStudent: updating student',
      studentId,
      updates
    );
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
      if (result.error) {
        console.error('[StudentService] updateStudent: error', result.error);
        throw result.error;
      }
    }
    // Get updated student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    if (studentError) {
      console.error(
        '[StudentService] updateStudent: fetch error',
        studentError
      );
      throw studentError;
    }
    console.log('[StudentService] updateStudent: updated student', student);
    return { student };
  }

  async deleteStudent(studentId: string): Promise<void> {
    console.log('[StudentService] deleteStudent: deleting student', studentId);
    // First, update any active enrollments to dropped
    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .update({ status: 'dropped' })
      .eq('student_id', studentId)
      .eq('status', 'active');
    if (enrollmentError) {
      console.error(
        '[StudentService] deleteStudent: enrollment error',
        enrollmentError
      );
      throw enrollmentError;
    }
    // Delete from students table (this will cascade due to foreign key constraints)
    const { error: studentError } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);
    if (studentError) {
      console.error(
        '[StudentService] deleteStudent: student error',
        studentError
      );
      throw studentError;
    }
    // Delete from profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', studentId);
    if (profileError) {
      console.error(
        '[StudentService] deleteStudent: profile error',
        profileError
      );
      throw profileError;
    }
    console.log('[StudentService] deleteStudent: deleted student', studentId);
    // Note: Auth user deletion should be handled separately by admin
    // as it requires elevated permissions
  }

  async enrollInCourse(
    studentId: string,
    courseId: string
  ): Promise<CourseEnrollment> {
    console.log(
      '[StudentService] enrollInCourse: enrolling',
      studentId,
      courseId
    );
    const { data, error } = await supabase
      .from('course_enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        status: 'active',
      })
      .select()
      .single();
    if (error) {
      console.error('[StudentService] enrollInCourse: error', error);
      throw error;
    }
    console.log('[StudentService] enrollInCourse: enrolled', data);
    // Send enrollment notification
    await this.sendEnrollmentNotification(studentId, courseId);
    return data;
  }

  async unenrollFromCourse(studentId: string, courseId: string): Promise<void> {
    console.log(
      '[StudentService] unenrollFromCourse: unenrolling',
      studentId,
      courseId
    );
    const { error } = await supabase
      .from('course_enrollments')
      .update({ status: 'dropped' })
      .eq('student_id', studentId)
      .eq('course_id', courseId);
    if (error) {
      console.error('[StudentService] unenrollFromCourse: error', error);
      throw error;
    }
    console.log(
      '[StudentService] unenrollFromCourse: unenrolled',
      studentId,
      courseId
    );
  }

  async getStudentEnrollments(studentId: string): Promise<CourseEnrollment[]> {
    console.log(
      '[StudentService] getStudentEnrollments: fetching for student',
      studentId
    );
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
    if (error) {
      console.error('[StudentService] getStudentEnrollments: error', error);
      throw error;
    }
    console.log('[StudentService] getStudentEnrollments: data', data);
    return data || [];
  }

  private async generateRollNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error('[StudentService] generateRollNumber: error', error);
      throw error;
    }
    const nextNumber = (count || 0) + 1;
    const roll = `${year}-STU-${nextNumber.toString().padStart(4, '0')}`;
    console.log('[StudentService] generateRollNumber: generated', roll);
    return roll;
  }

  private async sendEnrollmentNotification(
    studentId: string,
    courseId: string
  ): Promise<void> {
    console.log(
      '[StudentService] sendEnrollmentNotification: sending',
      studentId,
      courseId
    );
    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('name, code')
      .eq('id', courseId)
      .single();
    if (courseError) {
      console.error(
        '[StudentService] sendEnrollmentNotification: course error',
        courseError
      );
      return; // Don't throw, just skip notification
    }
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
        '[StudentService] sendEnrollmentNotification: notification error',
        notificationError
      );
    } else {
      console.log('[StudentService] sendEnrollmentNotification: sent');
    }
  }

  async searchStudents(query: string): Promise<StudentWithProfile[]> {
    console.log('[StudentService] searchStudents: searching', query);
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
    if (error) {
      console.error('[StudentService] searchStudents: error', error);
      throw error;
    }
    console.log('[StudentService] searchStudents: data', data);
    return data || [];
  }
}

export const studentService = new StudentService();
