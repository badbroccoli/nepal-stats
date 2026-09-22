import { CountryPulseView } from "@/components/CountryPulseView";
import { buildPulse } from "@/lib/connectors/pulse";
import { getCountry } from "@/lib/countries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CountryPulsePage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: code } = await params;
  const country = getCountry(code);
  if (!country) notFound();
  const pulse = await buildPulse(country.code);
  return <CountryPulseView country={country} pulse={pulse} />;
}
