import os from "node:os";
import path from "node:path";

export function sanitizeSegment(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function getInstallRootDir(): string {
  return path.join(os.homedir(), ".ollama-hf-import");
}

export function getDefaultTargetDir(repoId: string): string {
  return path.join(getInstallRootDir(), sanitizeSegment(repoId));
}
