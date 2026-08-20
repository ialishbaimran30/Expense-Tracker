import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { AUTH_PREFIX } from "../config";

// idle | checking | available | taken | invalid | error
export default function useUsernameAvailability(username, { minLength = 3 } = {}) {
  const [status, setStatus] = useState("idle");
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState("");
  const timerRef = useRef(null);
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = username.trim();

    clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();
    setSuggestions([]);
    setMessage("");

    if (trimmed.length < minLength) {
      setStatus("idle");
      return;
    }

    setStatus("checking");
    const requestId = ++requestIdRef.current;

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const { data } = await api.get(`${AUTH_PREFIX}/check-username/`, {
          params: { username: trimmed },
          signal: controller.signal,
        });
        if (requestIdRef.current !== requestId) return;
        if (data.available) {
          setStatus("available");
        } else {
          setStatus("taken");
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;
        if (err.response?.status === 400) {
          setStatus("invalid");
          setMessage(err.response.data?.error || "Invalid username.");
        } else {
          setStatus("error");
        }
      }
    }, 400);

    return () => {
      clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [username, minLength]);

  return { status, suggestions, message };
}
