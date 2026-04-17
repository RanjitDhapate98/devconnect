// // ============================================================
// //  DevConnect — PostDetailPage.jsx
// //  Full post view with all comments, like, bookmark, delete
// //  Wired to: GET /api/post/:id, POST /:id/comment, DELETE
// // ============================================================

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { postAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

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
        : (user?.name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActionBtn({ icon, label, count, active, onClick, color = "#00ff87" }) {
  const [hov, setHov] = useState(false);
  const rgb = color === "#00ff87" ? "0,255,135" : color === "#00d4ff" ? "0,212,255" : color === "#bf5af2" ? "191,90,242" : "255,55,95";
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "10px 18px", borderRadius: 10,
        border: `1px solid ${active || hov ? `${color}40` : "rgba(255,255,255,0.07)"}`,
        background: active ? `rgba(${rgb},0.1)` : hov ? `rgba(${rgb},0.06)` : "transparent",
        color: active || hov ? color : "#4a4a5a",
        cursor: "pointer", fontSize: 14,
        fontFamily: "'Space Mono', monospace",
        transition: "all 0.2s",
      }}
    >
      <span>{icon}</span>
      <span style={{ fontSize: 12 }}>{label}{count !== undefined ? ` (${count})` : ""}</span>
    </button>
  );
}

function CommentCard({ comment, postId, onDeleted }) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const isOwner = comment.user?._id === user?._id;

  const del = async () => {
    if (!window.confirm("Delete comment?")) return;
    setDeleting(true);
    try {
      await postAPI.deleteComment(postId, comment._id);
      onDeleted(comment._id);
    } catch (err) { console.error(err); setDeleting(false); }
  };

  return (
    <div style={{
      display: "flex", gap: 12, padding: "14px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      animation: "fadeUp 0.25s ease",
    }}>
      <Link to={`/profile/${comment.user?._id}`}>
        <Avatar user={comment.user} size={32} />
      </Link>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <Link to={`/profile/${comment.user?._id}`} style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f5" }}>
            {comment.user?.name || "Developer"}
          </Link>
          <span style={{ fontSize: 10, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
            {timeAgo(comment.createdAt)}
          </span>
        </div>
        <p style={{ fontSize: 13.5, color: "#c8c8d8", lineHeight: 1.6 }}>{comment.text}</p>
      </div>
      {isOwner && (
        <button onClick={del} disabled={deleting} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#4a4a5a", fontSize: 13, padding: "4px 6px",
          borderRadius: 6, transition: "color 0.2s", flexShrink: 0,
          alignSelf: "flex-start",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#ff375f"}
          onMouseLeave={e => e.currentTarget.style.color = "#4a4a5a"}
        >{deleting ? "…" : "✕"}</button>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    postAPI.getById(id)
      .then(d => setPost(d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const isLiked   = post?.likes?.some(l => (l._id || l) === user?._id);
  const isOwner   = post?.user?._id === user?._id || post?.user === user?._id;

  const toggleLike = async () => {
    if (likeLoading || !post) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        await postAPI.unlike(post._id);
        setPost(p => ({ ...p, likes: p.likes.filter(l => (l._id || l) !== user._id) }));
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

  const submitComment = async () => {
    if (!comment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await postAPI.addComment(post._id, { text: comment.trim() });
      // Refresh post to get new comment with user populated
      const fresh = await postAPI.getById(post._id);
      setPost(fresh.data);
      setComment("");
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this post?")) return;
    try { await postAPI.delete(post._id); navigate("/feed"); }
    catch (err) { console.error(err); }
  };

  const onCommentDeleted = (commentId) => {
    setPost(p => ({ ...p, comments: p.comments.filter(c => c._id !== commentId) }));
  };

  if (loading) return (
    <MainLayout>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ height: 200, background: "rgba(255,255,255,0.02)", borderRadius: 16, marginBottom: 16 }} className="skeleton" />
        <div style={{ height: 60, background: "rgba(255,255,255,0.02)", borderRadius: 12 }} className="skeleton" />
      </div>
    </MainLayout>
  );

  if (!post) return (
    <MainLayout>
      <div style={{ textAlign: "center", padding: "80px 20px", color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
        <p>// post not found</p>
        <Link to="/feed" style={{ color: "#00ff87", display: "block", marginTop: 12 }}>← back to feed</Link>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px" }}>

        {/* Back */}
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#4a4a5a", fontSize: 13, fontFamily: "'Space Mono', monospace",
          display: "flex", alignItems: "center", gap: 6, marginBottom: 20,
          padding: 0, transition: "color 0.2s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#00ff87"}
          onMouseLeave={e => e.currentTarget.style.color = "#4a4a5a"}
        >← back</button>

        {/* Post */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 24, marginBottom: 14,
        }}>
          {/* Author */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <Link to={`/profile/${post.user?._id}`}>
              <Avatar user={post.user} size={44} />
            </Link>
            <div style={{ flex: 1 }}>
              <Link to={`/profile/${post.user?._id}`} style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f5", display: "block" }}>
                {post.user?.name || "Developer"}
              </Link>
              <span style={{ fontSize: 11, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
                {new Date(post.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {isOwner && (
              <button onClick={handleDeletePost} style={{
                background: "rgba(255,55,95,0.07)", border: "1px solid rgba(255,55,95,0.2)",
                borderRadius: 8, color: "#ff375f", cursor: "pointer",
                padding: "6px 12px", fontSize: 11, fontFamily: "'Space Mono', monospace",
                fontWeight: 700, transition: "all 0.2s",
              }}>delete</button>
            )}
          </div>

          {/* Content */}
          <p style={{ fontSize: 16, color: "#e0e0ea", lineHeight: 1.75, marginBottom: 20, whiteSpace: "pre-wrap" }}>
            {post.content}
          </p>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 16 }} />

          {/* Stats */}
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
              <span style={{ color: "#00ff87" }}>△</span> {post.likes?.length || 0} likes
            </span>
            <span style={{ fontSize: 12, color: "#4a4a5a", fontFamily: "'Space Mono', monospace" }}>
              <span style={{ color: "#00d4ff" }}>◇</span> {post.comments?.length || 0} comments
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActionBtn icon="△" label={isLiked ? "liked" : "like"} active={isLiked} onClick={toggleLike} color="#00ff87" />
            <ActionBtn icon="◇" label="comment" onClick={() => inputRef.current?.focus()} color="#00d4ff" />
            <ActionBtn icon="⬡" label="bookmark" onClick={handleBookmark} color="#bf5af2" />
          </div>
        </div>

        {/* Comments section */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: 20,
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#4a4a5a", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Space Mono', monospace", marginBottom: 16 }}>
            // Comments ({post.comments?.length || 0})
          </h2>

          {/* Add comment */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Avatar user={user} size={34} />
            <div style={{ flex: 1 }}>
              <textarea
                ref={inputRef}
                value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); }}}
                placeholder="// write a comment..."
                rows={2}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10, padding: "10px 14px",
                  color: "#f0f0f5", fontSize: 13, outline: "none",
                  fontFamily: "'Sora', sans-serif", resize: "none",
                  lineHeight: 1.5, transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(0,255,135,0.35)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                <button onClick={submitComment} disabled={!comment.trim() || submitting} style={{
                  padding: "8px 18px", borderRadius: 8,
                  border: "1px solid rgba(0,255,135,0.35)",
                  background: comment.trim() ? "rgba(0,255,135,0.08)" : "transparent",
                  color: comment.trim() ? "#00ff87" : "#4a4a5a",
                  fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700,
                  cursor: comment.trim() ? "pointer" : "not-allowed", transition: "all 0.2s",
                }}>
                  {submitting ? "posting..." : "→ comment"}
                </button>
              </div>
            </div>
          </div>

          {/* Comments list */}
          {post.comments?.length === 0 ? (
            <p style={{ color: "#2a2a38", fontSize: 12, fontFamily: "'Space Mono', monospace", textAlign: "center", padding: "24px 0" }}>
              // no comments yet · be the first
            </p>
          ) : (
            post.comments.map(c => (
              <CommentCard key={c._id} comment={c} postId={post._id} onDeleted={onCommentDeleted} />
            ))
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .skeleton { background:linear-gradient(90deg,#1a1a22 25%,#222228 50%,#1a1a22 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </MainLayout>
  );
}



// import { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import { ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Send, Trash2 } from "lucide-react";
// import MainLayout from "../components/layout/MainLayout";
// import { postAPI } from "../services/api";
// import { useAuth } from "../context/AuthContext";

// function timeAgo(d) {
//   const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
//   if (m < 1) return "just now";
//   if (m < 60) return `${m}m ago`;
//   const h = Math.floor(m / 60);
//   if (h < 24) return `${h}h ago`;
//   return `${Math.floor(h / 24)}d ago`;
// }

// const PostDetailPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [post, setPost] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [comment, setComment] = useState("");
//   const [submitting, setSubmitting] = useState(false);
//   const [likeLoading, setLikeLoading] = useState(false);
//   const [likeAnim, setLikeAnim] = useState(false);
//   const [bookmarked, setBookmarked] = useState(false);
//   const [bookmarkAnim, setBookmarkAnim] = useState(false);
//   const inputRef = useRef(null);

//   useEffect(() => {
//     postAPI
//       .getById(id)
//       .then((d) => setPost(d.data))
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, [id]);

//   const isLiked = post?.likes?.some((l) => (l._id || l) === user?._id);
//   const isOwner = post?.user?._id === user?._id || post?.user === user?._id;

//   const toggleLike = async () => {
//     if (likeLoading || !post) return;
//     setLikeLoading(true);
//     setLikeAnim(true);
//     setTimeout(() => setLikeAnim(false), 300);
//     try {
//       if (isLiked) {
//         await postAPI.unlike(post._id);
//         setPost((p) => ({ ...p, likes: p.likes.filter((l) => (l._id || l) !== user?._id) }));
//       } else {
//         await postAPI.like(post._id);
//         setPost((p) => ({ ...p, likes: [...p.likes, user?._id] }));
//       }
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLikeLoading(false);
//     }
//   };

//   const toggleBookmark = async () => {
//     setBookmarkAnim(true);
//     setTimeout(() => setBookmarkAnim(false), 300);
//     try {
//       await postAPI.bookmark(post._id);
//       setBookmarked((b) => !b);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const submitComment = async () => {
//     if (!comment.trim() || submitting) return;
//     setSubmitting(true);
//     try {
//       await postAPI.addComment(post._id, { text: comment.trim() });
//       const fresh = await postAPI.getById(post._id);
//       setPost(fresh.data);
//       setComment("");
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDeletePost = async () => {
//     if (!window.confirm("Delete this post?")) return;
//     try {
//       await postAPI.delete(post._id);
//       navigate("/feed");
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleDeleteComment = async (commentId) => {
//     if (!window.confirm("Delete comment?")) return;
//     try {
//       await postAPI.deleteComment(post._id, commentId);
//       setPost((p) => ({ ...p, comments: p.comments.filter((c) => c._id !== commentId) }));
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const renderContent = (content) => {
//     const parts = content.split(/(```[\s\S]*?```)/g);
//     return parts.map((part, i) => {
//       if (part.startsWith("```")) {
//         const code = part.replace(/```\w*\n?/, "").replace(/```$/, "");
//         return (
//           <pre key={i} className="mt-3 p-4 rounded-xl bg-secondary/80 border border-border text-xs font-mono overflow-x-auto text-foreground">
//             <code>{code.trim()}</code>
//           </pre>
//         );
//       }
//       return <span key={i}>{part}</span>;
//     });
//   };

//   if (loading) {
//     return (
//       <MainLayout>
//         <div className="max-w-2xl mx-auto px-4 py-6">
//           <div className="h-48 rounded-2xl bg-secondary/50 animate-pulse mb-4" />
//           <div className="h-16 rounded-2xl bg-secondary/50 animate-pulse" />
//         </div>
//       </MainLayout>
//     );
//   }

//   if (!post) {
//     return (
//       <MainLayout>
//         <div className="max-w-2xl mx-auto px-4 py-20 text-center">
//           <p className="text-muted-foreground text-sm mb-4">Post not found.</p>
//           <Link to="/feed" className="text-primary text-sm hover:underline">
//             ← back to feed
//           </Link>
//         </div>
//       </MainLayout>
//     );
//   }

//   return (
//     <MainLayout>
//       <div className="max-w-2xl mx-auto px-4 py-6">
//         {/* Back button */}
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back
//         </button>

//         {/* Post card */}
//         <div className="glass rounded-2xl p-5 mb-6">
//           <div className="flex items-start gap-3">
//             <Link
//               to={`/profile/${post.user?._id}`}
//               className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground cursor-pointer flex-shrink-0 overflow-hidden"
//             >
//               {post.user?.profilePicture ? (
//                 <img src={post.user.profilePicture} alt="" className="w-full h-full object-cover rounded-full" />
//               ) : (
//                 (post.user?.name?.[0] || "?").toUpperCase()
//               )}
//             </Link>
//             <div className="flex-1 min-w-0">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <Link
//                     to={`/profile/${post.user?._id}`}
//                     className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
//                   >
//                     {post.user?.name || "Developer"}
//                   </Link>
//                   <span className="text-xs text-muted-foreground">· {timeAgo(post.createdAt)}</span>
//                 </div>
//                 {isOwner && (
//                   <button
//                     onClick={handleDeletePost}
//                     className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 )}
//               </div>

//               <div className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
//                 {renderContent(post.content)}
//               </div>

//               {/* Stats */}
//               <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
//                 <span>{post.likes?.length || 0} likes</span>
//                 <span>·</span>
//                 <span>{post.comments?.length || 0} comments</span>
//               </div>

//               {/* Actions */}
//               <div className="flex items-center gap-1 mt-3">
//                 <button
//                   onClick={toggleLike}
//                   disabled={likeLoading}
//                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${isLiked
//                     ? "text-red-400 bg-red-400/10"
//                     : "text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
//                     }`}
//                 >
//                   <Heart
//                     className={`w-4 h-4 transition-transform duration-300 ${isLiked ? "fill-current" : ""} ${likeAnim ? "scale-125" : "scale-100"
//                       }`}
//                   />
//                   Like
//                 </button>
//                 <button
//                   onClick={() => inputRef.current?.focus()}
//                   className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
//                 >
//                   <MessageCircle className="w-4 h-4" />
//                   Comment
//                 </button>
//                 <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-blue-400 hover:bg-blue-400/10 transition-all">
//                   <Share2 className="w-4 h-4" />
//                   Share
//                 </button>
//                 <button
//                   onClick={toggleBookmark}
//                   className={`ml-auto p-1.5 rounded-lg text-xs transition-all ${bookmarked
//                     ? "text-primary bg-primary/10"
//                     : "text-muted-foreground hover:text-primary hover:bg-primary/10"
//                     }`}
//                 >
//                   <Bookmark
//                     className={`w-4 h-4 transition-transform duration-300 ${bookmarked ? "fill-current" : ""} ${bookmarkAnim ? "scale-125" : "scale-100"
//                       }`}
//                   />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Add comment */}
//         <div className="glass rounded-2xl p-4 mb-6">
//           <div className="flex items-start gap-3">
//             <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0 mt-1 overflow-hidden">
//               {user?.profilePicture ? (
//                 <img src={user.profilePicture} alt="" className="w-full h-full object-cover rounded-full" />
//               ) : (
//                 (user?.username?.[0] || user?.name?.[0] || "?").toUpperCase()
//               )}
//             </div>
//             <div className="flex-1">
//               <textarea
//                 ref={inputRef}
//                 value={comment}
//                 onChange={(e) => setComment(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter" && !e.shiftKey) {
//                     e.preventDefault();
//                     submitComment();
//                   }
//                 }}
//                 placeholder="Write a comment..."
//                 rows={2}
//                 className="w-full bg-secondary px-4 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:ring-2 focus:ring-primary/50 transition-all resize-none"
//               />
//               <div className="flex justify-end mt-2">
//                 <button
//                   onClick={submitComment}
//                   disabled={!comment.trim() || submitting}
//                   className="px-4 py-2 rounded-xl gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
//                 >
//                   <Send className="w-3.5 h-3.5" />
//                   {submitting ? "Posting..." : "Comment"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Comments list */}
//         <div className="space-y-3">
//           <h3 className="text-sm font-semibold text-muted-foreground mb-3">
//             Comments ({post.comments?.length || 0})
//           </h3>
//           {post.comments?.length === 0 ? (
//             <p className="text-center text-muted-foreground text-xs py-8">
//               No comments yet · be the first
//             </p>
//           ) : (
//             post.comments.map((c) => (
//               <div key={c._id} className="glass rounded-xl p-4 flex items-start gap-3 group">
//                 <Link
//                   to={`/profile/${c.user?._id}`}
//                   className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0 overflow-hidden"
//                 >
//                   {c.user?.profilePicture ? (
//                     <img src={c.user.profilePicture} alt="" className="w-full h-full object-cover" />
//                   ) : (
//                     (c.user?.name?.[0] || "?").toUpperCase()
//                   )}
//                 </Link>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2">
//                     <Link
//                       to={`/profile/${c.user?._id}`}
//                       className="text-sm font-medium text-foreground hover:text-primary transition-colors"
//                     >
//                       {c.user?.name || "Developer"}
//                     </Link>
//                     <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
//                   </div>
//                   <p className="text-sm text-foreground/80 mt-1">{c.text}</p>
//                 </div>
//                 {c.user?._id === user?._id && (
//                   <button
//                     onClick={() => handleDeleteComment(c._id)}
//                     className="p-1 rounded-lg text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
//                   >
//                     <Trash2 className="w-3.5 h-3.5" />
//                   </button>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </MainLayout>
//   );
// };

// export default PostDetailPage;  