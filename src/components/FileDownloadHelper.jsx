import React, { useState, useEffect } from 'react';
import { getPendingFiles, clearPendingFiles } from '../services/musicApi';
import { Download, X, CheckCircle } from 'lucide-react';

const FileDownloadHelper = () => {
  const [pendingFiles, setPendingFiles] = useState({ audioFiles: [], albumArtFiles: [], total: 0 });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkPendingFiles();
  }, []);

  const checkPendingFiles = () => {
    const files = getPendingFiles();
    setPendingFiles(files);
    if (files.total > 0) {
      setIsOpen(true);
    }
  };

  const downloadFile = (file, type) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = () => {
    [...pendingFiles.audioFiles, ...pendingFiles.albumArtFiles].forEach((file, index) => {
      setTimeout(() => {
        downloadFile(file, file.type);
      }, index * 500); // Delay to avoid browser blocking
    });
  };

  const handleClear = () => {
    if (confirm('Are you sure? This will clear the pending files list.')) {
      clearPendingFiles();
      setPendingFiles({ audioFiles: [], albumArtFiles: [], total: 0 });
      setIsOpen(false);
    }
  };

  if (pendingFiles.total === 0) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-40 bg-white text-black px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 animate-pulse"
        >
          <Download className="w-5 h-5" />
          <span className="font-semibold">{pendingFiles.total} files pending</span>
        </button>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="retro-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-600">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Download className="w-6 h-6" />
                  Pending Files to Save
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Download these files and save them to the correct folders
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-300 mb-2">⚠️ Important Instructions:</h3>
              <ol className="text-sm text-yellow-200 space-y-1 list-decimal list-inside">
                <li>Click "Download All" to download files</li>
                <li>Audio files → Save to: <code className="bg-black px-1 rounded">public/music/uploads/</code></li>
                <li>Album art → Save to: <code className="bg-black px-1 rounded">public/album-art/</code></li>
                <li>Keep the exact filename when saving</li>
                <li>Refresh the page after saving all files</li>
              </ol>
            </div>

            {/* Audio Files */}
            {pendingFiles.audioFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  🎵 Audio Files ({pendingFiles.audioFiles.length})
                </h3>
                <div className="space-y-2">
                  {pendingFiles.audioFiles.map((file, index) => (
                    <div key={index} className="bg-black bg-opacity-30 rounded-lg p-3 flex items-center justify-between border border-gray-600">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{file.fileName}</p>
                        <p className="text-gray-400 text-xs">
                          {file.originalName} • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Save to: <code className="bg-black px-1 rounded">public/music/uploads/{file.fileName}</code>
                        </p>
                      </div>
                      <button
                        onClick={() => downloadFile(file, 'audio')}
                        className="ml-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Album Art Files */}
            {pendingFiles.albumArtFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  🖼️ Album Art ({pendingFiles.albumArtFiles.length})
                </h3>
                <div className="space-y-2">
                  {pendingFiles.albumArtFiles.map((file, index) => (
                    <div key={index} className="bg-black bg-opacity-30 rounded-lg p-3 flex items-center justify-between border border-gray-600">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{file.fileName}</p>
                        <p className="text-gray-400 text-xs">
                          {file.originalName} • {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Save to: <code className="bg-black px-1 rounded">public/album-art/{file.fileName}</code>
                        </p>
                      </div>
                      <button
                        onClick={() => downloadFile(file, 'image')}
                        className="ml-4 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-600">
              <button
                onClick={downloadAll}
                className="flex-1 retro-button py-3"
              >
                <Download className="w-5 h-5 mr-2" />
                Download All Files
              </button>
              <button
                onClick={handleClear}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                Clear List
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileDownloadHelper;
