// ============================================================
//  DevConnect — Central API Service
//  All HTTP calls to your backend live here.
//  Change BASE_URL when you deploy to Render.
// ============================================================

export const BASE_URL = "http://localhost:5000";

// Helper: build headers with JWT token
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// Helper: generic fetch wrapper
const request = async (method, path, body = null, isFormData = false) => {
  const headers = isFormData
    ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
    : authHeaders();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : null,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

// ── AUTH ────────────────────────────────────────────────────
export const authAPI = {
  register: (body) => request("POST", "/api/auth/register", body),
  login:    (body) => request("POST", "/api/auth/login", body),
};

// ── POSTS ───────────────────────────────────────────────────
export const postAPI = {
  create:         (body)              => request("POST",   "/api/post", body),
  getAll:         (page = 1, limit = 5) => request("GET", `/api/post?page=${page}&limit=${limit}`),
  getFeed:        (limit = 10, lastCreatedAt = "") =>
    request("GET", `/api/post/feed?limit=${limit}${lastCreatedAt ? `&lastCreatedAt=${lastCreatedAt}` : ""}`),
  getById:        (id)                => request("GET",    `/api/post/${id}`),
  delete:         (id)                => request("DELETE", `/api/post/${id}`),
  like:           (id)                => request("PUT",    `/api/post/${id}/like`),
  unlike:         (id)                => request("PUT",    `/api/post/${id}/unlike`),
  addComment:     (id, body)          => request("POST",   `/api/post/${id}/comment`, body),
  deleteComment:  (postId, commentId) => request("DELETE", `/api/post/${postId}/comment/${commentId}`),
  bookmark:       (id)                => request("POST",   `/api/post/${id}/bookmark`),
  removeBookmark: (id)                => request("DELETE", `/api/post/${id}/bookmark`),
  getByUser:      (userId, page = 1, limit = 5) =>
    request("GET", `/api/post/user/${userId}?page=${page}&limit=${limit}`),
};

// ── USERS ───────────────────────────────────────────────────
export const userAPI = {
  getAll:               ()       => request("GET",   "/api/user"),
  getMe:                ()       => request("GET",   "/api/user/me"),
  updateMe:             (body)   => request("PATCH", "/api/user/me", body),
  uploadProfilePic:     (form)   => request("PATCH", "/api/user/me/profile-picture", form, true),
  getBookmarks:         ()       => request("GET",   "/api/user/bookmarks"),
  getPublicProfile:     (id)     => request("GET",   `/api/user/${id}`),
  follow:               (id)     => request("PUT",   `/api/user/${id}/follow`),
  unfollow:             (id)     => request("PUT",   `/api/user/${id}/unfollow`),
  getFollowers:         (id)     => request("GET",   `/api/user/${id}/getfollowers`),
  getFollowing:         (id)     => request("GET",   `/api/user/${id}/getfollowing`),
};

// ── MESSAGES ────────────────────────────────────────────────
export const messageAPI = {
  getChatHistory: (userId, page = 1, limit = 20) =>
    request("GET", `/api/messages/${userId}?page=${page}&limit=${limit}`),
};

// ── NOTIFICATIONS ───────────────────────────────────────────
export const notificationAPI = {
  getAll:       () => request("GET",   "/api/notifications"),
  markAsRead:   (id) => request("PATCH", `/api/notifications/${id}/read`),
  getUnreadCount: () => request("GET", "/api/notifications/unread"),
};
