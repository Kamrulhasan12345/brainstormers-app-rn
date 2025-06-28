export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  rollNumber?: string;
  class?: string;
  phone?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  createdAt: string;
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