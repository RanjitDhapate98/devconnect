// ============================================================
//  DevConnect — NotificationsPage.jsx
//  Real-time notifications via Socket.io
//  Wired to: GET /api/notifications, PATCH /:id/read, GET /unread
// ============================================================

import { Link } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { useNotifications } from "../context/NotificationContext";

function timeAgo(dateStr) {
  const m = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_CONFIG = {
  LIKE:    { icon: "△", color: "#00ff87", label: "liked your post",      bg: "rgba(0,255,135,0.07)"  },
  COMMENT: { icon: "◇", color: "#00d4ff", label: "commented on your post", bg: "rgba(0,212,255,0.07)" },
  FOLLOW:  { icon: "◎", color: "#bf5af2", label: "started following you", bg: "rgba(191,90,242,0.07)" },
  MESSAGE: { icon: "✉", color: "#ff375f", label: "sent you a message",   bg: "rgba(255,55,95,0.07)"  },
};

function NotifCard({ notif, onMark }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.LIKE;
  const sender = notif.sender;

  return (
    <div
      onClick={() => !notif.isRead && onMark(notif._id)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 14,
        padding: "16px 18px", borderRadius: 12,
        background: notif.isRead ? "rgba(255,255,255,0.02)" : cfg.bg,
        border: `1px solid ${notif.isRead ? "rgba(255,255,255,0.06)" : `${cfg.color}30`}`,
        cursor: notif.isRead ? "default" : "pointer",
        transition: "all 0.2s", marginBottom: 8,
        position: "relative", overflow: "hidden",
        animation: "fadeUp 0.3s ease",
      }}
      onMouseEnter={e => { if (!notif.isRead) e.currentTarget.style.transform = "translateX(3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; }}
    >
      {/* Unread indicator */}
      {!notif.isRead && (
        <span style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: cfg.color, borderRadius: "3px 0 0 3px",
          boxShadow: `0 0 8px ${cfg.color}`,
        }} />
      )}

      {/* Type icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${cfg.color}15`,
        border: `1px solid ${cfg.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16, color: cfg.color,
      }}>{cfg.icon}</div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, color: "#f0f0f5", lineHeight: 1.5 }}>
          <Link
            to={`/profile/${sender?._id}`}
            onClick={e => e.stopPropagation()}
            style={{ fontWeight: 700, color: cfg.color }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
            onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
          >
            {sender?.name || sender?.username || "Someone"}
          </Link>
          {" "}<span style={{ color: "#8b8b9a" }}>{cfg.label}</span>
        </p>

        {notif.post?.content && (
          <p style={{
            fontSize: 12, color: "#4a4a5a", marginTop: 4,
            fontFamily: "'Space Mono', monospace",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            "{notif.post.content.slice(0, 60)}{notif.post.content.length > 60 ? "..." : ""}"
          </p>
        )}

        <span style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", display: "block", marginTop: 5 }}>
          {timeAgo(notif.createdAt)}
          {!notif.isRead && <span style={{ marginLeft: 8, color: cfg.color, fontSize: 10 }}>• tap to mark read</span>}
        </span>
      </div>

      {/* Arrow */}
      {notif.post && (
        <Link
          to={`/post/${notif.post._id}`}
          onClick={e => e.stopPropagation()}
          style={{ color: "#4a4a5a", fontSize: 14, flexShrink: 0, transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = cfg.color}
          onMouseLeave={e => e.currentTarget.style.color = "#4a4a5a"}
        >→</Link>
      )}
    </div>
  );
}

function EmptyNotifs() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: "#4a4a5a" }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🔔</div>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>// no notifications yet</p>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#2a2a38", marginTop: 8 }}>interactions will appear here in real-time</p>
    </div>
  );
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead } = useNotifications();

  const unread = notifications.filter(n => !n.isRead);
  const read   = notifications.filter(n => n.isRead);

  return (
    <MainLayout>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f5", letterSpacing: "-0.5px" }}>
              Notifications 🔔
            </h1>
            <p style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
              // real-time via socket.io · {unreadCount} unread
            </p>
          </div>
          {unreadCount > 0 && (
            <div style={{ marginLeft: "auto", background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.3)", borderRadius: 8, padding: "4px 12px" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#00ff87", fontFamily: "'Space Mono', monospace" }}>
                {unreadCount} new
              </span>
            </div>
          )}
        </div>

        {notifications.length === 0 ? <EmptyNotifs /> : (
          <>
            {/* Unread section */}
            {unread.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: "#00ff87", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 12 }}>
                  // New ({unread.length})
                </h2>
                {unread.map(n => <NotifCard key={n._id} notif={n} onMark={markRead} />)}
              </div>
            )}

            {/* Read section */}
            {read.length > 0 && (
              <div>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: "#4a4a5a", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 12 }}>
                  // Earlier ({read.length})
                </h2>
                {read.map(n => <NotifCard key={n._id} notif={n} onMark={markRead} />)}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </MainLayout>
  );
}
