import { fileDownloadInfo, listFiles, listModels } from "@huggingface/hub";

import type { HfFileEntry } from "../types.js";

function buildAccessParams(accessToken?: string): { accessToken?: string } {
  return accessToken ? { accessToken } : {};
}

export async function getRepoFiles(
  repoId: string,
  revision?: string,
  accessToken?: string,
): Promise<HfFileEntry[]> {
  const files: HfFileEntry[] = [];

  for await (const entry of listFiles({
    repo: { type: "model", name: repoId },
    recursive: true,
    revision,
    ...buildAccessParams(accessToken),
  })) {
    if (entry.type !== "file") {
      continue;
    }

    files.push({
      path: entry.path,
      size: entry.size ?? 0,
      revision: revision ?? entry.lastCommit?.id,
    });
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}

export async function getDownloadUrl(
  repoId: string,
  filePath: string,
  revision?: string,
  accessToken?: string,
): Promise<{ url: string; size: number }> {
  const info = await fileDownloadInfo({
    repo: { type: "model", name: repoId },
    path: filePath,
    revision,
    ...buildAccessParams(accessToken),
  });

  if (!info) {
    throw new Error(`파일 정보를 찾을 수 없습니다: ${filePath}`);
  }

  return {
    url: info.url,
    size: info.size,
  };
}

export async function searchModels(
  query: string,
  limit: number = 20,
): Promise<{ id: string; downloads: number; likes: number }[]> {
  const results: { id: string; downloads: number; likes: number }[] = [];
  try {
    for await (const model of listModels({ search: { query, tags: ["gguf"] }, limit })) {
      results.push({
        id: model.name,
        downloads: model.downloads ?? 0,
        likes: model.likes ?? 0,
      });
    }
  } catch (error) {
    // Ignore errors during interactive search typing
  }
  return results.sort((a, b) => b.downloads - a.downloads);
}
