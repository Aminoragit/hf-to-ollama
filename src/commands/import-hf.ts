import { access, mkdir, stat } from "node:fs/promises";
import path from "node:path";

import type { CliOptions, HfFileEntry, ParameterEntry } from "../types.js";
import { createModel, ensureOllamaServer, resolveOllamaCommand } from "../adapters/ollama.js";
import { CliError } from "../errors.js";
import { t } from "../i18n.js";
import { downloadGgufFile } from "../services/download.js";
import { saveInstallManifest } from "../services/manifest.js";
import { writeModelfile } from "../services/modelfile.js";
import { formatBytes, info, success, warn } from "../ui/output.js";

export function resolveAccessToken(cliToken?: string): string | undefined {
  return cliToken ?? process.env.HF_TOKEN ?? process.env.HUGGING_FACE_HUB_TOKEN;
}

export function buildDefaultModelName(repoId: string, filePath: string, isLocal = false): string {
  const sanitizeSegment = (s: string) => s.replace(/[^a-zA-Z0-9.-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (isLocal) {
    const filePart = path.basename(filePath, path.extname(filePath)).split(".")[0] || "model";
    return `local-${sanitizeSegment(filePart)}`;
  }
  const repoPart = repoId.split("/").map(sanitizeSegment).join("-");
  const filePart = path.basename(filePath, path.extname(filePath)).split(".")[0] || "model";
  return `${repoPart}-${sanitizeSegment(filePart)}`;
}

export function parseParameterEntries(rawParameters: string[] | undefined): ParameterEntry[] {
  if (!rawParameters || rawParameters.length === 0) {
    return [];
  }

  return rawParameters.map((entry) => {
    const separatorIndex = entry.indexOf("=");
    if (separatorIndex <= 0 || separatorIndex === entry.length - 1) {
      throw new CliError(t("err.parameter_format", { entry }));
    }

    const key = entry.slice(0, separatorIndex).trim();
    const value = entry.slice(separatorIndex + 1).trim();

    if (!key || !value) {
      throw new CliError(t("err.parameter_format", { entry }));
    }

    if (/\s/.test(key)) {
      throw new CliError(t("err.parameter_key_space", { key }));
    }

    return { key, value };
  });
}

export async function ensureSafeWrite(pathLabel: string, nonInteractive: boolean, yes = false): Promise<void> {
  // Note: confirmOverwrite is an interactive prompt, so the caller should handle it if needed
  // In pure execution mode, we might just check and throw or proceed if 'yes' is true.
  try {
    await access(pathLabel);
    if (!yes && nonInteractive) {
       throw new CliError(t("err.path_conflict", { path: pathLabel }));
    }
    // Caller should have confirmed overwrite before calling this in interactive mode
  } catch {
    return;
  }
}

export interface ImportGgufOptions {
  repoId: string;
  selectedFile: HfFileEntry;
  selectedAdapterFile?: HfFileEntry;
  targetDir: string;
  modelName: string;
  parameters: ParameterEntry[];
  isLocalMode?: boolean;
  revision?: string;
  accessToken?: string;
  dryRun?: boolean;
  nonInteractive?: boolean;
  yes?: boolean;
}

export async function executeGgufImport(options: ImportGgufOptions) {
  const {
    repoId,
    selectedFile,
    selectedAdapterFile,
    targetDir,
    modelName,
    parameters,
    isLocalMode,
    revision,
    accessToken,
    dryRun,
    nonInteractive,
    yes
  } = options;

  await mkdir(targetDir, { recursive: true });

  const ggufPath = path.join(targetDir, path.basename(selectedFile.path));
  await ensureSafeWrite(ggufPath, Boolean(nonInteractive), yes);

  const adapterPath = selectedAdapterFile ? path.join(targetDir, path.basename(selectedAdapterFile.path)) : undefined;
  if (adapterPath) {
    await ensureSafeWrite(adapterPath, Boolean(nonInteractive), yes);
  }

  if (dryRun) {
    const adapterMessage = selectedAdapterFile ? `, adapter=${selectedAdapterFile.path}` : "";
    const parameterMessage = parameters.length > 0 ? `, parameters=${parameters.map((entry) => `${entry.key}=${entry.value}`).join(",")}` : "";
    success(t("success.dry_run", { file: selectedFile.path, extra: `${adapterMessage}${parameterMessage}`, out: ggufPath, model: modelName }));
    return;
  }

  const ollamaCommand = await resolveOllamaCommand();
  await ensureOllamaServer();
  info(t("info.ollama_command", { cmd: ollamaCommand }));

  let ggufFilename: string;
  let adapterFilename: string | undefined;

  if (isLocalMode) {
    ggufFilename = selectedFile.path;
    if (selectedAdapterFile) {
      adapterFilename = selectedAdapterFile.path;
    }
  } else {
    info(t("info.download_model_start"));
    const downloadResult = await downloadGgufFile({ repoId, file: selectedFile, revision, accessToken, targetDir });
    ggufFilename = path.basename(downloadResult.filePath);
    if (downloadResult.alreadyExists) {
      success(t("success.already_downloaded", { path: downloadResult.filePath, size: formatBytes(downloadResult.bytesWritten) }));
    } else {
      success(t("success.download_complete", { path: downloadResult.filePath, size: formatBytes(downloadResult.bytesWritten) }));
    }

    if (selectedAdapterFile) {
      info(t("info.download_adapter_start"));
      const adapterDownloadResult = await downloadGgufFile({ repoId, file: selectedAdapterFile, revision, accessToken, targetDir });
      adapterFilename = path.basename(adapterDownloadResult.filePath);
      
      if (adapterDownloadResult.alreadyExists) {
        success(t("success.already_downloaded", { path: adapterDownloadResult.filePath, size: formatBytes(adapterDownloadResult.bytesWritten) }));
      } else {
        success(t("success.adapter_download_complete", { path: adapterDownloadResult.filePath, size: formatBytes(adapterDownloadResult.bytesWritten) }));
      }
    }
  }

  const modelfilePath = await writeModelfile(targetDir, {
    ggufFilename,
    adapterFilename,
    parameters: parameters,
  });
  info(t("info.modelfile_created", { path: modelfilePath }));
  info(t("info.model_create_start"));

  if (!isLocalMode) {
    try {
      const stats = await stat(path.join(targetDir, ggufFilename));
      if (stats.size === 0) {
        throw new CliError(t("err.zero_size"));
      }
    } catch (error) {
      if (error instanceof CliError) throw error;
      warn(t("warn.file_check_failed"));
    }
  }

  await createModel({ modelName, modelfilePath, cwd: targetDir });

  await saveInstallManifest({
    modelName,
    repoId,
    targetDir,
    ggufFilename,
    adapterFilename,
    parameters: parameters,
    createdAt: new Date().toISOString(),
  });

  success(t("success.model_created", { model: modelName }));
  info(t("info.run_command", { model: modelName }));
}
