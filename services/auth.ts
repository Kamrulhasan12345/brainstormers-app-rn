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
        full_name: 'Admin User',
        role: 'admin',
        created_at: new Date().toISOString(),
      },
      'teacher@brainstormers.edu': {
        id: 'demo-teacher-id',
        email: credentials.email,
        full_name: 'Dr. Rajesh Kumar',
        role: 'teacher',
        created_at: new Date().toISOString(),
      },
      'student@brainstormers.edu': {
        id: 'demo-student-id',
        email: credentials.email,
        full_name: 'Arjun Sharma',
        role: 'student',
        created_at: new Date().toISOString(),
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
      full_name: data.name,
      role: data.role,
      created_at: data.created_at,
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return await this.fetchUserProfile(user.id);
  }

  async signUp(userData: {
    email: string;
    password: string;
    full_name: string;
    role: 'student' | 'teacher' | 'admin';
  }): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
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
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: userData.full_name,
      role: userData.role,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    return {
      id: data.user.id,
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      created_at: data.user.created_at,
    };
  }

  async isAuthenticated(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return !!user;
  }
}

export const authService = new AuthService();
