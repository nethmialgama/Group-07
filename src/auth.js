export function getStoredAuth() {
  const token = localStorage.getItem("token") || "";
  const role = localStorage.getItem("role") || "";
  const user = localStorage.getItem("user");

  return {
    token,
    role,
    user: user ? JSON.parse(user) : null,
  };
}

export function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
}
