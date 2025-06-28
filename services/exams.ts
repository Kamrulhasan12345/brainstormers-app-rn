import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Exam = Database['public']['Tables']['exams']['Row'];
type ExamInsert = Database['public']['Tables']['exams']['Insert'];
type ExamUpdate = Database['public']['Tables']['exams']['Update'];

class ExamsService {
  async getExams(classId?: string) {
    let query = supabase
      .from('exams')
      .select(`
        *,
        subjects:subject_id(name, code),
        classes:class_id(name),
        exam_syllabus(*),
        exam_results(*)
      `)
      .order('exam_date', { ascending: true });

    if (classId) {
      query = query.eq('class_id', classId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getExamById(id: string) {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        subjects:subject_id(name, code),
        classes:class_id(name),
        exam_syllabus(*),
        exam_results(
          *,
          student:student_id(name, roll_number)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async createExam(exam: ExamInsert) {
    const { data, error } = await supabase
      .from('exams')
      .insert(exam)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async updateExam(id: string, updates: ExamUpdate) {
    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async deleteExam(id: string) {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async addExamSyllabus(examId: string, topics: { topic: string; weightage?: number }[]) {
    const syllabusData = topics.map(topic => ({
      exam_id: examId,
      topic: topic.topic,
      weightage: topic.weightage || 0,
    }));

    const { data, error } = await supabase
      .from('exam_syllabus')
      .insert(syllabusData)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async addExamResult(examId: string, studentId: string, marksObtained: number, grade?: string, remarks?: string) {
    const { data: exam } = await supabase
      .from('exams')
      .select('total_marks')
      .eq('id', examId)
      .single();

    const percentage = exam ? (marksObtained / exam.total_marks) * 100 : 0;

    const { data, error } = await supabase
      .from('exam_results')
      .insert({
        exam_id: examId,
        student_id: studentId,
        marks_obtained: marksObtained,
        grade,
        percentage,
        remarks,
        evaluated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getStudentResults(studentId: string) {
    const { data, error } = await supabase
      .from('exam_results')
      .select(`
        *,
        exams:exam_id(
          title,
          exam_type,
          exam_date,
          total_marks,
          subjects:subject_id(name)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}

export const examsService = new ExamsService();