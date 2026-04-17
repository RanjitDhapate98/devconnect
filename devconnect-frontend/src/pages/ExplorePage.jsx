// ============================================================
//  DevConnect — ExplorePage.jsx
//  Discover developers, search by name
//  Wired to: GET /api/user, PUT /:id/follow, PUT /:id/unfollow
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Avatar({ user, size = 52 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg,#00ff87,#00d4ff)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color: "#0e0e11",
      overflow: "hidden",
      border: "2px solid rgba(0,255,135,0.25)",
      boxShadow: "0 0 16px rgba(0,255,135,0.1)",
    }}>
      {user?.profilePicture
        ? <img src={user.profilePicture} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : (user?.name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function SkillTag({ skill }) {
  return (
    <span style={{
      padding: "3px 8px", borderRadius: 5, fontSize: 10,
      background: "rgba(0,212,255,0.07)",
      border: "1px solid rgba(0,212,255,0.18)",
      color: "#00d4ff", fontFamily: "'Space Mono', monospace",
      whiteSpace: "nowrap",
    }}>{skill}</span>
  );
}

function DevCard({ user, isFollowing: initFollowing }) {
  const { user: me }          = useAuth();
  const navigate              = useNavigate();
  const [following, setFollowing] = useState(initFollowing);
  const [loading, setLoading]     = useState(false);
  const [hovered, setHovered]     = useState(false);

  const toggle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (following) await userAPI.unfollow(user._id);
      else           await userAPI.follow(user._id);
      setFollowing(!following);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/profile/${user._id}`)}
      style={{
        background: hovered ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${hovered ? "rgba(0,255,135,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16, padding: 20, cursor: "pointer",
        transition: "all 0.22s",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.4)" : "none",
        transform: hovered ? "translateY(-2px)" : "none",
        animation: "fadeUp 0.3s ease",
      }}
    >
      {/* Top */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
        <Avatar user={user} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f5", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.name}
          </div>
          {user.location && (
            <div style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
              ◎ {user.location}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p style={{
          fontSize: 12.5, color: "#8b8b9a", lineHeight: 1.55, marginBottom: 12,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{user.bio}</p>
      )}

      {/* Skills */}
      {user.skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {user.skills.slice(0, 4).map(s => <SkillTag key={s} skill={s} />)}
          {user.skills.length > 4 && (
            <span style={{ fontSize: 10, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", alignSelf: "center" }}>
              +{user.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            flex: 1, padding: "8px 0", borderRadius: 8,
            border: `1px solid ${following ? "rgba(255,255,255,0.1)" : "rgba(0,255,135,0.35)"}`,
            background: following ? "transparent" : "rgba(0,255,135,0.07)",
            color: following ? "#4a4a5a" : "#00ff87",
            fontFamily: "'Space Mono', monospace", fontSize: 11,
            fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { if (!following) { e.currentTarget.style.background = "#00ff87"; e.currentTarget.style.color = "#0e0e11"; }}}
          onMouseLeave={e => { if (!following) { e.currentTarget.style.background = "rgba(0,255,135,0.07)"; e.currentTarget.style.color = "#00ff87"; }}}
        >
          {loading ? "..." : following ? "✓ following" : "+ follow"}
        </button>
        <Link
          to={`/chat/${user._id}`}
          onClick={e => e.stopPropagation()}
          style={{
            padding: "8px 14px", borderRadius: 8,
            border: "1px solid rgba(0,212,255,0.25)",
            background: "rgba(0,212,255,0.06)",
            color: "#00d4ff", fontSize: 13, transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,212,255,0.14)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,212,255,0.06)"; }}
        >💬</Link>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const { user: me }          = useAuth();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    userAPI.getAll()
      .then(d => setUsers(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myFollowing = me?.following?.map(f => f._id || f) || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.bio?.toLowerCase().includes(q) ||
      u.skills?.some(s => s.toLowerCase().includes(q)) ||
      u.location?.toLowerCase().includes(q)
    );
  }, [users, search]);

  // Group: following first, then rest
  const following  = filtered.filter(u => myFollowing.includes(u._id));
  const discover   = filtered.filter(u => !myFollowing.includes(u._id));

  return (
    <MainLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f5", letterSpacing: "-0.5px" }}>
            Explore Devs 🔍
          </h1>
          <p style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginTop: 3 }}>
            // {users.length} developer{users.length !== 1 ? "s" : ""} in the network
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 32 }}>
          <span style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: searchFocused ? "#00ff87" : "#4a4a5a", fontSize: 14,
            fontFamily: "'Space Mono', monospace", transition: "color 0.2s",
            pointerEvents: "none",
          }}>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="search by name, skill, location..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "13px 16px 13px 42px",
              background: searchFocused ? "rgba(0,255,135,0.03)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${searchFocused ? "rgba(0,255,135,0.35)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12, color: "#f0f0f5", fontSize: 14, outline: "none",
              fontFamily: "'Sora', sans-serif", transition: "all 0.2s",
              boxShadow: searchFocused ? "0 0 0 3px rgba(0,255,135,0.05)" : "none",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              color: "#4a4a5a", fontSize: 14,
            }}>✕</button>
          )}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: 180, background: "rgba(255,255,255,0.02)", borderRadius: 16 }} className="skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>◎</div>
            <p style={{ fontSize: 13 }}>// no devs match "{search}"</p>
          </div>
        ) : (
          <>
            {/* People you follow */}
            {following.length > 0 && !search && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 11, fontWeight: 700, color: "#00ff87", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>
                  // Following ({following.length})
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
                  {following.map(u => <DevCard key={u._id} user={u} isFollowing />)}
                </div>
              </div>
            )}

            {/* Discover */}
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: "#4a4a5a", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>
                {search ? `// results (${filtered.length})` : `// discover (${discover.length})`}
              </h2>
              {(search ? filtered : discover).length === 0 ? (
                <p style={{ color: "#2a2a38", fontSize: 12, fontFamily: "'Space Mono', monospace" }}>// you're following everyone!</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
                  {(search ? filtered : discover).map(u => (
                    <DevCard key={u._id} user={u} isFollowing={myFollowing.includes(u._id)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .skeleton { background:linear-gradient(90deg,#1a1a22 25%,#222228 50%,#1a1a22 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </MainLayout>
  );
}
