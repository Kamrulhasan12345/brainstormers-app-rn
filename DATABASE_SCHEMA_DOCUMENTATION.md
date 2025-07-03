# BrainStormers Authentication & Database Schema Documentation

## Overview

The BrainStormers app uses **Supabase** for authentication and database management, with a role-based access control system that determines user permissions and navigation based on their assigned role.

## Database Schema Architecture

### 1. **Core Authentication Tables**

#### `auth.users` (Supabase Built-in)

```sql
-- This is Supabase's built-in authentication table
id: uuid (primary key)
email: text
encrypted_password: text
email_confirmed_at: timestamptz
raw_user_meta_data: jsonb  -- Stores additional signup data
created_at: timestamptz
updated_at: timestamptz
```

#### `public.profiles` (Custom Extended Profile)

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role user_role NOT NULL DEFAULT 'student',  -- ENUM: 'student', 'teacher', 'admin'
  roll_number text,           -- For students
  class text,                 -- Student's class/batch
  phone text,
  guardian_name text,         -- For students
  guardian_phone text,        -- For students
  guardian_email text,        -- For students
  date_of_birth date,
  address text,
  guardian_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. **Role System**

#### User Roles Enum

```sql
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
```

**Role Hierarchy:**

- **Admin**: Full system access, user management, all features
- **Teacher**: Course management, student progress, exam creation
- **Student**: Course access, exam participation, progress viewing

### 3. **Supporting Tables**

#### `teachers` (Teacher-specific data)

```sql
CREATE TABLE teachers (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  qualification text,
  experience_years integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

#### `classes` (Academic classes)

```sql
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  academic_year text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

## Authentication Flow

### 1. **Login Process**

#### Step 1: Email/Password Validation

```typescript
// In AuthService.login()
const { data, error } = await supabase.auth.signInWithPassword({
  email: credentials.email,
  password: credentials.password,
});
```

#### Step 2: Profile Lookup

```typescript
// After successful auth, fetch user profile
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId) // userId from auth.users
  .single();
```

#### Step 3: Role-based User Object Creation

```typescript
return {
  id: data.id,
  email: data.email,
  name: data.name,
  role: data.role, // 'student' | 'teacher' | 'admin'
  rollNumber: data.roll_number,
  class: data.class,
  phone: data.phone,
  guardianPhone: data.guardian_phone,
  guardianEmail: data.guardian_email,
  createdAt: data.created_at,
};
```

### 2. **Role Determination Logic**

The user's role is determined from the `profiles.role` field, which is:

1. **Set during registration** via the `handle_new_user()` trigger
2. **Extracted from signup metadata** or defaults to 'student'
3. **Stored permanently** in the profiles table
4. **Used for navigation routing** in the app

### 3. **Demo Mode Authentication**

For development/testing purposes, the app includes demo accounts:

```typescript
const mockUsers: Record<string, User> = {
  'admin@brainstormers.edu': {
    role: 'admin',
    name: 'Admin User',
    // ... other admin data
  },
  'teacher@brainstormers.edu': {
    role: 'teacher',
    name: 'Dr. Rajesh Kumar',
    // ... other teacher data
  },
  'student@brainstormers.edu': {
    role: 'student',
    name: 'Arjun Sharma',
    rollNumber: 'BS2027001',
    class: 'HSC Science - Batch 2027',
    // ... other student data
  },
};
```

## Navigation & Role-based Routing

### Navigation Logic (in `_layout.tsx`)

```typescript
if (!isAuthenticated) {
  router.replace('/login-selection');
} else {
  // Route based on user role
  if (user?.role === 'admin') {
    router.replace('/admin');
  } else if (user?.role === 'teacher') {
    router.replace('/teacher');
  } else {
    router.replace('/(tabs)'); // Student dashboard
  }
}
```

### Role-specific Access Control

#### Students Access:

- `/app/(tabs)/` - Student dashboard with courses, exams, lectures, Q&A, profile
- Limited to their own data and assigned courses

#### Teachers Access:

- `/app/teacher/` - Teacher dashboard with course management, student progress
- Can view/manage students in their assigned classes
- Can create and manage exams, lectures, assignments

#### Admins Access:

- `/app/admin/` - Full administrative dashboard
- User management, system settings, all data access
- Can manage teachers, students, courses, and system configuration

## Security Implementation

### 1. **Row Level Security (RLS)**

```sql
-- Users can only read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. **Automatic Profile Creation**

```sql
-- Trigger that creates profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;
```

## Demo Credentials

| Role    | Email                       | Password     | Access Level                          |
| ------- | --------------------------- | ------------ | ------------------------------------- |
| Student | `student@brainstormers.edu` | `student123` | Student dashboard, courses, exams     |
| Teacher | `teacher@brainstormers.edu` | `teacher123` | Teacher dashboard, student management |
| Admin   | `admin@brainstormers.edu`   | `admin123`   | Full system access, user management   |

## Summary

The authentication system works as follows:

1. **User logs in** with email/password
2. **Supabase authenticates** against `auth.users` table
3. **System fetches profile** from `profiles` table using the authenticated user ID
4. **Role is determined** from `profiles.role` field
5. **Navigation routes** user to appropriate dashboard based on role
6. **Access control** is enforced through RLS policies and role checks
7. **User data** is filtered and presented based on role permissions

This creates a secure, scalable role-based system where users only see and access data appropriate to their role in the educational system.
