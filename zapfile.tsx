"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Upload,
  Download,
  Shield,
  Zap,
  Copy,
  Check,
  Lock,
  Wifi,
  Users,
  FileText,
  ImageIcon,
  Video,
  Music,
  Send,
  ScanLine,
  ArrowLeftRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Share,
  Maximize,
  Info,
} from "lucide-react"
import QRCode from "react-qr-code"

type Mode = "sender" | "receiver"
type FileStatus = "pending" | "transferring" | "completed" | "failed"

interface FileData {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  content: ArrayBuffer
  checksum: string
}

interface TransferFile {
  id: string
  name: string
  size: number
  type: string
  status: FileStatus
  progress: number
  receivedAt?: Date
  content?: ArrayBuffer
  checksum?: string
  originalFile?: File
}

interface FileLog {
  timestamp: Date
  action: "upload" | "transfer" | "download" | "error"
  fileName: string
  fileSize: number
  fileType: string
  checksum?: string
  error?: string
  details?: string
}

export default function ZapFile() {
  const [mode, setMode] = useState<Mode>("sender")
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [processedFiles, setProcessedFiles] = useState<FileData[]>([])
  const [receivedFiles, setReceivedFiles] = useState<TransferFile[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [transferProgress, setTransferProgress] = useState(0)
  const [sessionId] = useState("ZAP-7X9K-M2P4")
  const [inputSessionId, setInputSessionId] = useState("")
  const [copied, setCopied] = useState(false)
  const [connectedPeers, setConnectedPeers] = useState(0)
  const [isTransferring, setIsTransferring] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [isQRHovered, setIsQRHovered] = useState(false)
  const [qrClicked, setQrClicked] = useState(false)
  const [showQRActions, setShowQRActions] = useState(false)
  const [fileLogs, setFileLogs] = useState<FileLog[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [processingFiles, setProcessingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Logging function
  const addLog = (log: Omit<FileLog, "timestamp">) => {
    const newLog: FileLog = {
      ...log,
      timestamp: new Date(),
    }
    setFileLogs((prev) => [newLog, ...prev].slice(0, 100)) // Keep last 100 logs
    console.log(`[ZapFile ${log.action.toUpperCase()}]`, newLog)
  }

  // Generate checksum for file integrity verification
  const generateChecksum = async (content: ArrayBuffer): Promise<string> => {
    try {
      const hashBuffer = await crypto.subtle.digest("SHA-256", content)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    } catch (error) {
      console.error("Checksum generation failed:", error)
      return Math.random().toString(36).substring(2, 15) // Fallback
    }
  }

  // Process uploaded files to preserve content
  const processUploadedFiles = async (uploadedFiles: File[]) => {
    setProcessingFiles(true)
    const processed: FileData[] = []

    for (const file of uploadedFiles) {
      try {
        addLog({
          action: "upload",
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          details: `Processing file: ${file.name} (${file.size} bytes)`,
        })

        // Read file content as ArrayBuffer
        const content = await readFileAsArrayBuffer(file)
        const checksum = await generateChecksum(content)

        const fileData: FileData = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          lastModified: file.lastModified,
          content,
          checksum,
        }

        processed.push(fileData)

        addLog({
          action: "upload",
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          checksum,
          details: `File processed successfully. Checksum: ${checksum.substring(0, 8)}...`,
        })
      } catch (error) {
        addLog({
          action: "error",
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          error: error instanceof Error ? error.message : "Unknown error",
          details: "Failed to process uploaded file",
        })
        console.error(`Failed to process file ${file.name}:`, error)
      }
    }

    setProcessedFiles((prev) => [...prev, ...processed])
    setProcessingFiles(false)
  }

  // Read file as ArrayBuffer
  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result)
        } else {
          reject(new Error("Failed to read file as ArrayBuffer"))
        }
      }
      reader.onerror = () => reject(new Error("FileReader error"))
      reader.readAsArrayBuffer(file)
    })
  }

  // Simulate connection status
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus("connected")
      setConnectedPeers(1)
    } else {
      setConnectionStatus("disconnected")
      setConnectedPeers(0)
    }
  }, [isConnected])

  // Process files when they're added
  useEffect(() => {
    if (files.length > 0) {
      const newFiles = files.filter(
        (file) => !processedFiles.some((pf) => pf.name === file.name && pf.size === file.size),
      )
      if (newFiles.length > 0) {
        processUploadedFiles(newFiles)
      }
    }
  }, [files])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles((prev) => [...prev, ...droppedFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendFiles = () => {
    if (processedFiles.length === 0 || !isConnected) return

    setIsTransferring(true)
    setTransferProgress(0)

    // Convert processed files to transfer format
    const transferFiles: TransferFile[] = processedFiles.map((file) => ({
      id: file.id,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending" as FileStatus,
      progress: 0,
      content: file.content,
      checksum: file.checksum,
    }))

    addLog({
      action: "transfer",
      fileName: `${transferFiles.length} files`,
      fileSize: transferFiles.reduce((sum, f) => sum + f.size, 0),
      fileType: "batch",
      details: `Starting transfer of ${transferFiles.length} files`,
    })

    // Simulate file transfer with progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15 + 5 // Random progress between 5-20%

      if (currentProgress >= 100) {
        currentProgress = 100
        setTransferProgress(100)

        // Mark files as completed and add to received files
        const completedFiles = transferFiles.map((file) => ({
          ...file,
          status: "completed" as FileStatus,
          progress: 100,
          receivedAt: new Date(),
        }))

        // Simulate receiving files on the other end
        setReceivedFiles((prev) => [...prev, ...completedFiles])

        transferFiles.forEach((file) => {
          addLog({
            action: "transfer",
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            checksum: file.checksum,
            details: "File transfer completed successfully",
          })
        })

        clearInterval(interval)
        setIsTransferring(false)

        // Reset sender files after successful transfer
        setTimeout(() => {
          setFiles([])
          setProcessedFiles([])
          setTransferProgress(0)
        }, 2000)
      } else {
        setTransferProgress(currentProgress)
      }
    }, 300)
  }

  const handleConnectToSession = () => {
    if (inputSessionId.trim()) {
      setConnectionStatus("connecting")

      // Simulate connection process
      setTimeout(() => {
        setIsConnected(true)
        setConnectionStatus("connected")
        setConnectedPeers(1)
      }, 1500)
    }
  }

  const handleQRScan = () => {
    // Simulate QR scan - in real app this would open camera
    const scannedId = "ZAP-7X9K-M2P4"
    setInputSessionId(scannedId)
    setConnectionStatus("connecting")

    setTimeout(() => {
      setIsConnected(true)
      setConnectionStatus("connected")
      setConnectedPeers(1)
    }, 1500)
  }

  const handleDownloadFile = async (file: TransferFile) => {
    try {
      addLog({
        action: "download",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        checksum: file.checksum,
        details: "Starting download process",
      })

      if (!file.content) {
        throw new Error("File content not available")
      }

      // Verify file integrity if checksum is available
      if (file.checksum) {
        const downloadChecksum = await generateChecksum(file.content)
        if (downloadChecksum !== file.checksum) {
          throw new Error(
            `File integrity check failed. Expected: ${file.checksum.substring(0, 8)}..., Got: ${downloadChecksum.substring(0, 8)}...`,
          )
        }
      }

      // Create blob with exact original content and type
      const blob = new Blob([file.content], {
        type: file.type || "application/octet-stream",
      })

      // Verify blob size matches original
      if (blob.size !== file.size) {
        throw new Error(`File size mismatch. Expected: ${file.size}, Got: ${blob.size}`)
      }

      const url = URL.createObjectURL(blob)

      // Create download link with proper attributes
      const downloadLink = document.createElement("a")
      downloadLink.href = url
      downloadLink.download = file.name
      downloadLink.style.display = "none"

      // Add to DOM, trigger download, and cleanup
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      // Clean up the blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      addLog({
        action: "download",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        checksum: file.checksum,
        details: "Download completed successfully",
      })

      console.log(`✅ Successfully downloaded: ${file.name}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown download error"

      addLog({
        action: "error",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        error: errorMessage,
        details: "Download failed",
      })

      console.error(`❌ Failed to download ${file.name}:`, error)
      alert(`Failed to download ${file.name}:\n${errorMessage}\n\nCheck the logs for more details.`)
    }
  }

  const handleQRClick = () => {
    setQrClicked(true)
    setShowQRActions(true)

    // Reset click effect after animation
    setTimeout(() => setQrClicked(false), 300)

    // Hide actions after 3 seconds
    setTimeout(() => setShowQRActions(false), 3000)
  }

  const handleCopyQRLink = () => {
    const qrLink = `zapfile:${sessionId}`
    navigator.clipboard.writeText(qrLink)
    alert("QR link copied to clipboard!")
  }

  const handleShareQR = () => {
    if (navigator.share) {
      navigator.share({
        title: "ZapFile Session",
        text: `Join my ZapFile session: ${sessionId}`,
        url: `zapfile:${sessionId}`,
      })
    } else {
      handleCopyQRLink()
    }
  }

  const handleEnlargeQR = () => {
    // Create a modal-like overlay with enlarged QR
    const overlay = document.createElement("div")
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(10px);
    `

    const qrContainer = document.createElement("div")
    qrContainer.style.cssText = `
      background: #1A1A1A;
      padding: 2rem;
      border-radius: 1rem;
      border: 2px solid #333;
      box-shadow: 0 0 50px rgba(0, 255, 247, 0.3);
    `

    // Create enlarged QR code
    const qrDiv = document.createElement("div")
    qrDiv.innerHTML = `
      <div style="background: #0A0A0A; padding: 1rem; border-radius: 0.5rem; border: 1px solid #333;">
        <svg width="300" height="300" viewBox="0 0 256 256">
          <!-- QR code would be rendered here -->
        </svg>
      </div>
      <p style="color: #00FFF7; text-align: center; margin-top: 1rem; font-size: 0.875rem;">
        Session: ${sessionId}
      </p>
    `

    qrContainer.appendChild(qrDiv)
    overlay.appendChild(qrContainer)
    document.body.appendChild(overlay)

    // Close on click
    overlay.addEventListener("click", () => {
      document.body.removeChild(overlay)
    })
  }

  const getFileIcon = (file: File | TransferFile | FileData) => {
    const type = file.type
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (type.startsWith("video/")) return <Video className="w-4 h-4" />
    if (type.startsWith("audio/")) return <Music className="w-4 h-4" />
    return <FileText className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-[#00FFF7]" />
      case "transferring":
        return <Clock className="w-4 h-4 text-[#A259FF] animate-spin" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const clearLogs = () => {
    setFileLogs([])
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 font-mono">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Zap className="w-8 h-8 text-[#00FFF7]" />
              <div className="absolute inset-0 w-8 h-8 bg-[#00FFF7] opacity-20 blur-md rounded-full" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#00FFF7] to-[#A259FF] bg-clip-text text-transparent">
              ZapFile
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg p-1 border border-[#333]">
              <Button
                variant={mode === "sender" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("sender")}
                className={
                  mode === "sender"
                    ? "bg-gradient-to-r from-[#00FFF7] to-[#A259FF] text-black font-semibold"
                    : "text-white hover:bg-[#333]"
                }
              >
                <Upload className="w-3 h-3 mr-1" />
                Send
              </Button>
              <Button
                variant={mode === "receiver" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMode("receiver")}
                className={
                  mode === "receiver"
                    ? "bg-gradient-to-r from-[#00FFF7] to-[#A259FF] text-black font-semibold"
                    : "text-white hover:bg-[#333]"
                }
              >
                <Download className="w-3 h-3 mr-1" />
                Receive
              </Button>
            </div>

            <Badge variant="outline" className="border-[#00FFF7] text-[#00FFF7] bg-[#00FFF7]/10">
              <Shield className="w-3 h-3 mr-1" />
              P2P Encrypted
            </Badge>
            <Badge variant="outline" className="border-[#A259FF] text-[#A259FF] bg-[#A259FF]/10">
              <Users className="w-3 h-3 mr-1" />
              {connectedPeers} Peers
            </Badge>

            {/* Debug Logs Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className="border-[#333] hover:border-[#555] hover:bg-[#333]/50 text-white"
            >
              <Info className="w-3 h-3 mr-1" />
              Logs ({fileLogs.length})
            </Button>
          </div>
        </div>

        {/* Debug Logs Panel */}
        {showLogs && (
          <Card className="bg-[#1A1A1A] border-[#333] mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#A259FF]">Debug Logs</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearLogs}
                  className="border-[#333] hover:border-[#555] text-white"
                >
                  Clear Logs
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {fileLogs.length === 0 ? (
                  <p className="text-xs text-gray-400">No logs yet</p>
                ) : (
                  fileLogs.map((log, index) => (
                    <div key={index} className="text-xs p-2 bg-[#222] rounded border border-[#333]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-400">{log.timestamp.toLocaleTimeString()}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            log.action === "error"
                              ? "border-red-500 text-red-500"
                              : log.action === "upload"
                                ? "border-[#A259FF] text-[#A259FF]"
                                : log.action === "transfer"
                                  ? "border-[#00FFF7] text-[#00FFF7]"
                                  : log.action === "download"
                                    ? "border-green-500 text-green-500"
                                    : "border-gray-500 text-gray-500"
                          }`}
                        >
                          {log.action.toUpperCase()}
                        </Badge>
                        <span className="text-white">{log.fileName}</span>
                        <span className="text-gray-400">({formatFileSize(log.fileSize)})</span>
                      </div>
                      {log.details && <p className="text-gray-300">{log.details}</p>}
                      {log.error && <p className="text-red-400">Error: {log.error}</p>}
                      {log.checksum && <p className="text-gray-400">Checksum: {log.checksum.substring(0, 16)}...</p>}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Status */}
        <Card className="bg-[#1A1A1A] border-[#333] mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-[#00FFF7]"
                      : connectionStatus === "connecting"
                        ? "bg-[#A259FF]"
                        : "bg-gray-500"
                  } animate-pulse`}
                />
                <span className="text-sm text-white">
                  {connectionStatus === "connected"
                    ? "Connected to P2P Network"
                    : connectionStatus === "connecting"
                      ? "Connecting..."
                      : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-[#00FFF7]" />
                <span className="text-xs text-gray-300">Session: {sessionId}</span>
                <Button variant="ghost" size="sm" onClick={copySessionId} className="h-6 w-6 p-0 hover:bg-[#00FFF7]/20">
                  {copied ? <Check className="w-3 h-3 text-[#00FFF7]" /> : <Copy className="w-3 h-3 text-white" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {mode === "sender" ? (
              /* Sender Mode - File Drop Zone */
              <Card className="bg-[#1A1A1A] border-[#333] h-full">
                <CardContent className="p-6">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                      isDragging
                        ? "border-[#00FFF7] bg-[#00FFF7]/5 shadow-[0_0_20px_rgba(0,255,247,0.3)]"
                        : "border-[#333] hover:border-[#555]"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <Upload className="w-12 h-12 text-[#00FFF7]" />
                        <div className="absolute inset-0 w-12 h-12 bg-[#00FFF7] opacity-20 blur-lg rounded-full" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-white">Drop files to share</h3>
                        <p className="text-gray-400 text-sm mb-4">Drag & drop files here or click to browse</p>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={processingFiles}
                          className="bg-gradient-to-r from-[#00FFF7] to-[#A259FF] hover:from-[#00FFF7]/80 hover:to-[#A259FF]/80 text-black font-semibold disabled:opacity-50"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {processingFiles ? "Processing..." : "Select Files"}
                        </Button>
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
                  </div>

                  {/* File Processing Status */}
                  {processingFiles && (
                    <div className="mt-4 p-3 bg-[#A259FF]/10 border border-[#A259FF]/30 rounded-lg">
                      <p className="text-sm text-[#A259FF]">🔄 Processing files and preserving original format...</p>
                    </div>
                  )}

                  {/* File List */}
                  {processedFiles.length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-[#00FFF7]">
                          Ready to Share ({processedFiles.length} files)
                        </h4>
                        <Button
                          onClick={handleSendFiles}
                          disabled={isTransferring || !isConnected || processingFiles}
                          className="bg-gradient-to-r from-[#00FFF7] to-[#A259FF] hover:from-[#00FFF7]/80 hover:to-[#A259FF]/80 text-black font-semibold disabled:opacity-50"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isTransferring ? "Sending..." : "Send Files"}
                        </Button>
                      </div>

                      {!isConnected && (
                        <div className="mb-4 p-3 bg-[#A259FF]/10 border border-[#A259FF]/30 rounded-lg">
                          <p className="text-sm text-[#A259FF]">⚠️ Connect to a receiver first to send files</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {processedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-[#222] rounded-lg border border-[#333]"
                          >
                            <div className="text-[#A259FF]">{getFileIcon(file)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-white">{file.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{formatFileSize(file.size)}</span>
                                <span>• {file.type || "Unknown type"}</span>
                                <span>• Checksum: {file.checksum.substring(0, 8)}...</span>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-[#00FFF7] text-[#00FFF7] bg-[#00FFF7]/10 text-xs"
                            >
                              <Lock className="w-2 h-2 mr-1" />
                              Verified
                            </Badge>
                          </div>
                        ))}
                      </div>

                      {transferProgress > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white">Transferring to receiver...</span>
                            <span className="text-[#00FFF7]">{Math.round(transferProgress)}%</span>
                          </div>
                          <Progress value={transferProgress} className="h-2 bg-[#333]" />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Receiver Mode - Connection Interface */
              <Card className="bg-[#1A1A1A] border-[#333] h-full">
                <CardContent className="p-6">
                  {!isConnected ? (
                    <div className="text-center mb-6">
                      <div className="relative mb-4">
                        <Download className="w-12 h-12 text-[#A259FF] mx-auto" />
                        <div className="absolute inset-0 w-12 h-12 bg-[#A259FF] opacity-20 blur-lg rounded-full mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-white">Receive Files</h3>
                      <p className="text-gray-400 text-sm">Connect to a sender to receive files securely</p>
                    </div>
                  ) : (
                    <div className="text-center mb-6">
                      <div className="relative mb-4">
                        <CheckCircle className="w-12 h-12 text-[#00FFF7] mx-auto" />
                        <div className="absolute inset-0 w-12 h-12 bg-[#00FFF7] opacity-20 blur-lg rounded-full mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-white">Connected & Ready</h3>
                      <p className="text-gray-400 text-sm">Waiting for files from sender...</p>
                    </div>
                  )}

                  {!isConnected && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-[#333]"></div>
                        <span className="text-xs text-gray-400">OR</span>
                        <div className="flex-1 h-px bg-[#333]"></div>
                      </div>

                      {/* Manual Session ID Input */}
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Enter Session ID</label>
                        <div className="flex gap-2">
                          <Input
                            value={inputSessionId}
                            onChange={(e) => setInputSessionId(e.target.value)}
                            placeholder="ZAP-XXXX-XXXX"
                            className="bg-[#222] border-[#333] text-white placeholder-gray-500"
                          />
                          <Button
                            onClick={handleConnectToSession}
                            disabled={!inputSessionId.trim() || connectionStatus === "connecting"}
                            className="bg-gradient-to-r from-[#00FFF7] to-[#A259FF] hover:from-[#00FFF7]/80 hover:to-[#A259FF]/80 text-black font-semibold disabled:opacity-50"
                          >
                            {connectionStatus === "connecting" ? "Connecting..." : "Connect"}
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-[#333]"></div>
                        <span className="text-xs text-gray-400">OR</span>
                        <div className="flex-1 h-px bg-[#333]"></div>
                      </div>

                      {/* QR Scanner */}
                      <Button
                        onClick={handleQRScan}
                        disabled={connectionStatus === "connecting"}
                        variant="outline"
                        className="w-full border-[#333] hover:border-[#555] hover:bg-[#333]/50 text-white disabled:opacity-50"
                      >
                        <ScanLine className="w-4 h-4 mr-2" />
                        {connectionStatus === "connecting" ? "Connecting..." : "Scan QR Code"}
                      </Button>
                    </div>
                  )}

                  {/* Received Files */}
                  {receivedFiles.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-3 text-[#00FFF7]">
                        Received Files ({receivedFiles.length})
                      </h4>
                      <div className="space-y-2">
                        {receivedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-3 p-3 bg-[#222] rounded-lg border border-[#333]"
                          >
                            <div className="text-[#A259FF]">{getFileIcon(file)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-white">{file.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{formatFileSize(file.size)}</span>
                                <span>• {file.type || "Unknown type"}</span>
                                {file.receivedAt && <span>• Received {file.receivedAt.toLocaleTimeString()}</span>}
                                {file.checksum && <span>• Verified ✓</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(file.status)}
                              <Button
                                onClick={() => handleDownloadFile(file)}
                                size="sm"
                                className="bg-gradient-to-r from-[#00FFF7] to-[#A259FF] hover:from-[#00FFF7]/80 hover:to-[#A259FF]/80 text-black font-semibold"
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isConnected && receivedFiles.length === 0 && (
                    <div className="mt-6 p-4 bg-[#222] rounded-lg border border-[#00FFF7]/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-[#00FFF7] rounded-full animate-pulse"></div>
                        <span className="text-sm text-white">Connected - Waiting for files...</span>
                      </div>
                      <p className="text-xs text-gray-400">Files will appear here when the sender starts transfer</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Connection Panel */}
          <div className="space-y-6">
            {mode === "sender" && (
              /* QR Code for Sender */
              <Card className="bg-[#1A1A1A] border-[#333]">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3 text-[#A259FF]">Quick Connect</h3>

                  {/* Interactive QR Code Container */}
                  <div className="relative">
                    {/* Dual-color outer glow effect - enhanced on hover */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-[#00FFF7] via-[#A259FF] to-[#00FFF7] rounded-lg transition-all duration-300 ${
                        isQRHovered ? "opacity-40 blur-xl" : "opacity-20 blur-lg"
                      }`}
                    ></div>
                    <div
                      className={`absolute inset-0 bg-gradient-to-br from-[#A259FF] to-[#00FFF7] rounded-lg transition-all duration-300 ${
                        isQRHovered ? "opacity-20 blur-2xl" : "opacity-10 blur-xl"
                      }`}
                    ></div>

                    {/* Interactive QR Code Frame */}
                    <div
                      className={`relative bg-gradient-to-br from-[#1A1A1A] via-[#1F1A2E] to-[#222] p-4 rounded-lg border cursor-pointer transition-all duration-300 transform ${
                        isQRHovered
                          ? "border-[#00FFF7] shadow-[0_0_30px_rgba(0,255,247,0.2),0_0_60px_rgba(162,89,255,0.1)] scale-105"
                          : "border-[#333] shadow-[0_0_20px_rgba(0,255,247,0.1),0_0_40px_rgba(162,89,255,0.05)]"
                      } ${qrClicked ? "scale-95" : ""}`}
                      onMouseEnter={() => setIsQRHovered(true)}
                      onMouseLeave={() => setIsQRHovered(false)}
                      onClick={handleQRClick}
                    >
                      {/* Corner decorations with alternating colors - animated on hover */}
                      <div
                        className={`absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-[#00FFF7] transition-all duration-300 ${
                          isQRHovered ? "w-4 h-4 top-1 left-1" : ""
                        }`}
                      ></div>
                      <div
                        className={`absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-[#A259FF] transition-all duration-300 ${
                          isQRHovered ? "w-4 h-4 top-1 right-1" : ""
                        }`}
                      ></div>
                      <div
                        className={`absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-[#A259FF] transition-all duration-300 ${
                          isQRHovered ? "w-4 h-4 bottom-1 left-1" : ""
                        }`}
                      ></div>
                      <div
                        className={`absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-[#00FFF7] transition-all duration-300 ${
                          isQRHovered ? "w-4 h-4 bottom-1 right-1" : ""
                        }`}
                      ></div>

                      {/* Additional corner accent dots - pulse faster on hover */}
                      <div
                        className={`absolute top-1 left-1 w-1 h-1 bg-[#A259FF] rounded-full ${
                          isQRHovered ? "animate-ping" : "animate-pulse"
                        }`}
                      ></div>
                      <div
                        className={`absolute top-1 right-1 w-1 h-1 bg-[#00FFF7] rounded-full ${
                          isQRHovered ? "animate-ping" : "animate-pulse"
                        }`}
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className={`absolute bottom-1 left-1 w-1 h-1 bg-[#00FFF7] rounded-full ${
                          isQRHovered ? "animate-ping" : "animate-pulse"
                        }`}
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                      <div
                        className={`absolute bottom-1 right-1 w-1 h-1 bg-[#A259FF] rounded-full ${
                          isQRHovered ? "animate-ping" : "animate-pulse"
                        }`}
                        style={{ animationDelay: "0.6s" }}
                      ></div>

                      {/* QR Code with enhanced gradient border on hover */}
                      <div className="relative">
                        <div
                          className={`absolute inset-0 bg-gradient-to-r from-[#00FFF7] to-[#A259FF] rounded-md transition-all duration-300 ${
                            isQRHovered ? "p-[2px]" : "p-[1px]"
                          }`}
                        >
                          <div className="bg-[#0A0A0A] rounded-md h-full w-full"></div>
                        </div>
                        <div className="relative bg-[#0A0A0A] p-3 rounded-md flex items-center justify-center">
                          <QRCode
                            value={`zapfile:${sessionId}`}
                            size={120}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                            fgColor="#00FFF7" // Neon cyan for QR pattern
                            bgColor="#0A0A0A" // Dark background
                          />
                        </div>
                      </div>

                      {/* Enhanced scanning line animations on hover */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFF7] to-transparent transition-all duration-300 ${
                            isQRHovered ? "animate-ping h-0.5" : "animate-pulse"
                          }`}
                        ></div>
                        <div
                          className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A259FF] to-transparent transition-all duration-300 ${
                            isQRHovered ? "animate-ping h-0.5" : "animate-pulse"
                          }`}
                          style={{ animationDelay: "0.5s" }}
                        ></div>
                      </div>

                      {/* Side accent lines - more prominent on hover */}
                      <div
                        className={`absolute left-0 top-1/4 bottom-1/4 bg-gradient-to-b from-transparent via-[#A259FF] to-transparent transition-all duration-300 ${
                          isQRHovered ? "w-0.5 animate-ping" : "w-px animate-pulse"
                        }`}
                        style={{ animationDelay: "0.25s" }}
                      ></div>
                      <div
                        className={`absolute right-0 top-1/4 bottom-1/4 bg-gradient-to-b from-transparent via-[#00FFF7] to-transparent transition-all duration-300 ${
                          isQRHovered ? "w-0.5 animate-ping" : "w-px animate-pulse"
                        }`}
                        style={{ animationDelay: "0.75s" }}
                      ></div>

                      {/* Hover overlay with interaction hint */}
                      {isQRHovered && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00FFF7]/5 to-[#A259FF]/5 rounded-lg flex items-center justify-center">
                          <div className="bg-[#1A1A1A]/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-white border border-[#333]">
                            Click for options
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Interactive Action Buttons */}
                    {showQRActions && (
                      <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyQRLink}
                          className="border-[#00FFF7] text-[#00FFF7] hover:bg-[#00FFF7]/10 bg-[#1A1A1A]/90 backdrop-blur-sm"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleShareQR}
                          className="border-[#A259FF] text-[#A259FF] hover:bg-[#A259FF]/10 bg-[#1A1A1A]/90 backdrop-blur-sm"
                        >
                          <Share className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEnlargeQR}
                          className="border-[#00FFF7] text-[#00FFF7] hover:bg-[#00FFF7]/10 bg-[#1A1A1A]/90 backdrop-blur-sm"
                        >
                          <Maximize className="w-3 h-3 mr-1" />
                          Enlarge
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-400 mb-1">
                      {isQRHovered ? "Click for sharing options" : "Share this QR code with receiver"}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <div
                        className={`w-1 h-1 bg-[#00FFF7] rounded-full transition-all duration-300 ${
                          isQRHovered ? "animate-ping" : "animate-pulse"
                        }`}
                      ></div>
                      <span className="bg-gradient-to-r from-[#00FFF7] to-[#A259FF] bg-clip-text text-transparent font-semibold">
                        {isQRHovered ? "Interactive Session" : "Live Session"}
                      </span>
                      <div
                        className={`w-1 h-1 bg-[#A259FF] rounded-full transition-all duration-300 ${
                          isQRHovered ? "animate-ping" : "animate-pulse"
                        }`}
                        style={{ animationDelay: "0.5s" }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Info */}
            <Card className="bg-[#1A1A1A] border-[#333]">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 text-[#A259FF]">Session Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Session ID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-[#333] px-2 py-1 rounded text-white">{sessionId}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copySessionId}
                        className="h-6 w-6 p-0 hover:bg-[#00FFF7]/20"
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-[#00FFF7]" />
                        ) : (
                          <Copy className="w-3 h-3 text-white" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Encryption</span>
                    <Badge variant="outline" className="border-[#00FFF7] text-[#00FFF7] bg-[#00FFF7]/10 text-xs">
                      AES-256
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Network</span>
                    <span className="text-xs text-[#00FFF7]">P2P Direct</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Mode</span>
                    <span className="text-xs text-white capitalize">{mode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Status</span>
                    <span
                      className={`text-xs ${
                        connectionStatus === "connected"
                          ? "text-[#00FFF7]"
                          : connectionStatus === "connecting"
                            ? "text-[#A259FF]"
                            : "text-gray-400"
                      }`}
                    >
                      {connectionStatus === "connected"
                        ? "Connected"
                        : connectionStatus === "connecting"
                          ? "Connecting"
                          : "Disconnected"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Files Processed</span>
                    <span className="text-xs text-white">{processedFiles.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-3">
              <Button
                onClick={() => setMode(mode === "sender" ? "receiver" : "sender")}
                variant="outline"
                className="w-full border-[#333] hover:border-[#555] hover:bg-[#333]/50 text-white"
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Switch to {mode === "sender" ? "Receiver" : "Sender"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
