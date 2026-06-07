import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Tracker from "@/components/Tracker";
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

  const resolvedHost = host || "www.topproductofficial.com";
  const normalizedHost = resolvedHost === "topproductofficial.com" ? "www.topproductofficial.com" : resolvedHost;
  const metadataBase = new URL(`https://${normalizedHost}`);

  // Define base path for icons based on vertical
  // If vertical is 'health', path is /icons/health/
  // If 'default' (no subdomain), path is /icons/default/
  const iconPath = `/icons/${vertical}`;

  return {
    metadataBase,
    title: {
      template: "%s",
      default: "Advertising Automation Platform | Top Product Official",
    },
    description:
      "Internal advertising operations platform with documented Google Ads API use case and compliance pages.",
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
      siteName: "Top Product Official",
      images: [
        {
          url: `/og/${vertical}.png`, // Dynamic OG image per vertical
          width: 1200,
          height: 630,
          alt: "Top Product Official",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const locale = headerList.get("x-locale") || "en";

  return (
    <html lang={locale} className={inter.variable}>
      <body className="antialiased bg-gray-50 font-sans">
        <Suspense fallback={null}>
          <Tracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
