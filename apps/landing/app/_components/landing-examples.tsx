import Image from "next/image";

const examples = [
  {
    image: "/demo1.png",
    caption: "Screenshot → shareable image",
    description: "Turn product screenshots into social-ready graphics",
  },
  {
    image: "/demo2.png",
    caption: "Code snippet → clean visual",
    description: "Make your code examples pop on LinkedIn",
  },
  {
    image: "/demo1.png", // TODO: Replace with real changelog example
    caption: "Announcement → LinkedIn-ready",
    description: "Ship updates that actually get noticed",
  },
  {
    image: "/demo2.png", // TODO: Replace with real feature showcase
    caption: "Feature showcase → Twitter card",
    description: "Consistent branding across all channels",
  },
  {
    image: "/demo1.png", // TODO: Replace with real testimonial example
    caption: "Testimonial → story-ready",
    description: "Beautiful customer stories in seconds",
  },
  {
    image: "/demo2.png", // TODO: Replace with real stats example
    caption: "Stats → engagement driver",
    description: "Data that demands attention",
  },
];

export function LandingExamples() {
  return (
    <section id="examples" className="scroll-mt-16 py-20 sm:py-32">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            One tool, endless possibilities
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From product launches to changelog updates — make everything look professional
          </p>
        </div>

        {/* Examples grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((example, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:scale-[1.02] hover:border-[oklch(0.65_0.22_41.12_/_0.3)] hover:shadow-lg"
            >
              {/* Image container with aspect ratio */}
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <Image
                  src={example.image}
                  alt={example.caption}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              {/* Caption */}
              <div className="p-6">
                <h3 className="mb-2 font-semibold">{example.caption}</h3>
                <p className="text-sm text-muted-foreground">{example.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TODO marker for real screenshots */}
        <div className="mt-8 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-center text-sm text-yellow-300/80">
          TODO: Replace placeholder images with real dopeshot examples (6 unique outputs showing different layouts and use cases)
        </div>
      </div>
    </section>
  );
}
