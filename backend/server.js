// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const IrysService = require('./services/irys.service');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://your-domain.com', 'https://www.your-domain.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// In-memory store for file metadata (in production, use a database)
const fileStore = new Map();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Irys File Share API is running' });
});

// Upload file to Irys
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;
    const mimeType = req.file.mimetype;

    console.log(`Uploading file: ${originalName} (${fileSize} bytes)`);

    // Upload to Irys
    const irysService = new IrysService();
    const uploadResult = await irysService.uploadFile(filePath, {
      filename: originalName,
      contentType: mimeType
    });

    // Store metadata
    const shareId = uuidv4();
    fileStore.set(shareId, {
      irysId: uploadResult.id,
      originalName: originalName,
      fileSize: fileSize,
      mimeType: mimeType,
      uploadDate: new Date().toISOString(),
      downloadUrl: `https://gateway.irys.xyz/${uploadResult.id}`
    });

    // Clean up local file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      shareId: shareId,
      downloadUrl: `${req.protocol}://${req.get('host')}/api/download/${shareId}`,
      irysUrl: `https://gateway.irys.xyz/${uploadResult.id}`,
      fileInfo: {
        name: originalName,
        size: fileSize,
        type: mimeType
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
});

// Get file info
app.get('/api/file/:shareId', (req, res) => {
  const { shareId } = req.params;
  const fileInfo = fileStore.get(shareId);
  
  if (!fileInfo) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.json({
    success: true,
    file: {
      name: fileInfo.originalName,
      size: fileInfo.fileSize,
      type: fileInfo.mimeType,
      uploadDate: fileInfo.uploadDate,
      downloadUrl: fileInfo.downloadUrl
    }
  });
});

// Download file (redirect to Irys gateway)
app.get('/api/download/:shareId', (req, res) => {
  const { shareId } = req.params;
  const fileInfo = fileStore.get(shareId);
  
  if (!fileInfo) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Redirect to Irys gateway with proper headers
  res.redirect(fileInfo.downloadUrl);
});

// List recent uploads (for debugging)
app.get('/api/files', (req, res) => {
  const files = Array.from(fileStore.entries()).map(([shareId, fileInfo]) => ({
    shareId,
    ...fileInfo
  }));
  
  res.json({ files });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: error.message 
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});