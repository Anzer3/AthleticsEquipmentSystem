const API = "/api";

export async function register(username, password) {
  return fetch(`${API}/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export async function login(username, password) {
  return fetch(`${API}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export async function logout() {
  return fetch(`${API}/logout`, {
    method: "POST",
    credentials: "include",
  });
}

export async function me() {
  return fetch(`${API}/me`, {
    credentials: "include",
  }).then(r => r.json());
}