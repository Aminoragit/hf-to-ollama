import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { InstallManifest } from "../types.js";
import { getInstallRootDir } from "./paths.js";

const MANIFEST_NAME = ".hf-to-ollama.json";

export function getManifestPath(targetDir: string): string {
  return path.join(targetDir, MANIFEST_NAME);
}

export async function saveInstallManifest(manifest: InstallManifest): Promise<void> {
  await mkdir(manifest.targetDir, { recursive: true });
  await writeFile(getManifestPath(manifest.targetDir), JSON.stringify(manifest, null, 2), "utf8");
}

async function walkForManifests(currentDir: string, collected: string[]): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      await walkForManifests(fullPath, collected);
      continue;
    }

    if (entry.isFile() && entry.name === MANIFEST_NAME) {
      collected.push(fullPath);
    }
  }
}

export async function loadInstallManifests(): Promise<InstallManifest[]> {
  const rootDir = getInstallRootDir();
  const manifestPaths: string[] = [];

  try {
    await walkForManifests(rootDir, manifestPaths);
  } catch {
    return [];
  }

  const manifests = await Promise.all(
    manifestPaths.map(async (manifestPath) => JSON.parse(await readFile(manifestPath, "utf8")) as InstallManifest),
  );

  return manifests.sort((left, right) => left.modelName.localeCompare(right.modelName));
}

export async function removeInstallDirectory(targetDir: string): Promise<void> {
  await rm(targetDir, { recursive: true, force: true });
}
