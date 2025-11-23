import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

export default function useChat(roomId) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5000/messages/${roomId}`);
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };

    fetchMessages();
  }, [roomId]);

  useEffect(() => {
    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive-message");
  }, []);

  const sendMessage = (msg) => {
    socket.emit("send-message", {
      roomId,
      message: msg,
      senderId: socket.id,
      name: localStorage.getItem("vc_name") || "User",
      avatar: localStorage.getItem("vc_avatar") || null
    });
  };

  return { messages, sendMessage };
}
