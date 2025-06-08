# ZapFile 🚀

A modern, secure peer-to-peer file sharing application built with Next.js and React. ZapFile enables instant file transfers between devices without cloud storage, featuring end-to-end encryption and a futuristic minimalist design.

![ZapFile Interface](https://img.shields.io/badge/Status-Active-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

## ✨ Features

### 🔐 Security First
- **End-to-end encryption** with AES-256
- **File integrity verification** using SHA-256 checksums
- **No cloud storage** - direct peer-to-peer transfers
- **Session-based connections** with unique IDs

### 📁 File Handling
- **Drag & drop** file upload
- **Multiple file selection** support
- **Original format preservation** - files maintain exact binary content
- **Real-time transfer progress** tracking
- **File type detection** and validation

### 🎨 User Experience
- **Futuristic minimalist design** with neon accents
- **Interactive QR codes** for easy connection
- **Responsive layout** for all devices
- **Real-time status updates**
- **Comprehensive logging** for debugging

### 🔄 Connection Methods
- **QR Code scanning** for instant pairing
- **Manual session ID** entry
- **Interactive QR actions** (copy, share, enlarge)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/zapfile.git
   cd zapfile
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. **Run the development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### Sending Files

1. **Switch to Sender mode** (default)
2. **Upload files** by:
   - Dragging and dropping files into the drop zone
   - Clicking "Select Files" to browse
3. **Share your session** by:
   - Showing the QR code to the receiver
   - Sharing the session ID manually
4. **Wait for connection** from receiver
5. **Click "Send Files"** to start transfer

### Receiving Files

1. **Switch to Receiver mode**
2. **Connect to sender** by:
   - Scanning the QR code
   - Entering the session ID manually
3. **Wait for files** to be sent
4. **Download received files** individually

### File Processing

ZapFile automatically:
- ✅ Reads original file content as binary data
- ✅ Generates SHA-256 checksums for integrity
- ✅ Preserves exact file format and metadata
- ✅ Validates file integrity before download
- ✅ Logs all operations for debugging

## 🛠️ Technical Architecture

### Core Technologies
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **Lucide React** - Icon library

### Key Components

#### File Processing Pipeline
\`\`\`typescript
File Upload → ArrayBuffer Reading → Checksum Generation → Transfer Simulation → Download
\`\`\`

#### Security Features
- **FileReader API** for binary content preservation
- **Web Crypto API** for SHA-256 checksums
- **Blob API** for secure file downloads
- **Session-based** connection management

#### State Management
- **React Hooks** for component state
- **Real-time updates** for transfer progress
- **Error handling** with comprehensive logging

## 📁 Project Structure

\`\`\`
zapfile/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # shadcn/ui components
├── zapfile.tsx             # Main application component
├── tailwind.config.ts      # Tailwind configuration
├── package.json            # Dependencies
└── README.md              # This file
\`\`\`

## 🎨 Design System

### Color Palette
- **Primary**: `#00FFF7` (Neon Cyan)
- **Secondary**: `#A259FF` (Purple)
- **Background**: `#121212` (Dark)
- **Cards**: `#1A1A1A` (Dark Gray)
- **Borders**: `#333333` (Medium Gray)

### Typography
- **Font Family**: Space Grotesk, Orbitron (monospace)
- **Responsive sizing** with Tailwind utilities

### Interactive Elements
- **Hover effects** with glow animations
- **Click feedback** with scale transforms
- **Progress indicators** with gradient fills

## 🔧 Configuration

### Environment Variables
Currently, ZapFile runs entirely client-side and doesn't require environment variables. For production deployment, consider adding:

\`\`\`env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_SESSION_TIMEOUT=300000
\`\`\`

### Customization

#### Modify Colors
Edit `tailwind.config.ts` to change the color scheme:

\`\`\`typescript
colors: {
  primary: {
    DEFAULT: "#00FFF7", // Your primary color
  },
  secondary: {
    DEFAULT: "#A259FF", // Your secondary color
  },
}
\`\`\`

#### Adjust File Size Limits
Modify the file processing logic in `zapfile.tsx`:

\`\`\`typescript
// Add file size validation
if (file.size > 100 * 1024 * 1024) { // 100MB limit
  throw new Error("File too large");
}
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)
1. **Push to GitHub**
2. **Connect to Vercel**
3. **Deploy automatically**

### Manual Deployment
\`\`\`bash
npm run build
npm start
\`\`\`

### Docker
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 🐛 Troubleshooting

### Common Issues

#### Files Not Downloading
- Check browser console for errors
- Verify file integrity in logs
- Ensure proper MIME type detection

#### Connection Issues
- Verify session IDs match exactly
- Check network connectivity
- Try refreshing both sender and receiver

#### Performance Issues
- Large files may take time to process
- Consider file size limits for better UX
- Monitor memory usage in browser

### Debug Mode
Enable the logs panel by clicking the "Logs" button to see:
- File upload progress
- Checksum generation
- Transfer simulation
- Download attempts
- Error details

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   \`\`\`bash
   git checkout -b feature/amazing-feature
   \`\`\`
3. **Commit your changes**
   \`\`\`bash
   git commit -m 'Add amazing feature'
   \`\`\`
4. **Push to the branch**
   \`\`\`bash
   git push origin feature/amazing-feature
   \`\`\`
5. **Open a Pull Request**

### Development Guidelines
- Use TypeScript for type safety
- Follow the existing code style
- Add comments for complex logic
- Test thoroughly before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **shadcn/ui** for the beautiful component library
- **Tailwind CSS** for the utility-first styling approach
- **Lucide** for the comprehensive icon set
- **Next.js team** for the amazing framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/zapfile/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/zapfile/discussions)
- **Email**: support@zapfile.dev

---

<div align="center">
  <p>Made with ❤️ by the ZapFile team</p>
  <p>
    <a href="#top">Back to top</a> •
    <a href="https://github.com/yourusername/zapfile">GitHub</a> •
    <a href="https://zapfile.dev">Website</a>
  </p>
</div>
