import { confirm, input, select } from "@inquirer/prompts";

import { t } from "../i18n.js";
import type { HfFileEntry, InstallManifest } from "../types.js";
import { formatBytes } from "./output.js";

export async function inputRepoId(): Promise<string> {
  return input({
    message: t("prompt.repo"),
    validate(value: string) {
      return value.trim().length > 0 ? true : t("prompt.repo.required");
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

export async function selectGgufFile(files: HfFileEntry[], message = t("prompt.model_file")): Promise<HfFileEntry> {
  return select<HfFileEntry>({
    message,
    choices: files.map((file) => ({
      name: `${file.path} (${formatBytes(file.size)})`,
      value: file,
      description: file.revision ? `revision: ${file.revision}` : undefined,
    })),
    pageSize: 15,
  });
}

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

export async function confirmDeleteLocalFiles(): Promise<boolean> {
  return confirm({
    message: t("prompt.delete_local"),
    default: false,
  });
}
