import { LandingHeader } from "./_components/landing-header";
import { LandingHero } from "./_components/landing-hero";
import { LandingExamples } from "./_components/landing-examples";
import { LandingHowItWorks } from "./_components/landing-how-it-works";
import { LandingDifferentiators } from "./_components/landing-differentiators";
import { LandingBrandingTeaser } from "./_components/landing-branding-teaser";
import { LandingFooter } from "./_components/landing-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingExamples />
        <LandingHowItWorks />
        <LandingDifferentiators />
        <LandingBrandingTeaser />
      </main>
      <LandingFooter />
    </div>
  );
}
