"use client";

import React, { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { compressImage, isSupportedImageType } from "@/lib/images";

interface ImageUploadProps {
  id?: string;
  label?: string;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
  maxFiles?: number;
  targetReduction?: number;
  onValidationError?: (message: string) => void;
  validateFile?: (file: File) => string | null;
}

interface FileEntry {
  file: File;
  preview: string;
  originalSize?: number;
  compressedSize?: number;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const ImageUpload = ({
  id = "image-upload",
  label = "Upload Images",
  multiple = false,
  onChange,
  maxFiles = 5,
  targetReduction = 0,
  onValidationError,
  validateFile,
}: ImageUploadProps) => {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCandidateFiles = useCallback(
    async (selectedFiles: File[]) => {
      const remaining = maxFiles - entries.length;
      const candidates = selectedFiles.slice(0, remaining);
      if (candidates.length === 0) return;

      setError(null);
      setIsCompressing(true);

      try {
        const newEntries: FileEntry[] = await Promise.all(
          candidates.map(async (candidate) => {
            // Custom validation
            const validationMessage = validateFile?.(candidate) ?? null;
            if (validationMessage) {
              setError(validationMessage);
              onValidationError?.(validationMessage);
              throw new Error(validationMessage);
            }

            if (isSupportedImageType(candidate)) {
              const compressed = await compressImage(candidate, {
                targetReduction,
              });
              return {
                file: compressed,
                preview: URL.createObjectURL(compressed),
                originalSize: candidate.size,
                compressedSize: compressed.size,
              };
            }

            return {
              file: candidate,
              preview: URL.createObjectURL(candidate),
            };
          }),
        );

        setEntries((prev) => {
          const updated = [...prev, ...newEntries].slice(0, maxFiles);
          onChange?.(updated.map((e) => e.file));
          return updated;
        });
      } catch (err) {
        if (!(err instanceof Error && validateFile)) {
          const message =
            err instanceof Error ? err.message : "Compression failed.";
          setError(message);
          onValidationError?.(message);
        }
      } finally {
        setIsCompressing(false);
      }
    },
    [
      entries.length,
      maxFiles,
      targetReduction,
      validateFile,
      onValidationError,
      onChange,
    ],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleCandidateFiles(selectedFiles);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const droppedFiles = Array.from(e.dataTransfer.files || []);
      handleCandidateFiles(droppedFiles);
    },
    [handleCandidateFiles],
  );

  const removeImage = (index: number) => {
    setEntries((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      const updated = prev.filter((_, i) => i !== index);
      onChange?.(updated.map((e) => e.file));
      return updated;
    });
  };

  const atLimit = entries.length >= maxFiles;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="relative"
      >
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          id={id}
          disabled={atLimit || isCompressing}
        />
        <label
          htmlFor={id}
          className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
            atLimit || isCompressing
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-orange-300 bg-orange-50 hover:bg-orange-100"
          }`}
        >
          {isCompressing ? (
            <>
              <svg
                className="size-5 animate-spin text-orange-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span className="text-sm font-medium text-orange-600">
                Compressing…
              </span>
            </>
          ) : (
            <>
              <Upload
                className={atLimit ? "text-gray-400" : "text-orange-500"}
                size={20}
              />
              <span
                className={`text-sm font-medium ${atLimit ? "text-gray-400" : "text-orange-600"}`}
              >
                {atLimit
                  ? `Maximum ${maxFiles} images`
                  : "Click to upload or drag and drop"}
              </span>
            </>
          )}
        </label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Preview grid */}
      {entries.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {entries.map((entry, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={entry.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* File size info */}
              <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-2 py-2 rounded-b-lg">
                <p className="text-[10px] text-white/80 truncate">
                  {entry.file.name}
                </p>
                <p className="text-[10px] text-white/60">
                  {formatFileSize(entry.file.size)}
                  {entry.originalSize &&
                    entry.compressedSize &&
                    entry.originalSize !== entry.compressedSize && (
                      <span className="ml-1 text-emerald-400">
                        (
                        {(
                          100 -
                          (entry.compressedSize / entry.originalSize) * 100
                        ).toFixed(0)}
                        % saved)
                      </span>
                    )}
                </p>
              </div>

              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-4">
          <ImageIcon size={16} />
          <span>No images uploaded yet</span>
        </div>
      )}
    </div>
  );
};
