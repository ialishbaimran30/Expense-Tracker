import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import { AUTH_PREFIX } from "../config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const getUrl = (endpoint) =>
    `${AUTH_PREFIX.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get(`${AUTH_PREFIX}/profile/`)
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post(getUrl("login/"), {
      username,
      password,
    });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    const profile = await api.get(`${AUTH_PREFIX}/profile/`);
    setUser(profile.data);
    return profile.data;
  };

  const register = async (payload) => {
    await api.post(getUrl("register/"), payload);
  };

  // Step 1 of "Continue with Google": verifies the Google credential on the
  // backend. Existing accounts are logged in immediately; new emails come
  // back as { status: "signup_required", ... } for the caller to handle.
  const googleAuth = async (credential) => {
    const { data } = await api.post(getUrl("google/"), { credential });
    if (data.status === "login") {
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      setUser(data.user);
    }
    return data;
  };

  // Step 2: finalizes account creation for a new Google user once they've
  // picked a unique username, then logs them straight into the dashboard.
  const googleCompleteSignup = async (credential, username) => {
    const { data } = await api.post(getUrl("google/complete/"), { credential, username });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setUser(data.user);
    return data;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put(`${AUTH_PREFIX}/profile/`, payload);
    setUser(data);
    return data;
  };

  const logout = async () => {
    const refresh = localStorage.getItem("refresh");
    
    if (refresh) {
      try {
        await api.post(getUrl("logout/"), { refresh });
      } catch {
        
      }
    }

   
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, googleAuth, googleCompleteSignup, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}