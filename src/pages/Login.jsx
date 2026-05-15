import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { isAuthenticated, login } from "../auth";
import "./Login.css";

function IconId() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 10h.01M15 10h.01M9 14h6" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M7 11V8a5 5 0 0110 0v3" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 3l18 18M10.58 10.58A3 3 0 0012 15a3 3 0 003-3M9.88 4.88A10.94 10.94 0 0112 4c7 0 11 7 11 7a21.32 21.32 0 01-2.64 3.36M6.36 6.36A21.14 21.14 0 001 12s4 7 11 7a10.5 10.5 0 004.52-1" />
    </svg>
  );
}

function revealDelay(ms) {
  return { animationDelay: `${ms}ms` };
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to={from === "/login" ? "/" : from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    await new Promise((r) => setTimeout(r, 280));
    const result = login(email, password, false);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(from === "/login" ? "/" : from, { replace: true });
  }

  const t0 = 80;
  const t1 = error ? 180 : 140;
  const t2 = error ? 260 : 200;
  const t3 = error ? 340 : 270;
  const t4 = error ? 420 : 340;

  return (
    <div className="login-screen">
      <div className="login-screen__bg" aria-hidden="true" />
      <div className="login-screen__wash" aria-hidden="true" />
      <div className="login-screen__vignette" aria-hidden="true" />

      <div className="login-card-float">
        <div className="login-card">
          <div className="login-card__accent" aria-hidden="true" />

          <div className="login-card__brand login-reveal" style={revealDelay(t0)}>
            <h1 className="login-card__title">Maa Jaanki</h1>
            <p className="login-card__tagline">Private kitchen management</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error ? (
              <p className="login-error login-reveal" role="alert" style={revealDelay(t1)}>
                {error}
              </p>
            ) : null}

            <div className="login-field login-reveal" style={revealDelay(error ? t1 + 40 : t1)}>
              <label htmlFor="login-admin-id">Admin ID</label>
              <div className="login-input-wrap">
                <IconId />
                <input
                  id="login-admin-id"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter identification"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field login-reveal" style={revealDelay(t2)}>
              <label htmlFor="login-password">Passcode</label>
              <div className="login-input-wrap">
                <IconLock />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit login-reveal"
              style={revealDelay(t3)}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? "Opening kitchen…" : "Enter kitchen"}{" "}
              <span aria-hidden="true">{busy ? "⏳" : "🍴"}</span>
            </button>
          </form>

          <div className="login-card__ribbon login-reveal" style={revealDelay(t4)}>
            <span className="login-card__ribbon-line" aria-hidden="true" />
            <p>Authorized personnel only</p>
            <span className="login-card__ribbon-line" aria-hidden="true" />
          </div>
        </div>
      </div>

      <p className="login-page-tagline login-reveal" style={revealDelay(t4 + 80)}>
        Where tradition meets the heat of innovation.
      </p>
    </div>
  );
}
