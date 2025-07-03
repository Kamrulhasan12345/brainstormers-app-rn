/*
  # Create demo user accounts for login

  1. Demo Users
    - Admin: admin@brainstormers.edu / admin123
    - Teacher: teacher@brainstormers.edu / teacher123
    - Student: student@brainstormers.edu / student123

  2. Security
    - Users created in auth.users table with proper password hashing
    - Corresponding profiles created with appropriate roles
    - Teacher record created for teacher user

  3. Data Handling
    - Uses UPSERT operations to handle existing records
    - Prevents duplicate key violations
*/

-- First, store user IDs in variables for consistency
DO $$
DECLARE
    admin_user_id UUID;
    teacher_user_id UUID;
    student_user_id UUID;
BEGIN
    -- Generate consistent UUIDs for demo users
    admin_user_id := '11111111-1111-1111-1111-111111111111';
    teacher_user_id := '22222222-2222-2222-2222-222222222222';
    student_user_id := '33333333-3333-3333-3333-333333333333';

    -- Insert or update demo users in auth.users table
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
            teacher_user_id,
            'authenticated',
            'authenticated',
            'teacher@brainstormers.edu',
            crypt('teacher123', gen_salt('bf')),
            NOW(),
            NOW(),
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
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Arjun Sharma", "role": "student"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = EXCLUDED.encrypted_password,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = NOW();

    -- Insert or update corresponding profiles
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
        updated_at = NOW();

    -- Insert or update teacher record for the teacher user
    INSERT INTO teachers (
        id,
        subject,
        qualification,
        experience_years,
        created_at
    ) VALUES (
        teacher_user_id,
        'Physics',
        'Ph.D. Physics, M.Sc. Physics',
        8,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        subject = EXCLUDED.subject,
        qualification = EXCLUDED.qualification,
        experience_years = EXCLUDED.experience_years;

END $$;