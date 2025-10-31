# Backend API untuk File Upload (Optional)

Folder ini untuk backend API jika ingin menambahkan automatic file upload.

## Quick Start dengan Express.js

### 1. Install Dependencies
```bash
npm init -y
npm install express multer cors dotenv
```

### 2. Create server.js
```javascript
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'audio' 
      ? path.join(__dirname, '../public/music/uploads')
      : path.join(__dirname, '../public/album-art');
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const userId = req.body.userId;
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${userId}_${timestamp}_${sanitized}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB for audio
  }
});

// Upload endpoint
app.post('/api/upload-music', 
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'albumArt', maxCount: 1 }
  ]), 
  (req, res) => {
    try {
      const audioFile = req.files.audio ? req.files.audio[0] : null;
      const albumArtFile = req.files.albumArt ? req.files.albumArt[0] : null;
      
      const response = {
        success: true,
        audioPath: audioFile ? `/music/uploads/${audioFile.filename}` : null,
        albumArtPath: albumArtFile ? `/album-art/${albumArtFile.filename}` : null,
        audioFileName: audioFile ? audioFile.filename : null,
        albumArtFileName: albumArtFile ? albumArtFile.filename : null
      };
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Delete file endpoint
app.delete('/api/delete-file', (req, res) => {
  const { filePath } = req.body;
  const fullPath = path.join(__dirname, '../public', filePath);
  
  fs.unlink(fullPath, (err) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### 3. Update Frontend
Edit `src/services/musicApi.js`:

```javascript
const saveFileLocally = async (file, fileName, type) => {
  const formData = new FormData();
  formData.append(type === 'audio' ? 'audio' : 'albumArt', file);
  formData.append('userId', userId);
  
  const response = await fetch('http://localhost:3001/api/upload-music', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result;
};
```

### 4. Run Server
```bash
node server.js
```

## Alternative: Python/Flask

```python
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)

@app.route('/api/upload-music', methods=['POST'])
def upload_music():
    audio = request.files.get('audio')
    album_art = request.files.get('albumArt')
    user_id = request.form.get('userId')
    
    # Save files
    # ... implementation
    
    return jsonify({
        'success': True,
        'audioPath': f'/music/uploads/{audio_filename}',
        'albumArtPath': f'/album-art/{art_filename}'
    })

if __name__ == '__main__':
    app.run(port=3001)
```

## Deployment

### Heroku
```bash
heroku create kinovibes-api
git push heroku main
```

### Railway
```bash
railway init
railway up
```

### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```
