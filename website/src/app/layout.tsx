import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "🍌 Nano Banana Gallery - AI Image Prompts Collection",
  description: "Explore 100+ curated Gemini Nano Banana and GPT-4o image generation prompts. Get AI-ready prompts to recreate stunning visuals.",
  keywords: "Nano Banana, Gemini, GPT-4o, AI image generation, prompts, image editing, AI art",
  authors: [{ name: "JimmyLv" }],
  openGraph: {
    title: "🍌 Nano Banana Gallery",
    description: "Explore 100+ curated AI image generation prompts",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🍌 Nano Banana Gallery",
    description: "Explore 100+ curated AI image generation prompts",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-grid min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
