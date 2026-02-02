import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getMe, logout } from '../services/api';
import logo from '../assets/WPA_header_icon.webp';
import './css/Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Přidáno: Při změně cesty zkontroluj znovu autentizaci
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      const userData = await getMe();
      if (userData.username && userData.username.trim() !== '') {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setIsAuthenticated(false);
      closeMenu();
      navigate('/');
    } catch (err) {
      console.error('Chyba při odhlašování:', err);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* 1. LEVÁ ČÁST - Logo */}
        <div className="navbar-left">
          <a href="/">
            <img src={logo} alt="Olomouc WPA Women's Grand Prix" className="navbar-logo" />
          </a>
          <div class="navbar-text">Olomouc WPA Women's Grand Prix - July 2-4, 2026</div>
        </div>

        {/* 3. PRAVÁ ČÁST - Login/Logout (Viditelné pouze na desktopu) */}
        <div className="navbar-right desktop-only">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '14px', color: '#333' }}>
                {user?.username}
              </span>
              <button className="login-btn" onClick={handleLogout}>
                Odhlásit se
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => navigate('/login')}>
              Přihlásit se
            </button>
          )}
        </div>

        {/* 4. MOBILNÍ IKONA (Viditelné pouze na mobilu) */}
        <div className="menu-icon mobile-only" onClick={toggleMenu}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </div>
      </div>

      {/* 5. MOBILNÍ ROZBALOVACÍ MENU (Plovoucí vpravo) */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "mobile-link active" : "mobile-link")}
          onClick={closeMenu}
        >
          Domů
        </NavLink>
        <NavLink
          to="/courses"
          className={({ isActive }) => (isActive ? "mobile-link active" : "mobile-link")}
          onClick={closeMenu}
        >
          Kurzy
        </NavLink>
        {isAuthenticated && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "mobile-link active" : "mobile-link")}
            onClick={closeMenu}
          >
            Dashboard
          </NavLink>
        )}
        <div className="mobile-login-container">
          {isAuthenticated ? (
            <>
              <span style={{ padding: '10px', fontSize: '14px', color: '#333' }}>
                {user?.username}
              </span>
              <button
                className="mobile-login-btn"
                onClick={handleLogout}
              >
                Odhlásit se
              </button>
            </>
          ) : (
            <button
              className="mobile-login-btn"
              onClick={() => {
                navigate('/login');
                closeMenu();
              }}
            >
              Přihlásit se
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;