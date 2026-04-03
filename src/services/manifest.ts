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

  const manifests = (await Promise.all(
    manifestPaths.map(async (manifestPath) => {
      try {
        const raw = JSON.parse(await readFile(manifestPath, "utf8"));
        
        // 보안/안전: 런타임 타입 검증 (기본 필수 필드만 확인)
        if (!raw || typeof raw !== "object") return null;
        if (typeof raw.modelName !== "string" || typeof raw.repoId !== "string" || typeof raw.targetDir !== "string" || typeof raw.ggufFilename !== "string") {
          return null;
        }

        return raw as InstallManifest;
      } catch {
        return null; // 파싱 실패나 무효한 매니페스트 무시
      }
    })
  )).filter((m): m is InstallManifest => m !== null);

  return manifests.sort((left, right) => left.modelName.localeCompare(right.modelName));
}

export async function removeInstallDirectory(targetDir: string): Promise<void> {
  await rm(targetDir, { recursive: true, force: true });
}
