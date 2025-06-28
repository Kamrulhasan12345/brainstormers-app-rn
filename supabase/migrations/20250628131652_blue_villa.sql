/*
  # Fix authentication policies without auth schema access

  1. Security
    - Create helper function in public schema instead of auth schema
    - Update all RLS policies to use the new helper function
    - Remove direct access to auth.users table

  2. Changes
    - Create public.get_user_role() function
    - Update all table policies to use the new function
    - Ensure proper security with SECURITY DEFINER
*/

-- Create a helper function to check user roles safely in public schema
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'role',
    'student'
  );
$$;

-- Drop all existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Profiles policies - simplified and secure
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

-- Teachers policies
DROP POLICY IF EXISTS "Teachers can read own data" ON teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON teachers;

CREATE POLICY "Teachers can read own data"
  ON teachers FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage teachers"
  ON teachers FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    public.get_user_role() = 'admin'
  );

-- Classes policies
DROP POLICY IF EXISTS "Everyone can read classes" ON classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;

CREATE POLICY "Everyone can read classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Subjects policies
DROP POLICY IF EXISTS "Everyone can read subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

CREATE POLICY "Everyone can read subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Lectures policies
DROP POLICY IF EXISTS "Everyone can read lectures" ON lectures;
DROP POLICY IF EXISTS "Teachers can manage own lectures" ON lectures;

CREATE POLICY "Everyone can read lectures"
  ON lectures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage own lectures"
  ON lectures FOR ALL
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    public.get_user_role() = 'admin'
  );

-- Lecture materials policies
DROP POLICY IF EXISTS "Everyone can read lecture materials" ON lecture_materials;
DROP POLICY IF EXISTS "Teachers and admins can manage materials" ON lecture_materials;

CREATE POLICY "Everyone can read lecture materials"
  ON lecture_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage materials"
  ON lecture_materials FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    public.get_user_role() = 'admin' OR
    EXISTS (
      SELECT 1 FROM lectures l
      WHERE l.id = lecture_id AND l.teacher_id = auth.uid()
    )
  );

-- Lecture notes policies
DROP POLICY IF EXISTS "Students can read all notes" ON lecture_notes;
DROP POLICY IF EXISTS "Students can manage own notes" ON lecture_notes;

CREATE POLICY "Students can read all notes"
  ON lecture_notes FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    public.get_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Students can manage own notes"
  ON lecture_notes FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

-- Lecture questions policies
DROP POLICY IF EXISTS "Everyone can read questions" ON lecture_questions;
DROP POLICY IF EXISTS "Students can ask questions" ON lecture_questions;
DROP POLICY IF EXISTS "Teachers can answer questions" ON lecture_questions;

CREATE POLICY "Everyone can read questions"
  ON lecture_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can ask questions"
  ON lecture_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    public.get_user_role() = 'student'
  );

CREATE POLICY "Teachers can answer questions"
  ON lecture_questions FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('teacher', 'admin'));

-- Attendance policies
DROP POLICY IF EXISTS "Students can read own attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance" ON attendance;

CREATE POLICY "Students can read own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    public.get_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Teachers can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    marked_by = auth.uid() OR
    public.get_user_role() IN ('teacher', 'admin') OR
    EXISTS (
      SELECT 1 FROM lectures l
      WHERE l.id = lecture_id AND l.teacher_id = auth.uid()
    )
  );

-- Exams policies
DROP POLICY IF EXISTS "Everyone can read exams" ON exams;
DROP POLICY IF EXISTS "Teachers and admins can manage exams" ON exams;

CREATE POLICY "Everyone can read exams"
  ON exams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage exams"
  ON exams FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    public.get_user_role() IN ('teacher', 'admin')
  );

-- Exam syllabus policies
DROP POLICY IF EXISTS "Everyone can read exam syllabus" ON exam_syllabus;
DROP POLICY IF EXISTS "Teachers and admins can manage syllabus" ON exam_syllabus;

CREATE POLICY "Everyone can read exam syllabus"
  ON exam_syllabus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage syllabus"
  ON exam_syllabus FOR ALL
  TO authenticated
  USING (public.get_user_role() IN ('teacher', 'admin'));

-- Exam results policies
DROP POLICY IF EXISTS "Students can read own results" ON exam_results;
DROP POLICY IF EXISTS "Teachers and admins can manage results" ON exam_results;

CREATE POLICY "Students can read own results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    public.get_user_role() IN ('teacher', 'admin')
  );

CREATE POLICY "Teachers and admins can manage results"
  ON exam_results FOR ALL
  TO authenticated
  USING (
    evaluated_by = auth.uid() OR
    public.get_user_role() IN ('teacher', 'admin')
  );

-- Notifications policies
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Users can read notifications sent to them" ON notifications;

CREATE POLICY "Admins can manage notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    public.get_user_role() = 'admin'
  );

CREATE POLICY "Users can read notifications sent to them"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipients nr
      WHERE nr.notification_id = id AND nr.recipient_id = auth.uid()
    )
  );

-- Notification recipients policies
DROP POLICY IF EXISTS "Users can read own notification status" ON notification_recipients;
DROP POLICY IF EXISTS "Users can update own notification status" ON notification_recipients;
DROP POLICY IF EXISTS "Admins can manage notification recipients" ON notification_recipients;

CREATE POLICY "Users can read own notification status"
  ON notification_recipients FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notification status"
  ON notification_recipients FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Admins can manage notification recipients"
  ON notification_recipients FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin');