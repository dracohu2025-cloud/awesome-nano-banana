import type { Metadata } from "next";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "GPT-Image-2 & Nano Banana",
  description: "Explore 200+ curated GPT-Image-2 and Nano Banana prompts for AI image generation. Free prompt templates for realistic portraits, creative art, and stunning visuals.",
  keywords: [
    "Nano Banana",
    "Nano Banana Pro",
    "Gemini 3.0 Pro",
    "Gemini Pro Image",
    "Gemini image generation",
    "AI image prompts",
    "AI art prompts",
    "text to image prompts",
    "AI portrait prompts",
    "realistic AI images",
    "prompt templates",
    "Gemini prompts",
    "Google Gemini",
    "AI art gallery",
    "image generation",
  ].join(", "),
  authors: [{ name: "Nano Banana Community" }],
  creator: "Nano Banana Community",
  publisher: "Awesome AIGC Image Gallery",
  metadataBase: new URL("https://banana.aigc.green"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "GPT-Image-2 & Nano Banana",
    description: "Explore 200+ curated GPT-Image-2 and Nano Banana prompts for stunning AI image generation",
    type: "website",
    locale: "en_US",
    url: "https://banana.aigc.green",
    siteName: "Awesome AIGC Image Gallery",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Awesome AIGC Image Gallery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GPT-Image-2 & Nano Banana",
    description: "200+ curated AI image generation prompts",
    images: ["/og-image.png"],
  },
  verification: {
    google: "google-site-verification-code", // Replace with actual code when available
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MSVLC6QSMK"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MSVLC6QSMK');
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-grid min-h-screen`}>
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
