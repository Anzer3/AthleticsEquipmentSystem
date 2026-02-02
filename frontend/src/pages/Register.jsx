// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // používáme stejné CSS jako login

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

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    password2: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // 1️⃣ Validace
    if (!formData.username.trim() || !formData.password.trim() || !formData.password2.trim()) {
      setError("Vyplňte prosím všechna pole.");
      return;
    }

    if (formData.password !== formData.password2) {
      setError("Hesla se neshodují.");
      return;
    }

    const csrftoken = getCookie("csrftoken");

    try {
      const response = await fetch("/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
        credentials: "include", // velmi důležité, aby cookie byla poslána
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registrace se nezdařila. Zkuste jiné jméno.");
        return;
      }

      // Po registraci se rovnou načte info o uživateli
      const meResponse = await fetch("/api/me/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const meData = await meResponse.json();
      console.log("Nově registrovaný uživatel:", meData);

      navigate("/dashboard");
    } catch (err) {
      setError("Server nedostupný");
      console.error(err);
    }
  };

  return (
    <div className="lp-container">
      <div className="lp-card">
        <h1 className="lp-title">Registrace</h1>
        <form onSubmit={handleRegister} className="lp-form" noValidate>
          <div className="lp-form-group">
            <input
              type="text"
              name="username"
              className="lp-input"
              placeholder="Uživatelské jméno"
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

          <div className="lp-form-group">
            <input
              type="password"
              name="password2"
              className="lp-input"
              placeholder="Heslo znovu"
              value={formData.password2}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="lp-submit-btn">
            Registrovat se
          </button>
        </form>

        {error && <div className="lp-error-message">{error}</div>}
      </div>
    </div>
  );
};

export default Register;
