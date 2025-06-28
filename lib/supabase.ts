import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// For demo purposes, we'll use placeholder values
// In a real app, you would get these from your Supabase project
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Create a mock client for demo purposes if environment variables are not set
const createMockClient = () => ({
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      // Mock authentication for demo
      const mockUsers = {
        'admin@brainstormers.edu': { role: 'admin', name: 'Admin User' },
        'teacher@brainstormers.edu': { role: 'teacher', name: 'Dr. Rajesh Kumar' },
        'student@brainstormers.edu': { role: 'student', name: 'Arjun Sharma' },
      };

      const mockPasswords = {
        'admin@brainstormers.edu': 'admin123',
        'teacher@brainstormers.edu': 'teacher123',
        'student@brainstormers.edu': 'student123',
      };

      if (mockPasswords[email as keyof typeof mockPasswords] === password) {
        const userData = mockUsers[email as keyof typeof mockUsers];
        return {
          data: {
            user: {
              id: `mock-${userData.role}-id`,
              email,
              created_at: new Date().toISOString(),
            },
          },
          error: null,
        };
      }

      return {
        data: { user: null },
        error: { message: 'Invalid credentials' },
      };
    },
    signOut: async () => {
      console.log('Mock signOut called');
      return { error: null };
    },
    getSession: async () => {
      return { data: { session: null } };
    },
    getUser: async () => {
      return { data: { user: null } };
    },
    onAuthStateChange: (callback: any) => {
      console.log('Mock auth state change listener registered');
      return {
        data: {
          subscription: {
            unsubscribe: () => console.log('Mock auth listener unsubscribed'),
          },
        },
      };
    },
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          // Mock profile data
          return {
            data: {
              id: 'mock-user-id',
              email: 'demo@brainstormers.edu',
              name: 'Demo User',
              role: 'student',
              roll_number: 'BS2027001',
              class: 'HSC Science - Batch 2027',
              phone: '+91 98765 43210',
              guardian_phone: '+91 98765 43211',
              guardian_email: 'parent@gmail.com',
              created_at: new Date().toISOString(),
            },
            error: null,
          };
        },
      }),
    }),
  }),
});

// Use mock client if environment variables are not properly set
export const supabase = (supabaseUrl === 'https://demo.supabase.co' || supabaseAnonKey === 'demo-key') 
  ? createMockClient() as any
  : createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });