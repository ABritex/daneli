// runs cb once the page loader is done (or right away if there is no loader state)
export function onLoaderReady(cb: () => void): () => void {
    const root = document.documentElement;
    const ready = () => {
        const s = root.dataset.loader;
        return !s || s === "done" || s === "skip";
    };

    let fired = false;
    const fire = () => {
        if (fired || !ready()) return;
        fired = true;
        mo.disconnect();
        window.removeEventListener("daneli-loader-done", fire);
        cb();
    };

    const mo = new MutationObserver(fire);
    mo.observe(root, { attributes: true, attributeFilter: ["data-loader"] });
    window.addEventListener("daneli-loader-done", fire);
    fire();

    return () => {
        fired = true;
        mo.disconnect();
        window.removeEventListener("daneli-loader-done", fire);
    };
}
