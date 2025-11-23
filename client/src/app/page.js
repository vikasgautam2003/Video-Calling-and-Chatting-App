"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarData, setAvatarData] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
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
    return initials.toUpperCase();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-4">
      <h1 className="text-5xl font-extrabold mb-10 tracking-wide bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
        Start or Join a Meeting
      </h1>

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-lg transition-all">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative group">
            {avatarData ? (
              <img
                src={avatarData}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold border-2 border-white/10 shadow-lg">
                {makeInitialsAvatar(displayName) || 'U'}
              </div>
            )}
            {avatarData && (
              <button
                onClick={handleAvatarRemove}
                className="absolute -right-2 -top-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-full w-7 h-7 flex items-center justify-center shadow-md"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex-1">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="w-full p-4 rounded-lg bg-gray-800/60 border border-gray-700 text-white focus:outline-none focus:border-blue-600"
            />
            <div className="mt-2 text-xs text-gray-400">Visible to participants.</div>
          </div>
        </div>

        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`w-full mb-6 p-4 rounded-xl border-2 border-dashed ${
            dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 bg-gray-800/40'
          } flex items-center justify-center gap-3 cursor-pointer text-gray-300 hover:border-blue-500 transition`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />
          Upload or drag avatar
        </label>

        <button
          onClick={createRoom}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-xl text-lg shadow-lg transition mb-5"
        >
          Create New Meeting
        </button>

        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="mx-4 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <form onSubmit={joinRoom} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter Meeting ID"
            className="p-4 rounded-xl bg-gray-800/60 border border-gray-700 text-white focus:outline-none focus:border-blue-600"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-4 rounded-xl text-lg shadow-lg transition"
          >
            Join Meeting
          </button>
        </form>
      </div>
    </div>
  );
}





