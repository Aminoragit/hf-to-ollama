import { confirm, input, select } from "@inquirer/prompts";

import { t } from "../i18n.js";
import type { HfFileEntry, InstallManifest } from "../types.js";
import { formatBytes } from "./output.js";
import { searchModels } from "../adapters/hf.js";
import patchedSearch from "./patched-search.js";

export async function selectInputMode(): Promise<"direct" | "search"> {
  return select<"direct" | "search">({
    message: t("prompt.select_input_mode"),
    choices: [
      { name: t("choice.input_direct"), value: "direct" },
      { name: t("choice.input_search"), value: "search" },
    ],
  });
}

export async function inputRepoId(): Promise<string> {
  return input({
    message: t("prompt.repo"),
    validate(value: string) {
      return value.trim().length > 0 ? true : t("prompt.repo.required");
    },
  });
}

export async function searchRepoId(): Promise<string> {
  return patchedSearch<string>({
    message: t("prompt.search_query"),
    source: async (term: string | undefined, opt: any) => {
      if (!term || term.trim().length === 0) {
        return [];
      }

      // 보안/과부하 방지 (Debounce): 사용자가 빠르게 타이핑할 때마다 HF API가
      // 폭주하는 것을 막기 위해 300ms 지연 대기. 도중에 새 키 입력이 들어오면
      // AbortSignal이 발생하여 이전 요청은 API 통신 전에 취소됨.
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, 300);
        opt.signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new Error("aborted"));
        });
      });
      
      const models = await searchModels(term, 15);
      
      return models.map((model) => ({
        name: `${model.id} (⬇ ${model.downloads})`,
        value: model.id,
        description: `Likes: ${model.likes} | Downloads: ${model.downloads}`,
      }));
    },
  });
}

export async function inputSaveDir(defaultValue: string): Promise<string> {
  return input({
    message: t("prompt.save_dir"),
    default: defaultValue,
    validate(value: string) {
      return value.trim().length > 0 ? true : t("prompt.save_dir.required");
    },
  });
}

export async function inputOptionalParameter(label: string, defaultValue = ""): Promise<string | undefined> {
  const value = await input({
    message: t("prompt.param_input", { label }),
    default: defaultValue,
  });

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export { navigateAndSelectFile } from "./navigation.js";



export async function inputModelName(defaultValue: string): Promise<string> {
  return input({
    message: t("prompt.model_name"),
    default: defaultValue,
    validate(value: string) {
      return value.trim().length > 0 ? true : t("prompt.model_name.required");
    },
  });
}

export async function confirmOverwrite(pathLabel: string): Promise<boolean> {
  return confirm({
    message: t("prompt.overwrite", { pathLabel }),
    default: false,
  });
}

export async function confirmUseAdapter(): Promise<boolean> {
  return confirm({
    message: t("prompt.use_adapter"),
    default: false,
  });
}

export async function selectManifest(manifests: InstallManifest[]): Promise<InstallManifest> {
  return select<InstallManifest>({
    message: t("prompt.select_manifest"),
    choices: manifests.map((manifest) => ({
      name: manifest.modelName,
      value: manifest,
      description: `${manifest.repoId} -> ${manifest.targetDir}`,
    })),
    pageSize: 15,
  });
}

export async function selectConfigAction(): Promise<"show" | "update" | "delete"> {
  return select<"show" | "update" | "delete">({
    message: t("prompt.select_action"),
    choices: [
      { name: t("choice.show"), value: "show" },
      { name: t("choice.update"), value: "update" },
      { name: t("choice.delete"), value: "delete" },
    ],
  });
}

export async function selectAdapterAction(currentAdapter?: string): Promise<"keep" | "remove" | "change"> {
  const choices: { name: string; value: "keep" | "remove" | "change" }[] = [
    { name: t("choice.keep_adapter", { current: currentAdapter ?? "None" }), value: "keep" },
  ];

  if (currentAdapter) {
    choices.push({ name: t("choice.remove_adapter"), value: "remove" });
  }

  choices.push({ name: t("choice.change_adapter"), value: "change" });

  return select<"keep" | "remove" | "change">({
    message: t("prompt.adapter_action"),
    choices,
  });
}

export async function confirmDeleteLocalFiles(): Promise<boolean> {
  return confirm({
    message: t("prompt.delete_local"),
    default: false,
  });
}
