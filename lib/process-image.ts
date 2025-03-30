/**
 * Process an image with the given brightness, contrast, and crop adjustments
 * This function runs entirely in the browser using the Canvas API
 */
export async function processImage(
  file: File,
  brightness: number,
  contrast: number,
  crop?: { x: number; y: number; width: number; height: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        // Set canvas dimensions based on crop or original image
        if (crop && crop.width > 0 && crop.height > 0) {
          canvas.width = crop.width
          canvas.height = crop.height
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }

        // Draw original image with crop if specified
        if (crop && crop.width > 0 && crop.height > 0) {
          ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
        } else {
          ctx.drawImage(img, 0, 0)
        }

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Normalize brightness and contrast values
        const brightnessValue = brightness / 100
        const contrastValue = contrast / 100

        // Apply brightness and contrast adjustments
        for (let i = 0; i < data.length; i += 4) {
          // Apply brightness
          data[i] = Math.min(255, Math.max(0, data[i] + brightnessValue * 255))
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightnessValue * 255))
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightnessValue * 255))

          // Apply contrast
          const factor = (259 * (contrastValue + 1)) / (255 * (1 - contrastValue))
          data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))
          data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128))
          data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128))
        }

        // Put the modified image data back on the canvas
        ctx.putImageData(imageData, 0, 0)

        // Convert canvas to data URL
        const processedImageUrl = canvas.toDataURL(file.type || "image/jpeg")

        // Resolve with the processed image URL
        resolve(processedImageUrl)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error("Failed to load image"))
    }

    // Set image source from file
    img.src = URL.createObjectURL(file)
    img.crossOrigin = "anonymous"
  })
}

