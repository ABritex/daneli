"use client";

import { useState } from "react";

type Props = {
    email?: string;
};

export function ContactForm({ email }: Props) {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [messageText, setMessageText] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus("loading");
        setMessageText("");
        const form = e.currentTarget;
        const formData = new FormData(form);
        const payload = {
            name: String(formData.get("name") || "").trim(),
            email: String(formData.get("email") || "").trim(),
            message: String(formData.get("message") || "").trim(),
            website: String(formData.get("website") || "").trim(),
        };
        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setStatus("error");
                setMessageText(data?.error || "Failed to send. Please try again.");
                return;
            }
            setStatus("success");
            setMessageText("Message sent. I’ll get back to you soon.");
            form.reset();
        } catch {
            setStatus("error");
            setMessageText("Network error. Please try again.");
        }
    }

    return (
        <div>
            <p className="font-screener text-[10px] uppercase tracking-[0.32em] text-foreground/45">Send a message</p>
            <form className="mt-8 space-y-10" onSubmit={handleSubmit}>
                {/* Honeypot */}
                <div className="absolute left-[-9999px]" aria-hidden="true">
                    <label>
                        Website
                        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                </div>
                <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                    <label className="block">
                        <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">Name</span>
                        <input
                            type="text"
                            name="name"
                            required
                            className="mt-3 w-full border-b border-foreground/20 bg-transparent py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground/70"
                            placeholder="Your name"
                        />
                    </label>

                    <label className="block">
                        <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">Email</span>
                        <input
                            type="email"
                            name="email"
                            required
                            className="mt-3 w-full border-b border-foreground/20 bg-transparent py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground/70"
                            placeholder={email ? `Reply to ${email}` : "you@example.com"}
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="font-screener text-[10px] uppercase tracking-[0.28em] text-foreground/45">Message</span>
                    <textarea
                        name="message"
                        rows={6}
                        required
                        className="mt-3 w-full resize-none border-b border-foreground/20 bg-transparent py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-foreground/70"
                        placeholder="Tell me about your project..."
                    />
                </label>

                {messageText ? (
                    <p className={`text-sm ${status === "success" ? "text-emerald-400/90" : "text-red-400/90"}`}>{messageText}</p>
                ) : null}

                <button
                    type="submit"
                    disabled={status === "loading"}
                    className="inline-flex items-center justify-center border border-foreground/40 px-8 py-4 font-screener text-[10px] uppercase tracking-[0.28em] text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-60"
                >
                    {status === "loading" ? "Sending..." : "Send message"}
                </button>
            </form>
        </div>
    );
}
