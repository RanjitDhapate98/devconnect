// ============================================================
//  DevConnect — FeedPage.jsx
//  Infinite scroll feed, create post, like/unlike,
//  comment, bookmark — all wired to your backend
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { postAPI, userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// ── Avatar helper ─────────────────────────────────────────────
function Avatar({ user, size = 38 }) {
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
        : (user?.name?.[0] || "?").toUpperCase()
      }
    </div>
  );
}

// ── Time ago ──────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Skeleton loader ───────────────────────────────────────────
function PostSkeleton() {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 20, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1a1a22" }} className="skeleton" />
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, width: "35%", background: "#1a1a22", borderRadius: 6, marginBottom: 8 }} className="skeleton" />
          <div style={{ height: 10, width: "20%", background: "#1a1a22", borderRadius: 6 }} className="skeleton" />
        </div>
      </div>
      <div style={{ height: 12, background: "#1a1a22", borderRadius: 6, marginBottom: 8 }} className="skeleton" />
      <div style={{ height: 12, width: "80%", background: "#1a1a22", borderRadius: 6 }} className="skeleton" />
    </div>
  );
}

// ── Create Post Box ───────────────────────────────────────────
function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const max = 500;

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    try {
      await postAPI.create({ content: text.trim() });
      setText("");
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${focused ? "rgba(0,255,135,0.25)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 14, padding: 18, marginBottom: 16,
      transition: "border-color 0.2s",
      boxShadow: focused ? "0 0 0 3px rgba(0,255,135,0.04)" : "none",
    }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar user={user} />
        <div style={{ flex: 1 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="// share something with the dev community..."
            maxLength={max}
            rows={focused || text ? 3 : 1}
            style={{
              width: "100%", background: "none", border: "none", outline: "none",
              color: "#f0f0f5", fontSize: 14, resize: "none",
              fontFamily: "'Sora', sans-serif", lineHeight: 1.6,
              transition: "rows 0.2s", boxSizing: "border-box",
            }}
          />
          {(focused || text) && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11, color: text.length > max * 0.8 ? "#ff375f" : "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
                {text.length}/{max}
              </span>
              <button onClick={submit} disabled={!text.trim() || loading} style={{
                padding: "8px 20px", borderRadius: 8,
                border: "1px solid rgba(0,255,135,0.4)",
                background: text.trim() ? "rgba(0,255,135,0.08)" : "transparent",
                color: text.trim() ? "#00ff87" : "#4a4a5a",
                fontFamily: "'Space Mono', monospace", fontSize: 11,
                fontWeight: 700, letterSpacing: "0.06em",
                cursor: text.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}>
                {loading ? "posting..." : "→ post"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Comment section ───────────────────────────────────────────
function Comments({ post, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await postAPI.addComment(post._id, { text: text.trim() });
      setText("");
      onCommentAdded();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 12, paddingTop: 12 }}>
      {/* Existing comments */}
      {post.comments?.slice(0, 3).map((c) => (
        <div key={c._id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Avatar user={c.user} size={26} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#f0f0f5", marginRight: 6 }}>
              {c.user?.name || "User"}
            </span>
            <span style={{ fontSize: 13, color: "#8b8b9a" }}>{c.text}</span>
          </div>
          {c.user?._id === user?._id && (
            <button onClick={() => onCommentDeleted(post._id, c._id)} style={{
              background: "none", border: "none", color: "#4a4a5a",
              cursor: "pointer", fontSize: 11, padding: "0 4px",
            }}>✕</button>
          )}
        </div>
      ))}

      {/* Add comment */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Avatar user={user} size={26} />
        <input
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="add a comment..."
          style={{
            flex: 1, background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "7px 12px",
            color: "#f0f0f5", fontSize: 13, outline: "none",
            fontFamily: "'Sora', sans-serif",
          }}
        />
        <button onClick={submit} disabled={!text.trim() || loading} style={{
          background: "rgba(0,255,135,0.08)", border: "1px solid rgba(0,255,135,0.3)",
          color: "#00ff87", borderRadius: 8, padding: "7px 12px",
          cursor: "pointer", fontSize: 11, fontFamily: "'Space Mono', monospace",
        }}>→</button>
      </div>
    </div>
  );
}

// ── Single Post Card ──────────────────────────────────────────
function PostCard({ post: initialPost, onRefresh }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [showComments, setShowComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const isLiked = post.likes?.some(id => id === user?._id || id?._id === user?._id);
  const isBookmarked = false; // tracked server-side

  const toggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        await postAPI.unlike(post._id);
        setPost(p => ({ ...p, likes: p.likes.filter(id => (id?._id || id) !== user._id) }));
      } else {
        await postAPI.like(post._id);
        setPost(p => ({ ...p, likes: [...p.likes, user._id] }));
      }
    } catch (err) { console.error(err); }
    finally { setLikeLoading(false); }
  };

  const handleBookmark = async () => {
    try { await postAPI.bookmark(post._id); }
    catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try { await postAPI.delete(post._id); onRefresh(); }
    catch (err) { console.error(err); }
  };

  const handleCommentDeleted = async (postId, commentId) => {
    try {
      await postAPI.deleteComment(postId, commentId);
      setPost(p => ({ ...p, comments: p.comments.filter(c => c._id !== commentId) }));
    } catch (err) { console.error(err); }
  };

  const isOwner = post.user?._id === user?._id || post.user === user?._id;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: 20, marginBottom: 12,
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <Link to={`/profile/${post.user?._id || post.user}`}>
          <Avatar user={post.user} />
        </Link>
        <div style={{ flex: 1 }}>
          <Link to={`/profile/${post.user?._id || post.user}`} style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f5", display: "block" }}>
            {post.user?.name || "Developer"}
          </Link>
          <span style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
            {timeAgo(post.createdAt)}
          </span>
        </div>
        {isOwner && (
          <button onClick={handleDelete} style={{ background: "none", border: "none", color: "#4a4a5a", cursor: "pointer", fontSize: 13, padding: 4, borderRadius: 6, transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#ff375f"}
            onMouseLeave={e => e.currentTarget.style.color = "#4a4a5a"}
          >✕</button>
        )}
      </div>

      {/* Content */}
      <p style={{ fontSize: 14, color: "#c8c8d8", lineHeight: 1.7, marginBottom: 14, whiteSpace: "pre-wrap" }}>
        {post.content}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4 }}>
        {/* Like */}
        <ActionBtn
          icon={isLiked ? "▲" : "△"}
          count={post.likes?.length || 0}
          active={isLiked}
          onClick={toggleLike}
          activeColor="#00ff87"
          label="like"
        />
        {/* Comment */}
        <ActionBtn
          icon="◇"
          count={post.comments?.length || 0}
          onClick={() => setShowComments(!showComments)}
          activeColor="#00d4ff"
          label="comment"
        />
        {/* Bookmark */}
        <ActionBtn icon="⬡" onClick={handleBookmark} activeColor="#bf5af2" label="bookmark" />

        {/* View post */}
        <Link to={`/post/${post._id}`} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", padding: "6px 10px", borderRadius: 8, transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#f0f0f5"}
          onMouseLeave={e => e.currentTarget.style.color = "#4a4a5a"}
        >
          view →
        </Link>
      </div>

      {/* Comments */}
      {showComments && (
        <Comments
          post={post}
          onCommentAdded={() => setPost(p => ({ ...p, comments: [...(p.comments || []), { _id: Date.now(), text: "...", user }] }))}
          onCommentDeleted={handleCommentDeleted}
        />
      )}
    </div>
  );
}

function ActionBtn({ icon, count, active, onClick, activeColor, label }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 8, border: "none",
        background: active ? `rgba(${activeColor === "#00ff87" ? "0,255,135" : activeColor === "#00d4ff" ? "0,212,255" : "191,90,242"},0.08)` : hov ? "rgba(255,255,255,0.04)" : "transparent",
        color: active ? activeColor : hov ? "#f0f0f5" : "#4a4a5a",
        cursor: "pointer", fontSize: 13, fontFamily: "'Space Mono', monospace",
        transition: "all 0.18s",
      }}
    >
      <span>{icon}</span>
      {count !== undefined && <span style={{ fontSize: 11 }}>{count}</span>}
    </button>
  );
}

// ── Suggested Users (right panel) ────────────────────────────
function SuggestedUsers() {
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    userAPI.getAll().then(d => setUsers((d.data || []).slice(0, 5))).catch(() => {});
  }, []);

  const toggle = async (id) => {
    try {
      if (following[id]) { await userAPI.unfollow(id); setFollowing(f => ({ ...f, [id]: false })); }
      else { await userAPI.follow(id); setFollowing(f => ({ ...f, [id]: true })); }
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "#4a4a5a", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 16 }}>
        // Suggested Devs
      </h3>
      {users.map(u => (
        <div key={u._id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Link to={`/profile/${u._id}`}><Avatar user={u} size={34} /></Link>
          <Link to={`/profile/${u._id}`} style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#c8c8d8" }}>{u.name}</Link>
          <button onClick={() => toggle(u._id)} style={{
            padding: "5px 12px", borderRadius: 6,
            border: `1px solid ${following[u._id] ? "rgba(255,255,255,0.1)" : "rgba(0,255,135,0.3)"}`,
            background: following[u._id] ? "transparent" : "rgba(0,255,135,0.07)",
            color: following[u._id] ? "#4a4a5a" : "#00ff87",
            fontSize: 11, fontFamily: "'Space Mono', monospace",
            cursor: "pointer", transition: "all 0.2s",
          }}>
            {following[u._id] ? "following" : "+ follow"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Feed Page ─────────────────────────────────────────────────
export default function FeedPage() {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastCursor, setLastCursor]   = useState(null);
  const [hasMore, setHasMore]   = useState(true);
  const [tab, setTab]           = useState("feed"); // "feed" | "all"
  const loaderRef = useRef(null);

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) { setLoading(true); setPosts([]); setLastCursor(null); setHasMore(true); }
    try {
      let data;
      if (tab === "feed") {
        data = await postAPI.getFeed(10, reset ? "" : lastCursor);
      } else {
        data = await postAPI.getAll(1, 10);
      }
      const newPosts = data.data || [];
      setPosts(p => reset ? newPosts : [...p, ...newPosts]);
      setHasMore(data.hasMore ?? newPosts.length === 10);
      setLastCursor(data.nextCursor || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [tab, lastCursor]);

  // Initial load
  useEffect(() => { fetchPosts(true); }, [tab]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        setLoadingMore(true);
        fetchPosts(false);
      }
    }, { threshold: 0.1 });
    obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loading, fetchPosts]);

  const rightPanel = <SuggestedUsers />;

  return (
    <MainLayout rightPanel={rightPanel}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f5", letterSpacing: "-0.5px", marginBottom: 4 }}>
            Developer Feed ⚡
          </h1>
          <p style={{ fontSize: 12, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
            // what's happening in your network
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 3 }}>
          {[["feed", "My Feed"], ["all", "All Posts"]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
              background: tab === t ? "rgba(0,255,135,0.09)" : "transparent",
              color: tab === t ? "#00ff87" : "#4a4a5a",
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              fontWeight: 700, letterSpacing: "0.08em", cursor: "pointer",
              transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>

        {/* Create post */}
        <CreatePost onCreated={() => fetchPosts(true)} />

        {/* Posts */}
        {loading ? (
          [1,2,3].map(i => <PostSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4a4a5a", fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◇</div>
            <p>no posts yet. follow some devs!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post._id} post={post} onRefresh={() => fetchPosts(true)} />
          ))
        )}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {loadingMore && (
            <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #1a1a22", borderTopColor: "#00ff87", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
          )}
          {!hasMore && posts.length > 0 && (
            <p style={{ color: "#2a2a38", fontSize: 11, fontFamily: "'Space Mono', monospace" }}>// end of feed</p>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </MainLayout>
  );
}
