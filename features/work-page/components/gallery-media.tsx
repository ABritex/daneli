"use client";

import Image from "next/image";
import { useState } from "react";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i;

export function isVideoSrc(src: string) {
    return VIDEO_EXT.test(src);
}

function Fallback({ label }: { label: string }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111] text-foreground/45">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-foreground/15 text-lg">?</div>
            <p className="font-screener text-[10px] uppercase tracking-[0.28em]">{label}</p>
        </div>
    );
}

type Props = {
    src: string;
    alt: string;
    poster?: string;
    className?: string;
    sizes?: string;
    fill?: boolean;
    autoPlay?: boolean;
    controls?: boolean;
};

export function GalleryMedia({ src, alt, poster, className, sizes = "(max-width: 768px) 86vw, 62vh", fill = true, autoPlay = false, controls }: Props) {
    const [failed, setFailed] = useState(false);
    const video = isVideoSrc(src);

    if (failed) return <Fallback label={video ? "Video unavailable" : "Image unavailable"} />;

    if (video) {
        return (
            <video
                src={src}
                poster={poster}
                autoPlay={autoPlay}
                muted
                loop
                playsInline
                controls={controls}
                className={className ?? "absolute inset-0 h-full w-full object-cover"}
                onError={() => setFailed(true)}
            />
        );
    }

    if (fill) {
        return <Image src={src} alt={alt} fill sizes={sizes} className={className ?? "object-cover"} onError={() => setFailed(true)} />;
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element -- intentional fallback for unknown dimensions
        <img src={src} alt={alt} loading="lazy" decoding="async" className={className ?? "absolute inset-0 h-full w-full object-cover"} onError={() => setFailed(true)} />
    );
}
