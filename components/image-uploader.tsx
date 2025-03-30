"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnsavedChanges } from "@/contexts/unsaved-changes-context";

interface ImageUploaderProps {
  onImagesUploaded: (files: File[]) => void;
  isProcessing?: boolean;
}

export function ImageUploader({
  onImagesUploaded,
  isProcessing = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImages, setPreviewImages] = useState<
    { file: File; url: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setHasUnsavedChanges } = useUnsavedChanges();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    const newPreviewImages = imageFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    if (newPreviewImages.length > 0) {
      setHasUnsavedChanges(true); // Set global unsaved changes flag
    }

    setPreviewImages([...previewImages, ...newPreviewImages]);
  };

  const handleRemovePreview = (index: number) => {
    const newPreviews = [...previewImages];
    URL.revokeObjectURL(newPreviews[index].url);
    newPreviews.splice(index, 1);
    setPreviewImages(newPreviews);

    // Note: We don't reset hasUnsavedChanges even if all images are removed
    // per user requirement to keep it true until page refresh/close
  };

  const handleUpload = () => {
    if (previewImages.length > 0) {
      onImagesUploaded(previewImages.map((preview) => preview.file));

      // Clean up object URLs
      previewImages.forEach((preview) => URL.revokeObjectURL(preview.url));
      setPreviewImages([]);

      // Note: We don't reset hasUnsavedChanges here
      // per user requirement to keep it true until page refresh/close
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">
          Drag and drop your images here
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Or click to browse your files
        </p>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>

      {previewImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            Selected Images ({previewImages.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview.url || "/placeholder.svg"}
                  alt={`Preview ${index}`}
                  className="h-24 w-full object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePreview(index);
                  }}
                  className="absolute top-1 right-1 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleUpload}
              className="mt-4"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Process {previewImages.length}{" "}
                  {previewImages.length === 1 ? "Image" : "Images"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
