import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, LoginCredentials } from '@/types/auth';

const STORAGE_KEY = 'brainstormers_auth';
const TOKEN_KEY = 'brainstormers_token';

// Mock users database - In production, this would be a real API
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'admin@brainstormers.edu',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'teacher@brainstormers.edu',
    name: 'Dr. Rajesh Kumar',
    role: 'teacher',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'arjun.sharma@brainstormers.edu',
    name: 'Arjun Sharma',
    role: 'student',
    rollNumber: 'BS2027001',
    class: 'HSC Science - Batch 2027',
    phone: '+91 98765 43210',
    guardianPhone: '+91 98765 43211',
    guardianEmail: 'parent.arjun@gmail.com',
    createdAt: new Date().toISOString(),
  },
];

// Mock passwords - In production, these would be hashed
const MOCK_PASSWORDS: Record<string, string> = {
  'admin@brainstormers.edu': 'admin123',
  'teacher@brainstormers.edu': 'teacher123',
  'arjun.sharma@brainstormers.edu': 'student123',
};

class AuthService {
  private async setSecureItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  private async getSecureItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  }

  private async removeSecureItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  async login(credentials: LoginCredentials): Promise<User> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = MOCK_USERS.find(u => u.email === credentials.email);
    const password = MOCK_PASSWORDS[credentials.email];

    if (!user || password !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    // Generate mock token
    const token = `mock_token_${user.id}_${Date.now()}`;
    
    // Store token securely
    await this.setSecureItem(TOKEN_KEY, token);
    await this.setSecureItem(STORAGE_KEY, JSON.stringify(user));

    return user;
  }

  async logout(): Promise<void> {
    await this.removeSecureItem(TOKEN_KEY);
    await this.removeSecureItem(STORAGE_KEY);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await this.getSecureItem(TOKEN_KEY);
      if (!token) return null;

      const userStr = await this.getSecureItem(STORAGE_KEY);
      if (!userStr) return null;

      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getSecureItem(TOKEN_KEY);
    return !!token;
  }
}

export const authService = new AuthService();