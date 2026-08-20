import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import ProfileSettingsModal from "./ProfileSettingsModal";
import "../styles/Layout.css";

export default function Topbar({ title, subtitle }) {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const initial = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <>
      <header className="topbar glass">
        <div className="topbar-title">
          <h2>{title}</h2>
          {subtitle && <span>{subtitle}</span>}
        </div>
        <div className="topbar-right">
          <NotificationBell />
          <div
            className="user-chip glass-strong"
            onClick={() => setShowProfile(true)}
            title="Profile settings"
          >
            <div className="user-avatar">{initial}</div>
            <span className="user-name">{user?.username}</span>
          </div>
        </div>
      </header>

      {showProfile && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
    </>
  );
}