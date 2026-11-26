"use client";

import { useEffect } from "react";

let shown = false;

export function ConsoleEasterEgg() {
    useEffect(() => {
        if (shown || typeof window === "undefined") return;
        shown = true;
        console.log(
            "%cDANELI%c\nLooking under the hood? Nice.\nBuilt with care, motion, and a bit of chaos.\n%cdanelidevr@gmail.com",
            "font-size:28px;font-weight:800;letter-spacing:0.08em;color:#e6e5e0;background:#070707;padding:8px 12px;border-radius:4px;",
            "font-size:12px;color:#e6e5e0;line-height:1.8;",
            "font-size:11px;color:#8a8880;line-height:1.8;",
        );
    }, []);

    return null;
}
