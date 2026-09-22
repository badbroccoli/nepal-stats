import { AgePyramidChart } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";
import { AGE_PYRAMID } from "@/lib/seed/metrics";

export default function PeoplePage() {
  return (
    <DomainPage id="people">
      <div className="mt-8">
        <h2 className="mb-3 display text-xl">Age structure (illustrative millions)</h2>
        <AgePyramidChart data={AGE_PYRAMID} />
      </div>
    </DomainPage>
  );
}
