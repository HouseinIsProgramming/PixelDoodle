"use client";

import type React from "react"; // Keep type import if needed elsewhere

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw, Unlink, Link } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageCropperProps {
  imageUrl: string;
  onCropChange: (
    crop: { x: number; y: number; width: number; height: number } | null
  ) => void;
}

export function ImageCropper({ imageUrl, onCropChange }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [widthPercentage, setWidthPercentage] = useState(60); // Default 60% of image width
  const [heightPercentage, setHeightPercentage] = useState(60); // Default 60% of image height

  // Initialize crop area when image loads
  useEffect(() => {
    const img = imageRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      initializeCrop(img);
    }
  }, [imageUrl]);

  // Handle image load
  const handleImageLoad = () => {
    const img = imageRef.current;
    if (img) {
      initializeCrop(img);
    }
  };

  // Initialize crop area
  const initializeCrop = (img: HTMLImageElement) => {
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    setImageSize({ width: imgWidth, height: imgHeight });
    const originalAspectRatio = imgWidth / imgHeight;
    setAspectRatio(originalAspectRatio);

    // Set crop to 60% of image dimensions, centered (or adjust as needed)
    const cropWidth = Math.floor(imgWidth * 0.6);
    const cropHeight = Math.floor(cropWidth / originalAspectRatio);
    const x = Math.floor((imgWidth - cropWidth) / 2);
    const y = Math.floor((imgHeight - cropHeight) / 2);

    const newCrop = { x, y, width: cropWidth, height: cropHeight };
    setCrop(newCrop);
    onCropChange(newCrop);

    setWidthInput(cropWidth.toString());
    setHeightInput(cropHeight.toString());
    setWidthPercentage(60); // Initialize slider to 60%
    setHeightPercentage(60); // Initialize slider to 60%

    const container = containerRef.current;
    if (container) {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleX = containerWidth / imgWidth;
      const scaleY = containerHeight / imgHeight;
      const initialScale = Math.min(scaleX, scaleY, 1);
      setScale(initialScale);
    } else {
      setScale(0.5);
    }
    setError(null);
  };

  useEffect(() => {
    if (crop) {
      setWidthInput(Math.round(crop.width).toString());
      setHeightInput(Math.round(crop.height).toString());
    }
  }, [crop]);

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!crop) return;

    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;

    const x =
      (e.clientX - rect.left - containerCenterX) / scale + imageSize.width / 2;
    const y =
      (e.clientY - rect.top - containerCenterY) / scale + imageSize.height / 2;

    if (
      x >= crop.x &&
      x <= crop.x + crop.width &&
      y >= crop.y &&
      y <= crop.y + crop.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - crop.x, y: y - crop.y });
      container.style.cursor = "move";
    }
  };

  // Handle mouse move to drag crop area
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !crop) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();

    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;

    const x =
      (e.clientX - rect.left - containerCenterX) / scale + imageSize.width / 2;
    const y =
      (e.clientY - rect.top - containerCenterY) / scale + imageSize.height / 2;

    let newX = x - dragStart.x;
    let newY = y - dragStart.y;

    newX = Math.max(0, Math.min(newX, imageSize.width - crop.width));
    newY = Math.max(0, Math.min(newY, imageSize.height - crop.height));

    const newCrop = { ...crop, x: newX, y: newY };
    setCrop(newCrop);
    onCropChange(newCrop);
    setError(null);
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (containerRef.current) containerRef.current.style.cursor = "default";
    }
  };

  // Handle mouse leaving the container
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (containerRef.current) containerRef.current.style.cursor = "default";
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthInput(e.target.value);
    if (!crop) return;
    const width = Number.parseInt(e.target.value);
    if (isNaN(width) || width <= 0) {
      setError("Width must be a positive number");
      return;
    }
    if (width > imageSize.width) {
      setError(`Width cannot exceed image width (${imageSize.width}px)`);
      return;
    }
    let height = crop.height;
    if (lockAspectRatio) {
      height = width / aspectRatio;
      if (height > imageSize.height) {
        setError(
          `Resulting height (${Math.round(height)}px) exceeds image height (${
            imageSize.height
          }px)`
        );
        return;
      }
      setHeightInput(Math.round(height).toString());
    }
    let x = crop.x;
    let y = crop.y;
    if (x + width > imageSize.width) {
      x = Math.max(0, imageSize.width - width);
    }
    if (y + height > imageSize.height) {
      y = Math.max(0, imageSize.height - height);
    }
    const newCrop = { x, y, width, height };
    setCrop(newCrop);
    onCropChange(newCrop);
    setError(null);
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeightInput(e.target.value);
    if (!crop) return;
    const height = Number.parseInt(e.target.value);
    if (isNaN(height) || height <= 0) {
      setError("Height must be a positive number");
      return;
    }
    if (height > imageSize.height) {
      setError(`Height cannot exceed image height (${imageSize.height}px)`);
      return;
    }
    let width = crop.width;
    if (lockAspectRatio) {
      width = height * aspectRatio;
      if (width > imageSize.width) {
        setError(
          `Resulting width (${Math.round(width)}px) exceeds image width (${
            imageSize.width
          }px)`
        );
        return;
      }
      setWidthInput(Math.round(width).toString());
    }
    let x = crop.x;
    let y = crop.y;
    if (x + width > imageSize.width) {
      x = Math.max(0, imageSize.width - width);
    }
    if (y + height > imageSize.height) {
      y = Math.max(0, imageSize.height - height);
    }
    const newCrop = { x, y, width, height };
    setCrop(newCrop);
    onCropChange(newCrop);
    setError(null);
  };

  const handleWidthSliderChange = (value: number[]) => {
    if (!crop || !imageSize.width) return;

    const percentage = Math.floor(value[0]); // Round down to nearest integer
    setWidthPercentage(percentage);

    const newWidth = Math.floor((imageSize.width * percentage) / 100);
    let newHeight = crop.height;

    if (lockAspectRatio) {
      newHeight = Math.floor(newWidth / aspectRatio);
      if (newHeight > imageSize.height) {
        setError(`Resulting height would exceed image height`);
        return;
      }
      const newHeightPercentage = Math.floor(
        (newHeight / imageSize.height) * 100
      );
      setHeightPercentage(newHeightPercentage);
    }

    let newX = crop.x;
    let newY = crop.y;

    if (newX + newWidth > imageSize.width) {
      newX = Math.max(0, imageSize.width - newWidth);
    }

    if (newY + newHeight > imageSize.height) {
      newY = Math.max(0, imageSize.height - newHeight);
    }

    const newCrop = { x: newX, y: newY, width: newWidth, height: newHeight };
    setCrop(newCrop);
    onCropChange(newCrop);

    setWidthInput(Math.floor(newWidth).toString());
    setHeightInput(Math.floor(newHeight).toString());
    setError(null);
  };

  const handleHeightSliderChange = (value: number[]) => {
    if (!crop || !imageSize.height) return;

    const percentage = Math.floor(value[0]); // Round down to nearest integer
    setHeightPercentage(percentage);

    const newHeight = Math.floor((imageSize.height * percentage) / 100);
    let newWidth = crop.width;

    if (lockAspectRatio) {
      newWidth = Math.floor(newHeight * aspectRatio);
      if (newWidth > imageSize.width) {
        setError(`Resulting width would exceed image width`);
        return;
      }
      const newWidthPercentage = Math.floor((newWidth / imageSize.width) * 100);
      setWidthPercentage(newWidthPercentage);
    }

    let newX = crop.x;
    let newY = crop.y;

    if (newX + newWidth > imageSize.width) {
      newX = Math.max(0, imageSize.width - newWidth);
    }

    if (newY + newHeight > imageSize.height) {
      newY = Math.max(0, imageSize.height - newHeight);
    }

    const newCrop = { x: newX, y: newY, width: newWidth, height: newHeight };
    setCrop(newCrop);
    onCropChange(newCrop);

    setWidthInput(Math.floor(newWidth).toString());
    setHeightInput(Math.floor(newHeight).toString());
    setError(null);
  };

  const toggleAspectRatioLock = () => {
    setLockAspectRatio(!lockAspectRatio);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.25, 5));
  };
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev * 0.8, 0.1));
  };
  const handleReset = () => {
    const img = imageRef.current;
    if (img) {
      initializeCrop(img);
    }
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="grid md:grid-cols-[2fr_1fr] w-full mr-12 items-end gap-4 mb-4">
          <div className="">
            <Label htmlFor="width">Width (px)</Label>
            <Input
              id="width"
              type="number"
              value={widthInput}
              onChange={handleWidthChange}
              min="1"
              max={imageSize.width.toString()}
            />
          </div>

          <div className="flex flex-col gap-1 ">
            <div className="text-xs text-muted-foreground flex justify-center justify-between">
              <span>10%</span>
              <span>100%</span>
            </div>
            <div className="flex gap-1 items-baseline">
              <Slider
                value={[widthPercentage]}
                onValueChange={handleWidthSliderChange}
                min={10}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-center text-muted-foreground">
                {widthPercentage}%
              </div>
            </div>
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="height">Height (px)</Label>
            <div className="mb-1 absolute right-0 -z-0 bottom-[46px]">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAspectRatioLock}
                      className={lockAspectRatio ? "bg-primary/10" : ""}
                    >
                      {lockAspectRatio ? (
                        <Link className="h-4 w-4" />
                      ) : (
                        <Unlink className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {lockAspectRatio
                      ? "Aspect ratio is locked..."
                      : "Aspect ratio is unlocked..."}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Input
              className="z-10 relative"
              id="height"
              type="number"
              value={heightInput}
              onChange={handleHeightChange}
              min="1"
              max={imageSize.height.toString()}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-xs text-muted-fs flex justify-between">
              <span>10%</span>
              <span>100%</span>
            </div>
            <div className="flex gap-1 items-baseline ">
              <Slider
                value={[heightPercentage]}
                onValueChange={handleHeightSliderChange}
                min={10}
                max={100}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-center text-muted-foreground">
                {heightPercentage}%
              </div>
            </div>
          </div>
        </div>

        <div className="grid mt-8 mb-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4 mr-1" /> Zoom In
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 mr-1" /> Zoom Out
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md mb-4">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative overflow-hidden bg-black/10 rounded-lg cursor-move"
        style={{ height: "400px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center",
            transition: "transform 0.1s ease-out",
          }}
        >
          <img
            ref={imageRef}
            src={imageUrl || "/placeholder.svg"}
            alt="Crop preview"
            className="max-w-none"
            onLoad={handleImageLoad}
            style={{ display: "block", pointerEvents: "none" }}
          />

          {crop && (
            <div
              className="absolute border-2 border-white shadow-lg pointer-events-none"
              style={{
                top: crop.y,
                left: crop.x,
                width: crop.width,
                height: crop.height,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div className="absolute inset-0 border border-white border-dashed" />
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Drag the center to move the crop area. Use inputs to resize.</p>
      </div>
    </div>
  );
}
