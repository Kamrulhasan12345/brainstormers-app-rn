/*
  # Fix RLS policies to prevent infinite recursion

  1. Security Changes
    - Drop existing problematic policies
    - Create new policies that don't cause infinite recursion
    - Use auth.uid() directly instead of referencing profiles table within policies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

-- Create new policies that avoid infinite recursion
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- For admin access, we'll use a simpler approach that checks the user's metadata
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- Fix teachers policies to avoid recursion
DROP POLICY IF EXISTS "Admins can manage teachers" ON teachers;
CREATE POLICY "Admins can manage teachers"
  ON teachers FOR ALL
  TO authenticated
  USING (
    auth.uid() = id OR
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- Fix classes policies
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- Fix subjects policies
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- Fix lectures policies
DROP POLICY IF EXISTS "Teachers can manage own lectures" ON lectures;
CREATE POLICY "Teachers can manage own lectures"
  ON lectures FOR ALL
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- Fix lecture materials policies
DROP POLICY IF EXISTS "Teachers and admins can manage materials" ON lecture_materials;
CREATE POLICY "Teachers and admins can manage materials"
  ON lecture_materials FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM lectures l
      WHERE l.id = lecture_id AND l.teacher_id = auth.uid()
    )
  );

-- Fix lecture notes policies
DROP POLICY IF EXISTS "Students can read all notes" ON lecture_notes;
CREATE POLICY "Students can read all notes"
  ON lecture_notes FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    (auth.jwt() ->> 'role') IN ('teacher', 'admin') OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' IN ('teacher', 'admin')
    )
  );

-- Fix lecture questions policies
DROP POLICY IF EXISTS "Students can ask questions" ON lecture_questions;
CREATE POLICY "Students can ask questions"
  ON lecture_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND (
      (auth.jwt() ->> 'role') = 'student' OR
      auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data ->> 'role' = 'student'
      )
    )
  );

DROP POLICY IF EXISTS "Teachers can answer questions" ON lecture_questions;
CREATE POLICY "Teachers can answer questions"
  ON lecture_questions FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('teacher', 'admin') OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' IN ('teacher', 'admin')
    )
  );

-- Fix attendance policies
DROP POLICY IF EXISTS "Students can read own attendance" ON attendance;
CREATE POLICY "Students can read own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    (auth.jwt() ->> 'role') IN ('teacher', 'admin') OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' IN ('teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS "Teachers can manage attendance" ON attendance;
CREATE POLICY "Teachers can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    marked_by = auth.uid() OR
    (auth.jwt() ->> 'role') IN ('teacher', 'admin') OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' IN ('teacher', 'admin')
    ) OR
    EXISTS (
      SELECT 1 FROM lectures l
      WHERE l.id = lecture_id AND l.teacher_id = auth.uid()
    )
  );

-- Fix exams policies
DROP POLICY IF EXISTS "Teachers and admins can manage exams" ON exams;
CREATE POLICY "Teachers and admins can manage exams"
  ON exams FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    (auth.jwt() ->> 'role') IN ('teacher', 'admin') OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' IN ('teacher', 'admin')
    )
  );

-- Fix exam syllabus policies
DROP POLICY IF EXISTS "Teachers and admins can manage syllabus" ON exam_syllabus;
CREATE POLICY "Teachers and admins can manage syllabus"
  ON exam_syllabus FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') IN ('teacher', 'admin') OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' IN ('teacher', 'admin')
    )
  );

-- Fix exam results policies
DROP POLICY IF EXISTS "Students can read own results" ON exam_results;
CREATE POLICY "Students can read own results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    (auth.jwt() ->> 'role') IN ('teacher', 'admin') OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' IN ('teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS "Teachers and admins can manage results" ON exam_results;
CREATE POLICY "Teachers and admins can manage results"
  ON exam_results FOR ALL
  TO authenticated
  USING (
    evaluated_by = auth.uid() OR
    (auth.jwt() ->> 'role') IN ('teacher', 'admin') OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' IN ('teacher', 'admin')
    )
  );

-- Fix notifications policies
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
CREATE POLICY "Admins can manage notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can read notifications sent to them" ON notifications;
CREATE POLICY "Users can read notifications sent to them"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM notification_recipients nr
      WHERE nr.notification_id = id AND nr.recipient_id = auth.uid()
    )
  );

-- Fix notification recipients policies
DROP POLICY IF EXISTS "Admins can manage notification recipients" ON notification_recipients;
CREATE POLICY "Admins can manage notification recipients"
  ON notification_recipients FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'role') = 'admin' OR
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data ->> 'role' = 'admin'
    )
  );