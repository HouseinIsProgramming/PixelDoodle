import type { Metadata } from "next";
import { UnsavedChangesProvider } from "@/contexts/unsaved-changes-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "PixelDoodle",
  description: "Simple image cropper, adjuster and ink outliner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UnsavedChangesProvider>{children}</UnsavedChangesProvider>
      </body>
    </html>
  );
}
