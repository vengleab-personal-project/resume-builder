import type { Metadata } from "next";
import { Geist, Geist_Mono, Kantumruy_Pro } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const kantumruyPro = Kantumruy_Pro({
  variable: "--font-khmer",
  subsets: ["khmer", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ResumeBuilder - AI-Powered Resume Builder",
  description: "Build, refine, and export professional resumes with AI assistance. Upload your existing resume or start from scratch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${kantumruyPro.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
