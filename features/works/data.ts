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
    name: "Neon Drift",
    tags: ["VISUAL", "STUDIO"],
    media: "/work-1.jpg",
    video: "/bg-test.mp4",
    href: "/work/oryzo-ai",
    description:
      "A surreal visual experiment blending light, motion, and abstract forms into an immersive digital atmosphere.",
    year: "2025",
    client: "Oryzo",
    role: "Product design, Frontend engineering",
    gallery: ["/work-1.jpg", "/work-1.jpg"],
  },
  {
    id: 2,
    name: "Silent Orbit",
    tags: ["MOTION", "CONCEPT"],
    media: "/work-2.jpg",
    video: "/bg-test.mp4",
    href: "/work/atlas-motion",
    description:
      "A floating interface concept where objects drift slowly through space, reacting to subtle user movement.",
    year: "2025",
    client: "Atlas",
    role: "Brand design, Motion graphics",
    gallery: ["/work-2.jpg", "/work-2.jpg"],
  },
  {
    id: 3,
    name: "Chrome Bloom",
    tags: ["DESIGN", "FUTURE"],
    media: "/work-3.jpg",
    video: "/bg-test.mp4",
    href: "/work/devin-ai",
    description:
      "A polished digital composition exploring reflective surfaces, soft gradients, and futuristic product storytelling.",
    year: "2024",
    client: "Devin",
    role: "Interface design, Data visualisation",
    gallery: ["/work-3.jpg", "/work-3.jpg"],
  },
  {
    id: 4,
    name: "Velvet Signal",
    tags: ["BRAND", "EDITORIAL"],
    media: "/work-4.jpg",
    video: "/bg-test.mp4",
    href: "/work/of-the-oak",
    description:
      "A moody editorial identity built around texture, contrast, and quiet typographic rhythm.",
    year: "2024",
    client: "Oak & Co",
    role: "Brand identity, Print design",
    gallery: ["/work-4.jpg", "/work-4.jpg"],
  },
  {
    id: 5,
    name: "Glass Circuit",
    tags: ["DIGITAL", "SYSTEM"],
    media: "/work-5.jpg",
    video: "/bg-test.mp4",
    href: "/work/everswap",
    description:
      "A clean system of layered panels and translucent elements designed for a sharp, modern digital experience.",
    year: "2025",
    client: "Everswap Labs",
    role: "Product design, Web3 integration",
    gallery: ["/work-5.jpg", "/work-5.jpg"],
  },
  {
    id: 6,
    name: "Midnight Alloy",
    tags: ["3D", "CINEMA"],
    media: "/work-6.jpg",
    video: "/bg-test.mp4",
    href: "/work/porsche-dream-machine",
    description:
      "A cinematic 3D study focused on metallic materials, dramatic lighting, and controlled movement.",
    year: "2024",
    client: "Porsche",
    role: "3D direction, WebGL engineering",
    gallery: ["/work-6.jpg", "/work-6.jpg"],
  },
  {
    id: 7,
    name: "Echo Garden",
    tags: ["ART", "EXPERIMENT"],
    media: "/work-7.jpg",
    video: "/bg-test.mp4",
    href: "/work/synthetic-human",
    description:
      "An experimental digital garden where organic shapes and sound-inspired motion create a living composition.",
    year: "2024",
    client: "Self-initiated",
    role: "Direction, Generative systems",
    gallery: ["/work-7.jpg", "/work-7.jpg"],
  },
  {
    id: 8,
    name: "Paper Horizon",
    tags: ["SPATIAL", "INTERFACE"],
    media: "/work-8.jpg",
    video: "/bg-test.mp4",
    href: "/work/meta-spatial-fusion",
    description:
      "A spatial interface concept that blends minimal layout, depth, and calm interaction into one environment.",
    year: "2025",
    client: "Meta",
    role: "XR interface design, Prototyping",
    gallery: ["/work-8.jpg", "/work-8.jpg"],
  },
  {
    id: 9,
    name: "Lunar Market",
    tags: ["PLATFORM", "DREAM"],
    media: "/work-9.jpg",
    video: "/bg-test.mp4",
    href: "/work/spaace",
    description:
      "A dreamy marketplace concept built around discovery, atmosphere, and smooth visual navigation.",
    year: "2024",
    client: "Spaace",
    role: "Product design, Smart contract UI",
    gallery: ["/work-9.jpg", "/work-9.jpg"],
  },
  {
    id: 10,
    name: "Static Parade",
    tags: ["EVENT", "VISUALS"],
    media: "/work-10.jpg",
    video: "/bg-test.mp4",
    href: "/work/ddd-2024",
    description:
      "A bold event visual system mixing sharp graphics, rhythm, and playful digital energy.",
    year: "2024",
    client: "DDD",
    role: "Event identity, Digital experience",
    gallery: ["/work-10.jpg", "/work-10.jpg"],
  },
];