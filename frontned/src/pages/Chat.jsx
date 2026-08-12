import React, { useState, useEffect, useRef } from 'react';
import { api } from '../context/AuthContext';
import { FiSend, FiCpu, FiUser, FiInfo, FiTrash2, FiFileText, FiFilter } from 'react-icons/fi';

const Chat = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSources, setLastSources] = useState([]);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await api.get('/documents/');
        setDocuments(response.data);
      } catch (error) {
        console.error('Error fetching documents for filter:', error);
      }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    // Scroll chat to bottom when messages update
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage = {
      role: 'user',
      text: question.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const payload = {
        question: userMessage.text,
      };
      if (selectedDocId) {
        payload.document_id = selectedDocId;
      }

      const response = await api.post('/chat/ask', payload);
      
      const assistantMessage = {
        role: 'assistant',
        text: response.data.answer,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastSources(response.data.sources || []);
    } catch (error) {
      console.error('Error in RAG chat:', error);
      const assistantMessage = {
        role: 'assistant',
        text: 'Sorry, I encountered an error searching the database or generating an answer. Please verify the backend status.',
        isError: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setLastSources([]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setLastSources([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[480px]">
      
      {/* Left Area: Chat Panel */}
      <div className="flex-1 flex flex-col bg-[#0d0e12] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Chat Control Header */}
        <div className="p-4 bg-white/[0.02] border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <FiFilter className="text-purple-400 w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Context Scope</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold cursor-pointer max-w-xs truncate"
            >
              <option value="">Search All Documents</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Only: {doc.filename}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-30 rounded-xl text-xs font-semibold border border-red-500/20 transition cursor-pointer"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            <span>Reset History</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <FiCpu className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Interactive Research Agent</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Ask questions about your uploaded research papers. The AI will extract relevant text chunks and base answers on facts.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
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
                    className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed border ${
                      msg.role === 'user'
                        ? 'bg-purple-600/10 border-purple-500/20 text-white rounded-br-none shadow-md'
                        : msg.isError
                        ? 'bg-red-500/10 border-red-500/20 text-red-400 rounded-bl-none'
                        : 'bg-white/[0.02] border-white/5 text-gray-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    {/* Render helper to format markdown headers/lists on screen */}
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
              
              {loading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                    <FiCpu className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 rounded-bl-none flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white/[0.01] border-t border-white/5 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={selectedDocId ? "Ask about selected paper..." : "Ask a general research question..."}
            required
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-500/10 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
          >
            <FiSend className="w-4 h-4" />
          </button>
        </form>

      </div>

      {/* Right Area: Sources Panel */}
      <div className="w-full lg:w-80 flex flex-col bg-[#0d0e12] border border-white/5 rounded-2xl overflow-hidden shadow-xl shrink-0">
        <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
          <FiInfo className="text-purple-400 w-4 h-4" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">RAG Chunk Sources</h4>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {lastSources.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 py-12">
              <FiFileText className="w-10 h-10 mb-2 text-gray-700" />
              <p className="text-xs font-medium">No source context retrieved</p>
              <p className="text-[10px] text-gray-700 mt-1 max-w-[200px]">Ask a question to inspect references from FAISS database</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lastSources.map((source, index) => (
                <div
                  key={index}
                  className="p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-bold">
                      Chunk #{source.chunk_index}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 truncate flex-1" title={source.filename}>
                      {source.filename}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-sans max-h-32 overflow-y-auto custom-scrollbar">
                    "{source.preview}..."
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Chat;
