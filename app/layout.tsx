import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
