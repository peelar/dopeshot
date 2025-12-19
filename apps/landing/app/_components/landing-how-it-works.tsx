import { Upload, Layout, Download } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Drop in a screenshot",
    description: "Drag and drop any image — product shot, code snippet, or announcement",
  },
  {
    number: "02",
    icon: Layout,
    title: "Pick a layout",
    description: "Choose from beautiful presets or keep the smart defaults",
  },
  {
    number: "03",
    icon: Download,
    title: "Export",
    description: "Download your polished asset and ship it everywhere",
  },
];

export function LandingHowItWorks() {
  return (
    <section className="relative py-20 sm:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Three steps. Zero complexity. Ship-ready assets.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-12 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connecting line (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-16 hidden h-px w-full bg-gradient-to-r from-border to-transparent md:block" />
                )}

                <div className="relative flex flex-col items-center text-center">
                  {/* Number badge */}
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted">
                    <Icon className="h-8 w-8 text-foreground" />
                  </div>

                  {/* Step number */}
                  <div className="mb-4 text-sm font-mono text-muted-foreground">
                    {step.number}
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>

                  {/* Description */}
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
