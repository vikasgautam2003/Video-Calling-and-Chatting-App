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

  const sendMessage = (message) => {
    if (!message.trim()) return;

    const data = {
      roomId,
      senderId: socket.id,
      message,
      timestamp: new Date().toLocaleTimeString(),
    };

    socket.emit("send-message", data);
  };

  return { messages, sendMessage };
}
