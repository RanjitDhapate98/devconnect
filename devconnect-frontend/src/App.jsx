// ============================================================
//  DevConnect — App.jsx
//  All routes defined here. Protected routes redirect to /login.
// ============================================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

// Pages
import AuthPage       from "./pages/AuthPage";
import FeedPage       from "./pages/FeedPage";
import ProfilePage    from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import ChatPage       from "./pages/ChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import BookmarksPage  from "./pages/BookmarksPage";
import ExplorePage    from "./pages/ExplorePage";
import PostDetailPage from "./pages/PostDetailPage";

import "./styles/global.css";

// ── Protected route wrapper ──────────────────────────────────
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
};

// ── Public route wrapper (redirect if already logged in) ─────
const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user)    return <Navigate to="/feed" replace />;
  return children;
};

function FullPageLoader() {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0e0e11" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #1a1a1f", borderTopColor: "#00ff87", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// ── Routes ───────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicOnly><AuthPage mode="login" /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><AuthPage mode="register" /></PublicOnly>} />

      {/* Protected */}
      <Route path="/feed"          element={<Protected><FeedPage /></Protected>} />
      <Route path="/explore"       element={<Protected><ExplorePage /></Protected>} />
      <Route path="/profile/:id"   element={<Protected><ProfilePage /></Protected>} />
      <Route path="/profile/me"    element={<Protected><ProfilePage isMe /></Protected>} />
      <Route path="/edit-profile"  element={<Protected><EditProfilePage /></Protected>} />
      <Route path="/chat"          element={<Protected><ChatPage /></Protected>} />
      <Route path="/chat/:userId"  element={<Protected><ChatPage /></Protected>} />
      <Route path="/notifications" element={<Protected><NotificationsPage /></Protected>} />
      <Route path="/bookmarks"     element={<Protected><BookmarksPage /></Protected>} />
      <Route path="/post/:id"      element={<Protected><PostDetailPage /></Protected>} />

      {/* Default */}
      <Route path="/"   element={<Navigate to="/feed" replace />} />
      <Route path="*"   element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
