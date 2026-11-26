export type CornerContent = {
    id: string;
    topLeft?: string;
    topRight?: string;
    bottomLeft?: string;
    bottomRight?: string;
};

// what shows in the corners for each section
export const SECTIONS: CornerContent[] = [
    { id: "work", topLeft: "03 / Featured Work", topRight: "Studio / Selection", bottomLeft: "Selected", bottomRight: "Scroll / Explore" },
    { id: "about", topLeft: "Portfolio", topRight: "Daniel Eli", bottomLeft: "04 / About", bottomRight: "Profile" },
    { id: "services", topLeft: "Capabilities", topRight: "05 / Services", bottomLeft: "What I Do", bottomRight: "Studio" },
    { id: "contact", topLeft: "Let's Talk", topRight: "Get In Touch" },
];
