/*
  # Lectures Management Schema

  1. New Tables
    - `lectures` - Lecture information and scheduling
    - `lecture_materials` - Materials associated with lectures
    - `lecture_notes` - Student-uploaded notes for lectures
    - `lecture_questions` - Q&A for lectures
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  topic text NOT NULL,
  description text,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location text,
  status lecture_status DEFAULT 'scheduled',
  max_students integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lecture materials table
CREATE TABLE IF NOT EXISTS lecture_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid REFERENCES lectures(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  material_type text DEFAULT 'document',
  file_url text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Student lecture notes table
CREATE TABLE IF NOT EXISTS lecture_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid REFERENCES lectures(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  file_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lecture Q&A table
CREATE TABLE IF NOT EXISTS lecture_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid REFERENCES lectures(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  answered_by uuid REFERENCES profiles(id),
  answered_at timestamptz,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid REFERENCES lectures(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status attendance_status NOT NULL,
  marked_at timestamptz DEFAULT now(),
  marked_by uuid REFERENCES profiles(id),
  UNIQUE(lecture_id, student_id)
);

-- Enable RLS
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Lectures policies
CREATE POLICY "Everyone can read lectures"
  ON lectures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage own lectures"
  ON lectures FOR ALL
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lecture materials policies
CREATE POLICY "Everyone can read lecture materials"
  ON lecture_materials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage materials"
  ON lecture_materials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN lectures l ON l.teacher_id = p.id
      WHERE p.id = auth.uid() AND l.id = lecture_id
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Lecture notes policies
CREATE POLICY "Students can read all notes"
  ON lecture_notes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('student', 'teacher', 'admin')
    )
  );

CREATE POLICY "Students can manage own notes"
  ON lecture_notes FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

-- Lecture questions policies
CREATE POLICY "Everyone can read questions"
  ON lecture_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can ask questions"
  ON lecture_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Teachers can answer questions"
  ON lecture_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Attendance policies
CREATE POLICY "Students can read own attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN lectures l ON l.teacher_id = p.id
      WHERE p.id = auth.uid() AND l.id = lecture_id
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_lectures_updated_at
  BEFORE UPDATE ON lectures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lecture_notes_updated_at
  BEFORE UPDATE ON lecture_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();