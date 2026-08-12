import React, { useState, useEffect, useRef } from 'react';
import { api } from '../context/AuthContext';
import { FiUploadCloud, FiFileText, FiEye, FiCheck, FiAlertCircle, FiX, FiLayers } from 'react-icons/fi';

const Documents = ({ onUploadSuccess }) => {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  // Upload States
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Inspector Modal States
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docDetails, setDocDetails] = useState(null);
  const [docChunks, setDocChunks] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await api.get('/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Upload file to Backend
  const uploadFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported for extraction and indexing.');
      return;
    }

    setUploadError('');
    setUploading(true);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess(true);
      if (onUploadSuccess) onUploadSuccess();
      fetchDocuments();
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading file:', error);
      const msg = error.response?.data?.detail || 'Failed to upload and process the document. Check file and try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  // View Document Details in Modal
  const inspectDocument = async (doc) => {
    setSelectedDoc(doc);
    setLoadingDetails(true);
    setDocDetails(null);
    setDocChunks(null);

    try {
      const detailsRes = await api.get(`/documents/${doc.id}`);
      const chunksRes = await api.get(`/documents/${doc.id}/chunks`);
      
      setDocDetails(detailsRes.data);
      setDocChunks(chunksRes.data);
    } catch (error) {
      console.error('Error inspecting document:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upload Box */}
      <section className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md">
        <h3 className="text-lg font-bold text-white mb-4">Upload Research Paper</h3>
        
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[180px] ${
            dragActive
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.01]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-4 text-purple-400">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Extracting text & creating embeddings...</p>
                <p className="text-xs text-gray-500 mt-1">This will update the FAISS vector database</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-full bg-white/[0.02] border border-white/5 inline-block text-gray-400">
                <FiUploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Drag & drop your PDF here, or <span className="text-purple-400 hover:text-purple-300">browse</span></p>
                <p className="text-xs text-gray-500 mt-1">Only PDF format supported (max 10MB)</p>
              </div>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
            <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2.5">
            <FiCheck className="w-5 h-5" />
            <span>Document uploaded, partitioned, and FAISS database updated!</span>
          </div>
        )}
      </section>

      {/* Documents List */}
      <section className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md">
        <h3 className="text-lg font-bold text-white mb-4">Your Documents</h3>

        {loadingDocs ? (
          <div className="flex flex-col items-center py-12 text-gray-500">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-xs font-medium">Fetching documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-white/5 rounded-xl bg-white/[0.01]">
            <FiFileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-sm font-medium">No documents in your workspace</p>
            <p className="text-xs text-gray-600 mt-1">Upload a PDF paper above to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">Document Title</th>
                  <th className="p-4 w-40 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        <FiFileText className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-white truncate max-w-lg">{doc.filename}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => inspectDocument(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 hover:text-white rounded-lg text-xs font-medium border border-white/10 transition cursor-pointer"
                      >
                        <FiEye className="w-4 h-4" />
                        <span>Inspect Chunks</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Inspector Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0e0f14] w-full max-w-4xl max-h-[85vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-zoomIn">
            
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FiLayers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white max-w-xl truncate">{selectedDoc.filename}</h4>
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">RAG Vector Data Inspector</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm font-semibold">Extracting vector database chunks...</p>
                </div>
              ) : (
                <>
                  {/* Extracted Preview */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Document Content Preview</h5>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 max-h-48 overflow-y-auto text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
                      {docDetails?.text_preview || 'No text extracted.'}
                    </div>
                  </div>

                  {/* Chunks List */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Database Partition Chunks</h5>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-full">
                        {docChunks?.total_chunks || 0} Chunks Created
                      </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {docChunks?.chunks?.map((chunk) => (
                        <div
                          key={chunk.index}
                          className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] hover:border-white/10 transition flex gap-4"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                            #{chunk.index + 1}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Index #{chunk.index}</p>
                            <p className="text-sm text-gray-300 leading-relaxed font-sans">{chunk.preview}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-[#0a0b0d] flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] text-white font-medium rounded-xl text-sm border border-white/10 transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Documents;
