import path from "node:path";

import type { CliOptions, ParameterEntry, HfFileEntry } from "../types.js";
import { importFromHuggingFace, resolveAccessToken } from "./import-hf.js";
import { getDefaultTargetDir } from "../services/paths.js";
import { inputOptionalParameter, inputRepoId, inputSaveDir } from "../ui/prompts.js";
import { getRepoFiles } from "../adapters/hf.js";
import { getLocalRepoFiles } from "../adapters/local.js";
import { error } from "../ui/output.js";

function mergeParameterEntries(entries: Array<ParameterEntry | undefined>): string[] {
  return entries.filter((entry): entry is ParameterEntry => Boolean(entry)).map((entry) => `${entry.key}=${entry.value}`);
}

export async function runInstallCommand(options: CliOptions & { repo?: string }): Promise<void> {
  const accessToken = resolveAccessToken(options.token);
  let repoId = options.repo?.trim();
  let validFiles: HfFileEntry[] = [];

  if (options.local) {
    validFiles = await getLocalRepoFiles(options.local);
    const hasGguf = validFiles.some((f) => f.path.toLowerCase().endsWith(".gguf"));
    if (!hasGguf) {
      error("해당 로컬 경로(하위 경로 포함)에 GGUF 파일이 존재하지 않습니다.");
      process.exit(1);
    }
  } else {
    while (true) {
      if (!repoId) {
        repoId = await inputRepoId();
      }

      try {
        validFiles = await getRepoFiles(repoId, options.revision, accessToken);
        const hasGguf = validFiles.some((f) => f.path.toLowerCase().endsWith(".gguf"));

        if (hasGguf) {
          break;
        } else {
          error("해당 레포지토리(하위 경로 포함)에 GGUF 파일이 존재하지 않습니다. 주소를 다시 입력해주세요.");
          repoId = undefined;
        }
      } catch (err) {
        if (err instanceof Error) {
          error(`저장소 접근 오류: ${err.message}`);
        }
        repoId = undefined;
      }
    }
  }

  const defaultDir = repoId ? getDefaultTargetDir(repoId) : path.join(process.cwd(), ".hf-to-ollama", "local-models");
  const targetDir = options.dir ?? await inputSaveDir(defaultDir);

  const temperature = await inputOptionalParameter("temperature", "1.0");
  const topP = await inputOptionalParameter("top_p");
  const topK = await inputOptionalParameter("top_k");
  const numCtx = await inputOptionalParameter("num_ctx");

  const parameterEntries = mergeParameterEntries([
    temperature ? { key: "temperature", value: temperature } : undefined,
    topP ? { key: "top_p", value: topP } : undefined,
    topK ? { key: "top_k", value: topK } : undefined,
    numCtx ? { key: "num_ctx", value: numCtx } : undefined,
  ]);

  await importFromHuggingFace(repoId ?? "local", {
    ...options,
    dir: targetDir,
    parameter: [...(options.parameter ?? []), ...parameterEntries],
  }, validFiles);
}
