import { getCookie } from "./csrf";

// Přihlášení
export async function login(username: string, password: string) {
  const csrfToken = getCookie("csrftoken");
  if (!csrfToken) throw new Error("CSRF token není dostupný");

  const res = await fetch("/api/auth/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ username, password }),
    credentials: "include", // posílá session cookie
  });

  return res.json();
}

// Odhlášení
export async function logout() {
  const csrfToken = getCookie("csrftoken");
  const res = await fetch("/api/auth/logout/", {
    method: "POST",
    headers: {
      "X-CSRFToken": csrfToken || "",
    },
    credentials: "include",
  });

  return res.json();
}

// Zjištění aktuálně přihlášeného uživatele
export async function fetchMe() {
  const res = await fetch("/api/auth/me/", { credentials: "include" });
  return res.json();
}
