"use client";

import type React from "react";

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

type ResizeHandle =
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | null;

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
  const [isResizing, setIsResizing] = useState<ResizeHandle>(null);
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

    // Calculate aspect ratio of the original image
    const originalAspectRatio = imgWidth / imgHeight;
    setAspectRatio(originalAspectRatio);

    // Set crop to 75% of image dimensions, centered
    const cropWidth = Math.round(imgWidth * 0.75);
    const cropHeight = Math.round(cropWidth / originalAspectRatio);

    // Center the crop
    const x = Math.round((imgWidth - cropWidth) / 2);
    const y = Math.round((imgHeight - cropHeight) / 2);

    const newCrop = { x, y, width: cropWidth, height: cropHeight };
    setCrop(newCrop);
    onCropChange(newCrop);

    // Set initial input values
    setWidthInput(cropWidth.toString());
    setHeightInput(cropHeight.toString());

    // Reset scale to show the entire image
    setScale(1 / 5);
  };

  // Update input fields when crop changes
  useEffect(() => {
    if (crop) {
      setWidthInput(Math.round(crop.width).toString());
      setHeightInput(Math.round(crop.height).toString());
    }
  }, [crop]);

  // Check if a point is near a corner
  const getResizeHandleUnderPoint = (x: number, y: number): ResizeHandle => {
    if (!crop) return null;

    const handleSize = 20 / scale; // Adjust handle hit area based on scale

    // Check each corner
    if (
      Math.abs(x - crop.x) <= handleSize &&
      Math.abs(y - crop.y) <= handleSize
    ) {
      return "topLeft";
    }
    if (
      Math.abs(x - (crop.x + crop.width)) <= handleSize &&
      Math.abs(y - crop.y) <= handleSize
    ) {
      return "topRight";
    }
    if (
      Math.abs(x - crop.x) <= handleSize &&
      Math.abs(y - (crop.y + crop.height)) <= handleSize
    ) {
      return "bottomLeft";
    }
    if (
      Math.abs(x - (crop.x + crop.width)) <= handleSize &&
      Math.abs(y - (crop.y + crop.height)) <= handleSize
    ) {
      return "bottomRight";
    }

    return null;
  };

  // Handle mouse down to start dragging or resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!crop) return;

    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Check if we're on a resize handle
    const resizeHandle = getResizeHandleUnderPoint(x, y);

    if (resizeHandle) {
      setIsResizing(resizeHandle);
      setDragStart({ x, y });
      return;
    }

    // Check if click is inside crop area for dragging
    if (
      x >= crop.x &&
      x <= crop.x + crop.width &&
      y >= crop.y &&
      y <= crop.y + crop.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - crop.x, y: y - crop.y });
    }
  };

  // Handle mouse move to drag or resize crop area
  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!isDragging && !isResizing) || !crop) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    if (isDragging) {
      // Calculate new position
      let newX = x - dragStart.x;
      let newY = y - dragStart.y;

      // Constrain to image bounds
      newX = Math.max(0, Math.min(newX, imageSize.width - crop.width));
      newY = Math.max(0, Math.min(newY, imageSize.height - crop.height));

      const newCrop = { ...crop, x: newX, y: newY };
      setCrop(newCrop);
      onCropChange(newCrop);
      setError(null);
    } else if (isResizing) {
      let newCrop = { ...crop };

      // Handle resizing based on which corner is being dragged
      switch (isResizing) {
        case "topLeft":
          {
            const maxX = crop.x + crop.width - 20; // Minimum width constraint
            const maxY = crop.y + crop.height - 20; // Minimum height constraint

            const newX = Math.min(maxX, Math.max(0, x));
            const newY = Math.min(maxY, Math.max(0, y));

            const newWidth = crop.width + (crop.x - newX);
            const newHeight = crop.height + (crop.y - newY);

            if (lockAspectRatio) {
              // Maintain aspect ratio
              if (Math.abs(newX - crop.x) > Math.abs(newY - crop.y)) {
                // Width changed more, adjust height based on width
                const adjustedHeight = newWidth / aspectRatio;
                newCrop = {
                  x: newX,
                  y: crop.y + crop.height - adjustedHeight,
                  width: newWidth,
                  height: adjustedHeight,
                };
              } else {
                // Height changed more, adjust width based on height
                const adjustedWidth = newHeight * aspectRatio;
                newCrop = {
                  x: crop.x + crop.width - adjustedWidth,
                  y: newY,
                  width: adjustedWidth,
                  height: newHeight,
                };
              }
            } else {
              newCrop = {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
              };
            }
          }
          break;

        case "topRight":
          {
            const minX = crop.x + 20; // Minimum width constraint
            const maxY = crop.y + crop.height - 20; // Minimum height constraint

            const newX = Math.max(minX, Math.min(imageSize.width, x));
            const newY = Math.min(maxY, Math.max(0, y));

            const newWidth = newX - crop.x;
            const newHeight = crop.height + (crop.y - newY);

            if (lockAspectRatio) {
              // Maintain aspect ratio
              if (
                Math.abs(newX - (crop.x + crop.width)) > Math.abs(newY - crop.y)
              ) {
                // Width changed more, adjust height based on width
                const adjustedHeight = newWidth / aspectRatio;
                newCrop = {
                  x: crop.x,
                  y: crop.y + crop.height - adjustedHeight,
                  width: newWidth,
                  height: adjustedHeight,
                };
              } else {
                // Height changed more, adjust width based on height
                const adjustedWidth = newHeight * aspectRatio;
                newCrop = {
                  x: crop.x,
                  y: newY,
                  width: adjustedWidth,
                  height: newHeight,
                };
              }
            } else {
              newCrop = {
                x: crop.x,
                y: newY,
                width: newWidth,
                height: newHeight,
              };
            }
          }
          break;

        case "bottomLeft":
          {
            const maxX = crop.x + crop.width - 20; // Minimum width constraint
            const minY = crop.y + 20; // Minimum height constraint

            const newX = Math.min(maxX, Math.max(0, x));
            const newY = Math.max(minY, Math.min(imageSize.height, y));

            const newWidth = crop.width + (crop.x - newX);
            const newHeight = newY - crop.y;

            if (lockAspectRatio) {
              // Maintain aspect ratio
              if (
                Math.abs(newX - crop.x) >
                Math.abs(newY - (crop.y + crop.height))
              ) {
                // Width changed more, adjust height based on width
                const adjustedHeight = newWidth / aspectRatio;
                newCrop = {
                  x: newX,
                  y: crop.y,
                  width: newWidth,
                  height: adjustedHeight,
                };
              } else {
                // Height changed more, adjust width based on height
                const adjustedWidth = newHeight * aspectRatio;
                newCrop = {
                  x: crop.x + crop.width - adjustedWidth,
                  y: crop.y,
                  width: adjustedWidth,
                  height: newHeight,
                };
              }
            } else {
              newCrop = {
                x: newX,
                y: crop.y,
                width: newWidth,
                height: newHeight,
              };
            }
          }
          break;

        case "bottomRight":
          {
            const minX = crop.x + 20; // Minimum width constraint
            const minY = crop.y + 20; // Minimum height constraint

            const newX = Math.max(minX, Math.min(imageSize.width, x));
            const newY = Math.max(minY, Math.min(imageSize.height, y));

            const newWidth = newX - crop.x;
            const newHeight = newY - crop.y;

            if (lockAspectRatio) {
              // Maintain aspect ratio
              if (
                Math.abs(newX - (crop.x + crop.width)) >
                Math.abs(newY - (crop.y + crop.height))
              ) {
                // Width changed more, adjust height based on width
                const adjustedHeight = newWidth / aspectRatio;
                newCrop = {
                  x: crop.x,
                  y: crop.y,
                  width: newWidth,
                  height: adjustedHeight,
                };
              } else {
                // Height changed more, adjust width based on height
                const adjustedWidth = newHeight * aspectRatio;
                newCrop = {
                  x: crop.x,
                  y: crop.y,
                  width: adjustedWidth,
                  height: newHeight,
                };
              }
            } else {
              newCrop = {
                x: crop.x,
                y: crop.y,
                width: newWidth,
                height: newHeight,
              };
            }
          }
          break;
      }

      // Ensure crop doesn't exceed image bounds
      if (newCrop.x < 0) newCrop.x = 0;
      if (newCrop.y < 0) newCrop.y = 0;
      if (newCrop.x + newCrop.width > imageSize.width)
        newCrop.width = imageSize.width - newCrop.x;
      if (newCrop.y + newCrop.height > imageSize.height)
        newCrop.height = imageSize.height - newCrop.y;

      // Ensure minimum size
      if (newCrop.width < 20) newCrop.width = 20;
      if (newCrop.height < 20) newCrop.height = 20;

      setCrop(newCrop);
      onCropChange(newCrop);
      setError(null);
    }
  };

  // Handle mouse up to stop dragging or resizing
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  // Get cursor style based on position
  const getCursorStyle = (x: number, y: number): string => {
    if (!crop) return "default";

    const resizeHandle = getResizeHandleUnderPoint(x, y);

    if (resizeHandle) {
      switch (resizeHandle) {
        case "topLeft":
        case "bottomRight":
          return "nwse-resize";
        case "topRight":
        case "bottomLeft":
          return "nesw-resize";
      }
    }

    if (
      x >= crop.x &&
      x <= crop.x + crop.width &&
      y >= crop.y &&
      y <= crop.y + crop.height
    ) {
      return "move";
    }

    return "default";
  };

  // Handle mouse move for cursor style
  const handleMouseMoveForCursor = (e: React.MouseEvent) => {
    if (!crop || isDragging || isResizing) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale / 5;
    const y = (e.clientY - rect.top) / scale / 5;

    container.style.cursor = getCursorStyle(x, y);
  };

  // Handle width input change
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

    // Center the crop if it would go out of bounds
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

  // Handle height input change
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

    // Center the crop if it would go out of bounds
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

  // Toggle aspect ratio lock
  const toggleAspectRatioLock = () => {
    setLockAspectRatio(!lockAspectRatio);
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.05));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.05));
  };

  // Handle reset
  const handleReset = () => {
    const img = imageRef.current;
    if (img) {
      initializeCrop(img);
    }
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4 mr-1" />
            Zoom In
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4 mr-1" />
            Zoom Out
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
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
                  )}
                  {lockAspectRatio ? "Locked" : "Unlocked"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {lockAspectRatio
                  ? "Aspect ratio is locked. Width and height will scale proportionally."
                  : "Aspect ratio is unlocked. Width and height can be changed independently."}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

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

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md mb-4">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative overflow-hidden bg-black/10 rounded-lg"
        style={{
          height: "400px",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleMouseMoveForCursor(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
            style={{
              display: "block",
              pointerEvents: "none",
            }}
          />

          {crop && (
            <div
              className="absolute border-2 border-white shadow-lg"
              style={{
                top: crop.y,
                left: crop.x,
                width: crop.width,
                height: crop.height,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div className="absolute inset-0 border border-white border-dashed pointer-events-none" />

              {/* Resize handles */}
              <div
                className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full -top-2 -left-2 cursor-nwse-resize"
                style={{ transform: "translate(-50%, -50%)" }}
              />
              <div
                className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full -top-2 -right-2 cursor-nesw-resize"
                style={{ transform: "translate(50%, -50%)" }}
              />
              <div
                className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full -bottom-2 -left-2 cursor-nesw-resize"
                style={{ transform: "translate(-50%, 50%)" }}
              />
              <div
                className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full -bottom-2 -right-2 cursor-nwse-resize"
                style={{ transform: "translate(50%, 50%)" }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Drag the corners to resize or the center to move the crop area</p>
      </div>
    </div>
  );
}
