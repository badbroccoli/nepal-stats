import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const digital = [
  { name: "Voice pen %", value: 119.9 },
  { name: "Mobile BB %", value: 66.5 },
  { name: "Fixed BB m", value: 13.8 },
  { name: "Mobile m", value: 38.3 },
];

export default function DigitalPage() {
  return (
    <DomainPage id="digital">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">NTA connectivity snapshot</h2>
        <SimpleBars data={digital} xKey="name" yKey="value" color="#4CC9F0" />
      </div>
    </DomainPage>
  );
}
