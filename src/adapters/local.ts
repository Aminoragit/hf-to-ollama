import { readdir, stat, lstat } from "node:fs/promises";
import path from "node:path";

import type { HfFileEntry } from "../types.js";
import { CliError } from "../errors.js";
import { t } from "../i18n.js";

async function walkDir(dir: string, fileList: HfFileEntry[], baseDir: string = dir): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // 보안: 심볼릭 링크 판별 (Simlink 악용을 통한 시스템 파일 유출 방지)
    const entryStat = await lstat(fullPath);
    if (entryStat.isSymbolicLink()) {
      continue; // 심볼릭 링크는 무조건 무시
    }

    if (entryStat.isDirectory()) {
      await walkDir(fullPath, fileList, baseDir);
    } else if (entryStat.isFile()) {
      // Construct a relative path like HF does so navigation works the same way
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      fileList.push({
        path: relativePath,
        size: entryStat.size,
        revision: "local",
      });
    }
  }
}

export async function getLocalRepoFiles(dirPath: string): Promise<HfFileEntry[]> {
  const files: HfFileEntry[] = [];
  try {
    const absoluteDirPath = path.resolve(dirPath);
    await walkDir(absoluteDirPath, files);
  } catch (error) {
    throw new CliError(t("err.local_dir_error", { path: dirPath }));
  }

  return files.sort((left, right) => left.path.localeCompare(right.path));
}
