/*
  # Create Demo User Accounts

  1. New Users
    - Admin user: admin@brainstormers.edu
    - Teacher user: teacher@brainstormers.edu  
    - Student user: student@brainstormers.edu

  2. Authentication
    - Creates users in auth.users table with proper passwords
    - Sets up corresponding profiles with appropriate roles

  3. Security
    - Uses secure password hashing
    - Assigns proper roles and permissions
*/

-- Insert demo users into auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@brainstormers.edu',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User", "role": "admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'teacher@brainstormers.edu',
    crypt('teacher123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Teacher User", "role": "teacher"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'student@brainstormers.edu',
    crypt('student123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Student User", "role": "student"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

-- Insert corresponding profiles
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  roll_number,
  class,
  phone,
  guardian_name,
  guardian_phone,
  guardian_email,
  created_at,
  updated_at
) VALUES 
  (
    (SELECT id FROM auth.users WHERE email = 'admin@brainstormers.edu'),
    'admin@brainstormers.edu',
    'Admin User',
    'admin',
    NULL,
    NULL,
    '+91-9876543210',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'teacher@brainstormers.edu'),
    'teacher@brainstormers.edu',
    'Teacher User',
    'teacher',
    NULL,
    NULL,
    '+91-9876543211',
    NULL,
    NULL,
    NULL,
    NOW(),
    NOW()
  ),
  (
    (SELECT id FROM auth.users WHERE email = 'student@brainstormers.edu'),
    'student@brainstormers.edu',
    'Student User',
    'student',
    'STU001',
    '12th Science',
    '+91-9876543212',
    'Guardian Name',
    '+91-9876543213',
    'guardian@example.com',
    NOW(),
    NOW()
  );

-- Insert teacher record for the teacher user
INSERT INTO teachers (
  id,
  subject,
  qualification,
  experience_years,
  created_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'teacher@brainstormers.edu'),
  'Mathematics',
  'M.Sc Mathematics, B.Ed',
  5,
  NOW()
);