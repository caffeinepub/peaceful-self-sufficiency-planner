import { BarChart2, Download, Leaf, Shield, Upload } from "lucide-react";

export function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          About the Planner
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          What this tool is and how it works
        </p>
      </div>

      {/* Section 1: What it does */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-lg text-foreground">
            What this app does
          </h2>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3 bg-card border border-border rounded-xl p-5">
          <p>
            The{" "}
            <strong className="text-foreground">
              Peaceful Self-Sufficiency Planner
            </strong>{" "}
            helps you understand and improve how well-prepared different
            properties or homesteads are for independent living.
          </p>
          <p>
            You create <em>location profiles</em> — each representing a property
            you own, are considering, or are actively developing. For each
            location, you fill in details across five areas of self-sufficient
            living. The app calculates a{" "}
            <strong className="text-foreground">
              Peaceful Self-Sufficiency Score (0–100)
            </strong>{" "}
            and helps you understand where your strengths are and where small
            investments could make the biggest difference.
          </p>
          <p>
            You can compare up to four locations side by side, simulate
            quiet-week scenarios, and export your data for safekeeping.
          </p>
        </div>
      </section>

      {/* Section 2: How scoring works */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-lg text-foreground">
            How scoring works
          </h2>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-4 bg-card border border-border rounded-xl p-5">
          <p>
            The overall score is a weighted average of five pillar scores, each
            out of 100:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                icon: "⚡",
                name: "Energy Comfort",
                weight: "20%",
                desc: "Solar capacity, battery backup, generator availability, and daily usage balance.",
              },
              {
                icon: "💧",
                name: "Water Security",
                weight: "20%",
                desc: "Storage days, water source reliability, gravity feed, and filtration quality.",
              },
              {
                icon: "🌱",
                name: "Food Continuity",
                weight: "25%",
                desc: "Stored food duration, garden size, livestock, and root cellar preservation.",
              },
              {
                icon: "🏠",
                name: "Home Comfort Independence",
                weight: "20%",
                desc: "Primary and backup heating and cooking sources, off-grid resilience.",
              },
              {
                icon: "🔧",
                name: "Buffers & Rhythm",
                weight: "15%",
                desc: "Fuel and feed reserves, spare parts, tool completeness, and self-reliance cadence.",
              },
            ].map(({ icon, name, weight, desc }) => (
              <div
                key={name}
                className="flex gap-3 p-3 rounded-lg bg-accent/20 border border-border"
              >
                <span className="text-lg shrink-0">{icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-foreground">{name}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {weight}
                    </span>
                  </div>
                  <p className="text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs">
            Each score uses your inputs to compute a realistic picture of that
            pillar&apos;s resilience. No score is a judgment — it&apos;s just a
            starting point for reflection.
          </p>
        </div>
      </section>

      {/* Section 3: Privacy */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-lg text-foreground">
            Privacy &amp; data storage
          </h2>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed bg-card border border-border rounded-xl p-5">
          <p>
            <strong className="text-foreground">
              All data is stored entirely in your browser
            </strong>{" "}
            using{" "}
            <code className="text-xs bg-accent/40 px-1.5 py-0.5 rounded font-mono">
              localStorage
            </code>
            . Nothing is sent to any server, cloud service, or third party —
            ever.
          </p>
          <p className="mt-2">
            Your homestead data stays private, on your device. Clearing your
            browser storage will erase it, which is why we recommend regular
            exports.
          </p>
        </div>
      </section>

      {/* Section 4: Export/Import */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <h2 className="font-display font-semibold text-lg text-foreground">
            Backup &amp; restore
          </h2>
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-4 bg-card border border-border rounded-xl p-5">
          <div className="flex gap-3">
            <Download className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">
                Exporting your data
              </p>
              <p>
                On the Locations screen, click{" "}
                <strong className="text-foreground">Export</strong>. This
                downloads a{" "}
                <code className="text-xs bg-accent/40 px-1.5 py-0.5 rounded font-mono">
                  pss-backup.json
                </code>{" "}
                file containing all your location profiles. Store it somewhere
                safe — a USB drive, another device, or a cloud folder.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Upload className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">
                Importing your data
              </p>
              <p>
                Click <strong className="text-foreground">Import</strong> and
                select your backup JSON file. Existing locations with the same
                ID will be updated; new ones will be added. This is safe to do
                as often as you like.
              </p>
            </div>
          </div>
          <p className="text-xs pt-2 border-t border-border">
            We recommend exporting every time you make significant changes to
            your location profiles.
          </p>
        </div>
      </section>

      {/* Version */}
      <p className="text-xs text-muted-foreground text-center pb-4">v1.07</p>
    </div>
  );
}
