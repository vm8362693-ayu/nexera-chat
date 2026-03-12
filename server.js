// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static(__dirname + "/public"));

// Server config endpoint
app.get("/config", (req, res) => {
  res.json({
    serverURL: process.env.SERVER_URL || "https://nexera-chat-3.onrender.com"
  });
});

// Chat logic
const blockedUsers = new Set();
let connectedUsers = [];

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("join", (username) => {
    socket.username = username;
    connectedUsers.push(username);
    console.log(`${username} joined`);

    // Update admin dashboard
    io.of("/admin").emit("users", connectedUsers);
  });

  socket.on("chat message", (msg) => {
    if (blockedUsers.has(socket.id)) return;

    const bannedWords = ["badword1", "badword2"];
    const lowerMsg = msg.toLowerCase();
    if (bannedWords.some(word => lowerMsg.includes(word))) {
      blockedUsers.add(socket.id);
      socket.emit("blocked", "You sent inappropriate message!");
      return;
    }

    // Broadcast to all users
    io.emit("chat message", { user: socket.username, message: msg });

    // Send to admin dashboard
    io.of("/admin").emit("message", { user: socket.username, message: msg });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.username) {
      connectedUsers = connectedUsers.filter(u => u !== socket.username);
      io.of("/admin").emit("users", connectedUsers);
    }
  });
});

// Admin namespace
io.of("/admin").on("connection", (socket) => {
  console.log("Admin connected:", socket.id);
  socket.emit("users", connectedUsers);
});

// Use Render PORT environment variable
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});
