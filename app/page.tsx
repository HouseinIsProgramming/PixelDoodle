import { ImageProcessor } from "@/components/image-processor";
import Image from "next/image";
import { Github } from "lucide-react";

import pixelsvg from "../app/Pixel.svg";
import doodlesvg from "../app/Doodle.svg";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="font-bold mb-6 sr-only text-center">
        PixelDoodle - Image Processing Tool
      </h1>

      <div className="flex mt-12 justify-center items-center mb-6">
        <Image
          src={pixelsvg}
          alt=""
          width={50}
          height={100}
          className="flex-shrink flex-grow max-w-[33%] md:max-w-[15%]"
          priority
        />
        <Image
          src={doodlesvg}
          alt="Doodle Logo"
          width={50}
          className="flex-shrink flex-grow max-w-[33%] md:max-w-[15%]"
          height={120}
          priority
        />
      </div>

      <h2 className="text-center mb-6 text-2xl font-bold hover:drop-shadow-xl">
        <a
          target="_blank"
          href="https://github.com/HouseinIsProgramming/PixelDoodle"
        >
          <Button size={"default"} variant={"outline"}>
            See on Github <Github />
          </Button>
        </a>
      </h2>

      <p className="text-center mb-8 text-muted-foreground">
        Upload your notes/images and turn them into digitized notes, best used
        with note taking apps like
        <a className="text-black font-semibold" href="https://obsidian.md/">
          {" "}
          Obsidian
        </a>
        ,{" "}
        <a className="text-black font-semibold" href="https://www.notion.com/">
          Notion
        </a>{" "}
        or
        <a className="text-black font-semibold" href="https://excalidraw.com/">
          {" "}
          excalidraw
        </a>
        .
      </p>
      <ImageProcessor />
    </main>
  );
}
