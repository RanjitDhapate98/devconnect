
//  DevConnect — MainLayout.jsx
//  Sidebar (left) + Main content + Right panel
//  Used by every page after login


import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

const NAV = [
  { icon: "⚡", label: "Feed",          path: "/feed" },
  { icon: "🔍", label: "Explore",       path: "/explore" },
  { icon: "💬", label: "Messages",      path: "/chat" },
  { icon: "🔔", label: "Notifications", path: "/notifications" },
  { icon: "🔖", label: "Bookmarks",     path: "/bookmarks" },
];

export default function MainLayout({ children, rightPanel }) {
  const { user, logout }    = useAuth();
  const { unreadCount }     = useNotifications();
  const location            = useLocation();
  const navigate            = useNavigate();
  const [menuOpen, setMenu] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "var(--sidebar-width)", flexShrink: 0,
        position: "fixed", top: 0, left: 0, height: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "24px 16px", zIndex: 100,
      }}>
        {/* Logo */}
        <Link to="/feed" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, padding: "0 8px" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#00ff87,#00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 16px rgba(0,255,135,0.3)" }}>⚡</div>
          <span style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(90deg,#00ff87,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>DevConnect</span>
        </Link>

        {/* Nav links */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map(({ icon, label, path }) => {
            const active = location.pathname.startsWith(path);
            const badge  = label === "Notifications" && unreadCount > 0;
            return (
              <Link key={path} to={path} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: "var(--radius-md)",
                color: active ? "#00ff87" : "var(--text-secondary)",
                background: active ? "rgba(0,255,135,0.08)" : "transparent",
                border: active ? "1px solid rgba(0,255,135,0.15)" : "1px solid transparent",
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: "all 0.2s",
                position: "relative",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--bg-card-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                {label}
                {badge && (
                  <span style={{ marginLeft: "auto", background: "#00ff87", color: "#0e0e11", fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "1px 7px", fontFamily: "var(--font-mono)" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card at bottom */}
        {user && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <Link to={`/profile/${user._id}`} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#00ff87,#00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#0e0e11", flexShrink: 0, overflow: "hidden" }}>
                {user.profilePicture ? <img src={user.profilePicture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>@{user.name?.toLowerCase().replace(/\s+/g, "")}</div>
              </div>
            </Link>
            <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 16, padding: 4, borderRadius: 6, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ff375f"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >⏻</button>
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <main style={{
        marginLeft: "var(--sidebar-width)",
        flex: 1,
        minHeight: "100vh",
        maxWidth: rightPanel ? "calc(100% - var(--sidebar-width) - var(--right-panel-width))" : undefined,
      }}>
        {children}
      </main>

      {/* ── Optional right panel ── */}
      {rightPanel && (
        <aside style={{
          width: "var(--right-panel-width)", flexShrink: 0,
          position: "fixed", right: 0, top: 0, height: "100vh",
          borderLeft: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          padding: 20, overflowY: "auto",
        }}>
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
