import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import useUsernameAvailability from "../hooks/useUsernameAvailability";

export default function ProfileSettingsModal({ onClose }) {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [saving, setSaving] = useState(false);

  const trimmed = username.trim();
  const unchanged = trimmed.toLowerCase() === (user?.username || "").toLowerCase();
  // Don't check availability against the user's own current username.
  const { status, suggestions, message } = useUsernameAvailability(unchanged ? "" : trimmed);

  const canSave = !unchanged && status === "available" && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await updateProfile({ username: trimmed });
      toast.success("Username updated successfully");
      onClose();
    } catch (err) {
      const data = err.response?.data;
      const fieldError = Array.isArray(data?.username) ? data.username[0] : data?.username;
      toast.error(fieldError || data?.detail || "Failed to update username");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card glass-strong" onClick={(e) => e.stopPropagation()}>
        <h3>Profile Settings</h3>

        <div className="field">
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
          {!unchanged && status === "checking" && (
            <p className="username-status checking">Checking availability...</p>
          )}
          {!unchanged && status === "available" && (
            <p className="username-status available">Username is available</p>
          )}
          {!unchanged && status === "taken" && (
            <p className="username-status taken">Username is already taken</p>
          )}
          {!unchanged && status === "invalid" && (
            <p className="username-status invalid">{message}</p>
          )}
          {!unchanged && status === "taken" && suggestions.length > 0 && (
            <div className="username-suggestions">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s}
                  className="suggestion-chip"
                  onClick={() => setUsername(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!canSave}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
