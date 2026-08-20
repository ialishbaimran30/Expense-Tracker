import { useEffect } from "react";
import useUsernameAvailability from "../hooks/useUsernameAvailability";

// Shared username input with real-time availability checking + suggestions.
// Used by the signup form and the "choose a username" step after Google sign-in.
export default function UsernameField({ label = "Username", value, onChange, autoFocus, onStatusChange }) {
  const { status, suggestions, message } = useUsernameAvailability(value);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  return (
    <div className="field">
      <label>{label}</label>
      <input
        name="username"
        value={value}
        onChange={onChange}
        required
        autoFocus={autoFocus}
        autoComplete="username"
      />
      {status === "checking" && (
        <p className="username-status checking">Checking availability...</p>
      )}
      {status === "available" && (
        <p className="username-status available">Username is available</p>
      )}
      {status === "taken" && (
        <p className="username-status taken">Username is already taken</p>
      )}
      {status === "invalid" && (
        <p className="username-status invalid">{message}</p>
      )}
      {status === "taken" && suggestions.length > 0 && (
        <div className="username-suggestions">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s}
              className="suggestion-chip"
              onClick={() => onChange({ target: { name: "username", value: s } })}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { useUsernameAvailability };
