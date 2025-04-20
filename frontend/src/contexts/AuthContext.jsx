import React, { createContext, useState, useEffect, useCallback } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("authToken") || null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = (newToken) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem("authToken", newToken);
    } else {
      localStorage.removeItem("authToken");
    }
  };

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem("authToken");
    if (storedToken) {
      try {
        setToken(storedToken);
        setUser({ loadedFromStorage: true });
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        saveToken(null);
        setUser(null);
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      saveToken(data.token);
      setUser(data.user);
      setIsLoading(false);
      return data;
    } catch (error) {
      saveToken(null);
      setUser(null);
      setIsLoading(false);
      throw error;
    }
  };

  const signup = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.signup(email, password);
      console.log("Signup successful:", data);
      setIsLoading(false);
      return data;
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    saveToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isLoading,
    isAuthenticated: !!token,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
