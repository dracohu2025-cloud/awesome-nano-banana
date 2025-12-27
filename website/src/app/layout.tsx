import type { Metadata } from "next";
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
  title: "Nano Banana Pro Prompts Gallery | Gemini 3.0 Pro Image Generation",
  description: "Explore 200+ curated Nano Banana Pro prompts for Gemini 3.0 Pro AI image generation. Free prompt templates for realistic portraits, creative art, and stunning visuals. The ultimate Nano Banana prompt collection.",
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
  publisher: "Nano Banana Gallery",
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
    title: "Nano Banana Pro Prompts Gallery | Gemini 3.0 Pro Image Generation",
    description: "Explore 200+ curated Nano Banana Pro prompts for stunning AI image generation with Gemini 3.0 Pro",
    type: "website",
    locale: "en_US",
    url: "https://banana.aigc.green",
    siteName: "Nano Banana Gallery",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nano Banana Pro Prompts Gallery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nano Banana Pro Prompts | Gemini 3.0 Pro AI Image Generation",
    description: "200+ curated AI image generation prompts for Gemini 3.0 Pro",
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
        {children}
      </body>
    </html>
  );
}
