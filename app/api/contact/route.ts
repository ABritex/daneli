import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function getClientIp(req: Request) {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string) {
    const now = Date.now();
    const times = (rateLimitMap.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    times.push(now);
    rateLimitMap.set(ip, times);
    return times.length > RATE_LIMIT_MAX;
}

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        if (isRateLimited(ip)) {
            return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
        }

        const body = await req.json().catch(() => null);
        const name = String(body?.name || "").trim();
        const email = String(body?.email || "").trim();
        const message = String(body?.message || "").trim();
        const website = String(body?.website || "").trim();

        // Honeypot: bots fill this; silently succeed to avoid tipping them off
        if (website) {
            return NextResponse.json({ ok: true });
        }

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
        }

        const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
        const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
        const toEmail = process.env.CONTACT_TO_EMAIL || gmailUser;

        if (!gmailUser || !gmailPass || !toEmail) {
            console.error("Missing email env vars: GMAIL_USER/GMAIL_APP_PASSWORD/CONTACT_TO_EMAIL");
            return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: gmailUser,
                pass: gmailPass,
            },
        });

        await transporter.sendMail({
            from: `"${name}" <${gmailUser}>`,
            replyTo: email,
            to: toEmail,
            subject: `Portfolio contact from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
            html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Contact form error:", err);
        return NextResponse.json({ error: "Failed to send message. Please try again later." }, { status: 500 });
    }
}

function escapeHtml(str: string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
