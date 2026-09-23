import { SimpleArea, SimpleBars, DonutMix } from "@/components/Charts";
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

const remittanceShare = [
  { name: "Remittance", value: 26, color: "#F4D35E" },
  { name: "Rest of GDP", value: 74, color: "#2a2a28" },
];

export default function EconomyPage() {
  return (
    <DomainPage id="economy">
      <div className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="section-kicker mb-2">Inflows</div>
          <h2 className="display mb-3 text-xl">Remittance inflows (bn NPR)</h2>
          <SimpleArea data={remittanceTrend} xKey="year" yKey="bn" />
        </div>
        <div>
          <div className="section-kicker mb-2">Weight</div>
          <h2 className="display mb-3 text-xl">Remittance vs GDP (illustrative)</h2>
          <DonutMix
            data={remittanceShare}
            centerLabel="of GDP"
            centerValue="~26%"
          />
        </div>
      </div>
      <div className="mt-8">
        <div className="section-kicker mb-2">Macro</div>
        <h2 className="display mb-3 text-xl">Macro snapshot (%)</h2>
        <SimpleBars data={trade} xKey="name" yKey="value" color="#F4D35E" />
      </div>
    </DomainPage>
  );
}
