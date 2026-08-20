import { useState } from "react";
import UsernameField from "./UsernameField";
import { useAuth } from "../context/AuthContext";

// Shown when a Google sign-in belongs to no existing account yet.
// Collects a unique Expense Tracker username, then completes account
// creation using the already-verified Google credential.
export default function GoogleUsernameStep({ email, credential, suggestedUsername, onDone, onCancel }) {
  const { googleCompleteSignup } = useAuth();
  const [username, setUsername] = useState(suggestedUsername || "");
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await googleCompleteSignup(credential, username.trim());
      onDone();
    } catch (err) {
      setError(
        err.response?.data?.username ||
          err.response?.data?.error ||
          "Couldn't finish creating your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const disableSubmit =
    loading || username.trim().length < 3 || usernameStatus === "taken" || usernameStatus === "invalid";

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <p className="google-step-intro">
        Signed in as <strong>{email}</strong>. Choose a username to finish creating your account.
      </p>

      <UsernameField
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onStatusChange={setUsernameStatus}
        autoFocus
      />

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary" type="submit" disabled={disableSubmit}>
        {loading ? "Creating account..." : "Create account"}
      </button>
      <button className="btn btn-link" type="button" onClick={onCancel} disabled={loading}>
        Cancel
      </button>
    </form>
  );
}
