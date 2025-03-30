"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Minus, Plus, Trash2 } from "lucide-react"
import type { ProcessedImage } from "./image-processor"
import { cn } from "@/lib/utils"
import { ImageCropper } from "./image-cropper"

interface ImageAdjusterProps {
  images: ProcessedImage[]
  selectedImageId: string | null
  onSelectImage: (id: string) => void
  onAdjustImage: (
    id: string,
    brightness: number,
    contrast: number,
    crop?: { x: number; y: number; width: number; height: number } | null,
  ) => void
  onCropChange: (id: string, crop: { x: number; y: number; width: number; height: number } | null) => void
  onRemoveImage: (id: string) => void
}

export function ImageAdjuster({
  images,
  selectedImageId,
  onSelectImage,
  onAdjustImage,
  onCropChange,
  onRemoveImage,
}: ImageAdjusterProps) {
  const selectedImage = images.find((img) => img.id === selectedImageId)

  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [activeTab, setActiveTab] = useState("adjust")

  useEffect(() => {
    if (selectedImage) {
      setBrightness(selectedImage.brightness)
      setContrast(selectedImage.contrast)
    }
  }, [selectedImage])

  const handleBrightnessChange = (value: number[]) => {
    setBrightness(value[0])
  }

  const handleContrastChange = (value: number[]) => {
    setContrast(value[0])
  }

  const handleBrightnessInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (!isNaN(value) && value >= -100 && value <= 100) {
      setBrightness(value)
    }
  }

  const handleContrastInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (!isNaN(value) && value >= -100 && value <= 100) {
      setContrast(value)
    }
  }

  const adjustBrightness = (amount: number) => {
    const newValue = Math.max(-100, Math.min(100, brightness + amount))
    setBrightness(newValue)
  }

  const adjustContrast = (amount: number) => {
    const newValue = Math.max(-100, Math.min(100, contrast + amount))
    setContrast(newValue)
  }

  const handleApplyChanges = () => {
    if (selectedImageId) {
      setIsAdjusting(true)
      onAdjustImage(selectedImageId, brightness, contrast)
      setTimeout(() => setIsAdjusting(false), 500)
    }
  }

  const handleCropChange = (crop: { x: number; y: number; width: number; height: number } | null) => {
    if (selectedImageId) {
      onCropChange(selectedImageId, crop)
    }
  }

  const handleApplyCrop = () => {
    if (selectedImageId && selectedImage) {
      setIsAdjusting(true)
      onAdjustImage(selectedImageId, brightness, contrast, selectedImage.crop)
      setTimeout(() => setIsAdjusting(false), 500)
    }
  }

  if (!selectedImage) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="adjust" className="flex-1">
                Adjust
              </TabsTrigger>
              <TabsTrigger value="crop" className="flex-1">
                Crop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="adjust" className="mt-0">
              <div className="relative aspect-video bg-black/10 rounded-lg overflow-hidden">
                <img
                  src={selectedImage.processedUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
                {(selectedImage.isProcessing || isAdjusting) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="crop" className="mt-0">
              <ImageCropper imageUrl={selectedImage.originalUrl} onCropChange={handleCropChange} />
              <div className="mt-4">
                <Button onClick={handleApplyCrop} className="w-full">
                  Apply Crop
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="w-full md:w-1/3 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="brightness">Brightness</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustBrightness(-5)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    id="brightness-input"
                    type="number"
                    value={brightness}
                    onChange={handleBrightnessInput}
                    className="w-16 h-8 text-center"
                    min="-100"
                    max="100"
                  />
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustBrightness(5)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                id="brightness"
                min={-100}
                max={100}
                step={1}
                value={[brightness]}
                onValueChange={handleBrightnessChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="contrast">Contrast</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustContrast(-5)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    id="contrast-input"
                    type="number"
                    value={contrast}
                    onChange={handleContrastInput}
                    className="w-16 h-8 text-center"
                    min="-100"
                    max="100"
                  />
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => adjustContrast(5)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                id="contrast"
                min={-100}
                max={100}
                step={1}
                value={[contrast]}
                onValueChange={handleContrastChange}
              />
            </div>
          </div>

          <Button onClick={handleApplyChanges} className="w-full" disabled={selectedImage.isProcessing || isAdjusting}>
            Apply Changes
          </Button>

          <Button
            variant="destructive"
            className="w-full flex items-center gap-2"
            onClick={() => onRemoveImage(selectedImage.id)}
          >
            <Trash2 className="h-4 w-4" />
            Remove Image
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">All Images</h3>
        <div className="flex overflow-x-auto pb-2 gap-2">
          {images.map((image) => (
            <div
              key={image.id}
              className={cn(
                "relative flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2",
                selectedImageId === image.id ? "border-primary" : "border-transparent hover:border-primary/50",
              )}
              onClick={() => onSelectImage(image.id)}
            >
              <img src={image.processedUrl || "/placeholder.svg"} alt="Thumbnail" className="h-16 w-16 object-cover" />
              {image.isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

