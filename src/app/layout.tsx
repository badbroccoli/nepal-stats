import type { Metadata } from "next";
import { Instrument_Serif, Manrope, IBM_Plex_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "WorldStats — National pulse for every country",
  description:
    "Pick any country for a live national dashboard: map, headlines, markets, hazards, leadership, and domain statistics — one dynamic model for the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* MapLibre CSS cannot go through Tailwind/PostCSS (CssSyntaxError on
            its minified rules). Served as a static public asset instead. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/vendor/maplibre-gl.css" />
      </head>
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        <Nav />
        <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
