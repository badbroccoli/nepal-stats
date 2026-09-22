// MapLibre GL v6 loads its geometry worker from a separate ES-module file
// (maplibre-gl-worker.mjs, which imports maplibre-gl-shared.mjs). Next.js's
// bundler does not emit those files at a fetchable URL, so the worker 404s and
// no vector data is ever parsed. We copy both files into public/maplibre/ and
// point MapLibre at them via setWorkerUrl(). Running this from node_modules at
// build/dev time keeps the copies in lockstep with the installed version.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "maplibre-gl", "dist");
const dest = join(root, "public", "maplibre");

const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

try {
  mkdirSync(dest, { recursive: true });
  for (const f of files) {
    copyFileSync(join(src, f), join(dest, f));
  }
  console.log(`[maplibre] copied worker assets to public/maplibre/`);
} catch (err) {
  console.error("[maplibre] failed to copy worker assets:", err);
  process.exit(1);
}
