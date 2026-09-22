import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const env = [
  { name: "KTM AQI", value: 112 },
  { name: "Forest %", value: 44.7 },
  { name: "CO₂ t/pc", value: 0.6 },
  { name: "Protected", value: 22 },
];

export default function EnvironmentPage() {
  return (
    <DomainPage id="environment">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Climate & livability</h2>
        <SimpleBars data={env} xKey="name" yKey="value" color="#2EC4B6" />
        <p className="mt-3 text-xs text-[var(--muted)]">
          Set <code className="mono">WAQI_TOKEN</code> to overwrite Kathmandu AQI
          from the live WAQI feed.
        </p>
      </div>
    </DomainPage>
  );
}
