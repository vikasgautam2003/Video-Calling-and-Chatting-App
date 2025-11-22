import { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { socket } from "@/lib/socket";

export default function useVideoCall(roomId) {
  const myVideoRef = useRef(null);
  const [myStream, setMyStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const peersRef = useRef([]);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setMyStream(stream);

      if (myVideoRef.current) {
        myVideoRef.current.srcObject = stream;
      }

      socket.emit("join-room", roomId, socket.id);

      socket.on("user-connected", (userId) => {
        const peer = createPeer(userId, socket.id, stream);
        peersRef.current.push({ peerID: userId, peer });
        setPeers((prev) => [...prev, { peerID: userId, peer }]);
      });

      socket.on("signal", ({ sender, signal }) => {
        const peerObj = peersRef.current.find((p) => p.peerID === sender);
        if (peerObj) peerObj.peer.signal(signal);
      });
    });

    return () => {
      socket.off("user-connected");
      socket.off("signal");
    };
  }, [roomId]);

  useEffect(() => {
    if (!myStream) return;

    socket.on("user-joined", ({ signal, callerID }) => {
      const peer = addPeer(signal, callerID, myStream);
      peersRef.current.push({ peerID: callerID, peer });
      setPeers((prev) => [...prev, { peerID: callerID, peer }]);
    });

    socket.on("receiving-returned-signal", ({ id, signal }) => {
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) peerObj.peer.signal(signal);
    });

    socket.on("user-disconnected", (userId) => {
      const peerObj = peersRef.current.find((p) => p.peerID === userId);
      if (peerObj) peerObj.peer.destroy();

      peersRef.current = peersRef.current.filter((p) => p.peerID !== userId);
      setPeers((prev) => prev.filter((p) => p.peerID !== userId));
    });

    return () => {
      socket.off("user-joined");
      socket.off("receiving-returned-signal");
      socket.off("user-disconnected");
    };
  }, [myStream]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", { userToSignal, callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleMute = () => {
    if (!myStream) return;
    const enabled = myStream.getAudioTracks()[0].enabled;
    myStream.getAudioTracks()[0].enabled = !enabled;
    setIsMuted(!enabled);
  };

//   const toggleVideo = () => {
//     if (!myStream) return;
//     const enabled = myStream.getVideoTracks()[0].enabled;
//     myStream.getVideoTracks()[0].enabled = !enabled;
//     setIsVideoOff(!enabled);
//   };


const toggleVideo = () => {
  if (!myStream) return;
  const track = myStream.getVideoTracks()[0];
  track.enabled = !track.enabled;
  setIsVideoOff(!track.enabled);

  if (track.enabled && myVideoRef.current) {
    myVideoRef.current.srcObject = null;
    setTimeout(() => {
      myVideoRef.current.srcObject = myStream;
    }, 50);
  }
};




  return {
    myVideoRef,
    peers,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
  };
}
