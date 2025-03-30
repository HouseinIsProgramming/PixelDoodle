import JSZip from "jszip";

/**
 * Fetch an image from a data URL and add it to a ZIP file
 */
export async function addImageToZip(
  zip: JSZip,
  dataUrl: string,
  filename: string
): Promise<void> {
  // For data URLs, extract the base64 content
  if (dataUrl.startsWith("data:")) {
    const parts = dataUrl.split(",");
    const base64Data = parts[1];
    zip.file(filename, base64Data, { base64: true });
  } else {
    // For remote URLs, fetch the image first
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      zip.file(filename, blob);
    } catch (error) {
      console.error(`Failed to add ${filename} to zip:`, error);
    }
  }
}

/**
 * Create and download a ZIP file containing multiple images
 */
export async function downloadImagesAsZip(
  images: { url: string; filename: string }[],
  zipFilename: string = "processed-images.zip"
): Promise<void> {
  const zip = new JSZip();

  // Add all images to the zip
  const promises = images.map((image) =>
    addImageToZip(zip, image.url, image.filename)
  );

  try {
    // Wait for all images to be added
    await Promise.all(promises);

    // Generate the zip file
    const content = await zip.generateAsync({ type: "blob" });

    // Create a download link and trigger the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = zipFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  } catch (error) {
    console.error("Failed to create zip file:", error);
  }
}
