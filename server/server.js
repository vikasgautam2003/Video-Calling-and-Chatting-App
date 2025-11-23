


const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./model/message");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/video-chat")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

app.get("/messages/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  socket.on("join-room", (data) => {
    const { roomId, userId, avatar, name } = data;

    socket.join(roomId);
    socket.data.avatar = avatar;
    socket.data.name = name;

    socket.broadcast.to(roomId).emit("user-connected", {
      userId: socket.id,
      avatar,
      name,
    });

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", socket.id);
    });
  });

  socket.on("send-message", (data) => {
  io.to(data.roomId).emit("receive-message", {
    message: data.message,
    senderId: data.senderId,
    name: data.name,
    avatar: data.avatar
  });
});

  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit("user-joined", {
      signal: payload.signal,
      callerID: payload.callerID,
      callerAvatar: socket.data.avatar,
      callerName: socket.data.name,
    });
  });

  socket.on("returning-signal", (payload) => {
    io.to(payload.callerID).emit("receiving-returned-signal", {
      signal: payload.signal,
      id: socket.id,
      avatar: socket.data.avatar,
      name: socket.data.name,
    });
  });

  socket.on("camera-toggle", ({ userId, isVideoOff }) => {
  
  socket.broadcast.emit("peer-camera-toggled", { userId, isVideoOff });
});

  
});

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
