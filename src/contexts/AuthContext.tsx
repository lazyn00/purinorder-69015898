// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// === DÁN URL APPS SCRIPT AUTH API CỦA BẠN VÀO ĐÂY ===
const GAS_AUTH_URL = "https://script.google.com/macros/s/AKfycbwvNuv5tQDs0orb8pnHSPZlx3hCsidMp6pW7Az4n3Uu/dev";
// ===

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  has_new_notification?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user từ localStorage khi app khởi động
  useEffect(() => {
    const savedUser = localStorage.getItem('purin_user');
    const savedToken = localStorage.getItem('purin_token');
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (err) {
        console.error("Lỗi load user từ localStorage", err);
        localStorage.removeItem('purin_user');
        localStorage.removeItem('purin_token');
      }
    }
    
    setIsLoading(false);
  }, []);

  // === REGISTER ===
  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(GAS_AUTH_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          ...data
        })
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem('purin_user', JSON.stringify(result.user));
        localStorage.setItem('purin_token', result.token);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      return { success: false, error: "Không thể kết nối đến server" };
    }
  };

  // === LOGIN ===
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(GAS_AUTH_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          email,
          password
        })
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.user);
        setToken(result.token);
        localStorage.setItem('purin_user', JSON.stringify(result.user));
        localStorage.setItem('purin_token', result.token);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      return { success: false, error: "Không thể kết nối đến server" };
    }
  };

  // === LOGOUT ===
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('purin_user');
    localStorage.removeItem('purin_token');
  };

  // === UPDATE PROFILE ===
  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Chưa đăng nhập" };

    try {
      const response = await fetch(GAS_AUTH_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'updateProfile',
          userId: user.id,
          ...data
        })
      });

      const result = await response.json();

      if (result.success) {
        const updatedUser = result.user;
        setUser(updatedUser);
        localStorage.setItem('purin_user', JSON.stringify(updatedUser));
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      return { success: false, error: "Không thể kết nối đến server" };
    }
  };

  // === REFRESH PROFILE (để cập nhật notification) ===
  const refreshProfile = async () => {
    if (!user) return;

    try {
      const response = await fetch(GAS_AUTH_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'getProfile',
          userId: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        setUser(result.user);
        localStorage.setItem('purin_user', JSON.stringify(result.user));
      }
    } catch (error) {
      console.error("Lỗi refresh profile:", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
