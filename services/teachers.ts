import { supabase } from '@/lib/supabase';
import { Teacher, TeacherWithProfile } from '@/types/database-new';

export const teacherService = {
  async getAllTeachers(): Promise<TeacherWithProfile[]> {
    // Fetch all teachers with their profile
    const { data, error } = await supabase
      .from('teachers')
      .select('*, profile:profiles(*)');
    if (error) throw error;
    // Map to TeacherWithProfile
    return (data || []).map((row: any) => ({
      ...row,
      profile: row.profile,
    }));
  },

  async createTeacher({
    email,
    password,
    full_name,
    designation,
    department,
    phone,
  }: {
    email: string;
    password: string;
    full_name: string;
    designation?: string;
    department?: string;
    phone?: string;
  }): Promise<void> {
    // Check for duplicate email in auth.users
    const { data: emailExists, error: checkError } = await supabase.rpc(
      'check_email_exists',
      { email }
    );
    if (checkError) throw checkError;
    if (emailExists) throw new Error('A user with this email already exists.');

    // Call Edge Function to create teacher (assume exists as create-student, but for teacher)
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-teacher`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email,
          password,
          full_name,
          designation,
          department,
          ...(phone ? { phone } : {}),
        }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create teacher');
    }
  },

  async updateTeacher(
    id: string,
    {
      full_name,
      designation,
      department,
    }: { full_name: string; designation?: string; department?: string }
  ): Promise<void> {
    // Update the profile for the teacher (no phone field)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name })
      .eq('id', id);
    if (profileError) throw profileError;
    // Update the teacher row for designation/department
    const { error: teacherError } = await supabase
      .from('teachers')
      .update({ designation, department })
      .eq('id', id);
    if (teacherError) throw teacherError;
  },

  async deleteTeacher(id: string): Promise<void> {
    // Delete the teacher row and optionally the user/profile
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
    // Optionally, delete the profile and/or auth user (not shown here)
  },
};
