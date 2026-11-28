import { LandingPage } from "@/features/landing-page";
import { getHeroArt, getReelNotes, getReelVideoUrl, getWorks } from "@/lib/db-content";

export const instant = false;

export default async function Page() {
    const [works, heroArt, reelVideoUrl, reelNotes] = await Promise.all([getWorks(), getHeroArt(), getReelVideoUrl(), getReelNotes()]);
    return <LandingPage works={works} heroArt={heroArt.desktop} heroArtMobile={heroArt.mobile} reelVideoUrl={reelVideoUrl} reelNotes={reelNotes} />;
}
