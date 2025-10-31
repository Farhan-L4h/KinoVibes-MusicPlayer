import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../public/music/uploads');
const albumArtDir = path.join(__dirname, '../public/album-art');
const lyricsDir = path.join(__dirname, '../public/lyrics');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(albumArtDir)) {
  fs.mkdirSync(albumArtDir, { recursive: true });
}
if (!fs.existsSync(lyricsDir)) {
  fs.mkdirSync(lyricsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, uploadsDir);
    } else if (file.fieldname === 'albumArt') {
      cb(null, albumArtDir);
    } else if (file.fieldname === 'lyrics') {
      cb(null, lyricsDir);
    }
  },
  filename: (req, file, cb) => {
    // Store the original filename temporarily, we'll rename after upload
    cb(null, `temp_${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      // Allow audio files
      const allowedAudioTypes = /mp3|wav|ogg|m4a|aac|flac/;
      const extname = allowedAudioTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype.startsWith('audio/');
      
      if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed!'));
      }
    } else if (file.fieldname === 'albumArt') {
      // Allow image files
      const allowedImageTypes = /jpg|jpeg|png|webp|gif/;
      const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = file.mimetype.startsWith('image/');
      
      if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'));
      }
    } else if (file.fieldname === 'lyrics') {
      // Allow lyrics files (.lrc, .txt, .json)
      const allowedLyricsTypes = /lrc|txt|json/;
      const extname = allowedLyricsTypes.test(path.extname(file.originalname).toLowerCase());
      
      if (extname) {
        cb(null, true);
      } else {
        cb(new Error('Only .lrc, .txt, or .json files are allowed for lyrics!'));
      }
    } else {
      cb(new Error('Invalid field name!'));
    }
  }
});

// Upload endpoint
app.post('/api/upload', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'albumArt', maxCount: 1 },
  { name: 'lyrics', maxCount: 1 }
]), (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    const response = {
      success: true,
      message: 'Files uploaded successfully',
      files: {}
    };

    // Rename audio file to the desired filename from client
    if (req.files.audio) {
      const tempPath = req.files.audio[0].path;
      const desiredFilename = req.body.audioFileName || req.files.audio[0].filename;
      const finalPath = path.join(uploadsDir, desiredFilename);
      
      // Rename file from temp name to desired name
      fs.renameSync(tempPath, finalPath);
      
      response.files.audio = {
        filename: desiredFilename,
        path: `/music/uploads/${desiredFilename}`,
        size: req.files.audio[0].size
      };
      console.log('✅ Audio file saved:', desiredFilename);
    }

    // Rename album art file to the desired filename from client
    if (req.files.albumArt) {
      const tempPath = req.files.albumArt[0].path;
      const desiredFilename = req.body.albumArtFileName || req.files.albumArt[0].filename;
      const finalPath = path.join(albumArtDir, desiredFilename);
      
      // Rename file from temp name to desired name
      fs.renameSync(tempPath, finalPath);
      
      response.files.albumArt = {
        filename: desiredFilename,
        path: `/album-art/${desiredFilename}`,
        size: req.files.albumArt[0].size
      };
      console.log('✅ Album art saved:', desiredFilename);
    }

    // Rename lyrics file to the desired filename from client
    if (req.files.lyrics) {
      const tempPath = req.files.lyrics[0].path;
      const desiredFilename = req.body.lyricsFileName || req.files.lyrics[0].filename;
      const finalPath = path.join(lyricsDir, desiredFilename);
      
      // Rename file from temp name to desired name
      fs.renameSync(tempPath, finalPath);
      
      response.files.lyrics = {
        filename: desiredFilename,
        path: `/lyrics/${desiredFilename}`,
        size: req.files.lyrics[0].size
      };
      console.log('✅ Lyrics file saved:', desiredFilename);
    }

    res.json(response);
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Delete file endpoint
app.delete('/api/files', (req, res) => {
  try {
    const { audioPath, albumArtPath, lyricsPath } = req.body;

    if (audioPath) {
      const fullPath = path.join(__dirname, '../public', audioPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('🗑️ Deleted audio file:', audioPath);
      }
    }

    if (albumArtPath) {
      const fullPath = path.join(__dirname, '../public', albumArtPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('🗑️ Deleted album art:', albumArtPath);
      }
    }

    if (lyricsPath) {
      const fullPath = path.join(__dirname, '../public', lyricsPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('🗑️ Deleted lyrics file:', lyricsPath);
      }
    }

    res.json({
      success: true,
      message: 'Files deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'KinoVibes Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 KinoVibes Backend API Server');
  console.log('================================');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${uploadsDir}`);
  console.log(`🖼️  Album art directory: ${albumArtDir}`);
  console.log(`📝 Lyrics directory: ${lyricsDir}`);
  console.log('================================');
  console.log('Available endpoints:');
  console.log(`  POST   /api/upload    - Upload music files (audio, album art, lyrics)`);
  console.log(`  DELETE /api/files     - Delete music files`);
  console.log(`  GET    /api/health    - Health check`);
  console.log('================================\n');
});
