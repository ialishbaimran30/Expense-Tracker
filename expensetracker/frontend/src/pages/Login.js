import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import GoogleUsernameStep from "../components/GoogleUsernameStep";
import "../styles/Auth.css";

export default function Login() {
  const { login, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googlePending, setGooglePending] = useState(null);
  const [googleError, setGoogleError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Check your username and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setGoogleError("");
    setGoogleLoading(true);
    try {
      const data = await googleAuth(credential);
      if (data.status === "login") {
        navigate("/");
      } else {
        setGooglePending({
          credential,
          email: data.email,
          suggestedUsername: data.suggested_username,
        });
      }
    } catch (err) {
      setGoogleError(
        err.response?.data?.error || "Google sign-in failed. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-mark">K</div>
          <h1>Welcome back</h1>
          <p>Log in to keep track of your expenses</p>
        </div>

        {googlePending ? (
          <GoogleUsernameStep
            email={googlePending.email}
            credential={googlePending.credential}
            suggestedUsername={googlePending.suggestedUsername}
            onDone={() => navigate("/")}
            onCancel={() => setGooglePending(null)}
          />
        ) : (
          <>
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="field">
                <label>Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && <p className="error-text">{error}</p>}

              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            {googleLoading && <p className="google-status">Signing in with Google...</p>}
            {googleError && <p className="error-text">{googleError}</p>}
            <GoogleAuthButton onCredential={handleGoogleCredential} onError={setGoogleError} />
          </>
        )}

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
