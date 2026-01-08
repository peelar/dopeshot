import { LandingHeader } from "./_components/landing-header";
import { LandingHero } from "./_components/landing-hero";
import { LandingLayoutShowcase } from "./_components/landing-layout-showcase";
import { LandingBrandingTeaser } from "./_components/landing-branding-teaser";
import { LandingFinalCta } from "./_components/landing-final-cta";
import { LandingFooter } from "./_components/landing-footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingLayoutShowcase />
        <LandingBrandingTeaser />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
