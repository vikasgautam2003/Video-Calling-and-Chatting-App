"use client";

import { useEffect, useRef } from "react";

export default function Video({ peer, label }) {
  const ref = useRef(null);

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });

    if (peer._remoteStreams && peer._remoteStreams.length > 0) {
      if (ref.current) ref.current.srcObject = peer._remoteStreams[0];
    }
  }, [peer]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <video
        ref={ref}
        playsInline
        autoPlay
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
      <div className="absolute bottom-4 left-4 px-3 py-1 rounded-lg bg-black/50 text-sm">
        {label}
      </div>
    </div>
  );
}
