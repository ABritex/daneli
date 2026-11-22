export type Work = {
  id: number;
  name: string;
  tags: string[];
  media: string;
  /** optional video source, falls back to the placeholder clip */
  video?: string;
  /** project link, defaults to "#" */
  href?: string;
  /** short blurb shown on the slug page */
  description: string;
  /** year of the project */
  year: string;
  /** client or collaborator */
  client: string;
  /** role played in the project */
  role: string;
  /** additional images for the gallery */
  gallery: string[];
};

export const works: Work[] = [
  {
    id: 1,
    name: "Oryzo AI",
    tags: ["AI", "PRODUCT"],
    media: "/work-1.jpg",
    video: "/bg-test.mp4",
    href: "/work/oryzo-ai",
    description:
      "A generative-AI product interface built around conversational workflows. Oryzo AI turns natural language into structured design decisions, with a canvas that adapts as the user iterates.",
    year: "2025",
    client: "Oryzo",
    role: "Product design, Frontend engineering",
    gallery: ["/work-1.jpg", "/work-1.jpg"],
  },
  {
    id: 2,
    name: "Atlas Motion",
    tags: ["MOTION", "BRAND"],
    media: "/work-2.jpg",
    video: "/bg-test.mp4",
    href: "/work/atlas-motion",
    description:
      "Motion-first brand identity for a creative studio. Atlas Motion pairs fluid 3D transitions with a bespoke type system that stretches and compresses in response to cursor velocity.",
    year: "2025",
    client: "Atlas",
    role: "Brand design, Motion graphics",
    gallery: ["/work-2.jpg", "/work-2.jpg"],
  },
  {
    id: 3,
    name: "Devin AI",
    tags: ["AI", "TOOL"],
    media: "/work-3.jpg",
    video: "/bg-test.mp4",
    href: "/work/devin-ai",
    description:
      "Developer tooling surface that visualises code execution as a spatial graph. Devin AI maps function calls, data flows, and side effects in real time.",
    year: "2024",
    client: "Devin",
    role: "Interface design, Data visualisation",
    gallery: ["/work-3.jpg", "/work-3.jpg"],
  },
  {
    id: 4,
    name: "Of The Oak",
    tags: ["BRAND", "PRINT"],
    media: "/work-4.jpg",
    video: "/bg-test.mp4",
    href: "/work/of-the-oak",
    description:
      "Editorial print campaign and identity for a heritage furniture maker. Of The Oak combines letterpress textures with modular typography across brochures, packaging, and signage.",
    year: "2024",
    client: "Oak & Co",
    role: "Brand identity, Print design",
    gallery: ["/work-4.jpg", "/work-4.jpg"],
  },
  {
    id: 5,
    name: "Everswap",
    tags: ["WEB3", "APP"],
    media: "/work-5.jpg",
    video: "/bg-test.mp4",
    href: "/work/everswap",
    description:
      "Decentralised exchange interface focused on minimal friction. Everswap strips away the clutter of trading screens, leaving only price, path, and confirmation.",
    year: "2025",
    client: "Everswap Labs",
    role: "Product design, Web3 integration",
    gallery: ["/work-5.jpg", "/work-5.jpg"],
  },
  {
    id: 6,
    name: "Porsche: Dream Machine",
    tags: ["AUTOMOTIVE", "3D"],
    media: "/work-6.jpg",
    video: "/bg-test.mp4",
    href: "/work/porsche-dream-machine",
    description:
      "Immersive 3D configurator for Porsche's flagship concept car. Users sculpt materials, lighting, and stance in a real-time WebGL environment.",
    year: "2024",
    client: "Porsche",
    role: "3D direction, WebGL engineering",
    gallery: ["/work-6.jpg", "/work-6.jpg"],
  },
  {
    id: 7,
    name: "Synthetic Human",
    tags: ["AI", "EXPERIMENT"],
    media: "/work-7.jpg",
    video: "/bg-test.mp4",
    href: "/work/synthetic-human",
    description:
      "Experimental film and web piece exploring synthetic faces. Synthetic Human generates procedurally animated portraits that react to ambient sound.",
    year: "2024",
    client: "Self-initiated",
    role: "Direction, Generative systems",
    gallery: ["/work-7.jpg", "/work-7.jpg"],
  },
  {
    id: 8,
    name: "Meta: Spatial Fusion",
    tags: ["XR", "INTERFACE"],
    media: "/work-8.jpg",
    video: "/bg-test.mp4",
    href: "/work/meta-spatial-fusion",
    description:
      "Spatial interface prototype for Meta's mixed-reality headset. Spatial Fusion reimagines window management as a 3D workspace with depth-aware gestures.",
    year: "2025",
    client: "Meta",
    role: "XR interface design, Prototyping",
    gallery: ["/work-8.jpg", "/work-8.jpg"],
  },
  {
    id: 9,
    name: "Spaace - NFT Marketplace",
    tags: ["NFT", "PLATFORM"],
    media: "/work-9.jpg",
    video: "/bg-test.mp4",
    href: "/work/spaace",
    description:
      "NFT marketplace built for spatial browsing. Spaace presents collections as navigable rooms, with ownership and provenance visible at a glance.",
    year: "2024",
    client: "Spaace",
    role: "Product design, Smart contract UI",
    gallery: ["/work-9.jpg", "/work-9.jpg"],
  },
  {
    id: 10,
    name: "DDD 2024",
    tags: ["EVENT", "IDENTITY"],
    media: "/work-10.jpg",
    video: "/bg-test.mp4",
    href: "/work/ddd-2024",
    description:
      "Identity and digital experience for the DDD 2024 design conference. A generative system produces a unique badge and schedule for each attendee.",
    year: "2024",
    client: "DDD",
    role: "Event identity, Digital experience",
    gallery: ["/work-10.jpg", "/work-10.jpg"],
  },
];
