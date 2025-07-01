# Irys File Share

A decentralized file sharing application by JuniorEfik built with Node.js (Express) for the backend and Vite (vanilla JS) for the frontend. Easily upload files to the decentralized web and share them instantly.

## Features
- Upload files (up to 100MB) to the decentralized Irys network
- Share files via unique links or IDs
- Download files using share links or IDs
- Modern, responsive frontend UI

## Project Structure
```
irys/
  backend/    # Node.js Express backend
  frontend/   # Vite-powered frontend
```

## Prerequisites
- Node.js (v16 or higher recommended)
- npm

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/JuniorEfik/irys.git
cd irys
```

### 2. Backend Setup
```bash
cd backend
npm install
# Start the backend server (default: http://localhost:3001)
node server.js 
# Or to Run backend server in dev mode
npm run dev
```

#### Environment Variables (Not optional for private key which must be adequately funded with as little as $3 on base ETH network)
You can create a `.env` file in the `backend/` directory to override defaults:
```
PRIVATE_KEY="0x........"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Start the frontend dev server (default: http://localhost:5173)
npm run dev
```

The frontend is configured to proxy API requests to the backend during development.

## Usage
- Open your browser at [http://localhost:5173](http://localhost:5173)
- Upload a file and share the generated link or ID
- Download files using a share link or ID

## API Endpoints
- `POST /api/upload` — Upload a file
- `GET /api/file/:shareId` — Get file info by share ID
- `GET /api/download/:shareId` — Download file (redirects to Irys gateway)
- `GET /api/health` — Health check

## Notes
- Uploaded files are stored on the Irys decentralized network
- File metadata is kept in-memory (for demo purposes)
- For production, use a persistent database and secure environment variables

## License
MIT 