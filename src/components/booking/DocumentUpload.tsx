import React, { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";
import { validateFile } from "@/lib/storage-fns";

interface DocumentUploadProps {
  label: string;
  description: string;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  uploadedUrl: string | null;
}

export function DocumentUpload({
  label,
  description,
  onFileSelect,
  selectedFile,
  uploadedUrl,
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError.message);
      onFileSelect(null);
      return;
    }
    onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    onFileSelect(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-semibold uppercase tracking-wider text-white/70">
          {label}
        </label>
        {selectedFile && (
          <button
            type="button"
            onClick={removeFile}
            className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition bg-transparent border-none cursor-pointer"
          >
            <X className="h-3 w-3" /> Remove File
          </button>
        )}
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
          dragActive
            ? "border-amber-500 bg-amber-500/5"
            : selectedFile
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-white/10 hover:border-white/20 bg-white/[0.02]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleChange}
        />

        {selectedFile ? (
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/10 text-emerald-400 mb-1">
              {uploadedUrl ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
            </div>
            <p className="text-sm font-medium text-white max-w-[200px] truncate mx-auto">
              {selectedFile.name}
            </p>
            <p className="text-xs text-white/40">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {uploadedUrl && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono mt-1">
                Uploaded to Storage
              </span>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/5 text-white/60 mb-1">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-white/90">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-white/40">{description}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-2.5 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
