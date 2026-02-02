// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

// Funkce pro získání CSRF tokenu z cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Vyplňte prosím obě pole.");
      return;
    }

    const csrftoken = getCookie("csrftoken");

    try {
      // 1️⃣ Login request
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify(formData),
        credentials: "include", // posílá cookie
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Chyba při přihlášení");
        return;
      }

      // 2️⃣ Request na /api/me pro získání informací o přihlášeném uživateli
      const meResponse = await fetch("/api/me/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!meResponse.ok) {
        throw new Error("Nelze získat údaje o uživateli");
      }

      const meData = await meResponse.json();
      console.log("Přihlášený uživatel:", meData);

      // 3️⃣ Přesměrování po úspěšném přihlášení
      navigate("/dashboard");
    } catch (err) {
      setError("Server nedostupný nebo nepovolený přístup");
      console.error(err);
    }
  };

  return (
    <div className="lp-container">
      <div className="lp-card">
        <h1 className="lp-title">Přihlášení</h1>
        <form onSubmit={handleLogin} className="lp-form" noValidate>
          <div className="lp-form-group">
            <input
              type="text"
              name="username"
              className="lp-input"
              placeholder="Jméno"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          <div className="lp-form-group">
            <input
              type="password"
              name="password"
              className="lp-input"
              placeholder="Heslo"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="lp-submit-btn">
            Přihlásit se
          </button>
        </form>
        {error && <div className="lp-error-message">{error}</div>}
        
        {/* odkaz na registraci */}
        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center', 
          fontSize: '14px',
          color: '#666'
        }}>
          Nemáte účet?{' '}
          <Link 
            to="/register" 
            style={{ 
              color: '#0070BB', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Zaregistrujte se zde
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;