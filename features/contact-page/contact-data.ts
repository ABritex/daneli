import { siteConfig } from "@/lib/site";

export const CONTACT_INFO = [
  { label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  { label: "Phone", value: "+00 000 000 0000", href: "tel:+00000000000" },
  { label: "Location", value: "Lorem Ipsum, Dolor", href: "#" },
  { label: "Availability", value: "Lorem ipsum dolor sit amet", href: "#" },
];

export const SOCIALS = ["Instagram", "Twitter / X", "LinkedIn", "GitHub", "Dribbble"];
