import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PageMascot from "../components/PageMascot";
import CanvasCursor from "../components/CanvasCursor";
import { getSelectedDomain } from "../utils/learningPath";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mascotState, setMascotState] = useState("IDLE");
  const [focusedField, setFocusedField] = useState("");

  const typingTimeoutRef = useRef(null);
  const visibilityTimeoutRef = useRef(null);
  const emailKeystrokeCount = useRef(0);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Keep the success message visible briefly before the post-login redirect runs.
  useEffect(() => {
    if (user && !submitting && mascotState !== "LOGIN_SUCCESS") {
      navigate(getSelectedDomain() ? "/courses" : "/domains", { replace: true });
    }
  }, [user, submitting, mascotState, navigate]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    };
  }, []);

  const handleEmailFocus = () => {
    setFocusedField("email");
    setMascotState("EMAIL_FOCUS");
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    emailKeystrokeCount.current += 1;
    // Animate every 3 keystrokes to keep performance smooth
    if (emailKeystrokeCount.current % 3 === 0) {
      setMascotState("EMAIL_TYPING");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setMascotState("EMAIL_FOCUS");
      }, 650);
    }
  };

  const handleEmailBlur = () => {
    setFocusedField("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    emailKeystrokeCount.current = 0;
    setMascotState("IDLE");
  };

  const handlePasswordFocus = () => {
    setFocusedField("password");
    setMascotState("PASSWORD_FOCUS");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setMascotState("PASSWORD_TYPING");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setMascotState("PASSWORD_FOCUS");
    }, 750);
  };

  const handlePasswordBlur = () => {
    setFocusedField("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setMascotState("IDLE");
  };

  const handleTogglePassword = () => {
    const nextShow = !showPassword;
    setShowPassword(nextShow);
    setMascotState(nextShow ? "PASSWORD_VISIBLE" : "PASSWORD_HIDDEN");
    if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    visibilityTimeoutRef.current = setTimeout(() => {
      setMascotState("PASSWORD_FOCUS");
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (visibilityTimeoutRef.current) clearTimeout(visibilityTimeoutRef.current);
    setError("");
    setSuccess("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      setMascotState("LOGIN_ERROR");
      setTimeout(() => setMascotState("IDLE"), 1200);
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      setMascotState("LOGIN_ERROR");
      setTimeout(() => setMascotState("IDLE"), 1200);
      return;
    }

    try {
      setSubmitting(true);
      await login(trimmedEmail, password);
      setSuccess("Login successful");
      setMascotState("LOGIN_SUCCESS");
      const destination = getSelectedDomain() ? "/courses" : "/domains";
      // Briefly show the success message before navigation
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1200);
    } catch (err) {
      setMascotState("LOGIN_ERROR");
      setError(err?.message || "Invalid email or password. Please try again.");
      setTimeout(() => {
        setMascotState("IDLE");
      }, 1400);
    } finally {
      setSubmitting(false);
    }
  };

  const mascotMood =
    mascotState === "LOGIN_SUCCESS"
      ? "happy"
      : mascotState === "LOGIN_ERROR"
        ? "surprised"
        : focusedField === "password"
          ? showPassword
            ? "happy"
            : "closed"
          : mascotState === "PASSWORD_VISIBLE"
            ? "happy"
            : "idle";

  return (
    <main className="login-page">
      <CanvasCursor />
      <a className="login-brand" href="/" aria-label="CareerCraft home">
        <span className="login-brand__mark" aria-hidden="true">C</span>
        <span className="login-brand__name">Career<span>Craft</span></span>
      </a>

      <div className="login-layout">
        <section className="login-mascot-column" aria-label="CareerCraft career companion">
          <div className="login-eyebrow"><span aria-hidden="true" /> YOUR NEXT CHAPTER STARTS HERE</div>
          <PageMascot
            mood={mascotMood}
            caption={success ? "Welcome back! 🎉" : "Career Companion · Active"}
            mobile="above"
            celebrate={mascotState === "LOGIN_SUCCESS"}
            className="login-mascot"
          />
          <p className="login-mascot-copy">Build skills. Find your direction. Make your next move.</p>
        </section>

        <section className="login-card-wrap" aria-labelledby="login-heading">
          <div className={`login-card ${mascotState === "LOGIN_ERROR" ? "login-card--shake" : ""}`}>
            <div className="login-card__glow login-card__glow--purple" aria-hidden="true" />
            <div className="login-card__glow login-card__glow--cyan" aria-hidden="true" />

            <div className="login-card__content">
              <Link className="login-logo" to="/" aria-label="CareerCraft home">
                <img src="/careercraft-logo.png" alt="" />
              </Link>
              <h1 id="login-heading">Welcome back to Career<span>Craft</span></h1>
              <p className="login-subtitle">Sign in to continue your career journey, coding streak, and courses.</p>

              <div className="login-messages" aria-live="polite">
                {success && (
                  <div className="login-message login-message--success" role="status">
                    <span aria-hidden="true">✓</span>{success}
                  </div>
                )}
                {error && (
                  <div className="login-message login-message--error" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label htmlFor="email">Email address</label>
                  <div className="login-input-wrap">
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onFocus={handleEmailFocus}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="password">Password</label>
                  <div className="login-input-wrap">
                    <LockKeyhole size={18} aria-hidden="true" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onFocus={handlePasswordFocus}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                      placeholder="Enter your password"
                    />
                    <button
                      className="login-password-toggle"
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={handleTogglePassword}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button className="login-submit" type="submit" disabled={submitting}>
                  {submitting ? <Loader2 size={18} className="login-spinner" aria-hidden="true" /> : null}
                  <span>{submitting ? "Signing in…" : "Sign In"}</span>
                  {!submitting && <ArrowRight size={18} aria-hidden="true" />}
                </button>
              </form>

              <div className="login-divider" aria-hidden="true"><span /></div>
              <p className="login-register">Don&apos;t have an account yet? <Link to="/register">Create an account</Link></p>
            </div>
          </div>
          <p className="login-privacy-note">Your progress and personal information stay secure.</p>
        </section>
      </div>

      <footer className="login-footer">© {new Date().getFullYear()} CareerCraft · Skills, opportunities, growth</footer>
    </main>
  );
}

