import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiCpu, FiUser, FiActivity, FiFileText, FiClock } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:8000';

const SharedChat = () => {
  const { shareId } = useParams();
  const [chatData, setChatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/share/${shareId}`);
        setChatData(response.data);
      } catch (err) {
        console.error('Error fetching shared chat:', err);
        setError(err.response?.data?.detail || 'Failed to load shared chat session.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedChat();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#07080a] text-gray-800 dark:text-gray-100 flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-500">Loading shared research chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#07080a] text-gray-800 dark:text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-white dark:bg-[#0d0e12] border border-gray-200 dark:border-white/5 rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <FiFileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Shared Chat Error</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <Link
            to="/login"
            className="inline-block w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/10 transition"
          >
            Go to Antigravity Assistant
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = chatData?.created_at 
    ? new Date(chatData.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#07080a] text-gray-800 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-white/5 px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-[#07080a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <FiActivity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white leading-tight">Antigravity</h1>
            <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Shared Research Session</p>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition shadow-md shadow-purple-500/5 cursor-pointer"
        >
          Get Started
        </Link>
      </header>

      {/* Chat History View */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6 relative z-10 overflow-y-auto">
        
        {/* Title Details Card */}
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.01] shadow-md dark:shadow-lg space-y-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{chatData?.title || 'Shared Research Chat'}</h2>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <FiClock className="w-3.5 h-3.5" />
              <span>Shared on {formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span>Read-Only Snapshot</span>
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/5 bg-white dark:bg-[#0d0e12] shadow-xl space-y-6">
          {chatData?.messages?.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <FiCpu className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed border ${
                  msg.role === 'user'
                    ? 'bg-purple-500/10 dark:bg-purple-600/10 border-purple-500/20 text-gray-800 dark:text-white rounded-br-none shadow-sm'
                    : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-200 rounded-bl-none shadow-sm'
                }`}
              >
                <div className="markdown-content whitespace-pre-wrap">
                  {msg.text}
                </div>
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <FiUser className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 dark:border-white/5 text-center text-xs text-gray-500 dark:text-gray-500">
        Powered by Antigravity AI Research Assistant
      </footer>
    </div>
  );
};

export default SharedChat;
