// ============================================================
//  DevConnect — Socket Service
//  Single socket instance shared across the whole app.
// ============================================================

import { io } from "socket.io-client";
import { BASE_URL } from "./api";

let socket = null;

// Call once after login — creates the socket & joins user room
export const connectSocket = (userId) => {
  if (socket?.connected) return socket;

  socket = io(BASE_URL);

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("join", userId); // join personal room for notifications & messages
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

// Call on logout
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Get current socket instance
export const getSocket = () => socket;

// ── Emit helpers ────────────────────────────────────────────

// Send a chat message via socket (saved to DB by server)
export const sendSocketMessage = ({ senderId, receiverId, content }) => {
  if (!socket) return;
  socket.emit("sendMessage", { senderId, receiverId, content });
};

// ── Listen helpers ───────────────────────────────────────────

// Listen for incoming messages — returns cleanup fn
export const onReceiveMessage = (callback) => {
  if (!socket) return () => {};
  socket.on("receiveMessage", callback);
  return () => socket.off("receiveMessage", callback);
};

// Listen for real-time notifications — returns cleanup fn
export const onNewNotification = (callback) => {
  if (!socket) return () => {};
  socket.on("newNotification", callback);
  return () => socket.off("newNotification", callback);
};
