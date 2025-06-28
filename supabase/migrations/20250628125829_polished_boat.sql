/*
  # Create Demo Users for BrainStormers LMS

  1. Demo Users
    - Admin: admin@brainstormers.edu (password: admin123)
    - Teacher: teacher@brainstormers.edu (password: teacher123)  
    - Student: student@brainstormers.edu (password: student123)

  2. Security
    - All users have confirmed emails
    - Passwords are properly hashed using bcrypt
    - Profiles are created with appropriate roles and data

  3. Additional Data
    - Teacher profile with subject and qualifications
    - Student profile with roll number, class, and guardian info
    - Sample attendance and exam results for demonstration
*/

-- First, ensure we have the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create demo users with fixed UUIDs for consistency
DO $$
DECLARE
    admin_user_id UUID := '11111111-1111-1111-1111-111111111111';
    teacher_user_id UUID := '22222222-2222-2222-2222-222222222222';
    student_user_id UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- Delete existing demo users if they exist (for clean setup)
    DELETE FROM auth.users WHERE email IN ('admin@brainstormers.edu', 'teacher@brainstormers.edu', 'student@brainstormers.edu');

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
            admin_user_id,
            'authenticated',
            'authenticated',
            'admin@brainstormers.edu',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NULL,
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
            teacher_user_id,
            'authenticated',
            'authenticated',
            'teacher@brainstormers.edu',
            crypt('teacher123', gen_salt('bf')),
            NOW(),
            NULL,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Dr. Rajesh Kumar", "role": "teacher"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ),
        (
            '00000000-0000-0000-0000-000000000000',
            student_user_id,
            'authenticated',
            'authenticated',
            'student@brainstormers.edu',
            crypt('student123', gen_salt('bf')),
            NOW(),
            NULL,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Arjun Sharma", "role": "student"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );

    -- Insert corresponding profiles (these will be created by the trigger, but we'll ensure they have the right data)
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
        date_of_birth,
        address,
        guardian_notifications,
        created_at,
        updated_at
    ) VALUES 
        (
            admin_user_id,
            'admin@brainstormers.edu',
            'Admin User',
            'admin',
            NULL,
            NULL,
            '+91-9876543210',
            NULL,
            NULL,
            NULL,
            NULL,
            'BrainStormers Institute, Mumbai, Maharashtra',
            FALSE,
            NOW(),
            NOW()
        ),
        (
            teacher_user_id,
            'teacher@brainstormers.edu',
            'Dr. Rajesh Kumar',
            'teacher',
            NULL,
            NULL,
            '+91-9876543211',
            NULL,
            NULL,
            NULL,
            '1985-03-15',
            'Teacher Quarters, BrainStormers Institute, Mumbai',
            FALSE,
            NOW(),
            NOW()
        ),
        (
            student_user_id,
            'student@brainstormers.edu',
            'Arjun Sharma',
            'student',
            'BS2027001',
            'HSC Science - Batch 2027',
            '+91-9876543212',
            'Rajesh Sharma',
            '+91-9876543213',
            'parent.arjun@gmail.com',
            '2008-05-15',
            '123 Student Colony, Mumbai, Maharashtra',
            TRUE,
            NOW(),
            NOW()
        )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        roll_number = EXCLUDED.roll_number,
        class = EXCLUDED.class,
        phone = EXCLUDED.phone,
        guardian_name = EXCLUDED.guardian_name,
        guardian_phone = EXCLUDED.guardian_phone,
        guardian_email = EXCLUDED.guardian_email,
        date_of_birth = EXCLUDED.date_of_birth,
        address = EXCLUDED.address,
        guardian_notifications = EXCLUDED.guardian_notifications,
        updated_at = NOW();

    -- Insert teacher record for the teacher user
    INSERT INTO teachers (
        id,
        subject,
        qualification,
        experience_years,
        created_at
    ) VALUES (
        teacher_user_id,
        'Physics',
        'Ph.D. Physics, M.Sc. Physics, B.Ed.',
        8,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        subject = EXCLUDED.subject,
        qualification = EXCLUDED.qualification,
        experience_years = EXCLUDED.experience_years;

    -- Update existing lectures to have the teacher assigned
    UPDATE lectures 
    SET teacher_id = teacher_user_id 
    WHERE subject_id = '660e8400-e29b-41d4-a716-446655440001'; -- Physics lectures

    -- Add some sample attendance records for the student
    INSERT INTO attendance (
        lecture_id,
        student_id,
        status,
        marked_at,
        marked_by
    ) VALUES 
        (
            '770e8400-e29b-41d4-a716-446655440003', -- Calculus lecture (completed)
            student_user_id,
            'present',
            '2025-01-21T09:00:00Z',
            teacher_user_id
        ),
        (
            '770e8400-e29b-41d4-a716-446655440004', -- Biology lecture (completed)
            student_user_id,
            'present',
            '2025-01-19T11:00:00Z',
            teacher_user_id
        )
    ON CONFLICT (lecture_id, student_id) DO NOTHING;

    -- Add some sample exam results for the student
    INSERT INTO exam_results (
        exam_id,
        student_id,
        marks_obtained,
        grade,
        percentage,
        rank,
        remarks,
        evaluated_by,
        evaluated_at
    ) VALUES 
        (
            '880e8400-e29b-41d4-a716-446655440003', -- Calculus exam (completed)
            student_user_id,
            85.00,
            'A',
            85.00,
            5,
            'Excellent understanding of integration concepts. Keep up the good work!',
            teacher_user_id,
            '2025-01-18T16:00:00Z'
        ),
        (
            '880e8400-e29b-41d4-a716-446655440004', -- Biology exam (completed)
            student_user_id,
            78.00,
            'B+',
            86.67,
            8,
            'Good grasp of reproductive health topics. Work on diagram labeling.',
            teacher_user_id,
            '2025-01-18T18:00:00Z'
        )
    ON CONFLICT (exam_id, student_id) DO NOTHING;

    -- Add a sample lecture note from the student
    INSERT INTO lecture_notes (
        lecture_id,
        student_id,
        title,
        content
    ) VALUES (
        '770e8400-e29b-41d4-a716-446655440003', -- Calculus lecture
        student_user_id,
        'Integration Techniques Summary',
        'Key points from today''s lecture:
        1. Integration by parts: ∫u dv = uv - ∫v du
        2. Substitution method for complex functions
        3. Partial fractions for rational functions
        4. Applications in finding areas under curves'
    )
    ON CONFLICT DO NOTHING;

    -- Add a sample question from the student
    INSERT INTO lecture_questions (
        lecture_id,
        student_id,
        question,
        answer,
        answered_by,
        answered_at,
        upvotes
    ) VALUES (
        '770e8400-e29b-41d4-a716-446655440001', -- Physics lecture
        student_user_id,
        'Can you explain the practical applications of electromagnetic induction in everyday devices?',
        'Great question! Electromagnetic induction is used in many devices: transformers (power distribution), electric generators (power plants), induction cooktops (cooking), wireless charging (phones), and electric motors. The principle is that changing magnetic fields create electric currents, which is fundamental to modern electrical technology.',
        teacher_user_id,
        NOW(),
        3
    )
    ON CONFLICT DO NOTHING;

END $$;

-- Create some sample notifications for the users
INSERT INTO notifications (
    title,
    message,
    type,
    priority,
    scheduled_for,
    created_by
) VALUES 
    (
        'Welcome to BrainStormers LMS',
        'Welcome to our Learning Management System! Explore lectures, exams, and interactive features.',
        'general',
        1,
        NOW(),
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'Physics Unit Test Reminder',
        'Don''t forget about the Electromagnetic Waves unit test scheduled for tomorrow at 10:00 AM in Hall A.',
        'exam',
        2,
        NOW() + interval '1 day',
        '22222222-2222-2222-2222-222222222222'
    )
ON CONFLICT DO NOTHING;

-- Create notification recipients
INSERT INTO notification_recipients (
    notification_id,
    recipient_id
) 
SELECT 
    n.id,
    p.id
FROM notifications n
CROSS JOIN profiles p
WHERE n.title IN ('Welcome to BrainStormers LMS', 'Physics Unit Test Reminder')
ON CONFLICT DO NOTHING;