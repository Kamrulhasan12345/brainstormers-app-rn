import { supabase } from '@/lib/supabase';
import { Course, CourseWithDetails } from '@/types/database-new';

class CourseService {
  async getAllCourses(): Promise<CourseWithDetails[]> {
    const { data, error } = await supabase
      .from('courses')
      .select(
        `
        *,
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        ),
        course_enrollments(count)
      `
      )
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return data.map((course) => ({
      ...course,
      enrollment_count: course.course_enrollments?.[0]?.count || 0,
    }));
  }

  async getCourseById(id: string): Promise<CourseWithDetails | null> {
    const { data, error } = await supabase
      .from('courses')
      .select(
        `
        *,
        instructor:user_profiles!instructor_id(
          id,
          first_name,
          last_name,
          email
        ),
        lectures(*),
        exams(*),
        course_enrollments(count)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      ...data,
      enrollment_count: data.course_enrollments?.[0]?.count || 0,
    };
  }

  async createCourse(course: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCourse(id: string): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  async getCoursesForStudent(studentId: string): Promise<CourseWithDetails[]> {
    const { data, error } = await supabase
      .from('course_enrollments')
      .select(
        `
        course:courses(
          *,
          instructor:user_profiles!instructor_id(
            id,
            first_name,
            last_name,
            email
          )
        )
      `
      )
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) throw error;

    return data.map((enrollment) => enrollment.course).filter(Boolean);
  }

  async getStudentsInCourse(courseId: string) {
    const { data, error } = await supabase
      .from('course_enrollments')
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
          student_id,
          phone,
          current_semester
        )
      `
      )
      .eq('course_id', courseId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }
}

export const courseService = new CourseService();
