import { AgePyramidChart, DonutMix, RadialScore } from "@/components/Charts";
import { DomainPage } from "@/components/DomainPage";
import { ScaleLegend } from "@/components/visual/ScaleLegend";
import { AGE_PYRAMID, DOMAIN_METRICS } from "@/lib/seed/metrics";
import { colorAt, SCALES } from "@/lib/scales";

export default function PeoplePage() {
  const metrics = DOMAIN_METRICS.people;
  const literacy = Number(metrics.find((m) => m.key === "literacy")?.value ?? 76);
  const urban = Number(metrics.find((m) => m.key === "urban_share")?.value ?? 66);
  const hdi = Number(metrics.find((m) => m.key === "hdi")?.value ?? 0.6);
  const litColor = colorAt(SCALES.literacy, literacy);
  const hdiColor = colorAt(SCALES.hdi, hdi);

  const urbanRural = [
    { name: "Urban", value: urban, color: colorAt(SCALES.urban_share, urban) },
    {
      name: "Rural",
      value: Math.max(0, 100 - urban),
      color: colorAt(SCALES.urban_share, Math.max(0, 100 - urban)),
    },
  ];

  return (
    <DomainPage id="people">
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <div>
          <div className="section-kicker mb-2">Literacy</div>
          <h2 className="display mb-3 text-xl">Reading Nepal</h2>
          <RadialScore value={literacy} label="Literacy %" color={litColor} />
          <div className="panel mt-3 rounded-sm p-3">
            <ScaleLegend scale={SCALES.literacy} value={literacy} />
          </div>
        </div>
        <div>
          <div className="section-kicker mb-2">Settlement</div>
          <h2 className="display mb-3 text-xl">Urban vs rural</h2>
          <DonutMix
            data={urbanRural}
            centerLabel="Urban"
            centerValue={`${urban}%`}
          />
          <div className="panel mt-3 rounded-sm p-3">
            <ScaleLegend scale={SCALES.urban_share} value={urban} />
          </div>
        </div>
        <div>
          <div className="section-kicker mb-2">Development</div>
          <h2 className="display mb-3 text-xl">HDI score</h2>
          <RadialScore
            value={Math.round(hdi * 100)}
            label="HDI ×100"
            color={hdiColor}
          />
          <div className="panel mt-3 rounded-sm p-3">
            <ScaleLegend scale={SCALES.hdi} value={hdi} />
          </div>
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
