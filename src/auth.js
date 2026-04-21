const COOKIE_TOKEN = "sh_token";
const COOKIE_ROLE = "sh_role";
const COOKIE_USER = "sh_user";
const REMEMBERED_USER_IDENTIFIER = "sh_remember_user_identifier";
const REMEMBERED_ADMIN_IDENTIFIER = "sh_remember_admin_identifier";

function setCookie(name, value, days = null) {
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  if (typeof days === "number") {
    cookie += `; Max-Age=${days * 24 * 60 * 60}`;
  }
  document.cookie = cookie;
}

function getCookie(name) {
  const prefix = `${name}=`;
  const parts = (document.cookie || "").split(";");
  for (const part of parts) {
    const item = part.trim();
    if (item.startsWith(prefix)) {
      return decodeURIComponent(item.slice(prefix.length));
    }
  }
  return "";
}

function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

function safeParseJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
}

export function persistAuth(userData, options = {}) {
  const rememberMe = !!options.rememberMe;
  const token = userData?.token || "";
  const role = userData?.role || "";
  const userJson = JSON.stringify(userData || {});

  // Clear existing storage first to avoid stale mixed states.
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("user");

  if (rememberMe) {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("user", userJson);

    setCookie(COOKIE_TOKEN, token, 30);
    setCookie(COOKIE_ROLE, role, 30);
    setCookie(COOKIE_USER, userJson, 30);
  } else {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("role", role);
    sessionStorage.setItem("user", userJson);

    // Session cookie (no max-age) keeps data while browser session is active.
    setCookie(COOKIE_TOKEN, token);
    setCookie(COOKIE_ROLE, role);
    setCookie(COOKIE_USER, userJson);
  }
}

export function getStoredAuth() {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    getCookie(COOKIE_TOKEN) ||
    "";
  const role =
    localStorage.getItem("role") ||
    sessionStorage.getItem("role") ||
    getCookie(COOKIE_ROLE) ||
    "";
  const userRaw =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user") ||
    getCookie(COOKIE_USER) ||
    "";

  return {
    token,
    role,
    user: safeParseJson(userRaw),
  };
}

export function getAuthHeaders() {
  const { token } = getStoredAuth();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("user");

  deleteCookie(COOKIE_TOKEN);
  deleteCookie(COOKIE_ROLE);
  deleteCookie(COOKIE_USER);
}

export function setRememberedIdentifier(scope, identifier, rememberMe) {
  const key =
    scope === "admin"
      ? REMEMBERED_ADMIN_IDENTIFIER
      : REMEMBERED_USER_IDENTIFIER;

  if (rememberMe && identifier) {
    localStorage.setItem(key, String(identifier));
    return;
  }

  localStorage.removeItem(key);
}

export function getRememberedIdentifier(scope) {
  const key =
    scope === "admin"
      ? REMEMBERED_ADMIN_IDENTIFIER
      : REMEMBERED_USER_IDENTIFIER;
  return localStorage.getItem(key) || "";
}
