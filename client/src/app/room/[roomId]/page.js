


"use client";

import { useParams } from "next/navigation";
import Video from "@/components/Video";
import useVideoCall from "@/hooks/useVideoCall";
import useChat from "@/hooks/useChat";
import {
  Mic,
  MicOff,
  Video as VideoOn,
  VideoOff,
  Send,
  Users,
  Copy,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

export default function RoomPage() {
  const { roomId } = useParams();
  const { myVideoRef, peers, isMuted, isVideoOff, toggleMute, toggleVideo } =
    useVideoCall(roomId);
  const { messages, sendMessage } = useChat(roomId);

  const [typed, setTyped] = useState("");
  const [chatOpen, setChatOpen] = useState(true);

  const [localAvatar, setLocalAvatar] = useState(null);
  const [localName, setLocalName] = useState(null);

  const [infoOpen, setInfoOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const av = localStorage.getItem("vc_avatar");
    const nm = localStorage.getItem("vc_name");
    if (av) setLocalAvatar(av);
    if (nm) setLocalName(nm);
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    sendMessage(typed);
    setTyped("");
  };

  return (
    <div className="flex h-screen bg-[#0f0f14] text-white overflow-hidden">
      <div
        className={`flex-grow flex flex-col transition-all duration-300 ${
          chatOpen ? "mr-80" : ""
        }`}
      >
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <video
              ref={myVideoRef}
              muted
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                isVideoOff ? "hidden" : "block"
              }`}
            />

            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                {localAvatar ? (
                  <img
                    src={localAvatar}
                    alt="you"
                    className="w-40 h-40 rounded-full object-cover border-4 border-white/10"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full bg-white/10 flex items-center justify-center text-3xl font-semibold">
                    {localName
                      ? localName
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </div>
                )}
              </div>
            )}

            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-black/50 text-sm">
              {localName || "You"}
            </div>

            <div className="absolute top-4 right-4">
              {localAvatar ? (
                <img
                  src={localAvatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">
                  {localName
                    ? localName
                        .split(" ")
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U"}
                </div>
              )}
            </div>
          </div>

          {peers.map((p) => (
            <Video
              key={p.peerID}
              peer={p.peer}
              label={p.name || "Peer"}
              avatar={p.avatar}
              name={p.name}
              isVideoOff={p.isVideoOff}
            />
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/10 backdrop-blur-xl px-8 py-4 rounded-full border border-white/20 shadow-2xl">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
              isMuted ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
              isVideoOff ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {isVideoOff ? <VideoOff size={28} /> : <VideoOn size={28} />}
          </button>

          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-gray-700 hover:bg-gray-600"
          >
            <Users size={28} />
          </button>

          <button
            onClick={() => setInfoOpen(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-gray-700 hover:bg-gray-600"
          >
            <Info size={28} />
          </button>
        </div>
      </div>

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
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                msg.senderId === socket.id ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl max-w-[75%] text-sm ${
                  msg.senderId === socket.id
                    ? "bg-blue-600"
                    : "bg-white/10 border border-white/10"
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}
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

      {infoOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1b1b22] p-6 rounded-2xl w-96 border border-white/10 shadow-2xl text-white">
            <h2 className="text-xl font-semibold mb-4">Meeting Info</h2>

            <div className="bg-black/20 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-sm break-all">{roomId}</span>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
              >
                <Copy size={20} />
              </button>
            </div>

            {copied && (
              <p className="text-green-400 text-sm mt-2">Copied!</p>
            )}

            <button
              onClick={() => setInfoOpen(false)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-2 rounded-xl font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
