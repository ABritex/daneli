export type Post = {
  title: string;
  date: string;
  read: string;
  excerpt: string;
};

export const posts: Post[] = [
  { title: "The Architecture of Immersion", date: "Nov 2026", read: "8 min", excerpt: "How spatial composition and scroll-driven motion create experiences that feel alive rather than animated." },
  { title: "Typography as Infrastructure", date: "Oct 2026", read: "6 min", excerpt: "Why type systems are the foundation of every design system, and how to build them to last." },
  { title: "WebGL Beyond the Canvas", date: "Sep 2026", read: "10 min", excerpt: "Moving past decorative 3D toward meaningful spatial interfaces on the web." },
  { title: "Swiss Grids in the Browser", date: "Aug 2026", read: "5 min", excerpt: "Applying International Typographic Style principles to responsive digital layouts." },
  { title: "The Quiet Power of Restraint", date: "Jul 2026", read: "4 min", excerpt: "Why the best interfaces often feel like nothing happened — and how to achieve that." },
];
