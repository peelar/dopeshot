import { LandingHeader } from "./_components/landing-header";
import { LandingHero } from "./_components/landing-hero";
import { LandingExamples } from "./_components/landing-examples";
import { LandingBrandingTeaser } from "./_components/landing-branding-teaser";
import { LandingFinalCta } from "./_components/landing-final-cta";
import { LandingFooter } from "./_components/landing-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingExamples />
        <LandingBrandingTeaser />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
