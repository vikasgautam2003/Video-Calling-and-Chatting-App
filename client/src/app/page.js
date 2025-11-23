
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarData, setAvatarData] = useState(null); // base64
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    // load saved avatar/name
    const savedAvatar = localStorage.getItem('vc_avatar');
    const savedName = localStorage.getItem('vc_name');
    if (savedAvatar) setAvatarData(savedAvatar);
    if (savedName) setDisplayName(savedName);
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      setAvatarData(result);
      localStorage.setItem('vc_avatar', result);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarRemove = () => {
    setAvatarData(null);
    localStorage.removeItem('vc_avatar');
  };

  const createRoom = () => {
    // save displayName
    if (displayName) localStorage.setItem('vc_name', displayName);
    const id = uuidv4();
    router.push(`/room/${id}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (displayName) localStorage.setItem('vc_name', displayName);
    if (roomId) router.push(`/room/${roomId}`);
  };

  const makeInitialsAvatar = (name) => {
    if (!name) return null;
    const parts = name.trim().split(/\s+/);
    const initials = (parts[0][0] || '') + (parts[1]?.[0] || '');
    // small CSS circle with initials will be rendered if no image
    return initials.toUpperCase();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <h1 className="text-4xl font-bold mb-6">Video Chat App</h1>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {avatarData ? (
              <img
                src={avatarData}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-semibold">
                {makeInitialsAvatar(displayName) || 'U'}
              </div>
            )}
            {avatarData && (
              <button
                onClick={handleAvatarRemove}
                className="absolute -right-1 -top-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center"
                title="Remove avatar"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex-1">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name (optional)"
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            />
            <div className="mt-2 text-xs text-gray-400">This name & avatar will be shown to others in the room.</div>
          </div>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`w-full mb-4 p-3 rounded border border-dashed ${dragOver ? 'border-blue-500' : 'border-gray-600'} flex items-center gap-3 cursor-pointer`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
          <div className="text-sm text-gray-300">Upload avatar (drag & drop or click)</div>
        </label>

        <button
          onClick={createRoom}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded mb-3 transition"
        >
          Create New Meeting
        </button>

        <div className="flex items-center my-3">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="mx-3 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <form onSubmit={joinRoom} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Enter Room ID"
            className="p-3 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-blue-500"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
