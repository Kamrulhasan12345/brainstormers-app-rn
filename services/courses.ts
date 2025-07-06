import { supabase } from '@/lib/supabase';
import {
  Course,
  CourseWithDetails,
  Profile,
  Student,
  CourseEnrollment,
  Lecture,
  Exam,
} from '@/types/database-new';

class CourseService {
  async getAllCourses(): Promise<CourseWithDetails[]> {
    console.log('[CourseService] getAllCourses: fetching all courses');
    const { data, error } = await supabase
      .from('courses')
      .select(
        `
        *,
        lectures(*),
        exams(*),
        course_enrollments(count)
      `
      )
      .order('name');
    if (error) {
      console.error('[CourseService] getAllCourses: error', error);
      throw error;
    }
    console.log('[CourseService] getAllCourses: data', data);
    return (data || []).map((course) => ({
      ...course,
      enrollment_count: course.course_enrollments?.[0]?.count || 0,
    }));
  }

  async getCourseById(id: string): Promise<CourseWithDetails | null> {
    console.log('[CourseService] getCourseById: fetching course', id);
    const { data, error } = await supabase
      .from('courses')
      .select(
        `
        *,
        lectures(*),
        exams(*),
        course_enrollments(count)
      `
      )
      .eq('id', id)
      .single();
    if (error) {
      console.error('[CourseService] getCourseById: error', error);
      throw error;
    }
    console.log('[CourseService] getCourseById: data', data);
    return {
      ...data,
      enrollment_count: data.course_enrollments?.[0]?.count || 0,
    };
  }

  async createCourse(course: Partial<Course>): Promise<Course> {
    console.log('[CourseService] createCourse: creating course', course);
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single();
    if (error) {
      console.error('[CourseService] createCourse: error', error);
      throw error;
    }
    console.log('[CourseService] createCourse: created', data);
    return data;
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    console.log('[CourseService] updateCourse: updating course', id, updates);
    // Update the course
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[CourseService] updateCourse: error', error);
      throw error;
    }
    // Update all related enrollments (e.g., if course name/code changes, you may want to update denormalized fields)
    // If you have denormalized fields in course_enrollments, update them here. Otherwise, this is a no-op.
    // Example: await supabase.from('course_enrollments').update({ course_name: updates.name }).eq('course_id', id);
    console.log('[CourseService] updateCourse: updated', data);
    return data;
  }

  async deleteCourse(id: string): Promise<void> {
    console.log(
      '[CourseService] deleteCourse: deleting course and related enrollments',
      id
    );
    // Delete all enrollments for this course
    const { error: enrollmentsError } = await supabase
      .from('course_enrollments')
      .delete()
      .eq('course_id', id);
    if (enrollmentsError) {
      console.error(
        '[CourseService] deleteCourse: enrollments error',
        enrollmentsError
      );
      throw enrollmentsError;
    }
    // Delete the course
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) {
      console.error('[CourseService] deleteCourse: error', error);
      throw error;
    }
    console.log('[CourseService] deleteCourse: deleted', id);
  }

  async getCoursesForStudent(studentId: string): Promise<CourseWithDetails[]> {
    console.log(
      '[CourseService] getCoursesForStudent: fetching for student',
      studentId
    );
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(
        `
        course:courses(*, lectures(*), exams(*))
      `
      )
      .eq('student_id', studentId)
      .eq('status', 'active');
    if (error) {
      console.error('[CourseService] getCoursesForStudent: error', error);
      throw error;
    }
    console.log('[CourseService] getCoursesForStudent: data', data);
    return (data || [])
      .map((enrollment) => enrollment.course)
      .flat()
      .filter((c) => c && c.id);
  }

  async getStudentsInCourse(
    courseId: string
  ): Promise<
    (Student & { profile?: Profile; enrollment: CourseEnrollment })[]
  > {
    console.log(
      '[CourseService] getStudentsInCourse: fetching for course',
      courseId
    );
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(
        `
        *,
        student:students(*, profile:profiles(*))
      `
      )
      .eq('course_id', courseId)
      .eq('status', 'active');
    if (error) {
      console.error('[CourseService] getStudentsInCourse: error', error);
      throw error;
    }
    console.log('[CourseService] getStudentsInCourse: data', data);
    return (data || [])
      .map((enrollment) => ({
        ...enrollment.student,
        profile: enrollment.student?.profile,
        enrollment,
      }))
      .filter((s) => s && s.id);
  }
}

export const courseService = new CourseService();
