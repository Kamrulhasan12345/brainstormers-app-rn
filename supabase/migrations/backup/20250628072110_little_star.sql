/*
  # Exams Management Schema

  1. New Tables
    - `exams` - Exam information and scheduling
    - `exam_results` - Student exam results
    - `exam_syllabus` - Syllabus topics for exams
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  exam_type exam_type NOT NULL,
  exam_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer NOT NULL,
  total_marks integer NOT NULL,
  location text,
  instructions text,
  status exam_status DEFAULT 'upcoming',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Exam syllabus topics
CREATE TABLE IF NOT EXISTS exam_syllabus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  topic text NOT NULL,
  weightage integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Exam results
CREATE TABLE IF NOT EXISTS exam_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  marks_obtained numeric(5,2) NOT NULL,
  grade text,
  percentage numeric(5,2),
  rank integer,
  remarks text,
  evaluated_by uuid REFERENCES profiles(id),
  evaluated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- Enable RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Exams policies
CREATE POLICY "Everyone can read exams"
  ON exams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage exams"
  ON exams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Exam syllabus policies
CREATE POLICY "Everyone can read exam syllabus"
  ON exam_syllabus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage syllabus"
  ON exam_syllabus FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Exam results policies
CREATE POLICY "Students can read own results"
  ON exam_results FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers and admins can manage results"
  ON exam_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();