export const FALLBACK_VIDEO = "/media-placeholder.svg";

export const MEDIA_PROXY_PREFIX = "/media/";
export function proxyMedia(src: string) {
    const storagePrefix = process.env.NEXT_PUBLIC_MEDIA_STORAGE_PREFIX;
    return storagePrefix && src.startsWith(storagePrefix) ? MEDIA_PROXY_PREFIX + src.slice(storagePrefix.length) : src;
}

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i;
export function isVideoSrc(src: string) {
    return VIDEO_EXT.test(src);
}

export type GalleryItem = {
    url: string;
    caption: string;
};

export type Work = {
    id: number;
    name: string;
    tags: string[];
    media: string;
    mediaCaption: string;
    video?: string;
    href?: string;
    url?: string;
    urlTitle?: string;
    urlCaption?: string;
    description: string;
    year: string;
    client: string;
    role: string;
    gallery: GalleryItem[];
};

export const works: Work[] = [];

export function getWorkSlug(work: Work): string {
    return work.href?.replace("/work/", "") ?? "";
}

export function getWorkBySlug(slug: string): Work | undefined {
    return works.find((work) => work.href === `/work/${slug}`);
}

// YouTube / Vimeo links are embeds, not files: a <video> element (and the WebGL card) can't play them
const EMBED_HOST = /(?:youtu\.be|youtube\.com|youtube-nocookie\.com|vimeo\.com)\//i;
export function isEmbedSrc(src: string) {
    return EMBED_HOST.test(src);
}

// a file the <video> element / WebGL card can actually play, or "" when there is none
export function getPlayableVideo(work: Work): string {
    if (work.video && !isEmbedSrc(work.video)) return work.video;
    if (work.media && isVideoSrc(work.media)) return work.media;
    return "";
}

export function getWorkVideo(work: Work): string {
    return getPlayableVideo(work) || FALLBACK_VIDEO;
}

export function getWorkPoster(work: Work): string | undefined {
    if (work.media && !isVideoSrc(work.media)) return work.media;
    return undefined;
}

export function proxyWork(w: Work): Work {
    return {
        ...w,
        media: proxyMedia(w.media),
        video: w.video ? proxyMedia(w.video) : w.video,
        gallery: w.gallery.map((item) => ({ ...item, url: proxyMedia(item.url) })),
    };
}