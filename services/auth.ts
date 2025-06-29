import { supabase, isDemoMode } from '@/lib/supabase';
import { User, LoginCredentials } from '@/types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    console.log('AuthService: Attempting login for', credentials.email);
    
    if (isDemoMode()) {
      return this.handleDemoLogin(credentials);
    }

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
    return await this.fetchUserProfile(data.user.id);
  }

  private async handleDemoLogin(credentials: LoginCredentials): Promise<User> {
    const mockUsers: Record<string, User> = {
      'admin@brainstormers.edu': {
        id: 'demo-admin-id',
        email: credentials.email,
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      'teacher@brainstormers.edu': {
        id: 'demo-teacher-id',
        email: credentials.email,
        name: 'Dr. Rajesh Kumar',
        role: 'teacher',
        createdAt: new Date().toISOString(),
      },
      'student@brainstormers.edu': {
        id: 'demo-student-id',
        email: credentials.email,
        name: 'Arjun Sharma',
        role: 'student',
        rollNumber: 'BS2027001',
        class: 'HSC Science - Batch 2027',
        phone: '+91 98765 43210',
        guardianPhone: '+91 98765 43211',
        guardianEmail: 'parent.arjun@gmail.com',
        createdAt: new Date().toISOString(),
      },
    };

    const mockPasswords: Record<string, string> = {
      'admin@brainstormers.edu': 'admin123',
      'teacher@brainstormers.edu': 'teacher123',
      'student@brainstormers.edu': 'student123',
    };

    if (mockPasswords[credentials.email] !== credentials.password) {
      throw new Error('Invalid credentials');
    }

    const user = mockUsers[credentials.email];
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  private async fetchUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      rollNumber: data.roll_number,
      class: data.class,
      phone: data.phone,
      guardianPhone: data.guardian_phone,
      guardianEmail: data.guardian_email,
      createdAt: data.created_at,
    };
  }

  async logout(): Promise<void> {
    console.log('AuthService: Signing out');
    
    if (isDemoMode()) {
      console.log('AuthService: Demo mode logout');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('AuthService: Logout error', error);
      throw new Error(error.message);
    }
    console.log('AuthService: Sign out successful');
  }

  async getCurrentUser(): Promise<User | null> {
    if (isDemoMode()) {
      return null;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    return await this.fetchUserProfile(user.id);
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

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        roll_number: userData.rollNumber,
        class: userData.class,
        phone: userData.phone,
        guardian_phone: userData.guardianPhone,
        guardian_email: userData.guardianEmail,
      });

    if (profileError) {
      throw new Error(profileError.message);
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