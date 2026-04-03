import path from "node:path";

import type { CliOptions, ParameterEntry, HfFileEntry } from "../types.js";
import { importFromHuggingFace, resolveAccessToken } from "./import-hf.js";
import { getDefaultTargetDir } from "../services/paths.js";
import { inputOptionalParameter, inputRepoId, inputSaveDir, selectInputMode, searchRepoId } from "../ui/prompts.js";
import { getRepoFiles } from "../adapters/hf.js";
import { getLocalRepoFiles } from "../adapters/local.js";
import { error } from "../ui/output.js";
import { CliError } from "../errors.js";

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
    let attemptCount = 0;
    const MAX_ATTEMPTS = 5;

    while (true) {
      try {
        if (!repoId) {
          if (attemptCount >= MAX_ATTEMPTS) {
            throw new CliError("보안 오류: 지정된 횟수만큼 잘못된 레포지토리가 입력되어 프로세스를 강제 종료합니다. (HF 서버 보호)");
          }
          if (options.nonInteractive) {
            throw new CliError("비대화식(--non-interactive) 모드에서는 정확한 --repo 값을 전달해야 합니다.");
          }
          const inputMode = await selectInputMode();
          if (inputMode === "search") {
            repoId = await searchRepoId();
          } else {
            repoId = await inputRepoId();
          }
        }

        validFiles = await getRepoFiles(repoId, options.revision, accessToken);
        const hasGguf = validFiles.some((f) => f.path.toLowerCase().endsWith(".gguf"));

        if (hasGguf) {
          break;
        } else {
          error("해당 레포지토리(하위 경로 포함)에 GGUF 파일이 존재하지 않습니다. 주소를 다시 입력해주세요.");
          repoId = undefined;
          attemptCount++;
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err instanceof CliError && err.message.includes("강제 종료")) throw err;
          error(`저장소 접근 오류: ${err.message}`);
        }
        repoId = undefined;
        attemptCount++;
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
