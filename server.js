const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {};

io.on("connection", (socket) => {

  socket.on("join", (username) => {
    users[socket.id] = username;

    io.emit("online", Object.keys(users).length);

    io.emit("chat", {
      user: "System",
      message: username + " joined the chat"
    });
  });

  socket.on("chat", (data) => {
    io.emit("chat", data);
  });

  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing");
  });

  socket.on("disconnect", () => {

    let username = users[socket.id];

    delete users[socket.id];

    io.emit("online", Object.keys(users).length);

    io.emit("chat", {
      user: "System",
      message: username + " left the chat"
    });

  });

});

server.listen(3000, () => {
  console.log("🚀 Nexera V4 Ultra running on http://localhost:3000");
});
