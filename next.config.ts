import type { NextConfig } from "next";

function s3RemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
    const patterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [
        { protocol: "https", hostname: "i.ytimg.com" },
    ];
    for (const value of [process.env.AWS_ENDPOINT_URL_S3, process.env.S3_PUBLIC_BASE_URL]) {
        if (!value) continue;
        try {
            const u = new URL(value);
            if (u.protocol === "https:" || u.protocol === "http:") {
                patterns.push({ protocol: u.protocol.replace(":", "") as "http" | "https", hostname: u.hostname });
            }
        } catch {}
    }
    return patterns;
}

const storagePrefix = (() => {
    const endpoint = process.env.AWS_ENDPOINT_URL_S3?.replace(/\/$/, "");
    const bucket = process.env.S3_BUCKET?.replace(/^\//, "").replace(/\/$/, "");
    const prefix = endpoint && bucket ? `${endpoint}/${bucket}/` : "";
    if (!prefix) {
        console.warn("[next.config] Missing AWS_ENDPOINT_URL_S3/S3_BUCKET; /media rewrites and media proxy are disabled.");
    }
    return prefix;
})();

const nextConfig: NextConfig = {
    /* config options here */
    cacheComponents: true,
    partialPrefetching: true,
    env: {
        NEXT_PUBLIC_MEDIA_STORAGE_PREFIX: storagePrefix,
    },
    images: {
        remotePatterns: s3RemotePatterns(),
    },
    async rewrites() {
        return storagePrefix
            ? [
                  {
                      source: "/media/:path*",
                      destination: `${storagePrefix}:path*`,
                  },
              ]
            : [];
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
        ];
    },
    turbopack: {
        rules: {
            // Tailwind processes global stylesheets. Excluding *.module.css keeps
            // Turbopack's native CSS-module class-name export intact.
            "*.css": {
                condition: { not: { path: /\.module\.css$/ } },
                loaders: ["@tailwindcss/turbopack"],
                as: "*.css",
            },
        },
    },
};

export default nextConfig;
