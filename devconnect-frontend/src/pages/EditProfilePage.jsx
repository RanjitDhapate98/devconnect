// ============================================================
//  DevConnect — EditProfilePage.jsx
//  Edit name, bio, skills, location, github, website
//  Upload profile picture via Cloudinary
//  Wired to: PATCH /api/user/me, PATCH /api/user/me/profile-picture
// ============================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Field({ label, value, onChange, placeholder, type = "text", hint, mono }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: focused ? "#00ff87" : "#4a4a5a",
        marginBottom: 7, fontFamily: "'Space Mono', monospace",
        transition: "color 0.2s",
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "12px 14px",
          background: focused ? "rgba(0,255,135,0.03)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${focused ? "rgba(0,255,135,0.4)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 10, color: "#f0f0f5", fontSize: 14, outline: "none",
          fontFamily: mono ? "'Space Mono', monospace" : "'Sora', sans-serif",
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(0,255,135,0.05)" : "none",
        }}
      />
      {hint && <p style={{ fontSize: 11, color: "#2a2a38", marginTop: 5, fontFamily: "'Space Mono', monospace" }}>{hint}</p>}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: focused ? "#00ff87" : "#4a4a5a",
        marginBottom: 7, fontFamily: "'Space Mono', monospace",
        transition: "color 0.2s",
      }}>{label}</label>
      <textarea
        value={value} onChange={onChange} rows={rows} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: "12px 14px", resize: "vertical",
          background: focused ? "rgba(0,255,135,0.03)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${focused ? "rgba(0,255,135,0.4)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: 10, color: "#f0f0f5", fontSize: 14, outline: "none",
          fontFamily: "'Sora', sans-serif", lineHeight: 1.6,
          transition: "all 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(0,255,135,0.05)" : "none",
        }}
      />
    </div>
  );
}

// ── Skills editor ─────────────────────────────────────────────
function SkillsEditor({ skills, onChange }) {
  const [input, setInput] = useState("");

  const add = () => {
    const s = input.trim().toLowerCase();
    if (!s || skills.includes(s)) { setInput(""); return; }
    onChange([...skills, s]);
    setInput("");
  };

  const remove = (s) => onChange(skills.filter(x => x !== s));

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4a4a5a", marginBottom: 7, fontFamily: "'Space Mono', monospace" }}>
        Skills
      </label>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {skills.map(s => (
          <span key={s} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 6,
            background: "rgba(0,212,255,0.07)",
            border: "1px solid rgba(0,212,255,0.2)",
            color: "#00d4ff", fontFamily: "'Space Mono', monospace", fontSize: 12,
          }}>
            {s}
            <button onClick={() => remove(s)} style={{ background: "none", border: "none", cursor: "pointer", color: "#00d4ff", fontSize: 13, padding: 0, lineHeight: 1, opacity: 0.6 }}>✕</button>
          </span>
        ))}
        {skills.length === 0 && (
          <span style={{ fontSize: 12, color: "#2a2a38", fontFamily: "'Space Mono', monospace" }}>// no skills added yet</span>
        )}
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="e.g. React, Node.js, MongoDB..."
          style={{
            flex: 1, padding: "10px 14px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 9, color: "#f0f0f5", fontSize: 13,
            outline: "none", fontFamily: "'Sora', sans-serif",
          }}
          onFocus={e => e.target.style.borderColor = "rgba(0,212,255,0.35)"}
          onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
        />
        <button onClick={add} style={{
          padding: "10px 16px", borderRadius: 9,
          border: "1px solid rgba(0,212,255,0.3)",
          background: "rgba(0,212,255,0.07)", color: "#00d4ff",
          fontFamily: "'Space Mono', monospace", fontSize: 12,
          fontWeight: 700, cursor: "pointer",
        }}>+ add</button>
      </div>
    </div>
  );
}

// ── Avatar upload ─────────────────────────────────────────────
function AvatarUpload({ user, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(user?.profilePicture || "");
  const fileRef                   = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const form = new FormData();
      form.append("profilePicture", file);
      const data = await userAPI.uploadProfilePic(form);
      onUploaded(data.data.profilePicture);
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28, padding: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14 }}>
      {/* Avatar preview */}
      <div style={{ position: "relative", cursor: "pointer" }} onClick={() => !uploading && fileRef.current?.click()}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg,#00ff87,#00d4ff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 800, color: "#0e0e11",
          overflow: "hidden", border: "3px solid rgba(0,255,135,0.3)",
          boxShadow: "0 0 20px rgba(0,255,135,0.12)",
        }}>
          {preview
            ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (user?.name?.[0] || "?").toUpperCase()}
        </div>
        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
          justifyContent: "center", opacity: 0, transition: "opacity 0.2s",
          fontSize: 18,
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0"}
        >
          {uploading ? (
            <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #1a1a22", borderTopColor: "#00ff87", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
          ) : "📷"}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f5", marginBottom: 4 }}>Profile Picture</p>
        <p style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginBottom: 10 }}>max 5MB · jpg, png, webp</p>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
          padding: "7px 16px", borderRadius: 7,
          border: "1px solid rgba(0,255,135,0.3)",
          background: "rgba(0,255,135,0.06)", color: "#00ff87",
          fontFamily: "'Space Mono', monospace", fontSize: 11,
          fontWeight: 700, cursor: "pointer",
        }}>
          {uploading ? "uploading..." : "→ upload"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
      </div>
    </div>
  );
}

export default function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate             = useNavigate();

  const [form, setForm] = useState({
    name: "", bio: "", location: "", github: "", website: "", skills: [],
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");

  useEffect(() => {
    userAPI.getMe().then(d => {
      const u = d.data;
      setForm({
        name: u.name || "", bio: u.bio || "", location: u.location || "",
        github: u.github || "", website: u.website || "", skills: u.skills || [],
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const data = await userAPI.updateMe(form);
      updateUser(data.data);
      setSuccess("✓ Profile updated successfully!");
      setTimeout(() => navigate(`/profile/${user._id}`), 1200);
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <MainLayout>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 20px" }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 60, background: "rgba(255,255,255,0.02)", borderRadius: 10, marginBottom: 14 }} className="skeleton" />)}
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "32px 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button onClick={() => navigate(-1)} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, color: "#8b8b9a", cursor: "pointer",
            padding: "7px 12px", fontSize: 14, transition: "all 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f0f0f5"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#8b8b9a"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
          >←</button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f0f0f5", letterSpacing: "-0.4px" }}>Edit Profile ✎</h1>
            <p style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>// update your developer profile</p>
          </div>
        </div>

        {/* Avatar upload */}
        <AvatarUpload user={user} onUploaded={(url) => updateUser({ profilePicture: url })} />

        {/* Form card */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Display Name" value={form.name} onChange={set("name")} placeholder="Your full name" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <TextArea label="Bio" value={form.bio} onChange={set("bio")} placeholder="Tell the dev community about yourself..." rows={3} />
            </div>
            <Field label="Location" value={form.location} onChange={set("location")} placeholder="City, Country" />
            <Field label="GitHub" value={form.github} onChange={set("github")} placeholder="github.com/username" mono />
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Website" value={form.website} onChange={set("website")} placeholder="https://yoursite.dev" mono />
            </div>
          </div>

          <SkillsEditor skills={form.skills} onChange={(s) => setForm(f => ({ ...f, skills: s }))} />

          {/* Messages */}
          {error && (
            <div style={{ background: "rgba(255,55,95,0.07)", border: "1px solid rgba(255,55,95,0.2)", borderRadius: 8, padding: "10px 14px", color: "#ff375f", fontSize: 12, fontFamily: "'Space Mono', monospace", marginBottom: 16 }}>
              ✗ {error}
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 8, padding: "10px 14px", color: "#00ff87", fontSize: 12, fontFamily: "'Space Mono', monospace", marginBottom: 16 }}>
              {success}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{
              flex: 1, padding: "12px 0", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent", color: "#8b8b9a",
              fontFamily: "'Space Mono', monospace", fontSize: 12,
              fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,55,95,0.3)"; e.currentTarget.style.color = "#ff375f"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#8b8b9a"; }}
            >cancel</button>

            <button onClick={save} disabled={saving} style={{
              flex: 2, padding: "12px 0", borderRadius: 10,
              border: "1px solid rgba(0,255,135,0.4)",
              background: saving ? "transparent" : "rgba(0,255,135,0.09)",
              color: saving ? "#4a4a5a" : "#00ff87",
              fontFamily: "'Space Mono', monospace", fontSize: 12,
              fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = "#00ff87"; e.currentTarget.style.color = "#0e0e11"; }}}
              onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = "rgba(0,255,135,0.09)"; e.currentTarget.style.color = "#00ff87"; }}}
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,255,135,0.2)", borderTopColor: "#00ff87", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  saving...
                </span>
              ) : "→ save changes"}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .skeleton { background:linear-gradient(90deg,#1a1a22 25%,#222228 50%,#1a1a22 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </MainLayout>
  );
}
