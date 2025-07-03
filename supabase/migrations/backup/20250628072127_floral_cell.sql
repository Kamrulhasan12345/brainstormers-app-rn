/*
  # Sample Data for BrainStormers LMS

  This migration inserts sample data for testing and development purposes.
  Includes users, classes, subjects, lectures, exams, and other entities.
*/

-- Insert sample classes
INSERT INTO classes (id, name, description, academic_year) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'HSC Science - Batch 2027', 'Higher Secondary Certificate Science Stream', '2024-2027'),
  ('550e8400-e29b-41d4-a716-446655440002', 'HSC Commerce - Batch 2027', 'Higher Secondary Certificate Commerce Stream', '2024-2027'),
  ('550e8400-e29b-41d4-a716-446655440003', 'HSC Arts - Batch 2027', 'Higher Secondary Certificate Arts Stream', '2024-2027');

-- Insert sample subjects
INSERT INTO subjects (id, name, code, description) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Physics', 'PHY', 'Study of matter, energy, and their interactions'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Chemistry', 'CHE', 'Study of matter and chemical reactions'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Mathematics', 'MAT', 'Study of numbers, structures, and patterns'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Biology', 'BIO', 'Study of living organisms'),
  ('660e8400-e29b-41d4-a716-446655440005', 'English', 'ENG', 'English language and literature'),
  ('660e8400-e29b-41d4-a716-446655440006', 'Economics', 'ECO', 'Study of economic systems and behavior'),
  ('660e8400-e29b-41d4-a716-446655440007', 'Accountancy', 'ACC', 'Study of financial accounting and bookkeeping'),
  ('660e8400-e29b-41d4-a716-446655440008', 'History', 'HIS', 'Study of past events and civilizations'),
  ('660e8400-e29b-41d4-a716-446655440009', 'Geography', 'GEO', 'Study of Earth and its features');

-- Note: Sample users will be created through the authentication system
-- The trigger will automatically create profiles when users sign up

-- Sample lectures (using placeholder UUIDs for teacher_id - these should be updated with real teacher IDs)
INSERT INTO lectures (id, subject_id, class_id, topic, description, scheduled_date, start_time, end_time, location, status) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Electromagnetic Induction', 'Understanding Faradays law and its applications in real-world scenarios', '2025-01-22', '10:00', '11:30', 'Room A-101', 'scheduled'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Organic Compounds - Alcohols', 'Classification, properties, and reactions of alcohols with practical examples', '2025-01-23', '14:00', '15:30', 'Room B-205', 'scheduled'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Calculus - Derivatives', 'Advanced derivative techniques and their applications in optimization problems', '2025-01-21', '09:00', '10:30', 'Room A-203', 'completed'),
  ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Human Reproduction System', 'Detailed study of male and female reproductive systems with diagrams', '2025-01-19', '11:00', '12:30', 'Room C-101', 'completed');

-- Sample lecture materials
INSERT INTO lecture_materials (lecture_id, title, description, material_type) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'Textbook Chapter 12', 'Electromagnetic Induction chapter from physics textbook', 'document'),
  ('770e8400-e29b-41d4-a716-446655440001', 'Lab Manual', 'Laboratory experiments on electromagnetic induction', 'document'),
  ('770e8400-e29b-41d4-a716-446655440002', 'Reference Book', 'Organic chemistry reference material', 'document'),
  ('770e8400-e29b-41d4-a716-446655440003', 'Problem Sets', 'Calculus practice problems', 'document');

-- Sample exams
INSERT INTO exams (id, subject_id, class_id, title, description, exam_type, exam_date, start_time, end_time, duration_minutes, total_marks, location, instructions, status) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Electromagnetic Waves', 'Unit test covering electromagnetic wave theory and applications', 'Unit Test', '2025-01-25', '10:00', '12:00', 120, 100, 'Hall A', 'Bring calculator and drawing instruments. No mobile phones allowed.', 'upcoming'),
  ('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Organic Chemistry - Aldehydes & Ketones', 'Chapter test on aldehydes and ketones', 'Chapter Test', '2025-01-28', '14:00', '16:00', 120, 80, 'Hall B', 'Periodic table will be provided. Show all working clearly.', 'upcoming'),
  ('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Calculus - Integration', 'Monthly test on integration techniques', 'Monthly Test', '2025-01-18', '09:00', '11:00', 120, 100, 'Hall C', 'Formula sheet provided. Attempt all questions.', 'completed'),
  ('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Reproductive Health', 'Unit test on reproductive health and population control', 'Unit Test', '2025-01-18', '11:00', '13:00', 120, 90, 'Hall A', 'Read all questions carefully before answering.', 'completed');

-- Sample exam syllabus
INSERT INTO exam_syllabus (exam_id, topic, weightage) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'Wave equation', 30),
  ('880e8400-e29b-41d4-a716-446655440001', 'EM spectrum', 35),
  ('880e8400-e29b-41d4-a716-446655440001', 'Properties of EM waves', 35),
  ('880e8400-e29b-41d4-a716-446655440002', 'Preparation methods', 40),
  ('880e8400-e29b-41d4-a716-446655440002', 'Chemical reactions', 35),
  ('880e8400-e29b-41d4-a716-446655440002', 'Identification tests', 25),
  ('880e8400-e29b-41d4-a716-446655440003', 'Indefinite integration', 40),
  ('880e8400-e29b-41d4-a716-446655440003', 'Definite integration', 35),
  ('880e8400-e29b-41d4-a716-446655440003', 'Applications', 25);

-- Sample notifications
INSERT INTO notifications (title, message, type, priority, scheduled_for) VALUES
  ('Physics Unit Test Tomorrow', 'Electromagnetic waves chapter test at 11 AM in Hall A', 'exam', 2, now() + interval '1 day'),
  ('New Study Material Available', 'Chemistry notes uploaded for Organic compounds', 'general', 1, now()),
  ('Holiday Notice', 'Institute will remain closed on Republic Day', 'general', 1, now() - interval '1 day');

-- Create some sample Q&A entries (these will need student IDs once users are created)
-- This is a placeholder structure - actual data will be inserted when students ask questions