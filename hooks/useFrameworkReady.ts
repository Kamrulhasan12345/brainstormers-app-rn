import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    window.frameworkReady?.();
  });
}

export function isDemoMode(): boolean {
  // In a real app, this would check environment variables or app state
  // For now, return true to use demo mode
  return true;
}
