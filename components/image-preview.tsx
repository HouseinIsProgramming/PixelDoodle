"use client";

import type { ProcessedImage } from "./image-processor";
import { cn } from "@/lib/utils";
import { downloadImage } from "@/lib/download-utils";
import { downloadImagesAsZip } from "@/lib/zip-utils";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

interface ImagePreviewProps {
  images: ProcessedImage[];
  selectedImageId: string | null;
  onSelectImage: (id: string) => void;
}

export function ImagePreview({
  images,
  selectedImageId,
  onSelectImage,
}: ImagePreviewProps) {
  const selectedImage = images.find((img) => img.id === selectedImageId);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAll = async () => {
    if (images.length === 0) return;

    setIsDownloading(true);
    try {
      const imagesToDownload = images
        .filter((image) => image.processedUrl)
        .map((image, index) => ({
          url: image.processedUrl!,
          filename: `processed-image-${index + 1}.jpg`,
        }));

      await downloadImagesAsZip(imagesToDownload, "pixel-doodle-images.zip");
    } catch (error) {
      console.error("Error downloading images as zip:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSelected = () => {
    if (selectedImage?.processedUrl) {
      downloadImage(
        selectedImage.processedUrl,
        `processed-image-${selectedImage.id}.jpg`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">All Processed Images</h3>
          {images.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span>
                {isDownloading ? "Creating ZIP..." : "Download All as ZIP"}
              </span>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={cn(
                "cursor-pointer rounded-md overflow-hidden border-2",
                selectedImageId === image.id
                  ? "border-primary"
                  : "border-transparent hover:border-primary/50"
              )}
              onClick={() => onSelectImage(image.id)}
            >
              <div className="aspect-square">
                <img
                  src={image.processedUrl || "/placeholder.svg"}
                  alt="Processed thumbnail"
                  className="h-full w-full bg-stone-300 object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full space-y-4">
            <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
              <img
                src={selectedImage.processedUrl || "/placeholder.svg"}
                alt="Processed"
                className="w-full h-full object-contain bg-stone-300"
              />
              <div className="absolute top-2 right-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadSelected}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Original</h3>
                <div className="aspect-video bg-black/10 rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.originalUrl || "/placeholder.svg"}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Processed</h3>
                <div className="aspect-video bg-black/10 rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.processedUrl || "/placeholder.svg"}
                    alt="Processed"
                    className="w-full h-full object-contain bg-stone-300"
                  />
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Brightness: {selectedImage.brightness}</p>
              <p>Contrast: {selectedImage.contrast}</p>
              {selectedImage.crop && (
                <p>
                  Crop: {selectedImage.crop.width}x{selectedImage.crop.height}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
