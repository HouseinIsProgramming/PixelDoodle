import { ImageProcessor } from "@/components/image-processor"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Image Processor</h1>
      <p className="text-center mb-8 text-muted-foreground">
        Upload images, adjust parameters, and download the processed results
      </p>
      <ImageProcessor />
    </main>
  )
}

