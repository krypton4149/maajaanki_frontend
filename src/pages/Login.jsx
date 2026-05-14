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

function IconArrowConsole() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function revealDelay(ms) {
  return { animationDelay: `${ms}ms` };
}

/** Decorative background bubbles — positions/delays feel organic but stay deterministic. */
const LOGIN_BUBBLES = [
  { x: 6, y: 12, s: 52, d: 0, hue: "cyan" },
  { x: 88, y: 8, s: 38, d: -1.2, hue: "purple" },
  { x: 14, y: 62, s: 72, d: -2.4, hue: "cyan" },
  { x: 72, y: 48, s: 44, d: -0.6, hue: "purple" },
  { x: 42, y: 22, s: 28, d: -3.1, hue: "cyan" },
  { x: 92, y: 72, s: 56, d: -1.8, hue: "cyan" },
  { x: 28, y: 88, s: 34, d: -4.2, hue: "purple" },
  { x: 58, y: 8, s: 22, d: -2.9, hue: "cyan" },
  { x: 4, y: 42, s: 48, d: -0.3, hue: "purple" },
  { x: 78, y: 28, s: 64, d: -3.6, hue: "cyan" },
  { x: 52, y: 76, s: 30, d: -1.1, hue: "purple" },
  { x: 34, y: 44, s: 18, d: -5.0, hue: "cyan" },
  { x: 96, y: 38, s: 40, d: -2.2, hue: "cyan" },
  { x: 18, y: 30, s: 26, d: -4.5, hue: "purple" },
  { x: 64, y: 92, s: 58, d: -0.9, hue: "cyan" },
  { x: 48, y: 56, s: 20, d: -3.3, hue: "purple" },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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
    const result = login(email, password, rememberMe);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(from === "/login" ? "/" : from, { replace: true });
  }

  const t0 = 90;
  const t1 = error ? 200 : 160;
  const t2 = error ? 280 : 230;
  const t3 = error ? 360 : 300;
  const t4 = error ? 440 : 370;
  const t5 = error ? 520 : 440;
  const t6 = error ? 590 : 510;

  return (
    <div className="login-screen">
      <div className="login-screen__bg" aria-hidden="true" />
      <div className="login-screen__vignette" aria-hidden="true" />
      <div className="login-screen__grid" aria-hidden="true" />
      <div className="login-screen__orbs" aria-hidden="true">
        <span className="login-orb login-orb--a" />
        <span className="login-orb login-orb--b" />
        <span className="login-orb login-orb--c" />
      </div>
      <div className="login-screen__scan" aria-hidden="true" />

      <div className="login-screen__bubbles" aria-hidden="true">
        {LOGIN_BUBBLES.map((b, i) => (
          <span
            key={i}
            className={`login-bubble login-bubble--${b.hue}`}
            style={
              {
                "--bx": `${b.x}%`,
                "--by": `${b.y}%`,
                "--bs": `${b.s}px`,
                "--bd": `${b.d}s`,
                "--dur": `${10 + (i % 5) * 1.4}s`,
              }
            }
          />
        ))}
      </div>

      <div className="login-screen__status">
        <span className="login-screen__status-emoji" aria-hidden="true">
          🟢
        </span>
        <span className="login-screen__status-dot" />
        <span className="login-screen__status-text">System online</span>
      </div>

      <div className="login-screen__meta" aria-hidden="true">
        NODE: MJR-CONSOLE-01
        <br />
        IP: 192.168.1.104
      </div>

      <div className="login-card-float">
        <div className="login-card">
          <div className="login-card__accent" aria-hidden="true" />
          <span className="login-card__deco login-card__deco--a" aria-hidden="true" />
          <span className="login-card__deco login-card__deco--b" aria-hidden="true" />

          <div className="login-card__brand login-reveal" style={revealDelay(t0)}>
            <div className="login-card__hero">
              <img
                className="login-card__hero-img"
                src="/login-hero.svg"
                alt=""
                width={360}
                height={120}
                decoding="async"
              />
              <p className="login-card__hero-tag" aria-hidden="true">
                🍽️ Kitchen · 📊 Live dashboard · ✨
              </p>
            </div>
            <h1 className="login-card__title">
              <span className="login-card__title-emoji" aria-hidden="true">
                🏪
              </span>
              <span className="login-card__title-text">Maa Jaanki</span>
            </h1>
            <p className="login-card__tagline">Admin console · secure sign-in</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error ? (
              <p className="login-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="login-field login-reveal" style={revealDelay(t1)}>
              <label htmlFor="login-admin-id">Admin ID</label>
              <div className="login-input-wrap">
                <IconId />
                <input
                  id="login-admin-id"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter credentials"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-field login-reveal" style={revealDelay(t2)}>
              <label htmlFor="login-password">Password</label>
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <div className="login-row login-reveal" style={revealDelay(t3)}>
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="login-remember-track" aria-hidden="true" />
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="login-submit login-reveal"
              style={revealDelay(t4)}
              disabled={busy}
              aria-busy={busy}
            >
              <span className="login-submit__emoji" aria-hidden="true">
                {busy ? "⏳" : "🔐"}
              </span>
              <span className="login-submit__text">
                <span className="login-submit__label">{busy ? "Signing in…" : "Log in"}</span>
                <span className="login-submit__hint">Maa Jaanki admin console</span>
              </span>
              <span className="login-submit__arrow" aria-hidden="true">
                <IconArrowConsole />
              </span>
            </button>
          </form>

          <p className="login-clearance login-reveal" style={revealDelay(t5)}>
            🔒 System authority: Level 4 clearance required
          </p>
        </div>
      </div>

      <nav className="login-footer-links login-footer-links--enter" style={revealDelay(t6)} aria-label="Console links">
        <a href="#status">System status</a>
        <span>|</span>
        <a href="#security">Security protocol</a>
        <span>|</span>
        <a href="mailto:maajaanki2@gmail.com">Contact ops</a>
      </nav>
    </div>
  );
}
