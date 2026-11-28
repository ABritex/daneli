import { ScrollPill } from "@/components/site";
import type { Work } from "@/features/works";
import { AboutSection } from "./about";
import { ContactSection } from "./cta";
import { FeaturedWorks } from "./featured-works";
import { HeroSection } from "./hero-section";
import { SectionCorners } from "./section-corners";
import { ServicesSection } from "./services";

type Props = {
    works: Work[];
    heroArt: string[];
    heroArtMobile: string[];
    reelVideoUrl?: string;
    reelNotes?: string;
};

export function LandingPage({ works, heroArt, heroArtMobile, reelVideoUrl, reelNotes }: Props) {
    return (
        <main className="relative text-foreground">
            <ScrollPill />
            <SectionCorners />
            <div data-intro-fade>
                <HeroSection art={heroArt} artMobile={heroArtMobile} reelVideoUrl={reelVideoUrl} reelNotes={reelNotes} />
                <FeaturedWorks works={works} />
                <AboutSection />
                <ServicesSection />
                <ContactSection />
            </div>
        </main>
    );
}
