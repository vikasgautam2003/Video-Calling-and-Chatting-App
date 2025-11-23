"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { socket } from "@/lib/socket";

export default function ChatPanel({
  chatOpen,
  setChatOpen,
  messages,
  typed,
  setTyped,
  handleSend,
  localAvatar,
  localName,
}) {
  return (
    <div
      className={`fixed right-0 top-0 h-full w-80 bg-[#14141c] border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ${
        chatOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-xl flex items-center justify-between">
        <div className="text-lg font-semibold">Room Chat</div>
        <button
          onClick={() => setChatOpen(false)}
          className="px-3 py-1 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition"
        >
          Close
        </button>
      </div>

      <div className="flex-grow p-5 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === socket.id;
          const avatar = isMe ? localAvatar : msg.avatar;
          const name = isMe ? localName || "You" : msg.name;

          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                isMe ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {avatar ? (
                <img
                  src={avatar}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs">
                  {name
                    ? name
                        .split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
              )}

              <div
                className={`max-w-[70%] ${
                  isMe ? "items-end text-right" : "items-start text-left"
                } flex flex-col`}
              >
                <div className="text-xs opacity-70 mb-1">{name}</div>

                <div
                  className={`px-4 py-3 rounded-2xl text-sm ${
                    isMe
                      ? "bg-green-600 text-white rounded-br-none"
                      : "bg-white/10 border border-white/10 rounded-bl-none"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        className="p-4 border-t border-white/10 flex gap-3 bg-white/5 backdrop-blur-xl"
      >
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="flex-grow p-3 rounded-xl bg-black/30 border border-white/10 focus:outline-none text-sm"
          placeholder="Type a message..."
        />

        <button className="px-4 bg-blue-600 rounded-xl flex items-center justify-center">
          <Send size={22} />
        </button>
      </form>
    </div>
  );
}
