"use client";

import { useState } from "react";
import { ImageUploader } from "./image-uploader";
import { ImageAdjuster } from "./image-adjuster";
import { ImagePreview } from "./image-preview";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { processImage } from "@/lib/process-image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadImage } from "@/lib/download-utils";
import { extractBlackPixels } from "@/lib/extractBlackPixels";

export type ProcessedImage = {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl: string;
  brightness: number;
  contrast: number;
  isProcessing: boolean;
  crop: { x: number; y: number; width: number; height: number } | null;
  extractBlackPixels: boolean;
};

export function ImageProcessor() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImagesUploaded = async (files: File[]) => {
    setIsProcessing(true);

    const newImages = [];

    for (const file of files) {
      const id = Math.random().toString(36).substring(2, 9);
      const originalUrl = URL.createObjectURL(file);

      // Initial processing with default values
      const processedUrl = await processImage(file, 0, 0);

      newImages.push({
        id,
        originalFile: file,
        originalUrl,
        processedUrl,
        brightness: 0,
        contrast: 0,
        isProcessing: false,
        crop: null,
        extractBlackPixels: false,
      });
    }

    setIsProcessing(false);
    setImages([...images, ...newImages]);

    if (newImages.length > 0) {
      setSelectedImageId(newImages[0].id);
      setActiveTab("adjust");
    }
  };

  const handleAdjustImage = async (
    id: string,
    brightness: number,
    contrast: number,
    crop: { x: number; y: number; width: number; height: number } | null = null,
    extractBlackPixelsOption = false
  ) => {
    const imageIndex = images.findIndex((img) => img.id === id);
    if (imageIndex === -1) return;

    const updatedImages = [...images];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      isProcessing: true,
    };
    setImages(updatedImages);

    try {
      // Use the provided crop or the existing one
      const cropToUse = crop !== undefined ? crop : images[imageIndex].crop;

      let processedUrl = await processImage(
        images[imageIndex].originalFile,
        brightness,
        contrast,
        cropToUse || undefined
      );

      // Apply black pixel extraction if enabled
      if (extractBlackPixelsOption) {
        processedUrl = await extractBlackPixels(processedUrl);
      }

      const finalImages = [...images];
      finalImages[imageIndex] = {
        ...finalImages[imageIndex],
        processedUrl,
        brightness,
        contrast,
        isProcessing: false,
        crop: cropToUse,
        extractBlackPixels: extractBlackPixelsOption,
      };
      setImages(finalImages);
    } catch (error) {
      console.error("Error processing image:", error);
      const errorImages = [...images];
      errorImages[imageIndex] = {
        ...errorImages[imageIndex],
        isProcessing: false,
      };
      setImages(errorImages);
    }
  };

  const handleCropChange = (
    id: string,
    crop: { x: number; y: number; width: number; height: number } | null
  ) => {
    const imageIndex = images.findIndex((img) => img.id === id);
    if (imageIndex === -1) return;

    const updatedImages = [...images];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      crop,
    };
    setImages(updatedImages);
  };

  const handleDownload = (image: ProcessedImage) => {
    downloadImage(image.processedUrl, `processed-${image.originalFile.name}`);
  };

  const handleRemoveImage = (id: string) => {
    const newImages = images.filter((img) => img.id !== id);
    setImages(newImages);

    if (selectedImageId === id && newImages.length > 0) {
      setSelectedImageId(newImages[0].id);
    } else if (newImages.length === 0) {
      setSelectedImageId(null);
      setActiveTab("upload");
    }
  };

  const selectedImage = images.find((img) => img.id === selectedImageId);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="adjust" disabled={images.length === 0}>
              Adjust
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={images.length === 0}>
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0">
            <ImageUploader
              onImagesUploaded={handleImagesUploaded}
              isProcessing={isProcessing}
            />
          </TabsContent>

          <TabsContent value="adjust" className="mt-0">
            {images.length > 0 && selectedImage && (
              <ImageAdjuster
                images={images}
                selectedImageId={selectedImageId}
                onSelectImage={setSelectedImageId}
                onAdjustImage={handleAdjustImage}
                onCropChange={handleCropChange}
                onRemoveImage={handleRemoveImage}
              />
            )}
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            {images.length > 0 && (
              <div className="space-y-6">
                <ImagePreview
                  images={images}
                  selectedImageId={selectedImageId}
                  onSelectImage={setSelectedImageId}
                />

                {selectedImage && (
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={() => handleDownload(selectedImage)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Image
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
