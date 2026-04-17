

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { messageAPI, userAPI } from "../services/api";
import { sendSocketMessage, onReceiveMessage } from "../services/socket";
import { useAuth } from "../context/AuthContext";

function Avatar({ user, size = 36, online }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg,#00ff87,#00d4ff)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.38, fontWeight: 700, color: "#0e0e11",
        overflow: "hidden", border: "1.5px solid rgba(0,255,135,0.2)",
      }}>
        {user?.profilePicture
          ? <img src={user.profilePicture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (user?.name?.[0] || "?").toUpperCase()}
      </div>
      {online !== undefined && (
        <span style={{
          position: "absolute", bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28, borderRadius: "50%",
          background: online ? "#00ff87" : "#4a4a5a",
          border: "2px solid #141417",
          boxShadow: online ? "0 0 6px rgba(0,255,135,0.6)" : "none",
        }} />
      )}
    </div>
  );
}

function timeLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── User list sidebar ─────────────────────────────────────────
function UserList({ users, activeId, onSelect }) {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#f0f0f5", letterSpacing: "-0.3px" }}>Messages</h2>
        <p style={{ fontSize: 10, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>// real-time via socket.io</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px" }}>
        {users.length === 0 && (
          <p style={{ color: "#2a2a38", fontSize: 11, fontFamily: "'Space Mono', monospace", padding: "20px 8px" }}>
            // no users found
          </p>
        )}
        {users.map(u => (
          <button key={u._id} onClick={() => onSelect(u)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "10px 10px", borderRadius: 10, border: "none",
            background: activeId === u._id ? "rgba(0,255,135,0.07)" : "transparent",
            cursor: "pointer", transition: "background 0.18s", textAlign: "left",
            borderLeft: activeId === u._id ? "2px solid #00ff87" : "2px solid transparent",
          }}
            onMouseEnter={e => { if (activeId !== u._id) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={e => { if (activeId !== u._id) e.currentTarget.style.background = "transparent"; }}
          >
            <Avatar user={u} size={36} online={false} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: activeId === u._id ? "#00ff87" : "#f0f0f5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {u.name}
              </div>
              <div style={{ fontSize: 10, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>click to chat</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────
function Bubble({ msg, isMe }) {
  return (
    <div style={{
      display: "flex", justifyContent: isMe ? "flex-end" : "flex-start",
      marginBottom: 8, animation: "fadeUp 0.2s ease",
    }}>
      <div style={{
        maxWidth: "68%", padding: "10px 14px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
        background: isMe
          ? "linear-gradient(135deg,rgba(0,255,135,0.15),rgba(0,212,255,0.1))"
          : "rgba(255,255,255,0.05)",
        border: isMe
          ? "1px solid rgba(0,255,135,0.2)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: isMe ? "0 2px 12px rgba(0,255,135,0.08)" : "none",
      }}>
        <p style={{ fontSize: 14, color: "#f0f0f5", lineHeight: 1.5, wordBreak: "break-word" }}>
          {msg.content}
        </p>
        <p style={{ fontSize: 10, color: isMe ? "rgba(0,255,135,0.5)" : "#4a4a5a", marginTop: 4, textAlign: "right", fontFamily: "'Space Mono', monospace" }}>
          {timeLabel(msg.createdAt || new Date())}
        </p>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyChat() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>💬</div>
      <p style={{ fontSize: 13, marginBottom: 6 }}>// select a developer to chat</p>
      <p style={{ fontSize: 11, color: "#2a2a38" }}>messages are end-to-end stored</p>
    </div>
  );
}

// ── Chat window ───────────────────────────────────────────────
function ChatWindow({ otherUser, currentUser }) {
  const [messages, setMessages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState("");
  const [sending, setSending]     = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  // Load history
  useEffect(() => {
    if (!otherUser?._id) return;
    setLoading(true); setMessages([]);
    messageAPI.getChatHistory(otherUser._id)
      .then(d => setMessages(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
    inputRef.current?.focus();
  }, [otherUser._id]);

  // Listen for real-time messages
  useEffect(() => {
    const cleanup = onReceiveMessage((msg) => {
      const relevant =
        (msg.sender === otherUser._id || msg.sender?._id === otherUser._id) ||
        (msg.receiver === otherUser._id || msg.receiver?._id === otherUser._id);
      if (relevant) setMessages(prev => [...prev, msg]);
    });
    return cleanup;
  }, [otherUser._id]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim() || sending) return;
    setSending(true);
    sendSocketMessage({
      senderId: currentUser._id,
      receiverId: otherUser._id,
      content: text.trim(),
    });
    setText("");
    setSending(false);
    inputRef.current?.focus();
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Chat header */}
      <div style={{
        padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: 12,
        background: "rgba(255,255,255,0.01)",
      }}>
        <Avatar user={otherUser} size={38} online />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f5" }}>{otherUser.name}</div>
          <div style={{ fontSize: 10, color: "#00ff87", fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff87", boxShadow: "0 0 6px #00ff87", display: "inline-block" }} />
            online · socket.io connected
          </div>
        </div>
        <Link to={`/profile/${otherUser._id}`} style={{ marginLeft: "auto", fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", padding: "5px 10px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 7, transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#00ff87"}
          onMouseLeave={e => e.currentTarget.style.color = "#4a4a5a"}
        >view profile →</Link>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #1a1a22", borderTopColor: "#00ff87", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#2a2a38", fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
            // start the conversation
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = (msg.sender?._id || msg.sender) === currentUser._id;
            return <Bubble key={msg._id || i} msg={msg} isMe={isMe} />;
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex", gap: 10, alignItems: "flex-end",
        background: "rgba(255,255,255,0.01)",
      }}>
        <textarea
          ref={inputRef}
          value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
          placeholder={`// message ${otherUser.name}...`}
          rows={1}
          style={{
            flex: 1, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: "11px 14px",
            color: "#f0f0f5", fontSize: 14, outline: "none",
            resize: "none", fontFamily: "'Sora', sans-serif",
            lineHeight: 1.5, transition: "border-color 0.2s",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(0,255,135,0.35)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
        />
        <button onClick={send} disabled={!text.trim() || sending} style={{
          padding: "11px 18px", borderRadius: 10,
          border: "1px solid rgba(0,255,135,0.4)",
          background: text.trim() ? "rgba(0,255,135,0.1)" : "transparent",
          color: text.trim() ? "#00ff87" : "#4a4a5a",
          fontFamily: "'Space Mono', monospace", fontSize: 13,
          fontWeight: 700, cursor: text.trim() ? "pointer" : "not-allowed",
          transition: "all 0.2s", flexShrink: 0,
        }}>→</button>
      </div>
    </div>
  );
}

// ── Chat Page ─────────────────────────────────────────────────
export default function ChatPage() {
  const { userId }        = useParams();
  const { user }          = useAuth();
  const [users, setUsers] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    userAPI.getAll().then(d => {
      const list = d.data || [];
      setUsers(list);
      if (userId) {
        const preSelected = list.find(u => u._id === userId);
        if (preSelected) setActive(preSelected);
      }
    }).catch(console.error);
  }, [userId]);

  return (
    <MainLayout>
      <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
        <UserList users={users} activeId={active?._id} onSelect={setActive} />
        {active
          ? <ChatWindow otherUser={active} currentUser={user} />
          : <EmptyChat />
        }
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </MainLayout>
  );
}
