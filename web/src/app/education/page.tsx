import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const edu = [
  { name: "GPI", value: 1.01 },
  { name: "STR", value: 24 },
  { name: "SEE pass %", value: 61.8 },
];

export default function EducationPage() {
  return (
    <DomainPage id="education">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Access & outcomes</h2>
        <SimpleBars data={edu} xKey="name" yKey="value" color="#7BDFF2" />
      </div>
    </DomainPage>
  );
}
