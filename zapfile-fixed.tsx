import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Share2, Smartphone, Copy, Check, Moon, Sun } from 'lucide-react';

const ZapFile = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Generate QR Code (more realistic implementation)
  const generateQRCode = (text) => {
    // Create a more realistic QR code pattern
    // In production, you'd use a library like qrcode.js
    const size = 25; // 25x25 grid
    const cellSize = 8;
    const totalSize = size * cellSize;
    
    // Create a pseudo-random but deterministic pattern based on the text
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    let pattern = [];
    for (let i = 0; i < size * size; i++) {
      // Use hash to create deterministic "random" pattern
      const seed = (hash + i * 7) % 1000;
      pattern.push(seed % 3 !== 0); // Roughly 2/3 chance of being black
    }
    
    // Ensure corner squares (position markers) are present
    const cornerMarkers = [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
      [0, 1], [6, 1], [0, 2], [2, 2], [3, 2], [4, 2], [6, 2],
      [0, 3], [2, 3], [4, 3], [6, 3], [0, 4], [2, 4], [4, 4], [6, 4],
      [0, 5], [6, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
      
      // Top right corner
      [18, 0], [19, 0], [20, 0], [21, 0], [22, 0], [23, 0], [24, 0],
      [18, 1], [24, 1], [18, 2], [20, 2], [21, 2], [22, 2], [24, 2],
      [18, 3], [20, 3], [22, 3], [24, 3], [18, 4], [20, 4], [22, 4], [24, 4],
      [18, 5], [24, 5], [18, 6], [19, 6], [20, 6], [21, 6], [22, 6], [23, 6], [24, 6],
      
      // Bottom left corner
      [0, 18], [1, 18], [2, 18], [3, 18], [4, 18], [5, 18], [6, 18],
      [0, 19], [6, 19], [0, 20], [2, 20], [3, 20], [4, 20], [6, 20],
      [0, 21], [2, 21], [4, 21], [6, 21], [0, 22], [2, 22], [4, 22], [6, 22],
      [0, 23], [6, 23], [0, 24], [1, 24], [2, 24], [3, 24], [4, 24], [5, 24], [6, 24]
    ];
    
    cornerMarkers.forEach(([x, y]) => {
      if (x < size && y < size) {
        pattern[y * size + x] = true;
      }
    });
    
    let rects = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (pattern[y * size + x]) {
          rects += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="black"/>`;
        }
      }
    }
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${totalSize}" height="${totalSize}" fill="white"/>
        ${rects}
      </svg>
    `)}`;
  };

  // Handle file upload simulation
  const handleFileUpload = useCallback((file) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsUploading(false);
          
          // Generate share link and QR code
          const linkId = Math.random().toString(36).substr(2, 8);
          const link = `https://zapfile.vercel.app/${linkId}`;
          setShareLink(link);
          setQrCode(generateQRCode(link));
          setShowSuccess(true);
          
          setTimeout(() => setShowSuccess(false), 3000);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    setUploadedFile(file);
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // File input change handler
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const themeClasses = isDarkMode 
    ? 'bg-gradient-to-br from-gray-900 via-black to-yellow-900/20 text-white'
    : 'bg-gradient-to-br from-yellow-50 via-white to-amber-50 text-gray-900';

  return (
    <div className={`min-h-screen transition-all duration-500 ${themeClasses}`}>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-3 rounded-lg shadow-xl shadow-yellow-500/50 transform animate-bounce border-2 border-yellow-300">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Check className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping"></div>
            </div>
            <span className="font-bold">⚡ File uploaded at lightning speed! ⚡</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-amber-600/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-1/3 w-1 h-1 bg-yellow-300 rounded-full animate-ping"></div>
          <div className="absolute top-12 left-2/3 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse delay-300"></div>
          <div className="absolute top-6 right-1/4 w-1 h-1 bg-yellow-500 rounded-full animate-ping delay-700"></div>
        </div>
        <div className="relative container mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/25 animate-pulse">
                <div className="relative">
                  <Share2 className="w-7 h-7 text-black" />
                  <div className="absolute -top-1 -right-1 w-3 h-3">
                    <div className="w-full h-full bg-yellow-300 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 w-full h-full bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent animate-pulse">
                  ⚡ ZapFile
                </h1>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-400/80' : 'text-amber-600'}`}>
                  ⚡ Lightning-fast file sharing ⚡
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-12 ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-yellow-900/50 text-yellow-400 border border-yellow-500/30' 
                  : 'bg-white hover:bg-yellow-50 text-amber-600 shadow-md border border-amber-200'
              }`}
            >
              {isDarkMode ? (
                <div className="relative">
                  <Sun className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Upload Section */}
          <div className={`p-8 rounded-2xl shadow-2xl backdrop-blur-sm border transition-all duration-300 relative overflow-hidden ${
            isDarkMode 
              ? 'bg-gray-800/50 border-yellow-500/20 hover:bg-gray-800/70 hover:border-yellow-400/30' 
              : 'bg-white/90 border-amber-200 hover:bg-white/95 hover:border-amber-300'
          }`}>
            {/* Lightning effect overlay */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
              <div className="text-6xl text-yellow-400 animate-pulse">⚡</div>
            </div>
            
            <div className="text-center mb-6 relative">
              <div className="relative inline-block">
                <Upload className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4">
                  <div className="w-full h-full bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                  <div className="absolute inset-0 w-full h-full bg-yellow-500 rounded-full opacity-50"></div>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                ⚡ Send Files
              </h2>
              <p className={`${isDarkMode ? 'text-yellow-400/80' : 'text-amber-600'}`}>
                Drop files for lightning-fast sharing
              </p>
            </div>

            {/* Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden ${
                dragActive 
                  ? 'border-yellow-400 bg-yellow-500/20 scale-105 shadow-lg shadow-yellow-500/25' 
                  : isDarkMode 
                    ? 'border-yellow-600/50 hover:border-yellow-500/70 hover:bg-yellow-900/20' 
                    : 'border-amber-300 hover:border-amber-400 hover:bg-amber-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {/* Lightning bolts decoration */}
              <div className="absolute top-2 left-4 text-yellow-400/30 text-lg animate-pulse">⚡</div>
              <div className="absolute bottom-2 right-4 text-yellow-400/30 text-lg animate-pulse delay-500">⚡</div>
              
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <div className="space-y-4 relative">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center relative ${
                  dragActive ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50' : isDarkMode ? 'bg-gray-700/50 border border-yellow-500/30' : 'bg-amber-100 border border-amber-300'
                }`}>
                  <Upload className={`w-8 h-8 ${dragActive ? 'text-black' : 'text-yellow-500'}`} />
                  {dragActive && (
                    <div className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-50"></div>
                  )}
                </div>
                
                <div>
                  <p className="text-lg font-medium mb-2 flex items-center justify-center gap-2">
                    ⚡ Drop your files here ⚡
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-yellow-400/70' : 'text-amber-600'}`}>
                    or click to browse • Lightning speed guaranteed
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <span className="animate-spin">⚡</span>
                    Uploading at lightning speed...
                  </span>
                  <span className="text-sm text-yellow-500 font-bold">{Math.round(uploadProgress)}%</span>
                </div>
                <div className={`w-full rounded-full h-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 transition-all duration-300 ease-out relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {/* File Info */}
            {uploadedFile && !isUploading && (
              <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-lg flex items-center justify-center shadow-md">
                    <Upload className="w-5 h-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium truncate flex items-center gap-1">
                      ⚡ {uploadedFile.name}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-yellow-400/80' : 'text-amber-600'}`}>
                      {formatFileSize(uploadedFile.size)} • Ready to share!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share Section */}
          <div className={`p-8 rounded-2xl shadow-2xl backdrop-blur-sm border transition-all duration-300 relative overflow-hidden ${
            isDarkMode 
              ? 'bg-gray-800/50 border-yellow-500/20 hover:bg-gray-800/70 hover:border-yellow-400/30' 
              : 'bg-white/90 border-amber-200 hover:bg-white/95 hover:border-amber-300'
          }`}>
            {/* Lightning decorations */}
            <div className="absolute top-0 left-0 w-16 h-16 opacity-10">
              <div className="text-4xl text-yellow-400 animate-pulse delay-300">⚡</div>
            </div>
            
            <div className="text-center mb-6 relative">
              <div className="relative inline-block">
                <Smartphone className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4">
                  <div className="w-full h-full bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                ⚡ Share & Download
              </h2>
              <p className={`${isDarkMode ? 'text-yellow-400/80' : 'text-amber-600'}`}>
                QR code and link for instant sharing
              </p>
            </div>

            {shareLink ? (
              <div className="space-y-6">
                {/* QR Code */}
                <div className="text-center">
                  <div className="inline-block p-4 bg-white rounded-xl shadow-lg border-4 border-yellow-400/50 relative">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                    <div className="absolute -top-2 -right-2 text-2xl animate-bounce">⚡</div>
                    <div className="absolute -bottom-2 -left-2 text-xl animate-pulse delay-500">⚡</div>
                  </div>
                  <p className={`mt-3 text-sm ${isDarkMode ? 'text-yellow-400/80' : 'text-amber-600'} flex items-center justify-center gap-1`}>
                    <span className="animate-pulse">⚡</span>
                    Scan for lightning-fast mobile download
                    <span className="animate-pulse delay-300">⚡</span>
                  </p>
                </div>

                {/* Share Link */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium flex items-center gap-1">
                    <span className="text-yellow-500">⚡</span>
                    Lightning Share Link
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={shareLink}
                      className={`flex-1 px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700/50 border-yellow-600/50 text-white focus:border-yellow-400' 
                          : 'bg-white border-amber-300 text-gray-900 focus:border-amber-400'
                      }`}
                    />
                    <button
                      onClick={copyToClipboard}
                      className={`px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-1 ${
                        copied 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/25' 
                          : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-medium shadow-lg shadow-yellow-500/25'
                      }`}
                    >
                      {copied ? <Check className="w-5 h-5" /> : (
                        <>
                          <Copy className="w-5 h-5" />
                          <span className="hidden sm:inline">⚡</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Download Button */}
                <button className="w-full py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-700 text-black font-bold rounded-lg transition-all duration-300 hover:scale-105 shadow-xl shadow-yellow-500/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
                  <div className="flex items-center justify-center space-x-2 relative">
                    <Download className="w-5 h-5" />
                    <span>⚡ Download File ⚡</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className={`text-center py-12 ${isDarkMode ? 'text-yellow-500/50' : 'text-amber-400/70'}`}>
                <div className="relative inline-block">
                  <Share2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <div className="absolute top-0 right-0 text-2xl animate-ping opacity-30">⚡</div>
                </div>
                <p className="flex items-center justify-center gap-2">
                  <span>Upload a file to generate</span>
                  <span className="animate-pulse">⚡</span>
                  <span>lightning share link</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-6xl text-yellow-400/10 animate-pulse">⚡</div>
          <h3 className="text-3xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent relative">
            ⚡ Why Choose ZapFile? ⚡
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: '⚡', title: 'Lightning Fast', desc: 'Blazing-fast file transfers with zero delays', gradient: 'from-yellow-400 to-amber-500' },
              { icon: '🔒', title: 'Thunder Secure', desc: 'Military-grade encryption with lightning protection', gradient: 'from-amber-400 to-yellow-600' },
              { icon: '📱', title: 'Storm Compatible', desc: 'Works like lightning across all devices', gradient: 'from-yellow-500 to-amber-400' }
            ].map((feature, index) => (
              <div 
                key={index}
                className={`p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border relative overflow-hidden ${
                  isDarkMode 
                    ? 'bg-gray-800/40 border-yellow-500/20 hover:border-yellow-400/40 hover:bg-gray-800/60' 
                    : 'bg-white/70 border-amber-200 hover:border-amber-400 hover:bg-white/90'
                }`}
              >
                {/* Lightning decoration */}
                <div className="absolute top-2 right-2 text-yellow-400/20 text-sm animate-pulse">⚡</div>
                
                <div className="text-5xl mb-4 animate-bounce" style={{ animationDelay: `${index * 200}ms` }}>
                  {feature.icon}
                </div>
                <h4 className={`text-lg font-bold mb-2 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                  {feature.title}
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-yellow-400/80' : 'text-amber-600'}`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`mt-16 py-8 text-center border-t ${
        isDarkMode 
          ? 'text-yellow-400/60 border-yellow-500/20' 
          : 'text-amber-600/80 border-amber-200'
      }`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="animate-pulse">⚡</span>
          <p className="font-medium">© 2025 ZapFile. Built for lightning-fast file sharing.</p>
          <span className="animate-pulse delay-500">⚡</span>
        </div>
        <p className={`text-xs ${isDarkMode ? 'text-yellow-500/40' : 'text-amber-500/60'}`}>
          Powered by thunder and lightning ⚡
        </p>
      </footer>
    </div>
  );
};

export default ZapFile;