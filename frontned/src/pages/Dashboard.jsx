import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Documents from './Documents';
import Chat from './Chat';
import { FiFolder, FiMessageSquare, FiLogOut, FiUser, FiActivity, FiServer, FiFileText } from 'react-icons/fi';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('documents');
  const [stats, setStats] = useState({
    documentsCount: 0,
    faissVectors: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      // Get all docs to count them
      const docsRes = await api.get('/documents/');
      const totalDocs = docsRes.data.length;

      // Get FAISS stats
      const faissRes = await api.get('/documents/faiss-stats');
      const totalVectors = faissRes.data.vectors || 0;

      setStats({
        documentsCount: totalDocs,
        faissVectors: totalVectors,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [activeTab]); // Refetch stats when switching tabs or uploading files

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-100 flex flex-col md:flex-row font-sans">
      {/* Background visual elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 bg-[#0d0e12] border-r border-white/5 flex flex-col justify-between relative z-20">
        <div>
          {/* Logo / Branding */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <FiActivity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white m-0 leading-tight">Antigravity</h1>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Research Assistant</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                  : 'text-gray-400 hover:bg-white/[0.02] hover:text-white border border-transparent'
              }`}
            >
              <FiFolder className="w-5 h-5" />
              <span>Documents</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-inner'
                  : 'text-gray-400 hover:bg-white/[0.02] hover:text-white border border-transparent'
              }`}
            >
              <FiMessageSquare className="w-5 h-5" />
              <span>AI Chat Room</span>
            </button>
          </nav>
        </div>

        {/* User Block & Logout */}
        <div className="p-4 border-t border-white/5 bg-[#0a0b0d]/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FiUser className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-400">Signed in as</p>
              <p className="text-sm font-bold text-white truncate max-w-[140px]">{user?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium border border-red-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shrink-0 bg-[#07080a]/80 backdrop-blur-md">
          <h2 className="text-xl font-bold text-white capitalize">{activeTab === 'documents' ? 'Document Library' : 'AI Assistant Chat'}</h2>
          
          {/* Quick Header Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>API Server Online</span>
            </div>
          </div>
        </header>

        {/* Inner Content scroll container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Statistics Bar (show cards) */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Documents</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {statsLoading ? '...' : stats.documentsCount}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                <FiFileText className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">FAISS Embeddings</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {statsLoading ? '...' : stats.faissVectors}
                </h3>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                <FiServer className="w-6 h-6" />
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md flex items-center justify-between shadow-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Storage Status</p>
                <h3 className="text-2xl font-black text-green-400 mt-1">Active</h3>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
                <FiActivity className="w-6 h-6" />
              </div>
            </div>
          </section>

          {/* Active View render */}
          <section className="min-h-0 flex flex-col">
            {activeTab === 'documents' ? (
              <Documents onUploadSuccess={fetchStats} />
            ) : (
              <Chat />
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
