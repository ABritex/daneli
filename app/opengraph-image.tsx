import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "#070707",
                color: "#e6e5e0",
                padding: "64px",
                fontFamily: "sans-serif",
            }}
        >
            <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, opacity: 0.65 }}>CREATIVE PORTFOLIO</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", fontSize: 132, fontWeight: 800, lineHeight: 0.9, letterSpacing: -2 }}>DANELI</div>
                <div style={{ display: "flex", fontSize: 30, opacity: 0.72 }}>Cinematography / 3D Motion / VFX</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, opacity: 0.55 }}>
                <div style={{ display: "flex" }}>{siteConfig.creator}</div>
                <div style={{ display: "flex" }}>dan-eli.vercel.app</div>
            </div>
        </div>,
        size,
    );
}
