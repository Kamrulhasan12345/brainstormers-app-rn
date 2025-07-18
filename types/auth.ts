// This type matches the 'profiles' table in the database
export interface Profile {
  id: string;
  email?: string; // Not in profiles table, but often joined
  role: 'student' | 'teacher' | 'admin';
  full_name: string | null;
  created_at: string;
  // Add more fields if you extend the profiles table
}

export interface User extends Profile {
  email: string; // Make email required for User
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
