import * as THREE from "three";

export type LenisLike = {
    scrollTo: (
        target: number,
        opts: {
            immediate?: boolean;
            duration?: number;
            easing?: (t: number) => number;
            lock?: boolean;
            force?: boolean;
            onComplete?: () => void;
        },
    ) => void;
};

export type WallTile = {
    item: number;
    col: number;
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    baseZ: number;
    cover: THREE.Vector2;
    coverKey: number; /* image size the cover crop was computed for */
    lastOpacity: number;
};

export type SpiralCard = {
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    index: number;
    blur: THREE.Vector2;
    shape: THREE.Vector4;
    cover: THREE.Vector2;
};
