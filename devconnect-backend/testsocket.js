const { io } = require("socket.io-client");

console.log("Starting client...");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected successfully:", socket.id);

  
  socket.emit("join", "698e25f10306de70c7bf26c3");


  setTimeout(() => {
    socket.emit("sendMessage", {
      senderId: "698e25f10306de70c7bf26c3",
      receiverId: "699016a67c8ddfc5ba6d7e90",
      content: "Hello from userA",
    });
  }, 2000);
});

socket.on("receiveMessage", (message) => {
  console.log("Received message:", message);
});

socket.on("connect_error", (err) => {
  console.log("Connection error:", err.message);
});
