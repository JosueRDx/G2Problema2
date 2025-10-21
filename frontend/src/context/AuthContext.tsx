// /frontend/src/context/AuthContext.tsx
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

// --- 1. Añade 'nombres_apellidos' a la interfaz User ---
interface User {
  id: number;
  email: string;
  rol: 'admin' | 'externo' | 'unsa';
  nombres_apellidos: string; // <-- AÑADIDO
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        // --- 2. Asegúrate de que los datos almacenados tengan el nombre ---
        if (parsedUser.id && parsedUser.email && parsedUser.rol && parsedUser.nombres_apellidos) {
            setUser(parsedUser);
        } else {
            // Datos incompletos, limpiar
            console.warn("Stored user data is incomplete, clearing.");
            Cookies.remove('token');
            localStorage.removeItem('user');
        }
      } catch (e) {
        console.error("Error parsing stored user data:", e);
        Cookies.remove('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // --- 3. La función 'login' ya acepta el objeto User completo ---
  const login = (userData: User, token: string) => {
    Cookies.set('token', token, { expires: 1, secure: process.env.NODE_ENV === 'production' });
    localStorage.setItem('user', JSON.stringify(userData)); // Guarda el objeto completo
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
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