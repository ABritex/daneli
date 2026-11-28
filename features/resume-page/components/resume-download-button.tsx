"use client";

import { useState } from "react";
import type { ResumeData } from "../lib/resume-pdf";

const slug = (s: string) =>
    s
        .normalize("NFKD")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "_");

export function ResumeDownloadButton({ resume }: { resume: ResumeData }) {
    const [state, setState] = useState<"idle" | "busy" | "error">("idle");

    const download = async () => {
        if (state === "busy") return;
        setState("busy");
        try {
            const { buildResumePdf } = await import("../lib/resume-pdf");
            const blob = await buildResumePdf(resume);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${slug(resume.profile.name || "Resume")}_Resume.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            setState("idle");
        } catch (err) {
            console.error("[resume] pdf failed", err);
            setState("error");
        }
    };

    return (
        <button
            type="button"
            onClick={download}
            disabled={state === "busy"}
            className="inline-flex items-center gap-2 border border-foreground/30 px-4 py-2 font-screener text-[10px] uppercase tracking-[0.28em] text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-60 print:hidden"
        >
            {state === "busy" ? "Generating..." : state === "error" ? "Failed – retry" : "Download PDF"}
        </button>
    );
}
