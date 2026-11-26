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
    url?: string; // optional live project link, shows the Launch project pill
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

export function getWorkVideo(work: Work): string {
    if (work.video) return work.video;
    if (work.media && isVideoSrc(work.media)) return work.media;
    return FALLBACK_VIDEO;
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
