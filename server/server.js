



// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", (socket) => {
//   socket.on("join-room", (roomId, userId) => {
//     socket.join(roomId);
//     socket.broadcast.to(roomId).emit("user-connected", userId);

//     socket.on("disconnect", () => {
//       socket.broadcast.to(roomId).emit("user-disconnected", userId);
//     });
//   });

//   socket.on("send-message", (messageData) => {
//     io.to(messageData.roomId).emit("receive-message", messageData);
//   });

//   socket.on("sending-signal", (payload) => {
//     io.to(payload.userToSignal).emit("user-joined", {
//       signal: payload.signal,
//       callerID: payload.callerID,
//     });
//   });

//   socket.on("returning-signal", (payload) => {
//     io.to(payload.callerID).emit("receiving-returned-signal", {
//       signal: payload.signal,
//       id: socket.id,
//     });
//   });
// });

// server.listen(PORT, () => {
//   console.log(`SERVER RUNNING ON PORT ${PORT}`);
// });





const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./model/message.js");
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
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
    });
  });

  socket.on("send-message", async (messageData) => {
    try {
      const newMessage = new Message({
        roomId: messageData.roomId,
        senderId: messageData.senderId,
        message: messageData.message,
        timestamp: messageData.timestamp,
      });

      await newMessage.save();
      io.to(messageData.roomId).emit("receive-message", messageData);
    } catch (err) {
      console.log("Error saving message:", err);
    }
  });

  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit("user-joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning-signal", (payload) => {
    io.to(payload.callerID).emit("receiving-returned-signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });
});

server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
