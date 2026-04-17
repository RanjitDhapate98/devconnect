

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { userAPI, postAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Avatar({ user, size = 34 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#00ff87,#00d4ff)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#0e0e11",
      overflow: "hidden", border: "1.5px solid rgba(0,255,135,0.2)",
    }}>
      {user?.profilePicture
        ? <img src={user.profilePicture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : (user?.name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function BookmarkCard({ post, onRemove }) {
  const [removing, setRemoving] = useState(false);
  const [hovered, setHovered]   = useState(false);

  const remove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoving(true);
    try {
      await postAPI.removeBookmark(post._id);
      onRemove(post._id);
    } catch (err) { console.error(err); setRemoving(false); }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(0,255,135,0.18)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, padding: 20, transition: "all 0.2s",
        animation: "fadeUp 0.3s ease",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Left accent */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: hovered ? "linear-gradient(to bottom,#00ff87,#00d4ff)" : "rgba(255,255,255,0.06)",
        borderRadius: "3px 0 0 3px", transition: "background 0.2s",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Link to={`/profile/${post.user?._id}`} onClick={e => e.stopPropagation()}>
          <Avatar user={post.user} />
        </Link>
        <div style={{ flex: 1 }}>
          <Link to={`/profile/${post.user?._id}`} onClick={e => e.stopPropagation()}
            style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f5", display: "block" }}>
            {post.user?.name || "Developer"}
          </Link>
          <span style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
            {timeAgo(post.createdAt)}
          </span>
        </div>

        {/* Remove bookmark */}
        <button onClick={remove} disabled={removing} title="Remove bookmark" style={{
          background: "none", border: "none", cursor: removing ? "not-allowed" : "pointer",
          color: removing ? "#4a4a5a" : hovered ? "#ff375f" : "#4a4a5a",
          fontSize: 16, padding: 4, borderRadius: 6, transition: "color 0.2s",
          opacity: hovered ? 1 : 0.4,
        }}>
          {removing ? "…" : "⬡"}
        </button>
      </div>

      {/* Content */}
      <Link to={`/post/${post._id}`} style={{ textDecoration: "none" }}>
        <p style={{
          fontSize: 14, color: "#c8c8d8", lineHeight: 1.7, marginBottom: 14,
          display: "-webkit-box", WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {post.content}
        </p>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: "#00ff87" }}>△</span> {post.likes?.length || 0}
          </span>
          <span style={{ fontSize: 12, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: "#00d4ff" }}>◇</span> {post.comments?.length || 0}
          </span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: hovered ? "#00ff87" : "#4a4a5a", fontFamily: "'Space Mono', monospace", transition: "color 0.2s" }}>
            read post →
          </span>
        </div>
      </Link>
    </div>
  );
}

function EmptyBookmarks() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.25 }}>⬡</div>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: "#4a4a5a" }}>// no bookmarks yet</p>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#2a2a38", marginTop: 8 }}>save posts from your feed to read later</p>
      <Link to="/feed" style={{
        display: "inline-block", marginTop: 20,
        padding: "9px 20px", borderRadius: 8,
        border: "1px solid rgba(0,255,135,0.3)",
        background: "rgba(0,255,135,0.06)", color: "#00ff87",
        fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700,
      }}>→ go to feed</Link>
    </div>
  );
}

export default function BookmarksPage() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getBookmarks()
      .then(d => setPosts(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const remove = (id) => setPosts(prev => prev.filter(p => p._id !== id));

  return (
    <MainLayout>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f5", letterSpacing: "-0.5px" }}>
            Bookmarks 🔖
          </h1>
          <p style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginTop: 3 }}>
            // {posts.length} saved post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          [1,2,3].map(i => (
            <div key={i} style={{ height: 120, background: "rgba(255,255,255,0.02)", borderRadius: 14, marginBottom: 12 }} className="skeleton" />
          ))
        ) : posts.length === 0 ? (
          <EmptyBookmarks />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {posts.map(p => <BookmarkCard key={p._id} post={p} onRemove={remove} />)}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .skeleton { background:linear-gradient(90deg,#1a1a22 25%,#222228 50%,#1a1a22 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </MainLayout>
  );
}
