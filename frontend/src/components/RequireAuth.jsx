// src/components/RequireAuth.jsx
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../services/api";

const RequireAuth = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await getMe();
      
      // ✅ Kontrola: pokud má uživatel prázdné username, není přihlášený
      if (userData.username && userData.username.trim() !== '') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Načítám...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;