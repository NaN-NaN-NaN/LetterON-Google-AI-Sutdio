
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { mockLogin, mockRegister, mockLogout } from '../services/mockApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (email: string, pass: string, name: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for a logged-in user in localStorage on initial load
    try {
      const storedUser = localStorage.getItem('letteron_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const loggedInUser = await mockLogin(email, pass);
    setUser(loggedInUser);
    localStorage.setItem('letteron_user', JSON.stringify(loggedInUser));
    return loggedInUser;
  };

  const register = async (email: string, pass: string, name: string) => {
    const newUser = await mockRegister(email, pass, name);
    setUser(newUser);
    localStorage.setItem('letteron_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    mockLogout();
    setUser(null);
    localStorage.removeItem('letteron_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
