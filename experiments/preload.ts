/**
 * Real asset preloader.
 *
 * Each asset reports its own 0..1 progress; the overall progress is the
 * weighted average. Tasks never reject (a failed asset just counts as done)
 * and a global timeout guarantees the loader can never hang forever
 * (e.g. iOS Safari refuses to preload video without a user gesture).
 */

export type Asset =
  | { type: "fonts"; label?: string; weight?: number }
  | { type: "image"; src: string; label?: string; weight?: number }
  | {
      type: "video";
      src: string;
      label?: string;
      weight?: number;
      /** Seconds of video that must be buffered before it counts as loaded. */
      seconds?: number;
    };

type Report = (fraction: number) => void;

// Hold references so in-flight loads are not garbage collected.
const keepAlive: unknown[] = [];

function loadFonts(report: Report) {
  return new Promise<void>((resolve) => {
    if (!document.fonts?.ready) {
      report(1);
      resolve();
      return;
    }
    document.fonts.ready.then(() => {
      report(1);
      resolve();
    });
  });
}

function loadImage(src: string, report: Report) {
  return new Promise<void>((resolve) => {
    const img = new Image();
    keepAlive.push(img);
    const finish = () => {
      report(1);
      resolve();
    };
    img.onload = () => {
      // decode so the first paint on the page is instant
      if (img.decode) img.decode().then(finish, finish);
      else finish();
    };
    img.onerror = finish;
    img.src = src;
  });
}

function loadVideo(src: string, report: Report, seconds = 6) {
  return new Promise<void>((resolve) => {
    const v = document.createElement("video");
    keepAlive.push(v);
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      report(1);
      resolve();
    };

    const check = () => {
      if (!v.duration || !v.buffered.length) return;
      const need = Math.min(v.duration, seconds);
      const have = v.buffered.end(v.buffered.length - 1);
      report(Math.min(have / need, 1) * 0.99);
      if (have >= need) finish();
    };

    v.addEventListener("loadedmetadata", check);
    v.addEventListener("progress", check);
    v.addEventListener("canplaythrough", finish);
    v.addEventListener("error", finish);
    v.src = src;
    v.load();
  });
}

export function preloadAssets(
  assets: Asset[],
  onProgress: (progress: number, label: string) => void,
  timeoutMs = 12000,
): Promise<void> {
  const weights = assets.map((a) => a.weight ?? 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  const fractions = assets.map(() => 0);

  const emit = () => {
    const p = fractions.reduce((sum, f, i) => sum + f * weights[i], 0) / totalWeight;
    const pending = fractions.findIndex((f) => f < 1);
    onProgress(p, pending === -1 ? "Ready" : (assets[pending].label ?? "Loading"));
  };

  const tasks = assets.map((asset, i) => {
    const report: Report = (f) => {
      fractions[i] = Math.max(fractions[i], Math.min(f, 1));
      emit();
    };
    switch (asset.type) {
      case "fonts":
        return loadFonts(report);
      case "image":
        return loadImage(asset.src, report);
      case "video":
        return loadVideo(asset.src, report, asset.seconds);
    }
  });

  emit();

  const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
  return Promise.race([Promise.all(tasks).then(() => undefined), timeout]);
}
