import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UsernameField from "../components/UsernameField";
import GoogleAuthButton from "../components/GoogleAuthButton";
import GoogleUsernameStep from "../components/GoogleUsernameStep";
import "../styles/Auth.css";

const initialForm = {
  username: "",
  email: "",
  password: "",
};

export default function Register() {
  const { register, googleAuth } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [googlePending, setGooglePending] = useState(null);
  const [googleError, setGoogleError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      setErrors(typeof data === "object" ? data : { detail: "Registration failed." });
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

  const fieldError = (name) =>
    errors[name] && <p className="error-text">{[].concat(errors[name]).join(" ")}</p>;

  const disableSubmit =
    loading || usernameStatus === "taken" || usernameStatus === "invalid";

  return (
    <div className="auth-screen">
      <div className="auth-card glass">
        <div className="auth-header">
          <div className="auth-mark">K</div>
          <h1>Create your account</h1>
          <p>Start tracking your expenses today</p>
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
              <UsernameField
                value={form.username}
                onChange={handleChange}
                onStatusChange={setUsernameStatus}
              />
              {fieldError("username")}

              <div className="field">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              {fieldError("email")}

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
              {fieldError("password")}

              {errors.detail && <p className="error-text">{errors.detail}</p>}

              <button className="btn btn-primary" type="submit" disabled={disableSubmit}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            {googleLoading && <p className="google-status">Signing in with Google...</p>}
            {googleError && <p className="error-text">{googleError}</p>}
            <GoogleAuthButton onCredential={handleGoogleCredential} onError={setGoogleError} />
          </>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
