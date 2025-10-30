# User Uploaded Music Files

This folder will contain music files uploaded by users.

## File Naming Convention:

Files are automatically named: `{userId}_{timestamp}_{originalFilename}`

Example: `abc123_1730312345678_my-song.mp3`

## Important Notes:

⚠️ **Current Implementation Limitation:**

In the current browser-only implementation, uploaded files are stored temporarily in the browser. 
To make uploads persistent, files need to be manually saved to this folder.

## For Production:

To enable automatic file uploads, you need to:

1. Create a backend API (Node.js, Python, PHP, etc.)
2. Add an upload endpoint that receives files and saves them to this folder
3. Update the `uploadMusic` function in `src/services/musicApi.js` to call your API

Example backend endpoint:
```javascript
// Express.js example
app.post('/api/upload-music', upload.single('audio'), (req, res) => {
  // File is saved to public/music/uploads/
  res.json({ path: req.file.path });
});
```

## Manual Upload Process (Current):

1. User uploads file through UI
2. Metadata is saved to Firestore
3. File is saved to browser's temporary storage
4. Check console for file information
5. Manually save the file to this folder with the correct name
