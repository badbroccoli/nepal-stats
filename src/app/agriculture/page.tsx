import { SimpleBars } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";

const agri = [
  { name: "Paddy mMT", value: 5.6 },
  { name: "Maize mMT", value: 3.0 },
  { name: "Wheat mMT", value: 2.1 },
  { name: "Rice NPR/kg", value: 68 },
];

export default function AgriculturePage() {
  return (
    <DomainPage id="agriculture">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Food & farm pulse</h2>
        <SimpleBars data={agri} xKey="name" yKey="value" color="#B5E48C" />
      </div>
    </DomainPage>
  );
}
