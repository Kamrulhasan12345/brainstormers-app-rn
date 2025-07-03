-- Comprehensive Student Management System Migration

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  credits INTEGER DEFAULT 3,
  department VARCHAR(100),
  semester VARCHAR(20),
  academic_year VARCHAR(20),
  instructor_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_profiles table for extended student information
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  phone VARCHAR(20),
  address TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  guardian_name VARCHAR(100),
  guardian_phone VARCHAR(20),
  guardian_email VARCHAR(255),
  guardian_relationship VARCHAR(50),
  admission_date DATE DEFAULT CURRENT_DATE,
  current_semester INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_enrollments table
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active', -- active, completed, dropped, failed
  grade VARCHAR(5), -- A+, A, B+, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Update lectures table to link with courses
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id);
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE lectures ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT true;

-- Update exams table to link with courses
ALTER TABLE exams ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 180;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS total_marks INTEGER DEFAULT 100;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS passing_marks INTEGER DEFAULT 40;

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'absent', -- present, absent, late, excused
  marked_by UUID REFERENCES auth.users(id),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lecture_id)
);

-- Create exam_attendance table
CREATE TABLE exam_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'absent', -- present, absent, excused
  marks_obtained INTEGER,
  marked_by UUID REFERENCES auth.users(id),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

-- Enhanced notifications table
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- lecture_reminder, exam_reminder, lecture_missed, exam_missed, general, course_enrollment
  related_id UUID, -- lecture_id, exam_id, course_id, etc.
  related_type VARCHAR(50), -- lecture, exam, course, etc.
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX idx_lectures_course ON lectures(course_id);
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_lecture ON attendance(lecture_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_student_profiles_user ON student_profiles(user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at BEFORE UPDATE ON student_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample courses
INSERT INTO courses (name, code, description, credits, department, semester, academic_year) VALUES
('Computer Science Fundamentals', 'CS101', 'Introduction to computer science concepts and programming', 4, 'Computer Science', 'Fall 2024', '2024-25'),
('Data Structures and Algorithms', 'CS201', 'Advanced data structures and algorithm design', 4, 'Computer Science', 'Spring 2025', '2024-25'),
('Web Development', 'CS301', 'Full-stack web development with modern frameworks', 3, 'Computer Science', 'Fall 2024', '2024-25'),
('Database Systems', 'CS401', 'Database design, SQL, and database management', 3, 'Computer Science', 'Spring 2025', '2024-25'),
('Mathematics I', 'MATH101', 'Calculus and linear algebra fundamentals', 4, 'Mathematics', 'Fall 2024', '2024-25'),
('Physics I', 'PHY101', 'Classical mechanics and thermodynamics', 4, 'Physics', 'Fall 2024', '2024-25'),
('English Literature', 'ENG201', 'Modern and classical literature analysis', 3, 'English', 'Spring 2025', '2024-25'),
('Business Management', 'BUS101', 'Fundamentals of business and management', 3, 'Business', 'Fall 2024', '2024-25');

-- Create RLS policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for courses
CREATE POLICY "Everyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Admin and teachers can manage courses" ON courses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- Policies for student_profiles
CREATE POLICY "Users can view own profile" ON student_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can view all student profiles" ON student_profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admin can manage student profiles" ON student_profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policies for course_enrollments
CREATE POLICY "Students can view own enrollments" ON course_enrollments FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admin and teachers can view enrollments" ON course_enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);
CREATE POLICY "Admin can manage enrollments" ON course_enrollments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policies for attendance
CREATE POLICY "Students can view own attendance" ON attendance FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admin and teachers can manage attendance" ON attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- Policies for exam_attendance
CREATE POLICY "Students can view own exam attendance" ON exam_attendance FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Admin and teachers can manage exam attendance" ON exam_attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Admin and teachers can send notifications" ON notifications FOR INSERT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (recipient_id = auth.uid());

-- Function to automatically create student profile when user is created
CREATE OR REPLACE FUNCTION create_student_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'role' = 'student' THEN
    INSERT INTO student_profiles (
      user_id, 
      student_id, 
      first_name, 
      last_name
    ) VALUES (
      NEW.id,
      'STU' || LPAD(EXTRACT(YEAR FROM NOW())::text, 4, '0') || LPAD((SELECT COUNT(*) + 1 FROM student_profiles)::text, 4, '0'),
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Student'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto student profile creation
CREATE TRIGGER on_auth_user_created_student_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_student_profile();
