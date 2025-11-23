






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

    const avatar = localStorage.getItem("vc_avatar") || null;
    const name = localStorage.getItem("vc_name") || null;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setMyStream(stream);
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;

      socket.emit("join-room", { roomId, userId: socket.id, avatar, name });

      socket.on("user-connected", (user) => {
        const peer = createPeer(user.userId, socket.id, stream);

        peersRef.current.push({
          peerID: user.userId,
          peer,
          avatar: user.avatar,
          name: user.name,
          isVideoOff: false,
        });

        setPeers((prev) => [
          ...prev,
          {
            peerID: user.userId,
            peer,
            avatar: user.avatar,
            name: user.name,
            isVideoOff: false,
          },
        ]);
      });
    });

    return () => {
      socket.off("user-connected");
    };
  }, [roomId]);

  useEffect(() => {
    if (!myStream) return;

    socket.on("user-joined", ({ signal, callerID, callerAvatar, callerName }) => {
      const peer = addPeer(signal, callerID, myStream);

      peersRef.current.push({
        peerID: callerID,
        peer,
        avatar: callerAvatar,
        name: callerName,
        isVideoOff: false,
      });

      setPeers((prev) => [
        ...prev,
        {
          peerID: callerID,
          peer,
          avatar: callerAvatar,
          name: callerName,
          isVideoOff: false,
        },
      ]);
    });

    socket.on("receiving-returned-signal", ({ id, signal, avatar, name }) => {
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) peerObj.peer.signal(signal);

      if (peerObj) {
        peerObj.avatar = avatar;
        peerObj.name = name;
      }

      setPeers((prev) =>
        prev.map((p) => (p.peerID === id ? { ...p, avatar, name } : p))
      );
    });

    socket.on("peer-camera-toggled", ({ userId, isVideoOff }) => {
      peersRef.current = peersRef.current.map((p) =>
        p.peerID === userId ? { ...p, isVideoOff } : p
      );

      setPeers((prev) =>
        prev.map((p) =>
          p.peerID === userId ? { ...p, isVideoOff } : p
        )
      );
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
      socket.off("peer-camera-toggled");
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
    const track = myStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
  };

  const toggleVideo = () => {
    if (!myStream) return;
    const track = myStream.getVideoTracks()[0];
    track.enabled = !track.enabled;

    setIsVideoOff(!track.enabled);

    socket.emit("camera-toggle", {
      userId: socket.id,
      isVideoOff: !track.enabled,
      roomId,
    });

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
