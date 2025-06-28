import { supabase } from '@/lib/supabase';
import { User, LoginCredentials } from '@/types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    console.log('AuthService: Attempting login for', credentials.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('AuthService: Login error', error);
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login failed - no user returned');
    }

    console.log('AuthService: Login successful, fetching profile');

    // For demo purposes, return mock user data based on email
    const mockUsers: Record<string, User> = {
      'admin@brainstormers.edu': {
        id: data.user.id,
        email: credentials.email,
        name: 'Admin User',
        role: 'admin',
        createdAt: data.user.created_at,
      },
      'teacher@brainstormers.edu': {
        id: data.user.id,
        email: credentials.email,
        name: 'Dr. Rajesh Kumar',
        role: 'teacher',
        createdAt: data.user.created_at,
      },
      'student@brainstormers.edu': {
        id: data.user.id,
        email: credentials.email,
        name: 'Arjun Sharma',
        role: 'student',
        rollNumber: 'BS2027001',
        class: 'HSC Science - Batch 2027',
        phone: '+91 98765 43210',
        guardianPhone: '+91 98765 43211',
        guardianEmail: 'parent.arjun@gmail.com',
        createdAt: data.user.created_at,
      },
    };

    const user = mockUsers[credentials.email];
    if (!user) {
      throw new Error('User profile not found');
    }

    console.log('AuthService: Profile fetched successfully', user.role);
    return user;
  }

  async logout(): Promise<void> {
    console.log('AuthService: Signing out');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthService: Logout error', error);
      throw new Error(error.message);
    }
    console.log('AuthService: Sign out successful');
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // For demo purposes, return mock user data
    const mockUsers: Record<string, User> = {
      'admin@brainstormers.edu': {
        id: user.id,
        email: user.email || '',
        name: 'Admin User',
        role: 'admin',
        createdAt: user.created_at,
      },
      'teacher@brainstormers.edu': {
        id: user.id,
        email: user.email || '',
        name: 'Dr. Rajesh Kumar',
        role: 'teacher',
        createdAt: user.created_at,
      },
      'student@brainstormers.edu': {
        id: user.id,
        email: user.email || '',
        name: 'Arjun Sharma',
        role: 'student',
        rollNumber: 'BS2027001',
        class: 'HSC Science - Batch 2027',
        phone: '+91 98765 43210',
        guardianPhone: '+91 98765 43211',
        guardianEmail: 'parent.arjun@gmail.com',
        createdAt: user.created_at,
      },
    };

    return mockUsers[user.email || ''] || null;
  }

  async signUp(userData: {
    email: string;
    password: string;
    name: string;
    role: 'student' | 'teacher' | 'admin';
    rollNumber?: string;
    class?: string;
    phone?: string;
    guardianPhone?: string;
    guardianEmail?: string;
  }): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          role: userData.role,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Sign up failed');
    }

    return {
      id: data.user.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      rollNumber: userData.rollNumber,
      class: userData.class,
      phone: userData.phone,
      guardianPhone: userData.guardianPhone,
      guardianEmail: userData.guardianEmail,
      createdAt: data.user.created_at,
    };
  }

  async isAuthenticated(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  }
}

export const authService = new AuthService();