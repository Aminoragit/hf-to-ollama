import type { CliOptions, ParameterEntry } from "../types.js";
import { importFromHuggingFace } from "./import-hf.js";
import { getDefaultTargetDir } from "../services/paths.js";
import { inputOptionalParameter, inputRepoId, inputSaveDir } from "../ui/prompts.js";

function mergeParameterEntries(entries: Array<ParameterEntry | undefined>): string[] {
  return entries.filter((entry): entry is ParameterEntry => Boolean(entry)).map((entry) => `${entry.key}=${entry.value}`);
}

export async function runInstallCommand(options: CliOptions & { repo?: string }): Promise<void> {
  const repoId = options.repo?.trim() || await inputRepoId();
  const defaultDir = getDefaultTargetDir(repoId);
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

  await importFromHuggingFace(repoId, {
    ...options,
    dir: targetDir,
    parameter: [...(options.parameter ?? []), ...parameterEntries],
  });
}
