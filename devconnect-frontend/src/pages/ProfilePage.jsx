// ============================================================
//  DevConnect — ProfilePage.jsx
//  Public profile + My profile
//  Wired to: /api/user/:id, /api/user/me, /api/post/user/:id
//  Follow/unfollow, posts grid, skills, links
// ============================================================

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { userAPI, postAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Avatar({ user, size = 80 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#00ff87,#00d4ff)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color: "#0e0e11",
      overflow: "hidden",
      border: "3px solid rgba(0,255,135,0.3)",
      boxShadow: "0 0 24px rgba(0,255,135,0.15)",
    }}>
      {user?.profilePicture
        ? <img src={user.profilePicture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : (user?.name?.[0] || "?").toUpperCase()
      }
    </div>
  );
}

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatBox({ label, value, onClick }) {
  return (
    <div onClick={onClick} style={{
      textAlign: "center", cursor: onClick ? "pointer" : "default",
      padding: "12px 20px", borderRadius: 10,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      transition: "all 0.2s",
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = "rgba(0,255,135,0.25)"; e.currentTarget.style.background = "rgba(0,255,135,0.04)"; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f5", letterSpacing: "-0.5px" }}>{value ?? "—"}</div>
      <div style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SkillTag({ skill }) {
  return (
    <span style={{
      padding: "4px 12px", borderRadius: 6, fontSize: 12,
      background: "rgba(0,212,255,0.07)",
      border: "1px solid rgba(0,212,255,0.2)",
      color: "#00d4ff", fontFamily: "'Space Mono', monospace",
    }}>{skill}</span>
  );
}

function PostMini({ post }) {
  return (
    <Link to={`/post/${post._id}`} style={{
      display: "block", padding: 16,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 12, transition: "all 0.2s",
      textDecoration: "none",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,255,135,0.2)"; e.currentTarget.style.background = "rgba(0,255,135,0.02)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
    >
      <p style={{ fontSize: 13, color: "#c8c8d8", lineHeight: 1.6, marginBottom: 10,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{post.content}</p>
      <div style={{ display: "flex", gap: 14 }}>
        <span style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
          △ {post.likes?.length || 0}
        </span>
        <span style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
          ◇ {post.comments?.length || 0}
        </span>
        <span style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginLeft: "auto" }}>
          {timeAgo(post.createdAt)}
        </span>
      </div>
    </Link>
  );
}

// ── Followers/Following Modal ─────────────────────────────────
function UserListModal({ title, users, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "#141417", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, width: 380, maxHeight: "70vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f5" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a4a5a", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: 16 }}>
          {users?.length === 0
            ? <p style={{ color: "#4a4a5a", fontFamily: "'Space Mono', monospace", fontSize: 12, textAlign: "center", padding: 24 }}>// no users yet</p>
            : users?.map(u => (
              <Link key={u._id} to={`/profile/${u._id}`} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", textDecoration: "none" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#00ff87,#00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#0e0e11", overflow: "hidden" }}>
                  {u.profilePicture ? <img src={u.profilePicture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f5" }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>{u.email}</div>
                </div>
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage({ isMe: forcedMe }) {
  const { id }        = useParams();
  const { user: me }  = useAuth();
  const navigate      = useNavigate();
  const isMe          = forcedMe || id === me?._id;

  const [profile, setProfile]       = useState(null);
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [following, setFollowing]   = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [modal, setModal]           = useState(null); // "followers" | "following"
  const [modalUsers, setModalUsers] = useState([]);

  const userId = isMe ? me?._id : id;

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const fetcher = isMe ? userAPI.getMe() : userAPI.getPublicProfile(userId);
    fetcher
      .then(d => {
        setProfile(d.data);
        // Check if me already follows this user
        if (!isMe && me?.following) {
          setFollowing(me.following.some(f => (f._id || f) === userId));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    setPostsLoading(true);
    postAPI.getByUser(userId)
      .then(d => setPosts(d.data || []))
      .catch(console.error)
      .finally(() => setPostsLoading(false));
  }, [userId, isMe]);

  const toggleFollow = async () => {
    setFollowLoading(true);
    try {
      if (following) { await userAPI.unfollow(userId); setProfile(p => ({ ...p, followersCount: (p.followersCount || 1) - 1 })); }
      else           { await userAPI.follow(userId);   setProfile(p => ({ ...p, followersCount: (p.followersCount || 0) + 1 })); }
      setFollowing(!following);
    } catch (err) { console.error(err); }
    finally { setFollowLoading(false); }
  };

  const openModal = async (type) => {
    setModal(type);
    try {
      const data = type === "followers"
        ? await userAPI.getFollowers(userId)
        : await userAPI.getFollowing(userId);
      setModalUsers(type === "followers" ? data.followers : data.following);
    } catch { setModalUsers([]); }
  };

  if (loading) return (
    <MainLayout>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ height: 200, background: "rgba(255,255,255,0.03)", borderRadius: 16, marginBottom: 20 }} className="skeleton" />
        <div style={{ height: 16, width: "40%", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 12 }} className="skeleton" />
        <div style={{ height: 12, width: "60%", background: "rgba(255,255,255,0.03)", borderRadius: 8 }} className="skeleton" />
      </div>
    </MainLayout>
  );

  if (!profile) return (
    <MainLayout>
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
        // user not found
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>

        {/* ── Profile Card ── */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18, padding: 28, marginBottom: 16,
          position: "relative", overflow: "hidden",
        }}>
          {/* Background glow */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,255,135,0.04) 0%,transparent 70%)", pointerEvents: "none" }} />

          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Avatar user={profile} size={80} />

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f5", letterSpacing: "-0.5px" }}>{profile.name}</h1>
                {profile.github && (
                  <a href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", padding: "3px 8px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#00ff87"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4a4a5a"}
                  >github ↗</a>
                )}
                {profile.website && (
                  <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", padding: "3px 8px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#00d4ff"}
                    onMouseLeave={e => e.currentTarget.style.color = "#4a4a5a"}
                  >website ↗</a>
                )}
              </div>

              {profile.location && (
                <p style={{ fontSize: 12, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
                  ◎ {profile.location}
                </p>
              )}

              {profile.bio && (
                <p style={{ fontSize: 14, color: "#8b8b9a", lineHeight: 1.65, marginBottom: 14, maxWidth: 460 }}>
                  {profile.bio}
                </p>
              )}

              {/* Skills */}
              {profile.skills?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {profile.skills.map(s => <SkillTag key={s} skill={s} />)}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {isMe ? (
                  <>
                    <button onClick={() => navigate("/edit-profile")} style={{
                      padding: "9px 20px", borderRadius: 9,
                      border: "1px solid rgba(0,255,135,0.4)",
                      background: "rgba(0,255,135,0.07)", color: "#00ff87",
                      fontFamily: "'Space Mono', monospace", fontSize: 12,
                      fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = "#00ff87"; e.currentTarget.style.color = "#0e0e11"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,255,135,0.07)"; e.currentTarget.style.color = "#00ff87"; }}
                    >✎ edit_profile</button>
                    <button onClick={() => navigate("/chat")} style={{
                      padding: "9px 20px", borderRadius: 9,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "transparent", color: "#8b8b9a",
                      fontFamily: "'Space Mono', monospace", fontSize: 12,
                      fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.3)"; e.currentTarget.style.color = "#00d4ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#8b8b9a"; }}
                    >💬 messages</button>
                  </>
                ) : (
                  <>
                    <button onClick={toggleFollow} disabled={followLoading} style={{
                      padding: "9px 24px", borderRadius: 9,
                      border: `1px solid ${following ? "rgba(255,255,255,0.1)" : "rgba(0,255,135,0.4)"}`,
                      background: following ? "transparent" : "rgba(0,255,135,0.07)",
                      color: following ? "#8b8b9a" : "#00ff87",
                      fontFamily: "'Space Mono', monospace", fontSize: 12,
                      fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    }}>
                      {followLoading ? "..." : following ? "✓ following" : "+ follow"}
                    </button>
                    <button onClick={() => navigate(`/chat/${userId}`)} style={{
                      padding: "9px 20px", borderRadius: 9,
                      border: "1px solid rgba(0,212,255,0.3)",
                      background: "rgba(0,212,255,0.06)", color: "#00d4ff",
                      fontFamily: "'Space Mono', monospace", fontSize: 12,
                      fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    }}>💬 message</button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            <StatBox label="posts"     value={posts.length} />
            <StatBox label="followers" value={profile.followersCount ?? profile.followers?.length ?? 0} onClick={() => openModal("followers")} />
            <StatBox label="following" value={profile.followingCount ?? profile.following?.length ?? 0} onClick={() => openModal("following")} />
            {profile.createdAt && (
              <div style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}>
                <span style={{ fontSize: 11, color: "#2a2a38", fontFamily: "'Space Mono', monospace" }}>
                  joined {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Posts ── */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#4a4a5a", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>
            // Posts ({posts.length})
          </h2>
          {postsLoading ? (
            [1,2,3].map(i => (
              <div key={i} style={{ height: 80, background: "rgba(255,255,255,0.02)", borderRadius: 12, marginBottom: 10 }} className="skeleton" />
            ))
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#4a4a5a", fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
              // no posts yet
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {posts.map(p => <PostMini key={p._id} post={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <UserListModal
          title={modal === "followers" ? "Followers" : "Following"}
          users={modalUsers}
          onClose={() => { setModal(null); setModalUsers([]); }}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .skeleton { background: linear-gradient(90deg,#1a1a22 25%,#222228 50%,#1a1a22 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </MainLayout>
  );
}
