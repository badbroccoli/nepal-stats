import { SimpleArea, SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const remittanceTrend = [
  { year: "FY21", bn: 961 },
  { year: "FY22", bn: 1007 },
  { year: "FY23", bn: 1220 },
  { year: "FY24", bn: 1444 },
  { year: "FY25", bn: 1724 },
  { year: "FY26", bn: 2363 },
];

const trade = [
  { name: "Exports Δ", value: 13.8 },
  { name: "Imports Δ", value: 16.2 },
  { name: "CPI", value: 5.14 },
  { name: "GDP g", value: 3.85 },
];

export default function EconomyPage() {
  return (
    <DomainPage id="economy">
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 display text-xl">Remittance inflows (bn NPR)</h2>
          <SimpleArea data={remittanceTrend} xKey="year" yKey="bn" />
        </div>
        <div>
          <h2 className="mb-3 display text-xl">Macro snapshot (%)</h2>
          <SimpleBars data={trade} xKey="name" yKey="value" color="#F4D35E" />
        </div>
      </div>
    </DomainPage>
  );
}
