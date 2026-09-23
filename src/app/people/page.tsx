import { AgePyramidChart, DonutMix, RadialScore } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";
import { AGE_PYRAMID, DOMAIN_METRICS } from "@/lib/seed/metrics";

export default function PeoplePage() {
  const metrics = DOMAIN_METRICS.people;
  const literacy = Number(metrics.find((m) => m.key === "literacy")?.value ?? 76);
  const urban = Number(metrics.find((m) => m.key === "urban_share")?.value ?? 66);
  const hdi = Number(metrics.find((m) => m.key === "hdi")?.value ?? 0.6);

  const urbanRural = [
    { name: "Urban", value: urban, color: "#3ddc97" },
    { name: "Rural", value: Math.max(0, 100 - urban), color: "#4cc9f0" },
  ];

  return (
    <DomainPage id="people">
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <div>
          <div className="section-kicker mb-2">Literacy</div>
          <h2 className="display mb-3 text-xl">Reading Nepal</h2>
          <RadialScore value={literacy} label="Literacy %" color="#7BDFF2" />
        </div>
        <div>
          <div className="section-kicker mb-2">Settlement</div>
          <h2 className="display mb-3 text-xl">Urban vs rural</h2>
          <DonutMix
            data={urbanRural}
            centerLabel="Urban"
            centerValue={`${urban}%`}
          />
        </div>
        <div>
          <div className="section-kicker mb-2">Development</div>
          <h2 className="display mb-3 text-xl">HDI score</h2>
          <RadialScore
            value={Math.round(hdi * 100)}
            label="HDI ×100"
            color="#CDB4DB"
          />
        </div>
      </div>

      <div className="mt-10">
        <div className="section-kicker mb-2">Structure</div>
        <h2 className="display mb-3 text-xl">
          Age structure (illustrative millions)
        </h2>
        <AgePyramidChart data={AGE_PYRAMID} />
      </div>
    </DomainPage>
  );
}
