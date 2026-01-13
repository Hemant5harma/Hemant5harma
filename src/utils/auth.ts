/**
 * Auth utilities for JWT token management
 */

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const createMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
};

const safeStorage: StorageLike =
  typeof window !== 'undefined' && window.localStorage
    ? window.localStorage
    : createMemoryStorage();

// Store token in localStorage
export const setAuthToken = (token: string): void => {
  safeStorage.setItem('auth_token', token);
};

// Get token from localStorage
export const getAuthToken = (): string | null => {
  return safeStorage.getItem('auth_token');
};

// Remove token from localStorage
export const removeAuthToken = (): void => {
  safeStorage.removeItem('auth_token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Create headers with authorization
export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
