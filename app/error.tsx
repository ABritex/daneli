"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[app/error]", error);
    }, [error]);

    return (
        <main className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
            <div className="max-w-md space-y-5 text-center">
                <p className="font-screener text-xs uppercase tracking-[0.25em] text-foreground/50">Error</p>
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="font-mono text-sm text-foreground/70">{error?.message || "An unexpected error occurred."}</p>
                <button
                    type="button"
                    onClick={reset}
                    className="cursor-pointer border border-foreground/40 px-5 py-3 font-screener text-sm uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                    Try again
                </button>
            </div>
        </main>
    );
}
