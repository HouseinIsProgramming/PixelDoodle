"use client";

import type React from "react"; // Keep type import if needed elsewhere

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, RotateCcw, Lock, Unlock } from "lucide-react";
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

// No longer need ResizeHandle type
// type ResizeHandle = ... | null;

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
  // REMOVED: isResizing state
  // const [isResizing, setIsResizing] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    const cropWidth = Math.round(imgWidth * 0.6);
    const cropHeight = Math.round(cropWidth / originalAspectRatio);
    const x = Math.round((imgWidth - cropWidth) / 2);
    const y = Math.round((imgHeight - cropHeight) / 2);

    const newCrop = { x, y, width: cropWidth, height: cropHeight };
    setCrop(newCrop);
    onCropChange(newCrop);

    setWidthInput(cropWidth.toString());
    setHeightInput(cropHeight.toString());

    // Keep initial scale calculation if you implemented it, otherwise set to 1
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

    // Calculate the offset from container edges to the centered image
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;

    // Adjust mouse coordinates to the image's coordinate system
    const x =
      (e.clientX - rect.left - containerCenterX) / scale + imageSize.width / 2;
    const y =
      (e.clientY - rect.top - containerCenterY) / scale + imageSize.height / 2;

    // Check if click is inside crop area using proper bounds
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

    // Calculate the offset from container edges to the centered image
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;

    // Adjust mouse coordinates to the image's coordinate system
    const x =
      (e.clientX - rect.left - containerCenterX) / scale + imageSize.width / 2;
    const y =
      (e.clientY - rect.top - containerCenterY) / scale + imageSize.height / 2;

    // Calculate new top-left position based on drag start offset
    let newX = x - dragStart.x;
    let newY = y - dragStart.y;

    // Constrain to image bounds
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
      // Reset cursor if needed (or handle in mouse leave/move)
      if (containerRef.current) containerRef.current.style.cursor = "default";
    }
    // REMOVED: setIsResizing(null);
  };

  // Handle mouse leaving the container
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      // Consider resetting cursor here as well
      if (containerRef.current) containerRef.current.style.cursor = "default";
    }
  };

  // REMOVED: getCursorStyle function
  // const getCursorStyle = ...

  // REMOVED: handleMouseMoveForCursor function
  // const handleMouseMoveForCursor = ...

  // --- Width/Height Input Handlers remain the same ---
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidthInput(e.target.value);
    if (!crop) return;
    const width = Number.parseInt(e.target.value);
    // ... (rest of validation and update logic remains the same) ...
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
    // ... (rest of validation and update logic remains the same) ...
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
  // --- End Width/Height Input Handlers ---

  // Toggle aspect ratio lock
  const toggleAspectRatioLock = () => {
    setLockAspectRatio(!lockAspectRatio);
  };

  // Handle zoom in/out/reset remain the same
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev * 1.25, 5)); // Example: Max zoom 5x
  };
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev * 0.8, 0.1)); // Example: Min zoom 0.1x
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
      {/* Top controls remain the same */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2">
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
        <div className="flex items-center space-x-2">
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
                    <Lock className="h-4 w-4 mr-1" />
                  ) : (
                    <Unlock className="h-4 w-4 mr-1" />
                  )}{" "}
                  {lockAspectRatio ? "Locked" : "Unlocked"}
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
      </div>

      {/* Input fields remain the same */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
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
        <div className="space-y-2">
          <Label htmlFor="height">Height (px)</Label>
          <Input
            id="height"
            type="number"
            value={heightInput}
            onChange={handleHeightChange}
            min="1"
            max={imageSize.height.toString()}
          />
        </div>
      </div>

      {/* Error display remains the same */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Image container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-black/10 rounded-lg cursor-move" // Default cursor can be 'move' now or set in handleMouseDown
        style={{ height: "400px" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove} // Only need handleMouseMove now
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave} // Use modified handleMouseLeave
      >
        {/* Scaled image container */}
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

          {/* Crop overlay */}
          {crop && (
            <div
              className="absolute border-2 border-white shadow-lg pointer-events-none" // Ensure overlay doesn't interfere with mouse events on container
              style={{
                top: crop.y,
                left: crop.x,
                width: crop.width,
                height: crop.height,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div className="absolute inset-0 border border-white border-dashed" />

              {/* REMOVED: Resize handles */}
              {/* <div className="absolute w-4 h-4 ... /> ... */}
            </div>
          )}
        </div>
      </div>

      {/* Help text remains the same */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Drag the center to move the crop area. Use inputs to resize.</p>
      </div>
    </div>
  );
}
