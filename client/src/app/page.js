"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');

  const createRoom = () => {
    const id = uuidv4();
    router.push(`/room/${id}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (roomId) router.push(`/room/${roomId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-8">Video Chat App</h1>
      
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <button 
          onClick={createRoom}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded mb-4 transition"
        >
          Create New Meeting
        </button>
        
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="mx-4 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <form onSubmit={joinRoom} className="flex flex-col gap-4">
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