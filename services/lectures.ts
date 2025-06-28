import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Lecture = Database['public']['Tables']['lectures']['Row'];
type LectureInsert = Database['public']['Tables']['lectures']['Insert'];
type LectureUpdate = Database['public']['Tables']['lectures']['Update'];

class LecturesService {
  async getLectures(classId?: string) {
    let query = supabase
      .from('lectures')
      .select(`
        *,
        subjects:subject_id(name, code),
        classes:class_id(name),
        profiles:teacher_id(name),
        lecture_materials(*)
      `)
      .order('scheduled_date', { ascending: true });

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getLectureById(id: string) {
    const { data, error } = await supabase
      .from('lectures')
      .select(`
        *,
        subjects:subject_id(name, code),
        classes:class_id(name),
        profiles:teacher_id(name),
        lecture_materials(*),
        lecture_notes(*),
        lecture_questions(
          *,
          student:student_id(name),
          answerer:answered_by(name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async createLecture(lecture: LectureInsert) {
    const { data, error } = await supabase
      .from('lectures')
      .insert(lecture)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateLecture(id: string, updates: LectureUpdate) {
    const { data, error } = await supabase
      .from('lectures')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async deleteLecture(id: string) {
    const { error } = await supabase
      .from('lectures')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async addLectureNote(lectureId: string, studentId: string, title: string, content?: string, fileUrl?: string) {
    const { data, error } = await supabase
      .from('lecture_notes')
      .insert({
        lecture_id: lectureId,
        student_id: studentId,
        title,
        content,
        file_url: fileUrl,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async askQuestion(lectureId: string, studentId: string, question: string) {
    const { data, error } = await supabase
      .from('lecture_questions')
      .insert({
        lecture_id: lectureId,
        student_id: studentId,
        question,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async answerQuestion(questionId: string, teacherId: string, answer: string) {
    const { data, error } = await supabase
      .from('lecture_questions')
      .update({
        answer,
        answered_by: teacherId,
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getSubjects() {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const lecturesService = new LecturesService();