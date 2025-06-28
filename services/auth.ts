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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('AuthService: Profile fetch error', profileError);
      throw new Error('Failed to fetch user profile: ' + profileError.message);
    }

    if (!profile) {
      throw new Error('User profile not found');
    }

    console.log('AuthService: Profile fetched successfully', profile.role);

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      rollNumber: profile.roll_number,
      class: profile.class,
      phone: profile.phone,
      guardianPhone: profile.guardian_phone,
      guardianEmail: profile.guardian_email,
      createdAt: profile.created_at,
    };
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      rollNumber: profile.roll_number,
      class: profile.class,
      phone: profile.phone,
      guardianPhone: profile.guardian_phone,
      guardianEmail: profile.guardian_email,
      createdAt: profile.created_at,
    };
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

    // Update profile with additional data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        roll_number: userData.rollNumber,
        class: userData.class,
        phone: userData.phone,
        guardian_phone: userData.guardianPhone,
        guardian_email: userData.guardianEmail,
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
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