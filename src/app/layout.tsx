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
  title: "NepalStats — One-stop national dashboard",
  description:
    "Real-time and curated statistics for Nepal: people, economy, disasters, tourism, health, education, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Load outside the Tailwind/PostCSS pipeline — MapLibre's minified CSS
            breaks @tailwindcss/postcss when imported via globals.css. */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/maplibre-gl@6.10.0/dist/maplibre-gl.css"
          crossOrigin="anonymous"
        />
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
