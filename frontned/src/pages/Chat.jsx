import React, { useState, useEffect, useRef } from 'react';
import { api } from '../context/AuthContext';
import { FiSend, FiCpu, FiUser, FiInfo, FiTrash2, FiFileText, FiFilter, FiDownload, FiShare2, FiCopy, FiX } from 'react-icons/fi';

const Chat = ({ onChatSuccess }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSources, setLastSources] = useState([]);
  const chatBottomRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [showSources, setShowSources] = useState(true);
  const [viewerPage, setViewerPage] = useState(1);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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

  useEffect(() => {
    let active = true;
    let currentUrl = null;

    const fetchPdf = async () => {
      if (!selectedDocId) {
        setPdfUrl('');
        return;
      }
      setPdfLoading(true);
      setPdfError('');
      try {
        const response = await api.get(`/documents/${selectedDocId}/file`, { responseType: 'blob' });
        if (!active) return;
        const blob = new Blob([response.data], { type: 'application/pdf' });
        currentUrl = URL.createObjectURL(blob);
        setPdfUrl(currentUrl);
        setViewerPage(1); // Reset page viewer back to 1
      } catch (error) {
        console.error('Error fetching PDF:', error);
        if (active) setPdfError('Failed to load PDF file.');
      } finally {
        if (active) setPdfLoading(false);
      }
    };

    fetchPdf();

    return () => {
      active = false;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [selectedDocId]);

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
        usage: response.data.usage,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastSources(response.data.sources || []);

      if (onChatSuccess) {
        onChatSuccess();
      }
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

  const triggerDownload = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    let content = `# Chat Transcript: ${selectedFilename || 'General Session'}\n\n`;
    messages.forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      content += `### ${role}\n${msg.text}\n\n`;
    });
    triggerDownload(content, `${selectedFilename ? selectedFilename.replace(/\.[^/.]+$/, "") : 'chat'}-transcript.md`, 'text/markdown');
  };

  const exportTxt = () => {
    let content = `Chat Transcript: ${selectedFilename || 'General Session'}\n\n`;
    messages.forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      content += `${role}:\n${msg.text}\n\n-------------------\n\n`;
    });
    triggerDownload(content, `${selectedFilename ? selectedFilename.replace(/\.[^/.]+$/, "") : 'chat'}-transcript.txt`, 'text/plain');
  };

  const exportPdf = () => {
    const printWindow = window.open('', '_blank');
    let html = `
      <html>
        <head>
          <title>Chat Transcript - ${selectedFilename || 'General'}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; line-height: 1.6; }
            h1 { border-bottom: 2px solid #7c3aed; padding-bottom: 10px; color: #7c3aed; font-size: 1.75rem; }
            .msg { margin-bottom: 25px; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; }
            .user { background: #f5f3ff; border-color: #ddd6fe; }
            .assistant { background: #f9fafb; border-color: #f3f4f6; }
            .role { font-weight: bold; font-size: 0.75rem; text-transform: uppercase; color: #6b7280; margin-bottom: 6px; letter-spacing: 0.05em; }
          </style>
        </head>
        <body>
          <h1>Chat Transcript: ${selectedFilename || 'General Research Session'}</h1>
    `;
    messages.forEach(msg => {
      const roleClass = msg.role === 'user' ? 'user' : 'assistant';
      const roleName = msg.role === 'user' ? 'User' : 'Assistant';
      html += `
        <div class="msg ${roleClass}">
          <div class="role">${roleName}</div>
          <div style="white-space: pre-wrap;">${msg.text}</div>
        </div>
      `;
    });
    html += `
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const shareChatSession = async () => {
    if (messages.length === 0) return;
    setSharing(true);
    try {
      const response = await api.post('/chat/share', {
        title: selectedFilename ? `Research Chat: ${selectedFilename}` : 'General Assistant Session',
        messages: messages.map(m => ({ role: m.role, text: m.text }))
      });
      const shareId = response.data.share_id;
      setShareUrl(`${window.location.origin}/share/${shareId}`);
      setShowShareModal(true);
    } catch (err) {
      console.error('Error sharing chat:', err);
      alert('Failed to generate sharing link.');
    } finally {
      setSharing(false);
    }
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  const selectedDoc = documents.find((doc) => doc.id === selectedDocId);
  const selectedFilename = selectedDoc ? selectedDoc.filename : '';

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[480px]">
      
      {/* Left Area: PDF Viewer (shown side-by-side on large screens when a document is selected) */}
      {selectedDocId && (
        <div className="flex-1 flex flex-col bg-white dark:bg-[#0d0e12] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl h-full min-h-[400px] transition-colors duration-200">
          {/* PDF Viewer Header */}
          <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FiFileText className="text-purple-500 dark:text-purple-400 w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 truncate" title={selectedFilename}>
                Viewing: {selectedFilename || 'Document'}
              </span>
            </div>
            <button
              onClick={() => setSelectedDocId('')}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer shrink-0 font-semibold"
            >
              Close Viewer
            </button>
          </div>

          {/* PDF Content Frame */}
          <div className="flex-1 bg-gray-100 dark:bg-[#161821] relative flex items-center justify-center">
            {pdfLoading && (
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading PDF document...</span>
              </div>
            )}
            {pdfError && (
              <div className="text-xs text-red-500 dark:text-red-400 font-semibold p-4 text-center">
                {pdfError}
              </div>
            )}
            {!pdfLoading && !pdfError && pdfUrl && (
              <iframe
                src={`${pdfUrl}#page=${viewerPage}`}
                className="w-full h-full border-none rounded-b-2xl bg-white"
                title={selectedFilename}
              />
            )}
          </div>
        </div>
      )}

      {/* Center Area: Chat Panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0d0e12] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl transition-colors duration-200">
        
        {/* Chat Control Header */}
        <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <FiFilter className="text-purple-500 dark:text-purple-400 w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Context Scope</span>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold cursor-pointer max-w-xs truncate"
            >
              <option value="">Search All Documents</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Only: {doc.filename}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 relative">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-semibold border border-gray-200 dark:border-white/10 transition cursor-pointer"
            >
              <span>{showSources ? 'Hide Sources' : 'Show Sources'}</span>
            </button>

            {/* Export Dropdown Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={messages.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 rounded-xl text-xs font-semibold border border-gray-200 dark:border-white/10 transition cursor-pointer"
              >
                <FiDownload className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
              
              {showExportDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#0e0f14] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-zoomIn">
                  <button
                    onClick={() => { exportMarkdown(); setShowExportDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition"
                  >
                    Export as Markdown (.md)
                  </button>
                  <button
                    onClick={() => { exportTxt(); setShowExportDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition"
                  >
                    Export as Plain Text (.txt)
                  </button>
                  <button
                    onClick={() => { exportPdf(); setShowExportDropdown(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 transition"
                  >
                    Export as PDF (.pdf)
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={shareChatSession}
              disabled={messages.length === 0 || sharing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 disabled:opacity-30 rounded-xl text-xs font-semibold border border-gray-200 dark:border-white/10 transition cursor-pointer"
            >
              <FiShare2 className="w-3.5 h-3.5" />
              <span>{sharing ? 'Sharing...' : 'Share'}</span>
            </button>

            <button
              onClick={clearChat}
              disabled={messages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 disabled:opacity-30 rounded-xl text-xs font-semibold border border-red-500/20 transition cursor-pointer"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 flex items-center justify-center mb-3">
                <FiCpu className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">Interactive Research Agent</h4>
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
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 shrink-0">
                      <FiCpu className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed border ${
                      msg.role === 'user'
                        ? 'bg-purple-500/10 dark:bg-purple-600/10 border-purple-500/20 text-gray-800 dark:text-white rounded-br-none shadow-md'
                        : msg.isError
                        ? 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400 rounded-bl-none'
                        : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    <div className="markdown-content whitespace-pre-wrap">
                      {msg.text}
                    </div>
                    {msg.role === 'assistant' && msg.usage && (
                      <div className="mt-2 pt-2 border-t border-gray-200/30 dark:border-white/5 text-[10px] text-gray-400 dark:text-gray-500 flex flex-wrap justify-between items-center gap-2 font-mono">
                        <span className="flex items-center gap-1">
                          <FiCpu className="w-3 h-3 text-purple-400" />
                          <span>Tokens: {msg.usage.prompt_tokens} prompt / {msg.usage.completion_tokens} completion</span>
                        </span>
                        <span>Est. Cost: ${msg.usage.estimated_cost?.toFixed(6)}</span>
                      </div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
                      <FiUser className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400 shrink-0">
                    <FiCpu className="w-4 h-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-bl-none flex items-center gap-2">
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
        <form onSubmit={handleSend} className="p-4 bg-gray-50 dark:bg-white/[0.01] border-t border-gray-200 dark:border-white/5 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={selectedDocId ? "Ask about selected paper..." : "Ask a general research question..."}
            required
            className="flex-1 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
      {showSources && (
        <div className="w-full lg:w-80 flex flex-col bg-white dark:bg-[#0d0e12] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl shrink-0 transition-colors duration-200">
          <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 flex items-center gap-2">
            <FiInfo className="text-purple-500 dark:text-purple-400 w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">RAG Chunk References</h4>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {lastSources.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 py-12">
                <FiFileText className="w-10 h-10 mb-2 text-gray-400" />
                <p className="text-xs font-medium">No sources retrieved</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Ask a question to see document citations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lastSources.map((source, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.01] hover:bg-gray-100 dark:hover:bg-white/[0.02] transition"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-bold">
                        Chunk #{source.chunk_index}
                      </span>
                      {source.score !== undefined && (
                        <span className="px-1.5 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded text-[9px] font-bold">
                          {Math.round(source.score * 100)}% Match
                        </span>
                      )}
                      {source.page_number && (
                        <button
                          onClick={() => setViewerPage(source.page_number)}
                          className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 rounded text-[9px] font-bold cursor-pointer transition-colors duration-150"
                        >
                          Page {source.page_number}
                        </button>
                      )}
                      <span className="text-[10px] font-bold text-gray-400 truncate flex-1" title={source.filename}>
                        {source.filename}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-sans max-h-32 overflow-y-auto custom-scrollbar">
                      "{source.preview}..."
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Snapshot Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0e0f14] w-full max-w-md rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl p-6 space-y-4 animate-zoomIn">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">Share Chat Session</h4>
              <button 
                onClick={() => setShowShareModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Anyone with this link can view a read-only snapshot of this chat session.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
              />
              <button
                onClick={copyShareUrl}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-500/10"
              >
                <FiCopy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Chat;
