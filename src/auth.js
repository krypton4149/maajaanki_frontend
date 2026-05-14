/**
 * Client-side gate for the admin console (demo-style fixed login).
 * Do not rely on this for real security — use Supabase Auth or similar in production.
 */
const AUTH_KEY = "mj_console_auth";

export function isAuthenticated() {
  try {
    return (
      sessionStorage.getItem(AUTH_KEY) === "1" ||
      localStorage.getItem(AUTH_KEY) === "1"
    );
  } catch {
    return false;
  }
}

/** Fixed credentials (requested for internal console access). */
const VALID_EMAIL = "maajaanki2@gmail.com";
const VALID_PASSWORD = "vishal@123";

/**
 * @param {string} email
 * @param {string} password
 * @param {boolean} rememberMe persist in localStorage when true, else sessionStorage
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function login(email, password, rememberMe) {
  const e = (email ?? "").trim().toLowerCase();
  const p = password ?? "";

  if (e !== VALID_EMAIL.toLowerCase() || p !== VALID_PASSWORD) {
    return { ok: false, error: "Invalid Admin ID or password. Access denied." };
  }

  try {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
    if (rememberMe) {
      localStorage.setItem(AUTH_KEY, "1");
    } else {
      sessionStorage.setItem(AUTH_KEY, "1");
    }
  } catch {
    return { ok: false, error: "Could not save session. Check browser storage settings." };
  }

  return { ok: true };
}

export function logout() {
  try {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}
