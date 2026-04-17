import Lottie from "lottie-react";
import animationData from "../assets/dev-animation.json"; // your json
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function GridBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.04 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00ff87" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {[
        { size: 500, x: "-10%", y: "-20%", color: "rgba(0,255,135,0.06)", dur: 12 },
        { size: 400, x: "60%", y: "50%", color: "rgba(0,212,255,0.05)", dur: 16 },
        { size: 300, x: "80%", y: "-10%", color: "rgba(0,255,135,0.04)", dur: 10 },
      ].map((o, i) => (
        <div key={i} style={{
          position: "absolute", left: o.x, top: o.y,
          width: o.size, height: o.size, borderRadius: "50%",
          background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
          animation: `orbFloat ${o.dur}s ease-in-out infinite alternate`,
        }} />
      ))}
      <div style={{
        position: "absolute", inset: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }} />

      {/* Lottie animation — lives inside background, fixed position, never shifts on resize */}
      <div style={{
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "clamp(260px, 35vw, 520px)",
        height: "clamp(260px, 35vw, 520px)",
        pointerEvents: "none",
        zIndex: 0,
        animation: "floatAnim 4s ease-in-out infinite"
      }}>
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{
            width: "100%",
            height: "100%",
            filter: "brightness(1.3) saturate(1.4)",
            mixBlendMode: "screen"
          }}
        />
      </div>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 6,
      background: "rgba(0,255,135,0.07)",
      border: "1px solid rgba(0,255,135,0.18)",
      color: "#00ff87", fontSize: 11,
      fontFamily: "'Space Mono', monospace",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff87", boxShadow: "0 0 6px #00ff87", display: "inline-block" }} />
      {children}
    </span>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, icon, error, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 600,
        letterSpacing: "0.12em", textTransform: "uppercase",
        color: focused ? "#00ff87" : "#4a4a5a",
        marginBottom: 7, transition: "color 0.2s",
        fontFamily: "'Space Mono', monospace",
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          fontSize: 15, opacity: focused ? 1 : 0.35, transition: "opacity 0.2s",
          pointerEvents: "none", color: "#00ff87",
          fontFamily: "'Space Mono', monospace",
        }}>{icon}</span>
        <input
          type={isPass ? (showPass ? "text" : "password") : type}
          value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: isPass ? "13px 44px 13px 42px" : "13px 16px 13px 42px",
            background: focused ? "rgba(0,255,135,0.03)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${error ? "#ff375f" : focused ? "rgba(0,255,135,0.45)" : "rgba(255,255,255,0.07)"}`,
            borderRadius: 10, color: "#f0f0f5", fontSize: 14, outline: "none",
            transition: "all 0.2s", fontFamily: "'Sora', sans-serif",
            boxShadow: focused ? "0 0 0 3px rgba(0,255,135,0.05)" : "none",
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShowPass(!showPass)} style={{
            position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: focused ? "#00ff87" : "#4a4a5a", fontSize: 14, transition: "color 0.2s",
          }}>{showPass ? "◉" : "◎"}</button>
        )}
      </div>
      {error && <p style={{ color: "#ff375f", fontSize: 11, marginTop: 5, fontFamily: "'Space Mono', monospace" }}>✗ {error}</p>}
    </div>
  );
}

function SubmitBtn({ loading, label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} disabled={loading}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", padding: "14px 0", borderRadius: 10,
        border: "1px solid rgba(0,255,135,0.5)", cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: loading ? "rgba(0,255,135,0.3)" : hovered ? "#0e0e11" : "#00ff87",
        background: loading ? "transparent" : hovered ? "#00ff87" : "rgba(0,255,135,0.06)",
        boxShadow: hovered && !loading ? "0 0 30px rgba(0,255,135,0.35)" : "none",
        transition: "all 0.22s", position: "relative", overflow: "hidden",
      }}
    >
      {loading ? (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,255,135,0.2)", borderTopColor: "#00ff87", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
          Processing...
        </span>
      ) : (
        <>
          <span style={{ position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)", animation: "shimmer 2.5s infinite" }} />
          {label}
        </>
      )}
    </button>
  );
}

export default function AuthPage({ mode: initialMode }) {
  const [mode, setMode] = useState(initialMode || "login");
  const [animOut, setAnimOut] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMode(initialMode || "login"); }, [initialMode]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const switchMode = (next) => {
    if (next === mode) return;
    setAnimOut(true); setErrors({}); setApiErr(""); setSuccess("");
    setTimeout(() => { setMode(next); setAnimOut(false); }, 280);
  };

  const validate = () => {
    const e = {};
    if (mode === "register" && (!form.name || form.name.trim().length < 2)) e.name = "Min 2 characters";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.password || form.password.length < 6) e.password = "Min 6 characters";
    if (mode === "register" && form.password !== form.confirm) e.confirm = "Passwords don't match";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setApiErr(""); setErrors({});
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
        navigate("/feed");
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
        setSuccess("Account created! Signing you in...");
        setTimeout(async () => {
          await login({ email: form.email, password: form.password });
          navigate("/feed");
        }, 1000);
      }
    } catch (err) {
      setApiErr(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0e0e11; }
        input::placeholder { color: #252530; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #141417 inset !important; -webkit-text-fill-color: #f0f0f5 !important; }
        @keyframes orbFloat { from { transform: translate(0,0) scale(1); } to { transform: translate(20px,30px) scale(1.05); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { left:-100%; } 100% { left:200%; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeDown { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(-14px); } }
        @keyframes glitch { 0%,100%{transform:translate(0)} 20%{transform:translate(-2px,2px)} 60%{transform:translate(1px,-1px)} }
      @keyframes floatAnim {
  0%,100% { transform: translate(-50%, -50%) translateY(0px); }
  50% { transform: translate(-50%, -50%) translateY(-12px); }
}
        .form-enter { animation: fadeUp 0.3s cubic-bezier(.22,1,.36,1) forwards; }
        .form-exit  { animation: fadeDown 0.25s ease forwards; }

        @media (max-width: 768px) {
          .auth-left { display: none !important; }
          .auth-divider { display: none !important; }
          .auth-right { width: 100% !important; padding: 40px 28px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#0e0e11", display: "flex", fontFamily: "'Sora', sans-serif", position: "relative", overflow: "hidden" }}>
        <GridBackground />

        {/* ── Left branding panel ── */}
        <div className="auth-left" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 72px", paddingLeft: 88, position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ marginBottom: 56 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#00ff87,#00d4ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 0 28px rgba(0,255,135,0.40)" }}>⚡</div>
              <span style={{ fontSize: 34, fontWeight: 800, background: "linear-gradient(90deg,#00ff87,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" }}>DevConnect</span>
            </div>
            <p style={{ color: "#252530", fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.18em" }}>// DEVELOPER SOCIAL NETWORK v1.0</p>
          </div>

          {/* Headline */}
          <div style={{ marginBottom: 44 }}>
            <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1, color: "#f0f0f5", marginBottom: 20, letterSpacing: "-1.5px" }}>
              Where devs<br />
              <span style={{ background: "linear-gradient(90deg,#00ff87,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>ship & connect.</span>
            </h1>
            <p style={{ fontSize: 17, color: "#4a4a5a", lineHeight: 1.8, maxWidth: 380 }}>
              Real-time messaging, developer feeds, live notifications — built with Socket.io, Node.js & MongoDB.
            </p>
          </div>

          {/* Feature tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 56 }}>
            {["socket.io real-time", "JWT auth", "developer feed", "live notifications", "cloudinary uploads"].map(t => <Tag key={t}>{t}</Tag>)}
          </div>

          {/* Code decoration */}
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "rgba(0,255,135,0.08)", lineHeight: 2, userSelect: "none" }}>
            <div><span style={{ color: "#1a3020" }}>const</span> dev = <span style={{ color: "#1a3020" }}>await</span> DevConnect.<span style={{ color: "#00ff87", opacity: 0.2 }}>auth</span>(credentials);</div>
            <div>dev.socket.emit(<span style={{ color: "#1a3020" }}>'join'</span>, userId);</div>
            <div>dev.on(<span style={{ color: "#1a3020" }}>'newNotification'</span>, handler);</div>
          </div>
        </div>

        {/* Divider */}
        <div className="auth-divider" style={{ width: 1, background: "linear-gradient(to bottom,transparent,rgba(0,255,135,0.12),transparent)", flexShrink: 0, alignSelf: "stretch", zIndex: 1 }} />

        {/* ── Right form panel ── */}
        <div className="auth-right" style={{ width: 480, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 48px", paddingRight: 72, position: "relative", zIndex: 1 }}>

          {/* Tabs */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, marginBottom: 32 }}>
            {[["login", "Sign In"], ["register", "Register"]].map(([m, label]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.22s",
                background: mode === m ? "rgba(0,255,135,0.09)" : "transparent",
                color: mode === m ? "#00ff87" : "#2a2a38",
                boxShadow: mode === m ? "0 0 12px rgba(0,255,135,0.08)" : "none",
              }}>{label}</button>
            ))}
          </div>

          {/* Form body */}
          <div className={animOut ? "form-exit" : "form-enter"} key={mode}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f5", marginBottom: 4, letterSpacing: "-0.4px" }}>
              {mode === "login" ? "Welcome back 👋" : "Join DevConnect 🚀"}
            </h2>
            <p style={{ fontSize: 12, color: "#4a4a5a", marginBottom: 28, fontFamily: "'Space Mono', monospace" }}>
              {mode === "login" ? "// sign in to your account" : "// create your developer profile"}
            </p>

            {mode === "register" && (
              <Field label="Full Name" icon="▸" placeholder="Your full name"
                value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
            )}
            <Field label="Email Address" type="email" icon="@" placeholder="you@example.com"
              value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
            <Field label="Password" type="password" icon="#" placeholder={mode === "login" ? "Enter password" : "Min 6 characters"}
              value={form.password} onChange={set("password")} error={errors.password}
              autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {mode === "register" && (
              <Field label="Confirm Password" type="password" icon="#" placeholder="Repeat password"
                value={form.confirm} onChange={set("confirm")} error={errors.confirm} autoComplete="new-password" />
            )}

            {mode === "login" && (
              <div style={{ textAlign: "right", marginTop: -8, marginBottom: 20 }}>
                <a href="#" style={{ fontSize: 11, color: "#2a2a38", fontFamily: "'Space Mono', monospace", transition: "color 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#00ff87"}
                  onMouseLeave={e => e.currentTarget.style.color = "#2a2a38"}
                >forgot_password?</a>
              </div>
            )}

            {apiErr && (
              <div style={{ background: "rgba(255,55,95,0.06)", border: "1px solid rgba(255,55,95,0.2)", borderRadius: 8, padding: "10px 14px", color: "#ff375f", fontSize: 12, fontFamily: "'Space Mono', monospace", marginBottom: 16, animation: "fadeUp 0.25s ease" }}>
                ✗ {apiErr}
              </div>
            )}
            {success && (
              <div style={{ background: "rgba(0,255,135,0.06)", border: "1px solid rgba(0,255,135,0.2)", borderRadius: 8, padding: "10px 14px", color: "#00ff87", fontSize: 12, fontFamily: "'Space Mono', monospace", marginBottom: 16, animation: "fadeUp 0.25s ease" }}>
                ✓ {success}
              </div>
            )}

            <SubmitBtn loading={loading} onClick={handleSubmit}
              label={mode === "login" ? "→ Sign In" : "→ Create Account"} />

            <p style={{ textAlign: "center", marginTop: 22, fontSize: 11, color: "#2a2a38", fontFamily: "'Space Mono', monospace" }}>
              {mode === "login" ? "no account? " : "have one? "}
              <button onClick={() => switchMode(mode === "login" ? "register" : "login")} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#00ff87", fontFamily: "'Space Mono', monospace", fontSize: 11,
                textDecoration: "underline", textUnderlineOffset: 3,
              }}>
                {mode === "login" ? "register()" : "login()"}
              </button>
            </p>
          </div>

          <p style={{ position: "absolute", bottom: 28, left: 48, right: 48, textAlign: "center", fontSize: 10, color: "#1a1a22", fontFamily: "'Space Mono', monospace" }}>
            DevConnect · Node.js + Socket.io + MongoDB + React
          </p>
        </div>
      </div>
    </>
  );
}