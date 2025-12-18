export function LandingBrandingTeaser() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="container mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-muted/30 p-12">
          {/* Coming soon badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm"
            style={{
              border: `1px solid oklch(0.65 0.22 41.12 / 0.2)`,
              backgroundColor: `oklch(0.65 0.22 41.12 / 0.05)`,
              color: `oklch(0.65 0.22 41.12 / 1)`,
            }}
          >
            Coming soon
          </div>

          {/* Headline */}
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Brand kits
          </h2>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Upload your logo and colors once. Every screenshot automatically gets your brand treatment.
            No manual work, no inconsistencies — just your vibe, every time.
          </p>
        </div>
      </div>
    </section>
  );
}
