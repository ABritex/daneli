import { LandingPage } from "@/features/landing-page";
import { getHeroArt, getReelVideoUrl, getWorks } from "@/lib/db-content";

export const instant = false;

export default async function Page() {
    const [works, heroArt, reelVideoUrl] = await Promise.all([getWorks(), getHeroArt(), getReelVideoUrl()]);
    return <LandingPage works={works} heroArt={heroArt.desktop} heroArtMobile={heroArt.mobile} reelVideoUrl={reelVideoUrl} />;
}
