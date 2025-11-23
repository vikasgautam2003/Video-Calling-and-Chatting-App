




"use client";

import { useParams } from "next/navigation";
import Video from "@/components/Video";
import ChatPanel from "@/components/ChatPanel";
import useVideoCall from "@/hooks/useVideoCall";
import useChat from "@/hooks/useChat";
import { Mic, MicOff, Video as VideoOn, VideoOff, Users, Info } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { socket } from "@/lib/socket";

export default function RoomPage() {
  const { roomId } = useParams();
  const { myVideoRef, peers, streams, isMuted, isVideoOff, toggleMute, toggleVideo } = useVideoCall(roomId);
  const { messages, sendMessage } = useChat(roomId);

  const [typed, setTyped] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [localAvatar, setLocalAvatar] = useState(null);
  const [localName, setLocalName] = useState(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);

  const audioAnalysers = useRef({});

  useEffect(() => {
    const av = localStorage.getItem("vc_avatar");
    const nm = localStorage.getItem("vc_name");
    if (av) setLocalAvatar(av);
    if (nm) setLocalName(nm);
  }, []);

  useEffect(() => {
    if (!streams) return;
    Object.entries(streams).forEach(([peerId, stream]) => {
      if (!stream || audioAnalysers.current[peerId]) return;
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);
      audioAnalysers.current[peerId] = { analyser, data };
    });
  }, [streams]);

  useEffect(() => {
    const loop = () => {
      let loudest = null;
      let maxVolume = 0;
      Object.entries(audioAnalysers.current).forEach(([peerId, obj]) => {
        const { analyser, data } = obj;
        analyser.getByteFrequencyData(data);
        let vol = data.reduce((a, b) => a + b, 0);
        if (vol > maxVolume) {
          maxVolume = vol;
          loudest = peerId;
        }
      });
      if (maxVolume > 3000) setActiveSpeaker(loudest);
      requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    sendMessage(typed);
    setTyped("");
  };

  const allVideos = [
    {
      id: socket.id,
      type: "local",
      videoRef: myVideoRef,
      name: localName,
      avatar: localAvatar,
      isVideoOff: isVideoOff,
    },
    ...peers.map((p) => ({
      id: p.peerID,
      type: "peer",
      peer: p.peer,
      name: p.name,
      avatar: p.avatar,
      isVideoOff: p.isVideoOff,
    }))
  ];

  const count = allVideos.length;

  let gridClass =
    count === 1
      ? "grid-cols-1"
      : count === 2
      ? "grid-cols-1 md:grid-cols-2"
      : count <= 4
      ? "grid-cols-1 md:grid-cols-2"
      : count <= 9
      ? "grid-cols-2 lg:grid-cols-3"
      : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="flex h-screen bg-[#0f0f14] text-white overflow-hidden">
      <div className={`flex-grow flex flex-col transition-all duration-300 ${chatOpen ? "mr-80" : ""}`}>

        {/* BEAUTIFUL SMOOTH SCROLLER (ONLY CHANGE) */}
        <div
          className={`
            flex-grow
            grid ${gridClass}
            gap-4 p-4 sm:p-6
            overflow-y-auto
            overflow-x-auto
            scroll-smooth
            snap-x snap-mandatory
            scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent
          `}
        >

          {allVideos.map((v) => {
            const highlight = activeSpeaker === v.id;

            if (v.type === "local") {
              return (
                <div
                  key={v.id}
                  className={`
                    relative rounded-2xl overflow-hidden border shadow-xl backdrop-blur-xl transition-all
                    snap-center
                    ${highlight ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.7)] scale-[1.02]" : "border-white/10"}
                  `}
                >
                  <video
                    ref={v.videoRef}
                    muted
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover ${v.isVideoOff ? "hidden" : "block"}`}
                  />

                  {v.isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      {v.avatar ? (
                        <img src={v.avatar} className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-white/10" />
                      ) : (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white/10 flex items-center justify-center text-3xl font-semibold">
                          {v.name ? v.name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() : "U"}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/50 text-sm">
                    {v.name || "You"}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={v.id}
                className={`
                  transition-all snap-center
                  ${highlight ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.7)] scale-[1.02]" : ""}
                `}
              >
                <Video
                  peer={v.peer}
                  label={v.name}
                  avatar={v.avatar}
                  name={v.name}
                  isVideoOff={v.isVideoOff}
                />
              </div>
            );
          })}

        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white/10 backdrop-blur-xl px-8 py-4 rounded-full border border-white/20 shadow-2xl z-50">
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

      <ChatPanel
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        messages={messages}
        typed={typed}
        setTyped={setTyped}
        handleSend={handleSend}
        localAvatar={localAvatar}
        localName={localName}
      />

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
                <svg width="20" height="20" fill="white"><path d="M6 2h9a2 2 0 0 1 2 2v9h-2V4H6V2Zm-3 4h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm0 2v9h9V8H3Z"/></svg>
              </button>
            </div>

            {copied && <p className="text-green-400 text-sm mt-2">Copied!</p>}

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
