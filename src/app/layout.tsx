import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nepal Real-Time Statistics Dashboard",
  description:
    "Dark-themed, map-centric national dashboard for Nepal: population, disasters, FX, and curated Nepali news.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
