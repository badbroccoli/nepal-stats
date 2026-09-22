import { notFound } from "next/navigation";
import { getCountry } from "@/lib/countries";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) return { title: "Country not found" };
  return {
    title: `${country.name} — WorldStats`,
    description: `National pulse for ${country.name}: live map, markets, hazards, headlines, and domain statistics.`,
  };
}

export default async function CountryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  if (!getCountry(code)) notFound();
  return children;
}
