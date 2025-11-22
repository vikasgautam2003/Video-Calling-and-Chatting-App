// "use client";

// if (typeof window !== 'undefined') window.global = window;

// import { useEffect, useRef, useState } from 'react';
// import { useParams } from 'next/navigation';
// import { io } from 'socket.io-client';
// import Peer from 'simple-peer';
// import { Mic, MicOff, Video as VideoIcon, VideoOff, Send } from 'lucide-react';

// const socket = io('http://localhost:5000');

// const Video = ({ peer }) => {
//   const ref = useRef();

//   useEffect(() => {
//     // 1. Listen for the 'stream' event
//     peer.on('stream', (stream) => {
//       console.log("Stream received!"); 
//       if (ref.current) {
//         ref.current.srcObject = stream;
//       }
//     });

//     // 2. CRITICAL FIX: Check if the stream is ALREADY there 
//     // (In case we missed the event during render)
//     // simple-peer stores the remote stream in _remoteStreams behaviorally
//     if (peer._remoteStreams && peer._remoteStreams.length > 0) {
//        console.log("Stream was already there, mounting now.");
//        if (ref.current) {
//          ref.current.srcObject = peer._remoteStreams[0];
//        }
//     }
//   }, [peer]);

//   return (
//     <div className="relative h-full w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
//       <video ref={ref} playsInline autoPlay  className="w-full h-full object-cover transform scale-x-[-1]" />
//       <span className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-sm text-white">Peer</span>
//     </div>
//   );
// };

// export default function Room() {
//   const { roomId } = useParams();

//   const myVideoRef = useRef(null);
//   const [myStream, setMyStream] = useState(null);
//   const [peers, setPeers] = useState([]);
//   const peersRef = useRef([]);

//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [isMuted, setIsMuted] = useState(false);
//   const [isVideoOff, setIsVideoOff] = useState(false);

//   useEffect(() => {
//     if (!roomId) return;

//     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
//       .then((stream) => {
//         setMyStream(stream);
//         if (myVideoRef.current) {
//           myVideoRef.current.srcObject = stream;
//         }

//         socket.emit('join-room', roomId, socket.id);

//         socket.on('user-connected', (userId) => {
//           const peer = createPeer(userId, socket.id, stream);
//           peersRef.current.push({ peerID: userId, peer });
//           setPeers((prev) => [...prev, { peerID: userId, peer }]);
//         });

//         socket.on('signal', (data) => {
//           const item = peersRef.current.find((p) => p.peerID === data.sender);
//           if (item) {
//             item.peer.signal(data.signal);
//           }
//         });
//       });

//     socket.on('receive-message', (newMessage) => {
//       setMessages((prev) => [...prev, newMessage]);
//     });

//     return () => {
//       socket.off('user-connected');
//       socket.off('receive-message');
//       socket.off('signal');
//     };
//   }, [roomId]);

//   function createPeer(userToSignal, callerID, stream) {
//     const peer = new Peer({ initiator: true, trickle: false, stream });

//     peer.on('signal', (signal) => {
//       socket.emit('sending-signal', { userToSignal, callerID, signal });
//     });

//     return peer;
//   }

//   function addPeer(incomingSignal, callerID, stream) {
//     const peer = new Peer({ initiator: false, trickle: false, stream });

//     peer.on('signal', (signal) => {
//       socket.emit('returning-signal', { signal, callerID });
//     });

//     peer.signal(incomingSignal);

//     return peer;
//   }

//   useEffect(() => {
//     if (!myStream) return;

//     socket.on('user-joined', (payload) => {
//       const peer = addPeer(payload.signal, payload.callerID, myStream);
//       peersRef.current.push({ peerID: payload.callerID, peer });
//       setPeers((users) => [...users, { peerID: payload.callerID, peer }]);
//     });

//     socket.on('receiving-returned-signal', (payload) => {
//       const item = peersRef.current.find((p) => p.peerID === payload.id);
//       if (item) {
//         item.peer.signal(payload.signal);
//       }
//     });

//     return () => {
//       socket.off('user-joined');
//       socket.off('receiving-returned-signal');
//     };
//   }, [myStream]);

//   const sendMessage = (e) => {
//     e.preventDefault();
//     if (!message.trim()) return;
//     const data = { roomId, senderId: socket.id, message, timestamp: new Date().toLocaleTimeString() };
//     socket.emit('send-message', data);
//     setMessage('');
//   };

//   const toggleMute = () => {
//     if (myStream) {
//       myStream.getAudioTracks()[0].enabled = !myStream.getAudioTracks()[0].enabled;
//       setIsMuted(!isMuted);
//     }
//   };

//   const toggleVideo = () => {
//     if (myStream) {
//       myStream.getVideoTracks()[0].enabled = !myStream.getVideoTracks()[0].enabled;
//       setIsVideoOff(!isVideoOff);
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
//       <div className="flex-grow flex flex-col">
//         <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-4 overflow-y-auto">
//           <div className="relative h-full w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
//              <video ref={myVideoRef} muted autoPlay playsInline className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : 'block'}`} />
//              {isVideoOff && <div className="absolute inset-0 flex items-center justify-center bg-gray-800"><span className="text-2xl">Camera Off</span></div>}
//              <span className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-sm">You</span>
//           </div>

//           {peers.map((peerObj, index) => (
//             <Video key={index} peer={peerObj.peer} />
//           ))}
//         </div>

//         <div className="h-20 bg-gray-800 flex items-center justify-center gap-6 border-t border-gray-700">
//           <button onClick={toggleMute} className={`p-4 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}>
//             {isMuted ? <MicOff /> : <Mic />}
//           </button>
//           <button onClick={toggleVideo} className={`p-4 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'}`}>
//             {isVideoOff ? <VideoOff /> : <VideoIcon />}
//           </button>
//         </div>
//       </div>

//       <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
//          <div className="p-4 border-b border-gray-700 font-bold">Chat Room</div>
//          <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3">
//             {messages.map((msg, index) => (
//                <div key={index} className={`flex flex-col ${msg.senderId === socket.id ? 'items-end' : 'items-start'}`}>
//                   <div className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${msg.senderId === socket.id ? 'bg-blue-600' : 'bg-gray-700'}`}>
//                     {msg.message}
//                   </div>
//                </div>
//             ))}
//          </div>

//          <form onSubmit={sendMessage} className="p-4 border-t border-gray-700 flex gap-2">
//            <input 
//              type="text" 
//              value={message} 
//              onChange={e => setMessage(e.target.value)} 
//              className="flex-grow p-2 rounded bg-gray-700 text-white text-sm" 
//              placeholder="Type..."
//            />
//            <button type="submit" className="bg-blue-600 p-2 rounded text-white">
//              <Send size={20}/>
//            </button>
//          </form>
//       </div>
//     </div>
//   );
// }





"use client";

import { useParams } from "next/navigation";
import Video from "@/components/Video";
import useVideoCall from "@/hooks/useVideoCall";
import useChat from "@/hooks/useChat";
import { Mic, MicOff, Video as VideoOn, VideoOff, Send, Users } from "lucide-react";
import { useState } from "react";
import { socket } from "@/lib/socket";

export default function RoomPage() {
  const { roomId } = useParams();
  const { myVideoRef, peers, isMuted, isVideoOff, toggleMute, toggleVideo } = useVideoCall(roomId);
  const { messages, sendMessage } = useChat(roomId);
  const [typed, setTyped] = useState("");
  const [chatOpen, setChatOpen] = useState(true);

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(typed);
    setTyped("");
  };

 
  return (
    <div className="flex h-screen bg-[#0f0f14] text-white overflow-hidden">
      <div className={`flex-grow flex flex-col transition-all duration-300 ${chatOpen ? "mr-80" : ""}`}>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto">
          <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <video
              ref={myVideoRef}
              muted
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <span className="text-3xl font-semibold">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-black/50 text-sm">
              You
            </div>
          </div>

          {peers.map((p, i) => (
            <Video key={i} peer={p.peer} label="Peer" />
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
        </div>
      </div>

      <div
        className={`fixed right-0 top-0 h-full w-80 bg-[#14141c] border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-300 ${
          chatOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-white/10 text-lg font-semibold bg-white/5 backdrop-blur-xl">
          Room Chat
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

        <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-3 bg-white/5 backdrop-blur-xl">
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
    </div>
  );
}
