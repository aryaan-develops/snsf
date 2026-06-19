"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, Upload, X, RefreshCw, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

interface UploadResult {
  url: string;
  fileId: string;
  name: string;
}

interface ImageUploaderProps {
  label: string;
  onUpload: (result: UploadResult) => void;
  onRemove?: () => void;
  currentUrl?: string;
  folder?: string;
  accept?: string;
  required?: boolean;
  id: string;
}

async function uploadToImageKit(
  file: File | Blob,
  fileName: string,
  folder: string
): Promise<UploadResult> {
  // Get auth params from server
  const authRes = await fetch("/api/auth/imagekit");
  if (!authRes.ok) throw new Error("Failed to get upload credentials");
  const { token, expire, signature } = await authRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", fileName);
  formData.append("folder", folder);
  formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!);
  formData.append("signature", signature);
  formData.append("expire", expire.toString());
  formData.append("token", token);

  const uploadRes = await fetch(
    "https://upload.imagekit.io/api/v1/files/upload",
    { method: "POST", body: formData }
  );

  if (!uploadRes.ok) {
    const errBody = await uploadRes.json().catch(() => ({}));
    throw new Error(errBody?.message || "Upload failed");
  }

  const data = await uploadRes.json();
  return { url: data.url, fileId: data.fileId, name: data.name };
}

export default function ImageUploader({
  label,
  onUpload,
  onRemove,
  currentUrl,
  folder = "/swad-shri-nidhi",
  accept = "image/*",
  required = false,
  id,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<"idle" | "camera" | "preview">(
    currentUrl ? "preview" : "idle"
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await uploadToImageKit(file, `${Date.now()}-${file.name}`, folder);
      setPreviewUrl(result.url);
      setMode("preview");
      onUpload(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const capturePhoto = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    setError(null);
    setUploading(true);
    try {
      // Convert base64 to blob
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const result = await uploadToImageKit(blob, `capture-${Date.now()}.jpg`, folder);
      setPreviewUrl(result.url);
      setMode("preview");
      onUpload(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [folder, onUpload]);

  const handleRemove = () => {
    setPreviewUrl(null);
    setMode("idle");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemove?.();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-400">*</span>}
      </label>

      {mode === "idle" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-800/50 px-4 py-3 text-sm text-slate-400 transition-all hover:border-indigo-500 hover:bg-slate-800 hover:text-indigo-400 disabled:opacity-50"
          >
            {uploading ? <Spinner size="sm" /> : <Upload size={16} />}
            {uploading ? "Uploading..." : "Upload File"}
          </button>
          <button
            type="button"
            onClick={() => setMode("camera")}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-400 transition-all hover:border-violet-500 hover:text-violet-400 disabled:opacity-50"
          >
            <Camera size={16} />
            Camera
          </button>
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {mode === "camera" && (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-slate-700">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {uploading ? <Spinner size="sm" /> : <Camera size={16} />}
              {uploading ? "Uploading..." : "Capture & Upload"}
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "preview" && previewUrl && (
        <div className="relative group">
          <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
            <img
              src={previewUrl}
              alt="Uploaded"
              className="h-40 w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl opacity-0 bg-black/60 transition-opacity group-hover:opacity-100">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur"
            >
              <ImageIcon size={14} /> View
            </a>
            <button
              type="button"
              onClick={() => {
                setMode("idle");
                setPreviewUrl(currentUrl || null);
              }}
              className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white backdrop-blur"
            >
              <RefreshCw size={14} /> Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 rounded-lg bg-rose-500/20 px-3 py-1.5 text-sm text-rose-400 backdrop-blur"
            >
              <X size={14} /> Remove
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-400">{error}</p>
      )}
    </div>
  );
}
