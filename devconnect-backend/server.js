
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const Message = require("./models/message");
const { createNotification } = require("./services/notificationService");

const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const testRoutes = require("./routes/testRoutes");

const { protect } = require("./middleware/authMiddleware");
const errorHandler = require("./middleware/errorMiddleware");

require("./config/cloudinary");

const app = express();

//db
connectDB();

//Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

//  Routes 
app.use("/api/auth", authRoutes);
app.use("/api/post", postRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/test", testRoutes);

app.get("/", (req, res) => {
  res.send("DevConnect API Running ⚡");
});

app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "protected route accessed", user: req.user });
});

// eh
app.use(errorHandler);

//  http+socket.io  
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);


io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  //  Join  room 
  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

 
  socket.on("sendMessage", async (data) => {
    try {
      const { senderId, receiverId, content } = data;

     if (!senderId || !receiverId || !content) {
        console.log("Missing message data");
        return;
      }

      // Save message to DB
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        content,
      });

      // Without this, frontend gets only ObjectIds, not name/profilePicture
      const populatedMessage = await Message.findById(newMessage._id)
        .populate("sender", "name profilePicture")
        .populate("receiver", "name profilePicture");

      // Emit to BOTH sender and receiver rooms
      io.to(receiverId).emit("receiveMessage", populatedMessage);
      io.to(senderId).emit("receiveMessage", populatedMessage);

      console.log(`Message sent from ${senderId} to ${receiverId}`);

//recivers notification
      await createNotification({
        recipient: receiverId,
        sender: senderId,
        type: "MESSAGE",
        io,
      });

    } catch (error) {
      console.error("sendMessage error:", error);
      socket.emit("messageError", { message: "Failed to send message" });
    }
  });

  //  Disconnect 
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

//  Start Server 
//  Start Server 
const PORT = process.env.PORT || 5000;

// Function to start server safely
function startServer(port) {
  server.listen(port, () => {
    console.log(`Server running on port ${port} ⚡`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1); // try next port
    } else {
      console.error("Server error:", err);
    }
  });
}

startServer(PORT);