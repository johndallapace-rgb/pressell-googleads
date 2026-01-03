import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Tracker from "@/components/Tracker";
import SWRegister from "@/components/SWRegister";
import { Suspense } from "react";
import { getVerticalFromHost } from "@/lib/host";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const host = headerList.get("host");
  const vertical = getVerticalFromHost(host) || "default";

  // Define base path for icons based on vertical
  // If vertical is 'health', path is /icons/health/
  // If 'default' (no subdomain), path is /icons/default/
  const iconPath = `/icons/${vertical}`;

  return {
    title: {
      template: "%s | TopProductDigest",
      default: "TopProductDigest - Independent Reviews",
    },
    description: "Expert reviews and independent analysis of top-rated products.",
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: `${iconPath}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
        { url: `${iconPath}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
        { url: `${iconPath}/favicon.ico`, sizes: "any" }, // Fallback for some browsers
      ],
      apple: [
        { url: `${iconPath}/apple-touch-icon.png`, sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "mask-icon",
          url: `${iconPath}/safari-pinned-tab.svg`, // Optional, fallback to default if missing
          color: "#2563eb", // Blue-600
        },
      ],
    },
    openGraph: {
      type: "website",
      siteName: "TopProductDigest",
      images: [
        {
          url: `/og/${vertical}.png`, // Dynamic OG image per vertical
          width: 1200,
          height: 630,
          alt: "TopProductDigest Review",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-gray-50 font-sans">
        <SWRegister />
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
