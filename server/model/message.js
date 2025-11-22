const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  senderId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toLocaleTimeString() },
  createdAt: { type: Date, default: Date.now } 
});

module.exports = mongoose.model("Message", MessageSchema);