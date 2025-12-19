import { Zap, Palette, RefreshCw } from "lucide-react";

const differentiators = [
  {
    icon: Zap,
    title: "No Figma required",
    description: "Skip the design detour. Drop your screenshot and you're 90% done.",
  },
  {
    icon: Palette,
    title: "Looks good by default",
    description: "Smart presets that just work. Tweak if you want, ship if you don't.",
  },
  {
    icon: RefreshCw,
    title: "Consistent, repeatable assets",
    description: "Same quality every time. Perfect for ongoing product updates.",
  },
];

export function LandingDifferentiators() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Why it's different
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Built on the belief that strong defaults beat endless options
          </p>
        </div>

        {/* Differentiators grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {differentiators.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 transition-all hover:border-border hover:shadow-md"
              >
                {/* Icon */}
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6 text-foreground" />
                </div>

                {/* Title */}
                <h3 className="mb-3 text-xl font-semibold">{item.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
