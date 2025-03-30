/**
 * Utility for extracting black pixels from an image and removing the background.
 * Adapted from the Jimp implementation to work in browser environments.
 */

// Threshold for determining which pixels are considered "black" (R+G+B sum)
const BLACK_THRESHOLD = 450;

/**
 * Extracts black pixels from an image and removes all other content.
 * Returns a new image with only the black pixels on a transparent background.
 *
 * @param imageUrl URL or data URL of the image to process
 * @returns Promise resolving to a data URL of the processed image
 */
export async function extractBlackPixels(imageUrl: string): Promise<string> {
  // Create a promise to handle the asynchronous image loading
  return new Promise((resolve, reject) => {
    // Create an image element to load the source image
    const img = new Image();
    img.crossOrigin = "anonymous"; // Enable CORS for images from other domains

    // Set up the onload handler to process the image once it's loaded
    img.onload = () => {
      try {
        // Create a canvas with the same dimensions as the loaded image
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        // Get the 2D context to draw and manipulate pixels
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw the original image onto the canvas
        ctx.drawImage(img, 0, 0);

        // Get the image data to access and manipulate individual pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;

        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];

          // Calculate the sum of RGB values
          const colorSum = red + green + blue;

          // Check if this pixel is considered "black"
          if (colorSum < BLACK_THRESHOLD) {
            // Keep this pixel as black
            data[i] = 0; // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            data[i + 3] = 255; // A (fully opaque)
          } else {
            // Make everything else transparent
            data[i + 3] = 0; // A (fully transparent)
          }
        }

        // Put the modified pixels back on the canvas
        ctx.putImageData(imageData, 0, 0);

        // Convert the canvas to a data URL and resolve the promise
        const outputDataUrl = canvas.toDataURL("image/png");
        resolve(outputDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    // Handle errors during image loading
    img.onerror = (error) => {
      reject(new Error(`Failed to load image: ${error}`));
    };

    // Start loading the image
    img.src = imageUrl;
  });
}

/**
 * Checks if the environment supports canvas operations needed for pixel extraction.
 * @returns Boolean indicating whether the current environment supports the required features
 */
export function isExtractionSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas && canvas.getContext && canvas.getContext("2d"));
  } catch (e) {
    return false;
  }
}
