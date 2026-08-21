# AI Research Assistant

A full-stack research assistant application that allows users to upload documents, create vector embeddings, and ask questions against uploaded PDFs. The backend is built with FastAPI, FAISS, and Gemini AI, while the frontend is a React + Vite application.

## 🚀 Project Overview

This repository contains two main folders:

- `Backend/` - FastAPI backend for authentication, document upload, text extraction, vector embedding, retrieval, and GPT-style question answering.
- `frontned/` - React frontend built with Vite, Tailwind CSS, and Axios for consuming the API.

## 🔧 Key Features

- User registration and login with JWT authentication
- PDF upload and text extraction
- Document chunking for vector retrieval
- Sentence-transformer embeddings with FAISS vector search (with clamped cosine similarity confidence scores)
- Gemini API powered answer generation using uploaded document context with token & estimated cost tracking
- Database-backed query analytics and cumulative statistics dashboard (Total Queries & Est. LLM Cost)
- Document listing, preview, and chunk metadata retrieval
- Simple, CORS-enabled backend for browser-based frontend usage

## 📁 Repository Structure

```
Backend/
  main.py
  metadata.json
  requirements.txt
  app/
    api/
      auth.py
      chat.py
      document.py
    auth/
      dependencies.py
      jwt_handler.py
      security.py
    database/
      base.py
      database.py
      init_db.py
    models/
      document_chunk.py
      document.py
      user.py
    rag/
      vector_store.py
    schemas/
      chat.py
      user_schema.py
    services/
      chunk_service.py
      embedding_service.py
      llm_service.py
      pdf_service.py
      retrieval_service.py
frontned/
  package.json
  public/
  src/
    App.jsx
    main.jsx
    pages/
      Chat.jsx
      Dashboard.jsx
      Documents.jsx
      Login.jsx
      Register.jsx
    components/
      ProtectedRoute.jsx
    context/
      AuthContext.jsx
```

## ⚙️ Backend Setup

### Requirements

- Python 3.11+ (recommended)
- `pip`

### Install dependencies

```bash
cd Backend
python -m pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file inside `Backend/` with the following values:

```dotenv
SECRET_KEY=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=sqlite:///./ai_research_assistant.db
```

- `SECRET_KEY`: used to sign JWT tokens.
- `GEMINI_API_KEY`: required for the Gemini AI answer generation service.
- `DATABASE_URL`: optional. The backend falls back to SQLite if unset.

### Initialize the database

```bash
cd Backend
python -m app.database.init_db
```

### Start the backend

```bash
cd Backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```


## 🌐 Frontend Setup

### Requirements

- Node.js 18+ and npm

### Install dependencies

```bash
cd frontned
npm install
```

### Start the frontend

```bash
cd frontned
npm run dev
```

The frontend will typically be available at `http://localhost:5173`.

## 🧩 API Endpoints

### Authentication

- `POST /auth/register`
  - Request body: `username`, `email`, `password`
  - Registers a new user.

- `POST /auth/login`
  - Request body: `email`, `password`
  - Returns `access_token`.

- `GET /auth/me`
  - Requires `Authorization: Bearer <token>`
  - Returns current user profile.

### Document Management

- `POST /documents/upload`
  - Requires authenticated user.
  - Upload a PDF file and create chunks + embeddings.

- `GET /documents/`
  - Returns all documents uploaded by the user.

- `GET /documents/{document_id}`
  - Returns filename and text preview for a document.

- `GET /documents/{document_id}/chunks`
  - Returns chunk count and chunk previews.

- `GET /documents/faiss-stats`
  - Returns the number of stored vector records for the user.

### Chat / Question Answering

- `POST /chat/ask`
  - Requires authenticated user.
  - Request body: `question`, optional `document_id`
  - Returns a generated answer, source previews (including confidence scores), and query token/cost usage metadata.

- `GET /chat/analytics`
  - Requires authenticated user.
  - Returns aggregated usage analytics for the user (total queries, total prompt/completion tokens, and total estimated API cost).

## 🧠 Backend Components

### `Backend/app/api`

- `auth.py` - user registration, login, and profile retrieval.
- `document.py` - handles PDF upload, document storage, chunk creation, and retrieval.
- `chat.py` - queries the vector DB and generates answers with Gemini.

### `Backend/app/services`

- `pdf_service.py` - extracts text from PDF files.
- `chunk_service.py` - splits text into meaningful chunks.
- `embedding_service.py` - creates vector embeddings using `sentence-transformers`.
- `llm_service.py` - sends the question and retrieved context to Gemini.
- `retrieval_service.py` - performs nearest-neighbor search in FAISS.

### `Backend/app/rag/vector_store.py`

- Manages FAISS index and metadata persistence.
- Saves `faiss_index.bin` and `metadata.json` in the backend root.

## 🧪 Notes

- The repository uses `sqlite:///./ai_research_assistant.db` by default when `DATABASE_URL` is not provided.
- Uploaded files are stored in `Backend/uploads/`.
- The FAISS index is persisted to `Backend/faiss_index.bin` and metadata to `Backend/metadata.json`.
- Gemini AI access requires a valid API key and network connectivity.

## 📌 Useful Commands

```bash
# Backend
cd Backend
uvicorn main:app --reload

# Frontend
cd frontned
npm run dev
```

## 📝 Recommendations

- Use a strong `SECRET_KEY` in production.
- Keep `.env` private and never commit sensitive keys.
- If you add more models or change vector dimensions, update `Backend/app/rag/vector_store.py` accordingly.

## 💡 Troubleshooting

- `GEMINI_API_KEY not set`: verify `.env` path and variable name.
- `Database not found`: run `python -m app.database.init_db`.
- `CORS error`: ensure backend is running and allow origins are configured.

## 📚 Dependencies

- Backend: FastAPI, Uvicorn, SQLAlchemy, PyMuPDF, FAISS, SentenceTransformers, Gemini API client, python-jose, bcrypt
- Frontend: React, React Router DOM, Tailwind CSS, Axios

## 🧑‍💻 License

This repository does not include an explicit license file. Add one if you want to share or publish the project.
