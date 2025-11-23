


"use client";

import { useEffect, useRef } from "react";

export default function Video({ peer, label, avatar, name, isVideoOff }) {
  const ref = useRef(null);

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });

    if (peer._remoteStreams?.length > 0) {
      if (ref.current) ref.current.srcObject = peer._remoteStreams[0];
    }
  }, [peer]);

  const initials =
    name?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "P";

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg backdrop-blur-xl min-h-[260px]">
      <video
        ref={ref}
        playsInline
        autoPlay
        className={`w-full h-full object-cover transform scale-x-[-1] ${
          isVideoOff ? "hidden" : "block"
        }`}
      />

      {isVideoOff && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
          {avatar ? (
            <img
              src={avatar}
              className="w-36 h-36 rounded-full object-cover border-4 border-white/20"
            />
          ) : (
            <div className="w-36 h-36 flex items-center justify-center rounded-full bg-white/10 text-4xl font-bold">
              {initials}
            </div>
          )}

          <div className="mt-4 text-lg text-white/80">{name || label}</div>
        </div>
      )}

      <div className="absolute top-3 right-3">
        {avatar ? (
          <img
            src={avatar}
            className="w-10 h-10 rounded-full border border-white/20"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm">
            {initials}
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/50 rounded-xl text-sm">
        {name || label}
      </div>
    </div>
  );
}
