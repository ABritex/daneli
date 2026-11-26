import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { smooth } from "./utils";

export type MannequinState = {
    mannequin: THREE.Group | null;
    bones: Record<string, { bone: THREE.Bone; rest: THREE.Quaternion }>;
    baseY: number;
};

export function createMannequinState(): MannequinState {
    return { mannequin: null, bones: {}, baseY: 0 };
}

export function loadMannequin(modelUrl: string, scene: THREE.Scene, state: MannequinState, isDisposed: () => boolean): Promise<void> {
    const loader = new GLTFLoader();
    return new Promise<void>((resolve) => {
        loader.load(
            modelUrl,
            (gltf) => {
                try {
                    if (isDisposed()) return;
                    const obj = gltf.scene;
                    obj.traverse((child) => {
                        const mesh = child as THREE.Mesh;
                        if (mesh.isMesh) {
                            mesh.frustumCulled = false;
                            mesh.renderOrder = 9_000_000;
                            const mat = mesh.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
                            const mats = Array.isArray(mat) ? mat : [mat];
                            for (const m of mats) {
                                if (!m) continue;
                                m.transparent = true;
                                m.opacity = 0;
                                m.depthWrite = true;
                                m.depthTest = true;
                                m.needsUpdate = true;
                            }
                        }
                        const bone = child as THREE.Bone;
                        if (bone.isBone) {
                            const key = bone.name.toLowerCase().replace(/[._\s]/g, "");
                            state.bones[key] = { bone, rest: bone.quaternion.clone() };
                        }
                    });

                    const box = new THREE.Box3().setFromObject(obj);
                    const size = new THREE.Vector3();
                    const center = new THREE.Vector3();
                    box.getSize(size);
                    const maxDim = Math.max(size.x, size.y, size.z, 1);
                    const targetH = 520;
                    obj.scale.setScalar(targetH / maxDim);

                    box.setFromObject(obj);
                    box.getCenter(center);
                    obj.position.sub(center);

                    const holder = new THREE.Group();
                    holder.add(obj);
                    state.mannequin = holder;
                    state.baseY = holder.position.y;
                    scene.add(holder);
                } catch (err) {
                    console.error("[hero] mannequin setup failed:", err);
                } finally {
                    resolve();
                }
            },
            undefined,
            (err) => {
                resolve();
                console.error("[hero] mannequin failed to load (expects /public/manniquin/scene.gltf, scene.bin, textures/):", err);
            },
        );
    });
}

const poseEuler = new THREE.Euler();
const poseQuat = new THREE.Quaternion();

export function updateMannequinPose(state: MannequinState, time: number, calm: number, spiralIntro: number, pointerDampedX: number) {
    const { mannequin, bones, baseY } = state;
    if (!mannequin) return;
    const tt = time / 1000;
    const modelRise = Math.pow(1 - spiralIntro, 3) * -60;
    mannequin.position.y = baseY + Math.sin(tt * 0.8) * 7 * calm + modelRise;
    mannequin.rotation.y = Math.sin(tt * 0.35) * 0.25 + pointerDampedX * 0.05;
    mannequin.rotation.z = Math.sin(tt * 0.5) * 0.03;

    const pose = (key: string, x: number, y: number, z: number) => {
        const b = bones[key];
        if (!b) return;
        poseEuler.set(x, y, z);
        b.bone.quaternion.copy(b.rest).multiply(poseQuat.setFromEuler(poseEuler));
    };
    const breath = Math.sin(tt * 1.3);
    pose("torso04", breath * 0.015, Math.sin(tt * 0.5) * 0.08, Math.sin(tt * 0.7) * 0.03);
    pose("chest05", breath * 0.02, Math.sin(tt * 0.5 + 0.6) * 0.06, 0);
    pose("neck06", 0, Math.sin(tt * 0.6 + 1) * 0.2, Math.sin(tt * 0.45) * 0.04);
    pose("head07", Math.sin(tt * 0.9) * 0.04, Math.sin(tt * 0.6 + 1.4) * 0.25, 0);
    const ARM_DROP = 1.05;
    pose("armr08", 0, 0, ARM_DROP + Math.sin(tt * 0.9) * 0.06);
    pose("arml011", 0, 0, -ARM_DROP - Math.sin(tt * 0.9 + 0.4) * 0.06);
    pose("forearmr09", 0, 0, 0.25 + Math.sin(tt * 1.1) * 0.08);
    pose("forearml012", 0, 0, -0.25 - Math.sin(tt * 1.1 + 0.5) * 0.08);
    pose("thighl01", Math.sin(tt * 0.7) * 0.06, 0, 0.04);
    pose("thighr014", Math.sin(tt * 0.7 + Math.PI) * 0.06, 0, -0.04);
}

export function updateMannequinOpacity(state: MannequinState, spiralIntro: number, K: number) {
    const { mannequin } = state;
    if (!mannequin) return;
    const mIntro = (1 - Math.pow(1 - spiralIntro, 3)) * (1 - smooth(0.02, 0.4, K));
    mannequin.visible = mIntro > 0.001;
    mannequin.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.Material | THREE.Material[];
        for (const m of Array.isArray(mat) ? mat : [mat]) {
            if (!m) continue;
            m.transparent = true;
            m.opacity = mIntro;
        }
    });
}

export function disposeMannequin(state: MannequinState) {
    const { mannequin } = state;
    if (!mannequin) return;
    mannequin.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[];
        for (const m of Array.isArray(mat) ? mat : [mat]) m?.dispose?.();
    });
}
