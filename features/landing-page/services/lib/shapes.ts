export type Pt = [number, number];
const N = 120;

export const resample = (v: Pt[], n = N): number[] => {
    const pts = [...v, v[0]];
    const seg = v.map((_, i) => Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]));
    const total = seg.reduce((a, b) => a + b, 0);
    const out: number[] = [];
    let i = 0;
    let acc = 0;

    for (let k = 0; k < n; k++) {
        const d = (k / n) * total;
        while (i < seg.length - 1 && acc + seg[i] < d) {
            acc += seg[i];
            i++;
        }
        const f = (d - acc) / (seg[i] || 1);
        out.push(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f);
    }

    return out;
};

export const polar = (n: number, r: (th: number) => number): Pt[] =>
    Array.from({ length: n }, (_, i) => {
        const th = -Math.PI / 2 + (i / n) * Math.PI * 2;
        return [Math.cos(th) * r(th), Math.sin(th) * r(th)] as Pt;
    });

export const move = (p: Pt[], dx: number, dy: number): Pt[] => p.map(([x, y]) => [x + dx, y + dy]);

const STAR: Pt[] = Array.from({ length: 16 }, (_, i) => {
    const th = -Math.PI / 2 + (i / 16) * Math.PI * 2;
    const r = i % 2 ? 0.5 : 1;
    return [Math.cos(th) * r, Math.sin(th) * r] as Pt;
});

export const SHAPES = [
    {
        // 3D Design: isometric cube
        outer: resample(polar(6, () => 1)),
        inner: resample([
            [0, -1],
            [0.866, -0.5],
            [0, 0],
            [-0.866, -0.5],
        ]),
    },
    {
        // Motion Graphics: wave thing
        outer: resample(polar(180, (th) => 1 + 0.14 * Math.sin(5 * (th + Math.PI / 2)))),
        inner: resample(
            move(
                polar(180, () => 0.42),
                0.18,
                0,
            ),
        ),
    },
    {
        // Visual Effects: burst
        outer: resample(STAR),
        inner: resample(polar(180, () => 0.28)),
    },
    {
        // Cinematography: frame + lens
        outer: resample([
            [0, -0.56],
            [1, -0.56],
            [1, 0.56],
            [-1, 0.56],
            [-1, -0.56],
        ]),
        inner: resample(polar(180, () => 0.3)),
    },
    {
        // Videography: reel/play
        outer: resample(polar(180, () => 1)),
        inner: resample([
            [-0.25, -0.4],
            [0.45, 0],
            [-0.25, 0.4],
        ]),
    },
];

export const toD = (a: number[]) => {
    let d = `M${a[0].toFixed(4)} ${a[1].toFixed(4)}`;
    for (let i = 2; i < a.length; i += 2) d += `L${a[i].toFixed(4)} ${a[i + 1].toFixed(4)}`;
    return `${d}Z`;
};
